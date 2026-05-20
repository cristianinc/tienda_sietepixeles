"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import type { CatalogProduct } from "@/lib/products";

type Props = {
  product: CatalogProduct;
};

export function ProductPurchasePanel({ product }: Props) {
  const availableVariants = product.variants.filter((variant) => variant.stock > 0);
  const [variantId, setVariantId] = useState(availableVariants[0]?.id ?? product.variants[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const selectedVariant = product.variants.find((variant) => variant.id === variantId);
  const maxQuantity = selectedVariant?.stock ?? 0;

  return (
    <div className="rounded-2xl border border-[var(--color-muted)] bg-white p-4 sm:p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em]">Elige tu variante</h2>
      <div className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {product.variants.map((variant) => (
            <button
              key={variant.id}
              type="button"
              disabled={variant.stock <= 0}
              onClick={() => {
                setVariantId(variant.id);
                setQuantity(1);
              }}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-45 ${
                variant.id === variantId
                  ? "border-[var(--color-ink)] bg-[var(--color-cream)]"
                  : "border-[var(--color-muted)] bg-white hover:border-[var(--color-clay)]"
              }`}
            >
              <span className="block font-semibold">{variant.size} · {variant.color}</span>
              <span className="text-[var(--color-soft-ink)]">Stock {variant.stock}</span>
            </button>
          ))}
        </div>

        <label className="block text-sm font-semibold">
          Cantidad
          <input
            type="number"
            min="1"
            max={maxQuantity || 1}
            value={quantity}
            disabled={maxQuantity <= 0}
            onChange={(event) => setQuantity(Math.min(maxQuantity || 1, Math.max(1, Number(event.target.value))))}
            className="mt-2 w-28 rounded-xl border border-[var(--color-muted)] bg-[var(--color-cream)] px-3 py-2 outline-none transition focus:border-[var(--color-clay)]"
          />
        </label>

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
            quantity={quantity}
            className="w-full rounded-full bg-[var(--color-ink)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-clay)] disabled:cursor-not-allowed disabled:bg-[var(--color-muted)] disabled:text-[var(--color-soft-ink)]"
          />
        ) : null}
      </div>
    </div>
  );
}
