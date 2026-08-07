import "server-only";

import { createSupabaseResource } from "../db/supabase-kennel";
import { supabaseRequest } from "../db/supabase";
import type { PayPalEntitlementPlan } from "./paypal";

type BillingEventRow = {
  id: number;
  kennel_id: string;
  status: string;
  notes: string | null;
};

export type PayPalBillingNotes = {
  provider: "paypal";
  kind: "subscription" | "order" | "payment";
  offering_key: string;
  paypal_id: string;
  paypal_plan_id?: string;
  entitlement_plan?: PayPalEntitlementPlan;
  amount?: string;
  currency?: string;
  next_billing_time?: string | null;
};

function safePayPalId(value: string) {
  if (!/^[A-Z0-9-]+$/i.test(value)) throw new Error("Invalid PayPal billing identifier.");
  return value;
}

function parseNotes(value: string | null | undefined) {
  if (!value) return null;
  try {
    return JSON.parse(value) as PayPalBillingNotes;
  } catch {
    return null;
  }
}

async function findBillingEvent(paypalId: string, kennelId?: string) {
  const safeId = safePayPalId(paypalId);
  const filters = [
    "select=id,kennel_id,status,notes",
    "event_type=eq.Billing",
    `notes=ilike.${encodeURIComponent(`*${safeId}*`)}`,
    "order=id.desc",
    "limit=1",
  ];
  if (kennelId) filters.splice(3, 0, `kennel_id=eq.${encodeURIComponent(kennelId)}`);
  const response = await supabaseRequest(`rest/v1/events?${filters.join("&")}`, { cache: "no-store" });
  const payload = await response.json().catch(() => null) as BillingEventRow[] | { message?: string } | null;
  if (!response.ok) throw new Error((payload as { message?: string } | null)?.message || "Unable to read billing status.");
  return Array.isArray(payload) ? payload[0] || null : null;
}

async function patchBillingEvent(id: number, status: string, notes: PayPalBillingNotes) {
  const response = await supabaseRequest(`rest/v1/events?id=eq.${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", prefer: "return=minimal" },
    body: JSON.stringify({
      status,
      notes: JSON.stringify(notes),
      updated_at: new Date().toISOString(),
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(payload?.message || "Unable to update billing status.");
  }
}

export async function recordPayPalBillingEvent(input: {
  kennelId: string;
  title: string;
  status: string;
  notes: PayPalBillingNotes;
}) {
  const existing = await findBillingEvent(input.notes.paypal_id, input.kennelId);
  if (existing) {
    await patchBillingEvent(existing.id, input.status, input.notes);
    return existing.id;
  }
  const row = await createSupabaseResource("events", {
    title: input.title,
    event_type: "Billing",
    event_date: new Date().toISOString().slice(0, 10),
    status: input.status,
    notes: JSON.stringify(input.notes),
  }, input.kennelId);
  return Number((row as { id?: number }).id || 0);
}

export async function findPayPalBillingEvent(paypalId: string) {
  const row = await findBillingEvent(paypalId);
  if (!row) return null;
  return { ...row, parsed: parseNotes(row.notes) };
}

export async function updatePayPalBillingEventByProviderId(paypalId: string, status: string, extra?: Partial<PayPalBillingNotes>) {
  const row = await findBillingEvent(paypalId);
  if (!row) return null;
  const current = parseNotes(row.notes);
  if (!current) return null;
  const notes = { ...current, ...extra };
  await patchBillingEvent(row.id, status, notes);
  return { ...row, status, parsed: notes };
}

export async function setKennelPlan(kennelId: string, plan: Exclude<PayPalEntitlementPlan, null>) {
  const response = await supabaseRequest(`rest/v1/kennels?id=eq.${encodeURIComponent(kennelId)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", prefer: "return=minimal" },
    body: JSON.stringify({ plan, updated_at: new Date().toISOString() }),
    cache: "no-store",
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(payload?.message || "Unable to update the kennel subscription plan.");
  }
}
