import "server-only";

import { supabaseRequest } from "./supabase";
import { breedingCalendarEvents, estimateNextHeat, estimatePregnancyWindow, puppyCalendarEvents } from "../lib/breeding-calculations";
import { analyzeGeneticCompatibility, calculateCoi } from "../lib/pedigree";
import type { GeneticResult, PedigreeDog } from "../types/breeding";

type Row = Record<string, unknown>;
type Table =
  | "dogs" | "dog_genetic_results" | "heat_cycles" | "progesterone_tests"
  | "breeding_records" | "breeding_attempts" | "pregnancies" | "whelping_sessions"
  | "litters" | "puppies" | "puppy_weight_logs" | "puppy_care_records"
  | "buyers" | "kennel_waitlist_entries" | "kennel_waitlist_history" | "events";

const text = (value: unknown, max = 5000) => String(value ?? "").trim().slice(0, max);
const nullableText = (value: unknown, max = 5000) => text(value, max) || null;
const positiveId = (value: unknown) => Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
const finite = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : null;
const boolean = (value: unknown) => value === true || value === "true" || value === "on" || value === 1;
const kennelQuery = (kennelId: string) => `kennel_id=eq.${encodeURIComponent(kennelId)}`;
const now = () => new Date().toISOString();

function date(value: unknown, required = false) {
  const candidate = text(value, 30);
  if (!candidate && !required) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate) || Number.isNaN(new Date(`${candidate}T12:00:00Z`).getTime())) throw new BreedingValidationError("Enter a valid calendar date.");
  return candidate;
}

function timestamp(value: unknown, required = false) {
  const candidate = text(value, 40);
  if (!candidate && !required) return null;
  const parsed = new Date(candidate);
  if (Number.isNaN(parsed.getTime())) throw new BreedingValidationError("Enter a valid date and time.");
  return parsed.toISOString();
}

export class BreedingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BreedingValidationError";
  }
}

async function request<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const response = await supabaseRequest(path, { ...init, headers, cache: "no-store" });
  const payload = await response.text();
  const parsed = payload ? JSON.parse(payload) : null;
  if (!response.ok) throw new Error(parsed?.message || parsed?.error || "The breeding record could not be saved.");
  return parsed as T;
}

async function select<T extends Row>(table: Table, query: string, kennelId: string) {
  const separator = query ? "&" : "";
  return request<T[]>(`rest/v1/${table}?${query}${separator}${kennelQuery(kennelId)}`);
}

async function first<T extends Row>(table: Table, id: number, kennelId: string, fields = "*") {
  return (await select<T>(table, `select=${fields}&id=eq.${id}&limit=1`, kennelId))[0] ?? null;
}

async function insert<T extends Row>(table: Table, row: Row, kennelId: string) {
  return request<T[]>(`rest/v1/${table}`, {
    method: "POST",
    headers: { prefer: "return=representation" },
    body: JSON.stringify({ ...row, kennel_id: kennelId }),
  }).then((rows) => rows[0]);
}

async function update<T extends Row>(table: Table, id: number, row: Row, kennelId: string) {
  return request<T[]>(`rest/v1/${table}?id=eq.${id}&${kennelQuery(kennelId)}`, {
    method: "PATCH",
    headers: { prefer: "return=representation" },
    body: JSON.stringify({ ...row, updated_at: now() }),
  }).then((rows) => rows[0] ?? null);
}

async function requireRow(table: Table, id: unknown, kennelId: string, label: string) {
  const recordId = positiveId(id);
  if (!recordId || !(await first(table, recordId, kennelId, "id"))) throw new BreedingValidationError(`${label} is not available in this kennel workspace.`);
  return recordId;
}

async function upsertCalendarEvent(event: ReturnType<typeof breedingCalendarEvents>[number], kennelId: string) {
  const existing = (await select<Row>("events", `select=id&automation_key=eq.${encodeURIComponent(event.automationKey)}&limit=1`, kennelId))[0];
  const payload = {
    title: event.title,
    event_type: event.eventType,
    event_date: event.eventDate,
    event_time: null,
    related_type: event.relatedType,
    related_id: event.relatedId,
    location: null,
    status: "Scheduled",
    notes: event.notes,
    source_type: event.sourceType,
    source_id: event.sourceId,
    automation_key: event.automationKey,
    system_generated: true,
  };
  return existing ? update("events", Number(existing.id), payload, kennelId) : insert("events", { ...payload, created_at: now(), updated_at: now() }, kennelId);
}

