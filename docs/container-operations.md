# Container operations

The production topology has exactly two long-running services: `web` (Next.js) and `db` (PostgreSQL 16). PostgreSQL is only reachable on the private Compose network. The host exposes `web` on `WEB_PORT`.

## Build and start

1. Copy `.env.example` to `.env` and replace every placeholder. URL-encode special characters in the password inside `DATABASE_URL`; its host must be `db`.
2. Generate `AUTH_SECRET` with at least 32 random characters. Losing or changing it invalidates stored TOTP secrets and requires an MFA reset.
3. Start the stack:

```bash
docker compose up --build -d
docker compose ps
curl --fail http://127.0.0.1:${WEB_PORT:-3000}/api/health
```

`web` starts only after PostgreSQL is healthy. Its entrypoint runs `scripts/init-db.mjs` transactionally before `server.js`; a PostgreSQL advisory lock serializes concurrent runners, and applied filenames are recorded in `schema_migrations`, so restarts are idempotent. A migration failure prevents the web server from starting.

`NEXT_PUBLIC_WHATSAPP_ORDER_PHONE` is compiled into the browser bundle. Rebuild `web` after changing it.

## First administrator

Apply migrations by starting the stack, then create or update an administrator whose email is listed in `ADMIN_EMAILS`:

```bash
read -r ADMIN_EMAIL
read -rs ADMIN_PASSWORD; export ADMIN_EMAIL ADMIN_PASSWORD
docker compose exec -e ADMIN_EMAIL -e ADMIN_PASSWORD web node scripts/create-local-admin.mjs
unset ADMIN_EMAIL ADMIN_PASSWORD
```

The first login displays a TOTP secret and requires a valid authenticator code before creating a 12-hour, HTTP-only, SameSite=Strict session. To recover from a lost authenticator, rerun the command with `--reset-mfa`; this is a privileged manual operation.

Password attempts are limited per normalized email and client address. Direct deployments keep `TRUST_PROXY_HEADERS=false` and deliberately share an untrusted-client bucket instead of accepting spoofable forwarding headers. Set `TRUST_PROXY_HEADERS=true` only behind a trusted reverse proxy that overwrites both `X-Forwarded-For` and `X-Real-IP` with a validated client address; never enable it when clients can connect directly to `WEB_PORT`.

## PostgreSQL migration

For an existing standard PostgreSQL database, stop writes, create a custom-format dump, restore it into `db`, and restart `web` so pending canonical migrations run:

```bash
pg_dump --format=custom --no-owner --no-acl "$SOURCE_DATABASE_URL" > tienda.dump
docker compose stop web
docker compose exec -T db pg_restore --clean --if-exists --no-owner --no-acl -U "$POSTGRES_USER" -d "$POSTGRES_DB" < tienda.dump
docker compose start web
```

For Supabase, dump only application schemas/tables. Do not restore Supabase platform schemas such as `auth`, `storage`, `realtime`, or their ownership/privileges. Supabase password hashes, identities, sessions, and MFA factors are not considered portable into `admin_users`; create each required local administrator explicitly and enroll MFA again.

Inspect extension-dependent objects and RLS policies before restore. The application connects directly with `pg` and does not use the Supabase Data API.

## Backup and restore

Back up both persistent domains. A database-only backup is incomplete because uploaded product images live in `uploads_data`.

```bash
docker compose exec -T db pg_dump --format=custom --no-owner --no-acl -U "$POSTGRES_USER" "$POSTGRES_DB" > tienda-$(date +%F).dump
docker run --rm -v tienda-ropa_uploads_data:/data:ro -v "$PWD":/backup alpine tar czf /backup/uploads-$(date +%F).tgz -C /data .
```

Restore during a maintenance window:

```bash
docker compose stop web
docker compose exec -T db pg_restore --clean --if-exists --no-owner --no-acl -U "$POSTGRES_USER" -d "$POSTGRES_DB" < tienda.dump
docker run --rm -v tienda-ropa_uploads_data:/data -v "$PWD":/backup alpine sh -c 'rm -rf /data/* && tar xzf /backup/uploads.tgz -C /data'
docker compose start web
```

Confirm the actual Compose volume name with `docker volume ls`; it changes when `COMPOSE_PROJECT_NAME` changes. Test restores periodically before relying on backups.

## Operational limits

- This is a single `web` instance with a shared local upload volume. Horizontal web scaling requires shared POSIX storage or an object store.
- The private network intentionally blocks direct PostgreSQL access from the host and outbound container traffic. Add narrowly scoped networking only when a real integration requires it.
- TLS must terminate at a reverse proxy in front of `WEB_PORT`; secure cookies require HTTPS in production.
- Compose secrets are environment variables, not a secret manager. Protect `.env`, filesystem permissions, backups, and process access.
- Keep `AUTH_SECRET` in the same encrypted backup domain as the database. Database restore without that key requires MFA reset for every administrator.
