import { ensureProductOptionTables } from "@/lib/admin-options";
import { getDb } from "@/lib/db";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureProductOptionTables();
  const { id } = await params;
  const body = (await request.json()) as { name?: string; sort_order?: number; is_active?: boolean };
  const name = body.name?.trim();

  if (!name) {
    return Response.json({ ok: false, error: "La talla es obligatoria" }, { status: 400 });
  }

  const db = getDb();
  const { rows } = await db.query(
    "update product_sizes set name = $1, sort_order = $2, is_active = $3 where id = $4 returning *",
    [name, Number(body.sort_order ?? 0), body.is_active ?? true, id],
  );

  if (!rows[0]) return Response.json({ ok: false, error: "Talla no encontrada" }, { status: 404 });

  return Response.json({ ok: true, size: rows[0] });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureProductOptionTables();
  const { id } = await params;
  const db = getDb();
  const { rows } = await db.query("delete from product_sizes where id = $1 returning id", [id]);

  if (!rows[0]) return Response.json({ ok: false, error: "Talla no encontrada" }, { status: 404 });

  return Response.json({ ok: true, deletedId: rows[0].id });
}
