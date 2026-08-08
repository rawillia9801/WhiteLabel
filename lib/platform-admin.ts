import "server-only";

import { getSupabaseConfig, supabaseRequest } from "../db/supabase";
import type { BreederSession } from "./breeder-session";
import { listAllSupportTickets, type SupportTicket } from "./support-tickets";

type KennelRow = {
  id: string;
  owner_auth_user_id: string;
  name: string;
  slug: string;
  plan: "starter" | "professional" | "custom_domain";
  custom_domain: string | null;
  domain_status: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
};

type EventRow = {
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
  entitlement_plan?: string | null;
  amount?: string;
  currency?: string;
  next_billing_time?: string | null;
};

type SignupNotes = {
  requested_plan?: "starter" | "professional" | "studio";
  trial_days?: number;
};

export type PlatformAdminDashboardData = {
  generatedAt: string;
  adminEmail: string;
  metrics: {
    totalKennels: number;
    activeTrials: number;
    activePaid: number;
    checkoutIncomplete: number;
    attention: number;
    collected: number;
    recurringRunRate: number;
    openRequests: number;
    openSupportTickets: number;
  };
  planMix: Array<{ plan: string; count: number }>;
  customers: Array<{
    kennelId: string;
    kennelName: string;
    slug: string;
    email: string;
    phone: string;
    plan: string;
    stage: string;
    joinedAt: string;
    trialEndsAt: string | null;
    nextBillingAt: string | null;
    customDomain: string;
  }>;
  payments: Array<{
    id: number;
    kennelName: string;
    email: string;
    offering: string;
    kind: string;
    amount: number;
    status: string;
    paypalId: string;
    createdAt: string;
  }>;
  requests: Array<{
    id: number;
    kennelName: string;
    email: string;
    title: string;
    status: string;
    details: string;
    createdAt: string;
  }>;
  supportTickets: Array<SupportTicket & {
    kennelName: string;
    email: string;
  }>;
  activity: Array<{
    id: number;
    kennelName: string;
    type: string;
    title: string;
    status: string;
    createdAt: string;
  }>;
};

