import "server-only";

import { getSupabaseConfig, supabaseRequest } from "../db/supabase";

export type AccountProfileExtras = {
  contactName: string;
  secondaryEmail: string;
  secondaryPhone: string;
  mailingAddress1: string;
  mailingAddress2: string;
  mailingCity: string;
  mailingState: string;
  mailingPostalCode: string;
  mailingCountry: string;
  billingContactName: string;
  billingEmail: string;
  billingPhone: string;
};

export const emptyAccountProfileExtras: AccountProfileExtras = {
  contactName: "",
  secondaryEmail: "",
  secondaryPhone: "",
  mailingAddress1: "",
  mailingAddress2: "",
  mailingCity: "",
  mailingState: "",
  mailingPostalCode: "",
  mailingCountry: "United States",
  billingContactName: "",
  billingEmail: "",
  billingPhone: "",
};

const clean = (value: unknown, max: number) => String(value ?? "").trim().replace(/\s+/g, " ").slice(0, max);
const email = (value: unknown) => clean(value, 200).toLowerCase();
const objectKey = (kennelId: string) => `_system/account-profile-${kennelId}.json`;

export function normalizeAccountProfileExtras(value: unknown): AccountProfileExtras {
  const input = value && typeof value === "object" ? value as Partial<AccountProfileExtras> : {};
  return {
    contactName: clean(input.contactName, 160),
    secondaryEmail: email(input.secondaryEmail),
    secondaryPhone: clean(input.secondaryPhone, 50),
    mailingAddress1: clean(input.mailingAddress1, 180),
    mailingAddress2: clean(input.mailingAddress2, 180),
    mailingCity: clean(input.mailingCity, 120),
    mailingState: clean(input.mailingState, 100),
    mailingPostalCode: clean(input.mailingPostalCode, 30),
    mailingCountry: clean(input.mailingCountry, 100) || "United States",
    billingContactName: clean(input.billingContactName, 160),
    billingEmail: email(input.billingEmail),
    billingPhone: clean(input.billingPhone, 50),
  };
}

export async function loadAccountProfileExtras(kennelId: string): Promise<AccountProfileExtras> {
  const { storageBucket } = getSupabaseConfig();
  const response = await supabaseRequest(`storage/v1/object/${storageBucket}/${objectKey(kennelId)}`, { cache: "no-store" });
  if (response.status === 404 || response.status === 400) return { ...emptyAccountProfileExtras };
  if (!response.ok) throw new Error((await response.text()) || "Unable to load breeder profile details.");
  return normalizeAccountProfileExtras(await response.json());
}

export async function saveAccountProfileExtras(kennelId: string, value: unknown) {
  const profile = normalizeAccountProfileExtras(value);
  const { storageBucket } = getSupabaseConfig();
  const response = await supabaseRequest(`storage/v1/object/${storageBucket}/${objectKey(kennelId)}`, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8", "x-upsert": "true" },
    body: JSON.stringify(profile),
  });
  if (!response.ok) throw new Error((await response.text()) || "Unable to save breeder profile details.");
  return profile;
}
