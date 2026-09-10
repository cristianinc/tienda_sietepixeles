import { authorizeAdminRequest } from "@/lib/auth/api-authorization";
import { getDb } from "@/lib/db";
import { categorySchema } from "@/lib/validations/admin-options.schema";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeAdminRequest();
  if ("response" in authorization) return authorization.response;

  const { id } = await params;
  const parsed = categorySchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const { rows } = await db.query(
    "update categories set name = $1, slug = $2, image_url = $3, sort_order = $4, is_active = $5 where id = $6 returning *",
    [
      parsed.data.name,
      parsed.data.slug,
      parsed.data.image_url || null,
      parsed.data.sort_order ?? 0,
      parsed.data.is_active ?? true,
      id,
    ],
  );

  if (!rows[0]) return Response.json({ ok: false, error: "Categoria no encontrada" }, { status: 404 });

  return Response.json({ ok: true, category: rows[0] });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeAdminRequest();
  if ("response" in authorization) return authorization.response;

  const { id } = await params;
  const db = getDb();
  const { rows } = await db.query("delete from categories where id = $1 returning id", [id]);

  if (!rows[0]) return Response.json({ ok: false, error: "Categoria no encontrada" }, { status: 404 });

  return Response.json({ ok: true, deletedId: rows[0].id });
}
