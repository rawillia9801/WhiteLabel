import { addDays, predictNextHeat } from "../lib/breeding-domain";
import { supabaseRequest } from "./supabase";

export type BreedingModuleResource =
  | "heat_cycles"
  | "progesterone_tests"
  | "breeding_attempts"
  | "genetic_tests"
  | "puppy_weight_logs"
  | "puppy_care_records"
  | "waitlist_entries";

type TableName = BreedingModuleResource | "waitlist_history" | "dogs" | "litters" | "puppies" | "buyers";
type Input = Record<string, unknown>;

const allowedResources = new Set<BreedingModuleResource>([
  "heat_cycles", "progesterone_tests", "breeding_attempts", "genetic_tests", "puppy_weight_logs", "puppy_care_records", "waitlist_entries",
]);

const text = (value: unknown) => String(value ?? "").trim();
const nullableText = (value: unknown) => text(value) || null;
const number = (value: unknown) => {
  if (value == null || text(value) === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const positiveId = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};
const bool = (value: unknown) => value === true || value === "true" || value === "on" || value === 1 || value === "1";
const isoDate = (value: unknown) => {
  const raw = text(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
};

async function jsonRequest<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  const response = await supabaseRequest(path, { ...init, headers, cache: "no-store" });
  const body = await response.text();
  const payload = body ? JSON.parse(body) : null;
  if (!response.ok) throw new Error(payload?.message ?? payload?.error ?? "Breeding program request failed.");
  return payload as T;
}

const tenantQuery = (query: string, kennelId: string) => `${query}&kennel_id=eq.${encodeURIComponent(kennelId)}`;

async function selectAll<T>(table: TableName, kennelId: string, query = "select=*") {
  return jsonRequest<T[]>(`rest/v1/${table}?${tenantQuery(query, kennelId)}`);
}

async function selectSafeAll<T>(table: TableName, kennelId: string, query = "select=*") {
  try {
    return await selectAll<T>(table, kennelId, query);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/could not find the table|does not exist|schema cache/i.test(message)) return [];
    throw error;
  }
}

async function ownedRow(table: TableName, id: number, kennelId: string) {
  const rows = await selectAll<Record<string, unknown>>(table, kennelId, `select=*&id=eq.${id}&limit=1`);
  if (!rows[0]) throw new Error(`The selected ${table.replaceAll("_", " ")} record does not belong to this kennel.`);
  return rows[0];
}

async function insertRow<T>(table: TableName, kennelId: string, row: Record<string, unknown>) {
  const rows = await jsonRequest<T[]>(`rest/v1/${table}`, {
    method: "POST",
    headers: { prefer: "return=representation" },
    body: JSON.stringify({ ...row, kennel_id: kennelId }),
  });
  return rows[0];
}

async function patchRow<T>(table: TableName, id: number, kennelId: string, row: Record<string, unknown>) {
  const rows = await jsonRequest<T[]>(`rest/v1/${table}?id=eq.${id}&kennel_id=eq.${encodeURIComponent(kennelId)}`, {
    method: "PATCH",
    headers: { prefer: "return=representation" },
    body: JSON.stringify(row),
  });
  if (!rows[0]) throw new Error(`The ${table.replaceAll("_", " ")} record could not be updated in this kennel.`);
  return rows[0];
}

async function rpc(name: string, payload: Record<string, unknown>) {
  return jsonRequest(`rest/v1/rpc/${name}`, { method: "POST", body: JSON.stringify(payload) });
}

export function isBreedingModuleResource(value: unknown): value is BreedingModuleResource {
  return typeof value === "string" && allowedResources.has(value as BreedingModuleResource);
}

export async function getBreedingProgramData(kennelId: string) {
  const [heatCycles, progesteroneTests, breedingAttempts, geneticTests, puppyWeightLogs, puppyCareRecords, waitlistEntries, waitlistHistory] = await Promise.all([
    selectSafeAll<Record<string, unknown>>("heat_cycles", kennelId, "select=*&order=start_date.desc"),
    selectSafeAll<Record<string, unknown>>("progesterone_tests", kennelId, "select=*&order=tested_at.desc"),
    selectSafeAll<Record<string, unknown>>("breeding_attempts", kennelId, "select=*&order=attempted_at.desc"),
    selectSafeAll<Record<string, unknown>>("genetic_tests", kennelId, "select=*&order=result_date.desc.nullslast,condition.asc"),
    selectSafeAll<Record<string, unknown>>("puppy_weight_logs", kennelId, "select=*&order=measured_at.desc"),
    selectSafeAll<Record<string, unknown>>("puppy_care_records", kennelId, "select=*&order=care_date.desc"),
    selectSafeAll<Record<string, unknown>>("waitlist_entries", kennelId, "select=*&order=picking_position.asc.nullslast,priority_rank.desc,joined_at.asc"),
    selectSafeAll<Record<string, unknown>>("waitlist_history", kennelId, "select=*&order=created_at.desc&limit=100"),
  ]);
  return {
    heat_cycles: heatCycles,
    progesterone_tests: progesteroneTests,
    breeding_attempts: breedingAttempts,
    genetic_tests: geneticTests,
    puppy_weight_logs: puppyWeightLogs,
    puppy_care_records: puppyCareRecords,
    waitlist_entries: waitlistEntries,
    waitlist_history: waitlistHistory,
  };
}

