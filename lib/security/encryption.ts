/**
 * AES-256-GCM Token Encryption (spec §11.2).
 *
 * Encrypts/decrypts OAuth access tokens at rest using AES-256-GCM with
 * key-versioned output for zero-downtime key rotation. Old key versions
 * stay in the TOKEN_ENCRYPTION_KEYS map so historical ciphertexts remain
 * decryptable; new writes always use ACTIVE_KEY_VERSION.
 *
 * Output format:  keyVersion:iv:authTag:ciphertext  (all hex-encoded)
 *
 * @security NEVER log plaintext tokens or pass them to error-tracking services.
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "crypto";
import { env } from "@/lib/env";

// ── Constants ──────────────────────────────────────────────────────────────
const ALGORITHM = "aes-256-gcm" as const;
const IV_LENGTH = 12; // 96 bits — NIST recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_BYTE_LENGTH = 32; // 256 bits

// ── Key Map Cache ──────────────────────────────────────────────────────────

/**
 * Lazy-initialized cache of parsed encryption keys.
 * Invalidated via `invalidateKeyCache()` for dynamic rotation in long-lived processes.
 */
let keyMapCache: Map<string, Buffer> | null = null;

function getKeyMap(): Map<string, Buffer> {
  if (keyMapCache) return keyMapCache;

  const raw = JSON.parse(env.TOKEN_ENCRYPTION_KEYS) as Record<string, string>;
  const map = new Map<string, Buffer>();

  for (const [version, hexKey] of Object.entries(raw)) {
    const keyBuffer = Buffer.from(hexKey, "hex");
    if (keyBuffer.length !== KEY_BYTE_LENGTH) {
      throw new Error(
        `[encryption] Key version "${version}" is not ${KEY_BYTE_LENGTH} bytes (${KEY_BYTE_LENGTH * 8} bits). Got ${keyBuffer.length} bytes.`
      );
    }
    map.set(version, keyBuffer);
  }

  keyMapCache = map;
  return map;
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Encrypts a plaintext string with AES-256-GCM using the active key version.
 *
 * Each invocation generates a cryptographically random 12-byte IV to ensure
 * semantic security — identical plaintexts produce different ciphertexts.
 *
 * @returns `keyVersion:iv:authTag:ciphertext` — all components hex-encoded.
 * @throws If the active key version is missing from `TOKEN_ENCRYPTION_KEYS`.
 *
 * @security NEVER log the `plaintext` parameter.
 */
export function encryptToken(plaintext: string): string {
  const keyMap = getKeyMap();
  const activeVersion = env.ACTIVE_KEY_VERSION;
  const key = keyMap.get(activeVersion);

  if (!key) {
    throw new Error(
      `[encryption] Active key version "${activeVersion}" not found in TOKEN_ENCRYPTION_KEYS`
    );
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    activeVersion,
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

/**
 * Decrypts a token previously encrypted by `encryptToken`.
 *
 * Parses the key-version prefix from the ciphertext to dynamically select
 * the decryption key, enabling zero-downtime key rotation — retired keys
 * continue to decrypt their ciphertexts as long as they remain in
 * `TOKEN_ENCRYPTION_KEYS`.
 *
 * @param encryptedString Format: `keyVersion:iv:authTag:ciphertext` (hex).
 * @returns The original plaintext string.
 * @throws On malformed input, missing key version, or authentication failure.
 *
 * @security NEVER log the returned plaintext.
 */
export function decryptToken(encryptedString: string): string {
  const parts = encryptedString.split(":");
  if (parts.length !== 4) {
    throw new Error(
      '[encryption] Malformed encrypted token: expected format "version:iv:authTag:ciphertext"'
    );
  }

  const version = parts[0]!;
  const ivHex = parts[1]!;
  const authTagHex = parts[2]!;
  const ciphertextHex = parts[3]!;

  const keyMap = getKeyMap();
  const key = keyMap.get(version);

  if (!key) {
    throw new Error(
      `[encryption] Key version "${version}" not found in TOKEN_ENCRYPTION_KEYS — cannot decrypt. ` +
        `Ensure old keys are retained during rotation.`
    );
  }

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");

  if (iv.length !== IV_LENGTH) {
    throw new Error(
      `[encryption] Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`
    );
  }

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error(
      `[encryption] Invalid auth tag length: expected ${AUTH_TAG_LENGTH}, got ${authTag.length}`
    );
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  const plaintext = decrypted.toString("utf8");
  
  // Security Hardening: Immediately zero out decrypted buffer to prevent sensitive tokens remaining in C++ heap pools
  decrypted.fill(0);

  return plaintext;
}

/**
 * Invalidates the in-memory key cache, forcing a re-parse on next
 * encrypt/decrypt call. Useful after dynamic key rotation in long-lived
 * worker processes.
 */
export function invalidateKeyCache(): void {
  keyMapCache = null;
}
