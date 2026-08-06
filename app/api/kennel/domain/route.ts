import { supabaseRequest } from "../../../../db/supabase";
import { breederSessionFromRequest, requireAdminSession } from "../../../../lib/admin-session";

type VercelDomain = { name?: string; verified?: boolean; verification?: Array<{ type?: string; domain?: string; value?: string; reason?: string }>; error?: { message?: string } };

function cleanDomain(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
}

function validDomain(value: string) {
  return /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(value);
}

async function vercelRequest(domain: string, method: "GET" | "POST") {
  const token = process.env.VERCEL_API_TOKEN?.trim();
  const project = process.env.VERCEL_PROJECT_ID?.trim();
  const team = process.env.VERCEL_TEAM_ID?.trim();
  if (!token || !project) throw new Error("Custom-domain automation is not configured for this deployment.");
  const query = team ? `?teamId=${encodeURIComponent(team)}` : "";
  const endpoint = method === "POST"
    ? `https://api.vercel.com/v9/projects/${encodeURIComponent(project)}/domains${query}`
    : `https://api.vercel.com/v9/projects/${encodeURIComponent(project)}/domains/${encodeURIComponent(domain)}${query}`;
  const response = await fetch(endpoint, {
    method,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: method === "POST" ? JSON.stringify({ name: domain }) : undefined,
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null) as VercelDomain | null;
  if (!response.ok && response.status !== 409) throw new Error(payload?.error?.message || "Vercel could not add this domain.");
  return payload || {};
}

async function saveDomain(kennelId: string, domain: string, verified: boolean) {
  const response = await supabaseRequest(`rest/v1/kennels?id=eq.${encodeURIComponent(kennelId)}`, {
    method: "PATCH", headers: { "content-type": "application/json", prefer: "return=representation" },
    body: JSON.stringify({ custom_domain: domain, domain_status: verified ? "verified" : "pending", updated_at: new Date().toISOString() }),
  });
  if (!response.ok) throw new Error("The custom-domain status could not be saved.");
}

async function domainAddonEnabled(kennelId: string) {
  const response = await supabaseRequest(`rest/v1/kennels?select=domain_addon_enabled&id=eq.${encodeURIComponent(kennelId)}&limit=1`, { cache: "no-store" });
  if (!response.ok) return false;
  const rows = await response.json().catch(() => []) as Array<{ domain_addon_enabled?: boolean }>;
  return rows[0]?.domain_addon_enabled === true;
}

export async function POST(request: Request) {
  const unauthorized = requireAdminSession(request); if (unauthorized) return unauthorized;
  const session = breederSessionFromRequest(request)!;
  if (session.role !== "owner") return Response.json({ error: "Only the kennel owner can connect a custom domain." }, { status: 403 });
  if (!(await domainAddonEnabled(session.kennelId))) return Response.json({ error: "Activate the $149 Brand Launch add-on before connecting a custom domain." }, { status: 402 });
  try {
    const domain = cleanDomain(String((await request.json() as { domain?: unknown }).domain ?? ""));
    if (!validDomain(domain)) return Response.json({ error: "Enter a valid domain such as portal.yourkennel.com." }, { status: 400 });
    const payload = await vercelRequest(domain, "POST");
    await saveDomain(session.kennelId, domain, payload.verified === true);
    const subdomain = domain.split(".").length > 2;
    return Response.json({
      domain, verified: payload.verified === true, verification: payload.verification || [],
      dns: subdomain ? { type: "CNAME", name: domain.split(".")[0], value: "cname.vercel-dns.com" } : { type: "A", name: "@", value: "76.76.21.21" },
    });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to connect the domain." }, { status: 500 }); }
}

export async function GET(request: Request) {
  const unauthorized = requireAdminSession(request); if (unauthorized) return unauthorized;
  const session = breederSessionFromRequest(request)!;
  try {
    const storedResponse = await supabaseRequest(`rest/v1/kennels?select=custom_domain&id=eq.${encodeURIComponent(session.kennelId)}&limit=1`, { cache: "no-store" });
    const rows = await storedResponse.json().catch(() => []) as Array<{ custom_domain?: string }>;
    const domain = rows[0]?.custom_domain;
    if (!domain) return Response.json({ configured: false });
    const payload = await vercelRequest(domain, "GET");
    await saveDomain(session.kennelId, domain, payload.verified === true);
    return Response.json({ configured: true, domain, verified: payload.verified === true, verification: payload.verification || [] });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to check the domain." }, { status: 500 }); }
}
