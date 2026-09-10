# Plan de trabajo — Agente virtual para tienda de ropa

## 1. Objetivo

Construir un agente comercial integrado con la tienda existente para:

1. Consultar productos, variantes, precios y stock desde Supabase.
2. Atender consultas de clientes por WhatsApp.
3. Mantener sincronizado el catálogo con Meta.
4. Preparar contenido para Instagram y Facebook.
5. Permitir aprobación humana antes de publicar, descontar, reservar o modificar datos sensibles.
6. Registrar conversaciones, acciones, errores y oportunidades de venta.

## 2. Arquitectura objetivo

```text
Instagram / Facebook / WhatsApp
              |
              v
       API y webhooks Meta
              |
              v
   Next.js desplegado en Vercel
   - Agente comercial
   - Herramientas controladas
   - Panel administrativo
   - Endpoints y tareas programadas
              |
              v
           Supabase
   - Productos y variantes
   - Inventario
   - Clientes y conversaciones
   - Pedidos y reservas
   - Borradores y aprobaciones
   - Auditoría del agente
```

### Fuente única de verdad

Supabase será la fuente única para:

- Productos.
- Precios.
- Variantes.
- Stock.
- Pedidos.
- Políticas comerciales.
- Estado de publicaciones y sincronizaciones.

El modelo de IA nunca modificará directamente tablas sensibles. Todas las acciones pasarán por funciones de aplicación validadas.

## 3. Principios técnicos

- Empezar con un solo agente comercial.
- Separar IA de reglas de negocio.
- No permitir SQL generado por el modelo.
- Implementar herramientas pequeñas y tipadas.
- Exigir aprobación humana para acciones sensibles.
- Registrar cada ejecución y cada herramienta utilizada.
- Diseñar integraciones idempotentes.
- Validar la firma de los webhooks.
- Mantener secretos únicamente en variables de entorno.
- Implementar primero el flujo de WhatsApp y después la publicación automática.

## 4. Alcance del MVP

### Incluido

- Lectura del catálogo desde Supabase.
- Búsqueda de productos por nombre, categoría, talla, color y precio.
- Consulta de stock real.
- Recepción de mensajes desde WhatsApp.
- Respuestas automáticas sobre productos, horarios, ubicación, despacho y cambios.
- Creación de oportunidades de venta.
- Transferencia de una conversación a atención humana.
- Historial de conversaciones.
- Generación de borradores para redes sociales.
- Pantalla de aprobación de borradores.
- Feed inicial de catálogo para Meta.
- Registro de errores de sincronización.

### Fuera del primer MVP

- Descuentos decididos automáticamente.
- Devoluciones aprobadas automáticamente.
- Campañas masivas autónomas.
- Modificación automática de precios.
- Publicación sin aprobación.
- Multiagentes.
- Pronósticos avanzados de demanda.
- Automatización no oficial de WhatsApp Web.
- Publicación automática en Marketplace sin confirmar antes la disponibilidad de la cuenta.

## 5. Fases de desarrollo

---

## Fase 0 — Auditoría del proyecto actual

### Objetivo

Entender el código existente antes de agregar módulos.

### Tareas

- Detectar framework y versión.
- Confirmar si utiliza App Router o Pages Router.
- Revisar autenticación administrativa.
- Revisar cliente y servidor de Supabase.
- Identificar tablas actuales.
- Identificar cómo se modelan productos, variantes y stock.
- Revisar flujo actual de compra.
- Revisar almacenamiento de imágenes.
- Revisar variables de entorno.
- Revisar configuración de Vercel.
- Ejecutar lint, typecheck, tests y build.
- Crear documento de hallazgos.

### Entregable

`docs/current-state-audit.md`

### Criterio de aceptación

El documento debe explicar:

- Arquitectura actual.
- Riesgos.
- Dependencias.
- Tablas existentes.
- Rutas principales.
- Qué componentes se reutilizan.
- Qué migraciones serán necesarias.

---

## Fase 1 — Base del módulo del agente

### Objetivo

Crear la estructura técnica sin conectar todavía canales externos.

### Estructura propuesta

