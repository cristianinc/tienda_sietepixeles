# Auditoria del estado actual

Fecha de auditoria: 2026-07-23.

## Alcance y validacion

Se inspeccionaron los archivos de aplicacion, configuracion, esquema, scripts, documentacion, rutas y componentes del repositorio, sin leer ni exponer valores de `.env.local`.

- `npm run lint`: correcto.
- `npx tsc --noEmit`: correcto.
- `git diff --check`: correcto.
- No se detectaron archivos de prueba (`*.test.*` o `*.spec.*`) ni un script `test`.
- No se ejecuto `next build`: genera contenido en `.next/`, lo cual contraviene la instruccion de no modificar archivos en esta auditoria.

El arbol de trabajo ya contenia cambios no rastreados o pendientes en `db/schema.sql` y `docs/` antes de crear este documento. No fueron modificados por la auditoria.

## Resumen de arquitectura

| Area | Estado actual |
| --- | --- |
| Framework | Next.js `16.2.6`, React `19.2.4`, TypeScript estricto (`typescript` `^5`). |
| Router | App Router: rutas y Route Handlers bajo `app/`; no existe directorio `pages/`. |
| Paquetes | npm, identificado por `package-lock.json` y scripts npm. |
| UI | Tailwind CSS 4, CSS global, `next/font`, `next/image`, componentes React de servidor y cliente. |
| Datos | PostgreSQL consultado directamente mediante `pg`; Supabase se usa para autenticacion y dispone de clientes SSR/admin. |
| Estado de carrito | Zustand persistido en el navegador (`localStorage`). |
| Despliegue | Preparado para Vercel por ser Next.js, pero no hay `vercel.json`, `.vercel/`, cron ni workflows CI versionados. |

La tienda publica renderiza dinamicamente el catalogo desde PostgreSQL mediante `lib/products.ts`. El panel administrativo usa las mismas tablas mediante consultas `pg` y Route Handlers protegidos. Supabase Auth mantiene la sesion, pero las operaciones de catalogo no usan PostgREST ni tipos generados de Supabase.

## Rutas y flujos

### Paginas

| Ruta | Funcion |
| --- | --- |
| `/` | Portada con agrupadores, destacados y productos ordenados como mas vendidos. |
| `/tienda` | Catalogo con filtro por categoria y busqueda en cliente. |
| `/producto/[slug]` | Ficha, seleccion de variante y agregado al carrito. |
| `/destacados` | Catalogo filtrado por `is_featured`. |
| `/agrupador/[slug]` | Productos asociados manualmente a un agrupador. |
| `/carrito` | Carrito local y enlace de confirmacion manual por WhatsApp. |
| `/login` | Inicio de sesion con correo/contrasena. |
| `/admin/*` | CRUD de productos, categorias, agrupadores, tallas y colores; requiere sesion administrativa autorizada. |

### Rutas API actuales

Todas las rutas de mutacion de catalogo estan bajo los matchers protegidos de `proxy.ts`.

| Endpoint | Metodos | Responsabilidad |
| --- | --- | --- |
| `/api/admin/session` | GET | Comprueba sesion y autorizacion administrativa. |
| `/api/admin/images` | GET, POST | Lista y sube imagenes a `public/images`. |
| `/api/productos` | GET, POST | Lista completa y crea productos con variantes. |
| `/api/productos/[id]` | GET, PATCH, DELETE | Consulta, actualiza y elimina productos. |
| `/api/categorias`, `/api/categorias/[id]` | GET, POST, PATCH, DELETE | CRUD de categorias. |
| `/api/agrupadores`, `/api/agrupadores/[id]` | GET, POST, PATCH, DELETE | CRUD y asociacion de agrupadores. |
| `/api/tallas`, `/api/tallas/[id]` | GET, POST, PATCH, DELETE | CRUD de opciones de talla. |
| `/api/colores`, `/api/colores/[id]` | GET, POST, PATCH, DELETE | CRUD de opciones de color. |

No existen endpoints para agente, webhooks de Meta/WhatsApp, catalogo Meta, cron, pedidos, pagos, reservas ni publicaciones sociales.

### Flujo de compra actual

