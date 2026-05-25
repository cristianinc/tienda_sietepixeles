import Link from "next/link";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { ensureProductOptionTables } from "@/lib/admin-options";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await ensureProductOptionTables();
  const db = getDb();
  const { rows } = await db.query("select * from categories order by sort_order asc, name asc");

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-4xl">Categorias</h1>
        <Link href="/admin" className="rounded-full border border-[var(--color-muted)] px-5 py-2 text-sm font-semibold">
          Volver al panel
        </Link>
      </div>
      <CategoryManager initialCategories={rows} />
    </section>
  );
}
