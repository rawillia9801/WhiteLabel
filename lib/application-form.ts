export type ApplicationFieldType = "text" | "email" | "tel" | "textarea" | "select" | "radio" | "checkbox" | "date" | "number";

export type ApplicationFieldMapping =
  | "none"
  | "full_name"
  | "email"
  | "phone"
  | "city_state"
  | "preferred_sex"
  | "preferred_color"
  | "co_buyer_name"
  | "buyer_street_address"
  | "buyer_emergency_contact"
  | "payment_method"
  | "transfer_method"
  | "first_vet_clinic";

export type ApplicationField = {
  id: string;
  key: string;
  label: string;
  type: ApplicationFieldType;
  section: string;
  required: boolean;
  options: string[];
  mapping: ApplicationFieldMapping;
  help?: string;
};

export type ApplicationFormConfig = {
  version: 1;
  title: string;
  introduction: string;
  submitLabel: string;
  successMessage: string;
  allowedOrigins?: string[];
  fields: ApplicationField[];
  updatedAt: string;
};

export type StoredApplicationRecord = {
  version: 1;
  submittedAt: string;
  formTitle: string;
  answers: Record<string, string | boolean>;
  fields: Array<Pick<ApplicationField, "key" | "label" | "section" | "mapping">>;
};

export const APPLICATION_FIELD_TYPES: Array<{ value: ApplicationFieldType; label: string }> = [
  { value: "text", label: "Short answer" },
  { value: "email", label: "Email" },
  { value: "tel", label: "Phone" },
  { value: "textarea", label: "Long answer" },
  { value: "select", label: "Dropdown" },
  { value: "radio", label: "Multiple choice" },
  { value: "checkbox", label: "Checkbox / acknowledgement" },
  { value: "date", label: "Date" },
  { value: "number", label: "Number" },
];

export const APPLICATION_FIELD_MAPPINGS: Array<{ value: ApplicationFieldMapping; label: string }> = [
  { value: "none", label: "Application answer only" },
  { value: "full_name", label: "Buyer full name" },
  { value: "email", label: "Buyer email" },
  { value: "phone", label: "Buyer phone" },
  { value: "city_state", label: "Buyer city / state" },
  { value: "preferred_sex", label: "Puppy sex preference" },
  { value: "preferred_color", label: "Puppy color preference" },
  { value: "co_buyer_name", label: "Document: co-buyer name" },
  { value: "buyer_street_address", label: "Document: buyer street address" },
  { value: "buyer_emergency_contact", label: "Document: emergency contact" },
  { value: "payment_method", label: "Document: payment method" },
  { value: "transfer_method", label: "Document: transfer method" },
  { value: "first_vet_clinic", label: "Document: first veterinarian / clinic" },
];

const field = (
  key: string,
  label: string,
  type: ApplicationFieldType,
  section: string,
  required = false,
  mapping: ApplicationFieldMapping = "none",
  options: string[] = [],
  help = "",
): ApplicationField => ({ id: key, key, label, type, section, required, mapping, options, help });

