import assert from "node:assert/strict";
import test from "node:test";
import {
  hashPassword,
  verifyPassword,
} from "../../lib/auth/security.mjs";

test("password hashes verify without storing the password", async () => {
  const password = "a-secure-test-password";
  const hash = await hashPassword(password);

  assert.notEqual(hash, password);
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword("a-different-password", hash), false);
});
