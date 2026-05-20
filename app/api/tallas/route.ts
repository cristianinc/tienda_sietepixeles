import { ensureProductOptionTables } from "@/lib/admin-options";
import { getDb } from "@/lib/db";

export async function GET() {
  await ensureProductOptionTables();
  const db = getDb();
  const { rows } = await db.query("select * from product_sizes order by sort_order asc, name asc");

  return Response.json({ ok: true, sizes: rows });
}

export async function POST(request: Request) {
  await ensureProductOptionTables();
  const body = (await request.json()) as { name?: string; sort_order?: number; is_active?: boolean };
  const name = body.name?.trim();

  if (!name) {
    return Response.json({ ok: false, error: "La talla es obligatoria" }, { status: 400 });
  }

  const db = getDb();
  const { rows } = await db.query(
    "insert into product_sizes (name, sort_order, is_active) values ($1, $2, $3) returning *",
    [name, Number(body.sort_order ?? 0), body.is_active ?? true],
  );

  return Response.json({ ok: true, size: rows[0] }, { status: 201 });
}
