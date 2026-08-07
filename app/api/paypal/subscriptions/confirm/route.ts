import { NextResponse } from "next/server";
import {
  BREEDER_SESSION_COOKIE,
  breederSessionFromRequest,
  createBreederSessionToken,
} from "../../../../../lib/breeder-session";
import { recordPayPalBillingEvent, setKennelPlan } from "../../../../../lib/paypal-billing";
import { ensurePayPalCatalog, getPayPalSubscription, recurringOffering } from "../../../../../lib/paypal";

export const runtime = "nodejs";

function cookieDomain(request: Request) {
  if (process.env.NODE_ENV !== "production") return undefined;
  const host = new URL(request.url).hostname.toLowerCase();
  const platform = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "mydogportal.site";
  return host === platform || host.endsWith(`.${platform}`) ? `.${platform}` : undefined;
}

export async function POST(request: Request) {
  const session = breederSessionFromRequest(request);
  if (!session) return Response.json({ error: "Sign in before confirming a subscription." }, { status: 401 });
  if (!["owner", "admin"].includes(session.role)) return Response.json({ error: "Owner or admin access is required." }, { status: 403 });

  try {
    const body = await request.json() as { subscription_id?: string; offering_key?: string };
    const subscriptionId = String(body.subscription_id || "");
    const offering = recurringOffering(String(body.offering_key || ""));
    if (!offering) return Response.json({ error: "Unknown subscription offering." }, { status: 400 });

    const planIds = await ensurePayPalCatalog();
    const expectedPlanId = planIds[offering.key];
    const subscription = await getPayPalSubscription(subscriptionId);
    if (!expectedPlanId || subscription.plan_id !== expectedPlanId) {
      return Response.json({ error: "The approved PayPal subscription does not match the selected MyDogPortal offering." }, { status: 409 });
    }

    const status = String(subscription.status || "APPROVAL_PENDING").toUpperCase();
    await recordPayPalBillingEvent({
      kennelId: session.kennelId,
      title: `PayPal subscription: ${offering.name}`,
      status,
      notes: {
        provider: "paypal",
        kind: "subscription",
        offering_key: offering.key,
        paypal_id: subscription.id,
        paypal_plan_id: subscription.plan_id,
        entitlement_plan: offering.entitlementPlan,
        amount: offering.price,
        currency: "USD",
        next_billing_time: subscription.billing_info?.next_billing_time || null,
      },
    });

    let response = NextResponse.json({
      confirmed: true,
      status,
      subscriptionId: subscription.id,
      offering: offering.key,
      trial: offering.group === "platform" ? "14 days" : null,
    });

    if (offering.entitlementPlan && ["ACTIVE", "APPROVED"].includes(status)) {
      await setKennelPlan(session.kennelId, offering.entitlementPlan);
      const token = createBreederSessionToken({
        userId: session.userId,
        kennelId: session.kennelId,
        kennelSlug: session.kennelSlug,
        kennelName: session.kennelName,
        role: session.role,
        plan: offering.entitlementPlan,
        customDomain: session.customDomain,
        billingStatus: "active",
      });
      if (token) {
        response.cookies.set({
          name: BREEDER_SESSION_COOKIE,
          value: token,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 30 * 86400,
          domain: cookieDomain(request),
        });
      }
    }
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify the PayPal subscription.";
    return Response.json({ error: message }, { status: 502, headers: { "cache-control": "no-store" } });
  }
}
