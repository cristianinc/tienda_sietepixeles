import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import pg from "pg";

config({ path: ".env.local" });
config();

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_PRISMA_URL;

if (!databaseUrl) {
  throw new Error("No hay conexion PostgreSQL configurada para inicializar la base.");
}

const usesSsl = databaseUrl.includes("supabase.com") || databaseUrl.includes("sslmode=require");

function normalizeConnectionString(value) {
  const url = new URL(value);
  url.searchParams.delete("sslmode");
  return url.toString();
}

const client = new pg.Client({
  connectionString: usesSsl ? normalizeConnectionString(databaseUrl) : databaseUrl,
  ssl: usesSsl ? { rejectUnauthorized: false } : undefined,
});

await client.connect();

try {
  const schema = await readFile("db/schema.sql", "utf8");
  await client.query(schema);
  const { rows } = await client.query("select count(*)::int as count from products");
  console.log(`Base inicializada correctamente. Productos: ${rows[0].count}`);
} finally {
  await client.end();
}
