import Link from "next/link";
import { ProductCard } from "@/components/tienda/ProductCard";
import { getCatalogProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function FeaturedProductsPage() {
  const products = await getCatalogProducts();
  const featured = products.filter((product) => product.is_featured);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-soft-ink)]">
          Coleccion
        </p>
        <h1 className="font-serif text-4xl">Productos destacados</h1>
        <p className="text-[var(--color-soft-ink)]">Seleccion curada con los productos mas relevantes de la tienda.</p>
      </div>

      {featured.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={`featured-${product.id}`} product={product} showVariantSelector />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--color-muted)] bg-white p-8 text-center">
          <p className="text-lg font-semibold">No hay productos destacados disponibles.</p>
          <p className="mt-2 text-sm text-[var(--color-soft-ink)]">
            Activa la opcion destacado en el panel de administracion para mostrarlos aqui.
          </p>
          <Link
            href="/tienda"
            className="mt-5 inline-flex rounded-full bg-[var(--color-ink)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-clay)]"
          >
            Ver tienda completa
          </Link>
        </div>
      )}
    </section>
  );
}
