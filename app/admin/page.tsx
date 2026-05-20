import Link from "next/link";

export default function AdminPage() {
  return (
    <section className="space-y-6">
      <h1 className="font-serif text-4xl">Panel administrador</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--color-muted)] bg-white p-5">
          <p className="text-sm text-[var(--color-soft-ink)]">Ventas del mes</p>
          <p className="mt-2 text-2xl font-semibold">$1.200.000</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-muted)] bg-white p-5">
          <p className="text-sm text-[var(--color-soft-ink)]">Pedidos pendientes</p>
          <p className="mt-2 text-2xl font-semibold">8</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-muted)] bg-white p-5">
          <p className="text-sm text-[var(--color-soft-ink)]">Bajo stock</p>
          <p className="mt-2 text-2xl font-semibold">3</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/productos" className="inline-flex rounded-full bg-[var(--color-ink)] px-6 py-3 text-sm font-semibold text-white">
          Gestionar productos
        </Link>
        <Link href="/admin/categorias" className="inline-flex rounded-full border border-[var(--color-muted)] px-6 py-3 text-sm font-semibold">
          Gestionar categorias
        </Link>
        <Link href="/admin/agrupadores" className="inline-flex rounded-full border border-[var(--color-muted)] px-6 py-3 text-sm font-semibold">
          Gestionar agrupadores
        </Link>
        <Link href="/admin/tallas" className="inline-flex rounded-full border border-[var(--color-muted)] px-6 py-3 text-sm font-semibold">
          Gestionar tallas
        </Link>
        <Link href="/admin/colores" className="inline-flex rounded-full border border-[var(--color-muted)] px-6 py-3 text-sm font-semibold">
          Gestionar colores
        </Link>
      </div>
    </section>
  );
}
