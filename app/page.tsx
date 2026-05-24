import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/tienda/ProductCard";
import { getCategoryGroups } from "@/lib/category-groups";
import { getCatalogProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, categoryGroups] = await Promise.all([
    getCatalogProducts(8),
    getCategoryGroups(),
  ]);
  const featured = products.filter((product) => product.is_featured).slice(0, 4);
  const bestSellers = [...products]
    .sort(
      (a, b) =>
        b.variants.reduce((acc, variant) => acc + (12 - variant.stock), 0) -
        a.variants.reduce((acc, variant) => acc + (12 - variant.stock), 0),
    )
    .slice(0, 4);

  return (
    <div className="space-y-20">
      <section className="relative overflow-hidden rounded-[2rem] border border-[var(--color-muted)] bg-gradient-to-br from-[var(--color-sand)] via-[var(--color-cream)] to-[var(--color-rose)] p-8 md:p-12">
        <div className="absolute -right-16 -top-12 h-56 w-56 rounded-full bg-white/30 blur-2xl" />
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="space-y-5 animate-fade-up">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--color-soft-ink)]">Nueva temporada</p>
          <h1 className="font-serif text-4xl font-semibold leading-tight sm:text-5xl">Descubre prendas que elevan tu estilo todos los dias.</h1>
          <p className="max-w-lg text-[var(--color-soft-ink)]">Te ayudamos a encontrar outfits que combinan comodidad, elegancia y tendencia. Entra a la tienda y enamorate de la coleccion.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/tienda" className="inline-flex rounded-full bg-[var(--color-ink)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-clay)]">Comprar ahora</Link>
            <Link href="/tienda" className="inline-flex rounded-full border border-[var(--color-ink)] px-6 py-3 text-sm font-semibold">Ver catalogo</Link>
          </div>
        </div>
          <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-3xl border border-white/60 shadow-2xl animate-fade-up-delayed">
            <Image src={featured[0]?.image_url ?? "/images/images-1779314653582.jpeg"} alt="Editorial de temporada" fill className="object-cover" />
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="font-serif text-3xl">Categorias destacadas</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {categoryGroups.map((group) => (
            <Link key={group.id} href={`/agrupador/${group.slug}`} className="rounded-2xl border border-[var(--color-muted)] bg-white/70 px-5 py-8 text-center transition hover:-translate-y-1 hover:border-[var(--color-clay)]">
              <span className="block text-sm font-semibold uppercase tracking-[0.16em]">{group.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif text-3xl">Destacados</h2>
          <Link href="/destacados" className="text-sm font-semibold text-[var(--color-clay)]">Ver todos</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} showVariantSelector />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif text-3xl">Mas vendidos</h2>
          <Link href="/tienda" className="text-sm font-semibold text-[var(--color-clay)]">Ver todos</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {bestSellers.map((product) => (
            <ProductCard key={`home-best-${product.id}`} product={product} showVariantSelector />
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--color-muted)] bg-white p-8 text-center sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-soft-ink)]">Compra segura</p>
        <h3 className="mt-3 font-serif text-3xl">Envios a todo Chile y cambios faciles</h3>
        <p className="mx-auto mt-3 max-w-2xl text-[var(--color-soft-ink)]">Recibe tus prendas en pocos dias y compra con confianza. Nuestro catalogo se actualiza cada semana con nuevos ingresos.</p>
        <Link href="/tienda" className="mt-6 inline-flex rounded-full bg-[var(--color-ink)] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-clay)]">Ir a la tienda</Link>
      </section>
    </div>
  );
}
