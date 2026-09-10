import { authorizeAdminRequest } from "@/lib/auth/api-authorization";
import { getDb } from "@/lib/db";
import { categorySchema } from "@/lib/validations/admin-options.schema";

export async function GET() {
  const db = getDb();
  const { rows } = await db.query("select * from categories order by sort_order asc, name asc");

  return Response.json({ ok: true, categories: rows });
}

export async function POST(request: Request) {
  const authorization = await authorizeAdminRequest();
  if ("response" in authorization) return authorization.response;

  const parsed = categorySchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const { rows } = await db.query(
    "insert into categories (name, slug, image_url, sort_order, is_active) values ($1, $2, $3, $4, $5) returning *",
    [
      parsed.data.name,
      parsed.data.slug,
      parsed.data.image_url || null,
      parsed.data.sort_order ?? 0,
      parsed.data.is_active ?? true,
    ],
  );

  return Response.json({ ok: true, category: rows[0] }, { status: 201 });
}