function allowedEmails() {
  return new Set((process.env.PLATFORM_ADMIN_EMAILS || "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean));
}

function allowedUserIds() {
  return new Set((process.env.PLATFORM_ADMIN_USER_IDS || "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean));
}

async function authUserEmail(userId: string) {
  const { url, serviceRoleKey } = getSupabaseConfig();
  if (!serviceRoleKey) throw new Error("Platform administration requires SUPABASE_SERVICE_ROLE_KEY.");
  const response = await fetch(url + "/auth/v1/admin/users/" + encodeURIComponent(userId), {
    headers: {
      apikey: serviceRoleKey,
      authorization: "Bearer " + serviceRoleKey,
      accept: "application/json",
    },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null) as { email?: string; message?: string } | null;
  if (!response.ok) throw new Error(payload?.message || "Unable to verify the platform administrator.");
  return String(payload?.email || "").trim().toLowerCase();
}

export async function authorizePlatformAdmin(session: BreederSession) {
  if (session.role !== "owner") return { allowed: false, email: "", reason: "Only an owner account can be a platform administrator." };
  const emails = allowedEmails();
  const userIds = allowedUserIds();
  const ownerKennelSlug = (process.env.PLATFORM_ADMIN_KENNEL_SLUG || "cray-cray").trim().toLowerCase();
  const directMatch = userIds.has(session.userId.toLowerCase());
  const kennelMatch = Boolean(ownerKennelSlug && session.kennelSlug.toLowerCase() === ownerKennelSlug);
  const email = await authUserEmail(session.userId);
  const emailMatch = email ? emails.has(email) : false;
  const allowed = directMatch || kennelMatch || emailMatch;
  return {
    allowed,
    email,
    reason: allowed ? "" : "This owner account is not assigned MyDogPortal platform-administrator access.",
  };
}

async function restJson<T>(path: string) {
  const response = await supabaseRequest(path, { cache: "no-store" });
  const payload = await response.json().catch(() => null) as T | { message?: string } | null;
  if (!response.ok) throw new Error((payload as { message?: string } | null)?.message || "Unable to load platform administration data.");
  return payload as T;
}

function parseBilling(notes: string | null) {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes) as BillingNotes;
    return parsed?.provider === "paypal" ? parsed : null;
  } catch {
    return null;
  }
}

function parseSignup(notes: string | null) {
  if (!notes) return null;
  try {
    return JSON.parse(notes) as SignupNotes;
  } catch {
    return null;
  }
}

function planFromOffering(offering: string | undefined) {
  if (offering?.startsWith("studio-")) return "Studio";
  if (offering?.startsWith("professional-")) return "Professional";
  if (offering?.startsWith("starter-")) return "Starter";
  return "";
}

function planLabel(value: string | undefined) {
  if (value === "studio" || value === "custom_domain") return "Studio";
  if (value === "professional") return "Professional";
  return "Starter";
}

function isPlatformOffering(key: string | undefined) {
  return Boolean(key && /^(starter|professional|studio)-(monthly|annual)$/.test(key));
}

function recurringMonthlyValue(notes: BillingNotes) {
  const amount = Number(notes.amount || 0);
  if (!Number.isFinite(amount)) return 0;
  return notes.offering_key?.endsWith("-annual") || notes.offering_key === "brand-launch-renewal" ? amount / 12 : amount;
}

export async function loadPlatformAdminDashboard(adminEmail: string): Promise<PlatformAdminDashboardData> {
  const [kennels, events, platformSupportTickets] = await Promise.all([
    restJson<KennelRow[]>("rest/v1/kennels?select=id,owner_auth_user_id,name,slug,plan,custom_domain,domain_status,contact_email,contact_phone,created_at&order=created_at.desc&limit=2000"),
    restJson<EventRow[]>("rest/v1/events?select=id,kennel_id,title,event_type,event_date,status,notes,created_at&event_type=in.%28Billing%2C%22Setup%20Request%22%2C%22Trial%20Signup%22%29&order=created_at.desc&limit=5000"),
    listAllSupportTickets().catch(() => [] as SupportTicket[]),
  ]);

  const kennelById = new Map(kennels.map((kennel) => [kennel.id, kennel]));
  const billingEvents = events.filter((event) => event.event_type === "Billing").map((event) => ({ event, billing: parseBilling(event.notes) })).filter((item) => item.billing);
  const signupEvents = events.filter((event) => event.event_type === "Trial Signup");
  const requestEvents = events.filter((event) => event.event_type === "Setup Request");

  const latestPlatformSubscription = new Map<string, { event: EventRow; billing: BillingNotes }>();
  for (const item of billingEvents) {
    if (!item.billing || item.billing.kind !== "subscription" || !isPlatformOffering(item.billing.offering_key)) continue;
    if (!latestPlatformSubscription.has(item.event.kennel_id)) latestPlatformSubscription.set(item.event.kennel_id, { event: item.event, billing: item.billing });
  }

  const signupByKennel = new Map<string, EventRow>();
  for (const event of signupEvents) if (!signupByKennel.has(event.kennel_id)) signupByKennel.set(event.kennel_id, event);

  const now = Date.now();
  let activeTrials = 0;
  let activePaid = 0;
  let checkoutIncomplete = 0;
  let attention = 0;

  const customers = kennels.map((kennel) => {
    const subscription = latestPlatformSubscription.get(kennel.id);
    const signup = signupByKennel.get(kennel.id);
    const signupNotes = parseSignup(signup?.notes || null);
    const billing = subscription?.billing;
    const status = String(subscription?.event.status || "").toUpperCase();
    const trialBoundary = subscription ? new Date(new Date(subscription.event.created_at).getTime() + 14 * 86400000) : null;
    const inTrial = Boolean(subscription && ["ACTIVE", "APPROVED"].includes(status) && trialBoundary && trialBoundary.getTime() > now);
    const paid = Boolean(subscription && ["ACTIVE", "APPROVED"].includes(status) && !inTrial);
    const incomplete = !subscription;
    const needsAttention = Boolean(subscription && ["CANCELLED", "SUSPENDED", "EXPIRED", "DENIED"].includes(status));

    if (inTrial) activeTrials += 1;
    else if (paid) activePaid += 1;
    else if (incomplete) checkoutIncomplete += 1;
    if (needsAttention) attention += 1;

    const requested = signupNotes?.requested_plan;
    const selectedPlan = planFromOffering(billing?.offering_key) || planLabel(requested || kennel.plan);
    const stage = inTrial ? "Trial" : paid ? "Active" : incomplete ? "Checkout incomplete" : status.charAt(0) + status.slice(1).toLowerCase();

    return {
      kennelId: kennel.id,
      kennelName: kennel.name,
      slug: kennel.slug,
      email: kennel.contact_email || "",
      phone: kennel.contact_phone || "",
      plan: selectedPlan,
      stage,
      joinedAt: kennel.created_at,
      trialEndsAt: inTrial && trialBoundary ? trialBoundary.toISOString() : null,
      nextBillingAt: billing?.next_billing_time || null,
      customDomain: kennel.custom_domain || "",
    };
  });

  const payments = billingEvents
    .filter((item) => item.billing && (item.billing.kind === "order" || item.billing.kind === "payment"))
    .map((item) => {
      const kennel = kennelById.get(item.event.kennel_id);
      return {
        id: item.event.id,
        kennelName: kennel?.name || "Unknown kennel",
        email: kennel?.contact_email || "",
        offering: item.billing?.offering_key || "paypal",
        kind: item.billing?.kind === "order" ? "One-time add-on" : "Recurring payment",
        amount: Number(item.billing?.amount || 0) || 0,
        status: item.event.status,
        paypalId: item.billing?.paypal_id || "",
        createdAt: item.event.created_at,
      };
    });

  const collected = payments.filter((payment) => payment.status.toUpperCase() === "COMPLETED").reduce((sum, payment) => sum + payment.amount, 0);

  const latestRecurringByOffering = new Map<string, BillingNotes>();
  for (const item of billingEvents) {
    if (!item.billing || item.billing.kind !== "subscription") continue;
    const key = item.event.kennel_id + ":" + item.billing.offering_key;
    if (!latestRecurringByOffering.has(key) && ["ACTIVE", "APPROVED"].includes(item.event.status.toUpperCase())) latestRecurringByOffering.set(key, item.billing);
  }
  const recurringRunRate = [...latestRecurringByOffering.values()].reduce((sum, billing) => sum + recurringMonthlyValue(billing), 0);

  const requests = requestEvents.map((event) => {
    const kennel = kennelById.get(event.kennel_id);
    return {
      id: event.id,
      kennelName: kennel?.name || "Unknown kennel",
      email: kennel?.contact_email || "",
      title: event.title.replace(/^Setup request:\s*/i, ""),
      status: event.status,
      details: event.notes || "",
      createdAt: event.created_at,
    };
  });

  const openRequests = requests.filter((request) => !["COMPLETED", "CLOSED", "CANCELLED"].includes(request.status.toUpperCase())).length;
  const supportTickets = platformSupportTickets.map((ticket) => ({
    ...ticket,
    kennelName: kennelById.get(ticket.kennelId)?.name || "Unknown kennel",
    email: kennelById.get(ticket.kennelId)?.contact_email || "",
  }));
  const openSupportTickets = supportTickets.filter((ticket) => !["Resolved", "Closed"].includes(ticket.status)).length;

  const planCounts = new Map<string, number>([["Starter", 0], ["Professional", 0], ["Studio", 0]]);
  for (const customer of customers) planCounts.set(customer.plan, (planCounts.get(customer.plan) || 0) + 1);
  const planMix = [...planCounts.entries()].map(([plan, count]) => ({ plan, count }));

  const activity = events.slice(0, 60).map((event) => ({
    id: event.id,
    kennelName: kennelById.get(event.kennel_id)?.name || "Unknown kennel",
    type: event.event_type,
    title: event.title,
    status: event.status,
    createdAt: event.created_at,
  }));

  return {
    generatedAt: new Date().toISOString(),
    adminEmail,
    metrics: {
      totalKennels: kennels.length,
      activeTrials,
      activePaid,
      checkoutIncomplete,
      attention,
      collected,
      recurringRunRate,
      openRequests,
      openSupportTickets,
    },
    planMix,
    customers,
    payments,
    requests,
    supportTickets,
    activity,
  };
}
