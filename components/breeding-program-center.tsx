"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Baby,
  CalendarDays,
  CheckCircle2,
  Dna,
  HeartPulse,
  Plus,
  Scale,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  TestTube2,
  UsersRound,
} from "lucide-react";
import {
  dogCOI,
  findCommonAncestors,
  geneticCompatibility,
  pedigreeCompleteness,
  plannedMatingCOI,
  predictNextHeat,
  weightChangePercent,
} from "../lib/breeding-domain";
import styles from "./breeding-program-center.module.css";

type Dog = {
  id: number; name: string; registered_name?: string | null; sex: string; role: string; color?: string | null; status: string;
  breed?: string | null; markings?: string | null; coat_type?: string | null; breeder_name?: string | null; owner_name?: string | null;
  sire_id?: number | null; dam_id?: number | null; next_heat_date?: string | null;
};
type Litter = {
  id: number; name: string; dam_id: number | null; sire_id: number | null; breeding_date: string | null; due_date: string | null; birth_date: string | null;
  expected_count: number | null; status: string; pregnancy_status?: string | null; pregnancy_confirmed_date?: string | null; ultrasound_date?: string | null; xray_date?: string | null;
  whelping_started_at?: string | null; whelping_completed_at?: string | null;
};
type Puppy = { id: number; litter_id: number; buyer_id: number | null; name: string; sex?: string | null; color?: string | null; birth_date?: string | null; status: string };
type Buyer = { id: number; first_name: string; last_name: string; email: string; application_status: string; preferred_sex?: string | null; preferred_color?: string | null; preferred_coat_type?: string | null };
type Transaction = { id: number; buyer_id: number | null; type: string; status: string; description: string };
type BaseData = { dogs: Dog[]; litters: Litter[]; puppies: Puppy[]; buyers: Buyer[]; transactions: Transaction[] };
type RecordRow = Record<string, unknown> & { id: number };
type ExtraData = {
  heat_cycles: RecordRow[]; progesterone_tests: RecordRow[]; breeding_attempts: RecordRow[]; genetic_tests: RecordRow[];
  puppy_weight_logs: RecordRow[]; puppy_care_records: RecordRow[]; waitlist_entries: RecordRow[]; waitlist_history: RecordRow[];
};
export type BreedingProgramMode = "Pedigree" | "Reproduction" | "Whelping" | "Waitlist";

