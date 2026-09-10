import { getCatalogProduct } from "@/lib/catalog/repository";
import { getProductDetailsInputSchema, getProductDetailsOutputSchema } from "../schemas";

export async function getProductDetails(input: unknown) {
  const parsed = getProductDetailsInputSchema.safeParse(input);
  if (!parsed.success) throw parsed.error;

  const product = await getCatalogProduct(parsed.data);
  return getProductDetailsOutputSchema.parse({
    product: product && {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      category: product.category,
      price: product.price,
      originalPrice: product.original_price,
      imageUrl: product.image_url,
      productUrl: `/producto/${product.slug}`,
      variants: product.variants.map((variant) => ({ ...variant, isAvailable: variant.stock > 0 })),
    },
  });
}
