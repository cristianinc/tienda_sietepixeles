import { authorizeAdminRequest } from "@/lib/auth/api-authorization";
import { getDb } from "@/lib/db";
import { optionSchema } from "@/lib/validations/admin-options.schema";

export async function GET() {
  const db = getDb();
  const { rows } = await db.query("select * from product_colors order by name asc");

  return Response.json({ ok: true, colors: rows });
}

export async function POST(request: Request) {
  const authorization = await authorizeAdminRequest();
  if ("response" in authorization) return authorization.response;

  const parsed = optionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const { rows } = await db.query(
    "insert into product_colors (name, hex, is_active) values ($1, $2, $3) returning *",
    [parsed.data.name, parsed.data.hex || null, parsed.data.is_active ?? true],
  );

  return Response.json({ ok: true, color: rows[0] }, { status: 201 });
}
