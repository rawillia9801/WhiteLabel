import "server-only";

import { getSupabaseConfig } from "../db/supabase";
import { supabaseRequest } from "../db/supabase";
import type { BreederSession } from "./breeder-session";

type AuthUser = {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

type AuthErrorPayload = {
  message?: string;
  error_description?: string;
  msg?: string;
  code?: string;
};

function authUrl(path: string) {
  const { url } = getSupabaseConfig();
  return new URL(path.replace(/^\//, ""), `${url}/`).toString();
}

async function authJson<T>(path: string, init: RequestInit, mode: "anon" | "admin") {
  const { anonKey, serviceRoleKey } = getSupabaseConfig();
  const key = mode === "admin" ? serviceRoleKey : (anonKey ?? serviceRoleKey);
  if (!key) throw new Error(mode === "admin" ? "Portal account administration is not configured." : "Portal password sign-in is not configured.");
  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  headers.set("authorization", `Bearer ${key}`);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const response = await fetch(authUrl(path), { ...init, headers, cache: "no-store" });
  const payload = await response.json().catch(() => null) as T & AuthErrorPayload | null;
  if (!response.ok) {
    const message = payload?.message || payload?.error_description || payload?.msg || "Authentication request failed.";
    throw new Error(message);
  }
  return payload as T;
}

async function findAuthUserByEmail(email: string) {
  for (let page = 1; page <= 10; page += 1) {
    const payload = await authJson<{ users?: AuthUser[]; next_page?: number | null }>(`auth/v1/admin/users?page=${page}&per_page=1000`, { method: "GET" }, "admin");
    const users = Array.isArray(payload.users) ? payload.users : [];
    const found = users.find((user) => String(user.email || "").toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (users.length < 1000 && !payload.next_page) break;
  }
  return null;
}

export async function createOrUpdatePortalAuthUser(input: { email: string; password: string; buyerId: number; kennelId: string; name: string }) {
  const email = input.email.trim().toLowerCase();
  const existing = await findAuthUserByEmail(email);
  const appMetadata = { ...(existing?.app_metadata || {}), portal_buyer_id: input.buyerId, portal_kennel_id: input.kennelId, portal_account: true };
  const userMetadata = { ...(existing?.user_metadata || {}), full_name: input.name, portal_buyer_id: input.buyerId, portal_kennel_id: input.kennelId };
  const body = JSON.stringify({
    email,
    password: input.password,
    email_confirm: true,
    app_metadata: appMetadata,
    user_metadata: userMetadata,
  });

  if (existing) {
    return authJson<AuthUser>(`auth/v1/admin/users/${encodeURIComponent(existing.id)}`, { method: "PUT", body }, "admin");
  }
  return authJson<AuthUser>("auth/v1/admin/users", { method: "POST", body }, "admin");
}

export async function signInPortalPassword(emailValue: string, password: string) {
  const email = emailValue.trim().toLowerCase();
  const payload = await authJson<{ access_token?: string; user?: AuthUser }>(
    "auth/v1/token?grant_type=password",
    { method: "POST", body: JSON.stringify({ email, password }) },
    "anon",
  );
  if (!payload.user?.id || !payload.access_token) throw new Error("The email address or password is incorrect.");
  return payload.user;
}

export function portalBuyerIdFromAuthUser(user: AuthUser) {
  const candidate = Number(user.app_metadata?.portal_buyer_id ?? user.user_metadata?.portal_buyer_id);
  return Number.isInteger(candidate) && candidate > 0 ? candidate : null;
}

export function portalKennelIdFromAuthUser(user: AuthUser) {
  const candidate = String(user.app_metadata?.portal_kennel_id ?? user.user_metadata?.portal_kennel_id ?? "");
  return /^[0-9a-f-]{36}$/i.test(candidate) ? candidate : null;
}

type KennelRow = {
  id: string;
  slug: string;
  name: string;
  plan: BreederSession["plan"];
  custom_domain?: string | null;
  domain_status?: string | null;
  primary_color?: string | null;
  accent_color?: string | null;
  font_family?: string | null;
};

async function restJson<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("content-type", "application/json");
  const response = await supabaseRequest(path, { ...init, headers, cache: "no-store" });
  const payload = await response.json().catch(() => null) as T | { message?: string } | null;
  if (!response.ok) throw new Error((payload as { message?: string } | null)?.message || "Account data request failed.");
  return payload as T;
}

export function normalizeKennelSlug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-").slice(0, 48);
}

export function validKennelSlug(value: string) {
  return /^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])?$/.test(value)
    && !["www", "app", "api", "admin", "support", "mail", "portal", "status", "help"].includes(value);
}

export async function kennelSlugAvailable(slugValue: string) {
  const slug = normalizeKennelSlug(slugValue);
  if (!validKennelSlug(slug)) return false;
  const rows = await restJson<Array<{ id: string }>>(`rest/v1/kennels?select=id&slug=eq.${encodeURIComponent(slug)}&limit=1`);
  return rows.length === 0;
}

async function kennelForUser(userId: string) {
  const memberships = await restJson<Array<{ kennel_id: string; role: BreederSession["role"] }>>(
    `rest/v1/kennel_members?select=kennel_id,role&auth_user_id=eq.${encodeURIComponent(userId)}&limit=1`,
  );
  const membership = memberships[0];
  if (!membership) return null;
  const kennels = await restJson<KennelRow[]>(`rest/v1/kennels?select=id,slug,name,plan,custom_domain,domain_status,primary_color,accent_color,font_family&id=eq.${encodeURIComponent(membership.kennel_id)}&limit=1`);
  const kennel = kennels[0];
  return kennel ? { kennel, role: membership.role } : null;
}

