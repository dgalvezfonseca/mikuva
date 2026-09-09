# Mikuva

Tienda de servicios de preservación y digitalización construida con TanStack Start, React 19,
TypeScript, Vite, Tailwind CSS v4, Bun/Node, Drizzle ORM y MySQL/MariaDB.

## Desarrollo local

Requisitos verificados:

- Node.js 22.12 o posterior (requerido por TanStack Start), o Bun compatible.
- Bun 1.4.x para los comandos documentados.
- MySQL/MariaDB accesible únicamente desde el host de la aplicación.

```bash
bun install --frozen-lockfile
cp .env.example .env
bun run db:check
bun run db:migrate
bun run db:seed:catalog
bun run dev
```

`db:migrate` modifica la base indicada por `DATABASE_URL`; se ejecuta deliberadamente y nunca forma
parte del arranque normal de la aplicación. `db:seed:catalog` sincroniza el catálogo verificado sin
eliminar pedidos históricos.

## Variables de entorno

`.env.example` contiene únicamente placeholders. Los archivos `.env*` reales están ignorados por
Git. La clasificación completa está en [ENVIRONMENT_AUDIT.md](./ENVIRONMENT_AUDIT.md).

Variables principales:

```text
DATABASE_URL=
WEB3FORMS_ACCESS_KEY=
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_ENV=test
MERCADOPAGO_WEBHOOK_SECRET=
APP_URL=
TRUST_PROXY=false
HOST=127.0.0.1
PORT=3000
```

No use credenciales de producción durante staging. `TRUST_PROXY=true` sólo debe configurarse cuando
la aplicación escuche en loopback y Apache sea el único proxy autorizado que pueda alcanzarla.

## Base de datos

El esquema está en `src/db/schema.ts`; las migraciones versionadas están en `drizzle/`.

```bash
bun run db:check     # valida esquema y snapshots
bun run db:generate  # genera una migración; no la aplica
bun run db:migrate   # aplica migraciones deliberadamente
```

En producción use dos cuentas separadas:

- runtime: `SELECT`, `INSERT`, `UPDATE` y `DELETE` únicamente sobre la base Mikuva;
- migraciones: privilegios DDL temporales durante la ventana de despliegue.

La aplicación nunca debe conectarse como `root`. El código rechaza explícitamente ese usuario con
`NODE_ENV=production`.

## Mercado Pago TEST

Checkout Pro se crea en el servidor. El navegador envía identificadores y cantidades; MySQL aporta
los precios y el servidor calcula los totales. El regreso del navegador nunca marca un pedido como
pagado.

Webhook público:

```text
POST /api/webhooks/mercadopago
```

Antes de aprobar, el handler valida la firma, limita el payload, obtiene el pago autoritativo desde
Mercado Pago y exige payment ID, estado `approved`, folio, importe exacto en centavos, MXN y la
relación con la orden local. La tabla `payment_events` aporta idempotencia. Collector, entorno y
preferencia son correlaciones adicionales: no bloquean una aprobación si Mercado Pago no garantiza
un dato presente y fiable para Checkout Pro. Los estados de servicio y de pago permanecen separados.

Usa credenciales de prueba con `MERCADOPAGO_ENV=test` y credenciales de producción con
`MERCADOPAGO_ENV=production`. El cambio y validación de
credenciales reales es trabajo manual posterior a staging.

## Contacto y privacidad

El formulario se valida en servidor, tiene honeypot y rate limit, y se reenvía a Web3Forms desde un
módulo server-only. Chatwoot, Google Maps y Matomo sólo cargan después del consentimiento de su
categoría correspondiente. Los servicios/cookies confirmados se documentan en
[`docs/cookie-services.md`](./docs/cookie-services.md).

## Validación

```bash
bun run typecheck
bun run lint
bun test
bun run build
bun audit
```

El build local usa el preset Nitro `node-server`, apto para ejecutarse detrás de Apache. No compile
en Windows para copiar ciegamente a Linux: instale con lockfile y genere el build en el servidor o
en CI Linux.

## Ejecución en servidor propio

Ejemplo conceptual para Linux; los secretos deben cargarse mediante `EnvironmentFile` de systemd y
no escribirse en el comando:

```bash
bun install --frozen-lockfile
bun run typecheck
bun run lint
bun test
bun run build
NODE_ENV=production HOST=127.0.0.1 PORT=3000 node .output/server/index.mjs
```

No deje el último comando en una terminal permanente. Use systemd con usuario no-root, Apache como
reverse proxy HTTPS y firewall sin exposición pública del puerto interno ni de MariaDB.

Antes de cualquier despliegue siga [SERVER_DEPLOY_CHECKLIST.md](./SERVER_DEPLOY_CHECKLIST.md). El
estado auditado y los bloqueos actuales están en [PRE_PRODUCTION_AUDIT.md](./PRE_PRODUCTION_AUDIT.md).

## Documentación de auditoría

- [ARCHITECTURE_AUDIT.md](./ARCHITECTURE_AUDIT.md)
- [ENVIRONMENT_AUDIT.md](./ENVIRONMENT_AUDIT.md)
- [API_INVENTORY.md](./API_INVENTORY.md)
- [THREAT_MODEL.md](./THREAT_MODEL.md)
- [SERVER_DEPLOY_CHECKLIST.md](./SERVER_DEPLOY_CHECKLIST.md)
- [PRE_PRODUCTION_AUDIT.md](./PRE_PRODUCTION_AUDIT.md)
