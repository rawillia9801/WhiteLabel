"use client";

import Link from "next/link";
import { type CSSProperties, useMemo, useState } from "react";
import {
  Baby, CalendarDays, ChartNoAxesCombined, ChevronRight, ClipboardCheck, Dog, FileText, FlaskConical,
  FolderOpen, Globe2, Headphones, HeartPulse, LayoutDashboard, ListOrdered, ListTree, Mail, Menu,
  MessageSquareText, MonitorSmartphone, PackageSearch, Palette, PawPrint, Plus, ReceiptText, Route,
  Search, ShieldCheck, Sparkles, UserRound, UsersRound, WalletCards, X, type LucideIcon,
} from "lucide-react";
import type { DemoKennel } from "./demo-data";
import "./real-demo.css";

type View = "Command" | "Calendar" | "Breeding" | "Breedings" | "Litters" | "Whelping" | "Puppies" | "Care" | "Applications" | "Families" | "Waitlist" | "Placement" | "Delivery" | "Finance" | "Inventory" | "Comms" | "Templates" | "Reports" | "Portal" | "CRM" | "Vault";
type Group = "Kennel day" | "Breeding" | "Puppy families" | "Business" | "Operations";
type NavItem = { id: View; label: string; icon: LucideIcon; group: Group };

const nav: NavItem[] = [
  { id: "Command", label: "Daily overview", icon: LayoutDashboard, group: "Kennel day" },
  { id: "Calendar", label: "Kennel calendar", icon: CalendarDays, group: "Kennel day" },
  { id: "Breeding", label: "Dogs", icon: Dog, group: "Breeding" },
  { id: "Breedings", label: "Breedings", icon: FlaskConical, group: "Breeding" },
  { id: "Litters", label: "Litters", icon: ListTree, group: "Breeding" },
  { id: "Whelping", label: "Whelping", icon: Baby, group: "Breeding" },
  { id: "Puppies", label: "Puppies", icon: PawPrint, group: "Breeding" },
  { id: "Care", label: "Health records", icon: HeartPulse, group: "Breeding" },
  { id: "Applications", label: "Puppy applications", icon: ClipboardCheck, group: "Puppy families" },
  { id: "Families", label: "Families & waitlist", icon: UsersRound, group: "Puppy families" },
  { id: "Waitlist", label: "Waitlist", icon: ListOrdered, group: "Puppy families" },
  { id: "Placement", label: "Puppy matching", icon: UserRound, group: "Puppy families" },
  { id: "Delivery", label: "Go-home planning", icon: Route, group: "Puppy families" },
  { id: "Finance", label: "Sales & payments", icon: WalletCards, group: "Business" },
  { id: "Inventory", label: "Kennel expenses", icon: PackageSearch, group: "Business" },
  { id: "Reports", label: "Reports", icon: ChartNoAxesCombined, group: "Business" },
  { id: "Comms", label: "Family messages", icon: Mail, group: "Operations" },
  { id: "Templates", label: "Templates & automation", icon: MessageSquareText, group: "Operations" },
  { id: "Portal", label: "Family portal", icon: MonitorSmartphone, group: "Operations" },
  { id: "CRM", label: "Phone center", icon: Headphones, group: "Operations" },
  { id: "Vault", label: "Documents", icon: FolderOpen, group: "Operations" },
];

const groups: Group[] = ["Kennel day", "Breeding", "Puppy families", "Business", "Operations"];
const groupIcons: Record<Group, LucideIcon> = { "Kennel day": LayoutDashboard, Breeding: Dog, "Puppy families": PawPrint, Business: WalletCards, Operations: FolderOpen };

