import Image from "next/image";
import { notFound } from "next/navigation";
import { ProductPurchasePanel } from "@/components/cart/ProductPurchasePanel";
import { getProductBySlug } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <section className="grid gap-8 lg:grid-cols-2">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-[var(--color-muted)] bg-white">
        <Image
          src={product.image_url ?? "/images/logo.jpg"}
          alt={product.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="space-y-6">
        <h1 className="font-serif text-4xl">{product.name}</h1>
        <p className="max-w-2xl text-[var(--color-soft-ink)]">{product.description}</p>
        <div className="flex items-center gap-3">
          <p className="text-2xl font-semibold">${Number(product.discount_price ?? product.price).toLocaleString("es-CL")}</p>
          {product.discount_price ? (
            <p className="text-base text-[var(--color-soft-ink)] line-through">
              ${Number(product.price).toLocaleString("es-CL")}
            </p>
          ) : null}
        </div>
        <ProductPurchasePanel product={product} />
      </div>
    </section>
  );
}
