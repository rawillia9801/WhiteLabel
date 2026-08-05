import "server-only";

import { getSupabaseConfig, supabaseRequest } from "../db/supabase";
import { defaultTemplatesConfig, mergeTemplatesConfig, type TemplatesConfig } from "./template-defaults";

const objectKey = (kennelId: string) => {
  if (!/^[0-9a-f-]{36}$/i.test(kennelId)) throw new Error("A valid kennel workspace is required for templates.");
  return `kennels/${kennelId}/templates.json`;
};

export async function getTemplatesConfig(kennelId: string): Promise<TemplatesConfig> {
  const { storageBucket } = getSupabaseConfig();
  const response = await supabaseRequest(`storage/v1/object/${storageBucket}/${objectKey(kennelId)}`, { cache: "no-store" });
  if (response.status === 404 || response.status === 400) return structuredClone(defaultTemplatesConfig);
  if (!response.ok) throw new Error((await response.text()) || "Unable to load templates.");
  return mergeTemplatesConfig(await response.json());
}

export async function saveTemplatesConfig(kennelId: string, value: unknown): Promise<TemplatesConfig> {
  const config = mergeTemplatesConfig(value);
  config.updatedAt = new Date().toISOString();
  const { storageBucket } = getSupabaseConfig();
  const response = await supabaseRequest(`storage/v1/object/${storageBucket}/${objectKey(kennelId)}`, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8", "x-upsert": "true" },
    body: JSON.stringify(config),
  });
  if (!response.ok) throw new Error((await response.text()) || "Unable to save templates.");
  return config;
}
