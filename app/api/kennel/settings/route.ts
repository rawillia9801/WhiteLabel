import { supabaseRequest } from "../../../../db/supabase";
import { breederSessionFromRequest, requireAdminSession } from "../../../../lib/admin-session";

const fonts = new Set(["Geist", "Arial", "Georgia", "Trebuchet MS", "Verdana"]);
const hex = (value: unknown) => /^#[0-9a-f]{6}$/i.test(String(value || "")) ? String(value).toLowerCase() : null;
const text = (value: unknown, max: number) => String(value ?? "").trim().replace(/\s+/g, " ").slice(0, max);
const cents = (value: unknown) => Math.max(0, Math.round((Number(value) || 0) * 100));

const fields = [
  "id", "name", "slug", "plan", "primary_color", "accent_color", "font_family", "custom_domain", "domain_status",
  "primary_breed", "legal_name", "location", "contact_email", "contact_phone", "website_url", "default_puppy_price_cents",
  "default_deposit_cents", "custom_policy_notice",
].join(",");

export async function GET(request: Request) {
  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;
  const session = breederSessionFromRequest(request)!;
  const response = await supabaseRequest(`rest/v1/kennels?select=${fields}&id=eq.${encodeURIComponent(session.kennelId)}&limit=1`, { cache: "no-store" });
  const rows = await response.json().catch(() => []);
  return response.ok
    ? Response.json((rows as unknown[])[0] || null)
    : Response.json({ error: "Unable to load kennel settings." }, { status: 500 });
}

export async function PATCH(request: Request) {
  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;
  const session = breederSessionFromRequest(request)!;
  if (!["owner", "admin"].includes(session.role)) return Response.json({ error: "You do not have permission to change kennel settings." }, { status: 403 });

  try {
    const body = await request.json() as Record<string, unknown>;
    const name = text(body.name, 100);
    const primaryColor = hex(body.primary_color);
    const accentColor = hex(body.accent_color);
    const fontFamily = text(body.font_family, 40);
    const contactEmail = text(body.contact_email, 200).toLowerCase();
    const websiteUrl = text(body.website_url, 300);
    if (name.length < 2 || !primaryColor || !accentColor || !fonts.has(fontFamily)) {
      return Response.json({ error: "Enter a kennel name, valid six-digit colors, and an available font." }, { status: 400 });
    }
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return Response.json({ error: "Enter a valid contact email." }, { status: 400 });
    if (websiteUrl && !/^https:\/\/[a-z0-9.-]+(?:\/.*)?$/i.test(websiteUrl)) return Response.json({ error: "Website URLs must begin with https://." }, { status: 400 });

    const update = {
      name,
      primary_breed: text(body.primary_breed, 100) || "Dogs",
      legal_name: text(body.legal_name, 160) || name,
      location: text(body.location, 200) || null,
      contact_email: contactEmail || null,
      contact_phone: text(body.contact_phone, 50) || null,
      website_url: websiteUrl || null,
      primary_color: primaryColor,
      accent_color: accentColor,
      font_family: fontFamily,
      default_puppy_price_cents: cents(body.default_puppy_price),
      default_deposit_cents: cents(body.default_deposit),
      custom_policy_notice: text(body.custom_policy_notice, 1000),
      updated_at: new Date().toISOString(),
    };
    const response = await supabaseRequest(`rest/v1/kennels?id=eq.${encodeURIComponent(session.kennelId)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", prefer: "return=representation" },
      body: JSON.stringify(update),
    });
    const rows = await response.json().catch(() => []);
    if (!response.ok) throw new Error("Unable to save kennel settings.");
    return Response.json((rows as unknown[])[0] || { ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to save kennel settings." }, { status: 500 });
  }
}