const copy: Record<View, { title: string; text: string }> = {
  Command: { title: "Today at a glance", text: "The same command-center layout breeders use in the live MyDogPortal OS." },
  Calendar: { title: "Schedule", text: "Breeding, whelping, care, family calls, pickup, delivery, and follow-up work." },
  Breeding: { title: "Dogs", text: "Breeding dogs, identity, registrations, health records, pedigree, and status." },
  Breedings: { title: "Breedings & test mating", text: "Heat cycles, progesterone, planned pairings, pedigree context, pregnancy milestones, and due dates." },
  Litters: { title: "Litters", text: "Every litter from pairing through whelping, puppy roster, and placement." },
  Whelping: { title: "Whelping Mode", text: "A focused birth workflow for newborn identity, birth weights, nursing, placenta, and daily care." },
  Puppies: { title: "Puppies", text: "Identity, growth, care, availability, pricing, and family assignment on one record." },
  Care: { title: "Health & care", text: "Medical schedules, puppy milestones, recurring care, and kennel work." },
  Applications: { title: "Applications", text: "Screen families, record preferences, approve homes, and build the waitlist." },
  Families: { title: "Buyers & waitlist", text: "Contact, preferences, assigned puppies, payments, documents, and portal access." },
  Waitlist: { title: "Waitlist & picking order", text: "Approved families, deposit state, queue history, passes, and puppy selection." },
  Placement: { title: "Puppy placement", text: "Match approved families to puppies and carry placement into payment and contract work." },
  Delivery: { title: "Pickup & delivery", text: "Final balances, signed documents, handoff schedules, and go-home readiness." },
  Finance: { title: "Payments & sales", text: "Deposits, payments, balances, payment plans, receipts, and sale revenue." },
  Inventory: { title: "Costs & expenses", text: "Veterinary, breeding, supply, travel, and kennel costs against recorded sales." },
  Comms: { title: "Family communications", text: "Updates, calls, messages, requests, and communication history." },
  Templates: { title: "Automations & templates", text: "Business language, document templates, automatic emails, and puppy milestones." },
  Reports: { title: "Reports and intelligence", text: "Program performance, profitability, placement progress, and operating snapshots." },
  Portal: { title: "Puppy Portal simulator", text: "The breeder view of exactly what each family sees in its private portal." },
  CRM: { title: "Caller CRM", text: "Caller identity, family account context, assigned puppy, payments, and conversation history." },
  Vault: { title: "Documents", text: "Buyer files, dog records, certificates, signed agreements, and generated packets." },
};

const puppyNames = ["Clover", "Biscuit", "Maple", "Scout", "Piper", "Nova", "Moss", "Sunny", "Rook", "Hex"];

