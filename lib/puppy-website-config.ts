import "server-only";

import { getSupabaseConfig, supabaseRequest } from "../db/supabase";

export type PuppyWebsiteConfig = {
  version: 1;
  enabled: boolean;
  title: string;
  introduction: string;
  layout: "cards" | "compact";
  primaryColor: string;
  accentColor: string;
  showPrice: boolean;
  showBirthDate: boolean;
  showSex: boolean;
  showColor: boolean;
  showCoat: boolean;
  showMarkings: boolean;
  applicationLabel: string;
  applicationUrl: string;
  allowedOrigins: string[];
  hiddenPuppyIds: number[];
  updatedAt: string;
};

export const defaultPuppyWebsiteConfig: PuppyWebsiteConfig = {
  version: 1,
  enabled: true,
  title: "Available Puppies",
  introduction: "Meet the puppies currently available from our breeding program. Availability can change as families are approved and matched.",
  layout: "cards",
  primaryColor: "#174f46",
  accentColor: "#b88a35",
  showPrice: true,
  showBirthDate: true,
  showSex: true,
  showColor: true,
  showCoat: true,
  showMarkings: true,
  applicationLabel: "Apply for a Puppy",
  applicationUrl: "",
  allowedOrigins: [],
  hiddenPuppyIds: [],
  updatedAt: "",
};

function objectKey(kennelId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(kennelId)) throw new Error("A valid kennel workspace is required for the Puppy Website Builder.");
  return `kennels/${kennelId}/puppy-website.json`;
}

function text(value: unknown, fallback: string, limit: number) {
  const cleaned = String(value ?? "").replace(/\u0000/g, "").trim().slice(0, limit);
  return cleaned || fallback;
}

function color(value: unknown, fallback: string) {
  const candidate = String(value ?? "").trim();
  return /^#[0-9a-f]{6}$/i.test(candidate) ? candidate : fallback;
}

function optionalHttpsUrl(value: unknown) {
  const candidate = String(value ?? "").trim();
  if (!candidate) return "";
  try {
    const parsed = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
    return parsed.protocol === "https:" ? parsed.toString() : "";
  } catch {
    return "";
  }
}

function origins(value: unknown) {
  if (!Array.isArray(value)) return [];
  const unique = new Set<string>();
  for (const entry of value.slice(0, 25)) {
    try {
      const parsed = new URL(String(entry).includes("://") ? String(entry) : `https://${String(entry)}`);
      if (parsed.protocol === "https:") unique.add(parsed.origin);
    } catch {
      continue;
    }
  }
  return [...unique];
}

export function normalizePuppyWebsiteConfig(value: unknown): PuppyWebsiteConfig {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const hidden = Array.isArray(source.hiddenPuppyIds)
    ? [...new Set(source.hiddenPuppyIds.map(Number).filter((id) => Number.isSafeInteger(id) && id > 0))].slice(0, 1000)
    : [];
  return {
    version: 1,
    enabled: source.enabled !== false,
    title: text(source.title, defaultPuppyWebsiteConfig.title, 120),
    introduction: text(source.introduction, defaultPuppyWebsiteConfig.introduction, 1000),
    layout: source.layout === "compact" ? "compact" : "cards",
    primaryColor: color(source.primaryColor, defaultPuppyWebsiteConfig.primaryColor),
    accentColor: color(source.accentColor, defaultPuppyWebsiteConfig.accentColor),
    showPrice: source.showPrice !== false,
    showBirthDate: source.showBirthDate !== false,
    showSex: source.showSex !== false,
    showColor: source.showColor !== false,
    showCoat: source.showCoat !== false,
    showMarkings: source.showMarkings !== false,
    applicationLabel: text(source.applicationLabel, defaultPuppyWebsiteConfig.applicationLabel, 80),
    applicationUrl: optionalHttpsUrl(source.applicationUrl),
    allowedOrigins: origins(source.allowedOrigins),
    hiddenPuppyIds: hidden,
    updatedAt: String(source.updatedAt ?? "").trim(),
  };
}

export async function getPuppyWebsiteConfig(kennelId: string) {
  const { storageBucket } = getSupabaseConfig();
  const response = await supabaseRequest(`storage/v1/object/${storageBucket}/${objectKey(kennelId)}`, { cache: "no-store" });
  if (response.status === 404 || response.status === 400) return structuredClone(defaultPuppyWebsiteConfig);
  if (!response.ok) throw new Error((await response.text()) || "Unable to load Puppy Website Builder settings.");
  return normalizePuppyWebsiteConfig(await response.json());
}

export async function savePuppyWebsiteConfig(kennelId: string, value: unknown) {
  const config = normalizePuppyWebsiteConfig(value);
  config.updatedAt = new Date().toISOString();
  const { storageBucket } = getSupabaseConfig();
  const response = await supabaseRequest(`storage/v1/object/${storageBucket}/${objectKey(kennelId)}`, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8", "x-upsert": "true" },
    body: JSON.stringify(config),
  });
  if (!response.ok) throw new Error((await response.text()) || "Unable to save Puppy Website Builder settings.");
  return config;
}
