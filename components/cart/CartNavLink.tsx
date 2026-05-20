"use client";

import Link from "next/link";
import { useCartHydrated, useCartStore } from "@/lib/cart-store";

export function CartNavLink() {
  const items = useCartStore((state) => state.items);
  const hydrated = useCartHydrated();

  const quantity = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <Link href="/carrito" className="inline-flex items-center gap-2 transition hover:text-[var(--color-clay)]">
      Carrito
      {hydrated && quantity > 0 ? (
        <span className="rounded-full bg-[var(--color-ink)] px-2 py-0.5 text-xs text-white">{quantity}</span>
      ) : null}
    </Link>
  );
}
