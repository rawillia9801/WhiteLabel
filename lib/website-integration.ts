import type { ResourceInput } from "../db/resources";
import { applicationRecordBlock, type ApplicationFieldMapping, type ApplicationFormConfig, type StoredApplicationRecord } from "./application-form";

const configuredOrigins = () => new Set((process.env.WEBSITE_ALLOWED_ORIGINS || "").split(",").map((value) => value.trim()).filter(Boolean));

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const APPLICATION_FIELDS = [
  ["co_applicant", "Co-applicant"],
  ["age_confirm", "Applicant is 18+"],
  ["preferred_contact", "Preferred contact"],
  ["best_time", "Best time to reach"],
  ["how_hear", "How they heard about us"],
  ["street_address", "Street address"],
  ["home_type", "Home type"],
  ["own_or_rent", "Own or rent"],
  ["housing_permission", "Pets permitted confirmation"],
  ["household_details", "Household and primary caregiver"],
  ["children_ages", "Children / ages"],
  ["frequent_young_visitors", "Frequent young visitors"],
  ["yard_type", "Outdoor setup"],
  ["move_travel", "Upcoming move or travel"],
  ["work_schedule", "Work / school schedule"],
  ["hours_alone", "Hours puppy will be alone"],
  ["backup_caregiver", "Backup caregiver"],
  ["current_pets", "Current pets"],
  ["vaccinated_pets", "Current pets vaccinated"],
  ["altered_pets", "Current pets altered"],
  ["chihuahua_exp", "Breed experience"],
  ["toy_breed_exp", "Toy breed experience"],
  ["rehomed_history", "Rehoming / surrender history"],
  ["animal_incident_history", "Animal safety history"],
  ["planned_vet", "Planned routine veterinary practice"],
  ["emergency_vet", "Planned emergency veterinary hospital"],
  ["sex_pref", "Sex preference"],
  ["coat_pref", "Coat preference"],
  ["registry_pref", "Registry preference"],
  ["placement_pref", "Placement size preference"],
  ["color_pref", "Color / markings preference"],
  ["purpose", "Purpose"],
  ["timeline", "Ideal timeframe"],
  ["budget", "Budget range"],
  ["specific_puppy", "Specific puppy or litter"],
  ["temperament", "Temperament / lifestyle match"],
  ["essential_preferences", "Essential versus flexible preferences"],
  ["tiny_interest", "Interested in exceptionally small puppy"],
  ["tiny_feedings", "Every-two-hour feeding readiness"],
  ["tiny_overnight", "Overnight monitoring readiness"],
  ["tiny_care_plan", "Small-puppy care and emergency plan"],
  ["where_day", "Where puppy will stay during the day"],
  ["where_sleep", "Where puppy will sleep"],
  ["training_plan", "Training plan"],
  ["travel_restraint", "Travel restraint"],
  ["tiny_safety", "Tiny-puppy safety plan"],
  ["socialization_plan", "Pre-vaccination socialization plan"],
  ["breeding_intent", "Breeding intention"],
  ["breeding_experience", "Breeding experience"],
  ["breeding_plan", "Breeding and health-testing plan"],
  ["payment_method", "Expected payment method"],
  ["deposit_readiness", "Deposit readiness"],
  ["payment_plan_review", "Payment-plan review requested"],
  ["transfer_method", "Preferred pickup or delivery"],
  ["starting_location", "Starting city / state"],
  ["transport_assistance", "Transportation assistance"],
  ["scheduling_limits", "Scheduling limitations"],
  ["ref1_name", "Reference 1"],
  ["ref1_phone", "Reference 1 phone / email"],
  ["ref2_name", "Reference 2"],
  ["ref2_phone", "Reference 2 phone / email"],
  ["why_us", "Why this breeding program"],
  ["notes", "Additional notes"],
  ["communication_preferences", "Communication preferences"],
] as const;

const REQUIRED_ACKNOWLEDGEMENTS = [
  "ack_policies",
  "ack_financial",
  "ack_truth",
  "ack_records",
  "ack_small_puppy",
] as const;

export type WebsiteApplication = Record<string, string | boolean>;

