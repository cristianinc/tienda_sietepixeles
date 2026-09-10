import { authorizeAdminRequest } from "@/lib/auth/api-authorization";
import { getDb } from "@/lib/db";
import { optionSchema } from "@/lib/validations/admin-options.schema";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeAdminRequest();
  if ("response" in authorization) return authorization.response;

  const { id } = await params;
  const parsed = optionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const { rows } = await db.query(
    "update product_sizes set name = $1, sort_order = $2, is_active = $3 where id = $4 returning *",
    [parsed.data.name, parsed.data.sort_order ?? 0, parsed.data.is_active ?? true, id],
  );

  if (!rows[0]) return Response.json({ ok: false, error: "Talla no encontrada" }, { status: 404 });

  return Response.json({ ok: true, size: rows[0] });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeAdminRequest();
  if ("response" in authorization) return authorization.response;

  const { id } = await params;
  const db = getDb();
  const { rows } = await db.query("delete from product_sizes where id = $1 returning id", [id]);

  if (!rows[0]) return Response.json({ ok: false, error: "Talla no encontrada" }, { status: 404 });

  return Response.json({ ok: true, deletedId: rows[0].id });
}
