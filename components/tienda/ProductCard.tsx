"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import type { CatalogProduct } from "@/lib/products";

type Props = {
  product: CatalogProduct;
  showVariantSelector?: boolean;
};

export function ProductCard({ product, showVariantSelector = false }: Props) {
  const colors = [...new Set(product.variants.map((variant) => variant.color))].join(" · ");
  const availableVariants = product.variants.filter((variant) => variant.stock > 0);
  const [selectedVariantId, setSelectedVariantId] = useState(availableVariants[0]?.id ?? product.variants[0]?.id);
  const selectedVariant =
    product.variants.find((variant) => variant.id === selectedVariantId) ?? availableVariants[0];

  return (
    <article className="group overflow-hidden rounded-3xl border border-[var(--color-muted)] bg-white shadow-[0_16px_40px_-30px_rgba(30,20,15,0.5)] transition hover:-translate-y-1 hover:shadow-[0_24px_56px_-28px_rgba(30,20,15,0.45)]">
      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--color-sand)]/50">
        <Image
          src={product.image_url ?? "/images/images-1779314653582.jpeg"}
          alt={product.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        {product.discount_price ? (
          <span className="absolute left-3 top-3 rounded-full bg-[var(--color-ink)] px-3 py-1 text-xs font-semibold text-white">
            Oferta
          </span>
        ) : null}
      </div>
      <div className="space-y-3 p-5">
        <h3 className="font-semibold">{product.name}</h3>
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-soft-ink)]">{colors}</p>
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">
            ${Number(product.discount_price ?? product.price).toLocaleString("es-CL")}
          </span>
          {product.discount_price ? (
            <span className="text-sm text-[var(--color-soft-ink)] line-through">
              ${Number(product.price).toLocaleString("es-CL")}
            </span>
          ) : null}
        </div>

        {showVariantSelector && product.variants.length > 0 ? (
          <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-soft-ink)]">
            Talla y color
            <select
              value={selectedVariant?.id ?? ""}
              onChange={(event) => setSelectedVariantId(Number(event.target.value))}
              className="mt-2 w-full rounded-xl border border-[var(--color-muted)] bg-[var(--color-cream)] px-3 py-2 text-sm normal-case tracking-normal text-[var(--color-ink)] outline-none transition focus:border-[var(--color-clay)]"
            >
              {product.variants.map((variant) => (
                <option key={variant.id} value={variant.id} disabled={variant.stock <= 0}>
                  {variant.size} · {variant.color} {variant.stock <= 0 ? "- sin stock" : `- stock ${variant.stock}`}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Link href={`/producto/${product.slug}`} className="inline-flex rounded-full border border-[var(--color-muted)] px-4 py-2 text-sm font-semibold transition hover:border-[var(--color-clay)] hover:text-[var(--color-clay)]">
            Ver producto
          </Link>
          {selectedVariant ? (
            <AddToCartButton
              item={{
                productId: product.id,
                variantId: selectedVariant.id,
                slug: product.slug,
                name: product.name,
                imageUrl: product.image_url,
                price: Number(product.price),
                discountPrice: product.discount_price ? Number(product.discount_price) : null,
                size: selectedVariant.size,
                color: selectedVariant.color,
                sku: selectedVariant.sku,
                stock: selectedVariant.stock,
              }}
              className="inline-flex rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-clay)]"
            >
              Agregar
            </AddToCartButton>
          ) : null}
        </div>
      </div>
    </article>
  );
}
