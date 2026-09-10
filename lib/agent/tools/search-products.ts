import { searchCatalogProducts } from "@/lib/catalog/repository";
import { searchProductsInputSchema, searchProductsOutputSchema } from "../schemas";

export async function searchProducts(input: unknown) {
  const parsed = searchProductsInputSchema.safeParse(input);
  if (!parsed.success) throw parsed.error;

  const products = await searchCatalogProducts(parsed.data);
  return searchProductsOutputSchema.parse({
    products: products.map((product) => ({
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
    })),
    total: products.length,
  });
}
