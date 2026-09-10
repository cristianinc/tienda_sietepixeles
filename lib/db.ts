import { Pool } from "pg";

let pool: Pool | null = null;

function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL_NON_POOLING ??
      process.env.POSTGRES_URL
  );
}

function normalizeConnectionString(databaseUrl: string) {
  const url = new URL(databaseUrl);
  url.searchParams.delete("sslmode");
  return url.toString();
}

export function getDb() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error(
      "No hay conexion PostgreSQL configurada. Define DATABASE_URL, POSTGRES_URL_NON_POOLING o POSTGRES_URL.",
    );
  }

  if (!pool) {
    const usesSsl = databaseUrl.includes("sslmode=require");

    pool = new Pool({
      connectionString: usesSsl ? normalizeConnectionString(databaseUrl) : databaseUrl,
      ssl: usesSsl ? { rejectUnauthorized: false } : undefined,
    });
  }

  return pool;
}