```text
src/
├── app/
│   ├── admin/
│   │   └── agent/
│   │       ├── page.tsx
│   │       ├── conversations/
│   │       ├── approvals/
│   │       └── settings/
│   └── api/
│       ├── agent/
│       │   └── chat/route.ts
│       ├── whatsapp/
│       │   └── webhook/route.ts
│       ├── meta/
│       │   ├── catalog/route.ts
│       │   └── publish/route.ts
│       └── cron/
│           └── catalog-sync/route.ts
├── lib/
│   ├── agent/
│   │   ├── instructions.ts
│   │   ├── runner.ts
│   │   ├── tools.ts
│   │   ├── schemas.ts
│   │   └── guardrails.ts
│   ├── whatsapp/
│   ├── meta/
│   ├── catalog/
│   ├── supabase/
│   └── observability/
└── types/
```

Adaptar la ruta `src/` a la estructura real del repositorio.

### Tareas

- Crear módulo `lib/agent`.
- Definir instrucciones del agente.
- Definir herramientas con esquemas de entrada y salida.
- Crear manejo uniforme de errores.
- Crear sistema de auditoría.
- Crear endpoint de prueba `/api/agent/chat`.
- Proteger endpoint para uso administrativo.
- Añadir feature flag para desactivar el agente.
- Añadir límites de ejecución y timeout.

### Herramientas iniciales

```text
search_products
get_product_details
check_inventory
get_store_information
get_shipping_policy
get_exchange_policy
create_sales_lead
handoff_to_human
```

### Criterio de aceptación

Desde un entorno de desarrollo debe ser posible enviar:

```json
{
  "message": "¿Tienen vestidos negros talla M?"
}
```

Y obtener una respuesta basada exclusivamente en datos reales o políticas almacenadas.

---

## Fase 2 — Modelo de datos

### Objetivo

Agregar las tablas necesarias sin romper el esquema actual.

### Tablas propuestas

```text
customers
conversations
conversation_messages
sales_leads
agent_runs
agent_actions
human_handoffs
business_policies
channel_listings
catalog_sync_jobs
content_drafts
approvals
inventory_reservations
```

### Campos mínimos sugeridos

#### conversations

```text
id
channel
external_conversation_id
customer_id
status
assigned_to
last_message_at
created_at
updated_at
```

#### conversation_messages

```text
id
conversation_id
direction
sender_type
external_message_id
message_type
content
metadata
created_at
```

#### agent_runs

```text
id
conversation_id
status
model
input
output
error
started_at
completed_at
```

#### agent_actions

```text
id
agent_run_id
tool_name
tool_input
tool_output
status
requires_approval
created_at
```

#### approvals

```text
id
action_type
resource_type
resource_id
status
requested_by
reviewed_by
reviewed_at
notes
created_at
```

### Seguridad

- Activar RLS en tablas expuestas.
- Usar service role solo en código del servidor.
- No enviar claves administrativas al navegador.
- Separar permisos de lectura y escritura.
- Crear migraciones reversibles.
- Añadir índices para búsquedas por canal, cliente, fecha y estado.

### Criterio de aceptación

- Migraciones aplicables en local y staging.
- RLS validado.
- Tipos TypeScript regenerados.
- Datos de prueba disponibles mediante seed.

---

## Fase 3 — Catálogo y herramientas de productos

### Objetivo

Permitir que el agente consulte el inventario correctamente.

### Tareas

- Normalizar búsqueda de texto.
- Soportar filtros por:
  - Categoría.
  - Talla.
  - Color.
  - Precio.
  - Disponibilidad.
- Crear función de detalle de producto.
- Crear función de stock por variante.
- Evitar mostrar productos inactivos.
- Evitar prometer stock inexistente.
- Crear URLs directas a productos.
- Definir respuesta cuando un dato no exista.
- Añadir pruebas de herramientas.

### Contrato de ejemplo

```ts
type SearchProductsInput = {
  query?: string;
  category?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  onlyAvailable?: boolean;
  limit?: number;
};
```

### Criterios de aceptación

- Toda recomendación incluye productos existentes.
- Precio y stock provienen de Supabase.
- La respuesta no inventa variantes.
- El agente reconoce cuando no hay coincidencias.
- Las herramientas pueden probarse sin llamar al modelo.

---

## Fase 4 — WhatsApp Business Platform

### Objetivo

Recibir y responder mensajes reales.

### Requisitos externos