function cleanString(value: unknown, maximum = 2_000) {
  return typeof value === "string"
    ? value.replace(/\u0000/g, "").replace(/\r\n?/g, "\n").trim().slice(0, maximum)
    : "";
}

function cleanBoolean(value: unknown) {
  return value === true || value === "true" || value === "on" || value === "yes";
}

export function isAllowedWebsiteOrigin(origin: string | null, requestHost?: string | null, allowedOrigins: string[] = []) {
  if (!origin) return false;
  try {
    const parsedOrigin = new URL(origin);
    const hostname = parsedOrigin.hostname.toLowerCase();
    const comparableHost = hostname.replace(/^www\./, "");
    const platform = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN?.trim().toLowerCase() || "mydogportal.site";
    const sameHost = requestHost?.split(":")[0].toLowerCase().replace(/^www\./, "");
    const tenantWebsiteAllowed = allowedOrigins.some((value) => {
      try {
        const candidate = new URL(value.includes("://") ? value : `https://${value}`);
        return candidate.hostname.toLowerCase().replace(/^www\./, "") === comparableHost;
      } catch {
        return false;
      }
    });
    return configuredOrigins().has(parsedOrigin.origin)
      || tenantWebsiteAllowed
      || hostname === platform
      || hostname.endsWith(`.${platform}`)
      || Boolean(sameHost && comparableHost === sameHost);
  } catch {
    return false;
  }
}

export function websiteCorsHeaders(origin: string | null, requestHost?: string | null, allowedOrigins: string[] = []) {
  const headers = new Headers({
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    "vary": "Origin",
  });
  if (isAllowedWebsiteOrigin(origin, requestHost, allowedOrigins)) headers.set("access-control-allow-origin", origin!);
  return headers;
}

const mappedKey = (config: ApplicationFormConfig | undefined, mapping: ApplicationFieldMapping, fallback: string) => config?.fields.find((field) => field.mapping === mapping)?.key || fallback;

export function normalizeWebsiteApplication(body: unknown, config?: ApplicationFormConfig) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("The application payload is invalid.");
  }

  const record = body as Record<string, unknown>;
  const nested = record.application;
  const source = nested && typeof nested === "object" && !Array.isArray(nested)
    ? nested as Record<string, unknown>
    : record;
  const application: WebsiteApplication = {};

  if (config) {
    for (const field of config.fields) application[field.key] = field.type === "checkbox" ? cleanBoolean(source[field.key]) : cleanString(source[field.key]);
  }
  for (const [key] of APPLICATION_FIELDS) if (!(key in application) && source[key] != null) application[key] = cleanString(source[key]);
  for (const key of ["full_name", "email", "phone", "city_state", "company"]) {
    if (!(key in application) || source[key] != null) application[key] = cleanString(source[key], key === "email" ? 254 : 200);
  }
  for (const key of REQUIRED_ACKNOWLEDGEMENTS) if (!(key in application) || source[key] != null) application[key] = cleanBoolean(source[key]);

  const fullNameKey = mappedKey(config, "full_name", "full_name");
  const emailKey = mappedKey(config, "email", "email");
  const phoneKey = mappedKey(config, "phone", "phone");
  const fullName = String(application[fullNameKey] ?? "");
  const email = String(application[emailKey] ?? "").toLowerCase();
  const phone = String(application[phoneKey] ?? "");
  if (application.company) throw new Error("Unable to accept this application.");
  if (fullName.length < 2) throw new Error("Enter the applicant's full name.");
  if (!EMAIL_PATTERN.test(email)) throw new Error("Enter a valid email address.");
  if (phone.replace(/\D/g, "").length < 10) throw new Error("Enter a valid phone number.");
  if (config) {
    for (const field of config.fields.filter((item) => item.required)) {
      const value = application[field.key];
      if (field.type === "checkbox" ? value !== true : !String(value ?? "").trim()) throw new Error(`${field.label} is required.`);
    }
  } else {
    if (application.age_confirm !== "Yes") throw new Error("The applicant must be 18 or older.");
    if (!REQUIRED_ACKNOWLEDGEMENTS.every((key) => application[key] === true)) {
      throw new Error("All required acknowledgements must be accepted, including the small-puppy policy.");
    }
  }

  application[emailKey] = email;
  return application;
}

