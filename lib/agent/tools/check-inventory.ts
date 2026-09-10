import { getCatalogInventory } from "@/lib/catalog/repository";
import { checkInventoryInputSchema, checkInventoryOutputSchema } from "../schemas";

export async function checkInventory(input: unknown) {
  const parsed = checkInventoryInputSchema.safeParse(input);
  if (!parsed.success) throw parsed.error;

  const variants = await getCatalogInventory(parsed.data);
  return checkInventoryOutputSchema.parse({
    variants: variants.map((variant) => ({
      id: variant.id,
      size: variant.size,
      color: variant.color,
      sku: variant.sku,
      stock: Number(variant.stock),
      isAvailable: Number(variant.stock) > 0,
      productId: variant.product_id,
      productName: variant.product_name,
      productSlug: variant.product_slug,
    })),
  });
}
