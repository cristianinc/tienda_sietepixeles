import Link from "next/link";
import { AgentToolTester } from "@/components/admin/AgentToolTester";

export default function AdminAgentPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-soft-ink)]">Agente comercial</p>
          <h1 className="font-serif text-4xl">Prueba de catálogo</h1>
        </div>
        <Link href="/admin" className="rounded-full border border-[var(--color-muted)] px-5 py-2 text-sm font-semibold">Volver al panel</Link>
      </div>
      <p className="text-[var(--color-soft-ink)]">Solo consulta productos, variantes, precios, stock e información configurada de la tienda. No modifica datos.</p>
      <Link href="/admin/agent/conversations" className="inline-flex rounded-full border border-[var(--color-muted)] px-5 py-2 text-sm font-semibold">Ver conversaciones</Link>
      <AgentToolTester />
    </section>
  );
}
