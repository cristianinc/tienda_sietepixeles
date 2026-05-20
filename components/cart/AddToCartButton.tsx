"use client";

import { useState } from "react";
import { useCartStore, type CartItemInput } from "@/lib/cart-store";

type Props = {
  item: CartItemInput;
  quantity?: number;
  className?: string;
  children?: React.ReactNode;
};

export function AddToCartButton({ item, quantity = 1, className, children }: Props) {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);
  const disabled = item.stock <= 0;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        addItem(item, quantity);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1600);
      }}
      className={
        className ??
        "inline-flex items-center justify-center rounded-full bg-[var(--color-ink)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-clay)] disabled:cursor-not-allowed disabled:bg-[var(--color-muted)] disabled:text-[var(--color-soft-ink)]"
      }
    >
      {disabled ? "Sin stock" : added ? "Agregado" : children ?? "Agregar al carrito"}
    </button>
  );
}
