import { ensurePayPalWebhook, verifyPayPalWebhook } from "../../../../lib/paypal";
import { findPayPalBillingEvent, recordPayPalBillingEvent, setKennelPlan, updatePayPalBillingEventByProviderId } from "../../../../lib/paypal-billing";

export const runtime = "nodejs";

type PayPalWebhookEvent = {
  event_type?: string;
  resource?: {
    id?: string;
    status?: string;
    state?: string;
    billing_agreement_id?: string;
    amount?: { total?: string; currency?: string };
    billing_info?: { next_billing_time?: string };
  };
};

function webhookUrl(request: Request) {
  const configured = process.env.PAYPAL_WEBHOOK_URL?.trim();
  if (configured) return configured;
  const platform = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN?.trim().toLowerCase() || "mydogportal.site";
  const requestUrl = new URL(request.url);
  if (["localhost", "127.0.0.1"].includes(requestUrl.hostname) || requestUrl.hostname.endsWith(".vercel.app")) {
    return new URL("/api/paypal/webhook", requestUrl.origin).toString();
  }
  return "https://" + platform + "/api/paypal/webhook";
}

function subscriptionStatus(event: PayPalWebhookEvent) {
  const resourceStatus = String(event.resource?.status || "").trim().toUpperCase();
  if (resourceStatus) return resourceStatus;
  return (String(event.event_type || "").split(".").pop() || "UPDATED").toUpperCase();
}

export async function POST(request: Request) {
  try {
    const event = await request.json() as PayPalWebhookEvent;
    const webhookId = await ensurePayPalWebhook(webhookUrl(request));
    const verified = await verifyPayPalWebhook({ webhookId, request, event });
    if (!verified) return Response.json({ error: "Invalid PayPal webhook signature." }, { status: 400 });

    const eventType = String(event.event_type || "");
    const subscriptionId = String(event.resource?.id || "");
    if (eventType.startsWith("BILLING.SUBSCRIPTION.") && subscriptionId) {
      const existing = await findPayPalBillingEvent(subscriptionId);
      if (existing?.parsed) {
        const status = subscriptionStatus(event);
        await updatePayPalBillingEventByProviderId(subscriptionId, status, {
          next_billing_time: event.resource?.billing_info?.next_billing_time || existing.parsed.next_billing_time || null,
        });
        if (eventType === "BILLING.SUBSCRIPTION.ACTIVATED" && existing.parsed.entitlement_plan) {
          await setKennelPlan(existing.kennel_id, existing.parsed.entitlement_plan);
        }
      }
    }

    if (eventType.startsWith("PAYMENT.SALE.") && event.resource?.id && event.resource.billing_agreement_id) {
      const subscription = await findPayPalBillingEvent(event.resource.billing_agreement_id);
      if (subscription?.parsed?.kind === "subscription") {
        const status = eventType.endsWith(".COMPLETED") ? "COMPLETED" : eventType.endsWith(".DENIED") ? "DENIED" : String(event.resource.state || "UPDATED").toUpperCase();
        await recordPayPalBillingEvent({
          kennelId: subscription.kennel_id,
          title: "PayPal payment: " + subscription.parsed.offering_key,
          status,
          notes: {
            provider: "paypal",
            kind: "payment",
            offering_key: subscription.parsed.offering_key,
            paypal_id: event.resource.id,
            paypal_plan_id: subscription.parsed.paypal_plan_id,
            entitlement_plan: subscription.parsed.entitlement_plan,
            amount: event.resource.amount?.total || subscription.parsed.amount,
            currency: event.resource.amount?.currency || subscription.parsed.currency || "USD",
          },
        });
      }
    }

    return Response.json({ received: true }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process PayPal webhook.";
    return Response.json({ error: message }, { status: 400, headers: { "cache-control": "no-store" } });
  }
}
