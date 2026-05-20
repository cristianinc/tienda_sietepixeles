import { ensureProductOptionTables } from "@/lib/admin-options";
import { getDb } from "@/lib/db";

export async function GET() {
  await ensureProductOptionTables();
  const db = getDb();
  const { rows } = await db.query("select * from product_colors order by name asc");

  return Response.json({ ok: true, colors: rows });
}

export async function POST(request: Request) {
  await ensureProductOptionTables();
  const body = (await request.json()) as { name?: string; hex?: string; is_active?: boolean };
  const name = body.name?.trim();

  if (!name) {
    return Response.json({ ok: false, error: "El color es obligatorio" }, { status: 400 });
  }

  const db = getDb();
  const { rows } = await db.query(
    "insert into product_colors (name, hex, is_active) values ($1, $2, $3) returning *",
    [name, body.hex?.trim() || null, body.is_active ?? true],
  );

  return Response.json({ ok: true, color: rows[0] }, { status: 201 });
}
