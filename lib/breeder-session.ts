import { createHmac, timingSafeEqual } from "node:crypto";

export const BREEDER_SESSION_COOKIE = "breeder_portal_session";

export type BreederSession = {
  version: 1;
  userId: string;
  kennelId: string;
  kennelSlug: string;
  kennelName: string;
  role: "owner" | "admin" | "staff";
  plan: "starter" | "professional" | "custom_domain";
  customDomain?: string;
  billingStatus?: "pending" | "active";
  expiresAt: number;
};

function secret() {
  const value = process.env.BREEDER_SESSION_SECRET?.trim() || process.env.SWVAOS_SESSION_SECRET?.trim();
  if (!value || value.length < 32) return "";
  return value;
}

function sign(payload: string) {
  const key = secret();
  return key ? createHmac("sha256", key).update(payload).digest("base64url") : "";
}

function equal(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createBreederSessionToken(input: Omit<BreederSession, "version" | "expiresAt">, lifetimeDays = 30) {
  if (!secret()) return null;
  const claims: BreederSession = {
    ...input,
    version: 1,
    expiresAt: Math.floor(Date.now() / 1000) + lifetimeDays * 86400,
  };
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readBreederSessionToken(token: string | null | undefined): BreederSession | null {
  if (!token || !secret()) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra || !equal(signature, sign(payload))) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<BreederSession>;
    if (claims.version !== 1 || !claims.userId || !claims.kennelId || !claims.kennelSlug || !claims.kennelName) return null;
    if (!claims.expiresAt || claims.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    if (!claims.role || !claims.plan) return null;
    return claims as BreederSession;
  } catch {
    return null;
  }
}

export function sessionCookieFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== BREEDER_SESSION_COOKIE) continue;
    return decodeURIComponent(part.slice(separator + 1).trim());
  }
  return "";
}

export function breederSessionFromRequest(request: Request) {
  return readBreederSessionToken(sessionCookieFromRequest(request));
}

export function tenantUrl(session: Pick<BreederSession, "kennelSlug" | "plan" | "customDomain">, path = "/") {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (session.plan === "custom_domain" && session.customDomain) return `https://${session.customDomain}${cleanPath}`;
  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN?.trim().toLowerCase() || "mydogportal.site";
  return `https://${session.kennelSlug}.${platformDomain}${cleanPath}`;
}
