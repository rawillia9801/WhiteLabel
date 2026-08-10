import "server-only";

import { supabaseRequest } from "../db/supabase";
import { findKennelById } from "./supabase-auth";
import { isPlatformOfferingKey } from "./founding-pricing";

type AccountEventRow = {
  id: number;
  kennel_id: string;
  title: string;
  event_type: string;
  event_date: string;
  status: string;
  notes: string | null;
  created_at: string;
};

type BillingNotes = {
  provider?: string;
  kind?: "subscription" | "order" | "payment";
  offering_key?: string;
  paypal_id?: string;
  paypal_plan_id?: string;
  entitlement_plan?: "starter" | "professional" | "custom_domain" | null;
  amount?: string;
  currency?: string;
  next_billing_time?: string | null;
};

type EntitlementRow = {
  entitlement_key: string;
  source: string;
  source_reference: string;
  status: string;
  starts_at: string;
  ends_at: string | null;
};

function parseBilling(notes: string | null) {
  if (!notes) return null;
  try {
    const value = JSON.parse(notes) as BillingNotes;
    return value.provider === "paypal" ? value : null;
  } catch {
    return null;
  }
}

function isPlatformOffering(key: string | undefined) {
  return Boolean(key && isPlatformOfferingKey(key));
}

function activeStatus(status: string) {
  return ["ACTIVE", "APPROVED"].includes(status.toUpperCase());
}

async function accountEvents(kennelId: string) {
  const filters = [
    "select=id,kennel_id,title,event_type,event_date,status,notes,created_at",
    `kennel_id=eq.${encodeURIComponent(kennelId)}`,
    "event_type=in.%28Billing%2C%22Trial%20Signup%22%29",
    "order=created_at.desc",
    "limit=500",
  ];
  const response = await supabaseRequest(`rest/v1/events?${filters.join("&")}`, { cache: "no-store" });
  const payload = await response.json().catch(() => null) as AccountEventRow[] | { message?: string } | null;
  if (!response.ok) throw new Error((payload as { message?: string } | null)?.message || "Unable to read breeder billing history.");
  return Array.isArray(payload) ? payload : [];
}

async function connectedEntitlements(kennelId: string) {
  const filters = [
    "select=entitlement_key,source,source_reference,status,starts_at,ends_at",
    `kennel_id=eq.${encodeURIComponent(kennelId)}`,
    "status=eq.active",
    "order=created_at.desc",
  ];
  const response = await supabaseRequest(`rest/v1/platform_entitlements?${filters.join("&")}`, { cache: "no-store" });
  const payload = await response.json().catch(() => null) as EntitlementRow[] | { message?: string } | null;
  if (!response.ok) {
    const message = (payload as { message?: string } | null)?.message || "Unable to read connected platform access.";
    if (/platform_entitlements/i.test(message)) return [];
    throw new Error(message);
  }
  return Array.isArray(payload) ? payload : [];
}

export async function breederCheckoutRequired(kennelId: string) {
  const [events, entitlements] = await Promise.all([accountEvents(kennelId), connectedEntitlements(kennelId)]);
  const connectedPortal = entitlements.some((row) => row.entitlement_key === "mydogportal" && row.status === "active");
  if (connectedPortal) return false;

  const hasManagedTrialSignup = events.some((event) => event.event_type === "Trial Signup");
  if (!hasManagedTrialSignup) return false;
  return !events.some((event) => {
    if (event.event_type !== "Billing" || !activeStatus(event.status)) return false;
    const billing = parseBilling(event.notes);
    return billing?.kind === "subscription" && isPlatformOffering(billing.offering_key);
  });
}

function planLabel(value: string | undefined) {
  if (value === "custom_domain" || value === "studio") return "Studio";
  if (value === "professional") return "Professional";
  return "Starter";
}

