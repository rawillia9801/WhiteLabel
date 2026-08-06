import assert from "node:assert/strict";

const baseUrl = process.env.WORKFLOW_BASE_URL || "http://127.0.0.1:3217";
const supabaseUrl = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "");
if (!supabaseUrl || !serviceKey) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");

let cookie = "";
let kennelId = "";
let ownerUserId = "";
const suffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

async function api(path, init = {}) {
  const headers = new Headers(init.headers);
  if (init.body && typeof init.body !== "string") {
    headers.set("content-type", "application/json");
    init = { ...init, body: JSON.stringify(init.body) };
  }
  if (cookie) headers.set("cookie", cookie);
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers, redirect: "manual" });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";", 1)[0];
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(`${init.method || "GET"} ${path}: ${payload?.error || text || response.status}`);
  return payload;
}

async function service(path, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("apikey", serviceKey);
  headers.set("authorization", `Bearer ${serviceKey}`);
  const response = await fetch(`${supabaseUrl}/${path}`, { ...init, headers });
  if (!response.ok && response.status !== 404) throw new Error((await response.text()) || `Cleanup failed for ${path}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

const create = (resource, data) => api("/api/data", { method: "POST", body: { resource, data } });
const breeding = (action, data) => api("/api/breeding", { method: "POST", body: { action, data } });

try {
  const signup = await api("/api/auth/signup", { method: "POST", body: {
    email: `workflow-${suffix}@example.invalid`,
    password: "WorkflowTest987A!",
    kennel_name: `Workflow Test ${suffix}`,
    kennel_slug: `workflow-${suffix}`.slice(0, 44).replace(/-$/, "x"),
    plan: "starter",
  } });
  kennelId = signup.kennel.id;
  assert.match(kennelId, /^[0-9a-f-]{36}$/i);

  const common = await create("dogs", { name: "Common Ancestor", registered_name: "Workflow Common Ancestor", sex: "Male", role: "Sire", status: "Retired" });
  const sireDam = await create("dogs", { name: "Sire Dam", sex: "Female", role: "Dam", status: "Retired" });
  const damDam = await create("dogs", { name: "Dam Dam", sex: "Female", role: "Dam", status: "Retired" });
  const sire = await create("dogs", { name: "Workflow Sire", registered_name: "Workflow Test Sire", sex: "Male", role: "Sire", status: "Active", sire_id: common.id, dam_id: sireDam.id });
  const dam = await create("dogs", { name: "Workflow Dam", registered_name: "Workflow Test Dam", sex: "Female", role: "Dam", status: "Active", sire_id: common.id, dam_id: damDam.id });

  await breeding("genetic_result", { dog_id: sire.id, provider: "Workflow Lab", test_name: "DNA panel", gene_or_condition: "PRA", result: "Carrier" });
  await breeding("genetic_result", { dog_id: dam.id, provider: "Workflow Lab", test_name: "DNA panel", gene_or_condition: "PRA", result: "Clear" });
  const heat = await breeding("heat_cycle", { dog_id: dam.id, heat_start: "2026-08-01", heat_end: "2026-08-20", notes: "Integration workflow" });
  await breeding("progesterone_test", { heat_cycle_id: heat.id, tested_at: "2026-08-08T14:00", result: 4.8, units: "ng/mL", laboratory: "Workflow Lab" });
  const litter = await create("litters", { name: `Workflow Litter ${suffix}`, dam_id: dam.id, sire_id: sire.id, breeding_date: "2026-08-09", due_date: "2026-10-11", status: "Planned" });
  const pairing = await breeding("breeding_record", { dam_id: dam.id, sire_id: sire.id, heat_cycle_id: heat.id, litter_id: litter.id, name: "Workflow Test Mating", status: "Planned", breeding_method: "Natural", coi_generations: 5 });
  assert.equal(pairing.coi.percentage, 12.5);
  assert.equal(pairing.coi.commonAncestors[0].dog.id, common.id);
  assert.equal(pairing.compatibility.find((item) => item.condition === "PRA").level, "clear");

  await breeding("breeding_attempt", { breeding_record_id: pairing.id, attempted_at: "2026-08-09T15:00", method: "Natural" });
  const pregnancy = await breeding("pregnancy", { breeding_record_id: pairing.id, litter_id: litter.id, status: "Confirmed", confirmation_method: "Ultrasound", confirmed_at: "2026-09-05T14:00", ultrasound_at: "2026-09-05T14:00", ultrasound_result: "Viable pregnancy", xray_at: "2026-09-30T14:00", xray_result: "Two puppies visible", estimated_puppy_count: 2 });
  const afterPregnancy = await api("/api/breeding");
  assert.ok(afterPregnancy.events.some((event) => event.automation_key === `breeding:${pairing.id}:ultrasound`));
  assert.ok(afterPregnancy.events.some((event) => event.automation_key === `pregnancy:${pregnancy.id}:xray`));

  const session = await breeding("start_whelping", { pregnancy_id: pregnancy.id, litter_id: litter.id, labor_started_at: "2026-10-10T09:00", notes: "Workflow delivery" });
  const puppyOne = await breeding("add_whelping_puppy", { whelping_session_id: session.id, name: "Workflow Blue", birth_at: "2026-10-10T09:25", birth_order: 1, sex: "Male", color: "Blue", birth_weight: 8.5, weight_unit: "oz", nursing_status: "Nursing", placenta_observed: true });
  const puppyTwo = await breeding("add_whelping_puppy", { whelping_session_id: session.id, name: "Workflow Gold", birth_at: "2026-10-10T10:02", birth_order: 2, sex: "Female", color: "Gold", birth_weight: 8.1, weight_unit: "oz", nursing_status: "Nursing", placenta_observed: true });
  await breeding("puppy_weight", { puppy_id: puppyOne.id, measured_at: "2026-10-11T10:00", weight: 8.8, unit: "oz", feeding_status: "Nursing" });
  const care = await breeding("puppy_care", { puppy_id: puppyOne.id, care_type: "Veterinary examination", title: "Newborn examination", occurred_at: "2026-10-11T13:00", status: "Completed", visible_to_family: true, notes: "Normal newborn examination" });
  await breeding("complete_whelping", { whelping_session_id: session.id, completed_at: "2026-10-10T11:00" });
  const afterWhelping = await api("/api/breeding");
  assert.equal(afterWhelping.puppies.filter((puppy) => Number(puppy.whelping_session_id) === Number(session.id)).length, 2);
  assert.equal(afterWhelping.puppy_weight_logs.filter((entry) => Number(entry.puppy_id) === Number(puppyOne.id)).length, 2);

  const buyer = await create("buyers", { first_name: "Workflow", last_name: "Family", email: `family-${suffix}@example.invalid`, application_status: "Approved", preferred_sex: "Male", preferred_color: "Blue" });
  const queue = await breeding("waitlist_entry", { buyer_id: buyer.id, litter_id: litter.id, joined_at: "2026-08-05", preferred_sex: "Male", preferred_color: "Blue", deposit_status: "Received", picking_position: 1, status: "Ready to Pick" });
  assert.equal(Number(queue.picking_position), 1);
  await breeding("assign_waitlist_puppy", { waitlist_entry_id: queue.id, puppy_id: puppyOne.id, note: "Family selected Workflow Blue" });
  const invite = await api(`/api/buyers/${buyer.id}/portal-invite`, { method: "POST" });
  const portalToken = new URL(invite.setupUrl).searchParams.get("token");
  assert.ok(portalToken);
  const portal = await api(`/api/portal/${encodeURIComponent(portalToken)}`);
  assert.equal(portal.puppies[0].id, puppyOne.id);
  assert.ok(portal.weights.some((entry) => entry.puppyId === puppyOne.id));
  assert.ok(portal.careRecords.some((entry) => entry.id === care.id && entry.notes === "Normal newborn examination"));
  assert.ok(!portal.puppies.some((puppy) => puppy.id === puppyTwo.id));

  process.stdout.write(JSON.stringify({ ok: true, coi: pairing.coi.percentage, commonAncestors: pairing.coi.commonAncestors.length, automatedEvents: afterPregnancy.events.filter((event) => event.system_generated).length, births: 2, portalAssignment: true, portalCare: true }));
} finally {
  if (kennelId) {
    const kennels = await service(`rest/v1/kennels?select=owner_auth_user_id&id=eq.${encodeURIComponent(kennelId)}&limit=1`);
    ownerUserId = String(kennels?.[0]?.owner_auth_user_id || "");
    await service(`rest/v1/kennels?id=eq.${encodeURIComponent(kennelId)}`, { method: "DELETE" });
  }
  if (ownerUserId) await service(`auth/v1/admin/users/${encodeURIComponent(ownerUserId)}`, { method: "DELETE" });
}