1. El cliente selecciona una variante; el stock mostrado limita la cantidad solo en el navegador.
2. El item se conserva en Zustand/localStorage, sin persistencia de carrito en servidor.
3. En `/carrito`, se construye un mensaje prellenado y se abre WhatsApp mediante un enlace `wa.me`.
4. Despacho, pago y confirmacion se coordinan manualmente.

No se crea pedido, no se descuenta ni reserva inventario, no se revalida precio/stock al confirmar y no hay integracion con la API oficial de WhatsApp.

## Autenticacion y autorizacion

- Supabase SSR (`@supabase/ssr`) crea clientes de navegador, servidor y proxy.
- El login usa `signInWithPassword`; el acceso administrativo se restringe por una lista de correos configurados por entorno, con un valor de respaldo codificado.
- `proxy.ts` protege `/admin/*` y las API administrativas/de catalogo, y exige `auth.getUser()` con un correo incluido en `ADMIN_EMAILS`.
- El esquema `supabase/schema.sql` tambien plantea roles `admin` y `editor` en `app_metadata`, pero el proxy no los utiliza: autoriza exclusivamente por correo.
- Existe un cliente con service role (`lib/supabase/admin.ts`), no usado por el codigo actual. Debe permanecer exclusivamente en servidor.

## Datos, catalogo e inventario

`db/schema.sql` es el esquema que ejecuta `npm run db:init` y el que corresponde a las consultas de la aplicacion. Declara y siembra:

| Tabla o vista | Uso |
| --- | --- |
| `products` | Producto, precios normal/oferta, visibilidad, destacado, imagen y timestamps. |
| `product_variants` | Variante por producto: talla, color, stock entero y SKU unico. |
| `categories` | Categoria, slug, orden y visibilidad. |
| `category_groups` | Colecciones editoriales o comerciales. |
| `category_group_products` | Relacion muchos-a-muchos entre agrupadores y productos. |
| `product_sizes` | Catalogo administrable de tallas. |
| `product_colors` | Catalogo administrable de colores y codigo HEX. |
| `v_inventario_bot` | Vista de SKU, producto, color, talla, precio efectivo, stock, estado, categoria y agrupador. |

La fuente de precio efectivo es `coalesce(discount_price, price)`. El stock esta almacenado por `product_variants.stock`; no hay ledger de movimientos, umbral de bajo stock, reserva, bloqueo ni transaccion de decremento.

Tambien existe `supabase/schema.sql`, pero es una definicion distinta y mas limitada: incluye `profiles`, `categories`, `products` y `product_variants` con RLS. No define las tablas de opciones/agrupadores, `updated_at`, imagen de producto ni la vista de inventario usadas en produccion por el codigo. Por lo tanto, no hay un esquema canonicamente versionado y consistente.

Los tipos manuales relevantes son `CatalogProduct`/`CatalogVariant` en `lib/products.ts`; `types/product.ts` y `lib/mock-data.ts` son un modelo legado no utilizado por el flujo actual. No hay tipos generados desde Supabase.

## Componentes reutilizables

| Componente o modulo | Reutilizacion recomendada |
| --- | --- |
| `lib/products.ts` | Base para herramientas de consulta de catalogo. Debe extraerse o ampliarse con filtros seguros del agente, sin exponer SQL al modelo. |
| `lib/db.ts` | Pool PostgreSQL de servidor para repositorios/transacciones del agente. |
| `lib/supabase/server.ts` y `proxy.ts` | Patron de sesion, cookies y proteccion para panel/endpoints internos. |
| `lib/validations/product.schema.ts` | Patron Zod para contratos de entrada; el agente debe seguirlo. |
| `components/admin/*Manager.tsx` | Referencia visual y de CRUD para futuras pantallas de conversaciones, aprobaciones y borradores. |
| `components/tienda/ProductCard.tsx` y `ProductPurchasePanel.tsx` | Presentacion de producto/variante para enlaces o paneles administrativos, no para decisiones de stock. |
| `v_inventario_bot` | Punto de partida para una consulta de solo lectura del agente, despues de corregir duplicados por agrupadores y formalizar permisos. |

## Riesgos y deuda tecnica