- Cuenta de Meta Business.
- Aplicación en Meta Developers.
- Número habilitado para WhatsApp Business Platform.
- Token y permisos correspondientes.
- Webhook público.
- Token de verificación.
- Plantillas aprobadas para mensajes iniciados por la empresa cuando corresponda.

### Endpoints

```text
GET  /api/whatsapp/webhook
POST /api/whatsapp/webhook
```

### Flujo

```text
1. Meta envía el webhook.
2. Se valida la firma.
3. Se verifica idempotencia mediante external_message_id.
4. Se guarda el mensaje.
5. Se carga el contexto de la conversación.
6. El agente selecciona herramientas.
7. Se genera la respuesta.
8. Se envía por WhatsApp.
9. Se guarda la respuesta y las acciones.
10. Se escala a humano cuando corresponde.
```

### Reglas de transferencia a humano

- Cliente solicita hablar con una persona.
- Reclamo o devolución.
- Pago no reconocido.
- Pedido perdido.
- Solicitud fuera de políticas.
- Baja confianza del agente.
- Error de herramientas.
- Lenguaje agresivo o situación sensible.
- El agente falla dos veces en la misma intención.

### Criterios de aceptación

- Un mensaje de prueba crea una conversación.
- Los mensajes repetidos no se procesan dos veces.
- La respuesta consulta stock real.
- El historial queda guardado.
- Existe un mecanismo de pausa del bot por conversación.
- Una persona puede retomar la conversación.

---

## Fase 5 — Panel administrativo

### Objetivo

Permitir supervisión humana.

### Pantallas

```text
/admin/agent
/admin/agent/conversations
/admin/agent/conversations/[id]
/admin/agent/leads
/admin/agent/approvals
/admin/agent/content
/admin/agent/settings
/admin/agent/logs
```

### Funciones

- Ver conversaciones.
- Filtrar por estado y canal.
- Pausar o activar el agente.
- Asignar conversación.
- Responder manualmente.
- Revisar herramientas ejecutadas.
- Ver errores.
- Aprobar o rechazar contenido.
- Configurar políticas.
- Ver oportunidades de venta.

### Criterio de aceptación

El dueño de la tienda puede comprender qué hizo el agente, intervenir y desactivarlo sin acceder a Supabase directamente.

---

## Fase 6 — Catálogo Meta

### Objetivo

Sincronizar productos con Meta empezando por un feed controlado.

### Primera implementación

```text
GET /api/meta/catalog
```

La respuesta será un feed CSV o XML generado desde Supabase.

### Campos esperados

```text
id
title
description
availability
condition
price
link
image_link
brand
color
size
```

### Tareas

- Mapear productos y variantes.
- Validar imágenes.
- Excluir productos incompletos.
- Formatear moneda.
- Crear URL estable.
- Proteger el feed mediante un token cuando sea compatible.
- Registrar errores.
- Crear trabajo programado de revisión.
- Añadir `channel_listings`.

### Criterio de aceptación

Commerce Manager puede leer el feed y los cambios de precio o disponibilidad se reflejan sin edición manual duplicada.

---

## Fase 7 — Contenido para Instagram y Facebook

### Objetivo

Crear borradores; no publicar automáticamente en la primera versión.

### Flujo

```text
Producto o campaña seleccionada
             |
             v
Agente genera propuesta
             |
             v
content_drafts
             |
             v
Aprobación humana
             |
             v
Publicación manual o por API
```

### Datos del borrador

- Canal.
- Objetivo.
- Productos incluidos.
- Texto.
- Llamado a la acción.
- Hashtags.
- Recursos visuales.
- Fecha sugerida.
- Estado.
- Aprobación.

### Reglas

- No inventar descuentos.
- No modificar precios.
- No afirmar disponibilidad sin consultar stock.
- No publicar sin aprobación.
- No reutilizar imágenes sin una URL válida.
- Guardar la versión aprobada.

### Criterio de aceptación

El usuario puede seleccionar un producto, generar una publicación, editarla, aprobarla y registrar su publicación.

---

## Fase 8 — Reservas y borradores de pedido

### Objetivo

Convertir conversaciones en oportunidades concretas sin automatizar el cobro.

### Funciones

```text
create_sales_lead
create_order_draft
create_inventory_reservation
release_inventory_reservation
```

### Reglas

