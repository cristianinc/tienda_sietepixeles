import { CategoryGroupManager } from "@/components/admin/CategoryGroupManager";
import { getCategoryGroups } from "@/lib/category-groups";
import { ensureProductOptionTables } from "@/lib/admin-options";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCategoryGroupsPage() {
  const groups = await getCategoryGroups(true);
  await ensureProductOptionTables();
  const db = getDb();
  const { rows: products } = await db.query(
    `
      select
        p.id,
        p.name,
        p.slug,
        p.is_active,
        c.name as category_name
      from products p
      left join categories c on c.id = p.category_id
      order by c.sort_order asc nulls last, c.name asc nulls last, p.name asc
    `,
  );

  return (
    <section className="space-y-6">
      <h1 className="font-serif text-4xl">Agrupadores de productos</h1>
      <CategoryGroupManager initialGroups={groups} initialProducts={products} />
    </section>
  );
}