1. **Critico: dos esquemas divergentes.** `db/schema.sql` y `supabase/schema.sql` no representan la misma base. Una migracion o entorno que use el segundo rompe las consultas reales y la seguridad esperada.
2. **Critico: no hay control de inventario transaccional.** El carrito conserva stock y precio capturados en cliente; la confirmacion por WhatsApp permite sobreventa y precios obsoletos.
3. **Alto: DDL y seed en tiempo de solicitud.** `ensureProductOptionTables()` crea/altera tablas y ejecuta datos de inicializacion desde paginas y APIs. Esto mezcla despliegue con trafico, anade latencia, exige permisos DDL a la aplicacion y es riesgoso en concurrencia.
4. **Alto: almacenamiento de imagenes no compatible con Vercel.** `POST /api/admin/images` escribe en `public/images`; el filesystem de funciones serverless es efimero y no debe usarse como almacenamiento persistente. Aun no se utiliza Supabase Storage.
5. **Alto: modelo de seguridad inconsistente.** La aplicacion usa conexion PostgreSQL directa, que evita RLS; el proxy usa correos, mientras que el SQL de Supabase define roles JWT. Se requiere una unica matriz de permisos y defensa en profundidad para acciones sensibles.
6. **Alto: APIs administrativas con validacion desigual.** Productos usan Zod, pero categorias, colores, tallas y agrupadores realizan validacion manual y retornan mensajes internos de PostgreSQL al cliente en algunos errores.
7. **Medio: no hay pruebas, CI ni verificacion de build versionada.** Lint y chequeo de tipos pasan, pero no hay cobertura de inventario, autorizacion, CRUD, MFA, RLS ni integraciones futuras.
8. **Medio: no existe modelo de pedidos, clientes ni politicas comerciales.** Textos de envio/cambios estan en UI; el agente no puede responder con fuente de verdad ni construir trazabilidad comercial.
9. **Medio: `v_inventario_bot` puede duplicar una variante por cada agrupador asociado.** No es apta para una respuesta de inventario sin agregar o seleccionar agrupador de forma determinista.
10. **Medio: datos y configuracion acoplados al codigo.** Hay telefono de WhatsApp, correo administrativo de respaldo, textos comerciales, imagenes seed y metricas del dashboard codificados; el dashboard muestra cifras de ejemplo.
11. **Bajo: modelos obsoletos.** `mock-data.ts` y `types/product.ts` no participan en la aplicacion y divergen de los tipos activos.

## Migraciones necesarias antes del agente

1. Elegir una fuente unica de migraciones, preferentemente `supabase/migrations/` con una linea base que reconcilie el esquema real de `db/schema.sql`; retirar DDL/seed de las rutas de ejecucion.
2. Normalizar el catalogo actual: constraints para precio de oferta valido, `stock >= 0`, unicidad de combinacion producto/talla/color cuando sea regla de negocio, indices por slug, estado, categoria, SKU y variante.
3. Corregir o reemplazar `v_inventario_bot` por una vista/funcion de lectura con una fila por variante y sin multiplicacion por agrupadores; exponer solo productos activos y variantes disponibles para el agente.
4. Crear `customers`, `conversations`, `conversation_messages`, `sales_leads`, `agent_runs`, `agent_actions`, `human_handoffs` y `business_policies`.
5. Crear `content_drafts`, `approvals`, `channel_listings`, `catalog_sync_jobs`, `inventory_reservations`, y posteriormente `orders`/`order_items` si el canal pasa de prospecto a venta.
6. Implementar una funcion SQL transaccional para reservar/liberar/confirmar stock con expiracion e idempotencia; el agente nunca actualiza `product_variants.stock` directamente.
7. Activar y probar RLS para tablas expuestas por Supabase; definir politicas de lector publico, operador, editor y administrador. Las operaciones de webhook y trabajo programado deben usar server-side service role minimo y auditable.
8. Generar tipos TypeScript desde el esquema Supabase y sustituir definiciones duplicadas gradualmente.

Cada migracion debe incluir rollback documentado, indices, RLS, datos seed separados y prueba en staging. No aplicar estas migraciones sin aprobacion, porque alteran datos y permisos.

## Propuesta de modulo del agente