export async function getBreedingData(kennelId: string) {
  const tables: Table[] = ["dogs", "dog_genetic_results", "heat_cycles", "progesterone_tests", "breeding_records", "breeding_attempts", "pregnancies", "whelping_sessions", "litters", "puppies", "puppy_weight_logs", "puppy_care_records", "buyers", "kennel_waitlist_entries", "kennel_waitlist_history", "events"];
  const rows = await Promise.all(tables.map((table) => select<Row>(table, "select=*", kennelId).catch((error) => {
    const message = error instanceof Error ? error.message : "";
    if (/could not find|does not exist|schema cache/i.test(message)) return [];
    throw error;
  })));
  return Object.fromEntries(tables.map((table, index) => [table, rows[index]]));
}

export async function saveGeneticResult(input: Row, kennelId: string) {
  const dogId = await requireRow("dogs", input.dog_id, kennelId, "Dog");
  const result = text(input.result, 30);
  if (!["Clear", "Carrier", "At Risk", "Affected", "Indeterminate", "Pending"].includes(result)) throw new BreedingValidationError("Choose a valid structured genetic result.");
  const payload = {
    dog_id: dogId,
    provider: text(input.provider, 160),
    test_name: text(input.test_name, 160),
    gene_or_condition: text(input.gene_or_condition, 160),
    result,
    inheritance_mode: nullableText(input.inheritance_mode, 100),
    result_date: date(input.result_date),
    laboratory_reference: nullableText(input.laboratory_reference, 160),
    document_id: positiveId(input.document_id),
    notes: nullableText(input.notes),
  };
  if (!payload.provider || !payload.test_name || !payload.gene_or_condition) throw new BreedingValidationError("Provider, test, and gene or condition are required.");
  const id = positiveId(input.id);
  return id ? update("dog_genetic_results", id, payload, kennelId) : insert("dog_genetic_results", { ...payload, created_at: now(), updated_at: now() }, kennelId);
}

export async function saveHeatCycle(input: Row, kennelId: string) {
  const dogId = await requireRow("dogs", input.dog_id, kennelId, "Female dog");
  const dog = await first<Row>("dogs", dogId, kennelId);
  if (text(dog?.sex).toLowerCase() !== "female") throw new BreedingValidationError("Heat cycles can only be recorded for a female dog.");
  const heatStart = date(input.heat_start, true)!;
  const previous = await select<Row>("heat_cycles", `select=heat_start&dog_id=eq.${dogId}&order=heat_start.asc`, kennelId);
  const estimate = estimateNextHeat([...previous.map((row) => text(row.heat_start)), heatStart]);
  const created = await insert<Row>("heat_cycles", {
    dog_id: dogId,
    heat_start: heatStart,
    heat_end: date(input.heat_end),
    estimated_next_heat: estimate.estimatedDate,
    average_interval_days: estimate.averageIntervalDays,
    notes: nullableText(input.notes),
    created_at: now(), updated_at: now(),
  }, kennelId);
  await update("dogs", dogId, { next_heat_date: estimate.estimatedDate }, kennelId);
  await upsertCalendarEvent({ automationKey: `heat:${created.id}:start`, title: `${text(dog?.name) || "Female"}: heat cycle`, eventType: "Heat cycle", eventDate: heatStart, relatedType: "dogs", relatedId: dogId, sourceType: "heat_cycles", sourceId: Number(created.id), notes: "Recorded heat-cycle start." }, kennelId);
  if (estimate.estimatedDate) await upsertCalendarEvent({ automationKey: `heat:${created.id}:estimated-next`, title: `${text(dog?.name) || "Female"}: estimated next heat`, eventType: "Heat cycle estimate", eventDate: estimate.estimatedDate, relatedType: "dogs", relatedId: dogId, sourceType: "heat_cycles", sourceId: Number(created.id), notes: `Estimate based on ${estimate.sourceCycles} recorded cycle${estimate.sourceCycles === 1 ? "" : "s"}. Actual timing may vary.` }, kennelId);
  return created;
}