export const defaultApplicationFormConfig: ApplicationFormConfig = {
  version: 1,
  title: "Puppy Application",
  introduction: "Tell us about your household, puppy preferences, and care plans. Submission does not guarantee approval, reserve a puppy, or create a sales agreement.",
  submitLabel: "Submit puppy application",
  successMessage: "Thank you. Your application has been received for breeder review.",
  allowedOrigins: [],
  updatedAt: "",
  fields: [
    field("full_name", "Full legal name", "text", "Applicant", true, "full_name"),
    field("co_applicant", "Co-applicant / co-buyer", "text", "Applicant", false, "co_buyer_name"),
    field("email", "Email address", "email", "Applicant", true, "email"),
    field("phone", "Phone number", "tel", "Applicant", true, "phone"),
    field("city_state", "City and state", "text", "Applicant", true, "city_state"),
    field("street_address", "Street address", "text", "Applicant", false, "buyer_street_address"),
    field("emergency_contact", "Emergency contact (name, relationship, and phone)", "text", "Applicant", false, "buyer_emergency_contact"),
    field("preferred_contact", "Preferred contact method", "select", "Applicant", false, "none", ["Email", "Phone"]),
    field("home_type", "Type of home", "select", "Household", false, "none", ["House", "Apartment", "Townhome / condo", "Farm / rural property", "Other"]),
    field("own_or_rent", "Do you own or rent?", "select", "Household", false, "none", ["Own", "Rent", "Other"]),
    field("housing_permission", "If applicable, are pets permitted by your housing?", "text", "Household"),
    field("household_details", "Who lives in the household and who will be the puppy's primary caregiver?", "textarea", "Household", true),
    field("children_ages", "Children in the home and their ages", "text", "Household"),
    field("current_pets", "Current pets", "textarea", "Household"),
    field("work_schedule", "Typical work / school schedule", "textarea", "Household"),
    field("hours_alone", "How long would the puppy usually be alone?", "text", "Household"),
    field("backup_caregiver", "Backup caregiver", "text", "Household"),
    field("sex_pref", "Preferred sex", "select", "Puppy preferences", false, "preferred_sex", ["No preference", "Male", "Female"]),
    field("coat_pref", "Coat preference", "select", "Puppy preferences", false, "none", ["No preference", "Smooth / short coat", "Long coat"]),
    field("color_pref", "Color / markings preference", "text", "Puppy preferences", false, "preferred_color"),
    field("specific_puppy", "Specific puppy or litter of interest", "text", "Puppy preferences"),
    field("purpose", "What are you looking for in your puppy?", "textarea", "Puppy preferences", true),
    field("temperament", "Describe the temperament and lifestyle fit you are hoping for", "textarea", "Puppy preferences"),
    field("timeline", "Ideal timeframe", "text", "Puppy preferences"),
    field("planned_vet", "Planned veterinarian / clinic", "text", "Care readiness", false, "first_vet_clinic"),
    field("emergency_vet", "Planned emergency veterinary hospital", "text", "Care readiness"),
    field("tiny_care_plan", "If considering a very small puppy, describe your feeding, supervision, backup-caregiver, and emergency-care plan", "textarea", "Care readiness"),
    field("deposit_readiness", "If approved and matched, are you prepared for the breeder's reservation deposit?", "select", "Placement", false, "none", ["Yes", "Not yet", "I have questions"]),
    field("payment_method", "Expected payment method", "text", "Placement", false, "payment_method"),
    field("transfer_method", "Preferred pickup / delivery method", "text", "Placement", false, "transfer_method"),
    field("why_us", "Why are you interested in this breeding program?", "textarea", "Final questions", true),
    field("ack_policies", "I have reviewed and agree to the breeder's application and placement policies.", "checkbox", "Acknowledgements", true),
    field("ack_financial", "I understand that submitting this application does not guarantee approval, reserve a puppy, or create a purchase agreement.", "checkbox", "Acknowledgements", true),
    field("ack_truth", "I certify that the information in this application is complete and truthful.", "checkbox", "Acknowledgements", true),
    field("ack_records", "I authorize application information to be used to prepare placement records and documents if I am approved.", "checkbox", "Acknowledgements", true),
    field("ack_small_puppy", "I have reviewed the breeder's small-puppy care expectations and understand that additional feeding, monitoring, and delayed transfer may apply.", "checkbox", "Acknowledgements", true),
  ],
};

const validFieldTypes = new Set(APPLICATION_FIELD_TYPES.map((item) => item.value));
const validMappings = new Set(APPLICATION_FIELD_MAPPINGS.map((item) => item.value));

const clean = (value: unknown, max = 200) => String(value ?? "").replace(/\u0000/g, "").trim().slice(0, max);
const keyFor = (value: unknown) => clean(value, 60).toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");

