import { breederSessionFromRequest } from "../../../../lib/breeder-session";
import {
  ensurePayPalCatalog,
  ensurePayPalWebhook,
  oneTimeOfferings,
  paypalClientId,
  paypalEnvironment,
  planChangeOfferings,
  recurringOfferings,
} from "../../../../lib/paypal";
import { foundingPricingStatus, isFoundingOfferingKey } from "../../../../lib/founding-pricing";
import { loadBreederAccount } from "../../../../lib/breeder-account";

export const runtime = "nodejs";

function webhookUrl(request: Request) {
  const configured = process.env.PAYPAL_WEBHOOK_URL?.trim();
  if (configured) return configured;
  const platform = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN?.trim().toLowerCase() || "mydogportal.site";
  const requestUrl = new URL(request.url);
  if (["localhost", "127.0.0.1"].includes(requestUrl.hostname) || requestUrl.hostname.endsWith(".vercel.app")) {
    return new URL("/api/paypal/webhook", requestUrl.origin).toString();
  }
  return `https://${platform}/api/paypal/webhook`;
}

export async function POST(request: Request) {
  const session = breederSessionFromRequest(request);
  if (!session) return Response.json({ error: "Sign in to configure billing." }, { status: 401 });
  if (!["owner", "admin"].includes(session.role)) return Response.json({ error: "Owner or admin access is required." }, { status: 403 });

  try {
    const [planIds, founding, account] = await Promise.all([ensurePayPalCatalog(), foundingPricingStatus(session.kennelId), loadBreederAccount(session.kennelId)]);
    await ensurePayPalWebhook(webhookUrl(request));
    const visibleRecurring = recurringOfferings.filter((offering) => offering.group !== "platform" || (founding.eligible ? isFoundingOfferingKey(offering.key) : !isFoundingOfferingKey(offering.key)));
    return Response.json({
      founding,
      clientId: paypalClientId(),
      environment: paypalEnvironment(),
      kennelId: session.kennelId,
      currentPlan: session.plan,
      currentSubscriptionId: account.subscription?.paypalId || "",
      currentOfferingKey: account.subscription?.offeringKey || "",
      recurring: visibleRecurring.map((offering) => ({
        key: offering.key,
        group: offering.group,
        name: offering.name,
        description: offering.description,
        price: offering.price,
        interval: offering.intervalLabel,
        setupFee: offering.setupFee || null,
        hasTrial: Boolean(offering.trial && offering.group === "platform"),
        planId: planIds[offering.key],
      })),
      changes: account.subscription ? planChangeOfferings
        .filter((offering) => offering.changeOf && (founding.eligible ? isFoundingOfferingKey(offering.changeOf) : !isFoundingOfferingKey(offering.changeOf)))
        .map((offering) => ({
          key: offering.key,
          group: offering.group,
          name: offering.name,
          description: offering.description,
          price: offering.price,
          interval: offering.intervalLabel,
          setupFee: null,
          hasTrial: false,
          planId: planIds[offering.key],
        })) : [],
      oneTime: oneTimeOfferings.map((offering) => ({
        key: offering.key,
        name: offering.name,
        description: offering.description,
        price: offering.price,
      })),
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PayPal billing could not be initialized.";
    return Response.json({ error: message }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