export async function saveProgesteroneTest(input: Row, kennelId: string) {
  const cycleId = await requireRow("heat_cycles", input.heat_cycle_id, kennelId, "Heat cycle");
  const result = finite(input.result);
  if (result == null || result < 0) throw new BreedingValidationError("Enter a valid non-negative progesterone result.");
  const units = text(input.units, 30);
  if (!units) throw new BreedingValidationError("Progesterone units are required.");
  return insert("progesterone_tests", { heat_cycle_id: cycleId, tested_at: timestamp(input.tested_at, true), result, units, laboratory: nullableText(input.laboratory, 160), notes: nullableText(input.notes), created_at: now(), updated_at: now() }, kennelId);
}

export async function saveBreedingRecord(input: Row, kennelId: string) {
  const damId = await requireRow("dogs", input.dam_id, kennelId, "Dam");
  const sireId = await requireRow("dogs", input.sire_id, kennelId, "Sire");
  if (damId === sireId) throw new BreedingValidationError("The sire and dam must be different dogs.");
  const [dogs, genetics] = await Promise.all([
    select<PedigreeDog & Row>("dogs", "select=id,name,registered_name,call_name,sex,breed,color,sire_id,dam_id", kennelId),
    select<GeneticResult & Row>("dog_genetic_results", "select=*", kennelId),
  ]);
  const dam = dogs.find((dog) => Number(dog.id) === damId);
  const sire = dogs.find((dog) => Number(dog.id) === sireId);
  if (text(dam?.sex).toLowerCase() !== "female" || text(sire?.sex).toLowerCase() !== "male") throw new BreedingValidationError("Choose a female dam and a male sire.");
  const generations = Math.max(3, Math.min(10, Number(input.coi_generations) || 5));
  const coi = calculateCoi(sireId, damId, dogs, generations);
  const compatibility = analyzeGeneticCompatibility(sireId, damId, genetics);
  const status = text(input.status, 40) || "Test Mating";
  if (!["Test Mating", "Planned", "Breeding Scheduled", "Bred", "Cancelled"].includes(status)) throw new BreedingValidationError("Choose a valid breeding status.");
  const payload = {
    dam_id: damId, sire_id: sireId,
    heat_cycle_id: positiveId(input.heat_cycle_id),
    litter_id: positiveId(input.litter_id),
    name: text(input.name, 160) || `${text(dam?.name)} × ${text(sire?.name)}`,
    status,
    breeding_method: nullableText(input.breeding_method, 100),
    scheduled_at: timestamp(input.scheduled_at),
    estimated_coi: coi.percentage,
    coi_generations: generations,
    pedigree_completeness: coi.pedigreeCompleteness,
    notes: nullableText(input.notes),
  };
  const recordId = positiveId(input.id);
  const record = recordId ? await update<Row>("breeding_records", recordId, payload, kennelId) : await insert<Row>("breeding_records", { ...payload, created_at: now(), updated_at: now() }, kennelId);
  return { ...record, coi, compatibility };
}

export async function saveBreedingAttempt(input: Row, kennelId: string) {
  const recordId = await requireRow("breeding_records", input.breeding_record_id, kennelId, "Breeding record");
  const record = await first<Row>("breeding_records", recordId, kennelId);
  const attemptedAt = timestamp(input.attempted_at, true)!;
  const method = text(input.method, 100);
  if (!method) throw new BreedingValidationError("Breeding method is required.");
  const attempt = await insert<Row>("breeding_attempts", { breeding_record_id: recordId, attempted_at: attemptedAt, method, notes: nullableText(input.notes), created_at: now(), updated_at: now() }, kennelId);
  await update("breeding_records", recordId, { status: "Bred", breeding_method: method }, kennelId);
  const attempts = await select<Row>("breeding_attempts", `select=attempted_at&breeding_record_id=eq.${recordId}&order=attempted_at.asc`, kennelId);
  const window = estimatePregnancyWindow(attempts.map((row) => text(row.attempted_at)));
  const calendar = breedingCalendarEvents({ breedingRecordId: recordId, damId: Number(record?.dam_id), firstAttempt: text(attempts[0]?.attempted_at), lastAttempt: text(attempts[attempts.length - 1]?.attempted_at) });
  await Promise.all(calendar.map((event) => upsertCalendarEvent(event, kennelId)));
  return { ...attempt, estimatedPregnancyWindow: window };
}

