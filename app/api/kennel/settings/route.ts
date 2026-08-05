import { supabaseRequest } from "../../../../db/supabase";
import { breederSessionFromRequest, requireAdminSession } from "../../../../lib/admin-session";

const fonts = new Set(["Geist", "Arial", "Georgia", "Trebuchet MS", "Verdana"]);
const hex = (value: unknown) => /^#[0-9a-f]{6}$/i.test(String(value || "")) ? String(value).toLowerCase() : null;

export async function GET(request: Request) {
  const unauthorized = requireAdminSession(request); if (unauthorized) return unauthorized;
  const session = breederSessionFromRequest(request)!;
  const response = await supabaseRequest(`rest/v1/kennels?select=id,name,slug,plan,primary_color,accent_color,font_family,custom_domain,domain_status&id=eq.${encodeURIComponent(session.kennelId)}&limit=1`, { cache: "no-store" });
  const rows = await response.json().catch(() => []);
  return response.ok ? Response.json((rows as unknown[])[0] || null) : Response.json({ error: "Unable to load kennel settings." }, { status: 500 });
}

export async function PATCH(request: Request) {
  const unauthorized = requireAdminSession(request); if (unauthorized) return unauthorized;
  const session = breederSessionFromRequest(request)!;
  if (!['owner','admin'].includes(session.role)) return Response.json({ error: "You do not have permission to change kennel branding." }, { status: 403 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const name = String(body.name || "").trim().replace(/\s+/g," ").slice(0,100);
    const primary = hex(body.primary_color); const accent = hex(body.accent_color); const font = String(body.font_family || "");
    if (name.length < 2 || !primary || !accent || !fonts.has(font)) return Response.json({ error: "Enter a kennel name, valid six-digit colors, and an available font." }, { status: 400 });
    const response = await supabaseRequest(`rest/v1/kennels?id=eq.${encodeURIComponent(session.kennelId)}`, { method:"PATCH", headers:{"content-type":"application/json",prefer:"return=representation"}, body:JSON.stringify({name,primary_color:primary,accent_color:accent,font_family:font,updated_at:new Date().toISOString()}) });
    const rows = await response.json().catch(() => []);
    if (!response.ok) throw new Error("Unable to save kennel branding.");
    return Response.json((rows as unknown[])[0] || { ok:true });
  } catch(error) { return Response.json({error:error instanceof Error?error.message:"Unable to save kennel branding."},{status:500}); }
}
