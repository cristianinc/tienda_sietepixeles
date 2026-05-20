import { getCategoryGroups } from "@/lib/category-groups";
import { ensureProductOptionTables } from "@/lib/admin-options";
import { getDb } from "@/lib/db";

type GroupBody = {
  name?: string;
  slug?: string;
  description?: string;
  image_url?: string;
  sort_order?: number;
  is_active?: boolean;
  product_ids?: number[];
};

export async function GET() {
  const groups = await getCategoryGroups(true);
  return Response.json({ ok: true, groups });
}

export async function POST(request: Request) {
  await ensureProductOptionTables();
  const body = (await request.json()) as GroupBody;
  const name = body.name?.trim();
  const slug = body.slug?.trim();

  if (!name || !slug) {
    return Response.json({ ok: false, error: "Nombre y slug son obligatorios" }, { status: 400 });
  }

  const db = getDb();
  const client = await db.connect();

  try {
    await client.query("begin");
    const { rows } = await client.query(
      `
        insert into category_groups (name, slug, description, image_url, sort_order, is_active)
        values ($1, $2, $3, $4, $5, $6)
        returning *
      `,
      [
        name,
        slug,
        body.description?.trim() || null,
        body.image_url?.trim() || null,
        Number(body.sort_order ?? 0),
        body.is_active ?? true,
      ],
    );

    for (const productId of body.product_ids ?? []) {
      await client.query(
        "insert into category_group_products (group_id, product_id) values ($1, $2) on conflict do nothing",
        [rows[0].id, productId],
      );
    }

    await client.query("commit");
    return Response.json({ ok: true, group: rows[0] }, { status: 201 });
  } catch (error) {
    await client.query("rollback");
    const message = error instanceof Error ? error.message : "No se pudo crear el agrupador";
    return Response.json({ ok: false, error: message }, { status: 500 });
  } finally {
    client.release();
  }
}
