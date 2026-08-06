import { NextResponse } from "next/server";
import { BREEDER_SESSION_COOKIE, createBreederSessionToken, tenantUrl, type BreederSession } from "../../../../lib/breeder-session";
import { breederSessionClaims, createBreederAccount } from "../../../../lib/supabase-auth";
import { createSupabaseResource } from "../../../../db/supabase-kennel";

export const runtime = "nodejs";

const setupRequestDetails: Record<string, { name: string; notes: string }> = {
  "brand-launch": { name: "Brand Launch", notes: "$149 one-time. Includes first-year registration of an available standard .com, domain and SSL configuration, qualifying-service hosting, and two branded business email addresses. Standard .com renewal is $29/year; premium domains are priced separately." },
  "custom-website": { name: "Custom Breeder Website Design", notes: "$299 one-time design fee. The breeder may specify layout, branding, colors, pages, photography, content, and program presentation. Unsupported custom functionality may be quoted separately." },
  "business-voice": { name: "Business Voice", notes: "$69 one-time setup. Local number is $8.99/month or $99/year. Incoming calls are $0.03/minute and outgoing calls are $0.04/minute." },
  "business-sms": { name: "Business SMS", notes: "$59 activation/setup, $14.99/month per active registered campaign, and $25 activation for each additional campaign. Incoming is $0.02 per segment and outgoing is $0.03 per segment. Registration and approval are required, activation is not guaranteed, and approval may take up to 30 days." },
};

const websiteTemplateDetails: Record<string, { name: string; notes: string }> = {
  "willow-creek": { name: "Willow Creek", notes: "Website Template 01 — boutique Chihuahua demonstration style. Replace demonstration kennel identity, breed, dogs, photography, colors, policies, and content with the customer's program." },
  "cedar-creek": { name: "Cedar & Creek", notes: "Website Template 02 — warm editorial Golden Retriever demonstration style. Replace demonstration kennel identity, breed, dogs, photography, colors, policies, and content with the customer's program." },
};

function cookieDomain(request: Request) {
  if (process.env.NODE_ENV !== "production") return undefined;
  const host = new URL(request.url).hostname.toLowerCase();
  const platform = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "mydogportal.site";
  return host === platform || host.endsWith(`.${platform}`) ? `.${platform}` : undefined;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const requestedPlan = String(body.plan ?? "starter") as BreederSession["plan"];
    const plan = (["starter", "professional", "custom_domain"] as const).includes(requestedPlan) ? requestedPlan : "starter";
    const account = await createBreederAccount({
      email: String(body.email ?? ""), password: String(body.password ?? ""),
      kennelName: String(body.kennel_name ?? ""), kennelSlug: String(body.kennel_slug ?? ""), plan,
    });
    const requestedSetupIds = Array.isArray(body.setup_requests)
      ? [...new Set(body.setup_requests.map((item) => String(item)).filter((item) => setupRequestDetails[item]))]
      : [];
    const requestedWebsiteTemplate = websiteTemplateDetails[String(body.website_template ?? "")];
    if (requestedSetupIds.length || requestedWebsiteTemplate) {
      const eventDate = new Date().toISOString().slice(0, 10);
      const setupEvents = requestedSetupIds.map((id) => {
        const service = setupRequestDetails[id];
        return createSupabaseResource("events", {
          title: `Setup request: ${service.name}`,
          event_type: "Setup Request",
          event_date: eventDate,
          status: "Requested",
          notes: service.notes,
        }, account.kennel.id);
      });
      if (requestedWebsiteTemplate) setupEvents.push(createSupabaseResource("events", {
        title: `Website template: ${requestedWebsiteTemplate.name}`,
        event_type: "Setup Request",
        event_date: eventDate,
        status: "Requested",
        notes: requestedWebsiteTemplate.notes,
      }, account.kennel.id));
      await Promise.all(setupEvents);
    }
    const claims = breederSessionClaims(account);
    const token = createBreederSessionToken(claims);
    if (!token) return Response.json({ error: "Set BREEDER_SESSION_SECRET to a random value of at least 32 characters." }, { status: 503 });
    const requestUrl = new URL(request.url);
    const redirect = ["localhost", "127.0.0.1"].includes(requestUrl.hostname) || requestUrl.hostname.endsWith(".vercel.app")
      ? `${requestUrl.origin}/`
      : tenantUrl(claims, "/");
    const response = NextResponse.json({ created: true, kennel: account.kennel, redirect }, { status: 201 });
    response.cookies.set({
      name: BREEDER_SESSION_COOKIE, value: token, httpOnly: true,
      secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 30 * 86400,
      domain: cookieDomain(request),
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create the kennel account.";
    return Response.json({ error: message }, { status: /already|in use|valid|choose|enter|characters/i.test(message) ? 400 : 500, headers: { "cache-control": "no-store" } });
  }
}
