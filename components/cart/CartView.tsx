"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { getCartItemPrice, useCartHydrated, useCartStore } from "@/lib/cart-store";

const formatPrice = (value: number) => `$${value.toLocaleString("es-CL")}`;
const whatsappOrderPhone = (process.env.NEXT_PUBLIC_WHATSAPP_ORDER_PHONE ?? "").replace(/\D/g, "");

export function CartView() {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const hydrated = useCartHydrated();

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + getCartItemPrice(item) * item.quantity, 0),
    [items],
  );

  const orderMessage = useMemo(() => {
    const detail = items
      .map(
        (item) =>
          `- ${item.name} (${item.size}, ${item.color}) x${item.quantity}: ${formatPrice(
            getCartItemPrice(item) * item.quantity,
          )}`,
      )
      .join("\n");

    return encodeURIComponent(`Hola, quiero comprar:\n${detail}\n\nTotal: ${formatPrice(subtotal)}`);
  }, [items, subtotal]);

  if (!hydrated) {
    return <p className="text-[var(--color-soft-ink)]">Cargando carrito...</p>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-[var(--color-muted)] bg-white p-8 text-center">
        <h2 className="font-serif text-3xl">Tu carrito esta vacio</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--color-soft-ink)]">
          Agrega prendas desde la tienda para preparar tu pedido.
        </p>
        <Link
          href="/tienda"
          className="mt-6 inline-flex rounded-full bg-[var(--color-ink)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-clay)]"
        >
          Ir a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {items.map((item) => (
          <article key={item.variantId} className="grid gap-4 rounded-3xl border border-[var(--color-muted)] bg-white p-4 sm:grid-cols-[120px_1fr]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[var(--color-sand)]">
              <Image src={item.imageUrl ?? "/images/images-1779314653582.jpeg"} alt={item.name} fill className="object-cover" />
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <Link href={`/producto/${item.slug}`} className="font-semibold transition hover:text-[var(--color-clay)]">
                  {item.name}
                </Link>
                <p className="text-sm text-[var(--color-soft-ink)]">
                  Talla {item.size} · Color {item.color} · SKU {item.sku}
                </p>
                <p className="font-semibold">{formatPrice(getCartItemPrice(item))}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <label className="text-sm font-semibold">
                  Cantidad
                  <input
                    type="number"
                    min="1"
                    max={item.stock}
                    value={item.quantity}
                    onChange={(event) => updateQuantity(item.variantId, Number(event.target.value))}
                    className="ml-2 w-20 rounded-xl border border-[var(--color-muted)] bg-[var(--color-cream)] px-3 py-2 outline-none transition focus:border-[var(--color-clay)]"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeItem(item.variantId)}
                  className="rounded-full border border-[var(--color-muted)] px-4 py-2 text-sm font-semibold transition hover:border-[var(--color-clay)] hover:text-[var(--color-clay)]"
                >
                  Quitar
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <aside className="h-fit rounded-3xl border border-[var(--color-muted)] bg-white p-5 shadow-[0_16px_40px_-32px_rgba(30,20,15,0.55)]">
        <h2 className="font-serif text-3xl">Resumen</h2>
        <div className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-[var(--color-soft-ink)]">Productos</span>
            <span>{items.reduce((total, item) => total + item.quantity, 0)}</span>
          </div>
          <div className="flex justify-between gap-3 text-lg font-semibold">
            <span>Total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <p className="text-xs text-[var(--color-soft-ink)]">
            El despacho y metodo de pago se coordinan al confirmar el pedido.
          </p>
        </div>
        {whatsappOrderPhone ? (
          <a
            href={`https://wa.me/${whatsappOrderPhone}?text=${orderMessage}`}
            target="_blank"
            rel="noreferrer"
            className="mt-6 flex w-full justify-center rounded-full bg-[var(--color-ink)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-clay)]"
          >
            Confirmar por WhatsApp
          </a>
        ) : (
          <p className="mt-6 rounded-2xl bg-[var(--color-cream)] px-4 py-3 text-center text-sm text-[var(--color-soft-ink)]">
            La confirmacion por WhatsApp no esta disponible.
          </p>
        )}
        <button
          type="button"
          onClick={clearCart}
          className="mt-3 w-full rounded-full border border-[var(--color-muted)] px-6 py-3 text-sm font-semibold transition hover:border-[var(--color-clay)] hover:text-[var(--color-clay)]"
        >
          Vaciar carrito
        </button>
      </aside>
    </div>
  );
}
