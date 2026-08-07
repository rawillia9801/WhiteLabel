import "server-only";

import { randomUUID } from "node:crypto";

export type PayPalEntitlementPlan = "starter" | "professional" | "custom_domain" | null;
export type PayPalOfferingGroup = "platform" | "service";

export type RecurringOffering = {
  key: string;
  group: PayPalOfferingGroup;
  productName: string;
  planName: string;
  name: string;
  description: string;
  price: string;
  intervalUnit: "MONTH" | "YEAR";
  intervalLabel: "month" | "year";
  trial?: { intervalUnit: "DAY" | "YEAR"; intervalCount: number };
  setupFee?: string;
  entitlementPlan: PayPalEntitlementPlan;
};

export type OneTimeOffering = {
  key: string;
  name: string;
  description: string;
  price: string;
};

export const recurringOfferings: readonly RecurringOffering[] = [
  { key: "starter-monthly", group: "platform", productName: "MyDogPortal Starter", planName: "Starter Monthly", name: "Starter", description: "MyDogPortal Starter with a 14-day free trial, then $29/month.", price: "29.00", intervalUnit: "MONTH", intervalLabel: "month", trial: { intervalUnit: "DAY", intervalCount: 14 }, entitlementPlan: "starter" },
  { key: "starter-annual", group: "platform", productName: "MyDogPortal Starter", planName: "Starter Annual", name: "Starter", description: "MyDogPortal Starter with a 14-day free trial, then $290/year.", price: "290.00", intervalUnit: "YEAR", intervalLabel: "year", trial: { intervalUnit: "DAY", intervalCount: 14 }, entitlementPlan: "starter" },
  { key: "professional-monthly", group: "platform", productName: "MyDogPortal Professional", planName: "Professional Monthly", name: "Professional", description: "MyDogPortal Professional with a 14-day free trial, then $59/month.", price: "59.00", intervalUnit: "MONTH", intervalLabel: "month", trial: { intervalUnit: "DAY", intervalCount: 14 }, entitlementPlan: "professional" },
  { key: "professional-annual", group: "platform", productName: "MyDogPortal Professional", planName: "Professional Annual", name: "Professional", description: "MyDogPortal Professional with a 14-day free trial, then $590/year.", price: "590.00", intervalUnit: "YEAR", intervalLabel: "year", trial: { intervalUnit: "DAY", intervalCount: 14 }, entitlementPlan: "professional" },
  { key: "studio-monthly", group: "platform", productName: "MyDogPortal Studio", planName: "Studio Monthly", name: "Studio", description: "MyDogPortal Studio with a 14-day free trial, then $99/month.", price: "99.00", intervalUnit: "MONTH", intervalLabel: "month", trial: { intervalUnit: "DAY", intervalCount: 14 }, entitlementPlan: "custom_domain" },
  { key: "studio-annual", group: "platform", productName: "MyDogPortal Studio", planName: "Studio Annual", name: "Studio", description: "MyDogPortal Studio with a 14-day free trial, then $990/year.", price: "990.00", intervalUnit: "YEAR", intervalLabel: "year", trial: { intervalUnit: "DAY", intervalCount: 14 }, entitlementPlan: "custom_domain" },
  { key: "hosting-monthly", group: "service", productName: "Dog Breeder Website Hosting and Email", planName: "Breeder Hosting Monthly", name: "Website Hosting + Business Email", description: "Standalone dog-breeder website hosting with two branded business email addresses.", price: "17.95", intervalUnit: "MONTH", intervalLabel: "month", entitlementPlan: null },
  { key: "brand-launch-renewal", group: "service", productName: "Dog Breeder Brand Launch", planName: "Brand Launch + Domain Renewal", name: "Brand Launch", description: "$149 setup and standard .com registration, then $29/year managed renewal after the first year.", price: "29.00", intervalUnit: "YEAR", intervalLabel: "year", trial: { intervalUnit: "YEAR", intervalCount: 1 }, setupFee: "149.00", entitlementPlan: null },
  { key: "business-voice-monthly", group: "service", productName: "Dog Breeder Business Voice", planName: "Business Voice Monthly", name: "Business Voice", description: "$69 setup plus a local business number at $8.99/month. Metered calling usage is billed separately.", price: "8.99", intervalUnit: "MONTH", intervalLabel: "month", setupFee: "69.00", entitlementPlan: null },
  { key: "business-voice-annual", group: "service", productName: "Dog Breeder Business Voice", planName: "Business Voice Annual", name: "Business Voice", description: "$69 setup plus a local business number at $99/year. Metered calling usage is billed separately.", price: "99.00", intervalUnit: "YEAR", intervalLabel: "year", setupFee: "69.00", entitlementPlan: null },
] as const;

