import { config } from "dotenv";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

config({ path: ".env.local" });
config();

const databaseUrl =
  process.env.DATABASE_URL ?? process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;

if (!databaseUrl) {
  throw new Error("No hay conexion PostgreSQL configurada para inicializar la base.");
}

const usesSsl = databaseUrl.includes("sslmode=require");

function normalizeConnectionString(value) {
  const url = new URL(value);
  url.searchParams.delete("sslmode");
  return url.toString();
}

let client;
for (let attempt = 1; attempt <= 30; attempt += 1) {
  client = new pg.Client({
    connectionString: usesSsl ? normalizeConnectionString(databaseUrl) : databaseUrl,
    ssl: usesSsl ? { rejectUnauthorized: false } : undefined,
  });
  try {
    await client.connect();
    break;
  } catch (error) {
    await client.end().catch(() => undefined);
    if (attempt === 30) throw error;
    console.log(`PostgreSQL no esta disponible; reintento ${attempt}/30.`);
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
}

if (!client) throw new Error("No se pudo crear el cliente PostgreSQL.");

let migrationLockAcquired = false;
try {
  await client.query("select pg_advisory_lock(hashtext('tienda-ropa:schema-migrations'))");
  migrationLockAcquired = true;

  await client.query(`
    create table if not exists schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const migrationDirectory = path.join(process.cwd(), "db", "migrations");
  const migrations = (await readdir(migrationDirectory))
    .filter((filename) => filename.endsWith(".sql"))
    .sort();

  for (const filename of migrations) {
    const applied = await client.query("select 1 from schema_migrations where filename = $1", [filename]);
    if (applied.rowCount) continue;

    const migration = await readFile(path.join(migrationDirectory, filename), "utf8");
    await client.query("begin");
    try {
      await client.query(migration);
      await client.query("insert into schema_migrations (filename) values ($1)", [filename]);
      await client.query("commit");
      console.log(`Migracion aplicada: ${filename}`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }
} finally {
  try {
    if (migrationLockAcquired) {
      await client.query("select pg_advisory_unlock(hashtext('tienda-ropa:schema-migrations'))");
    }
  } finally {
    await client.end();
  }
}
