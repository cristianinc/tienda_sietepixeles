import { getDb } from "@/lib/db";
import { ensureProductOptionTables } from "@/lib/admin-options";

export type CatalogVariant = {
  id: number;
  size: string;
  color: string;
  stock: number;
  sku: string;
};

export type CatalogProduct = {
  id: number;
  category_id: number | null;
  category_name: string | null;
  category_slug: string | null;
  category_sort_order: number | null;
  name: string;
  slug: string;
  description: string;
  price: number;
  discount_price: number | null;
  is_active: boolean;
  is_featured: boolean;
  image_url: string | null;
  variants: CatalogVariant[];
};

export async function getCatalogProducts(limit?: number) {
  await ensureProductOptionTables();
  const safeLimit = limit && limit > 0 ? Math.floor(limit) : undefined;
  const db = getDb();
  const query = `
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
    where p.is_active = true
    group by p.id, c.id
    order by c.sort_order asc nulls last, c.name asc nulls last, p.created_at desc
    ${safeLimit ? "limit $1" : ""}
  `;

  try {
    const result = safeLimit ? await db.query(query, [safeLimit]) : await db.query(query);
    return result.rows as CatalogProduct[];
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    throw new Error(`Error en getCatalogProducts: ${message}`);
  }
}

export async function getProductBySlug(slug: string) {
  await ensureProductOptionTables();
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
      where p.slug = $1 and p.is_active = true
      group by p.id, c.id
    `,
    [slug],
  );

  return (rows[0] as CatalogProduct | undefined) ?? null;
}
