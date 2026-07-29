import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getD1 } from "../db";

export const ACCESS_COOKIE = "entrena_access";
export const ACCESS_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

export type AccessIdentity = {
  ownerKey: string;
  label: string;
};

const tokenPattern = /^[A-Za-z0-9_-]{32,128}$/;

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessIdentity | null> {
  if (!tokenPattern.test(token)) return null;

  const tokenHash = await sha256(token);
  const row = await getD1()
    .prepare(
      `SELECT owner_key AS ownerKey, label
       FROM access_links
       WHERE token_hash = ? AND active = 1
       LIMIT 1`,
    )
    .bind(tokenHash)
    .first<AccessIdentity>();

  return row ?? null;
}

export async function activateAccessToken(token: string) {
  const identity = await verifyAccessToken(token);
  if (!identity) return null;

  const tokenHash = await sha256(token);
  await getD1()
    .prepare(
      `UPDATE access_links
       SET last_used_at = CURRENT_TIMESTAMP
       WHERE token_hash = ?`,
    )
    .bind(tokenHash)
    .run();

  return identity;
}

function tokenFromCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const [name, ...valueParts] = part.trim().split("=");
    if (name === ACCESS_COOKIE) {
      return decodeURIComponent(valueParts.join("="));
    }
  }
  return null;
}

export async function accessIdentityFromRequest(request: Request) {
  const token = tokenFromCookieHeader(request.headers.get("cookie"));
  return token ? verifyAccessToken(token) : null;
}

export async function getAccessIdentity() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE)?.value;
  return token ? verifyAccessToken(token) : null;
}

export async function requireAccess() {
  const identity = await getAccessIdentity();
  if (!identity) redirect("/acceso");
  return identity;
}

export function accessCookie(token: string, secure: boolean) {
  return [
    `${ACCESS_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${ACCESS_COOKIE_MAX_AGE}`,
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearAccessCookie(secure: boolean) {
  return [
    `${ACCESS_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}