export function normalizeApplicationFormConfig(value: unknown): ApplicationFormConfig {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const rows = Array.isArray(source.fields) ? source.fields : defaultApplicationFormConfig.fields;
  const allowedOrigins = [...new Set((Array.isArray(source.allowedOrigins) ? source.allowedOrigins : []).flatMap((value) => {
    const raw = clean(value, 500);
    if (!raw) return [];
    try {
      const url = new URL(raw);
      const localhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
      if (url.protocol !== "https:" && !(localhost && url.protocol === "http:")) return [];
      return [url.origin];
    } catch {
      return [];
    }
  }))].slice(0, 20);
  const seen = new Set<string>();
  const fields = rows.flatMap((item, index): ApplicationField[] => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const row = item as Record<string, unknown>;
    const key = keyFor(row.key) || `question_${index + 1}`;
    if (seen.has(key)) return [];
    seen.add(key);
    const type = validFieldTypes.has(row.type as ApplicationFieldType) ? row.type as ApplicationFieldType : "text";
    const mapping = validMappings.has(row.mapping as ApplicationFieldMapping) ? row.mapping as ApplicationFieldMapping : "none";
    const options = Array.isArray(row.options) ? row.options.map((option) => clean(option, 120)).filter(Boolean).slice(0, 30) : [];
    return [{
      id: clean(row.id, 80) || key,
      key,
      label: clean(row.label, 220) || `Question ${index + 1}`,
      type,
      section: clean(row.section, 80) || "Application",
      required: row.required === true,
      options,
      mapping,
      help: clean(row.help, 500),
    }];
  }).slice(0, 80);

  const usedMappings = new Set<ApplicationFieldMapping>();
  for (const item of fields) {
    if (item.mapping === "none") continue;
    if (usedMappings.has(item.mapping)) throw new Error(`The ${item.mapping.replaceAll("_", " ")} mapping can only be used once.`);
    usedMappings.add(item.mapping);
  }

  for (const requiredMapping of ["full_name", "email", "phone"] as const) {
    const mapped = fields.find((item) => item.mapping === requiredMapping);
    if (!mapped) throw new Error(`The application must include a field mapped to ${requiredMapping.replaceAll("_", " ")}.`);
    mapped.required = true;
  }

  return {
    version: 1,
    title: clean(source.title, 120) || defaultApplicationFormConfig.title,
    introduction: clean(source.introduction, 1_500) || defaultApplicationFormConfig.introduction,
    submitLabel: clean(source.submitLabel, 80) || defaultApplicationFormConfig.submitLabel,
    successMessage: clean(source.successMessage, 500) || defaultApplicationFormConfig.successMessage,
    allowedOrigins,
    fields,
    updatedAt: clean(source.updatedAt, 80),
  };
}

const DATA_START = "---MYDOGPORTAL_APPLICATION_DATA---";
const DATA_END = "---END_MYDOGPORTAL_APPLICATION_DATA---";

export function applicationRecordBlock(record: StoredApplicationRecord) {
  return `${DATA_START}\n${JSON.stringify(record)}\n${DATA_END}`;
}

export function readApplicationRecord(notes: string | null | undefined): StoredApplicationRecord | null {
  const value = String(notes ?? "");
  const start = value.lastIndexOf(DATA_START);
  if (start < 0) return null;
  const contentStart = start + DATA_START.length;
  const end = value.indexOf(DATA_END, contentStart);
  if (end < 0) return null;
  try {
    const parsed = JSON.parse(value.slice(contentStart, end).trim()) as StoredApplicationRecord;
    return parsed?.version === 1 && parsed.answers && Array.isArray(parsed.fields) ? parsed : null;
  } catch {
    return null;
  }
}

export function applicationAnswerByMapping(record: StoredApplicationRecord | null, mapping: ApplicationFieldMapping) {
  if (!record || mapping === "none") return "";
  const field = record.fields.find((item) => item.mapping === mapping);
  const answer = field ? record.answers[field.key] : "";
  return typeof answer === "boolean" ? (answer ? "Yes" : "No") : String(answer ?? "");
}