function splitName(fullName: string) {
  const parts = fullName.split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "Applicant",
    lastName: parts.slice(1).join(" ") || "Not provided",
  };
}

function splitCityState(value: string) {
  const [city, ...stateParts] = value.split(",").map((part) => part.trim()).filter(Boolean);
  return {
    city: city || null,
    state: stateParts.join(", ") || null,
  };
}

export function formatApplicationNotes(application: WebsiteApplication, receivedAt: string, config?: ApplicationFormConfig) {
  const recordFields = config?.fields ?? APPLICATION_FIELDS.map(([key, label]) => ({ key, label, section: "Application", mapping: "none" as const }));
  const lines = recordFields.flatMap(({ key, label }) => {
    const value = application[key];
    return value === "" || value == null ? [] : [`${label}: ${typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}`];
  });
  const record: StoredApplicationRecord = {
    version: 1,
    submittedAt: receivedAt,
    formTitle: config?.title || "Puppy Application",
    answers: Object.fromEntries(recordFields.map(({ key }) => [key, application[key] ?? ""])),
    fields: recordFields.map(({ key, label, section, mapping }) => ({ key, label, section, mapping })),
  };
  return [
    `Website puppy application received ${receivedAt}`,
    "Source: kennel website application",
    "Submission is pending breeder review and is not an approval, reservation, or sales agreement.",
    "",
    ...lines,
    "",
    applicationRecordBlock(record),
  ].join("\n");
}

export function applicationBuyerInput(application: WebsiteApplication, receivedAt: string, config?: ApplicationFormConfig): ResourceInput {
  const valueFor = (mapping: ApplicationFieldMapping, fallback: string) => application[mappedKey(config, mapping, fallback)];
  const { firstName, lastName } = splitName(String(valueFor("full_name", "full_name") ?? ""));
  const { city, state } = splitCityState(String(valueFor("city_state", "city_state") ?? ""));
  return {
    first_name: firstName,
    last_name: lastName,
    email: String(valueFor("email", "email") ?? ""),
    phone: String(valueFor("phone", "phone") ?? ""),
    city,
    state,
    application_status: "Applied",
    preferred_sex: cleanString(valueFor("preferred_sex", "sex_pref"), 80) || null,
    preferred_color: cleanString(valueFor("preferred_color", "color_pref"), 160) || null,
    household_notes: [
      cleanString(application.street_address, 300),
      cleanString(application.home_type, 120),
      cleanString(application.own_or_rent, 120),
      cleanString(application.housing_permission, 200),
      cleanString(application.household_details, 1_000),
      cleanString(application.children_ages, 500),
      cleanString(application.current_pets, 1_000),
    ].filter(Boolean).join(" | ") || null,
    notes: formatApplicationNotes(application, receivedAt, config),
  };
}

function publicUrl(value: unknown) {
  const raw = cleanString(value, 2_000);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function publicPuppy(row: Record<string, unknown>) {
  const status = cleanString(row.status, 80);
  if (!status.toLowerCase().includes("avail") || row.buyer_id != null) return null;
  const priceCents = Number(row.price_cents);
  const markerPhoto = String(row.notes ?? "").match(/\[\[SWVAOS_PROFILE_IMAGE:([^\]]+)\]\]/i)?.[1]?.trim();
  return {
    id: Number(row.id),
    name: cleanString(row.name, 160) || "Unnamed puppy",
    sex: cleanString(row.sex, 80) || null,
    color: cleanString(row.color, 160) || null,
    markings: cleanString(row.markings, 200) || null,
    coat_type: cleanString(row.coat_type, 120) || null,
    birth_date: cleanString(row.birth_date, 40) || null,
    status: "Available",
    price: Number.isFinite(priceCents) && priceCents >= 0 ? priceCents / 100 : null,
    photo_url: publicUrl(row.photo_url ?? row.image_url ?? markerPhoto),
  };
}
