import { Pool } from "pg";

let pool: Pool | null = null;

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL no esta definida. Configura .env.local con tu conexion PostgreSQL.",
    );
  }

  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl,
    });
  }

  return pool;
}
