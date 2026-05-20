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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureProductOptionTables();
  const { id } = await params;
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
        update category_groups
        set name = $1, slug = $2, description = $3, image_url = $4, sort_order = $5, is_active = $6
        where id = $7
        returning *
      `,
      [
        name,
        slug,
        body.description?.trim() || null,
        body.image_url?.trim() || null,
        Number(body.sort_order ?? 0),
        body.is_active ?? true,
        id,
      ],
    );

    if (!rows[0]) {
      await client.query("rollback");
      return Response.json({ ok: false, error: "Agrupador no encontrado" }, { status: 404 });
    }

    await client.query("delete from category_group_products where group_id = $1", [id]);
    for (const productId of body.product_ids ?? []) {
      await client.query(
        "insert into category_group_products (group_id, product_id) values ($1, $2) on conflict do nothing",
        [id, productId],
      );
    }

    await client.query("commit");
    return Response.json({ ok: true, group: rows[0] });
  } catch (error) {
    await client.query("rollback");
    const message = error instanceof Error ? error.message : "No se pudo actualizar el agrupador";
    return Response.json({ ok: false, error: message }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureProductOptionTables();
  const { id } = await params;
  const db = getDb();
  const { rows } = await db.query("delete from category_groups where id = $1 returning id", [id]);

  if (!rows[0]) return Response.json({ ok: false, error: "Agrupador no encontrado" }, { status: 404 });

  return Response.json({ ok: true, deletedId: rows[0].id });
}
