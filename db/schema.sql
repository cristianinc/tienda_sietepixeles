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
  ('Pantalones', 'pantalones', '/images/logo.jpg', 10),
  ('Blusas', 'blusas', '/images/logo.jpg', 20),
  ('Tops', 'tops', '/images/logo.jpg', 30),
  ('Vestidos', 'vestidos', '/images/logo.jpg', 40),
  ('Blazers', 'blazers', '/images/logo.jpg', 50),
  ('Faldas', 'faldas', '/images/logo.jpg', 60),
  ('Abrigos', 'abrigos', '/images/logo.jpg', 70),
  ('Tejidos', 'tejidos', '/images/logo.jpg', 80)
on conflict (slug) do nothing;

update categories set is_active = false where slug in ('looks-de-oficina', 'basicos-premium', 'noche-y-eventos', 'nueva-temporada');

insert into category_groups (name, slug, description, image_url, sort_order)
values
  ('Ofertas', 'ofertas', 'Productos con precio promocional vigente.', '/images/logo.jpg', 5),
  ('Looks de oficina', 'looks-de-oficina', 'Prendas para armar outfits de trabajo: pantalones, blusas y blazers.', '/images/logo.jpg', 10),
  ('Basicos premium', 'basicos-premium', 'Esenciales versatiles para combinar durante toda la temporada.', '/images/logo.jpg', 20),
  ('Noche y eventos', 'noche-y-eventos', 'Vestidos, tops y prendas con presencia para ocasiones especiales.', '/images/logo.jpg', 30),
  ('Nueva temporada', 'nueva-temporada', 'Seleccion curada con los ingresos mas recientes.', '/images/logo.jpg', 40)
on conflict (slug) do nothing;

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

insert into products (name, slug, description, price, discount_price, is_active, is_featured, image_url)
values
  ('Blazer Lino Amelia', 'blazer-lino-amelia', 'Corte relajado para uso diario y ocasiones especiales.', 49990, 42990, true, true, '/images/logo.jpg'),
  ('Vestido Satin Noche', 'vestido-satin-noche', 'Silueta suave con caida elegante y textura luminosa.', 39990, null, true, true, '/images/logo.jpg')
on conflict (slug) do nothing;

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
