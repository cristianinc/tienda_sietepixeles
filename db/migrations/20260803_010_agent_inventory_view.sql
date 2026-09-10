drop view if exists v_inventario_bot;

create view v_inventario_bot as
select
  p.id as product_id,
  v.id as variant_id,
  v.sku,
  p.name as product_name,
  p.slug as product_slug,
  c.name as category_name,
  v.size,
  v.color,
  p.price as original_price,
  p.discount_price,
  coalesce(p.discount_price, p.price) as effective_price,
  v.stock,
  p.is_active,
  p.is_featured,
  p.image_url,
  coalesce(
    jsonb_agg(
      jsonb_build_object('id', cg.id, 'name', cg.name, 'slug', cg.slug)
      order by cg.sort_order, cg.name
    ) filter (where cg.id is not null),
    '[]'::jsonb
  ) as category_groups
from product_variants v
join products p on p.id = v.product_id
left join categories c on c.id = p.category_id
left join category_group_products cgp on cgp.product_id = p.id
left join category_groups cg on cg.id = cgp.group_id
where p.is_active = true
group by p.id, v.id, c.id;
