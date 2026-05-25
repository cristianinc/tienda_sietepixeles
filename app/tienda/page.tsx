import { StoreCatalog } from "@/components/tienda/StoreCatalog";
import { getCatalogProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function StorePage({
  searchParams,
}: {
  searchParams?: Promise<{ categoria?: string | string[] }>;
}) {
  const products = await getCatalogProducts();
  const params = await searchParams;
  const categorySlug = Array.isArray(params?.categoria)
    ? params?.categoria[0]
    : params?.categoria;
  const availableProducts = categorySlug
    ? products.filter((product) => product.category_slug === categorySlug)
    : products;

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-serif text-4xl">Tienda</h1>
        <p className="text-sm text-[var(--color-soft-ink)]">{availableProducts.length} productos disponibles</p>
      </div>
      <StoreCatalog products={products} initialCategorySlug={categorySlug} />
    </section>
  );
}