- Reserva con expiración.
- No reservar más stock del disponible.
- Transacción de base de datos para evitar sobreventa.
- Confirmación humana para reservas especiales.
- Enlace de compra cuando sea posible.
- Registro del origen del pedido.

### Criterio de aceptación

Una conversación puede convertirse en un prospecto o pedido preliminar trazable, sin alterar incorrectamente el inventario.

---

## Fase 9 — Observabilidad, seguridad y pruebas

### Pruebas mínimas

- Unitarias para herramientas.
- Integración para Supabase.
- Webhook de WhatsApp.
- Idempotencia.
- RLS.
- Validación de firmas.
- Flujo de transferencia humana.
- Feed Meta.
- E2E del panel administrativo.

### Métricas

- Conversaciones iniciadas.
- Conversaciones resueltas.
- Transferencias a humano.
- Tiempo de primera respuesta.
- Productos más consultados.
- Errores por herramienta.
- Oportunidades creadas.
- Conversión a pedido.
- Borradores creados y aprobados.

### Alertas

- Webhook fallando.
- Token próximo a expirar.
- Errores repetidos de Meta.
- Agente sin poder consultar stock.
- Cola de mensajes atrasada.
- Muchas transferencias humanas.
- Fallos de sincronización de catálogo.

## 6. Variables de entorno

Crear `.env.example` sin valores reales:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

OPENAI_API_KEY=
OPENAI_MODEL=

META_APP_ID=
META_APP_SECRET=
META_VERIFY_TOKEN=
META_ACCESS_TOKEN=

WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=

META_CATALOG_ID=
META_PAGE_ID=
META_INSTAGRAM_ACCOUNT_ID=

AGENT_ENABLED=false
CATALOG_FEED_TOKEN=
CRON_SECRET=
```

Nunca incluir secretos en Git.

## 7. Backlog inicial para GitHub Issues

### Epic A — Auditoría

- A1. Documentar arquitectura actual.
- A2. Documentar esquema Supabase.
- A3. Revisar autenticación y seguridad.
- A4. Definir estrategia de migraciones.

### Epic B — Núcleo del agente

- B1. Crear módulo del agente.
- B2. Definir instrucciones.
- B3. Crear contratos de herramientas.
- B4. Implementar auditoría.
- B5. Crear endpoint de chat interno.

### Epic C — Catálogo

- C1. Implementar búsqueda.
- C2. Implementar detalle.
- C3. Implementar consulta de stock.
- C4. Implementar políticas comerciales.
- C5. Añadir pruebas.

### Epic D — WhatsApp

- D1. Configurar webhook.
- D2. Validar firma.
- D3. Guardar mensajes.
- D4. Ejecutar agente.
- D5. Enviar respuesta.
- D6. Implementar transferencia humana.
- D7. Implementar idempotencia.

### Epic E — Panel

- E1. Lista de conversaciones.
- E2. Detalle de conversación.
- E3. Pausa y reactivación.
- E4. Respuesta humana.
- E5. Lista de oportunidades.
- E6. Registro de acciones.

### Epic F — Meta

- F1. Generar feed.
- F2. Validar productos.
- F3. Registrar sincronización.
- F4. Configurar Commerce Manager.
- F5. Manejar errores.

### Epic G — Contenido

- G1. Modelo de borradores.
- G2. Generación de contenido.
- G3. Edición.
- G4. Aprobaciones.
- G5. Publicación controlada.

## 8. Orden recomendado de Pull Requests

```text
PR 01 — Auditoría y documentación
PR 02 — Migraciones base y tipos
PR 03 — Herramientas de catálogo
PR 04 — Runner del agente y endpoint interno
PR 05 — Persistencia de conversaciones
PR 06 — Webhook de WhatsApp
PR 07 — Envío de mensajes y handoff
PR 08 — Panel de conversaciones
PR 09 — Feed de catálogo Meta
PR 10 — Borradores de contenido
PR 11 — Aprobaciones
PR 12 — Observabilidad y endurecimiento
```

Cada PR debe ser pequeño, ejecutable, probado y reversible.

## 9. Definición de terminado

Una tarea se considera terminada cuando:

- Compila.
- Pasa lint y typecheck.
- Incluye pruebas relevantes.
- No expone secretos.
- Tiene manejo de errores.
- Tiene logs útiles sin datos sensibles.
- Documenta nuevas variables de entorno.
- Incluye migración cuando modifica la base.
- Incluye criterio de rollback.
- Puede probarse localmente.
- Cumple su criterio de aceptación.

## 10. Primer prompt para OpenCode

Copiar este prompt en la raíz del repositorio:

```text
Actúa como arquitecto y desarrollador senior de Next.js, TypeScript, Vercel y Supabase.

