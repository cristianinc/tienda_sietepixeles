import { CategoryManager } from "@/components/admin/CategoryManager";
import { ensureProductOptionTables } from "@/lib/admin-options";
import { getDb } from "@/lib/db";

export default async function AdminCategoriesPage() {
  await ensureProductOptionTables();
  const db = getDb();
  const { rows } = await db.query("select * from categories order by sort_order asc, name asc");

  return (
    <section className="space-y-6">
      <h1 className="font-serif text-4xl">Categorias</h1>
      <CategoryManager initialCategories={rows} />
    </section>
  );
}
