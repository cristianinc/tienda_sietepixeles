import { OptionManager } from "@/components/admin/OptionManager";
import { ensureProductOptionTables } from "@/lib/admin-options";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminColorsPage() {
  await ensureProductOptionTables();
  const db = getDb();
  const { rows } = await db.query("select * from product_colors order by name asc");

  return (
    <section className="space-y-6">
      <h1 className="font-serif text-4xl">Colores</h1>
      <OptionManager title="color" apiPath="/api/colores" responseKey="colors" initialItems={rows} hasHex />
    </section>
  );
}
