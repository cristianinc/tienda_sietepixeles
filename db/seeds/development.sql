insert into product_sizes (name, sort_order)
values ('XS', 1), ('S', 2), ('M', 3), ('L', 4), ('XL', 5)
on conflict (name) do nothing;

insert into product_colors (name, hex)
values ('Arena', '#d8c3a5'), ('Negro', '#111111'), ('Blanco', '#ffffff'), ('Rosa', '#e9b7c2')
on conflict (name) do nothing;

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

insert into category_groups (name, slug, description, image_url, sort_order)
values
  ('Ofertas', 'ofertas', 'Productos con precio promocional vigente.', '/images/images-1779314653582.jpeg', 5),
  ('Looks de oficina', 'looks-de-oficina', 'Prendas para armar outfits de trabajo: pantalones, blusas y blazers.', '/images/images-1779314653582.jpeg', 10),
  ('Basicos premium', 'basicos-premium', 'Esenciales versatiles para combinar durante toda la temporada.', '/images/images-1779314653582.jpeg', 20),
  ('Noche y eventos', 'noche-y-eventos', 'Vestidos, tops y prendas con presencia para ocasiones especiales.', '/images/images-1779314653582.jpeg', 30),
  ('Nueva temporada', 'nueva-temporada', 'Seleccion curada con los ingresos mas recientes.', '/images/images-1779314653582.jpeg', 40)
on conflict (slug) do nothing;

insert into products (category_id, name, slug, description, price, discount_price, is_active, is_featured, image_url)
values
  ((select id from categories where slug = 'blazers'), 'Blazer Lino Amelia', 'blazer-lino-amelia', 'Corte relajado para uso diario y ocasiones especiales.', 49990, 42990, true, true, '/images/images-1779314653582.jpeg'),
  ((select id from categories where slug = 'vestidos'), 'Vestido Satin Noche', 'vestido-satin-noche', 'Silueta suave con caida elegante y textura luminosa.', 39990, null, true, true, '/images/images-1779314653582.jpeg'),
  ((select id from categories where slug = 'pantalones'), 'Pantalon Wide Leg Aurora', 'pantalon-wide-leg-aurora', 'Tiro alto y pierna amplia para looks pulidos de oficina.', 35990, 31990, true, true, '/images/images-1779314653582.jpeg'),
  ((select id from categories where slug = 'blusas'), 'Blusa Popelina Clara', 'blusa-popelina-clara', 'Popelina liviana con terminacion limpia para combinar a diario.', 28990, null, true, false, '/images/images-1779314653582.jpeg'),
  ((select id from categories where slug = 'tops'), 'Top Canalado Emilia', 'top-canalado-emilia', 'Basico elasticado con textura canalada y calce comodo.', 19990, 16990, true, true, '/images/images-1779314653582.jpeg')
on conflict (slug) do nothing;

with seed_variants(product_slug, size, color, stock, sku) as (
  values
    ('blazer-lino-amelia', 'S', 'Arena', 5, 'BLAZ-S-ARE'),
    ('blazer-lino-amelia', 'M', 'Arena', 8, 'BLAZ-M-ARE'),
    ('vestido-satin-noche', 'S', 'Negro', 4, 'VEST-S-NEG'),
    ('vestido-satin-noche', 'M', 'Negro', 7, 'VEST-M-NEG'),
    ('pantalon-wide-leg-aurora', 'S', 'Negro', 6, 'PANT-AUR-S-NEG'),
    ('pantalon-wide-leg-aurora', 'M', 'Negro', 9, 'PANT-AUR-M-NEG'),
    ('blusa-popelina-clara', 'S', 'Blanco', 10, 'BLUS-CLA-S-BLA'),
    ('blusa-popelina-clara', 'M', 'Blanco', 8, 'BLUS-CLA-M-BLA'),
    ('top-canalado-emilia', 'S', 'Rosa', 7, 'TOP-EMI-S-ROS'),
    ('top-canalado-emilia', 'M', 'Rosa', 11, 'TOP-EMI-M-ROS')
)
insert into product_variants (product_id, size, color, stock, sku)
select p.id, v.size, v.color, v.stock, v.sku
from seed_variants v
join products p on p.slug = v.product_slug
on conflict do nothing;
