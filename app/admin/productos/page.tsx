import { ProductsManager } from "@/components/admin/ProductsManager";
import { ensureProductOptionTables } from "@/lib/admin-options";
import { getDb } from "@/lib/db";
import type { CatalogProduct } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await ensureProductOptionTables();
  const db = getDb();
  const [productsResult, sizesResult, colorsResult, categoriesResult] = await Promise.all([
    db.query(`
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
    `),
    db.query("select id, name, is_active from product_sizes where is_active = true order by sort_order asc, name asc"),
    db.query("select id, name, is_active from product_colors where is_active = true order by name asc"),
    db.query("select id, name, is_active from categories where is_active = true order by sort_order asc, name asc"),
  ]);

  return (
    <section className="space-y-6">
      <h1 className="font-serif text-4xl">Productos</h1>
      <ProductsManager
        initialProducts={productsResult.rows as CatalogProduct[]}
        initialSizes={sizesResult.rows}
        initialColors={colorsResult.rows}
        initialCategories={categoriesResult.rows}
      />
    </section>
  );
}
