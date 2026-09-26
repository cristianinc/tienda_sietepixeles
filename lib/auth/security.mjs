import {
  createHash,
  randomBytes,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(nodeScrypt);
export function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function createToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export async function hashPassword(password) {
  if (password.length < 12) throw new Error("La contrasena debe tener al menos 12 caracteres.");
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("base64url")}$${Buffer.from(derived).toString("base64url")}`;
}

export async function verifyPassword(password, storedHash) {
  const [algorithm, encodedSalt, encodedHash] = storedHash.split("$");
  if (algorithm !== "scrypt" || !encodedSalt || !encodedHash) return false;

  const expected = Buffer.from(encodedHash, "base64url");
  const actual = Buffer.from(await scrypt(password, Buffer.from(encodedSalt, "base64url"), expected.length));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
