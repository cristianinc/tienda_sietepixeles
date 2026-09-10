import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(nodeScrypt);
const base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

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

function encryptionKey(secret) {
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET debe tener al menos 32 caracteres.");
  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(value, secret) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(secret), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString("base64url")).join(".");
}

export function decryptSecret(value, secret) {
  const [encodedIv, encodedTag, encodedCiphertext] = value.split(".");
  if (!encodedIv || !encodedTag || !encodedCiphertext) throw new Error("Secreto MFA invalido.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(secret), Buffer.from(encodedIv, "base64url"));
  decipher.setAuthTag(Buffer.from(encodedTag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encodedCiphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function createTotpSecret(bytes = 20) {
  const input = randomBytes(bytes);
  let bits = "";
  for (const byte of input) bits += byte.toString(2).padStart(8, "0");

  let output = "";
  for (let index = 0; index < bits.length; index += 5) {
    output += base32Alphabet[Number.parseInt(bits.slice(index, index + 5).padEnd(5, "0"), 2)];
  }
  return output;
}

function decodeBase32(value) {
  const normalized = value.toUpperCase().replace(/=+$/g, "").replace(/\s+/g, "");
  let bits = "";
  for (const character of normalized) {
    const index = base32Alphabet.indexOf(character);
    if (index < 0) throw new Error("Secreto TOTP invalido.");
    bits += index.toString(2).padStart(5, "0");
  }

  const bytes = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  }
  return Buffer.from(bytes);
}

export function generateTotp(secret, timestamp = Date.now()) {
  const counter = BigInt(Math.floor(timestamp / 30_000));
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(counter);
  const hmac = createHmac("sha1", decodeBase32(secret)).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return code.toString().padStart(6, "0");
}

export function verifyTotp(secret, code, timestamp = Date.now()) {
  if (!/^\d{6}$/.test(code)) return false;
  const supplied = Buffer.from(code);
  return [-1, 0, 1].some((window) => {
    const expected = Buffer.from(generateTotp(secret, timestamp + window * 30_000));
    return expected.length === supplied.length && timingSafeEqual(expected, supplied);
  });
}