export const oneTimeOfferings: readonly OneTimeOffering[] = [
  { key: "website-personalization", name: "Breeder Website Personalization", description: "Personalize a supported MyDogPortal website style around the breeder's kennel, content, photography, colors, and connected information.", price: "299.00" },
] as const;

type PayPalProduct = { id: string; name?: string };
type PayPalPlan = { id: string; name?: string; status?: string };
type PayPalLink = { href?: string; rel?: string };
type PayPalOrder = {
  id: string;
  status?: string;
  links?: PayPalLink[];
  purchase_units?: Array<{ custom_id?: string; payments?: { captures?: Array<{ id?: string; status?: string }> } }>;
};
type PayPalSubscription = {
  id: string;
  status?: string;
  plan_id?: string;
  custom_id?: string;
  billing_info?: { next_billing_time?: string };
};
type PayPalWebhook = { id: string; url?: string };

let tokenCache: { value: string; expiresAt: number } | null = null;

function environment() {
  return process.env.PAYPAL_ENVIRONMENT?.trim().toLowerCase() === "sandbox" ? "sandbox" : "live";
}

function apiBase() {
  return environment() === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
}

export function paypalClientId() {
  const value = process.env.PAYPAL_CLIENT_ID?.trim();
  if (!value) throw new Error("PayPal checkout is not configured. Set PAYPAL_CLIENT_ID in the deployment environment.");
  return value;
}

function paypalClientSecret() {
  const value = process.env.PAYPAL_CLIENT_SECRET?.trim();
  if (!value) throw new Error("PayPal checkout is not configured. Set PAYPAL_CLIENT_SECRET in the deployment environment.");
  return value;
}

export function paypalEnvironment() {
  return environment();
}

async function accessToken(force = false) {
  if (!force && tokenCache && tokenCache.expiresAt > Date.now() + 30_000) return tokenCache.value;
  const credentials = Buffer.from(`${paypalClientId()}:${paypalClientSecret()}`).toString("base64");
  const response = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      authorization: `Basic ${credentials}`,
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null) as { access_token?: string; expires_in?: number; error_description?: string } | null;
  if (!response.ok || !payload?.access_token) throw new Error(payload?.error_description || "PayPal authentication failed.");
  tokenCache = {
    value: payload.access_token,
    expiresAt: Date.now() + Math.max(60, Number(payload.expires_in || 300)) * 1000,
  };
  return tokenCache.value;
}

