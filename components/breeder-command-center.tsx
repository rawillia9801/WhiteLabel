"use client";

import {
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  HeartPulse,
  ListTree,
  PawPrint,
  Plus,
  ReceiptText,
  ShieldCheck,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { puppyWeightTrend } from "../lib/breeding-calculations";
import { useBreedingData } from "./use-breeding-data";

type DashboardView = "Applications" | "Breedings" | "Calendar" | "Care" | "Comms" | "Delivery" | "Families" | "Finance" | "Inventory" | "Litters" | "Placement" | "Puppies" | "Templates" | "Vault" | "Whelping";
type DashboardResource = "events" | "litters" | "transactions";
type RecordBase = { id: number; status?: string | null };
type DashboardData = {
  dogs: Array<RecordBase & { name: string }>;
  litters: Array<RecordBase & { name: string; dam_id: number | null; sire_id: number | null; breeding_date: string | null; due_date: string | null; birth_date: string | null; expected_count: number | null }>;
  puppies: Array<RecordBase & { litter_id: number; buyer_id: number | null; name: string }>;
  buyers: Array<RecordBase & { first_name: string; last_name: string; email: string; application_status: string }>;
  transactions: Array<RecordBase & { type: string; amount_cents: number; description: string; due_date: string | null; paid_date: string | null; buyer_id: number | null }>;
  events: Array<RecordBase & { title: string; event_type: string; event_date: string; event_time: string | null }>;
  updates: Array<{ published: number | boolean }>;
  dog_medical_records: Array<{ dog_id: number; title: string; record_type: string; next_due_date: string | null }>;
  dog_documents: unknown[];
  buyer_documents: Array<{ buyer_id: number; document_type: string }>;
};

type AttentionItem = { area: string; title: string; detail: string; view: DashboardView; urgency: "urgent" | "next" | "review" };

const isoToday = () => new Date().toISOString().slice(0, 10);
const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};
const isPaid = (status: string | null | undefined) => /paid|complete|completed|cleared/i.test(status || "");
const isOpen = (status: string | null | undefined) => !/complete|completed|cancel|cancelled|archived|closed|sold|placed|deceased/i.test(status || "");
const isPendingApplication = (status: string | null | undefined) => !/approved|matched|placed|declined|not moving forward/i.test(status || "");
const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value / 100);
const shortDate = (value: string | null | undefined) => value
  ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(`${value.slice(0, 10)}T12:00:00`))
  : "Not scheduled";
const fullName = (buyer: DashboardData["buyers"][number]) => [buyer.first_name, buyer.last_name].filter(Boolean).join(" ") || buyer.email;