function DemoDashboard({ kennel, onNavigate, onAction }: { kennel: DemoKennel; onNavigate: (view: View) => void; onAction: () => void }) {
  const outstanding = kennel.families.filter((item) => item.balance !== "Paid" && item.balance !== "Deposit paid").length;
  const metrics = [
    ["Active litters", "1", kennel.breeding.stage, "Litters", ListTree],
    ["Puppies", String(kennel.litter.puppies), `${kennel.litter.reserved} reserved`, "Puppies", PawPrint],
    ["Applications", "4", "Waiting for review", "Applications", ClipboardCheck],
    ["Next 30 days", "4", kennel.litter.next, "Calendar", CalendarDays],
    ["Payments due", outstanding ? "$3,700" : "$0", "$8,450 received this month", "Finance", WalletCards],
  ] as const;
  return <div className="bos-today">
    <header className="dashboard-command-header">
      <div className="dashboard-command-copy"><span>KENNEL COMMAND CENTER</span><h1>Today at a glance</h1><p>Saturday, August 8 · {kennel.name}</p><div className="dashboard-day-meta"><span className="needs-work"><i/><b>3 items need attention</b></span><span><CalendarDays size={13}/> 4 next 30 days</span><span><PawPrint size={13}/> {kennel.litter.puppies} active puppies</span></div></div>
      <div className="dashboard-quick-actions"><button onClick={onAction}><CalendarDays size={16}/> Schedule</button><button onClick={onAction}><ReceiptText size={16}/> Payment</button><button className="primary-action" onClick={onAction}><Plus size={16}/> Quick add</button></div>
    </header>
    <section className="dashboard-metrics">{metrics.map(([label, value, detail, target, Icon]) => <button key={label} onClick={() => onNavigate(target)}><span className="dashboard-metric-icon"><Icon size={17}/></span><span><small>{label}</small><b>{value}</b><em>{detail}</em></span><ChevronRight size={15}/></button>)}</section>
    <div className="dashboard-primary-grid">
      <section className="dashboard-section dashboard-attention"><header><div><span>NEEDS ATTENTION</span><h2>What should move next</h2></div><strong className="has-work">3</strong></header><div className="dashboard-attention-list">
        <button onClick={() => onNavigate("Breedings")}><em className="urgent">BREEDING</em><span><b>{kennel.breeding.dam} · {kennel.breeding.stage}</b><small>{kennel.breeding.due}</small></span><ChevronRight size={16}/></button>
        <button onClick={() => onNavigate("Comms")}><em className="next">FAMILY</em><span><b>Family update day</b><small>{kennel.litter.name} · publish photos and weights</small></span><ChevronRight size={16}/></button>
        <button onClick={() => onNavigate("Vault")}><em className="review">DOCUMENT</em><span><b>1 family document awaiting signature</b><small>Review the family document queue</small></span><ChevronRight size={16}/></button>
      </div></section>
      <section className="dashboard-section dashboard-upcoming"><header><div><span>UPCOMING</span><h2>Breeding calendar</h2></div><button onClick={() => onNavigate("Calendar")}>Open calendar</button></header><div className="dashboard-event-list">
        {[ ["12","Aug","Family update day","Updates · scheduled"], ["19","Aug","Puppy care milestone",kennel.litter.next], ["25","Aug","Whelping preparation",kennel.breeding.due] ].map(([day,month,title,detail]) => <button key={title} onClick={() => onNavigate("Calendar")}><time><b>{day}</b><small>{month}</small></time><span><b>{title}</b><small>{detail}</small></span><em>Scheduled</em></button>)}
      </div></section>
    </div>
    <section className="dashboard-section dashboard-program"><header><div><span>ACTIVE PROGRAM</span><h2>Litters and pregnancies in motion</h2></div><button onClick={() => onNavigate("Breedings")}>Breeding workspace <ChevronRight size={14}/></button></header><div className="real-demo-program-grid"><article><small>ACTIVE LITTER</small><h3>{kennel.litter.name}</h3><strong>{kennel.litter.puppies}</strong><p>{kennel.litter.reserved} reserved · born {kennel.litter.born}</p></article><article><small>ACTIVE BREEDING</small><h3>{kennel.breeding.dam} × {kennel.breeding.sire}</h3><strong>{kennel.breeding.stage}</strong><p>{kennel.breeding.due} · {kennel.breeding.coi}</p></article><article><small>FAMILY JOURNEY</small><h3>Placement pipeline</h3><strong>{kennel.families.length + 9}</strong><p>Application → approval → match → go-home</p></article></div></section>
  </div>;
}

