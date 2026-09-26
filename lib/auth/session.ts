import type { Pool, PoolClient } from "pg";
import { getDb } from "../db.ts";
import { isAdminEmail } from "./admin.ts";
import { createToken, hashToken, verifyPassword } from "./security.mjs";

export const sessionCookieName = "admin_session";
export const sessionMaxAgeSeconds = 12 * 60 * 60;

type AdminUser = {
  id: number;
  email: string;
  password_hash: string;
  is_active: boolean;
};

export function authCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge,
  };
}

export async function login(
  email: string,
  password: string,
  clientAddress: string,
  database: Pick<Pool, "query" | "connect"> = getDb(),
) {
  const normalizedEmail = email.trim().toLowerCase();
  const rateLimitKey = hashToken(`${clientAddress}|${normalizedEmail}`);
  const rateLimit = await database.query<{ attempts: number }>(
    `select attempts from admin_login_rate_limits
     where bucket_key = $1 and window_started_at > now() - interval '15 minutes'`,
    [rateLimitKey],
  );
  if ((rateLimit.rows[0]?.attempts ?? 0) >= 10) return null;

  const { rows } = await database.query<AdminUser>(
    "select id, email, password_hash, is_active from admin_users where email = $1",
    [normalizedEmail],
  );
  const user = rows[0];
  if (!user || !user.is_active || !isAdminEmail(user.email) || !(await verifyPassword(password, user.password_hash))) {
    await database.query(
      `insert into admin_login_rate_limits (bucket_key, attempts, window_started_at)
       values ($1, 1, now())
       on conflict (bucket_key) do update
       set attempts = case
             when admin_login_rate_limits.window_started_at <= now() - interval '15 minutes' then 1
             else admin_login_rate_limits.attempts + 1
           end,
           window_started_at = case
             when admin_login_rate_limits.window_started_at <= now() - interval '15 minutes' then now()
             else admin_login_rate_limits.window_started_at
           end`,
      [rateLimitKey],
    );
    return null;
  }

  const client = await database.connect();
  try {
    await client.query("begin");
    await client.query("delete from admin_login_rate_limits where bucket_key = $1", [rateLimitKey]);
    await client.query("delete from admin_sessions where expires_at <= now() or admin_user_id = $1", [user.id]);
    const token = await insertSession(client, user.id);
    await client.query("commit");
    return { token, email: user.email };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function insertSession(client: PoolClient, userId: number) {
  const token = createToken();
  await client.query(
    `insert into admin_sessions (token_hash, admin_user_id, expires_at)
     values ($1, $2, now() + interval '12 hours')`,
    [hashToken(token), userId],
  );
  return token;
}

export async function getSessionUser(token: string | undefined) {
  if (!token) return null;
  const { rows } = await getDb().query<{ id: number; email: string }>(
    `select u.id, u.email
     from admin_sessions s
     join admin_users u on u.id = s.admin_user_id
     where s.token_hash = $1 and s.expires_at > now() and u.is_active = true`,
    [hashToken(token)],
  );
  return rows[0] ?? null;
}

export async function getAdminSession(token: string | undefined) {
  const user = await getSessionUser(token);
  return user && isAdminEmail(user.email) ? user : null;
}

export async function revokeSession(token: string | undefined) {
  if (!token) return;
  await getDb().query("delete from admin_sessions where token_hash = $1", [hashToken(token)]);
}