function rowFor(resource: BreedingModuleResource, data: Input): Record<string, unknown> {
  const now = new Date().toISOString();
  switch (resource) {
    case "heat_cycles":
      return { dog_id: positiveId(data.dog_id), start_date: isoDate(data.start_date), end_date: isoDate(data.end_date), notes: nullableText(data.notes), updated_at: now };
    case "progesterone_tests":
      return { dog_id: positiveId(data.dog_id), heat_cycle_id: positiveId(data.heat_cycle_id), tested_at: text(data.tested_at) || now, result: number(data.result), units: text(data.units) || "ng/mL", laboratory: nullableText(data.laboratory), notes: nullableText(data.notes), updated_at: now };
    case "breeding_attempts":
      return { litter_id: positiveId(data.litter_id), dam_id: positiveId(data.dam_id), sire_id: positiveId(data.sire_id), heat_cycle_id: positiveId(data.heat_cycle_id), attempted_at: text(data.attempted_at) || now, method: text(data.method) || "Natural", status: text(data.status) || "Recorded", notes: nullableText(data.notes), updated_at: now };
    case "genetic_tests":
      return { dog_id: positiveId(data.dog_id), condition: text(data.condition), gene: nullableText(data.gene), result_status: text(data.result_status) || "Not Tested", inheritance_mode: text(data.inheritance_mode) || "Autosomal Recessive", provider: nullableText(data.provider), result_date: isoDate(data.result_date), laboratory_reference: nullableText(data.laboratory_reference), dog_document_id: positiveId(data.dog_document_id), notes: nullableText(data.notes), updated_at: now };
    case "puppy_weight_logs":
      return { puppy_id: positiveId(data.puppy_id), measured_at: text(data.measured_at) || now, weight: number(data.weight), unit: text(data.unit) || "oz", notes: nullableText(data.notes) };
    case "puppy_care_records":
      return { puppy_id: positiveId(data.puppy_id), care_type: text(data.care_type), title: text(data.title), care_date: isoDate(data.care_date), product: nullableText(data.product), lot_number: nullableText(data.lot_number), provider: nullableText(data.provider), next_due_date: isoDate(data.next_due_date), notes: nullableText(data.notes), visible_in_portal: data.visible_in_portal == null ? true : bool(data.visible_in_portal), updated_at: now };
    case "waitlist_entries":
      return { buyer_id: positiveId(data.buyer_id), litter_id: positiveId(data.litter_id), preferred_sex: nullableText(data.preferred_sex), preferred_color: nullableText(data.preferred_color), preferred_coat_type: nullableText(data.preferred_coat_type), other_preferences: nullableText(data.other_preferences), deposit_status: text(data.deposit_status) || "Not received", priority_rank: number(data.priority_rank) ?? 0, picking_position: positiveId(data.picking_position), status: text(data.status) || "Waiting", assigned_puppy_id: positiveId(data.assigned_puppy_id), retain_priority: data.retain_priority == null ? true : bool(data.retain_priority), notes: nullableText(data.notes), updated_at: now };
  }
}

async function validateReferences(resource: BreedingModuleResource, row: Record<string, unknown>, kennelId: string) {
  const checks: Array<Promise<unknown>> = [];
  if (row.dog_id) checks.push(ownedRow("dogs", Number(row.dog_id), kennelId));
  if (row.dam_id) checks.push(ownedRow("dogs", Number(row.dam_id), kennelId));
  if (row.sire_id) checks.push(ownedRow("dogs", Number(row.sire_id), kennelId));
  if (row.litter_id) checks.push(ownedRow("litters", Number(row.litter_id), kennelId));
  if (row.puppy_id) checks.push(ownedRow("puppies", Number(row.puppy_id), kennelId));
  if (row.assigned_puppy_id) checks.push(ownedRow("puppies", Number(row.assigned_puppy_id), kennelId));
  if (row.buyer_id) checks.push(ownedRow("buyers", Number(row.buyer_id), kennelId));
  if (row.heat_cycle_id) checks.push(ownedRow("heat_cycles", Number(row.heat_cycle_id), kennelId));
  await Promise.all(checks);
  if (resource === "breeding_attempts" && row.dam_id === row.sire_id) throw new Error("Choose two different dogs for a breeding attempt.");
}

