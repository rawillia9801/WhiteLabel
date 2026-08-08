import "server-only";

import { supabaseRequest } from "../db/supabase";

export const FOUNDING_BREEDER_LIMIT = 100;

type TrialSignupRow = {
  kennel_id: string;
  notes: string | null;
};

type TrialSignupNotes = {
  founding_pricing?: boolean;
  founding_limit?: number;
  requested_plan?: string;
  trial_days?: number;
};

function parseNotes(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value) as TrialSignupNotes;
  } catch {
    return null;
  }
}

async function foundingKennelIds() {
  const response = await supabaseRequest(
    "rest/v1/events?select=kennel_id,notes&event_type=eq.Trial%20Signup&order=id.asc&limit=1000",
    { cache: "no-store" },
  );
  const payload = await response.json().catch(() => null) as TrialSignupRow[] | { message?: string } | null;
  if (!response.ok) {
    throw new Error((payload as { message?: string } | null)?.message || "Unable to read Founding Breeder availability.");
  }
  const rows = Array.isArray(payload) ? payload : [];
  return new Set(
    rows
      .filter((row) => parseNotes(row.notes)?.founding_pricing === true)
      .map((row) => row.kennel_id)
      .filter(Boolean),
  );
}

export async function foundingPricingStatus(kennelId?: string) {
  const ids = await foundingKennelIds();
  const claimed = ids.size;
  const eligible = kennelId ? ids.has(kennelId) : claimed < FOUNDING_BREEDER_LIMIT;
  return {
    limit: FOUNDING_BREEDER_LIMIT,
    claimed,
    remaining: Math.max(0, FOUNDING_BREEDER_LIMIT - claimed),
    available: claimed < FOUNDING_BREEDER_LIMIT,
    eligible,
  };
}

export async function foundingEligibilityForNewSignup() {
  const status = await foundingPricingStatus();
  return status.available;
}

export function isFoundingOfferingKey(key: string) {
  return /^founding-(starter|professional|studio)-(monthly|annual)$/.test(key);
}

export function isPlatformOfferingKey(key: string) {
  return /^(founding-)?(starter|professional|studio)-(monthly|annual)$/.test(key);
}
