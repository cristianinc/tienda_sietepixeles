"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useSyncExternalStore } from "react";

export type CartItemInput = {
  productId: number;
  variantId: number;
  slug: string;
  name: string;
  imageUrl: string | null;
  price: number;
  discountPrice: number | null;
  size: string;
  color: string;
  sku: string;
  stock: number;
};

export type CartItem = CartItemInput & {
  quantity: number;
};

type CartState = {
  items: CartItem[];
  addItem: (item: CartItemInput, quantity?: number) => void;
  removeItem: (variantId: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  clearCart: () => void;
};

export const getCartItemPrice = (item: Pick<CartItem, "price" | "discountPrice">) =>
  item.discountPrice ?? item.price;

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((cartItem) => cartItem.variantId === item.variantId);
          const safeQuantity = Math.max(1, Math.floor(quantity));

          if (existing) {
            return {
              items: state.items.map((cartItem) =>
                cartItem.variantId === item.variantId
                  ? {
                      ...cartItem,
                      ...item,
                      quantity: Math.min(item.stock, cartItem.quantity + safeQuantity),
                    }
                  : cartItem,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                ...item,
                quantity: Math.min(item.stock, safeQuantity),
              },
            ],
          };
        }),
      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        })),
      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          items: state.items.flatMap((item) => {
            if (item.variantId !== variantId) return item;

            const nextQuantity = Math.floor(quantity);
            if (nextQuantity <= 0) return [];

            return {
              ...item,
              quantity: Math.min(item.stock, nextQuantity),
            };
          }),
        })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "la-roperia-cart",
    },
  ),
);

export function useCartHydrated() {
  return useSyncExternalStore(
    (callback) => useCartStore.persist.onFinishHydration(callback),
    () => useCartStore.persist.hasHydrated(),
    () => false,
  );
}