async function requestWithToken<T>(path: string, init: RequestInit, token: string) {
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${token}`);
  headers.set("accept", "application/json");
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const response = await fetch(`${apiBase()}${path}`, { ...init, headers, cache: "no-store" });
  const payload = await response.json().catch(() => null) as T & { message?: string; details?: Array<{ description?: string }> } | null;
  return { response, payload };
}

export async function paypalRequest<T>(path: string, init: RequestInit = {}) {
  let result = await requestWithToken<T>(path, init, await accessToken());
  if (result.response.status === 401) {
    tokenCache = null;
    result = await requestWithToken<T>(path, init, await accessToken(true));
  }
  if (!result.response.ok) {
    const detail = result.payload?.details?.find((item) => item.description)?.description;
    throw new Error(detail || result.payload?.message || `PayPal request failed with status ${result.response.status}.`);
  }
  return result.payload as T;
}

function requestId(prefix: string, value: string) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  return `mydogportal-${prefix}-${normalized}`;
}

async function ensureProduct(productName: string) {
  const listed = await paypalRequest<{ products?: PayPalProduct[] }>("/v1/catalogs/products?page_size=100&total_required=true");
  const existing = (listed.products || []).find((product) => product.name === productName && product.id);
  if (existing?.id) return existing.id;
  const created = await paypalRequest<PayPalProduct>("/v1/catalogs/products", {
    method: "POST",
    headers: { "paypal-request-id": requestId("product", productName) },
    body: JSON.stringify({
      name: productName,
      description: `${productName} — managed MyDogPortal billing`,
      type: "SERVICE",
    }),
  });
  if (!created.id) throw new Error(`PayPal did not return a product ID for ${productName}.`);
  return created.id;
}

function billingCycles(offering: RecurringOffering) {
  const cycles: Array<Record<string, unknown>> = [];
  if (offering.trial) {
    cycles.push({
      frequency: { interval_unit: offering.trial.intervalUnit, interval_count: offering.trial.intervalCount },
      tenure_type: "TRIAL",
      sequence: 1,
      total_cycles: 1,
      pricing_scheme: { fixed_price: { value: "0", currency_code: "USD" } },
    });
  }
  cycles.push({
    frequency: { interval_unit: offering.intervalUnit, interval_count: 1 },
    tenure_type: "REGULAR",
    sequence: cycles.length + 1,
    total_cycles: 0,
    pricing_scheme: { fixed_price: { value: offering.price, currency_code: "USD" } },
  });
  return cycles;
}

async function ensurePlansForProduct(productId: string, offerings: readonly RecurringOffering[]) {
  const listed = await paypalRequest<{ plans?: PayPalPlan[] }>(`/v1/billing/plans?product_id=${encodeURIComponent(productId)}`);
  const plans = listed.plans || [];
  const result: Record<string, string> = {};
  for (const offering of offerings) {
    const existing = plans.find((plan) => plan.name === offering.planName && plan.id && plan.status !== "INACTIVE");
    if (existing?.id) {
      result[offering.key] = existing.id;
      continue;
    }
    const paymentPreferences: Record<string, unknown> = {
      auto_bill_outstanding: true,
      payment_failure_threshold: 3,
    };
    if (offering.setupFee) paymentPreferences.setup_fee = { value: offering.setupFee, currency_code: "USD" };
    const created = await paypalRequest<PayPalPlan>("/v1/billing/plans", {
      method: "POST",
      headers: { "paypal-request-id": requestId("plan", offering.planName) },
      body: JSON.stringify({
        product_id: productId,
        name: offering.planName,
        description: offering.description,
        billing_cycles: billingCycles(offering),
        payment_preferences: paymentPreferences,
      }),
    });
    if (!created.id) throw new Error(`PayPal did not return a billing plan ID for ${offering.planName}.`);
    result[offering.key] = created.id;
  }
  return result;
}

export async function ensurePayPalCatalog() {
  const grouped = new Map<string, RecurringOffering[]>();
  for (const offering of recurringOfferings) {
    const entries = grouped.get(offering.productName) || [];
    entries.push(offering);
    grouped.set(offering.productName, entries);
  }
  const planIds: Record<string, string> = {};
  for (const [productName, offerings] of grouped.entries()) {
    const productId = await ensureProduct(productName);
    Object.assign(planIds, await ensurePlansForProduct(productId, offerings));
  }
  return planIds;
}

export function recurringOffering(key: string) {
  return recurringOfferings.find((offering) => offering.key === key) || null;
}

export function oneTimeOffering(key: string) {
  return oneTimeOfferings.find((offering) => offering.key === key) || null;
}

export async function getPayPalSubscription(subscriptionId: string) {
  if (!/^I-[A-Z0-9]+$/i.test(subscriptionId)) throw new Error("Invalid PayPal subscription ID.");
  return paypalRequest<PayPalSubscription>(`/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`);
}

export async function createPayPalOrder(input: { offering: OneTimeOffering; kennelId: string; returnUrl: string; cancelUrl: string }) {
  const customId = `kennel:${input.kennelId};offering:${input.offering.key}`;
  const order = await paypalRequest<PayPalOrder>("/v2/checkout/orders", {
    method: "POST",
    headers: { "paypal-request-id": `mydogportal-order-${randomUUID()}` },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        custom_id: customId,
        description: input.offering.description,
        amount: {
          currency_code: "USD",
          value: input.offering.price,
          breakdown: { item_total: { currency_code: "USD", value: input.offering.price } },
        },
        items: [{
          name: input.offering.name,
          description: input.offering.description,
          quantity: "1",
          unit_amount: { currency_code: "USD", value: input.offering.price },
          category: "DIGITAL_GOODS",
        }],
      }],
      application_context: {
        brand_name: "MyDogPortal",
        user_action: "PAY_NOW",
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl,
      },
    }),
  });
  const approvalUrl = order.links?.find((link) => link.rel === "approve")?.href;
  if (!order.id || !approvalUrl) throw new Error("PayPal did not return an approval link.");
  return { ...order, approvalUrl };
}

export async function getPayPalOrder(orderId: string) {
  if (!/^[A-Z0-9]+$/i.test(orderId)) throw new Error("Invalid PayPal order ID.");
  return paypalRequest<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(orderId)}`);
}

