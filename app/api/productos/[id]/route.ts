import { authorizeAdminRequest } from "@/lib/auth/api-authorization";
import { getDb } from "@/lib/db";
import { updateProductSchema } from "@/lib/validations/product.schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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
      where p.id = $1
      group by p.id, c.id
    `,
    [id],
  );

  if (!rows[0]) {
    return Response.json({ ok: false, error: "Producto no encontrado" }, { status: 404 });
  }

  return Response.json({ ok: true, product: rows[0] });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeAdminRequest();
  if ("response" in authorization) return authorization.response;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateProductSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const client = await db.connect();

  try {
    await client.query("begin");

    const fields = Object.keys(parsed.data).filter((key) => key !== "variants");
    let productResult;

    if (fields.length > 0) {
      const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(", ");
      const values = fields.map((field) => parsed.data[field as keyof typeof parsed.data]);
      productResult = await client.query(
        `update products set ${setClause}, updated_at = now() where id = $${fields.length + 1} returning *`,
        [...values, id],
      );
    } else {
      productResult = await client.query("select * from products where id = $1", [id]);
    }

    if (!productResult.rows[0]) {
      await client.query("rollback");
      return Response.json({ ok: false, error: "Producto no encontrado" }, { status: 404 });
    }

    if (parsed.data.variants) {
      await client.query("delete from product_variants where product_id = $1", [id]);
      for (const variant of parsed.data.variants) {
        await client.query(
          `
            insert into product_variants (product_id, size, color, stock, sku)
            values ($1, $2, $3, $4, $5)
          `,
          [id, variant.size, variant.color, variant.stock, variant.sku],
        );
      }
    }

    await client.query("commit");
    return Response.json({ ok: true, product: productResult.rows[0] });
  } catch (error) {
    await client.query("rollback");
    console.error("Error al actualizar producto", error);
    return Response.json({ ok: false, error: "No se pudo actualizar el producto" }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeAdminRequest();
  if ("response" in authorization) return authorization.response;

  const { id } = await params;
  const db = getDb();
  const result = await db.query("delete from products where id = $1 returning id", [id]);

  if (!result.rows[0]) {
    return Response.json({ ok: false, error: "Producto no encontrado" }, { status: 404 });
  }

  return Response.json({ ok: true, deletedId: result.rows[0].id });
}
