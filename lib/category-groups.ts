import { getDb } from "@/lib/db";

export type CategoryGroup = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  products: Array<{
    id: number;
    name: string;
    slug: string;
    image_url: string | null;
    category_name: string | null;
  }>;
};

export async function getCategoryGroups(includeInactive = false) {
  const db = getDb();
  const { rows } = await db.query(
    `
      select
        g.id,
        g.name,
        g.slug,
        g.description,
        g.image_url,
        g.sort_order,
        g.is_active,
        coalesce(
          json_agg(
            json_build_object(
              'id', p.id,
              'name', p.name,
              'slug', p.slug,
              'image_url', p.image_url,
              'category_name', c.name
            )
            order by p.created_at desc, p.name asc
          ) filter (where p.id is not null),
          '[]'::json
        ) as products
      from category_groups g
      left join category_group_products gp on gp.group_id = g.id
      left join products p on p.id = gp.product_id
      left join categories c on c.id = p.category_id
      where ($1::boolean = true or g.is_active = true)
      group by g.id
      order by g.sort_order asc, g.name asc
    `,
    [includeInactive],
  );

  return rows as CategoryGroup[];
}

export async function getCategoryGroupBySlug(slug: string, includeInactive = false) {
  const groups = await getCategoryGroups(includeInactive);
  return groups.find((group) => group.slug === slug) ?? null;
}
