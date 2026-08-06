import "server-only";

import { getSupabaseConfig, supabaseRequest } from "../db/supabase";
import { defaultApplicationFormConfig, normalizeApplicationFormConfig, type ApplicationFormConfig } from "./application-form";

const objectKey = (kennelId: string) => {
  if (!/^[0-9a-f-]{36}$/i.test(kennelId)) throw new Error("A valid kennel workspace is required for the application builder.");
  return `kennels/${kennelId}/application-form.json`;
};

export async function getApplicationFormConfig(kennelId: string): Promise<ApplicationFormConfig> {
  const { storageBucket } = getSupabaseConfig();
  const response = await supabaseRequest(`storage/v1/object/${storageBucket}/${objectKey(kennelId)}`, { cache: "no-store" });
  if (response.status === 404 || response.status === 400) return structuredClone(defaultApplicationFormConfig);
  if (!response.ok) throw new Error((await response.text()) || "Unable to load the application form.");
  return normalizeApplicationFormConfig(await response.json());
}

export async function saveApplicationFormConfig(kennelId: string, value: unknown): Promise<ApplicationFormConfig> {
  const config = normalizeApplicationFormConfig(value);
  config.updatedAt = new Date().toISOString();
  const { storageBucket } = getSupabaseConfig();
  const response = await supabaseRequest(`storage/v1/object/${storageBucket}/${objectKey(kennelId)}`, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8", "x-upsert": "true" },
    body: JSON.stringify(config),
  });
  if (!response.ok) throw new Error((await response.text()) || "Unable to save the application form.");
  return config;
}
