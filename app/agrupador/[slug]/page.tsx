import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/tienda/ProductCard";
import { getCategoryGroupBySlug } from "@/lib/category-groups";
import { getCatalogProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function CategoryGroupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const group = await getCategoryGroupBySlug(slug);

  if (!group) {
    notFound();
  }

  const products = await getCatalogProducts();
  const groupProductIds = new Set(group.products.map((product) => Number(product.id)));
  const groupProducts = products.filter((product) => groupProductIds.has(Number(product.id)));

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-soft-ink)]">
          Agrupador destacado
        </p>
        <h1 className="font-serif text-4xl">{group.name}</h1>
        {group.description ? (
          <p className="max-w-3xl text-[var(--color-soft-ink)]">{group.description}</p>
        ) : null}
      </div>

      {groupProducts.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {groupProducts.map((product) => (
            <ProductCard key={`group-${group.id}-${product.id}`} product={product} showVariantSelector />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--color-muted)] bg-white p-8 text-center">
          <p className="text-lg font-semibold">No hay productos asociados a este agrupador.</p>
          <p className="mt-2 text-sm text-[var(--color-soft-ink)]">
            Puedes agregar productos desde el panel de admin en la seccion de agrupadores.
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
