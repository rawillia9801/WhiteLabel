"use client";

import Link from "next/link";
import {
  Activity, ArrowLeft, Bell, CalendarDays, Check, ChevronRight, CircleDollarSign,
  ClipboardCheck, Clock3, Dog, FileSignature, HeartPulse, LayoutDashboard,
  MailCheck, Menu, PawPrint, Sparkles, UsersRound, Waypoints, X,
} from "lucide-react";
import { useState } from "react";
import type { DemoKennel } from "./demo-data";
import "./demo.css";

const nav = [
  ["dashboard", LayoutDashboard, "Command Center"],
  ["breeding", Waypoints, "Breeding"],
  ["dogs", Dog, "Dogs"],
  ["litters", PawPrint, "Litters & Puppies"],
  ["families", UsersRound, "Families"],
  ["whelping", HeartPulse, "Whelping Mode"],
  ["calendar", CalendarDays, "Calendar"],
  ["documents", FileSignature, "Documents"],
  ["payments", CircleDollarSign, "Payments"],
  ["automation", Sparkles, "Automations"],
  ["portal", Activity, "Puppy Portal"],
] as const;

type View = typeof nav[number][0];

function SectionTitle({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <header className="osd-section-title"><div><span>{eyebrow}</span><h2>{title}</h2></div><p>{copy}</p></header>;
}

function Dashboard({ kennel }: { kennel: DemoKennel }) {
  return <>
    <SectionTitle eyebrow="COMMAND CENTER" title={kennel.greeting} copy="A realistic read-only example of the information a breeder sees when they open MyDogPortal." />
    <div className="osd-alert"><Bell size={18}/><div><b>3 items need attention today</b><span>{kennel.breeding.dam} breeding milestone · {kennel.litter.next} · 1 family document awaiting signature</span></div><ChevronRight size={17}/></div>
    <div className="osd-metrics">
      <article><small>ACTIVE DOGS</small><b>{kennel.dogs.length}</b><span>Breeding roster</span></article>
      <article><small>ACTIVE LITTER</small><b>{kennel.litter.puppies}</b><span>{kennel.litter.reserved} puppies reserved</span></article>
      <article><small>ACTIVE FAMILIES</small><b>{kennel.families.length + 9}</b><span>Application → go-home</span></article>
      <article><small>RECEIVED THIS MONTH</small><b>$8,450</b><span>$3,700 outstanding</span></article>
    </div>
    <div className="osd-dashboard-grid">
      <article className="osd-panel osd-span-2"><div className="osd-panel-head"><div><small>BREEDING CALENDAR</small><h3>What comes next</h3></div><CalendarDays size={20}/></div><div className="osd-timeline">
        <span><i>08</i><div><b>Progesterone / pairing check</b><small>{kennel.breeding.dam} · {kennel.breeding.stage}</small></div></span>
        <span><i>12</i><div><b>Family update day</b><small>{kennel.litter.name} · publish photos + weights</small></div></span>
        <span><i>19</i><div><b>Puppy care milestone</b><small>{kennel.litter.next}</small></div></span>
        <span><i>25</i><div><b>Whelping preparation</b><small>Supplies, family notices, care checklist</small></div></span>
      </div></article>
      <article className="osd-panel"><div className="osd-panel-head"><div><small>ACTIVE LITTER</small><h3>{kennel.litter.name}</h3></div><PawPrint size={20}/></div><div className="osd-litter-hero"><b>{kennel.litter.puppies}</b><span>puppies · born {kennel.litter.born}</span></div><div className="osd-progress"><i style={{width: `${Math.round(kennel.litter.reserved / kennel.litter.puppies * 100)}%`}}/></div><p>{kennel.litter.reserved} of {kennel.litter.puppies} reserved · {kennel.litter.next}</p></article>
      <article className="osd-panel"><div className="osd-panel-head"><div><small>FAMILY JOURNEY</small><h3>Placement pipeline</h3></div><UsersRound size={20}/></div><div className="osd-journey"><span><b>4</b><small>Applied</small></span><span><b>3</b><small>Approved</small></span><span><b>5</b><small>Waiting</small></span><span><b>3</b><small>Matched</small></span></div></article>
      <article className="osd-panel osd-span-2"><div className="osd-panel-head"><div><small>RECENT ACTIVITY</small><h3>Program activity</h3></div><Activity size={20}/></div><div className="osd-activity">{kennel.activity.map(item=><span key={item.title}><i><Check size={12}/></i><div><b>{item.title}</b><small>{item.detail}</small></div><em>{item.time}</em></span>)}</div></article>
    </div>
  </>;
}

function Breeding({ kennel }: { kennel: DemoKennel }) {
  return <>
    <SectionTitle eyebrow="BREEDING INTELLIGENCE" title="One breeding record, start to finish." copy="Track heat cycles, progesterone, pairings, pedigree context, pregnancy milestones, due dates, and the automatically generated timeline." />
    <div className="osd-feature-grid">
      <article className="osd-panel osd-span-2"><small>ACTIVE BREEDING</small><h3>{kennel.breeding.dam} × {kennel.breeding.sire}</h3><div className="osd-breeding-stage"><span className="done">Heat recorded</span><span className="done">Progesterone</span><span className="active">{kennel.breeding.stage}</span><span>Pregnancy</span><span>Whelping</span></div><div className="osd-detail-grid"><span><small>NEXT / DUE</small><b>{kennel.breeding.due}</b></span><span><small>PROGESTERONE</small><b>{kennel.breeding.progesterone}</b></span><span><small>PEDIGREE</small><b>{kennel.breeding.coi}</b></span><span><small>GENETICS</small><b>Pairing reviewed</b></span></div></article>
      <article className="osd-panel"><small>PEDIGREE TOOLS</small><h3>Planned mating analysis</h3><ul className="osd-checks"><li><Check/>3–5 generation pedigree</li><li><Check/>COI calculation</li><li><Check/>Common ancestors</li><li><Check/>Carrier compatibility</li></ul></article>
      <article className="osd-panel"><small>AUTOMATIC TIMELINE</small><h3>Milestones from the breeding date</h3><ul className="osd-checks"><li><Check/>Pregnancy checkpoints</li><li><Check/>Imaging windows</li><li><Check/>Whelping countdown</li><li><Check/>Reminders generated</li></ul></article>
    </div>
  </>;
}

function Dogs({ kennel }: { kennel: DemoKennel }) {
  return <>
    <SectionTitle eyebrow="BREEDING ROSTER" title="Dogs, health, pedigree, and breeding context." copy="Each dog record keeps the information used to make breeding decisions together instead of scattering it through files and spreadsheets." />
    <div className="osd-dog-grid">{kennel.dogs.map((dog,index)=><article className="osd-dog-card" key={dog.name}><div className="osd-dog-avatar"><Dog size={29}/></div><div><small>{dog.role.toUpperCase()}</small><h3>{dog.name}</h3><p>{dog.detail}</p></div><em>{dog.status}</em><footer><span>Pedigree <b>{index % 2 ? "5 gen" : "4 gen"}</b></span><span>Genetics <b>On file</b></span><span>Health <b>Current</b></span></footer></article>)}</div>
  </>;
}

function Litters({ kennel }: { kennel: DemoKennel }) {
  const pups=["Clover","Biscuit","Maple","Scout","Piper","Nova","Moss","Sunny"].slice(0,kennel.litter.puppies);
  return <>
    <SectionTitle eyebrow="LITTER WORKSPACE" title={kennel.litter.name} copy="Manage the litter once, then let puppy assignments, health, documents, family updates, and portals use the same records." />
    <div className="osd-litter-summary"><span><small>BORN</small><b>{kennel.litter.born}</b></span><span><small>PUPPIES</small><b>{kennel.litter.puppies}</b></span><span><small>RESERVED</small><b>{kennel.litter.reserved}</b></span><span><small>NEXT MILESTONE</small><b>{kennel.litter.next}</b></span></div>
    <div className="osd-puppy-grid">{pups.map((name,i)=><article key={name}><span className="osd-collar" style={{background:["#e4a09a","#6e9fd0","#d7b560","#8a79b6","#77a983","#de8dbe","#728b9b","#cf826b"][i]}}/><div><b>{name}</b><small>{i%2 ? "Female" : "Male"} · {10.8+i*.5} oz birth wt.</small></div><em>{i < kennel.litter.reserved ? "Reserved" : "Available"}</em></article>)}</div>
  </>;
}

function Families({ kennel }: { kennel: DemoKennel }) {
  return <>
    <SectionTitle eyebrow="FAMILY PIPELINE" title="From application to forever home." copy="Applications become working family records that carry waitlist position, preferences, assignment, paperwork, payments, messages, and go-home progress." />
    <div className="osd-family-table"><header><span>Family</span><span>Puppy</span><span>Journey stage</span><span>Balance</span></header>{kennel.families.map(f=><div key={f.name}><span><b>{f.name}</b><small>Approved family</small></span><span>{f.puppy}</span><span><i/>{f.stage}</span><span><b>{f.balance}</b></span></div>)}</div>
    <div className="osd-panel osd-waitlist"><div><small>WAITLIST + PUPPY PICKING</small><h3>Selection order is operational—not just a note.</h3></div><div><span><b>#1</b> Hannah Lee <small>Female · cream · current litter</small></span><span><b>#2</b> Avery King <small>Either · flexible · current litter</small></span><span><b>#3</b> Sofia Lane <small>Male · next litter OK</small></span></div></div>
  </>;
}

function Whelping({ kennel }: { kennel: DemoKennel }) {
  return <>
    <SectionTitle eyebrow="WHELPING MODE" title="Built for the delivery room." copy="A focused newborn workflow captures the details breeders need quickly and turns them into a continuous health and growth record." />
    <div className="osd-whelping-head"><span><HeartPulse size={20}/><div><small>LIVE LITTER EXAMPLE</small><b>{kennel.litter.name}</b></div></span><em>READ-ONLY DEMO</em></div>
    <div className="osd-whelping-grid">{["7:42 PM","8:11 PM","8:46 PM","9:24 PM"].map((time,i)=><article key={time}><header><span style={{background:["#e4a09a","#6e9fd0","#d7b560","#8a79b6"][i]}}/><b>Puppy {i+1}</b><em>{time}</em></header><div><span><small>SEX</small><b>{i%2?"Female":"Male"}</b></span><span><small>BIRTH WEIGHT</small><b>{(4.3+i*.4).toFixed(1)} oz</b></span><span><small>PLACENTA</small><b>✓ Recorded</b></span><span><small>NURSING</small><b>✓ Confirmed</b></span></div></article>)}</div>
    <div className="osd-alert good"><Check size={18}/><div><b>Daily weight check complete</b><span>All newborns are inside the configured growth range. Weight-loss warnings appear here automatically when needed.</span></div></div>
  </>;
}

function CalendarView({ kennel }: { kennel: DemoKennel }) {
  const days=Array.from({length:31},(_,i)=>i+1);
  return <>
    <SectionTitle eyebrow="BREEDING CALENDAR" title="The breeding record builds the schedule." copy="Due dates, pregnancy milestones, puppy care, family updates, documents, and go-home work can all surface from the underlying records." />
    <div className="osd-calendar"><header><button>‹</button><b>August 2026</b><button>›</button></header><div className="osd-weekdays">{["SUN","MON","TUE","WED","THU","FRI","SAT"].map(d=><span key={d}>{d}</span>)}</div><div className="osd-days">{days.map(d=><span className={[8,12,19,25].includes(d)?"event":""} key={d}>{d}{d===8&&<i>Progesterone</i>}{d===12&&<i>Family updates</i>}{d===19&&<i>Puppy care</i>}{d===25&&<i>Whelping prep</i>}</span>)}</div></div>
  </>;
}

function Documents() {
  return <>
    <SectionTitle eyebrow="DOCUMENT WORKFLOW" title="Generate from information already entered." copy="Buyer, puppy, pricing, health, and placement data can populate documents so the breeder is not retyping the same information for every sale." />
    <div className="osd-doc-grid">{[
      ["Bill of Sale","Emma Harris · Clover","Awaiting signature"],
      ["Puppy Packet","Megan Cole · Biscuit","Ready to share"],
      ["Deposit Agreement","Ryan Miller · Maple","Signed"],
      ["Health Guarantee","Emma Harris · Clover","Signed"],
    ].map(([name,person,status])=><article key={name}><span><FileSignature size={22}/></span><div><small>AUTO-POPULATED DOCUMENT</small><h3>{name}</h3><p>{person}</p></div><em>{status}</em><button>View sample</button></article>)}</div>
  </>;
}

function Payments({ kennel }: { kennel: DemoKennel }) {
  return <>
    <SectionTitle eyebrow="FINANCIAL CONTROL" title="Track breeder finances without becoming the payment processor." copy="MyDogPortal records deposits, balances, payment plans, due dates, expenses, and placement history while the breeder's actual puppy-sale payment arrangements stay theirs." />
    <div className="osd-metrics"><article><small>RECEIVED THIS MONTH</small><b>$8,450</b><span>12 recorded payments</span></article><article><small>OUTSTANDING</small><b>$3,700</b><span>Across 3 families</span></article><article><small>UPCOMING</small><b>$1,850</b><span>Next 14 days</span></article><article><small>PROGRAM EXPENSES</small><b>$1,126</b><span>August to date</span></article></div>
    <div className="osd-family-table payment"><header><span>Family</span><span>Record</span><span>Status</span><span>Balance</span></header>{kennel.families.map((f,i)=><div key={f.name}><span><b>{f.name}</b><small>{f.puppy}</small></span><span>{i?"Deposit + plan":"Placement balance"}</span><span><i/>{i===2?"Paid":"Current"}</span><span><b>{f.balance}</b></span></div>)}</div>
  </>;
}

function Automation({ kennel }: { kennel: DemoKennel }) {
  return <>
    <SectionTitle eyebrow="AUTOMATION CENTER" title="Follow-up that follows the record." copy="The breeder decides what should happen; MyDogPortal uses application, payment, puppy, and milestone information to keep routine communication moving." />
    <div className="osd-automation-grid">{[
      [MailCheck,"Application received","Immediately","Send family acknowledgement + notify breeder","Active"],
      [UsersRound,"Application approved","On approval","Send next steps and family-access instructions","Active"],
      [CircleDollarSign,"Payment reminder","3 days before due","Email family with recorded balance and due date","Active"],
      [PawPrint,"Weekly puppy update","Every Friday","Prompt breeder, then publish approved update to Puppy Portal","Active"],
      [CalendarDays,"Go-home preparation","7 days before","Send checklist and surface missing documents","Active"],
      [HeartPulse,"Breeding milestone","Timeline driven",`Alert breeder about ${kennel.breeding.dam}'s next milestone`,"Active"],
    ].map(([Icon,title,when,action,status])=><article key={String(title)}><span><Icon size={20}/></span><div><small>{when}</small><h3>{title}</h3><p>{action}</p></div><em><i/>{status}</em></article>)}</div>
  </>;
}

function Portal({ kennel }: { kennel: DemoKennel }) {
  const family=kennel.families[0];
  return <>
    <SectionTitle eyebrow="PRIVATE PUPPY PORTAL" title="The family's view is connected—but intentionally limited." copy="Families see their puppy journey, not the breeder's private operating records. This example shows the information intended for one placed family." />
    <div className="osd-portal"><aside><small>{kennel.name.toUpperCase()}</small><h3>{family.name}</h3>{["Overview","My Puppy","Health & Growth","Updates","Documents","Payments","Schedule","Messages","Resources"].map((x,i)=><span className={i===0?"active":""} key={x}>{x}</span>)}</aside><section><small>PRIVATE FAMILY PORTAL</small><h2>Welcome, {family.name.split(" ")[0]}</h2><p>Everything connected to {family.puppy}'s journey, organized around what comes next.</p><div className="osd-portal-metrics"><span><small>ASSIGNED PUPPY</small><b>{family.puppy}</b></span><span><small>PUBLISHED UPDATES</small><b>6</b></span><span><small>DOCUMENTS</small><b>4</b></span><span><small>BALANCE</small><b>{family.balance}</b></span></div><div className="osd-portal-card"><div><small>NEXT STEP</small><h3>Prepare for go-home</h3><p>Review the Puppy Packet, confirm your appointment, and complete the remaining family document.</p></div><b>80%</b></div></section></div>
  </>;
}

export default function OSDemoClient({ kennel }: { kennel: DemoKennel }) {
  const [view,setView]=useState<View>("dashboard");
  const [open,setOpen]=useState(false);
  const current=nav.find(item=>item[0]===view)!;
  const render=()=> {
    switch(view){
      case "breeding": return <Breeding kennel={kennel}/>;
      case "dogs": return <Dogs kennel={kennel}/>;
      case "litters": return <Litters kennel={kennel}/>;
      case "families": return <Families kennel={kennel}/>;
      case "whelping": return <Whelping kennel={kennel}/>;
      case "calendar": return <CalendarView kennel={kennel}/>;
      case "documents": return <Documents/>;
      case "payments": return <Payments kennel={kennel}/>;
      case "automation": return <Automation kennel={kennel}/>;
      case "portal": return <Portal kennel={kennel}/>;
      default: return <Dashboard kennel={kennel}/>;
    }
  };
  return <main className="osd" style={{"--osd-accent":kennel.accent,"--osd-dark":kennel.accentDark} as React.CSSProperties}>
    <div className="osd-demo-banner"><span><Sparkles size={14}/> INTERACTIVE SAMPLE WORKSPACE</span><p>All names, balances, dogs, families, and activity below are demonstration data. Nothing here is connected to a real breeder account.</p><Link href={kennel.websiteHref}><ArrowLeft size={13}/> Back to website example</Link></div>
    <div className="osd-shell">
      <aside className={`osd-sidebar ${open?"open":""}`}>
        <header><span>{kennel.monogram}</span><div><b>{kennel.name}</b><small>{kennel.breed} · BREEDER OS</small></div><button onClick={()=>setOpen(false)} aria-label="Close navigation"><X size={18}/></button></header>
        <div className="osd-domain"><small>{kennel.domainType}</small><b>{kennel.websiteLabel}</b></div>
        <nav>{nav.map(([id,Icon,label])=><button className={view===id?"active":""} onClick={()=>{setView(id);setOpen(false)}} key={id}><Icon size={17}/><span>{label}</span><ChevronRight size={13}/></button>)}</nav>
        <footer><PawPrint size={18}/><div><b>Powered by MyDogPortal</b><small>Read-only prospect demo</small></div></footer>
      </aside>
      <section className="osd-workspace">
        <div className="osd-topbar"><button onClick={()=>setOpen(true)} aria-label="Open navigation"><Menu size={19}/></button><div><current[1] size={17}/><b>{current[2]}</b></div><span><Clock3 size={14}/> Sample data · Aug 7, 2026</span><Link href="/signup">Start free trial <ChevronRight size={14}/></Link></div>
        <div className="osd-content">{render()}</div>
      </section>
    </div>
  </main>;
}
