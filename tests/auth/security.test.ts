import assert from "node:assert/strict";
import test from "node:test";
import {
  createTotpSecret,
  decryptSecret,
  encryptSecret,
  generateTotp,
  hashPassword,
  verifyPassword,
  verifyTotp,
} from "../../lib/auth/security.mjs";

test("password hashes verify without storing the password", async () => {
  const password = "a-secure-test-password";
  const hash = await hashPassword(password);

  assert.notEqual(hash, password);
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword("a-different-password", hash), false);
});

test("encrypted MFA secrets require the configured key", () => {
  const secret = createTotpSecret();
  const encrypted = encryptSecret(secret, "a".repeat(32));

  assert.notEqual(encrypted, secret);
  assert.equal(decryptSecret(encrypted, "a".repeat(32)), secret);
  assert.throws(() => decryptSecret(encrypted, "b".repeat(32)));
});

test("TOTP accepts the current code and adjacent clock window", () => {
  const secret = "JBSWY3DPEHPK3PXP";
  const timestamp = 1_700_000_000_000;
  const code = generateTotp(secret, timestamp);

  assert.equal(verifyTotp(secret, code, timestamp), true);
  assert.equal(verifyTotp(secret, code, timestamp + 30_000), true);
  assert.equal(verifyTotp(secret, "000000", timestamp), false);
});

test("TOTP matches the RFC 6238 SHA-1 test vector truncated to six digits", () => {
  const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
  assert.equal(generateTotp(secret, 59_000), "287082");
});
