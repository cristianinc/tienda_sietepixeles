import { CartView } from "@/components/cart/CartView";

export default function CartPage() {
  return (
    <section className="space-y-6">
      <h1 className="font-serif text-4xl">Carrito</h1>
      <CartView />
    </section>
  );
}