function DemoWorkspace({ view, kennel, onAction }: { view: View; kennel: DemoKennel; onAction: () => void }) {
  if (view === "Breeding") return <div className="real-demo-view-grid">{kennel.dogs.map((dog) => <article className="dashboard-section real-demo-card" key={dog.name}><header><div><span>{dog.role.toUpperCase()}</span><h2>{dog.name}</h2></div><Dog size={19}/></header><div className="real-demo-card-body"><b>{dog.status}</b><p>{dog.detail}</p><div><span>Pedigree on file</span><span>Health current</span><span>Genetics recorded</span></div></div></article>)}</div>;
  if (view === "Puppies" || view === "Litters" || view === "Whelping") return <><section className="dashboard-section"><header><div><span>ACTIVE LITTER</span><h2>{kennel.litter.name}</h2></div><button onClick={onAction}>Add puppy</button></header><div className="real-demo-puppy-grid">{puppyNames.slice(0, kennel.litter.puppies).map((name, index) => <article key={name}><span className="real-demo-pup-icon"><PawPrint size={16}/></span><div><b>{name}</b><small>{index < kennel.litter.reserved ? "Reserved" : "Available"} · {index % 2 ? "Female" : "Male"}</small></div><em>{(10.8 + index * .5).toFixed(1)} oz</em></article>)}</div></section></>;
  if (["Applications", "Families", "Waitlist", "Placement", "Delivery"].includes(view)) return <section className="dashboard-section"><header><div><span>FAMILY JOURNEY</span><h2>Placement pipeline</h2></div><button onClick={onAction}>New family</button></header><div className="real-demo-family-table"><header><span>Family</span><span>Puppy</span><span>Stage</span><span>Balance</span></header>{kennel.families.map((family) => <div key={family.name}><span><b>{family.name}</b><small>Approved family</small></span><span>{family.puppy}</span><span>{family.stage}</span><span><b>{family.balance}</b></span></div>)}</div></section>;
  if (view === "Finance" || view === "Inventory" || view === "Reports") return <><section className="dashboard-metrics real-demo-finance"><button><span className="dashboard-metric-icon"><WalletCards size={17}/></span><span><small>Received this month</small><b>$8,450</b><em>12 recorded payments</em></span></button><button><span className="dashboard-metric-icon"><ReceiptText size={17}/></span><span><small>Outstanding</small><b>$3,700</b><em>Across 3 families</em></span></button><button><span className="dashboard-metric-icon"><PackageSearch size={17}/></span><span><small>Program expenses</small><b>$1,126</b><em>August to date</em></span></button></section><section className="dashboard-section"><header><div><span>FINANCIAL ACTIVITY</span><h2>Buyer accounts</h2></div><button onClick={onAction}>Record payment</button></header><div className="real-demo-family-table"><header><span>Family</span><span>Puppy</span><span>Status</span><span>Balance</span></header>{kennel.families.map((family) => <div key={family.name}><span><b>{family.name}</b><small>Buyer account</small></span><span>{family.puppy}</span><span>{family.balance === "Paid" ? "Paid" : "Open"}</span><span><b>{family.balance}</b></span></div>)}</div></section></>;

  const cards: Record<string, Array<[string,string,string]>> = {
    Breedings: [["ACTIVE BREEDING", `${kennel.breeding.dam} × ${kennel.breeding.sire}`, kennel.breeding.stage], ["PROGESTERONE", kennel.breeding.progesterone, "Recorded on the breeding timeline"], ["PEDIGREE", kennel.breeding.coi, "Common ancestors and pairing context"]],
    Calendar: [["NEXT", "Family update day", "Aug 12 · photos + weights"], ["PUPPY CARE", kennel.litter.next, "Automatic age-based milestone"], ["WHELPING", kennel.breeding.due, "Preparation checklist available"]],
    Care: [["HEALTH RECORDS", "Vaccines & prevention", "Dog and puppy care schedules"], ["WEIGHTS", "Growth monitoring", "Newborn and puppy trends"], ["REMINDERS", "Upcoming care", "Tasks surface on the command center"]],
    Comms: [["FAMILY UPDATE", "Weekly puppy update", "Photos, weight, and milestone message"], ["AUTOMATIC EMAIL", "Application received", "Editable business language"], ["MESSAGE HISTORY", "Private family record", "Calls, updates, and requests together"]],
    Templates: [["DOCUMENTS", "Bill of Sale + Health Guarantee", "Auto-populated from family and puppy data"], ["EMAILS", "Automatic family communications", "Editable templates and triggers"], ["MILESTONES", "Weekly puppy milestones", "Scheduled by puppy age"]],
    Portal: [["FAMILY PORTAL", "Private buyer account", "Puppy, payments, documents, updates"], ["DOCUMENTS", "Signed copies", "Available after completion"], ["PUPPY JOURNEY", "Milestones & weights", "Updates appear automatically"]],
    CRM: [["PHONE CENTER", "Caller-aware account context", "Family record appears with the call"], ["REQUESTS", "Callback & message history", "Connected to the family account"], ["BUSINESS VOICE", "IVR and call routing", "Configured per kennel"]],
    Vault: [["BUYER DOCUMENTS", "Signed agreements", "Stored with the family record"], ["DOG RECORDS", "Registrations & health", "Connected to the breeding dog"], ["PUPPY PACKETS", "Complete go-home packet", "Generated from saved data"]],
  };
  const chosen = cards[view] || [["WORKSPACE", copy[view].title, copy[view].text], ["CONNECTED RECORDS", "One source of truth", "Changes flow across the breeder OS"], ["READ-ONLY DEMO", "Sample information", "No real breeder data is connected"]];
  return <div className="real-demo-view-grid">{chosen.map(([eyebrow,title,text]) => <article className="dashboard-section real-demo-card" key={title}><header><div><span>{eyebrow}</span><h2>{title}</h2></div><Sparkles size={19}/></header><div className="real-demo-card-body"><p>{text}</p><button onClick={onAction}>Open sample action <ChevronRight size={14}/></button></div></article>)}</div>;
}

