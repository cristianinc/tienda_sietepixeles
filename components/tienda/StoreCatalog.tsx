"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/tienda/ProductCard";
import type { CatalogProduct } from "@/lib/products";

type Props = {
  products: CatalogProduct[];
  initialCategorySlug?: string;
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function StoreCatalog({ products, initialCategorySlug }: Props) {
  const [query, setQuery] = useState("");
  const visibleProducts = useMemo(() => {
    if (!initialCategorySlug) return products;

    return products.filter((product) => product.category_slug === initialCategorySlug);
  }, [products, initialCategorySlug]);

  const filtered = useMemo(() => {
    const text = normalizeText(query);
    if (!text) return visibleProducts;

    return visibleProducts.filter((product) => {
      const colors = product.variants.map((variant) => variant.color).join(" ");
      const searchable = normalizeText(
        `${product.name} ${product.description} ${product.category_name ?? ""} ${colors}`,
      );

      return searchable.includes(text);
    });
  }, [visibleProducts, query]);

  const categorized = useMemo(() => {
    const grouped = new Map<string, { category: string; categorySlug: string | null; sortOrder: number; items: CatalogProduct[] }>();
    for (const product of visibleProducts) {
      const category = product.category_name ?? "Sin categoria";
      const existing = grouped.get(category) ?? {
        category,
        categorySlug: product.category_slug,
        sortOrder: product.category_sort_order ?? 9999,
        items: [],
      };
      existing.items.push(product);
      grouped.set(category, existing);
    }

    return Array.from(grouped.values())
      .sort((a, b) => a.sortOrder - b.sortOrder || a.category.localeCompare(b.category))
      .map((group) => ({
        ...group,
        items: initialCategorySlug ? group.items : group.items.slice(0, 4),
      }));
  }, [visibleProducts, initialCategorySlug]);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-[var(--color-muted)] bg-white p-5 sm:p-6">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-soft-ink)]">
          Buscar producto
        </label>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ej: blazer, negro, vestido..."
          className="w-full rounded-2xl border border-[var(--color-muted)] bg-[var(--color-cream)] px-4 py-3 outline-none transition focus:border-[var(--color-clay)]"
        />
        {query.trim() ? (
          <p className="mt-3 text-sm text-[var(--color-soft-ink)]">
            Buscando: <span className="font-semibold text-[var(--color-ink)]">{query}</span>
          </p>
        ) : null}
      </div>

      {query.trim() ? (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-serif text-3xl">Resultados</h2>
            <p className="text-sm text-[var(--color-soft-ink)]">{filtered.length} productos</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} showVariantSelector />
            ))}
          </div>
          {filtered.length === 0 ? (
            <p className="rounded-2xl border border-[var(--color-muted)] bg-white p-6 text-sm text-[var(--color-soft-ink)]">
              No encontramos productos con ese termino. Prueba con otro color, prenda o material.
            </p>
          ) : null}
        </section>
      ) : (
        <div className="space-y-8">
          {categorized.map((group) => (
            <section key={group.category} className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <h2 className="font-serif text-3xl">{group.category}</h2>
                {group.categorySlug ? (
                  <Link href={`/tienda?categoria=${group.categorySlug}`} className="text-sm font-semibold text-[var(--color-clay)]">
                    Ver todos
                  </Link>
                ) : null}
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {group.items.map((product) => (
                  <ProductCard key={`${group.category}-${product.id}`} product={product} showVariantSelector />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
