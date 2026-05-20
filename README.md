# Tienda de ropa autoadministrable

Base inicial del plan tecnico para una tienda de ropa en **Next.js + Vercel + Supabase**.

## Incluye en esta primera entrega

- Sitio publico base: `app/page.tsx`, `app/tienda/page.tsx`, `app/producto/[slug]/page.tsx`, `app/carrito/page.tsx`
- Login admin por magic link: `app/login/page.tsx`
- Panel inicial: `app/admin/page.tsx` y `app/admin/productos/page.tsx`
- API de productos con validacion Zod: `app/api/productos/route.ts`
- Configuracion Supabase cliente/server/admin: `lib/supabase/*`
- Esquema SQL inicial con RLS base: `supabase/schema.sql`

## Ejecutar local

1. Copia variables:

```bash
cp .env.example .env.local
```

2. Completa valores de Supabase en `.env.local`.
   - Para CRUD local con Podman, agrega `DATABASE_URL=postgresql://tienda_user:tienda_pass@localhost:5432/tienda`
3. Instala dependencias y levanta el proyecto:

```bash
npm install
npm run dev
```

## PostgreSQL con Podman (persistente)

Crear volumen + contenedor:

```bash
podman volume create tienda_pgdata
podman run -d --name tienda-postgres -e POSTGRES_DB=tienda -e POSTGRES_USER=tienda_user -e POSTGRES_PASSWORD=tienda_pass -p 5432:5432 -v tienda_pgdata:/var/lib/postgresql/data docker.io/library/postgres:16
```

Cargar esquema inicial:

```bash
podman cp db/schema.sql tienda-postgres:/tmp/schema.sql
podman exec tienda-postgres psql -U tienda_user -d tienda -f /tmp/schema.sql
```

El volumen `tienda_pgdata` mantiene los datos aunque borres el contenedor.

## CRUD de productos

- `GET /api/productos`
- `POST /api/productos`
- `GET /api/productos/:id`
- `PATCH /api/productos/:id`
- `DELETE /api/productos/:id`

## Deploy recomendado

- **Rama `main`**: produccion en Vercel con proyecto Supabase prod.
- **Rama `development`**: preview en Vercel con Supabase staging.
- Cargar variables de entorno separadas por ambiente desde panel de Vercel.

## Proximos pasos del plan

- Conectar CRUD de productos del admin a Supabase real.
- Implementar carga de imagenes en bucket `product-images`.
- Agregar checkout, pedidos y estados de pedido.
