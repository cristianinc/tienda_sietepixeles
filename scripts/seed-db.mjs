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
  throw new Error("No hay conexion PostgreSQL configurada para ejecutar el seed.");
}

const usesSsl = databaseUrl.includes("sslmode=require");
const normalizedUrl = new URL(databaseUrl);
normalizedUrl.searchParams.delete("sslmode");

const client = new pg.Client({
  connectionString: usesSsl ? normalizedUrl.toString() : databaseUrl,
  ssl: usesSsl ? { rejectUnauthorized: false } : undefined,
});

await client.connect();

try {
  await client.query(await readFile("db/seeds/development.sql", "utf8"));
  console.log("Seed de desarrollo aplicado.");
} finally {
  await client.end();
}