function offeringLabel(key: string | undefined) {
  if (!key) return "PayPal";
  return key.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export async function loadBreederAccount(kennelId: string) {
  const [kennel, events, entitlements] = await Promise.all([
    findKennelById(kennelId),
    accountEvents(kennelId),
    connectedEntitlements(kennelId),
  ]);
  if (!kennel) throw new Error("Kennel account not found.");

  const billing = events
    .filter((event) => event.event_type === "Billing")
    .map((event) => ({ event, billing: parseBilling(event.notes) }))
    .filter((item): item is { event: AccountEventRow; billing: BillingNotes } => Boolean(item.billing));

  const platformSubscription = billing.find((item) =>
    item.billing.kind === "subscription"
    && isPlatformOffering(item.billing.offering_key)
    && activeStatus(item.event.status)
  ) || null;

  const connectedWebsite = entitlements.find((row) =>
    row.entitlement_key === "dogbreederweb"
    && row.source === "dogbreederweb_subscription"
    && row.status === "active"
  ) || null;
  const connectedPortal = entitlements.some((row) => row.entitlement_key === "mydogportal" && row.status === "active");
  const connectedDocuments = entitlements.some((row) => row.entitlement_key === "dogbreederdocs" && row.status === "active");

  const trialSignup = events.find((event) => event.event_type === "Trial Signup") || null;
  const trialEndsAt = platformSubscription
    ? new Date(new Date(platformSubscription.event.created_at).getTime() + 14 * 86400000).toISOString()
    : null;
  const trialActive = Boolean(trialEndsAt && new Date(trialEndsAt).getTime() > Date.now());

  const receipts = billing
    .filter((item) => item.billing.kind === "payment" || item.billing.kind === "order")
    .map((item) => ({
      id: item.event.id,
      title: offeringLabel(item.billing.offering_key),
      kind: item.billing.kind === "payment" ? "Subscription payment" : "One-time purchase",
      status: item.event.status,
      amount: Number(item.billing.amount || 0) || 0,
      currency: item.billing.currency || "USD",
      paypalId: item.billing.paypal_id || "",
      date: item.event.created_at,
    }));

  const services = billing
    .filter((item) => item.billing.kind === "subscription" && !isPlatformOffering(item.billing.offering_key) && activeStatus(item.event.status))
    .map((item) => ({
      id: item.event.id,
      name: offeringLabel(item.billing.offering_key),
      status: item.event.status,
      price: Number(item.billing.amount || 0) || 0,
      paypalId: item.billing.paypal_id || "",
      nextBillingAt: item.billing.next_billing_time || null,
    }));

  return {
    kennel: {
      id: kennel.id,
      name: kennel.name,
      slug: kennel.slug,
      plan: planLabel(kennel.plan),
      contactEmail: kennel.contact_email || "",
      contactPhone: kennel.contact_phone || "",
      primaryBreed: kennel.primary_breed || "",
      location: kennel.location || "",
      customDomain: kennel.custom_domain || "",
      domainStatus: kennel.domain_status || "",
    },
    subscription: platformSubscription ? {
      status: platformSubscription.event.status,
      offering: offeringLabel(platformSubscription.billing.offering_key),
      offeringKey: platformSubscription.billing.offering_key || "",
      paypalId: platformSubscription.billing.paypal_id || "",
      amount: Number(platformSubscription.billing.amount || 0) || 0,
      nextBillingAt: platformSubscription.billing.next_billing_time || null,
      trialEndsAt,
    } : connectedWebsite ? {
      status: "ACTIVE",
      offering: "Dog Breeder Web Connected Subscription",
      offeringKey: "dogbreederweb-connected",
      paypalId: connectedWebsite.source_reference,
      amount: 24.95,
      nextBillingAt: null,
      trialEndsAt: null,
    } : null,
    checkoutPending: Boolean(trialSignup && !platformSubscription && !connectedPortal),
    trialActive,
    joinedAt: trialSignup?.created_at || connectedWebsite?.starts_at || null,
    receipts,
    services,
    connectedPlatform: {
      website: Boolean(connectedWebsite),
      portal: connectedPortal,
      documents: connectedDocuments,
    },
  };
}
