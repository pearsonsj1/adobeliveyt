/**
 * Signed admin session (HMAC-SHA256) using Web Crypto — safe for Edge middleware and Route Handlers.
 */

const enc = new TextEncoder();

export const ADMIN_SESSION_COOKIE = "adobelive_admin_session";

/** Default 7 days */
export const ADMIN_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

export async function signAdminSession(secret: string, ttlMs: number = ADMIN_SESSION_TTL_MS): Promise<string> {
  const exp = Date.now() + ttlMs;
  const payload = String(exp);
  const key = await importHmacKey(secret);
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return `${payload}.${bufToHex(sigBuf)}`;
}

function ctEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function verifyAdminSession(token: string | undefined, secret: string | undefined): Promise<boolean> {
  if (!token || !secret) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^\d+$/.test(payload) || !/^[0-9a-f]+$/i.test(sig)) return false;
  const exp = Number(payload);
  if (!Number.isFinite(exp) || exp <= Date.now()) return false;
  const key = await importHmacKey(secret);
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  const expected = bufToHex(sigBuf);
  return ctEqualHex(sig.toLowerCase(), expected.toLowerCase());
}

export function adminSessionCookieHeader(token: string, maxAgeSec: number, secure: boolean): string {
  const parts = [
    `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    `Max-Age=${maxAgeSec}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function adminSessionClearCookieHeader(secure: boolean): string {
  const parts = [
    `${ADMIN_SESSION_COOKIE}=`,
    "Path=/",
    "Max-Age=0",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}
