# Arquitectura de base de datos

## Fuente canónica

`db/migrations/` es la única fuente canónica de estructura de PostgreSQL. La aplicación usa `pg` directamente y el repositorio no contiene configuración de Supabase CLI ni usa PostgREST para el catálogo, por lo que mantener las migraciones en `db/migrations/` evita una segunda definición específica de Supabase.

`db/schema.sql` y `supabase/schema.sql` se conservan como archivos históricos no ejecutables. No deben usarse para inicializar ni modificar una base de datos.

## Migraciones

Ejecuta las migraciones explícitamente:

```bash
npm run db:init
```

El runner crea `schema_migrations` y aplica, en orden lexicográfico, solo archivos SQL aún no registrados. La aplicación web nunca ejecuta DDL durante páginas, API routes ni arranque normal.

La baseline `20260803_000_catalog_baseline.sql` crea o completa las tablas de catálogo sin borrar datos. Antes de crear constraints, cuenta precios incompatibles, stock negativo y combinaciones repetidas de producto/talla/color. Si encuentra datos inválidos, aborta y muestra los conteos; no corrige datos comerciales automáticamente.

## Seeds de desarrollo

Los datos de ejemplo viven en `db/seeds/development.sql` y se ejecutan solo a demanda:

```bash
npm run db:seed
```

El seed es idempotente para claves únicas y está destinado exclusivamente a entornos de desarrollo. No debe aplicarse en producción porque agrega catálogo de demostración.

## Rollback

Las migraciones no eliminan tablas, IDs, stock ni relaciones. Si una migración aún no fue aplicada, el rollback es no ejecutarla. Para revertir una migración aplicada:

- índices: usar `drop index if exists <nombre>`;
- constraints: usar `alter table <tabla> drop constraint if exists <nombre>`;
- vista: restaurar la definición anterior mediante `create or replace view`.

No se debe hacer rollback de datos comerciales automáticamente. La tabla `schema_migrations` debe actualizarse solo después de revertir manualmente los cambios correspondientes y validar la base.

## Catálogo e inventario

`products` representa la prenda y `product_variants` representa la combinación vendible de talla, color, SKU y stock. El stock actual es un entero por variante y solo se consulta: este esquema no contiene reservas, decrementos, ledger ni pedidos.

La vista canónica del agente es `v_inventario_bot`. Entrega exactamente una fila por `variant_id`, filtra productos activos y agrega agrupadores en `category_groups` como JSONB, sin multiplicar variantes. Incluye precio normal, oferta, efectivo, stock, imagen, categoría, SKU, slug y estado de producto.

Índices relevantes:

- `products.slug` y `product_variants.sku` son únicos para detalle directo.
- `idx_products_active_category` sostiene catálogo visible por categoría.
- `idx_product_variants_product_id` y `idx_product_variants_available` sostienen variantes y disponibilidad.
- `idx_category_group_products_product_id` evita escaneo de la relación inversa al agregar agrupadores.

## Deuda técnica pendiente

- La autorización administrativa aún depende de `ADMIN_EMAILS`; falta una matriz formal de roles.
- PostgreSQL directo evita RLS para el catálogo; las rutas administrativas deben conservar autorización de aplicación.
- Las imágenes cargadas se guardan en el volumen persistente `uploads_data`; escalar `web` horizontalmente exige almacenamiento compartido.
- Reservas, pedidos, pagos y movimientos de inventario quedan fuera de esta fase.

## Persistencia comercial

La migración `20260804_000_commercial_persistence.sql` agrega la base interna para atención comercial sin conectar canales externos:

- `customers`: identidad de cliente por canal y metadatos.
- `conversations`: estado, asignación futura, control del bot y última actividad.
- `conversation_messages`: historial idempotente por conversación e identificador externo.
- `sales_leads`: oportunidad vinculable a cliente, conversación y contexto de productos.

Los índices priorizan consultas por canal/estado, cliente y fecha. Las referencias conservan el historial útil: eliminar una conversación elimina sus mensajes, mientras que un cliente o conversación eliminados se desvinculan de leads sin eliminarlos.

`lib/commercial/repository.ts` es exclusivamente de servidor y no expone rutas ni herramientas nuevas todavía. WhatsApp, handoff, ejecución de agente persistente, aprobaciones, reservas y pedidos siguen fuera de alcance.

El panel `/admin/agent/conversations` usa rutas administrativas protegidas por sesión y correo autorizado para listar conversaciones, pausar/reactivar el bot, cerrar conversaciones y registrar notas humanas. Las notas se guardan como mensajes `internal` de origen `human`: no generan envíos a WhatsApp, Instagram, Facebook ni otro canal.