Estamos construyendo un agente comercial para una tienda de ropa. El sistema debe consultar productos, variantes, precios y stock desde Supabase, atender WhatsApp mediante la API oficial de Meta, preparar contenido para Instagram y Facebook y requerir aprobación humana para acciones sensibles.

En esta primera tarea NO modifiques ningún archivo.

1. Inspecciona la estructura completa del repositorio.
2. Identifica:
   - framework y versión;
   - App Router o Pages Router;
   - gestor de paquetes;
   - autenticación;
   - integración con Supabase;
   - tablas o tipos existentes;
   - estructura de productos, variantes y stock;
   - flujo de compra;
   - rutas API;
   - configuración de Vercel;
   - pruebas existentes;
   - convenciones del proyecto.
3. Ejecuta únicamente comandos seguros de lectura y validación.
4. No muestres ni copies valores de secretos.
5. Produce un informe en `docs/current-state-audit.md`.
6. Incluye:
   - resumen de arquitectura;
   - componentes reutilizables;
   - riesgos;
   - deuda técnica relevante;
   - migraciones necesarias;
   - propuesta de estructura para el módulo del agente;
   - plan de los primeros cinco Pull Requests;
   - preguntas bloqueantes, solo cuando no puedan resolverse inspeccionando el código.
7. Antes de crear el informe, presenta un resumen de los cambios que pretendes hacer.
8. No instales paquetes y no cambies código de producción en esta tarea.
```

## 11. Segundo prompt para OpenCode

Usar después de revisar y aprobar la auditoría:

```text
Lee `docs/current-state-audit.md` y este plan de trabajo.

Implementa únicamente la base del módulo del agente y las herramientas de lectura del catálogo.

Alcance:
- estructura de carpetas adaptada al proyecto real;
- esquemas tipados de entrada y salida;
- search_products;
- get_product_details;
- check_inventory;
- get_store_information;
- guardrails básicos;
- manejo uniforme de errores;
- auditoría de llamadas;
- endpoint administrativo de prueba;
- pruebas unitarias e integración;
- documentación de variables de entorno.

Restricciones:
- no conectar WhatsApp todavía;
- no publicar en Meta;
- no modificar precios ni stock;
- no permitir SQL libre generado por IA;
- no exponer service role al cliente;
- no instalar dependencias innecesarias;
- mantener compatibilidad con el proyecto existente;
- realizar cambios en pasos pequeños.

Antes de modificar archivos:
1. Explica el plan.
2. Enumera los archivos que crearás o cambiarás.
3. Indica migraciones necesarias.
4. Espera la aprobación del usuario si el cambio altera tablas existentes o autenticación.

Al terminar:
- ejecuta lint;
- ejecuta typecheck;
- ejecuta pruebas;
- ejecuta build;
- resume los cambios;
- informa limitaciones;
- entrega instrucciones de prueba local.
```

## 12. Flujo de trabajo en VS Code y OpenCode

1. Crear una rama:

```bash
git checkout -b feat/virtual-store-agent
```

2. Guardar este plan como:

```text
docs/virtual-store-agent-plan.md
```

3. Abrir el repositorio en VS Code.
4. Ejecutar OpenCode desde la raíz.
5. Entregar el primer prompt.
6. Revisar `docs/current-state-audit.md`.
7. Corregir supuestos.
8. Crear issues o tareas desde el backlog.
9. Ejecutar un PR por etapa.
10. Probar localmente y en un proyecto de staging antes de producción.

## 13. Primera meta de desarrollo

La primera meta funcional será:

```text
Un administrador escribe una consulta de prueba
→ el agente busca productos en Supabase
→ consulta variantes y stock
→ responde con información real
→ registra la ejecución y herramientas utilizadas
```

Todavía sin WhatsApp y sin publicación automática.

Esta base permitirá probar la seguridad y calidad del agente antes de conectarlo a clientes reales.
