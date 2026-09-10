import { getCategoryGroups } from "@/lib/category-groups";
import { authorizeAdminRequest } from "@/lib/auth/api-authorization";
import { getDb } from "@/lib/db";
import { categoryGroupSchema } from "@/lib/validations/admin-options.schema";

export async function GET() {
  const groups = await getCategoryGroups(true);
  return Response.json({ ok: true, groups });
}

export async function POST(request: Request) {
  const authorization = await authorizeAdminRequest();
  if ("response" in authorization) return authorization.response;

  const parsed = categoryGroupSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
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
        parsed.data.name,
        parsed.data.slug,
        parsed.data.description || null,
        parsed.data.image_url || null,
        parsed.data.sort_order ?? 0,
        parsed.data.is_active ?? true,
      ],
    );

    for (const productId of new Set(parsed.data.product_ids ?? [])) {
      await client.query(
        "insert into category_group_products (group_id, product_id) values ($1, $2) on conflict do nothing",
        [rows[0].id, productId],
      );
    }

    await client.query("commit");
    return Response.json({ ok: true, group: rows[0] }, { status: 201 });
  } catch (error) {
    await client.query("rollback");
    console.error("Error al crear agrupador", error);
    return Response.json({ ok: false, error: "No se pudo crear el agrupador" }, { status: 500 });
  } finally {
    client.release();
  }
}
