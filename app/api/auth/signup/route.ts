import { NextResponse } from "next/server";
import { BREEDER_SESSION_COOKIE, createBreederSessionToken, tenantUrl, type BreederSession } from "../../../../lib/breeder-session";
import { breederSessionClaims, createBreederAccount } from "../../../../lib/supabase-auth";
import { createSupabaseResource } from "../../../../db/supabase-kennel";
import { FOUNDING_BREEDER_LIMIT, foundingEligibilityForNewSignup } from "../../../../lib/founding-pricing";

export const runtime = "nodejs";

const setupRequestDetails: Record<string, { name: string; notes: string }> = {
  "hosting-email": { name: "Dog Breeder Web Website Service", notes: "$24.95/month standalone breeder website service including BreederWeb Designer, managed hosting, SSL, two branded business email addresses, publishing, forms, embeds, brand controls, version history, and integration readiness. MyDogPortal software is not included." },
  "brand-launch": { name: "Brand Launch", notes: "$149 setup for an available standard .com, domain/DNS/SSL configuration, and first-year registration. Managed standard .com renewal is $39/year after year one. Premium domains are priced separately." },
  "website-personalization": { name: "Breeder Website Personalization", notes: "$299 one-time. Personalizes a supported MyDogPortal website style with the kennel identity, colors, photography, content, and connected MyDogPortal information where supported." },
  "custom-website": { name: "Custom Breeder Website", notes: "From $749. Custom layout and page planning, brand/photography/content implementation, and connected MyDogPortal information where supported. Final scope and price are confirmed before work begins." },
  "business-voice": { name: "Business Voice", notes: "$69 setup plus local number at $8.99/month or $99/year. Includes custom IVR/menu, business hours, voicemail and routing. Incoming calls are $0.03/minute and outgoing calls are $0.04/minute. SMS is not offered." },
};

const websiteTemplateDetails: Record<string, { name: string; notes: string }> = {
  "willow-creek": { name: "Willow Creek", notes: "Website Template 01 — boutique Chihuahua demonstration style. Replace demonstration kennel identity, breed, dogs, photography, colors, policies, and content with the customer's program." },
  "cedar-creek": { name: "Cedar & Creek", notes: "Website Template 02 — warm editorial Golden Retriever demonstration style. Replace demonstration kennel identity, breed, dogs, photography, colors, policies, and content with the customer's program." },
  "northstar-poodles": { name: "Northstar", notes: "Website Template 03 — luxury editorial Standard Poodle demonstration style. Replace demonstration kennel identity, breed, dogs, photography, colors, policies, and content with the customer's program." },
  "bluebird-aussies": { name: "Bluebird", notes: "Website Template 04 — bright modern-ranch Australian Shepherd demonstration style. Replace demonstration kennel identity, breed, dogs, photography, colors, policies, and content with the customer's program." },
  "ironwood-shepherds": { name: "Ironwood", notes: "Website Template 05 — structured performance German Shepherd demonstration style. Replace demonstration kennel identity, breed, dogs, photography, colors, policies, and content with the customer's program." },
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
    const plan: BreederSession["plan"] = "starter";
    const requestedPlan = String(body.requested_plan ?? "starter");
    const checkoutPlan = (["starter", "professional", "studio"] as const).includes(requestedPlan as "starter" | "professional" | "studio")
      ? requestedPlan
      : "starter";
    const account = await createBreederAccount({
      email: String(body.email ?? ""), password: String(body.password ?? ""),
      kennelName: String(body.kennel_name ?? ""), kennelSlug: String(body.kennel_slug ?? ""), plan,
    });
    const foundingPricing = await foundingEligibilityForNewSignup();
    const requestedSetupIds = Array.isArray(body.setup_requests)
      ? [...new Set(body.setup_requests.map((item) => String(item)).filter((item) => setupRequestDetails[item]))]
      : [];
    const requestedWebsiteTemplate = websiteTemplateDetails[String(body.website_template ?? "")];
    const eventDate = new Date().toISOString().slice(0, 10);
    const platformEvents: Array<Promise<unknown>> = [
      createSupabaseResource("events", {
        title: "MyDogPortal trial signup",
        event_type: "Trial Signup",
        event_date: eventDate,
        status: "Checkout Pending",
        notes: JSON.stringify({ requested_plan: checkoutPlan, trial_days: 14, founding_pricing: foundingPricing, founding_limit: FOUNDING_BREEDER_LIMIT }),
      }, account.kennel.id),
    ];
    for (const id of requestedSetupIds) {
      const service = setupRequestDetails[id];
      platformEvents.push(createSupabaseResource("events", {
        title: `Setup request: ${service.name}`,
        event_type: "Setup Request",
        event_date: eventDate,
        status: "Requested",
        notes: service.notes,
      }, account.kennel.id));
    }
    if (requestedWebsiteTemplate) platformEvents.push(createSupabaseResource("events", {
      title: `Website template: ${requestedWebsiteTemplate.name}`,
      event_type: "Setup Request",
      event_date: eventDate,
      status: "Requested",
      notes: requestedWebsiteTemplate.notes,
    }, account.kennel.id));
    await Promise.all(platformEvents);
    const claims = breederSessionClaims(account);
    const pendingClaims = { ...claims, billingStatus: "pending" as const };
    const token = createBreederSessionToken(pendingClaims);
    if (!token) return Response.json({ error: "Set BREEDER_SESSION_SECRET to a random value of at least 32 characters." }, { status: 503 });
    const requestUrl = new URL(request.url);
    const billingPath = "/billing?welcome=1&plan=" + encodeURIComponent(checkoutPlan);
    const redirect = ["localhost", "127.0.0.1"].includes(requestUrl.hostname) || requestUrl.hostname.endsWith(".vercel.app")
      ? requestUrl.origin + billingPath
      : tenantUrl(pendingClaims, billingPath);
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
