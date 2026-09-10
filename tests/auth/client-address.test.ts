import assert from "node:assert/strict";
import test from "node:test";
import { getLoginClientAddress } from "../../lib/auth/client-address.ts";

test("login ignores client-provided forwarding headers by default", () => {
  const headers = new Headers({
    "x-forwarded-for": "203.0.113.10",
    "x-real-ip": "203.0.113.11",
  });

  assert.equal(getLoginClientAddress(headers, false), "untrusted-client");
});

test("login accepts valid forwarding addresses only when explicitly trusted", () => {
  assert.equal(getLoginClientAddress(new Headers({ "x-forwarded-for": "203.0.113.10" }), true), "203.0.113.10");
  assert.equal(getLoginClientAddress(new Headers({ "x-real-ip": "2001:db8::1" }), true), "2001:db8::1");
  assert.equal(getLoginClientAddress(new Headers({ "x-forwarded-for": "spoofed" }), true), "unknown-proxy-client");
});
