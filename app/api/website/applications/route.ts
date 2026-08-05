import { createHash } from "node:crypto";
import { createSupabaseResource, updateSupabaseResource } from "../../../../db/supabase-kennel";
import { getSupabaseConfig, supabaseRequest } from "../../../../db/supabase";
import { sendOwnerNotification, sendTemplateEmail } from "../../../../lib/email-service";
import { createPortalToken } from "../../../../lib/portal-token";
import { findKennelByHost } from "../../../../lib/supabase-auth";
import {
  applicationBuyerInput,
  isAllowedWebsiteOrigin,
  normalizeWebsiteApplication,
  websiteCorsHeaders,
} from "../../../../lib/website-integration";

type BuyerRow = Record<string, unknown> & { id: number; first_name?: string; email?: string; application_status?: string; notes?: string };

function response(origin: string | null, host: string | null, payload: Record<string, unknown>, status = 200) {
  return Response.json(payload, { status, headers: websiteCorsHeaders(origin, host) });
}

function retainAdvancedStatus(status: unknown) {
  const value = String(status ?? "");
  return ["Approved", "Waitlist", "Wait list", "Matched", "Placed"].includes(value) ? value : "Applied";
}

async function existingBuyer(email: string, kennelId: string) {
  const params = new URLSearchParams({ select: "*", email: `ilike.${email}`, kennel_id: `eq.${kennelId}`, limit: "1" });
  const found = await supabaseRequest(`rest/v1/buyers?${params}`, { cache: "no-store" });
  if (!found.ok) throw new Error("Unable to check the family record.");
  return ((await found.json()) as BuyerRow[])[0] ?? null;
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  return new Response(null, {
    status: isAllowedWebsiteOrigin(origin, host) ? 204 : 403,
    headers: websiteCorsHeaders(origin, host),
  });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!isAllowedWebsiteOrigin(origin, host)) return response(origin, host, { error: "This submission source is not allowed." }, 403);

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 75_000) return response(origin, host, { error: "The application is too large." }, 413);

  try {
    if (!getSupabaseConfig().serviceRoleKey) {
      return response(origin, host, { error: "Application intake is temporarily unavailable." }, 503);
    }
    const kennel = await findKennelByHost(host || "");
    if (!kennel) return response(origin, host, { error: "This application form is not connected to a kennel." }, 404);
    const application = normalizeWebsiteApplication(await request.json());
    const receivedAt = new Date().toISOString();
    const input = applicationBuyerInput(application, receivedAt);
    const current = await existingBuyer(String(input.email), kennel.id);
    let buyer: BuyerRow;

    if (current) {
      buyer = await updateSupabaseResource("buyers", Number(current.id), {
        ...input,
        application_status: retainAdvancedStatus(current.application_status),
        notes: [String(current.notes ?? "").trim(), String(input.notes)].filter(Boolean).join("\n\n---\n\n").slice(-30_000),
      }, kennel.id) as BuyerRow;
    } else {
      buyer = await createSupabaseResource("buyers", input, kennel.id) as BuyerRow;
    }

    let confirmationEmailSent = false;
    let portalSetupUrl = "";
    try {
      const fingerprint = createHash("sha256")
        .update(`${String(input.email)}|${JSON.stringify(application)}`)
        .digest("hex")
        .slice(0, 20);
      const setupToken = await createPortalToken(Number(buyer.id), 7, kennel.id);
      portalSetupUrl = `${new URL(request.url).origin}/portal/setup?token=${encodeURIComponent(setupToken)}`;
      const email = await sendTemplateEmail({
        kennelId: kennel.id,
        templateKey: "application_received",
        buyerId: Number(buyer.id),
        to: String(buyer.email || input.email),
        dedupeKey: `website-application-${fingerprint}`,
        variables: {
          first_name: String(buyer.first_name || String(application.full_name).split(/\s+/)[0] || "there"),
          portal_url: portalSetupUrl,
        },
      });
      confirmationEmailSent = email.sent === true;
    } catch (error) {
      console.error("Website application confirmation failed", error instanceof Error ? error.message : error);
    }

    let ownerNotificationSent = false;
    try {
      const ownerEmail = await sendOwnerNotification({
        kennelId: kennel.id,
        kennelName: kennel.name,
        category: "Application",
        subject: `New puppy application from ${String(application.full_name)}`,
        buyerId: Number(buyer.id),
        body: [
          `A puppy application was submitted through ${new URL(request.url).host}.`,
          "",
          `Applicant: ${String(application.full_name)}`,
          `Email: ${String(application.email)}`,
          `Phone: ${String(application.phone)}`,
          `Location: ${String(application.city_state || "Not provided")}`,
          `Preferred size: ${String(application.placement_pref || "Not provided")}`,
          `Specific puppy or litter: ${String(application.specific_puppy || "Not provided")}`,
          `Application status: ${retainAdvancedStatus(buyer.application_status)}`,
          "Small-puppy policy acknowledged: Yes",
          `Portal setup email: ${confirmationEmailSent ? "Sent" : "Not sent"}`,
          "",
          "Review the full application in Breeder Portal:",
          `${new URL(request.url).origin}/?view=Applications`,
        ].join("\n"),
      });
      ownerNotificationSent = ownerEmail.sent === true;
    } catch (error) {
      console.error("Owner application notification failed", error instanceof Error ? error.message : error);
    }

    return response(origin, host, {
      ok: true,
      application_id: Number(buyer.id),
      status: retainAdvancedStatus(buyer.application_status),
      confirmation_email_sent: confirmationEmailSent,
      portal_setup_ready: Boolean(portalSetupUrl),
      owner_notification_sent: ownerNotificationSent,
    }, current ? 200 : 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save the application.";
    const status = /valid|must|required|acknowledgement|full name|phone number|accept/i.test(message) ? 400 : 500;
    return response(origin, host, { error: status === 400 ? message : "Unable to save the application right now." }, status);
  }
}