export async function capturePayPalOrder(orderId: string) {
  if (!/^[A-Z0-9]+$/i.test(orderId)) throw new Error("Invalid PayPal order ID.");
  return paypalRequest<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    headers: { "paypal-request-id": `mydogportal-capture-${orderId}` },
    body: "{}",
  });
}

const webhookEvents = [
  "BILLING.SUBSCRIPTION.ACTIVATED",
  "BILLING.SUBSCRIPTION.CANCELLED",
  "BILLING.SUBSCRIPTION.SUSPENDED",
  "BILLING.SUBSCRIPTION.EXPIRED",
  "PAYMENT.SALE.COMPLETED",
  "PAYMENT.SALE.DENIED",
  "PAYMENT.CAPTURE.COMPLETED",
  "PAYMENT.CAPTURE.DENIED",
] as const;

export async function ensurePayPalWebhook(url: string) {
  const configuredId = process.env.PAYPAL_WEBHOOK_ID?.trim();
  if (configuredId) return configuredId;
  const listed = await paypalRequest<{ webhooks?: PayPalWebhook[] }>("/v1/notifications/webhooks");
  const existing = (listed.webhooks || []).find((webhook) => webhook.url === url && webhook.id);
  if (existing?.id) return existing.id;
  const created = await paypalRequest<PayPalWebhook>("/v1/notifications/webhooks", {
    method: "POST",
    headers: { "paypal-request-id": requestId("webhook", url) },
    body: JSON.stringify({
      url,
      event_types: webhookEvents.map((name) => ({ name })),
    }),
  });
  if (!created.id) throw new Error("PayPal did not return a webhook ID.");
  return created.id;
}

export async function verifyPayPalWebhook(input: { webhookId: string; request: Request; event: unknown }) {
  const required = (name: string) => {
    const value = input.request.headers.get(name);
    if (!value) throw new Error(`Missing PayPal webhook header: ${name}.`);
    return value;
  };
  const result = await paypalRequest<{ verification_status?: string }>("/v1/notifications/verify-webhook-signature", {
    method: "POST",
    body: JSON.stringify({
      auth_algo: required("paypal-auth-algo"),
      cert_url: required("paypal-cert-url"),
      transmission_id: required("paypal-transmission-id"),
      transmission_sig: required("paypal-transmission-sig"),
      transmission_time: required("paypal-transmission-time"),
      webhook_id: input.webhookId,
      webhook_event: input.event,
    }),
  });
  return result.verification_status === "SUCCESS";
}