export async function savePregnancy(input: Row, kennelId: string) {
  const recordId = await requireRow("breeding_records", input.breeding_record_id, kennelId, "Breeding record");
  const record = await first<Row>("breeding_records", recordId, kennelId);
  const attempts = await select<Row>("breeding_attempts", `select=attempted_at&breeding_record_id=eq.${recordId}&order=attempted_at.asc`, kennelId);
  const estimate = attempts.length ? estimatePregnancyWindow(attempts.map((attempt) => text(attempt.attempted_at))) : null;
  const status = text(input.status, 40) || "Pending";
  if (!["Pending", "Confirmed", "Not Pregnant", "Completed", "Lost"].includes(status)) throw new BreedingValidationError("Choose a valid pregnancy status.");
  const payload = {
    breeding_record_id: recordId,
    dam_id: Number(record?.dam_id), sire_id: Number(record?.sire_id),
    litter_id: positiveId(input.litter_id) || positiveId(record?.litter_id),
    status,
    confirmation_method: nullableText(input.confirmation_method, 100),
    confirmed_at: timestamp(input.confirmed_at),
    ultrasound_at: timestamp(input.ultrasound_at),
    ultrasound_result: nullableText(input.ultrasound_result, 500),
    xray_at: timestamp(input.xray_at),
    xray_result: nullableText(input.xray_result, 500),
    estimated_puppy_count: finite(input.estimated_puppy_count),
    estimated_due_start: date(input.estimated_due_start) || estimate?.start || null,
    estimated_due_end: date(input.estimated_due_end) || estimate?.end || null,
    actual_whelping_at: timestamp(input.actual_whelping_at),
    notes: nullableText(input.notes),
  };
  const pregnancyId = positiveId(input.id);
  const saved = pregnancyId ? await update<Row>("pregnancies", pregnancyId, payload, kennelId) : await insert<Row>("pregnancies", { ...payload, created_at: now(), updated_at: now() }, kennelId);
  if (payload.estimated_due_start) await upsertCalendarEvent({ automationKey: `pregnancy:${saved.id}:due-start`, title: "Estimated whelping window begins", eventType: "Whelping", eventDate: payload.estimated_due_start, relatedType: "dogs", relatedId: Number(record?.dam_id), sourceType: "pregnancies", sourceId: Number(saved.id), notes: "Estimated date. Actual timing may vary." }, kennelId);
  if (payload.estimated_due_end) await upsertCalendarEvent({ automationKey: `pregnancy:${saved.id}:due-end`, title: "Estimated whelping window ends", eventType: "Whelping", eventDate: payload.estimated_due_end, relatedType: "dogs", relatedId: Number(record?.dam_id), sourceType: "pregnancies", sourceId: Number(saved.id), notes: "Estimated date. Actual timing may vary." }, kennelId);
  if (payload.ultrasound_at) await upsertCalendarEvent({ automationKey: `pregnancy:${saved.id}:ultrasound`, title: "Pregnancy ultrasound", eventType: "Pregnancy milestone", eventDate: payload.ultrasound_at.slice(0, 10), relatedType: "dogs", relatedId: Number(record?.dam_id), sourceType: "pregnancies", sourceId: Number(saved.id), notes: payload.ultrasound_result || "Ultrasound date recorded on the pregnancy record." }, kennelId);
  if (payload.xray_at) await upsertCalendarEvent({ automationKey: `pregnancy:${saved.id}:xray`, title: "Pregnancy X-ray", eventType: "Pregnancy milestone", eventDate: payload.xray_at.slice(0, 10), relatedType: "dogs", relatedId: Number(record?.dam_id), sourceType: "pregnancies", sourceId: Number(saved.id), notes: payload.xray_result || "X-ray date recorded on the pregnancy record." }, kennelId);
  return { ...saved, estimatedPregnancyWindow: estimate };
}

export async function startWhelping(input: Row, kennelId: string) {
  const pregnancyId = await requireRow("pregnancies", input.pregnancy_id, kennelId, "Pregnancy");
  const pregnancy = await first<Row>("pregnancies", pregnancyId, kennelId);
  const litterId = await requireRow("litters", input.litter_id || pregnancy?.litter_id, kennelId, "Litter");
  const damId = await requireRow("dogs", pregnancy?.dam_id, kennelId, "Dam");
  const startedAt = timestamp(input.labor_started_at || now(), true)!;
  const session = await insert<Row>("whelping_sessions", { pregnancy_id: pregnancyId, litter_id: litterId, dam_id: damId, sire_id: positiveId(pregnancy?.sire_id), labor_started_at: startedAt, status: "Active", notes: nullableText(input.notes), created_at: now(), updated_at: now() }, kennelId);
  await update("pregnancies", pregnancyId, { actual_whelping_at: startedAt }, kennelId);
  await update("litters", litterId, { status: "Active", birth_date: startedAt.slice(0, 10) }, kennelId);
  await upsertCalendarEvent({ automationKey: `whelping:${session.id}:started`, title: "Whelping started", eventType: "Whelping", eventDate: startedAt.slice(0, 10), relatedType: "litters", relatedId: litterId, sourceType: "whelping_sessions", sourceId: Number(session.id), notes: "Labor start recorded in Whelping Mode." }, kennelId);
  return session;
}

