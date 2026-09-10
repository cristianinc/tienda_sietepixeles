import { authorizeAdminRequest } from "@/lib/auth/api-authorization";
import { getDb } from "@/lib/db";
import { categoryGroupSchema } from "@/lib/validations/admin-options.schema";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeAdminRequest();
  if ("response" in authorization) return authorization.response;

  const { id } = await params;
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
        update category_groups
        set name = $1, slug = $2, description = $3, image_url = $4, sort_order = $5, is_active = $6
        where id = $7
        returning *
      `,
      [
        parsed.data.name,
        parsed.data.slug,
        parsed.data.description || null,
        parsed.data.image_url || null,
        parsed.data.sort_order ?? 0,
        parsed.data.is_active ?? true,
        id,
      ],
    );

    if (!rows[0]) {
      await client.query("rollback");
      return Response.json({ ok: false, error: "Agrupador no encontrado" }, { status: 404 });
    }

    await client.query("delete from category_group_products where group_id = $1", [id]);
    for (const productId of new Set(parsed.data.product_ids ?? [])) {
      await client.query(
        "insert into category_group_products (group_id, product_id) values ($1, $2) on conflict do nothing",
        [id, productId],
      );
    }

    await client.query("commit");
    return Response.json({ ok: true, group: rows[0] });
  } catch (error) {
    await client.query("rollback");
    console.error("Error al actualizar agrupador", error);
    return Response.json({ ok: false, error: "No se pudo actualizar el agrupador" }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeAdminRequest();
  if ("response" in authorization) return authorization.response;

  const { id } = await params;
  const db = getDb();
  const { rows } = await db.query("delete from category_groups where id = $1 returning id", [id]);

  if (!rows[0]) return Response.json({ ok: false, error: "Agrupador no encontrado" }, { status: 404 });

  return Response.json({ ok: true, deletedId: rows[0].id });
}
