-- Historical Supabase/Auth draft. Do not apply this file.
-- The canonical PostgreSQL schema and all future changes live in db/migrations/.
-- This file remains only to preserve prior repository history. Runtime authorization
-- is implemented by the application with PostgreSQL-backed admin sessions.
/*
create table if not exists public.profiles (
  id uuid primary key,
  full_name text,
  role text not null default 'customer' check (role in ('admin', 'editor', 'customer')),
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id bigserial primary key,
  name text not null,
  slug text not null unique,
  image_url text,
  is_active boolean not null default true
);

create table if not exists public.products (
  id bigserial primary key,
  category_id bigint references public.categories(id),
  name text not null,
  slug text not null unique,
  description text,
  price numeric(10, 2) not null,
  discount_price numeric(10, 2),
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id bigserial primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  size text not null,
  color text not null,
  stock integer not null default 0,
  sku text not null unique
);

alter table public.products enable row level security;
alter table public.product_variants enable row level security;

create policy "public can view active products" on public.products
for select using (is_active = true);

create policy "admin and editor can manage products" on public.products
for all using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'editor'))
with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'editor'));
*/

create policy "public can read product variants" on public.product_variants
for select using (true);

create policy "admin and editor can manage variants" on public.product_variants
for all using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'editor'))
with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'editor'));
