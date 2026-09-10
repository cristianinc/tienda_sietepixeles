import { config } from "dotenv";
import pg from "pg";
import { hashPassword } from "../lib/auth/security.mjs";

config({ path: ".env.local" });
config();

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (!email || !password) {
  throw new Error("Define ADMIN_EMAIL y ADMIN_PASSWORD solo para ejecutar este comando.");
}

const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((value) => value.trim().toLowerCase());
if (!adminEmails.includes(email)) throw new Error("ADMIN_EMAIL debe estar incluido en ADMIN_EMAILS.");

const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
if (!databaseUrl) throw new Error("Define DATABASE_URL antes de crear el administrador.");

const resetMfa = process.argv.includes("--reset-mfa");
const usesSsl = databaseUrl.includes("sslmode=require");
const normalizedUrl = new URL(databaseUrl);
normalizedUrl.searchParams.delete("sslmode");
const client = new pg.Client({
  connectionString: usesSsl ? normalizedUrl.toString() : databaseUrl,
  ssl: usesSsl ? { rejectUnauthorized: false } : undefined,
});

await client.connect();
try {
  const passwordHash = await hashPassword(password);
  await client.query(
    `insert into admin_users (email, password_hash)
     values ($1, $2)
     on conflict (email) do update
     set password_hash = excluded.password_hash,
         totp_secret_encrypted = case when $3 then null else admin_users.totp_secret_encrypted end,
         is_active = true,
         updated_at = now()`,
    [email, passwordHash, resetMfa],
  );
} finally {
  await client.end();
}

console.log(`Administrador local actualizado: ${email}`);
