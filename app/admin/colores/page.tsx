import Link from "next/link";
import { OptionManager } from "@/components/admin/OptionManager";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminColorsPage() {
  const db = getDb();
  const { rows } = await db.query("select * from product_colors order by name asc");

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-4xl">Colores</h1>
        <Link href="/admin" className="rounded-full border border-[var(--color-muted)] px-5 py-2 text-sm font-semibold">
          Volver al panel
        </Link>
      </div>
      <OptionManager title="color" apiPath="/api/colores" responseKey="colors" initialItems={rows} hasHex />
    </section>
  );
}