async function updateHeatForecast(dogId: number, kennelId: string) {
  const cycles = await selectAll<{ start_date: string }>("heat_cycles", kennelId, `select=start_date&dog_id=eq.${dogId}&order=start_date.asc`);
  const forecast = predictNextHeat(cycles);
  if (!forecast) return;
  const now = new Date().toISOString();
  await patchRow("dogs", dogId, kennelId, { next_heat_date: forecast.estimatedDate, updated_at: now });
  const latest = await selectAll<{ id: number }>("heat_cycles", kennelId, `select=id&dog_id=eq.${dogId}&order=start_date.desc&limit=1`);
  if (latest[0]) await patchRow("heat_cycles", latest[0].id, kennelId, { predicted_next_heat: forecast.estimatedDate, updated_at: now });
}

export async function createBreedingModuleRecord(resource: BreedingModuleResource, data: Input, kennelId: string) {
  const row = rowFor(resource, data);
  await validateReferences(resource, row, kennelId);
  if (resource === "heat_cycles" && (!row.dog_id || !row.start_date)) throw new Error("A dog and heat start date are required.");
  if (resource === "genetic_tests" && (!row.dog_id || !row.condition)) throw new Error("A dog and genetic condition are required.");
  if (resource === "puppy_weight_logs" && (!row.puppy_id || !row.weight)) throw new Error("A puppy and weight are required.");
  if (resource === "puppy_care_records" && (!row.puppy_id || !row.care_type || !row.title || !row.care_date)) throw new Error("A puppy, care type, title, and date are required.");

  if (resource === "waitlist_entries" && !row.picking_position) {
    const last = await selectAll<{ picking_position: number | null }>("waitlist_entries", kennelId, "select=picking_position&order=picking_position.desc.nullslast&limit=1");
    row.picking_position = Math.max(0, Number(last[0]?.picking_position) || 0) + 1;
  }

  const created = await insertRow<Record<string, unknown>>(resource, kennelId, { ...row, created_at: new Date().toISOString() });
  if (resource === "heat_cycles" && row.dog_id) await updateHeatForecast(Number(row.dog_id), kennelId);
  if (resource === "breeding_attempts" && row.litter_id) {
    const litter = await ownedRow("litters", Number(row.litter_id), kennelId);
    const attemptDate = text(row.attempted_at).slice(0, 10);
    const breedingDate = text(litter.breeding_date) || attemptDate;
    if (!text(litter.breeding_date)) {
      await patchRow("litters", Number(row.litter_id), kennelId, { breeding_date: breedingDate, due_date: addDays(breedingDate, 63), updated_at: new Date().toISOString() });
    }
    await syncBreedingCalendarEvents(Number(row.litter_id), breedingDate, kennelId);
  }
  if (resource === "puppy_weight_logs" && row.puppy_id && row.weight) {
    const unit = text(row.unit) || "oz";
    const rawWeight = Number(row.weight);
    const pounds = unit === "lb" ? rawWeight : unit === "oz" ? rawWeight / 16 : unit === "kg" ? rawWeight * 2.2046226218 : rawWeight / 453.59237;
    await patchRow("puppies", Number(row.puppy_id), kennelId, { current_weight: Number(pounds.toFixed(4)), updated_at: new Date().toISOString() });
  }
  return created;
}

export async function updateBreedingModuleRecord(resource: BreedingModuleResource, id: number, data: Input, kennelId: string, actorId?: string) {
  const before = await ownedRow(resource, id, kennelId);
  const row = rowFor(resource, data);
  await validateReferences(resource, row, kennelId);
  const updated = await patchRow<Record<string, unknown>>(resource, id, kennelId, row);
  if (resource === "waitlist_entries") {
    await insertRow("waitlist_history", kennelId, {
      waitlist_entry_id: id,
      action: "Waitlist entry updated",
      from_position: before.picking_position ?? null,
      to_position: updated.picking_position ?? null,
      from_status: before.status ?? null,
      to_status: updated.status ?? null,
      notes: nullableText(data.history_note),
      created_by: actorId || null,
    });
  }
  if (resource === "heat_cycles" && row.dog_id) await updateHeatForecast(Number(row.dog_id), kennelId);
  return updated;
}

export async function startWhelping(litterId: number, kennelId: string) {
  await ownedRow("litters", litterId, kennelId);
  return patchRow("litters", litterId, kennelId, { whelping_started_at: new Date().toISOString(), status: "Active", updated_at: new Date().toISOString() });
}

export async function completeWhelping(litterId: number, kennelId: string) {
  await ownedRow("litters", litterId, kennelId);
  return patchRow("litters", litterId, kennelId, { whelping_completed_at: new Date().toISOString(), updated_at: new Date().toISOString() });
}

