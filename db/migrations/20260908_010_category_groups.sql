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

create index if not exists idx_category_group_products_product_id
  on category_group_products(product_id);
