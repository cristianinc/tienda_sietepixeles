-- Historical bootstrap retained for compatibility only.
-- The canonical schema lives in db/migrations/. Use `npm run db:init` to apply it
-- and `npm run db:seed` only for explicit development data.
/*
create table if not exists products (
  id bigserial primary key,
  category_id bigint,
  name text not null,
  slug text not null unique,
  description text not null,
  price numeric(10, 2) not null,
  discount_price numeric(10, 2),
  is_active boolean not null default true,
  is_featured boolean not null default false,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_variants (
  id bigserial primary key,
  product_id bigint not null references products(id) on delete cascade,
  size text not null,
  color text not null,
  stock integer not null default 0,
  sku text not null unique
);

create index if not exists idx_product_variants_product_id on product_variants(product_id);
create index if not exists idx_products_active_category on products(is_active, category_id);
create index if not exists idx_product_variants_available on product_variants(product_id, stock) where stock > 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_price_positive') then
    alter table products add constraint products_price_positive check (price > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_discount_price_valid') then
    alter table products add constraint products_discount_price_valid check (
      discount_price is null or (discount_price > 0 and discount_price < price)
    );
  end if;
  if not exists (select 1 from pg_constraint where conname = 'product_variants_stock_nonnegative') then
    alter table product_variants add constraint product_variants_stock_nonnegative check (stock >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'product_variants_product_size_color_unique') then
    alter table product_variants add constraint product_variants_product_size_color_unique unique (product_id, size, color);
  end if;
end $$;

create table if not exists categories (
  id bigserial primary key,
  name text not null,
  slug text not null unique,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists category_groups (
  id bigserial primary key,
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists category_group_products (
  group_id bigint not null references category_groups(id) on delete cascade,
  product_id bigint not null references products(id) on delete cascade,
  primary key (group_id, product_id)
);

alter table products
add column if not exists category_id bigint references categories(id);

alter table categories
add column if not exists sort_order integer not null default 0;

insert into categories (name, slug, image_url, sort_order)
values
  ('Pantalones', 'pantalones', '/images/images-1779314653582.jpeg', 10),
  ('Blusas', 'blusas', '/images/images-1779314653582.jpeg', 20),
  ('Tops', 'tops', '/images/images-1779314653582.jpeg', 30),
  ('Vestidos', 'vestidos', '/images/images-1779314653582.jpeg', 40),
  ('Blazers', 'blazers', '/images/images-1779314653582.jpeg', 50),
  ('Faldas', 'faldas', '/images/images-1779314653582.jpeg', 60),
  ('Abrigos', 'abrigos', '/images/images-1779314653582.jpeg', 70),
  ('Tejidos', 'tejidos', '/images/images-1779314653582.jpeg', 80)
on conflict (slug) do nothing;

update categories set image_url = '/images/images-1779314653582.jpeg' where image_url = '/images/logo.jpg';

update categories set is_active = false where slug in ('looks-de-oficina', 'basicos-premium', 'noche-y-eventos', 'nueva-temporada');

insert into category_groups (name, slug, description, image_url, sort_order)
values
  ('Ofertas', 'ofertas', 'Productos con precio promocional vigente.', '/images/images-1779314653582.jpeg', 5),
  ('Looks de oficina', 'looks-de-oficina', 'Prendas para armar outfits de trabajo: pantalones, blusas y blazers.', '/images/images-1779314653582.jpeg', 10),
  ('Basicos premium', 'basicos-premium', 'Esenciales versatiles para combinar durante toda la temporada.', '/images/images-1779314653582.jpeg', 20),
  ('Noche y eventos', 'noche-y-eventos', 'Vestidos, tops y prendas con presencia para ocasiones especiales.', '/images/images-1779314653582.jpeg', 30),
  ('Nueva temporada', 'nueva-temporada', 'Seleccion curada con los ingresos mas recientes.', '/images/images-1779314653582.jpeg', 40)
on conflict (slug) do nothing;

update category_groups set image_url = '/images/images-1779314653582.jpeg' where image_url = '/images/logo.jpg';

delete from category_group_products
where group_id = (select id from category_groups where slug = 'ofertas');

insert into category_group_products (group_id, product_id)
select g.id, p.id
from category_groups g
join products p on p.is_active = true and p.discount_price is not null and p.discount_price > 0 and p.discount_price < p.price
where g.slug = 'ofertas'
on conflict do nothing;

insert into category_group_products (group_id, product_id)
select g.id, p.id from category_groups g join categories c on c.slug in ('pantalones', 'blusas', 'blazers') join products p on p.category_id = c.id where g.slug = 'looks-de-oficina'
on conflict do nothing;

insert into category_group_products (group_id, product_id)
select g.id, p.id from category_groups g join categories c on c.slug in ('pantalones', 'blusas', 'tops', 'tejidos') join products p on p.category_id = c.id where g.slug = 'basicos-premium'
on conflict do nothing;

insert into category_group_products (group_id, product_id)
select g.id, p.id from category_groups g join categories c on c.slug in ('vestidos', 'tops', 'blazers', 'faldas') join products p on p.category_id = c.id where g.slug = 'noche-y-eventos'
on conflict do nothing;

insert into category_group_products (group_id, product_id)
select g.id, p.id from category_groups g join products p on p.is_active = true where g.slug = 'nueva-temporada'
on conflict do nothing;

create table if not exists product_sizes (
  id bigserial primary key,
  name text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists product_colors (
  id bigserial primary key,
  name text not null unique,
  hex text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into product_sizes (name, sort_order)
values ('XS', 1), ('S', 2), ('M', 3), ('L', 4), ('XL', 5)
on conflict (name) do nothing;

insert into product_colors (name, hex)
values ('Arena', '#d8c3a5'), ('Negro', '#111111'), ('Blanco', '#ffffff'), ('Rosa', '#e9b7c2')
on conflict (name) do nothing;

insert into products (category_id, name, slug, description, price, discount_price, is_active, is_featured, image_url)
values
  ((select id from categories where slug = 'blazers'), 'Blazer Lino Amelia', 'blazer-lino-amelia', 'Corte relajado para uso diario y ocasiones especiales.', 49990, 42990, true, true, '/images/images-1779314653582.jpeg'),
  ((select id from categories where slug = 'vestidos'), 'Vestido Satin Noche', 'vestido-satin-noche', 'Silueta suave con caida elegante y textura luminosa.', 39990, null, true, true, '/images/images-1779314653582.jpeg'),
  ((select id from categories where slug = 'pantalones'), 'Pantalon Wide Leg Aurora', 'pantalon-wide-leg-aurora', 'Tiro alto y pierna amplia para looks pulidos de oficina.', 35990, 31990, true, true, '/images/images-1779314653582.jpeg'),
  ((select id from categories where slug = 'blusas'), 'Blusa Popelina Clara', 'blusa-popelina-clara', 'Popelina liviana con terminacion limpia para combinar a diario.', 28990, null, true, false, '/images/images-1779314653582.jpeg'),
  ((select id from categories where slug = 'tops'), 'Top Canalado Emilia', 'top-canalado-emilia', 'Basico elasticado con textura canalada y calce comodo.', 19990, 16990, true, true, '/images/images-1779314653582.jpeg'),
  ((select id from categories where slug = 'faldas'), 'Falda Midi Siena', 'falda-midi-siena', 'Falda midi con movimiento suave y cintura definida.', 32990, null, true, false, '/images/images-1779314653582.jpeg'),
  ((select id from categories where slug = 'abrigos'), 'Trench Liviano Olivia', 'trench-liviano-olivia', 'Capa ligera para media estacion con amarra ajustable.', 59990, 49990, true, true, '/images/images-1779314653582.jpeg'),
  ((select id from categories where slug = 'tejidos'), 'Cardigan Suave Martina', 'cardigan-suave-martina', 'Tejido suave de botonadura frontal para uso versatil.', 34990, null, true, false, '/images/images-1779314653582.jpeg'),
  ((select id from categories where slug = 'pantalones'), 'Jeans Recto Elisa', 'jeans-recto-elisa', 'Denim recto de calce clasico para armar outfits casuales.', 42990, null, true, false, '/images/images-1779314653582.jpeg'),
  ((select id from categories where slug = 'vestidos'), 'Vestido Camisero Luna', 'vestido-camisero-luna', 'Vestido camisero con cinturon y estructura relajada.', 45990, 39990, true, true, '/images/images-1779314653582.jpeg')
on conflict (slug) do update set
  category_id = excluded.category_id,
  description = excluded.description,
  price = excluded.price,
  discount_price = excluded.discount_price,
  is_active = excluded.is_active,
  is_featured = excluded.is_featured,
  image_url = excluded.image_url,
  updated_at = now();

update products set image_url = '/images/images-1779314653582.jpeg' where image_url = '/images/logo.jpg';

update products p set category_id = c.id from categories c where p.category_id is null and c.slug = 'pantalones' and (lower(p.name) like '%pantalon%' or lower(p.name) like '%pantalón%' or lower(p.name) like '%jeans%');
update products p set category_id = c.id from categories c where p.category_id is null and c.slug = 'blusas' and lower(p.name) like '%blusa%';
update products p set category_id = c.id from categories c where p.category_id is null and c.slug = 'tops' and lower(p.name) like '%top%';
update products p set category_id = c.id from categories c where p.category_id is null and c.slug = 'vestidos' and lower(p.name) like '%vestido%';
update products p set category_id = c.id from categories c where p.category_id is null and c.slug = 'blazers' and lower(p.name) like '%blazer%';
update products p set category_id = c.id from categories c where p.category_id is null and c.slug = 'faldas' and lower(p.name) like '%falda%';
update products p set category_id = c.id from categories c where p.category_id is null and c.slug = 'abrigos' and (lower(p.name) like '%chaqueta%' or lower(p.name) like '%trench%');
update products p set category_id = c.id from categories c where p.category_id is null and c.slug = 'tejidos' and (lower(p.name) like '%cardigan%' or lower(p.name) like '%poleron%' or lower(p.name) like '%polerón%');

insert into category_group_products (group_id, product_id)
select g.id, p.id from category_groups g join categories c on c.slug in ('pantalones', 'blusas', 'blazers') join products p on p.category_id = c.id where g.slug = 'looks-de-oficina'
on conflict do nothing;

insert into category_group_products (group_id, product_id)
select g.id, p.id from category_groups g join categories c on c.slug in ('pantalones', 'blusas', 'tops', 'tejidos') join products p on p.category_id = c.id where g.slug = 'basicos-premium'
on conflict do nothing;

insert into category_group_products (group_id, product_id)
select g.id, p.id from category_groups g join categories c on c.slug in ('vestidos', 'tops', 'blazers', 'faldas') join products p on p.category_id = c.id where g.slug = 'noche-y-eventos'
on conflict do nothing;

insert into category_group_products (group_id, product_id)
select g.id, p.id from category_groups g join products p on p.is_active = true where g.slug = 'nueva-temporada'
on conflict do nothing;

insert into product_variants (product_id, size, color, stock, sku)
select p.id, 'S', 'Arena', 5, 'BLAZ-S-ARE' from products p where p.slug = 'blazer-lino-amelia'
on conflict (sku) do nothing;

insert into product_variants (product_id, size, color, stock, sku)
select p.id, 'M', 'Arena', 8, 'BLAZ-M-ARE' from products p where p.slug = 'blazer-lino-amelia'
on conflict (sku) do nothing;

insert into product_variants (product_id, size, color, stock, sku)
select p.id, 'S', 'Negro', 4, 'VEST-S-NEG' from products p where p.slug = 'vestido-satin-noche'
on conflict (sku) do nothing;

insert into product_variants (product_id, size, color, stock, sku)
select p.id, 'M', 'Negro', 7, 'VEST-M-NEG' from products p where p.slug = 'vestido-satin-noche'
on conflict (sku) do nothing;

insert into product_variants (product_id, size, color, stock, sku)
select p.id, 'S', 'Negro', 6, 'PANT-AUR-S-NEG' from products p where p.slug = 'pantalon-wide-leg-aurora'
on conflict (sku) do nothing;

insert into product_variants (product_id, size, color, stock, sku)
select p.id, 'M', 'Negro', 9, 'PANT-AUR-M-NEG' from products p where p.slug = 'pantalon-wide-leg-aurora'
on conflict (sku) do nothing;

insert into product_variants (product_id, size, color, stock, sku)
select p.id, 'S', 'Blanco', 10, 'BLUS-CLA-S-BLA' from products p where p.slug = 'blusa-popelina-clara'
on conflict (sku) do nothing;

insert into product_variants (product_id, size, color, stock, sku)
select p.id, 'M', 'Blanco', 8, 'BLUS-CLA-M-BLA' from products p where p.slug = 'blusa-popelina-clara'
on conflict (sku) do nothing;

insert into product_variants (product_id, size, color, stock, sku)
select p.id, 'S', 'Rosa', 7, 'TOP-EMI-S-ROS' from products p where p.slug = 'top-canalado-emilia'
on conflict (sku) do nothing;

insert into product_variants (product_id, size, color, stock, sku)
select p.id, 'M', 'Rosa', 11, 'TOP-EMI-M-ROS' from products p where p.slug = 'top-canalado-emilia'
on conflict (sku) do nothing;

insert into product_variants (product_id, size, color, stock, sku)
select p.id, 'M', 'Arena', 5, 'FAL-SIE-M-ARE' from products p where p.slug = 'falda-midi-siena'
on conflict (sku) do nothing;

insert into product_variants (product_id, size, color, stock, sku)
select p.id, 'L', 'Arena', 4, 'FAL-SIE-L-ARE' from products p where p.slug = 'falda-midi-siena'
on conflict (sku) do nothing;

insert into product_variants (product_id, size, color, stock, sku)
select p.id, 'M', 'Arena', 3, 'TRE-OLI-M-ARE' from products p where p.slug = 'trench-liviano-olivia'
on conflict (sku) do nothing;

insert into product_variants (product_id, size, color, stock, sku)
select p.id, 'L', 'Arena', 2, 'TRE-OLI-L-ARE' from products p where p.slug = 'trench-liviano-olivia'
on conflict (sku) do nothing;

insert into product_variants (product_id, size, color, stock, sku)
select p.id, 'M', 'Blanco', 8, 'CAR-MAR-M-BLA' from products p where p.slug = 'cardigan-suave-martina'
on conflict (sku) do nothing;

insert into product_variants (product_id, size, color, stock, sku)
select p.id, 'L', 'Blanco', 5, 'CAR-MAR-L-BLA' from products p where p.slug = 'cardigan-suave-martina'
on conflict (sku) do nothing;

insert into product_variants (product_id, size, color, stock, sku)
select p.id, 'S', 'Negro', 6, 'JEA-ELI-S-NEG' from products p where p.slug = 'jeans-recto-elisa'
on conflict (sku) do nothing;

insert into product_variants (product_id, size, color, stock, sku)
select p.id, 'M', 'Negro', 6, 'JEA-ELI-M-NEG' from products p where p.slug = 'jeans-recto-elisa'
on conflict (sku) do nothing;

insert into product_variants (product_id, size, color, stock, sku)
select p.id, 'S', 'Blanco', 4, 'VES-LUN-S-BLA' from products p where p.slug = 'vestido-camisero-luna'
on conflict (sku) do nothing;

insert into product_variants (product_id, size, color, stock, sku)
select p.id, 'M', 'Blanco', 6, 'VES-LUN-M-BLA' from products p where p.slug = 'vestido-camisero-luna'
on conflict (sku) do nothing;

create or replace view v_inventario_bot as
select
  v.sku as sku,
  p.name as producto,
  v.color as color,
  v.size as talla,
  coalesce(p.discount_price, p.price) as precio,
  v.stock as stock,
  p.is_active as activo,
  c.name as categoria,
  coalesce(string_agg(cg.name, ', ' order by cg.name), '') as agrupadores
from product_variants v
join products p on p.id = v.product_id
left join categories c on c.id = p.category_id
left join category_group_products cgp on cgp.product_id = p.id
left join category_groups cg on cg.id = cgp.group_id
group by v.id, p.id, c.id;

create table if not exists agent_tool_calls (
  id bigserial primary key,
  tool_name text not null check (tool_name in ('search_products', 'get_product_details', 'check_inventory', 'get_store_information')),
  input jsonb not null,
  output jsonb,
  status text not null check (status in ('success', 'error')),
  error_code text,
  duration_ms integer not null check (duration_ms >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_tool_calls_created_at on agent_tool_calls(created_at desc);
create index if not exists idx_agent_tool_calls_tool_status on agent_tool_calls(tool_name, status);
*/