export async function addWhelpingPuppy(input: Row, kennelId: string) {
  const sessionId = await requireRow("whelping_sessions", input.whelping_session_id, kennelId, "Active whelping session");
  const session = await first<Row>("whelping_sessions", sessionId, kennelId);
  if (text(session?.status) !== "Active") throw new BreedingValidationError("This whelping session is no longer active.");
  const existing = await select<Row>("puppies", `select=id&whelping_session_id=eq.${sessionId}`, kennelId);
  const birthOrder = Math.max(1, Math.round(finite(input.birth_order) || existing.length + 1));
  const birthAt = timestamp(input.birth_at || now(), true)!;
  const birthWeight = finite(input.birth_weight);
  const weightUnit = text(input.weight_unit, 10) || "oz";
  if (birthWeight == null || birthWeight <= 0) throw new BreedingValidationError("Enter the puppy's birth weight.");
  if (!["g", "kg", "oz", "lb"].includes(weightUnit)) throw new BreedingValidationError("Choose grams, kilograms, ounces, or pounds for the birth weight.");
  const puppy = await insert<Row>("puppies", {
    litter_id: Number(session?.litter_id), buyer_id: null,
    whelping_session_id: sessionId,
    name: text(input.name, 120) || `Puppy ${birthOrder}`,
    sex: nullableText(input.sex, 20), color: nullableText(input.color, 80), markings: nullableText(input.markings, 200), coat_type: nullableText(input.coat_type, 80), collar_color: nullableText(input.collar_color, 80),
    birth_date: birthAt.slice(0, 10), birth_at: birthAt, birth_order: birthOrder,
    birth_weight: birthWeight, current_weight: birthWeight, weight_unit: weightUnit,
    placenta_observed: boolean(input.placenta_observed), nursing_status: nullableText(input.nursing_status, 80), health_status: nullableText(input.health_status, 80),
    status: text(input.status, 60) || "Born", price_cents: null, notes: nullableText(input.notes),
    created_at: now(), updated_at: now(),
  }, kennelId);
  await insert("puppy_weight_logs", { puppy_id: Number(puppy.id), measured_at: birthAt, weight: birthWeight, unit: weightUnit, feeding_status: nullableText(input.nursing_status, 80), notes: "Birth weight recorded in Whelping Mode.", created_at: now(), updated_at: now() }, kennelId);
  await Promise.all(puppyCalendarEvents({ puppyId: Number(puppy.id), puppyName: text(puppy.name), birthDate: birthAt.slice(0, 10) }).map((event) => upsertCalendarEvent(event, kennelId)));
  return puppy;
}

export async function completeWhelping(input: Row, kennelId: string) {
  const sessionId = await requireRow("whelping_sessions", input.whelping_session_id, kennelId, "Whelping session");
  const session = await first<Row>("whelping_sessions", sessionId, kennelId);
  const completedAt = timestamp(input.completed_at || now(), true)!;
  const saved = await update<Row>("whelping_sessions", sessionId, { status: "Completed", completed_at: completedAt, notes: nullableText(input.notes) ?? session?.notes ?? null }, kennelId);
  if (positiveId(session?.pregnancy_id)) await update("pregnancies", Number(session?.pregnancy_id), { status: "Completed", actual_whelping_at: text(session?.labor_started_at) || completedAt }, kennelId);
  await update("litters", Number(session?.litter_id), { status: "Raising", birth_date: text(session?.labor_started_at).slice(0, 10) || completedAt.slice(0, 10) }, kennelId);
  return saved;
}

