import { supabaseRequest } from "../../../../db/supabase";
import { breederSessionFromRequest, requireAdminSession } from "../../../../lib/admin-session";
import { loadAccountProfileExtras, saveAccountProfileExtras } from "../../../../lib/account-profile";

const clean = (value: unknown, max: number) => String(value ?? "").trim().replace(/\s+/g, " ").slice(0, max);
const email = (value: unknown) => clean(value, 200).toLowerCase();

const kennelFields = [
  "id", "name", "legal_name", "primary_breed", "location", "contact_email", "contact_phone", "website_url",
].join(",");

async function readKennel(kennelId: string) {
  const response = await supabaseRequest(`rest/v1/kennels?select=${kennelFields}&id=eq.${encodeURIComponent(kennelId)}&limit=1`, { cache: "no-store" });
  const rows = await response.json().catch(() => []);
  if (!response.ok) throw new Error("Unable to load kennel contact information.");
  return (rows as Record<string, unknown>[])[0] || null;
}

export async function GET(request: Request) {
  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;
  const session = breederSessionFromRequest(request)!;
  try {
    const [kennel, extras] = await Promise.all([readKennel(session.kennelId), loadAccountProfileExtras(session.kennelId)]);
    if (!kennel) return Response.json({ error: "Kennel account not found." }, { status: 404 });
    return Response.json({
      profile: {
        kennelName: String(kennel.name || ""),
        legalName: String(kennel.legal_name || ""),
        primaryBreed: String(kennel.primary_breed || ""),
        publicLocation: String(kennel.location || ""),
        contactEmail: String(kennel.contact_email || ""),
        contactPhone: String(kennel.contact_phone || ""),
        websiteUrl: String(kennel.website_url || ""),
        ...extras,
      },
    }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load breeder profile." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;
  const session = breederSessionFromRequest(request)!;
  if (!["owner", "admin"].includes(session.role)) return Response.json({ error: "Owner or admin access is required to update the breeder profile." }, { status: 403 });

  try {
    const body = await request.json() as Record<string, unknown>;
    const kennelName = clean(body.kennelName, 100);
    const contactEmail = email(body.contactEmail);
    const websiteUrl = clean(body.websiteUrl, 300);
    const secondaryEmail = email(body.secondaryEmail);
    const billingEmail = email(body.billingEmail);
    if (kennelName.length < 2) return Response.json({ error: "Enter your kennel or breeding-business name." }, { status: 400 });
    for (const [label, value] of [["contact email", contactEmail], ["backup email", secondaryEmail], ["billing email", billingEmail]] as const) {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return Response.json({ error: `Enter a valid ${label}.` }, { status: 400 });
    }
    if (websiteUrl && !/^https:\/\/[a-z0-9.-]+(?:\/.*)?$/i.test(websiteUrl)) return Response.json({ error: "Website URLs must begin with https://." }, { status: 400 });

    const kennelUpdate = {
      name: kennelName,
      legal_name: clean(body.legalName, 160) || kennelName,
      primary_breed: clean(body.primaryBreed, 100) || "Dogs",
      location: clean(body.publicLocation, 200) || null,
      contact_email: contactEmail || null,
      contact_phone: clean(body.contactPhone, 50) || null,
      website_url: websiteUrl || null,
      updated_at: new Date().toISOString(),
    };
    const response = await supabaseRequest(`rest/v1/kennels?id=eq.${encodeURIComponent(session.kennelId)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", prefer: "return=representation" },
      body: JSON.stringify(kennelUpdate),
    });
    if (!response.ok) throw new Error((await response.text()) || "Unable to update kennel contact information.");

    const extras = await saveAccountProfileExtras(session.kennelId, {
      contactName: body.contactName,
      secondaryEmail,
      secondaryPhone: body.secondaryPhone,
      mailingAddress1: body.mailingAddress1,
      mailingAddress2: body.mailingAddress2,
      mailingCity: body.mailingCity,
      mailingState: body.mailingState,
      mailingPostalCode: body.mailingPostalCode,
      mailingCountry: body.mailingCountry,
      billingContactName: body.billingContactName,
      billingEmail,
      billingPhone: body.billingPhone,
    });

    return Response.json({ profile: { ...body, ...extras, kennelName, contactEmail, websiteUrl } }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to save breeder profile." }, { status: 500 });
  }
}
