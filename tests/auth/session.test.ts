import assert from "node:assert/strict";
import test from "node:test";
import type { Pool } from "pg";
import { login } from "../../lib/auth/session.ts";
import { hashPassword } from "../../lib/auth/security.mjs";

const originalAdminEmails = process.env.ADMIN_EMAILS;
process.env.ADMIN_EMAILS = "admin@example.com";
test.after(() => {
  if (originalAdminEmails === undefined) delete process.env.ADMIN_EMAILS;
  else process.env.ADMIN_EMAILS = originalAdminEmails;
});

function createDatabase(user: { id: number; email: string; password_hash: string; is_active: boolean } | null) {
  const statements: string[] = [];
  let connected = false;

  const client = {
    async query(sql: string) {
      statements.push(sql);
      return { rows: [] };
    },
    release() {},
  };
  const database = {
    async query(sql: string) {
      statements.push(sql);
      if (sql.startsWith("select attempts")) return { rows: [] };
      if (sql.startsWith("select id, email")) return { rows: user ? [user] : [] };
      return { rows: [] };
    },
    async connect() {
      connected = true;
      return client;
    },
  };

  return {
    database: database as unknown as Pick<Pool, "query" | "connect">,
    statements,
    wasConnected: () => connected,
  };
}

test("valid email and password create a session without an MFA challenge", async () => {
  const password = "a-secure-test-password";
  const fixture = createDatabase({
    id: 7,
    email: "admin@example.com",
    password_hash: await hashPassword(password),
    is_active: true,
  });

  const session = await login(" ADMIN@example.com ", password, "127.0.0.1", fixture.database);

  assert.equal(session?.email, "admin@example.com");
  assert.ok(session?.token);
  assert.equal(fixture.wasConnected(), true);
  assert.ok(fixture.statements.some((sql) => sql.includes("insert into admin_sessions")));
  assert.equal(fixture.statements.some((sql) => /challenge|totp/i.test(sql)), false);
});

test("invalid credentials do not create a session", async () => {
  const fixture = createDatabase({
    id: 7,
    email: "admin@example.com",
    password_hash: await hashPassword("a-secure-test-password"),
    is_active: true,
  });

  const session = await login("admin@example.com", "wrong-password", "127.0.0.1", fixture.database);

  assert.equal(session, null);
  assert.equal(fixture.wasConnected(), false);
  assert.ok(fixture.statements.some((sql) => sql.includes("admin_login_rate_limits")));
  assert.equal(fixture.statements.some((sql) => sql.includes("admin_sessions")), false);
});
