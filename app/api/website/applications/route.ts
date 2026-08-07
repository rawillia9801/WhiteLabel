import { createHash } from "node:crypto";
import { createSupabaseResource, updateSupabaseResource } from "../../../../db/supabase-kennel";
import { getSupabaseConfig, supabaseRequest } from "../../../../db/supabase";
import { getApplicationFormConfig } from "../../../../lib/application-form-store";
import { sendOwnerNotification, sendTemplateEmail } from "../../../../lib/email-service";
import { findKennelByHost } from "../../../../lib/supabase-auth";
import {
  applicationBuyerInput,
  isAllowedWebsiteOrigin,
  normalizeWebsiteApplication,
  websiteCorsHeaders,
} from "../../../../lib/website-integration";

type BuyerRow = Record<string, unknown> & { id: number; first_name?: string; email?: string; application_status?: string; notes?: string };

function response(origin: string | null, host: string | null, payload: Record<string, unknown>, status = 200, allowedOrigins: string[] = []) {
  return Response.json(payload, { status, headers: websiteCorsHeaders(origin, host, allowedOrigins) });
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
  try {
    const kennel = await findKennelByHost(host || "");
    if (!kennel) return new Response(null, { status: 404 });
    const formConfig = await getApplicationFormConfig(kennel.id);
    const allowedOrigins = [
      ...(formConfig.allowedOrigins ?? []),
      kennel.website_url ?? "",
      kennel.custom_domain ?? "",
    ].filter(Boolean);
    return new Response(null, {
      status: isAllowedWebsiteOrigin(origin, host, allowedOrigins) ? 204 : 403,
      headers: websiteCorsHeaders(origin, host, allowedOrigins),
    });
  } catch {
    return new Response(null, { status: 403 });
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 75_000) return response(origin, host, { error: "The application is too large." }, 413);

  let allowedOrigins: string[] = [];
  try {
    if (!getSupabaseConfig().serviceRoleKey) {
      return response(origin, host, { error: "Application intake is temporarily unavailable." }, 503);
    }
    const kennel = await findKennelByHost(host || "");
    if (!kennel) return response(origin, host, { error: "This application form is not connected to a kennel." }, 404);
    const formConfig = await getApplicationFormConfig(kennel.id);
    allowedOrigins = [
      ...(formConfig.allowedOrigins ?? []),
      kennel.website_url ?? "",
      kennel.custom_domain ?? "",
    ].filter(Boolean);
    if (!isAllowedWebsiteOrigin(origin, host, allowedOrigins)) {
      return response(origin, host, { error: "This submission source is not allowed." }, 403, allowedOrigins);
    }
    const application = normalizeWebsiteApplication(await request.json(), formConfig);
    const receivedAt = new Date().toISOString();
    const input = applicationBuyerInput(application, receivedAt, formConfig);
    const current = await existingBuyer(String(input.email), kennel.id);
    let buyer: BuyerRow;

    if (current) {
      buyer = await updateSupabaseResource("buyers", Number(current.id), {
        ...input,
        application_status: retainAdvancedStatus(current.application_status),
        notes: [String(current.notes ?? "").trim(), String(input.notes)].filter(Boolean).join("\n\n---\n\n"),
      }, kennel.id) as BuyerRow;
    } else {
      buyer = await createSupabaseResource("buyers", input, kennel.id) as BuyerRow;
    }

    let confirmationEmailSent = false;
    try {
      const fingerprint = createHash("sha256")
        .update(`${String(input.email)}|${JSON.stringify(application)}`)
        .digest("hex")
        .slice(0, 20);
      const email = await sendTemplateEmail({
        kennelId: kennel.id,
        templateKey: "application_received",
        buyerId: Number(buyer.id),
        to: String(buyer.email || input.email),
        dedupeKey: `website-application-${fingerprint}`,
        variables: {
          first_name: String(buyer.first_name || input.first_name || "there"),
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
        subject: `New puppy application from ${[input.first_name, input.last_name].filter(Boolean).join(" ")}`,
        buyerId: Number(buyer.id),
        body: [
          `A puppy application was submitted through ${new URL(request.url).host}.`,
          "",
          `Applicant: ${[input.first_name, input.last_name].filter(Boolean).join(" ")}`,
          `Email: ${String(input.email)}`,
          `Phone: ${String(input.phone)}`,
          `Location: ${[input.city, input.state].filter(Boolean).join(", ") || "Not provided"}`,
          `Preferred size: ${String(application.placement_pref || "Not provided")}`,
          `Specific puppy or litter: ${String(application.specific_puppy || "Not provided")}`,
          `Application status: ${retainAdvancedStatus(buyer.application_status)}`,
          `Application confirmation email: ${confirmationEmailSent ? "Sent" : "Not sent"}`,
          "Approval, reservation, contracts, and buyer-portal access remain breeder-controlled next steps.",
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
      portal_setup_ready: false,
      owner_notification_sent: ownerNotificationSent,
    }, current ? 200 : 201, allowedOrigins);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save the application.";
    const status = /valid|must|required|acknowledgement|full name|phone number|accept/i.test(message) ? 400 : 500;
    return response(origin, host, { error: status === 400 ? message : "Unable to save the application right now." }, status, allowedOrigins);
  }
}