La estructura se adapta al repositorio actual, que no usa `src/`:

```text
app/
  admin/agent/
    page.tsx
    conversations/page.tsx
    conversations/[id]/page.tsx
    approvals/page.tsx
    content/page.tsx
    settings/page.tsx
  api/
    agent/chat/route.ts
    whatsapp/webhook/route.ts
    meta/catalog/route.ts
    meta/publish/route.ts
    cron/catalog-sync/route.ts
lib/
  agent/
    instructions.ts
    runner.ts
    guardrails.ts
    schemas.ts
    tools/
      search-products.ts
      get-product-details.ts
      check-inventory.ts
      create-sales-lead.ts
      handoff-to-human.ts
  catalog/
    repository.ts
    inventory.ts
  whatsapp/
    client.ts
    signature.ts
    webhook.ts
  meta/
    catalog-feed.ts
    publishing.ts
  approvals/
    service.ts
  observability/
    audit.ts
types/
  database.ts
```

Principios de implementacion:

- Las herramientas reciben y devuelven contratos Zod; solo llaman repositorios tipados con consultas parametrizadas.
- El modelo no recibe acceso a SQL, `pg`, service role ni rutas de escritura de catalogo.
- `search_products`, `get_product_details` y `check_inventory` comienzan como solo lectura sobre productos activos y precio/stock vigente.
- Crear prospectos, reservas, modificaciones de datos, descuentos, publicaciones y mensajes fuera de la ventana permitida requieren un registro `approval` pendiente y una decision humana autenticada.
- El webhook valida challenge y firma, registra el evento externo antes de procesarlo y usa `external_message_id` unico para idempotencia.
- Las entradas y salidas de herramientas se auditan con redaccion de PII y secretos; los logs no almacenan tokens ni credenciales.
- La configuracion se incorpora a `.env.example` solo con nombres de variables vacios; habilitar el agente mediante un feature flag apagado por defecto.

## Primeros cinco Pull Requests

1. **Auditoria y linea base documental.** Incluir este informe, definir la fuente canonicamente elegida para migraciones, documentar entornos Vercel/Supabase y agregar scripts de `typecheck`/`test` sin instalar dependencias todavia.
2. **Migraciones de catalogo e inventario.** Reconciliar esquema, mover DDL/seed fuera del runtime, corregir vista de inventario, agregar constraints/indices, RLS y tipos generados. Requiere revision y aprobacion por alterar la base.
3. **Repositorio y herramientas de solo lectura.** Implementar consultas parametrizadas de productos/detalle/inventario con Zod, filtros por talla/color/precio/disponibilidad y pruebas unitarias/integracion sin modelo ni canales externos.
4. **Nucleo del agente interno.** Agregar guardrails, runner, auditoria de ejecucion, feature flag y `POST /api/agent/chat` protegido por el patron administrativo. Mantener todas las herramientas en modo lectura.
5. **Persistencia comercial y supervision.** Migrar clientes, conversaciones, mensajes, leads, corridas, acciones y handoffs; crear la primera pantalla administrativa de conversaciones y auditoria. Sin WhatsApp todavia.

Los PR posteriores serian webhook de WhatsApp con firma/idempotencia, respuesta saliente, reservas aprobables, feed Meta y borradores de contenido/aprobaciones.

## Preguntas bloqueantes

1. Que instancia y esquema de PostgreSQL es la fuente real de produccion: el definido por `db/schema.sql`, el de `supabase/schema.sql`, o una tercera instancia ya migrada? Esta decision bloquea la migracion base segura.

Respuesta: Por el momento solo existe 1 base de datos. Estamos ocupando la capa gratuita de vercel, desconozco si se puede crear una segunda base de datos.


2. Cual es la matriz de roles definitiva para personal de la tienda: lista de correos, `app_metadata.role`, tabla `profiles` o una combinacion? Bloquea las politicas RLS y los permisos de aprobacion.

Respuesta: Hasta el momento no se ha definido.

3. Cuales son las politicas comerciales oficiales y versionables de horario, despacho, cambios, pagos, reservas y descuentos? Bloquea respuestas fiables del agente sin invenciones.


Respuestas: 

