import type { PoolClient } from "pg";
import { getDb } from "@/lib/db";
import { isAdminEmail } from "@/lib/auth/admin";
import {
  createToken,
  createTotpSecret,
  decryptSecret,
  encryptSecret,
  hashToken,
  verifyPassword,
  verifyTotp,
} from "@/lib/auth/security.mjs";

export const sessionCookieName = "admin_session";
export const challengeCookieName = "admin_login_challenge";
export const sessionMaxAgeSeconds = 12 * 60 * 60;
export const challengeMaxAgeSeconds = 5 * 60;

type AdminUser = {
  id: number;
  email: string;
  password_hash: string;
  totp_secret_encrypted: string | null;
  is_active: boolean;
};

function authSecret() {
  return process.env.AUTH_SECRET ?? "";
}

export function authCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge,
  };
}

export async function beginLogin(email: string, password: string, clientAddress: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const rateLimitKey = hashToken(`${clientAddress}|${normalizedEmail}`);
  const rateLimit = await getDb().query<{ attempts: number }>(
    `select attempts from admin_login_rate_limits
     where bucket_key = $1 and window_started_at > now() - interval '15 minutes'`,
    [rateLimitKey],
  );
  if ((rateLimit.rows[0]?.attempts ?? 0) >= 10) return null;

  const { rows } = await getDb().query<AdminUser>(
    "select id, email, password_hash, totp_secret_encrypted, is_active from admin_users where email = $1",
    [normalizedEmail],
  );
  const user = rows[0];
  if (!user || !user.is_active || !isAdminEmail(user.email) || !(await verifyPassword(password, user.password_hash))) {
    await getDb().query(
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

  await getDb().query("delete from admin_login_rate_limits where bucket_key = $1", [rateLimitKey]);
  const token = createToken();
  const setupSecret = user.totp_secret_encrypted ? null : createTotpSecret();
  await getDb().query("delete from admin_login_challenges where expires_at <= now() or admin_user_id = $1", [user.id]);
  await getDb().query(
    `insert into admin_login_challenges
      (token_hash, admin_user_id, purpose, pending_totp_secret_encrypted, expires_at)
     values ($1, $2, $3, $4, now() + interval '5 minutes')`,
    [
      hashToken(token),
      user.id,
      setupSecret ? "setup" : "login",
      setupSecret ? encryptSecret(setupSecret, authSecret()) : null,
    ],
  );

  return { token, purpose: setupSecret ? "setup" : "login", setupSecret, email: user.email } as const;
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

export async function completeLogin(challengeToken: string, code: string) {
  const client = await getDb().connect();
  try {
    await client.query("begin");
    const { rows } = await client.query<AdminUser & {
      challenge_hash: string;
      purpose: "setup" | "login";
      pending_totp_secret_encrypted: string | null;
      attempts: number;
    }>(
      `select u.id, u.email, u.password_hash, u.totp_secret_encrypted, u.is_active,
              c.token_hash as challenge_hash, c.purpose, c.pending_totp_secret_encrypted, c.attempts
       from admin_login_challenges c
       join admin_users u on u.id = c.admin_user_id
       where c.token_hash = $1 and c.expires_at > now()
       for update`,
      [hashToken(challengeToken)],
    );
    const challenge = rows[0];
    if (!challenge || !challenge.is_active || !isAdminEmail(challenge.email) || challenge.attempts >= 5) {
      await client.query("rollback");
      return null;
    }

    const encryptedSecret = challenge.pending_totp_secret_encrypted ?? challenge.totp_secret_encrypted;
    const valid = encryptedSecret && verifyTotp(decryptSecret(encryptedSecret, authSecret()), code);
    if (!valid) {
      await client.query("update admin_login_challenges set attempts = attempts + 1 where token_hash = $1", [
        challenge.challenge_hash,
      ]);
      await client.query("commit");
      return null;
    }

    if (challenge.purpose === "setup") {
      await client.query("update admin_users set totp_secret_encrypted = $1, updated_at = now() where id = $2", [
        challenge.pending_totp_secret_encrypted,
        challenge.id,
      ]);
    }
    await client.query("delete from admin_login_challenges where token_hash = $1", [challenge.challenge_hash]);
    await client.query("delete from admin_sessions where expires_at <= now() or admin_user_id = $1", [challenge.id]);
    const sessionToken = await insertSession(client, challenge.id);
    await client.query("commit");
    return { token: sessionToken, email: challenge.email };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
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
