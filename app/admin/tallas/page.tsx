import { OptionManager } from "@/components/admin/OptionManager";
import { ensureProductOptionTables } from "@/lib/admin-options";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminSizesPage() {
  await ensureProductOptionTables();
  const db = getDb();
  const { rows } = await db.query("select * from product_sizes order by sort_order asc, name asc");

  return (
    <section className="space-y-6">
      <h1 className="font-serif text-4xl">Tallas</h1>
      <OptionManager title="talla" apiPath="/api/tallas" responseKey="sizes" initialItems={rows} hasSortOrder />
    </section>
  );
}