export default function RealOSDemoClient({ kennel }: { kennel: DemoKennel }) {
  const [view, setView] = useState<View>("Command");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const active = nav.find((item) => item.id === view) || nav[0];
  const currentGroup = active.group;
  const badges = useMemo(() => ({ Applications: 4, Puppies: Math.max(0, kennel.litter.puppies - kennel.litter.reserved), Calendar: 4, Finance: 2 }), [kennel]);
  const action = () => { setNotice("This is a read-only sample workspace. In a real breeder account, this control opens the live form or workflow."); window.setTimeout(() => setNotice(""), 3200); };
  const navigate = (next: View) => { setView(next); setSidebarOpen(false); };

  return <div className="real-demo-shell" style={{ "--tenant-primary": kennel.accentDark, "--tenant-accent": kennel.accent } as CSSProperties}>
    <div className="real-demo-sample-bar"><span><Sparkles size={14}/> INTERACTIVE SAMPLE WORKSPACE</span><p>Demonstration data only. The layout and navigation mirror the real MyDogPortal breeder OS.</p><Link href={kennel.websiteHref}>Back to website example</Link></div>
    <div className="bos-shell real-demo-bos-shell">
      <aside className={`bos-command-bar${sidebarOpen ? " mobile-open" : ""}`}>
        <div className="bos-sidebar-top"><button className="bos-brand" onClick={() => navigate("Command")}><span><PawPrint size={20}/></span><b>{kennel.name}</b><small>{kennel.breed} · BREEDER OS</small></button><button className="bos-nav-toggle" type="button" onClick={() => setSidebarOpen((value) => !value)}>{sidebarOpen ? <X size={20}/> : <Menu size={20}/>}</button></div>
        <div className="bos-search"><Search size={16}/><input readOnly placeholder="Find dogs, puppies, families…" onClick={action}/><kbd>⌘ K</kbd></div>
        <button className="bos-global-add" onClick={action}><Plus size={17}/><span>Quick add</span></button>
        <div className="bos-sidebar-scroll"><nav className="bos-sidebar-nav">{groups.map((group) => { const GroupIcon = groupIcons[group]; return <section key={group}><h2><GroupIcon size={14}/><span>{group}</span></h2><div>{nav.filter((item) => item.group === group).map((item) => { const Icon = item.icon; const badge = Number((badges as Record<string, number>)[item.id] || 0); return <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => navigate(item.id)}><Icon size={16}/><span>{item.label}</span>{badge > 0 && <em>{badge}</em>}</button>; })}</div></section>; })}</nav><footer className="bos-sidebar-footer"><div><button onClick={action}><Palette size={15}/><span>Brand</span></button><button onClick={action}><Globe2 size={15}/><span>Domain</span></button><button onClick={action}><Headphones size={15}/><span>Support</span></button></div><p><i/><span><b>Sample workspace</b><small>Read-only demonstration</small></span></p></footer></div>
      </aside>
      <main className="bos-main">
        {view !== "Command" && <header className="bos-view-head"><div><small>{currentGroup} / {active.label}</small><h1>{copy[view].title}</h1><p>{copy[view].text}</p></div><div><button onClick={action}><ReceiptText size={15}/> Payment</button><button className="primary-action" onClick={action}><Plus size={15}/> Add to {active.label}</button></div></header>}
        {view === "Command" ? <DemoDashboard kennel={kennel} onNavigate={navigate} onAction={action}/> : <DemoWorkspace view={view} kennel={kennel} onAction={action}/>} 
      </main>
    </div>
    {notice && <div className="real-demo-toast"><ShieldCheck size={16}/>{notice}</div>}
  </div>;
}