export function BreederCommandCenter({
  data,
  kennelName,
  onCreate,
  onNavigate,
}: {
  data: DashboardData;
  kennelName: string;
  onCreate: (resource: DashboardResource, preset?: Record<string, unknown>) => void;
  onNavigate: (view: DashboardView) => void;
}) {
  const { data: breedingData, loading: breedingLoading } = useBreedingData();
  const today = isoToday();
  const currentDate = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());
  const dogName = (dogId: number | null) => data.dogs.find((dog) => dog.id === dogId)?.name ?? "Pairing not complete";
  const breedingDogName = (dogId: unknown) => {
    const dog = breedingData.dogs.find((item) => Number(item.id) === Number(dogId));
    return String(dog?.call_name || dog?.name || dog?.registered_name || "Dog not selected");
  };

  const activeLitters = data.litters.filter((item) => isOpen(item.status));
  const activePuppies = data.puppies.filter((item) => isOpen(item.status));
  const unmatched = activePuppies.filter((item) => !item.buyer_id);
  const pendingApplications = data.buyers.filter((item) => isPendingApplication(item.application_status));
  const approvedBuyers = data.buyers.filter((item) => /approved|matched|placed|waitlist/i.test(item.application_status || ""));
  const upcoming = data.events
    .filter((item) => item.event_date >= today && isOpen(item.status))
    .sort((left, right) => `${left.event_date}${left.event_time || ""}`.localeCompare(`${right.event_date}${right.event_time || ""}`));
  const overdue = data.transactions.filter((item) => item.type !== "Cost" && !isPaid(item.status) && (item.status === "Overdue" || Boolean(item.due_date && item.due_date < today)));
  const outstanding = data.transactions.filter((item) => item.type !== "Cost" && !isPaid(item.status)).reduce((sum, item) => sum + item.amount_cents, 0);
  const dueHealth = data.dog_medical_records.filter((item) => Boolean(item.next_due_date && item.next_due_date <= addDays(14)));
  const paidTotal = data.transactions.filter((item) => item.type !== "Cost" && isPaid(item.status)).reduce((sum, item) => sum + item.amount_cents, 0);
  const programCosts = data.transactions.filter((item) => item.type === "Cost").reduce((sum, item) => sum + item.amount_cents, 0);
  const monthPrefix = today.slice(0, 7);
  const receivedThisMonth = data.transactions.filter((item) => item.type !== "Cost" && isPaid(item.status) && String(item.paid_date || "").startsWith(monthPrefix)).reduce((sum, item) => sum + item.amount_cents, 0);
  const activePregnancies = breedingData.pregnancies.filter((item) => !/completed|lost|not pregnant/i.test(String(item.status || "")));
  const paidBuyers = new Set(data.transactions.filter((item) => item.type !== "Cost" && isPaid(item.status) && item.buyer_id).map((item) => item.buyer_id));
  const contractedBuyers = new Set(data.buyer_documents.filter((item) => /bill of sale|health guarantee|agreement/i.test(item.document_type)).map((item) => item.buyer_id));
  const deliveryEvents = data.events.filter((item) => /pickup|delivery|transport/i.test(`${item.event_type} ${item.title}`) && isOpen(item.status));

  const weightAlerts = breedingData.puppies.flatMap((puppy) => {
    const birthWeight = Number(puppy.birth_weight);
    if (!Number.isFinite(birthWeight) || birthWeight <= 0) return [];
    const entries = breedingData.puppy_weight_logs
      .filter((entry) => Number(entry.puppy_id) === Number(puppy.id))
      .map((entry) => ({ measuredAt: String(entry.measured_at || ""), weight: Number(entry.weight), unit: String(entry.unit || puppy.weight_unit || "oz") }));
    const trend = puppyWeightTrend({ birthWeight, birthUnit: String(puppy.weight_unit || "oz"), entries });
    return trend.warnings.length ? [{ puppy, warning: trend.warnings[0] }] : [];
  });

  const reproductiveAttention: AttentionItem[] = upcoming
    .filter((item) => item.event_type !== "Setup Request" && item.event_date <= addDays(7) && /heat|progesterone|breeding|ultrasound|x-ray|whelp|due date|pregnan/i.test(`${item.event_type} ${item.title}`))
    .map((item) => ({ area: "BREEDING", title: item.title, detail: `${shortDate(item.event_date)}${item.event_time ? ` · ${item.event_time}` : ""}`, view: "Calendar", urgency: item.event_date <= today ? "urgent" : "next" }));
  const attention: AttentionItem[] = [
    ...overdue.map((item): AttentionItem => ({ area: "PAYMENT", title: item.description, detail: `${money(item.amount_cents)} overdue`, view: "Finance", urgency: "urgent" })),
    ...weightAlerts.map((item): AttentionItem => ({ area: "WEIGHT", title: `${String(item.puppy.name || `Puppy #${item.puppy.id}`)} needs review`, detail: item.warning, view: "Whelping", urgency: "urgent" })),
    ...dueHealth.map((item): AttentionItem => ({ area: "CARE", title: item.title, detail: `${item.record_type} due for ${dogName(item.dog_id)}`, view: "Care", urgency: "urgent" })),
    ...reproductiveAttention,
    ...unmatched.map((item): AttentionItem => ({ area: "PICKING", title: `${item.name} needs a family`, detail: "Available puppy is not matched to an approved buyer", view: "Placement", urgency: "next" })),
    ...pendingApplications.map((item): AttentionItem => ({ area: "APPLICATION", title: `${fullName(item)} needs review`, detail: "A screening decision has not been recorded", view: "Applications", urgency: "review" })),
  ].slice(0, 8);

  const metrics: Array<{ label: string; value: string; detail: string; view: DashboardView; icon: LucideIcon; tone?: string }> = [
    { label: "Active litters", value: String(activeLitters.length), detail: activePregnancies.length ? `${activePregnancies.length} active pregnancy record${activePregnancies.length === 1 ? "" : "s"}` : "No active pregnancies", view: "Litters", icon: ListTree },
    { label: "Puppies", value: String(activePuppies.length), detail: unmatched.length ? `${unmatched.length} awaiting placement` : "All active puppies matched", view: "Puppies", icon: PawPrint },
    { label: "Applications", value: String(pendingApplications.length), detail: pendingApplications.length ? "Waiting for your decision" : "Inbox is clear", view: "Applications", icon: ClipboardCheck, tone: pendingApplications.length ? "attention" : "" },
    { label: "Next 30 days", value: String(upcoming.filter((item) => item.event_date <= addDays(30)).length), detail: upcoming[0] ? `${upcoming[0].title} · ${shortDate(upcoming[0].event_date)}` : "No events scheduled", view: "Calendar", icon: CalendarDays },
    { label: "Payments due", value: money(outstanding), detail: `${money(receivedThisMonth)} received this month`, view: "Finance", icon: WalletCards, tone: overdue.length ? "attention" : "" },
  ];
  const lifecycle: Array<{ label: string; count: number; view: DashboardView; note: string }> = [
    { label: "Applications", count: pendingApplications.length, view: "Applications", note: "to review" },
    { label: "Approved", count: approvedBuyers.length, view: "Families", note: "ready to match" },
    { label: "Matched", count: data.puppies.filter((item) => item.buyer_id).length, view: "Placement", note: "puppies assigned" },
    { label: "Paid", count: paidBuyers.size, view: "Finance", note: "accounts credited" },
    { label: "Contracted", count: contractedBuyers.size, view: "Templates", note: "documents ready" },
    { label: "Go-home", count: deliveryEvents.length, view: "Delivery", note: "handoffs booked" },
  ];

  return <div className="bos-today">
    <header className="dashboard-command-header">
      <div><span>KENNEL DAY</span><h1>Today at a glance</h1><p>{currentDate} · {kennelName || "Your kennel"}</p></div>
      <div className="dashboard-quick-actions"><button onClick={() => onCreate("events", { event_type: "Task", status: "Scheduled" })}><CalendarDays size={16} /> Schedule</button><button onClick={() => onCreate("transactions", { type: "Payment" })}><ReceiptText size={16} /> Payment</button><button className="primary-action" onClick={() => onCreate("litters")}><Plus size={16} /> Quick add</button></div>
    </header>

    <section className="dashboard-metrics" aria-label="Kennel summary metrics">
      {metrics.map((metric) => { const Icon = metric.icon; return <button key={metric.label} className={metric.tone || ""} onClick={() => onNavigate(metric.view)}><span className="dashboard-metric-icon"><Icon size={17} /></span><span><small>{metric.label}</small><b>{metric.value}</b><em>{metric.detail}</em></span><ChevronRight size={15} /></button>; })}
    </section>

    <div className="dashboard-primary-grid">
      <section className="dashboard-section dashboard-attention">
        <header><div><span>NEEDS ATTENTION</span><h2>What should move next</h2></div><strong className={attention.length ? "has-work" : ""}>{attention.length}</strong></header>
        {attention.length ? <div className="dashboard-attention-list">{attention.map((item, index) => <button key={`${item.area}-${item.title}-${index}`} onClick={() => onNavigate(item.view)}><em className={item.urgency}>{item.area}</em><span><b>{item.title}</b><small>{item.detail}</small></span><ChevronRight size={16} /></button>)}</div> : <div className="dashboard-clear-state"><ShieldCheck size={22} /><span><b>You are caught up.</b><small>No overdue payments, urgent care, placement, or application work is waiting.</small></span></div>}
      </section>

      <section className="dashboard-section dashboard-upcoming">
        <header><div><span>UPCOMING</span><h2>Breeding calendar</h2></div><button onClick={() => onNavigate("Calendar")}>Open calendar</button></header>
        {upcoming.length ? <div className="dashboard-event-list">{upcoming.slice(0, 6).map((event) => <button key={event.id} onClick={() => onNavigate(/pickup|delivery|transport/i.test(`${event.event_type} ${event.title}`) ? "Delivery" : "Calendar")}><time><b>{new Date(`${event.event_date}T12:00:00`).getDate()}</b><small>{new Date(`${event.event_date}T12:00:00`).toLocaleString("en-US", { month: "short" })}</small></time><span><b>{event.title}</b><small>{[event.event_time, event.event_type].filter(Boolean).join(" · ")}</small></span><em>{event.status}</em></button>)}</div> : <div className="dashboard-compact-empty"><CalendarDays size={21} /><span><b>Nothing scheduled yet</b><small>Add breeding, care, family, or go-home work.</small></span><button onClick={() => onCreate("events")}>Add event</button></div>}
      </section>
    </div>

    <section className="dashboard-section dashboard-program">
      <header><div><span>ACTIVE PROGRAM</span><h2>Litters and pregnancies in motion</h2></div><button onClick={() => onNavigate("Breedings")}>Breeding workspace <ChevronRight size={15} /></button></header>
      {activeLitters.length ? <div className="dashboard-program-list">{activeLitters.slice(0, 5).map((litter) => {
        const puppies = data.puppies.filter((puppy) => puppy.litter_id === litter.id);
        const assigned = puppies.filter((puppy) => puppy.buyer_id).length;
        const total = puppies.length || litter.expected_count || 0;
        const phase = litter.birth_date ? "Raising" : litter.breeding_date ? "Expecting" : "Planning";
        const progress = total ? Math.round((assigned / total) * 100) : 0;
        return <button key={litter.id} onClick={() => onNavigate("Litters")}><span className="program-phase">{phase}</span><span className="program-name"><b>{litter.name}</b><small>{dogName(litter.dam_id)} × {dogName(litter.sire_id)}</small></span><span><small>{litter.birth_date ? "Whelped" : "Estimated due"}</small><b>{shortDate(litter.birth_date || litter.due_date)}</b></span><span><small>Puppies</small><b>{total}</b></span><span className="program-placement"><small>{assigned} matched</small><i><span style={{ width: `${progress}%` }} /></i></span><ChevronRight size={16} /></button>;
      })}</div> : activePregnancies.length ? <div className="dashboard-pregnancy-list">{activePregnancies.slice(0, 4).map((pregnancy) => <button key={String(pregnancy.id)} onClick={() => onNavigate("Breedings")}><HeartPulse size={19} /><span><b>{breedingDogName(pregnancy.dam_id)} × {breedingDogName(pregnancy.sire_id)}</b><small>{String(pregnancy.status || "Pregnancy record")} · Due {shortDate(String(pregnancy.estimated_due_start || pregnancy.estimated_due_end || ""))}</small></span><ChevronRight size={16} /></button>)}</div> : <div className="dashboard-compact-empty"><ListTree size={21} /><span><b>No active litter or pregnancy</b><small>Start with a pairing or create a litter when the program is ready.</small></span><button onClick={() => onCreate("litters")}>Add litter</button></div>}
      {breedingLoading && <small className="dashboard-sync-note">Checking reproductive records…</small>}
    </section>

    <section className="dashboard-section dashboard-family-journey">
      <header><div><span>FAMILY JOURNEY</span><h2>Application to go-home</h2></div><button onClick={() => onNavigate("Placement")}>Manage picking order</button></header>
      <div>{lifecycle.map((stage, index) => <button key={stage.label} onClick={() => onNavigate(stage.view)}><i>{index + 1}</i><span><b>{stage.label}</b><small>{stage.note}</small></span><strong>{stage.count}</strong></button>)}</div>
    </section>

    <footer className="dashboard-business-summary">
      <button onClick={() => onNavigate("Finance")}><span>Sales received</span><b>{money(paidTotal)}</b><small>{money(outstanding)} outstanding</small></button>
      <button onClick={() => onNavigate("Inventory")}><span>Program costs</span><b>{money(programCosts)}</b><small>{money(paidTotal - programCosts)} recorded net</small></button>
      <button onClick={() => onNavigate("Comms")}><span>Family updates</span><b>{data.updates.filter((item) => !item.published).length}</b><small>{data.updates.filter((item) => item.published).length} published</small></button>
      <button onClick={() => onNavigate("Vault")}><span>Documents</span><b>{data.dog_documents.length + data.buyer_documents.length}</b><small>{contractedBuyers.size} family files prepared</small></button>
    </footer>
  </div>;
}