export async function updateDogBreedingProfile(dogId: number, data: Input, kennelId: string) {
  await ownedRow("dogs", dogId, kennelId);
  const sireId = positiveId(data.sire_id);
  const damId = positiveId(data.dam_id);
  await Promise.all([
    sireId ? ownedRow("dogs", sireId, kennelId) : Promise.resolve(),
    damId ? ownedRow("dogs", damId, kennelId) : Promise.resolve(),
  ]);
  if (sireId === dogId || damId === dogId) throw new Error("A dog cannot be its own parent.");
  if (sireId && damId && sireId === damId) throw new Error("Sire and dam must be different dogs.");
  return patchRow("dogs", dogId, kennelId, {
    breed: nullableText(data.breed),
    markings: nullableText(data.markings),
    coat_type: nullableText(data.coat_type),
    breeder_name: nullableText(data.breeder_name),
    owner_name: nullableText(data.owner_name),
    sire_id: sireId,
    dam_id: damId,
    updated_at: new Date().toISOString(),
  });
}

export async function updateLitterPregnancy(litterId: number, data: Input, kennelId: string) {
  const litter = await ownedRow("litters", litterId, kennelId);
  const breedingDate = isoDate(data.breeding_date) || isoDate(litter.breeding_date);
  const row = {
    pregnancy_status: text(data.pregnancy_status) || "Unknown",
    pregnancy_confirmed_date: isoDate(data.pregnancy_confirmed_date),
    ultrasound_date: isoDate(data.ultrasound_date),
    xray_date: isoDate(data.xray_date),
    expected_count: number(data.expected_count),
    breeding_date: breedingDate,
    due_date: breedingDate ? addDays(breedingDate, 63) : isoDate(data.due_date),
    updated_at: new Date().toISOString(),
  };
  const updated = await patchRow("litters", litterId, kennelId, row);
  await syncBreedingCalendarEvents(litterId, breedingDate, kennelId);
  return updated;
}

export async function recordWhelpingPuppy(data: Input, kennelId: string) {
  const litterId = positiveId(data.litter_id);
  if (!litterId) throw new Error("Choose a litter before recording a puppy.");
  await ownedRow("litters", litterId, kennelId);
  const now = new Date().toISOString();
  const birthDate = isoDate(data.birth_date) || now.slice(0, 10);
  const puppy = await insertRow<Record<string, unknown>>("puppies", kennelId, {
    litter_id: litterId,
    buyer_id: null,
    name: text(data.name) || `Puppy ${text(data.puppy_number) || "New"}`,
    sex: nullableText(data.sex),
    color: nullableText(data.color),
    markings: nullableText(data.markings),
    coat_type: nullableText(data.coat_type),
    collar_color: nullableText(data.collar_color),
    birth_date: birthDate,
    birth_time: nullableText(data.birth_time),
    birth_weight: number(data.birth_weight),
    birth_weight_unit: text(data.birth_weight_unit) || "oz",
    current_weight: null,
    placenta_observed: data.placenta_observed == null ? null : bool(data.placenta_observed),
    nursing_status: nullableText(data.nursing_status),
    status: "Not Yet Available",
    price_cents: null,
    notes: nullableText(data.notes),
    created_at: now,
    updated_at: now,
  });
  const weight = number(data.birth_weight);
  if (weight && weight > 0) {
    await insertRow("puppy_weight_logs", kennelId, { puppy_id: puppy.id, measured_at: now, weight, unit: text(data.birth_weight_unit) || "oz", notes: "Birth weight", created_at: now });
  }
  await patchRow("litters", litterId, kennelId, { birth_date: birthDate, status: "Active", updated_at: now });
  return puppy;
}

export async function assignWaitlistPuppy(entryId: number, puppyId: number, kennelId: string, actorId?: string) {
  await Promise.all([ownedRow("waitlist_entries", entryId, kennelId), ownedRow("puppies", puppyId, kennelId)]);
  await rpc("assign_waitlist_puppy", { p_kennel_id: kennelId, p_entry_id: entryId, p_puppy_id: puppyId, p_actor: actorId || null });
}

export async function moveWaitlistEntry(entryId: number, direction: -1 | 1, kennelId: string, actorId?: string) {
  await ownedRow("waitlist_entries", entryId, kennelId);
  await rpc("move_waitlist_entry", { p_kennel_id: kennelId, p_entry_id: entryId, p_direction: direction, p_actor: actorId || null });
}

export async function syncBreedingCalendarEvents(litterId: number, breedingDate: string | null | undefined, kennelId: string) {
  await ownedRow("litters", litterId, kennelId);
  await rpc("sync_breeding_calendar", { p_kennel_id: kennelId, p_litter_id: litterId, p_breeding_date: isoDate(breedingDate) });
}
