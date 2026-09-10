import { authorizeAdminRequest } from "@/lib/auth/api-authorization";
import { getDb } from "@/lib/db";
import { productSchema } from "@/lib/validations/product.schema";

export async function GET() {
  const db = getDb();
  const { rows } = await db.query(
    `
      select
        p.id,
        p.category_id,
        c.name as category_name,
        c.slug as category_slug,
        c.sort_order as category_sort_order,
        p.name,
        p.slug,
        p.description,
        p.price,
        p.discount_price,
        p.is_active,
        p.is_featured,
        p.image_url,
        coalesce(
          json_agg(
            json_build_object(
              'id', v.id,
              'size', v.size,
              'color', v.color,
              'stock', v.stock,
              'sku', v.sku
            )
          ) filter (where v.id is not null),
          '[]'::json
        ) as variants
      from products p
      left join categories c on c.id = p.category_id
      left join product_variants v on v.product_id = p.id
      group by p.id, c.id
      order by c.sort_order asc nulls last, c.name asc nulls last, p.created_at desc
    `,
  );

  return Response.json({ ok: true, products: rows });
}

export async function POST(request: Request) {
  const authorization = await authorizeAdminRequest();
  if ("response" in authorization) return authorization.response;

  const body = await request.json();
  const parsed = productSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const client = await db.connect();

  try {
    await client.query("begin");
    const productInsert = await client.query(
      `
        insert into products (category_id, name, slug, description, price, discount_price, is_active, is_featured, image_url)
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        returning *
      `,
      [
        parsed.data.category_id,
        parsed.data.name,
        parsed.data.slug,
        parsed.data.description,
        parsed.data.price,
        parsed.data.discount_price ?? null,
        parsed.data.is_active ?? true,
        parsed.data.is_featured ?? false,
        parsed.data.image_url ?? null,
      ],
    );

    const product = productInsert.rows[0];
    for (const variant of parsed.data.variants) {
      await client.query(
        `
          insert into product_variants (product_id, size, color, stock, sku)
          values ($1, $2, $3, $4, $5)
        `,
        [product.id, variant.size, variant.color, variant.stock, variant.sku],
      );
    }

    await client.query("commit");
    return Response.json({ ok: true, product }, { status: 201 });
  } catch (error) {
    await client.query("rollback");
    console.error("Error al crear producto", error);
    return Response.json({ ok: false, error: "No se pudo crear el producto" }, { status: 500 });
  } finally {
    client.release();
  }
}
