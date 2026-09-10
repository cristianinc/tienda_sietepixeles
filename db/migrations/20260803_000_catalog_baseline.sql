create table if not exists categories (
  id bigserial primary key,
  name text not null,
  slug text not null unique,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id bigserial primary key,
  category_id bigint references categories(id),
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

alter table products add column if not exists category_id bigint references categories(id);
alter table products add column if not exists image_url text;
alter table products add column if not exists updated_at timestamptz not null default now();
alter table categories add column if not exists sort_order integer not null default 0;

do $$
declare
  invalid_prices integer;
  negative_stock integer;
  duplicate_variants integer;
begin
  select count(*) into invalid_prices
  from products
  where price <= 0
    or discount_price <= 0
    or (discount_price is not null and discount_price >= price);

  select count(*) into negative_stock from product_variants where stock < 0;

  select count(*) into duplicate_variants
  from (
    select product_id, size, color
    from product_variants
    group by product_id, size, color
    having count(*) > 1
  ) duplicates;

  if invalid_prices > 0 or negative_stock > 0 or duplicate_variants > 0 then
    raise exception 'Catalog constraints not applied: invalid_prices=%, negative_stock=%, duplicate_variant_combinations=%',
      invalid_prices, negative_stock, duplicate_variants;
  end if;

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

create index if not exists idx_products_active_category on products(is_active, category_id);
create index if not exists idx_product_variants_product_id on product_variants(product_id);
create index if not exists idx_product_variants_available on product_variants(product_id, stock) where stock > 0;
create index if not exists idx_category_group_products_product_id on category_group_products(product_id);