const emptyExtra: ExtraData = { heat_cycles: [], progesterone_tests: [], breeding_attempts: [], genetic_tests: [], puppy_weight_logs: [], puppy_care_records: [], waitlist_entries: [], waitlist_history: [] };
const date = (value: unknown) => value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${String(value).slice(0, 10)}T12:00:00`)) : "Not recorded";
const dateTimeLocal = () => {
  const now = new Date();
  const local = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
  return local.toISOString().slice(0, 16);
};
const nameOfBuyer = (buyer: Buyer) => [buyer.first_name, buyer.last_name].filter(Boolean).join(" ") || buyer.email;
const toObject = (form: HTMLFormElement): Record<string, unknown> => Object.fromEntries(new FormData(form).entries());
const percent = (value: number | null) => value == null ? "—" : `${(value * 100).toFixed(2)}%`;

function Metric({ label, value, note }: { label: string; value: string | number; note: string }) {
  return <article className={styles.metric}><span>{label}</span><b>{value}</b><small>{note}</small></article>;
}

function PedigreeBranch({ dogId, dogs, depth, maxDepth }: { dogId: number | null | undefined; dogs: Dog[]; depth: number; maxDepth: number }) {
  const dog = dogId ? dogs.find((candidate) => candidate.id === dogId) : null;
  return <div className={styles.pedigreeBranch}>
    <div className={`${styles.pedigreeNode} ${dog ? "" : styles.unknown}`}><small>{depth === 0 ? "DOG" : depth % 2 ? "PARENT" : "ANCESTOR"}</small><b>{dog?.registered_name || dog?.name || "Unknown"}</b>{dog && <span>{[dog.sex, dog.color].filter(Boolean).join(" · ")}</span>}</div>
    {depth < maxDepth && <div className={styles.pedigreeParents}><PedigreeBranch dogId={dog?.sire_id} dogs={dogs} depth={depth + 1} maxDepth={maxDepth}/><PedigreeBranch dogId={dog?.dam_id} dogs={dogs} depth={depth + 1} maxDepth={maxDepth}/></div>}
  </div>;
}

export function BreedingProgramCenter({ mode, data, onDataChanged }: { mode: BreedingProgramMode; data: BaseData; onDataChanged: () => Promise<void> }) {
  const [extra, setExtra] = useState<ExtraData>(emptyExtra);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/breeding-program", { cache: "no-store" });
      const payload = await response.json() as ExtraData & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to load breeding-program records.");
      setExtra({ ...emptyExtra, ...payload });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to load breeding-program records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(""), 2800); return () => window.clearTimeout(timer); }, [notice]);

  async function request(body: Record<string, unknown>, method = "POST", refreshBase = false) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/breeding-program", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to save breeding-program information.");
      await Promise.all([load(), refreshBase ? onDataChanged() : Promise.resolve()]);
      setNotice("Saved");
      return true;
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to save breeding-program information.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className={styles.loading}><span/>Loading breeding-program records…</div>;

  return <div className={styles.center}>
    {error && <div className={styles.error}><ShieldAlert size={18}/><span>{error}</span><button onClick={() => void load()}>Retry</button></div>}
    {notice && <div className={styles.notice}><CheckCircle2 size={16}/>{notice}</div>}
    {mode === "Pedigree" && <PedigreeModule data={data} extra={extra} busy={busy} request={request}/>} 
    {mode === "Reproduction" && <ReproductionModule data={data} extra={extra} busy={busy} request={request}/>} 
    {mode === "Whelping" && <WhelpingModule data={data} extra={extra} busy={busy} request={request}/>} 
    {mode === "Waitlist" && <WaitlistModule data={data} extra={extra} busy={busy} request={request}/>} 
  </div>;
}

type ModuleProps = { data: BaseData; extra: ExtraData; busy: boolean; request: (body: Record<string, unknown>, method?: string, refreshBase?: boolean) => Promise<boolean> };

function PedigreeModule({ data, extra, busy, request }: ModuleProps) {
  const [dogId, setDogId] = useState<number>(data.dogs[0]?.id ?? 0);
  const [generations, setGenerations] = useState<3 | 5>(3);
  const [sireId, setSireId] = useState<number>(data.dogs.find((dog) => /sire|male/i.test(`${dog.role} ${dog.sex}`))?.id ?? 0);
  const [damId, setDamId] = useState<number>(data.dogs.find((dog) => /dam|female/i.test(`${dog.role} ${dog.sex}`))?.id ?? 0);
  const selectedDog = data.dogs.find((dog) => dog.id === dogId) ?? null;
  const coi = selectedDog ? dogCOI(selectedDog.id, data.dogs) : null;
  const completeness = selectedDog ? pedigreeCompleteness(selectedDog.id, data.dogs, generations) : 0;
  const matingCoi = sireId && damId ? plannedMatingCOI(sireId, damId, data.dogs) : null;
  const common = sireId && damId ? findCommonAncestors(sireId, damId, data.dogs, 5) : [];
  const compatibility = sireId && damId ? geneticCompatibility(sireId, damId, extra.genetic_tests as never[]) : [];
  const tests = extra.genetic_tests.filter((item) => Number(item.dog_id) === dogId);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await request({ action: "update_dog_breeding_profile", dog_id: dogId, data: toObject(event.currentTarget) }, "POST", true);
  }
  async function addGenetic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await request({ action: "create", resource: "genetic_tests", data: { ...toObject(event.currentTarget), dog_id: dogId } })) event.currentTarget.reset();
  }

  return <div className={styles.moduleGrid}>
    <section className={styles.heroPanel}><div><span>PEDIGREE & GENETICS</span><h2>Know the lineage before you plan the litter.</h2><p>Pedigrees, Wright tabular COI, shared ancestors, and structured DNA results stay connected to the breeding-dog record.</p></div><label>Dog<select value={dogId} onChange={(event) => setDogId(Number(event.target.value))}>{data.dogs.map((dog) => <option key={dog.id} value={dog.id}>{dog.name}</option>)}</select></label></section>
    <div className={styles.metrics}><Metric label="COI" value={percent(coi)} note="From recorded ancestry"/><Metric label="Pedigree completeness" value={`${completeness}%`} note={`${generations}-generation view`}/><Metric label="Genetic results" value={tests.length} note="Structured tests on file"/><Metric label="Common ancestors" value={selectedDog?.sire_id && selectedDog.dam_id ? findCommonAncestors(selectedDog.sire_id, selectedDog.dam_id, data.dogs, generations).length : 0} note="Between recorded parents"/></div>
    <section className={`${styles.panel} ${styles.wide}`}><header><div><span>PEDIGREE</span><h3>{selectedDog?.registered_name || selectedDog?.name || "Choose a dog"}</h3></div><div className={styles.segment}><button className={generations === 3 ? styles.active : ""} onClick={() => setGenerations(3)}>3 gen</button><button className={generations === 5 ? styles.active : ""} onClick={() => setGenerations(5)}>5 gen</button></div></header>{selectedDog ? <div className={`${styles.pedigreeCanvas} ${generations === 5 ? styles.fiveGeneration : ""}`}><PedigreeBranch dogId={selectedDog.id} dogs={data.dogs} depth={0} maxDepth={generations}/></div> : <p className={styles.empty}>Add a dog to start a pedigree.</p>}</section>
    {selectedDog && <section className={styles.panel}><header><div><span>PARENT RECORD</span><h3>Lineage connections</h3></div></header><form className={styles.form} onSubmit={saveProfile} key={`profile-${selectedDog.id}`}><label>Breed<input name="breed" defaultValue={selectedDog.breed ?? ""}/></label><label>Coat type<input name="coat_type" defaultValue={selectedDog.coat_type ?? ""}/></label><label className={styles.span2}>Markings<input name="markings" defaultValue={selectedDog.markings ?? ""}/></label><label>Sire<select name="sire_id" defaultValue={selectedDog.sire_id ?? ""}><option value="">Unknown</option>{data.dogs.filter((dog) => dog.id !== selectedDog.id).map((dog) => <option key={dog.id} value={dog.id}>{dog.name}</option>)}</select></label><label>Dam<select name="dam_id" defaultValue={selectedDog.dam_id ?? ""}><option value="">Unknown</option>{data.dogs.filter((dog) => dog.id !== selectedDog.id).map((dog) => <option key={dog.id} value={dog.id}>{dog.name}</option>)}</select></label><label>Breeder<input name="breeder_name" defaultValue={selectedDog.breeder_name ?? ""}/></label><label>Owner<input name="owner_name" defaultValue={selectedDog.owner_name ?? ""}/></label><button className={styles.primary} disabled={busy}>Save lineage</button></form></section>}
    <section className={styles.panel}><header><div><span>DNA / GENETICS</span><h3>{selectedDog?.name || "Dog"} results</h3></div></header><div className={styles.recordList}>{tests.map((test) => <article key={test.id}><Dna size={17}/><span><b>{String(test.condition)}</b><small>{[test.gene, test.provider, date(test.result_date)].filter(Boolean).join(" · ")}</small></span><em className={String(test.result_status).toLowerCase() === "clear" ? styles.good : styles.warn}>{String(test.result_status)}</em></article>)}{!tests.length && <p className={styles.empty}>No structured genetic results yet.</p>}</div>{selectedDog && <form className={`${styles.form} ${styles.topRule}`} onSubmit={addGenetic}><label>Condition<input name="condition" required placeholder="Example: PRA"/></label><label>Gene<input name="gene" placeholder="Optional"/></label><label>Result<select name="result_status" defaultValue="Clear"><option>Clear</option><option>Carrier</option><option>Affected</option><option>At Risk</option><option>Indeterminate</option></select></label><label>Inheritance<select name="inheritance_mode" defaultValue="Autosomal Recessive"><option>Autosomal Recessive</option><option>Autosomal Dominant</option><option>X-Linked</option><option>Other / Unknown</option></select></label><label>Provider<input name="provider" placeholder="Embark, lab, etc."/></label><label>Result date<input name="result_date" type="date"/></label><button className={styles.primary} disabled={busy}><Plus size={15}/>Add genetic result</button></form>}</section>
    <section className={`${styles.panel} ${styles.wide}`}><header><div><span>TEST MATING</span><h3>Planned pairing review</h3></div><small className={styles.disclaimer}>Genetic flags are informational and are not veterinary advice.</small></header><div className={styles.matingGrid}><label>Sire<select value={sireId} onChange={(event) => setSireId(Number(event.target.value))}><option value="">Choose sire</option>{data.dogs.map((dog) => <option key={dog.id} value={dog.id}>{dog.name}</option>)}</select></label><span>×</span><label>Dam<select value={damId} onChange={(event) => setDamId(Number(event.target.value))}><option value="">Choose dam</option>{data.dogs.map((dog) => <option key={dog.id} value={dog.id}>{dog.name}</option>)}</select></label><div><small>Estimated offspring COI</small><b>{percent(matingCoi)}</b></div><div><small>Common ancestors</small><b>{common.length}</b></div><div><small>Genetic review flags</small><b>{compatibility.filter((item) => item.review).length}</b></div></div>{common.length > 0 && <div className={styles.chips}>{common.slice(0, 8).map((item) => <span key={item.dog.id}>{item.dog.name} · {item.firstDepth}/{item.secondDepth} gen</span>)}</div>}{compatibility.map((item) => <div className={item.review ? styles.compatWarn : styles.compatGood} key={item.condition}><Dna size={16}/><b>{item.condition}</b><span>Sire {item.sireStatus} · Dam {item.damStatus}</span><em>{item.review ? "Review pairing" : "No recessive pairing flag"}</em></div>)}</section>
  </div>;
}

function ReproductionModule({ data, extra, busy, request }: ModuleProps) {
  const dams = data.dogs.filter((dog) => /female|dam/i.test(`${dog.sex} ${dog.role}`));
  const [damId, setDamId] = useState(dams[0]?.id ?? data.dogs[0]?.id ?? 0);
  const relatedCycles = extra.heat_cycles.filter((item) => Number(item.dog_id) === damId).sort((a, b) => String(b.start_date).localeCompare(String(a.start_date)));
  const forecast = predictNextHeat(relatedCycles.map((item) => ({ start_date: String(item.start_date) })));
  const relatedTests = extra.progesterone_tests.filter((item) => Number(item.dog_id) === damId).sort((a, b) => String(a.tested_at).localeCompare(String(b.tested_at)));
  const relatedLitters = data.litters.filter((litter) => litter.dam_id === damId);
  const [litterId, setLitterId] = useState(relatedLitters[0]?.id ?? 0);
  const activeLitter = relatedLitters.find((litter) => litter.id === litterId) ?? relatedLitters[0] ?? null;
  const attempts = extra.breeding_attempts.filter((item) => Number(item.dam_id) === damId);

  async function create(resource: string, event: FormEvent<HTMLFormElement>, additions: Record<string, unknown>) {
    event.preventDefault();
    if (await request({ action: "create", resource, data: { ...toObject(event.currentTarget), ...additions } }, "POST", resource === "breeding_attempts")) event.currentTarget.reset();
  }

  return <div className={styles.moduleGrid}>
    <section className={styles.heroPanel}><div><span>REPRODUCTIVE MANAGEMENT</span><h2>From heat history to whelping window.</h2><p>Record real reproductive events once, then let the OS calculate estimates and generate the connected calendar work.</p></div><label>Dam<select value={damId} onChange={(event) => { setDamId(Number(event.target.value)); setLitterId(0); }}>{dams.map((dog) => <option key={dog.id} value={dog.id}>{dog.name}</option>)}</select></label></section>
    <div className={styles.metrics}><Metric label="Recorded heats" value={relatedCycles.length} note="History for selected dam"/><Metric label="Average interval" value={forecast ? `${forecast.averageDays} days` : "—"} note="Needs at least two cycles"/><Metric label="Estimated next heat" value={forecast ? date(forecast.estimatedDate) : "—"} note="Estimate from recorded history"/><Metric label="Breeding attempts" value={attempts.length} note="Recorded pairings"/></div>
    <section className={styles.panel}><header><div><span>HEAT HISTORY</span><h3>Cycles</h3></div></header><div className={styles.recordList}>{relatedCycles.map((cycle) => <article key={cycle.id}><HeartPulse size={17}/><span><b>{date(cycle.start_date)}</b><small>{cycle.end_date ? `Ended ${date(cycle.end_date)}` : "End date open"}{cycle.notes ? ` · ${String(cycle.notes)}` : ""}</small></span></article>)}{!relatedCycles.length && <p className={styles.empty}>No heat cycles recorded.</p>}</div><form className={`${styles.form} ${styles.topRule}`} onSubmit={(event) => void create("heat_cycles", event, { dog_id: damId })}><label>Heat start<input name="start_date" type="date" required/></label><label>Heat end<input name="end_date" type="date"/></label><label className={styles.span2}>Notes<input name="notes" placeholder="Signs, timing, observations"/></label><button className={styles.primary} disabled={busy}><Plus size={15}/>Record heat</button></form></section>
    <section className={styles.panel}><header><div><span>PROGESTERONE</span><h3>Test history</h3></div></header><div className={styles.recordList}>{relatedTests.map((test) => <article key={test.id}><TestTube2 size={17}/><span><b>{String(test.result)} {String(test.units || "ng/mL")}</b><small>{new Date(String(test.tested_at)).toLocaleString()} {test.laboratory ? `· ${String(test.laboratory)}` : ""}</small></span></article>)}{!relatedTests.length && <p className={styles.empty}>No progesterone results recorded.</p>}</div><form className={`${styles.form} ${styles.topRule}`} onSubmit={(event) => void create("progesterone_tests", event, { dog_id: damId, heat_cycle_id: relatedCycles[0]?.id ?? "" })}><label>Date / time<input name="tested_at" type="datetime-local" defaultValue={dateTimeLocal()} required/></label><label>Result<input name="result" type="number" min="0" step="0.001" required/></label><label>Units<select name="units" defaultValue="ng/mL"><option>ng/mL</option><option>nmol/L</option></select></label><label>Laboratory<input name="laboratory"/></label><button className={styles.primary} disabled={busy}><Plus size={15}/>Add result</button></form></section>
    <section className={`${styles.panel} ${styles.wide}`}><header><div><span>BREEDING ATTEMPTS</span><h3>Pairing record</h3></div></header><div className={styles.recordList}>{attempts.map((attempt) => <article key={attempt.id}><Sparkles size={17}/><span><b>{data.dogs.find((dog) => dog.id === Number(attempt.sire_id))?.name || "Sire"} × {data.dogs.find((dog) => dog.id === Number(attempt.dam_id))?.name || "Dam"}</b><small>{new Date(String(attempt.attempted_at)).toLocaleString()} · {String(attempt.method || "Natural")}</small></span><em>{String(attempt.status)}</em></article>)}{!attempts.length && <p className={styles.empty}>No breeding attempts recorded for this dam.</p>}</div><form className={`${styles.form} ${styles.topRule} ${styles.form4}`} onSubmit={(event) => void create("breeding_attempts", event, { dam_id: damId, heat_cycle_id: relatedCycles[0]?.id ?? "" })}><label>Litter / plan<select name="litter_id" defaultValue={activeLitter?.id ?? ""}><option value="">Not connected yet</option>{relatedLitters.map((litter) => <option key={litter.id} value={litter.id}>{litter.name}</option>)}</select></label><label>Sire<select name="sire_id" required defaultValue=""><option value="" disabled>Choose sire</option>{data.dogs.filter((dog) => dog.id !== damId).map((dog) => <option key={dog.id} value={dog.id}>{dog.name}</option>)}</select></label><label>Date / time<input name="attempted_at" type="datetime-local" defaultValue={dateTimeLocal()} required/></label><label>Method<select name="method"><option>Natural</option><option>AI - fresh</option><option>AI - chilled</option><option>AI - frozen</option><option>Other</option></select></label><button className={styles.primary} disabled={busy}><Plus size={15}/>Record breeding</button></form><p className={styles.info}><CalendarDays size={15}/>The first breeding date on a litter generates pregnancy and whelping milestones in the existing Breeding Calendar.</p></section>
    <section className={`${styles.panel} ${styles.wide}`}><header><div><span>PREGNANCY</span><h3>Milestones and estimated delivery</h3></div><label className={styles.inlineSelect}>Litter<select value={activeLitter?.id ?? ""} onChange={(event) => setLitterId(Number(event.target.value))}><option value="">Choose litter</option>{relatedLitters.map((litter) => <option key={litter.id} value={litter.id}>{litter.name}</option>)}</select></label></header>{activeLitter ? <form className={`${styles.form} ${styles.form4}`} key={`pregnancy-${activeLitter.id}`} onSubmit={(event) => { event.preventDefault(); void request({ action: "update_litter_pregnancy", litter_id: activeLitter.id, data: toObject(event.currentTarget) }, "POST", true); }}><label>Status<select name="pregnancy_status" defaultValue={activeLitter.pregnancy_status || "Unknown"}><option>Unknown</option><option>Pending</option><option>Confirmed</option><option>Not pregnant</option><option>Delivered</option></select></label><label>Breeding date<input name="breeding_date" type="date" defaultValue={activeLitter.breeding_date || ""}/></label><label>Confirmed<input name="pregnancy_confirmed_date" type="date" defaultValue={activeLitter.pregnancy_confirmed_date || ""}/></label><label>Expected puppies<input name="expected_count" type="number" min="0" defaultValue={activeLitter.expected_count ?? ""}/></label><label>Ultrasound<input name="ultrasound_date" type="date" defaultValue={activeLitter.ultrasound_date || ""}/></label><label>X-ray<input name="xray_date" type="date" defaultValue={activeLitter.xray_date || ""}/></label><label>Estimated due<input value={activeLitter.due_date || "Calculated after save"} readOnly/></label><button className={styles.primary} disabled={busy}>Save pregnancy</button></form> : <p className={styles.empty}>Create or select a litter plan for this dam to manage pregnancy milestones.</p>}</section>
  </div>;
}

function WhelpingModule({ data, extra, busy, request }: ModuleProps) {
  const candidates = data.litters.filter((litter) => !["Completed", "Archived"].includes(litter.status));
  const [litterId, setLitterId] = useState(candidates[0]?.id ?? data.litters[0]?.id ?? 0);
  const litter = data.litters.find((item) => item.id === litterId) ?? null;
  const puppies = data.puppies.filter((puppy) => puppy.litter_id === litterId);
  const [puppyId, setPuppyId] = useState<number>(puppies[0]?.id ?? 0);
  const [warningThreshold, setWarningThreshold] = useState(-5);
  const weights = extra.puppy_weight_logs.filter((item) => Number(item.puppy_id) === puppyId).sort((a, b) => String(a.measured_at).localeCompare(String(b.measured_at)));
  const latestWeight = weights.at(-1);
  const priorWeight = weights.at(-2);
  const latestChange = latestWeight && priorWeight ? weightChangePercent(Number(priorWeight.weight), Number(latestWeight.weight)) : null;
  const care = extra.puppy_care_records.filter((item) => Number(item.puppy_id) === puppyId);

  async function addPuppy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = toObject(form);
    fields.placenta_observed = new FormData(form).get("placenta_observed") === "on";
    if (await request({ action: "record_whelping_puppy", data: { ...fields, litter_id: litterId, puppy_number: puppies.length + 1 } }, "POST", true)) form.reset();
  }

  async function addRecord(resource: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!puppyId) return;
    if (await request({ action: "create", resource, data: { ...toObject(event.currentTarget), puppy_id: puppyId } }, "POST", resource === "puppy_weight_logs")) event.currentTarget.reset();
  }

  return <div className={styles.moduleGrid}>
    <section className={styles.heroPanel}><div><span>WHELPING MODE</span><h2>Built for the phone beside the whelping box.</h2><p>Start the delivery, timestamp each puppy, preserve birth details, then continue directly into weights and care records.</p></div><label>Litter<select value={litterId} onChange={(event) => { const next = Number(event.target.value); setLitterId(next); setPuppyId(data.puppies.find((puppy) => puppy.litter_id === next)?.id ?? 0); }}>{candidates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></section>
    <div className={styles.metrics}><Metric label="Delivery status" value={litter?.whelping_completed_at ? "Completed" : litter?.whelping_started_at ? "In progress" : "Not started"} note={litter?.whelping_started_at ? `Started ${new Date(litter.whelping_started_at).toLocaleString()}` : "Ready when labor begins"}/><Metric label="Puppies recorded" value={puppies.length} note={litter?.expected_count ? `${litter.expected_count} expected` : "Expected count not set"}/><Metric label="Latest weight change" value={latestChange == null ? "—" : `${latestChange.toFixed(1)}%`} note={latestChange != null && latestChange <= warningThreshold ? "Review this weight trend" : "From two latest entries"}/><Metric label="Care records" value={care.length} note="For selected puppy"/></div>
    <section className={`${styles.panel} ${styles.wide}`}><header><div><span>DELIVERY CONTROL</span><h3>{litter?.name || "Choose a litter"}</h3></div><div className={styles.actions}>{litter && !litter.whelping_started_at && <button className={styles.primary} disabled={busy} onClick={() => void request({ action: "start_whelping", litter_id: litter.id }, "POST", true)}><Baby size={16}/>Start whelping</button>}{litter?.whelping_started_at && !litter.whelping_completed_at && <button disabled={busy} onClick={() => void request({ action: "complete_whelping", litter_id: litter.id }, "POST", true)}>Complete delivery</button>}</div></header>{litter?.whelping_started_at ? <form className={`${styles.birthForm}`} onSubmit={addPuppy}><div className={styles.birthNumber}><small>NEXT PUPPY</small><b>#{puppies.length + 1}</b><span>Birth time defaults to now; correct it if needed.</span></div><label>Name<input name="name" placeholder={`Puppy ${puppies.length + 1}`}/></label><label>Birth date<input name="birth_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required/></label><label>Birth time<input name="birth_time" type="time" defaultValue={dateTimeLocal().slice(11, 16)} required/></label><label>Sex<select name="sex" defaultValue=""><option value="">Choose</option><option>Male</option><option>Female</option></select></label><label>Color<input name="color"/></label><label>Markings<input name="markings"/></label><label>Coat<input name="coat_type"/></label><label>Collar / ID color<input name="collar_color"/></label><label>Birth weight<input name="birth_weight" type="number" min="0.01" step="0.01"/></label><label>Unit<select name="birth_weight_unit" defaultValue="oz"><option>oz</option><option>lb</option><option>g</option><option>kg</option></select></label><label>Nursing<select name="nursing_status"><option>Observed nursing</option><option>Assisted</option><option>Not yet observed</option><option>Supplemental feeding</option></select></label><label className={styles.check}><input name="placenta_observed" type="checkbox"/>Placenta observed</label><label className={styles.full}>Notes<textarea name="notes" rows={2}/></label><button className={styles.birthButton} disabled={busy}><Plus size={18}/>ADD NEXT PUPPY</button></form> : <div className={styles.startPrompt}><Baby size={32}/><b>Ready for the first puppy?</b><p>Start Whelping to open the mobile birth-entry workflow.</p></div>}</section>
    <section className={styles.panel}><header><div><span>LITTER ROSTER</span><h3>{puppies.length} puppies</h3></div></header><div className={styles.recordList}>{puppies.map((puppy, index) => <button type="button" className={puppyId === puppy.id ? styles.selectedRow : ""} key={puppy.id} onClick={() => setPuppyId(puppy.id)}><span className={styles.numberBadge}>{index + 1}</span><span><b>{puppy.name}</b><small>{[puppy.sex, puppy.color, date(puppy.birth_date)].filter(Boolean).join(" · ")}</small></span><em>{puppy.status}</em></button>)}{!puppies.length && <p className={styles.empty}>Puppies entered during delivery appear here immediately.</p>}</div></section>
    <section className={styles.panel}><header><div><span>WEIGHT WATCH</span><h3>Daily growth</h3></div><label className={styles.threshold}>Warning at<input type="number" value={warningThreshold} onChange={(event) => setWarningThreshold(Number(event.target.value))}/><small>%</small></label></header>{puppyId ? <><div className={styles.weightChart}>{weights.slice(-10).map((weight, index) => { const previous = weights[Math.max(0, weights.indexOf(weight) - 1)]; const change = index && previous ? weightChangePercent(Number(previous.weight), Number(weight.weight)) : null; return <span key={weight.id} className={change != null && change <= warningThreshold ? styles.loss : ""}><i style={{ height: `${Math.max(16, Math.min(100, Number(weight.weight) * 7))}%` }}/><small>{Number(weight.weight).toFixed(1)} {String(weight.unit)}</small></span>; })}</div><form className={`${styles.form} ${styles.topRule}`} onSubmit={(event) => void addRecord("puppy_weight_logs", event)}><label>Weight<input name="weight" type="number" min="0.01" step="0.01" required/></label><label>Unit<select name="unit" defaultValue="oz"><option>oz</option><option>lb</option><option>g</option><option>kg</option></select></label><label>Measured<input name="measured_at" type="datetime-local" defaultValue={dateTimeLocal()}/></label><button className={styles.primary} disabled={busy}><Scale size={15}/>Record weight</button></form>{latestChange != null && latestChange <= warningThreshold && <p className={styles.warning}><ShieldAlert size={16}/>The latest recorded weight changed {latestChange.toFixed(1)}%. Review the entry and the puppy&apos;s condition. This is an informational alert, not a diagnosis.</p>}</> : <p className={styles.empty}>Select a puppy from the litter roster to track weights.</p>}</section>
    <section className={`${styles.panel} ${styles.wide}`}><header><div><span>PUPPY CARE</span><h3>Deworming, vaccines, medication & veterinary care</h3></div></header>{puppyId ? <><div className={styles.recordList}>{care.map((item) => <article key={item.id}><Stethoscope size={17}/><span><b>{String(item.title)}</b><small>{[item.care_type, date(item.care_date), item.product, item.lot_number ? `Lot ${String(item.lot_number)}` : ""].filter(Boolean).join(" · ")}</small></span><em>{item.visible_in_portal === false ? "Private" : "Portal"}</em></article>)}{!care.length && <p className={styles.empty}>No care records for this puppy yet.</p>}</div><form className={`${styles.form} ${styles.form4} ${styles.topRule}`} onSubmit={(event) => void addRecord("puppy_care_records", event)}><label>Care type<select name="care_type"><option>Deworming</option><option>Vaccination</option><option>Medication</option><option>Veterinary exam</option><option>Supplement</option><option>Other</option></select></label><label>Title<input name="title" required placeholder="Example: First deworming"/></label><label>Date<input name="care_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required/></label><label>Next due<input name="next_due_date" type="date"/></label><label>Product<input name="product"/></label><label>Lot number<input name="lot_number"/></label><label>Provider<input name="provider"/></label><label className={styles.check}><input name="visible_in_portal" type="checkbox" defaultChecked/>Show in Puppy Portal</label><button className={styles.primary} disabled={busy}><HeartPulse size={15}/>Add care record</button></form></> : <p className={styles.empty}>Select a puppy to manage care.</p>}</section>
  </div>;
}

function WaitlistModule({ data, extra, busy, request }: ModuleProps) {
  const entries = [...extra.waitlist_entries].sort((a, b) => (Number(a.picking_position) || 9999) - (Number(b.picking_position) || 9999));
  const activeBuyerIds = new Set(entries.filter((entry) => !["Completed", "Removed"].includes(String(entry.status))).map((entry) => Number(entry.buyer_id)));
  const candidates = data.buyers.filter((buyer) => !activeBuyerIds.has(buyer.id) && !["Declined", "Archived"].includes(buyer.application_status));
  const availablePuppies = data.puppies.filter((puppy) => !puppy.buyer_id && !["Placed", "Retained", "Archived"].includes(puppy.status));
  const deposits = new Set(data.transactions.filter((transaction) => /deposit/i.test(`${transaction.type} ${transaction.description}`) && /paid|complete/i.test(transaction.status)).map((transaction) => transaction.buyer_id));

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = toObject(form);
    const buyer = data.buyers.find((candidate) => candidate.id === Number(fields.buyer_id));
    if (!buyer) return;
    if (await request({ action: "create", resource: "waitlist_entries", data: { ...fields, preferred_sex: fields.preferred_sex || buyer.preferred_sex || "", preferred_color: fields.preferred_color || buyer.preferred_color || "", preferred_coat_type: fields.preferred_coat_type || buyer.preferred_coat_type || "", deposit_status: deposits.has(buyer.id) ? "Received" : "Not received" } })) form.reset();
  }

  async function update(entry: RecordRow, dataPatch: Record<string, unknown>) {
    await request({ resource: "waitlist_entries", id: entry.id, data: { ...entry, ...dataPatch } }, "PUT");
  }

  return <div className={styles.moduleGrid}>
    <section className={styles.heroPanel}><div><span>WAITLIST & PUPPY PICKING</span><h2>Turn the waitlist into an actual placement workflow.</h2><p>Picking position, family preferences, deposits, passes, litter moves, and puppy assignment now stay on an auditable queue.</p></div><div className={styles.heroCount}><b>{entries.filter((entry) => !["Completed", "Removed"].includes(String(entry.status))).length}</b><small>active families</small></div></section>
    <div className={styles.metrics}><Metric label="Waiting" value={entries.filter((entry) => ["Waiting", "Ready to Pick"].includes(String(entry.status))).length} note="Active picking queue"/><Metric label="Ready to pick" value={entries.filter((entry) => String(entry.status) === "Ready to Pick").length} note="Current selection stage"/><Metric label="Available puppies" value={availablePuppies.length} note="Not currently assigned"/><Metric label="Assignments" value={entries.filter((entry) => String(entry.status) === "Puppy Assigned").length} note="Connected to Puppy Portal"/></div>
    <section className={`${styles.panel} ${styles.wide}`}><header><div><span>PICKING ORDER</span><h3>Family queue</h3></div></header>{entries.length ? <div className={styles.waitlistTable}><div className={styles.waitlistHead}><span>Pick</span><span>Family</span><span>Preferences</span><span>Deposit</span><span>Status</span><span>Puppy</span><span>Actions</span></div>{entries.map((entry, index) => { const buyer = data.buyers.find((candidate) => candidate.id === Number(entry.buyer_id)); const puppy = data.puppies.find((candidate) => candidate.id === Number(entry.assigned_puppy_id)); return <article key={entry.id}><strong>{entry.picking_position ? `#${String(entry.picking_position)}` : "—"}</strong><span><b>{buyer ? nameOfBuyer(buyer) : `Family #${String(entry.buyer_id)}`}</b><small>{entry.litter_id ? data.litters.find((litter) => litter.id === Number(entry.litter_id))?.name || "Selected litter" : "Any litter"}</small></span><span><b>{[entry.preferred_sex, entry.preferred_color, entry.preferred_coat_type].filter(Boolean).join(" · ") || "Open"}</b><small>{String(entry.other_preferences || "")}</small></span><em className={String(entry.deposit_status).toLowerCase().includes("received") ? styles.good : styles.warn}>{String(entry.deposit_status)}</em><em>{String(entry.status)}</em><span>{puppy ? <b>{puppy.name}</b> : <select aria-label={`Assign puppy to ${buyer ? nameOfBuyer(buyer) : "family"}`} defaultValue="" onChange={(event) => { const puppyId = Number(event.target.value); if (puppyId) void request({ action: "assign_waitlist_puppy", entry_id: entry.id, puppy_id: puppyId }, "POST", true); }}><option value="">Assign puppy…</option>{availablePuppies.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.sex || ""} {item.color || ""}</option>)}</select>}</span><div className={styles.rowActions}><button disabled={busy || index === 0} title="Move up" onClick={() => void request({ action: "move_waitlist", entry_id: entry.id, direction: -1 })}><ArrowUp size={14}/></button><button disabled={busy || index === entries.length - 1} title="Move down" onClick={() => void request({ action: "move_waitlist", entry_id: entry.id, direction: 1 })}><ArrowDown size={14}/></button><button disabled={busy} onClick={() => void update(entry, { status: "Passed", history_note: "Family passed on current selection." })}>Pass</button><button disabled={busy} onClick={() => void update(entry, { status: "Next Litter", history_note: "Family moved to the next litter." })}>Next litter</button></div></article>; })}</div> : <p className={styles.empty}>No operational waitlist entries yet. Approved families can be added below.</p>}</section>
    <section className={styles.panel}><header><div><span>ADD FAMILY</span><h3>Join picking queue</h3></div></header><form className={styles.form} onSubmit={add}><label className={styles.span2}>Family<select name="buyer_id" required defaultValue=""><option value="" disabled>Choose approved family</option>{candidates.map((buyer) => <option key={buyer.id} value={buyer.id}>{nameOfBuyer(buyer)} · {buyer.application_status}</option>)}</select></label><label>Litter<select name="litter_id" defaultValue=""><option value="">Any / future litter</option>{data.litters.map((litter) => <option key={litter.id} value={litter.id}>{litter.name}</option>)}</select></label><label>Status<select name="status" defaultValue="Waiting"><option>Waiting</option><option>Ready to Pick</option><option>On Hold</option></select></label><label>Sex preference<input name="preferred_sex"/></label><label>Color preference<input name="preferred_color"/></label><label>Coat preference<input name="preferred_coat_type"/></label><label>Priority<input name="priority_rank" type="number" defaultValue="0"/></label><label className={styles.span2}>Other preferences<input name="other_preferences"/></label><button className={styles.primary} disabled={busy || !candidates.length}><UsersRound size={15}/>Add to waitlist</button></form></section>
    <section className={styles.panel}><header><div><span>AUDIT HISTORY</span><h3>Recent queue changes</h3></div></header><div className={styles.recordList}>{extra.waitlist_history.slice(0, 12).map((item) => <article key={item.id}><UsersRound size={16}/><span><b>{String(item.action)}</b><small>{date(item.created_at)} · {item.from_position ? `#${String(item.from_position)}` : "—"} → {item.to_position ? `#${String(item.to_position)}` : "—"}</small></span></article>)}{!extra.waitlist_history.length && <p className={styles.empty}>Queue changes will be recorded here.</p>}</div></section>
  </div>;
}
