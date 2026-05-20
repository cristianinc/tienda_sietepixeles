import { getDb } from "@/lib/db";

export async function ensureProductOptionTables() {
  const db = getDb();
  const client = await db.connect();

  try {
    await client.query("begin");
    await client.query("select pg_advisory_xact_lock(482916)");
    await client.query(`
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
    `);

    await client.query(`
      insert into product_sizes (name, sort_order)
      values ('XS', 1), ('S', 2), ('M', 3), ('L', 4), ('XL', 5)
      on conflict (name) do nothing;

      insert into product_colors (name, hex)
      values ('Arena', '#d8c3a5'), ('Negro', '#111111'), ('Blanco', '#ffffff'), ('Rosa', '#e9b7c2')
      on conflict (name) do nothing;

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


      update products p set category_id = c.id from categories c where p.category_id is null and c.slug = 'pantalones' and (lower(p.name) like '%pantalon%' or lower(p.name) like '%pantalón%' or lower(p.name) like '%jeans%');
      update products p set category_id = c.id from categories c where p.category_id is null and c.slug = 'blusas' and lower(p.name) like '%blusa%';
      update products p set category_id = c.id from categories c where p.category_id is null and c.slug = 'tops' and lower(p.name) like '%top%';
      update products p set category_id = c.id from categories c where p.category_id is null and c.slug = 'vestidos' and lower(p.name) like '%vestido%';
      update products p set category_id = c.id from categories c where p.category_id is null and c.slug = 'blazers' and lower(p.name) like '%blazer%';
      update products p set category_id = c.id from categories c where p.category_id is null and c.slug = 'faldas' and lower(p.name) like '%falda%';
      update products p set category_id = c.id from categories c where p.category_id is null and c.slug = 'abrigos' and (lower(p.name) like '%chaqueta%' or lower(p.name) like '%trench%');
      update products p set category_id = c.id from categories c where p.category_id is null and c.slug = 'tejidos' and (lower(p.name) like '%cardigan%' or lower(p.name) like '%poleron%' or lower(p.name) like '%polerón%');
    `);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