Horarios Lunes a viernes de 9:00 - 18:00 Sabados 10:00 - 16:00
Despachos en el documento /polictica de despacho.txt





4. Estan disponibles las credenciales y activos externos requeridos para la siguiente fase: cuenta Meta Business, aplicacion de Meta, numero WhatsApp Business Platform, catalogo Commerce Manager, pagina Facebook e Instagram profesional? No se requieren para construir las herramientas internas, pero si para los webhooks, feed y publicacion.

## Implementacion inicial del agente

Se implemento la base interna, sin conectar canales externos ni habilitar escrituras:

- `POST /api/agent/chat`, protegido por el proxy administrativo existente.
- `/admin/agent`, pantalla de prueba para las cuatro herramientas permitidas.
- `search_products`, `get_product_details`, `check_inventory` y `get_store_information` bajo `lib/agent/tools`.
- Repositorio de catálogo con SQL parametrizado. El endpoint solo despacha una lista cerrada de herramientas; no acepta SQL ni comandos de escritura.
- Feature flag `AGENT_ENABLED=false` por defecto, validaciones Zod, errores uniformes y límite de ejecución Vercel de 10 segundos.
- Tabla `agent_tool_calls` aprobada para auditar llamadas de herramientas, con entradas/salidas redactadas por claves sensibles y métricas de duración. La migración incremental está en `db/migrations/20260803_create_agent_tool_calls.sql`.
- Pruebas unitarias nativas de Node para contratos y guardrails, más una prueba de integración opcional contra una instancia local autenticada.

Limitaciones vigentes: la prueba de integración se omite sin URL y cookie administrativa de prueba; no existe aún interpretación de lenguaje natural ni modelo de IA, por lo que el endpoint recibe el nombre explícito de la herramienta y su entrada JSON. Las políticas de despacho y cambios se devuelven solo si se configuran en variables de entorno, pues el documento de despacho indicado no está presente en el repositorio.

## PR 02 - Normalización de esquema e inventario

- La fuente canónica de estructura pasa a `db/migrations/`; `db/schema.sql` y `supabase/schema.sql` quedan preservados como referencias históricas no ejecutables.
- Las migraciones son explícitas, registradas en `schema_migrations`, y los seeds de desarrollo se separan en `db/seeds/development.sql`.
- `v_inventario_bot` se normaliza para entregar una fila por variante activa, con precios normal/oferta/efectivo, imagen, estado y agrupadores JSONB sin multiplicar inventario.
- El repositorio del agente consulta la vista normalizada. Las pantallas existentes mantienen sus consultas actuales para evitar cambios de comportamiento comercial.
- La baseline valida datos antes de agregar constraints. En la base local se detectaron cero precios inválidos, cero stocks negativos, cero SKU repetidos y cero combinaciones producto/talla/color repetidas.
- La estrategia de roles, RLS y reservas de inventario sigue siendo deuda futura fuera de este PR.

## PR 03 - Cobertura de contratos del agente

- Los contratos de salida de búsqueda, detalle, inventario e información comercial tienen pruebas unitarias que rechazan stock negativo.
- La integración HTTP verifica que `/api/agent/chat` rechaza solicitudes sin sesión y, con una cookie administrativa explícitamente inyectada, valida el contrato de las cuatro herramientas y el rechazo de herramientas no permitidas.
- La integración autenticada no crea usuarios ni almacena credenciales; requiere una instancia local ya iniciada y variables temporales de prueba.

## PR 04 - Persistencia comercial base

- Se agregaron migraciones y repositorios de servidor para clientes, conversaciones, mensajes y oportunidades de venta, sin exponer todavía canales ni endpoints de escritura.
- Mensajes externos son idempotentes por conversación y las pruebas de integración ejecutan todo dentro de una transacción con rollback.
- No se modificó stock, precios ni catálogo. Handoff, conversaciones UI, WhatsApp y reservas continúan fuera de alcance.

## PR 05 - Supervisión humana interna

- Se agregó listado y detalle administrativo de conversaciones bajo `/admin/agent/conversations`, protegido por el proxy administrativo existente.
- El administrador puede pausar/reactivar el bot, cerrar una conversación y registrar notas internas humanas. Ninguna acción envía mensajes a canales externos.