export async function recordPuppyWeight(input: Row, kennelId: string) {
  const puppyId = await requireRow("puppies", input.puppy_id, kennelId, "Puppy");
  const weight = finite(input.weight);
  const unit = text(input.unit, 10);
  if (weight == null || weight <= 0 || !["g", "kg", "oz", "lb"].includes(unit)) throw new BreedingValidationError("Enter a positive weight and valid unit.");
  const record = await insert<Row>("puppy_weight_logs", { puppy_id: puppyId, measured_at: timestamp(input.measured_at || now(), true), weight, unit, feeding_status: nullableText(input.feeding_status, 80), notes: nullableText(input.notes), created_at: now(), updated_at: now() }, kennelId);
  await update("puppies", puppyId, { current_weight: weight, weight_unit: unit }, kennelId);
  return record;
}

export async function recordPuppyCare(input: Row, kennelId: string) {
  const puppyId = await requireRow("puppies", input.puppy_id, kennelId, "Puppy");
  const title = text(input.title, 160);
  const careType = text(input.care_type, 80);
  if (!title || !careType) throw new BreedingValidationError("Care type and title are required.");
  const record = await insert<Row>("puppy_care_records", { puppy_id: puppyId, care_type: careType, title, occurred_at: timestamp(input.occurred_at || now(), true), next_due_at: timestamp(input.next_due_at), provider: nullableText(input.provider, 160), medication: nullableText(input.medication, 160), dosage: nullableText(input.dosage, 120), status: text(input.status, 60) || "Completed", visible_to_family: input.visible_to_family == null ? true : boolean(input.visible_to_family), notes: nullableText(input.notes), created_at: now(), updated_at: now() }, kennelId);
  if (record.next_due_at) await upsertCalendarEvent({ automationKey: `puppy-care:${record.id}:next`, title: `${title} due`, eventType: "Care", eventDate: text(record.next_due_at).slice(0, 10), relatedType: "puppies", relatedId: puppyId, sourceType: "puppy_care_records", sourceId: Number(record.id), notes: "Generated from the next-due date on the puppy care record." }, kennelId);
  return record;
}

export async function saveWaitlistEntry(input: Row, kennelId: string) {
  const buyerId = await requireRow("buyers", input.buyer_id, kennelId, "Family");
  const litterId = positiveId(input.litter_id);
  if (litterId) await requireRow("litters", litterId, kennelId, "Preferred litter");
  const assignedPuppyId = positiveId(input.assigned_puppy_id);
  if (assignedPuppyId) await requireRow("puppies", assignedPuppyId, kennelId, "Assigned puppy");
  const status = text(input.status, 40) || "Waiting";
  if (!["Waiting", "Ready to Pick", "Puppy Assigned", "Passed", "Next Litter", "On Hold", "Completed", "Removed"].includes(status)) throw new BreedingValidationError("Choose a valid waitlist status.");
  const count = (await select<Row>("kennel_waitlist_entries", "select=id", kennelId)).length;
  const payload = { buyer_id: buyerId, litter_id: litterId, application_reference: nullableText(input.application_reference, 160), preferred_sex: nullableText(input.preferred_sex, 40), preferred_color: nullableText(input.preferred_color, 80), preferred_coat: nullableText(input.preferred_coat, 80), other_preferences: nullableText(input.other_preferences), deposit_status: text(input.deposit_status, 80) || "Not recorded", joined_at: date(input.joined_at) || new Date().toISOString().slice(0, 10), priority_rank: Math.max(1, Math.round(finite(input.priority_rank) || count + 1)), picking_position: positiveId(input.picking_position), assigned_puppy_id: assignedPuppyId, status, notes: nullableText(input.notes) };
  const id = positiveId(input.id);
  const saved = id ? await update<Row>("kennel_waitlist_entries", id, payload, kennelId) : await insert<Row>("kennel_waitlist_entries", { ...payload, created_at: now(), updated_at: now() }, kennelId);
  if (!id) await insert("kennel_waitlist_history", { waitlist_entry_id: Number(saved.id), action: "Added", previous_status: null, new_status: payload.status, previous_position: null, new_position: payload.picking_position, puppy_id: null, note: "Family added to the waitlist.", changed_by: null, created_at: now() }, kennelId);
  return saved;
}

