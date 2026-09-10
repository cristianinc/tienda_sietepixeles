# Tienda de ropa autoadministrable

Next.js 16 application backed directly by PostgreSQL. Production runs with exactly two long-running Compose services: `web` and `db`. It has no runtime dependency on Vercel or Supabase.

## Local development

```bash
cp .env.example .env.local
npm ci
npm run db:init
npm run db:seed
npm run dev
```

For local commands, use a host-reachable `DATABASE_URL` instead of the Compose hostname `db`. Development seed data is optional and must never be applied automatically in production.

Create an administrator after applying migrations:

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='replace-this-password' npm run local:admin
```

The email must also be present in `ADMIN_EMAILS`. The first login enrolls TOTP MFA.

## Production

See [`docs/container-operations.md`](docs/container-operations.md) for build/start, migration from PostgreSQL or Supabase, administrator enrollment, backup/restore, and operational limits.

The canonical schema lives in `db/migrations/`. `scripts/init-db.mjs` applies each migration transactionally and records it in `schema_migrations`.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
docker compose config --services
```

`docker compose config --services` must print only `db` and `web`.