export async function createBreederAccount(input: { email: string; password: string; kennelName: string; kennelSlug: string; plan: BreederSession["plan"] }) {
  const email = input.email.trim().toLowerCase();
  const kennelName = input.kennelName.trim().replace(/\s+/g, " ").slice(0, 100);
  const slug = normalizeKennelSlug(input.kennelSlug || kennelName);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  if (kennelName.length < 2) throw new Error("Enter your kennel or breeding-business name.");
  if (!validKennelSlug(slug)) throw new Error("Choose a subdomain using 3–48 lowercase letters, numbers, or hyphens.");
  if (input.password.length < 10 || !/[a-z]/.test(input.password) || !/[A-Z]/.test(input.password) || !/\d/.test(input.password)) {
    throw new Error("Use at least 10 characters with an uppercase letter, lowercase letter, and number.");
  }
  if (!(await kennelSlugAvailable(slug))) throw new Error("That kennel address is already in use.");
  if (await findAuthUserByEmail(email)) throw new Error("An account already exists for that email address. Sign in instead.");

  const user = await authJson<AuthUser>("auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({ email, password: input.password, email_confirm: true, user_metadata: { full_name: kennelName, account_type: "breeder" } }),
  }, "admin");
  try {
    const kennels = await restJson<KennelRow[]>("rest/v1/kennels", {
      method: "POST",
      headers: { prefer: "return=representation" },
      body: JSON.stringify({ name: kennelName, slug, plan: input.plan, owner_auth_user_id: user.id }),
    });
    const kennel = kennels[0];
    if (!kennel) throw new Error("The kennel workspace could not be created.");
    await restJson("rest/v1/kennel_members", {
      method: "POST",
      body: JSON.stringify({ kennel_id: kennel.id, auth_user_id: user.id, role: "owner" }),
    });
    await authJson<AuthUser>(`auth/v1/admin/users/${encodeURIComponent(user.id)}`, {
      method: "PUT",
      body: JSON.stringify({ app_metadata: { account_type: "breeder", kennel_id: kennel.id, kennel_role: "owner" } }),
    }, "admin");
    return { user, kennel, role: "owner" as const };
  } catch (error) {
    await authJson(`auth/v1/admin/users/${encodeURIComponent(user.id)}`, { method: "DELETE" }, "admin").catch(() => undefined);
    throw error;
  }
}

export async function signInBreederPassword(emailValue: string, password: string) {
  const email = emailValue.trim().toLowerCase();
  const payload = await authJson<{ access_token?: string; user?: AuthUser }>(
    "auth/v1/token?grant_type=password",
    { method: "POST", body: JSON.stringify({ email, password }) },
    "anon",
  );
  if (!payload.user?.id || !payload.access_token) throw new Error("The email address or password is incorrect.");
  const account = await kennelForUser(payload.user.id);
  if (!account) throw new Error("This account is not connected to a kennel workspace.");
  return { user: payload.user, ...account };
}

export function breederSessionClaims(account: { user: AuthUser; kennel: KennelRow; role: BreederSession["role"] }): Omit<BreederSession, "version" | "expiresAt"> {
  const customDomain = account.kennel.plan === "custom_domain" && account.kennel.domain_status === "verified"
    ? account.kennel.custom_domain || undefined
    : undefined;
  return {
    userId: account.user.id,
    kennelId: account.kennel.id,
    kennelSlug: account.kennel.slug,
    kennelName: account.kennel.name,
    role: account.role,
    plan: account.kennel.plan,
    customDomain,
  };
}

export async function findKennelByHost(hostValue: string) {
  const host = hostValue.trim().toLowerCase().replace(/:\d+$/, "").replace(/^www\./, "");
  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN?.trim().toLowerCase() || "breederportal.site";
  const suffix = `.${platformDomain}`;
  if (host.endsWith(suffix)) {
    const slug = host.slice(0, -suffix.length);
    const rows = await restJson<KennelRow[]>(`rest/v1/kennels?select=id,slug,name,plan,custom_domain,domain_status,primary_color,accent_color,font_family&slug=eq.${encodeURIComponent(slug)}&limit=1`);
    return rows[0] || null;
  }
  const rows = await restJson<KennelRow[]>(`rest/v1/kennels?select=id,slug,name,plan,custom_domain,domain_status,primary_color,accent_color,font_family&custom_domain=eq.${encodeURIComponent(host)}&domain_status=eq.verified&limit=1`);
  return rows[0] || null;
}

export async function findKennelById(kennelId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(kennelId)) return null;
  const rows = await restJson<KennelRow[]>(`rest/v1/kennels?select=id,slug,name,plan,custom_domain,domain_status,primary_color,accent_color,font_family&id=eq.${encodeURIComponent(kennelId)}&limit=1`);
  return rows[0] || null;
}

export async function listKennelIds() {
  const rows = await restJson<Array<{ id: string }>>("rest/v1/kennels?select=id&order=created_at.asc");
  return rows.map((row) => row.id).filter((id) => /^[0-9a-f-]{36}$/i.test(id));
}
