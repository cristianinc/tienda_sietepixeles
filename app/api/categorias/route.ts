import { ensureProductOptionTables } from "@/lib/admin-options";
import { getDb } from "@/lib/db";

export async function GET() {
  await ensureProductOptionTables();
  const db = getDb();
  const { rows } = await db.query("select * from categories order by sort_order asc, name asc");

  return Response.json({ ok: true, categories: rows });
}

export async function POST(request: Request) {
  await ensureProductOptionTables();
  const body = (await request.json()) as {
    name?: string;
    slug?: string;
    image_url?: string;
    sort_order?: number;
    is_active?: boolean;
  };
  const name = body.name?.trim();
  const slug = body.slug?.trim();

  if (!name || !slug) {
    return Response.json({ ok: false, error: "Nombre y slug son obligatorios" }, { status: 400 });
  }

  const db = getDb();
  const { rows } = await db.query(
    "insert into categories (name, slug, image_url, sort_order, is_active) values ($1, $2, $3, $4, $5) returning *",
    [name, slug, body.image_url?.trim() || null, Number(body.sort_order ?? 0), body.is_active ?? true],
  );

  return Response.json({ ok: true, category: rows[0] }, { status: 201 });
}
