import { getDb } from "@/lib/db";
import type { CheckInventoryInput, GetProductDetailsInput, SearchProductsInput } from "@/lib/agent/schemas";

type CatalogRow = {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string | null;
  price: string | number;
  original_price: string | number;
  image_url: string | null;
  variants: Array<{
    id: number;
    size: string;
    color: string;
    sku: string;
    stock: number;
  }>;
};

export type CatalogProductResult = Omit<CatalogRow, "price" | "original_price"> & {
  price: number;
  original_price: number;
};

const productSelection = `
  select
    i.product_id as id, i.product_name as name, i.product_slug as slug,
    p.description, i.category_name as category, i.effective_price as price,
    i.original_price, i.image_url,
    coalesce(
      json_agg(json_build_object(
        'id', i.variant_id, 'size', i.size, 'color', i.color, 'sku', i.sku, 'stock', i.stock
      ) order by i.size, i.color),
      '[]'::json
    ) as variants
  from v_inventario_bot i
  join products p on p.id = i.product_id
`;

function normalizeProduct(row: CatalogRow): CatalogProductResult {
  return {
    ...row,
    price: Number(row.price),
    original_price: Number(row.original_price),
    variants: row.variants.map((variant) => ({ ...variant, stock: Number(variant.stock) })),
  };
}

export async function searchCatalogProducts(input: SearchProductsInput) {
  const values: unknown[] = [];
  const where = ["i.is_active = true"];
  const addValue = (value: unknown) => {
    values.push(value);
    return `$${values.length}`;
  };

  if (input.query) {
    const parameter = addValue(`%${input.query}%`);
    where.push(`(i.product_name ilike ${parameter} or p.description ilike ${parameter})`);
  }
  if (input.category) where.push(`i.category_name ilike ${addValue(input.category)}`);
  if (input.size) where.push(`exists (select 1 from v_inventario_bot vs where vs.product_id = i.product_id and vs.size ilike ${addValue(input.size)})`);
  if (input.color) where.push(`exists (select 1 from v_inventario_bot vc where vc.product_id = i.product_id and vc.color ilike ${addValue(input.color)})`);
  if (input.minPrice !== undefined) where.push(`i.effective_price >= ${addValue(input.minPrice)}`);
  if (input.maxPrice !== undefined) where.push(`i.effective_price <= ${addValue(input.maxPrice)}`);
  if (input.onlyAvailable) where.push("exists (select 1 from v_inventario_bot va where va.product_id = i.product_id and va.stock > 0)");

  const limit = addValue(input.limit);
  const db = getDb();
  const { rows } = await db.query(
    `${productSelection} where ${where.join(" and ")} group by i.product_id, i.product_name, i.product_slug, p.description, i.category_name, i.effective_price, i.original_price, i.image_url order by i.product_id desc limit ${limit}`,
    values,
  );
  return (rows as CatalogRow[]).map(normalizeProduct);
}

export async function getCatalogProduct(input: GetProductDetailsInput) {
  const db = getDb();
  const where = input.slug ? "i.product_slug = $1" : "i.product_id = $1";
  const value = input.slug ?? input.productId;
  const { rows } = await db.query(
    `${productSelection} where ${where} group by i.product_id, i.product_name, i.product_slug, p.description, i.category_name, i.effective_price, i.original_price, i.image_url`,
    [value],
  );
  return rows[0] ? normalizeProduct(rows[0] as CatalogRow) : null;
}

export async function getCatalogInventory(input: CheckInventoryInput) {
  const db = getDb();
  const { rows } = await db.query(
    `
      select variant_id as id, size, color, sku, stock,
        product_id, product_name, product_slug
      from v_inventario_bot
      where ${input.sku ? "sku = $1" : "product_slug = $1"}
      order by size, color
    `,
    [input.sku ?? input.productSlug],
  );
  return rows as Array<{
    id: number;
    size: string;
    color: string;
    sku: string;
    stock: number;
    product_id: number;
    product_name: string;
    product_slug: string;
  }>;
}