export async function reorderWaitlist(input: Row, kennelId: string) {
  const orderedIds = Array.isArray(input.ordered_ids) ? input.ordered_ids.map(positiveId).filter((id): id is number => Boolean(id)) : [];
  if (!orderedIds.length || new Set(orderedIds).size !== orderedIds.length) throw new BreedingValidationError("Provide a valid ordered waitlist.");
  const records = await select<Row>("kennel_waitlist_entries", `select=id,picking_position,status&id=in.(${orderedIds.join(",")})`, kennelId);
  if (records.length !== orderedIds.length) throw new BreedingValidationError("One or more waitlist entries are not available in this kennel workspace.");
  for (let index = 0; index < orderedIds.length; index += 1) {
    const id = orderedIds[index];
    const previous = records.find((record) => Number(record.id) === id);
    const nextPosition = index + 1;
    if (Number(previous?.picking_position) === nextPosition) continue;
    await update("kennel_waitlist_entries", id, { picking_position: nextPosition }, kennelId);
    await insert("kennel_waitlist_history", { waitlist_entry_id: id, action: "Reordered", previous_status: previous?.status ?? null, new_status: previous?.status ?? null, previous_position: positiveId(previous?.picking_position), new_position: nextPosition, puppy_id: null, note: nullableText(input.note), changed_by: null, created_at: now() }, kennelId);
  }
  return { orderedIds };
}

export async function assignWaitlistPuppy(input: Row, kennelId: string) {
  const entryId = await requireRow("kennel_waitlist_entries", input.waitlist_entry_id, kennelId, "Waitlist entry");
  const puppyId = await requireRow("puppies", input.puppy_id, kennelId, "Puppy");
  const entry = await first<Row>("kennel_waitlist_entries", entryId, kennelId);
  const puppy = await first<Row>("puppies", puppyId, kennelId);
  if (positiveId(puppy?.buyer_id) && Number(puppy?.buyer_id) !== Number(entry?.buyer_id)) throw new BreedingValidationError("This puppy is already assigned to another family.");
  await update("puppies", puppyId, { buyer_id: Number(entry?.buyer_id), status: "Assigned" }, kennelId);
  await update("buyers", Number(entry?.buyer_id), { application_status: "Matched" }, kennelId);
  const saved = await update<Row>("kennel_waitlist_entries", entryId, { assigned_puppy_id: puppyId, status: "Puppy Assigned" }, kennelId);
  await insert("kennel_waitlist_history", { waitlist_entry_id: entryId, action: "Puppy assigned", previous_status: entry?.status ?? null, new_status: "Puppy Assigned", previous_position: positiveId(entry?.picking_position), new_position: positiveId(entry?.picking_position), puppy_id: puppyId, note: nullableText(input.note), changed_by: null, created_at: now() }, kennelId);
  await upsertCalendarEvent({ automationKey: `waitlist:${entryId}:assigned:${puppyId}`, title: `${text(puppy?.name) || "Puppy"} assigned to family`, eventType: "Puppy selection", eventDate: new Date().toISOString().slice(0, 10), relatedType: "buyers", relatedId: Number(entry?.buyer_id), sourceType: "kennel_waitlist_entries", sourceId: entryId, notes: "Assignment is stored on the puppy record and is immediately available to the Puppy Portal." }, kennelId);
  return saved;
}

export async function moveWaitlistEntry(input: Row, kennelId: string) {
  const entryId = await requireRow("kennel_waitlist_entries", input.waitlist_entry_id, kennelId, "Waitlist entry");
  const entry = await first<Row>("kennel_waitlist_entries", entryId, kennelId);
  const status = text(input.status, 40);
  if (!["Waiting", "Ready to Pick", "Passed", "Next Litter", "On Hold", "Completed", "Removed"].includes(status)) throw new BreedingValidationError("Choose a valid waitlist action.");
  const nextPosition = positiveId(input.picking_position) ?? positiveId(entry?.picking_position);
  const saved = await update<Row>("kennel_waitlist_entries", entryId, { status, picking_position: nextPosition, assigned_puppy_id: status === "Waiting" || status === "Next Litter" ? null : entry?.assigned_puppy_id ?? null }, kennelId);
  await insert("kennel_waitlist_history", { waitlist_entry_id: entryId, action: text(input.action, 100) || status, previous_status: entry?.status ?? null, new_status: status, previous_position: positiveId(entry?.picking_position), new_position: nextPosition, puppy_id: positiveId(entry?.assigned_puppy_id), note: nullableText(input.note), changed_by: null, created_at: now() }, kennelId);
  return saved;
}
