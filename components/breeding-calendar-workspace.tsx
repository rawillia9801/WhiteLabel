"use client";

import { useMemo, useState } from "react";
import { CalendarClock, CalendarPlus, CheckCircle2, Filter, RefreshCw } from "lucide-react";
import { useBreedingData } from "./use-breeding-data";

const value = (row: Record<string, unknown>, key: string) => String(row[key] ?? "");
const day = (date: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${date.slice(0, 10)}T12:00:00`));

export function BreedingCalendarWorkspace({ onCreateManual }: { onCreateManual: () => void }) {
  const { data, loading, error, refresh } = useBreedingData();
  const [filter, setFilter] = useState("All");
  const events = useMemo(() => [...data.events]
    .filter((event) => filter === "All" || value(event, "event_type") === filter)
    .sort((left, right) => value(left, "event_date").localeCompare(value(right, "event_date"))), [data.events, filter]);
  const types = useMemo(() => Array.from(new Set(data.events.map((event) => value(event, "event_type")).filter(Boolean))).sort(), [data.events]);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((event) => value(event, "event_date") >= today && value(event, "status") !== "Completed");
  const past = events.filter((event) => value(event, "event_date") < today || value(event, "status") === "Completed").reverse();

  if (loading) return <div className="breeding-workspace-state">Loading automated calendar…</div>;
  return <div className="breeding-calendar-workspace">
    {error && <div className="inline-error">{error}</div>}
    <section className="calendar-automation-hero panel-wide"><div><small>CONNECTED BREEDING CALENDAR</small><h2>Dates generated from the record that owns them</h2><p>Heat estimates, breeding windows, pregnancy milestones, whelping dates, puppy care, go-home, and picking activity appear automatically. Generated items are keyed to prevent duplicates.</p></div><div><span><b>{data.events.filter((event) => Boolean(event.system_generated)).length}</b><small>Automated dates</small></span><span><b>{upcoming.length}</b><small>Upcoming</small></span></div></section>
    <div className="calendar-toolbar"><label><Filter size={15}/><span>Event type</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option>All</option>{types.map((type) => <option key={type}>{type}</option>)}</select></label><button onClick={() => void refresh()}><RefreshCw size={15}/> Refresh</button><button className="primary-action" onClick={onCreateManual}><CalendarPlus size={15}/> Add manual event</button></div>
    <section className="calendar-event-section"><header><div><small>NEXT UP</small><h2>Upcoming work</h2></div><CalendarClock size={22}/></header>{upcoming.length ? <div className="automated-event-list">{upcoming.map((event) => <article key={String(event.id)}><time><b>{day(value(event, "event_date"))}</b><small>{value(event, "event_time") || "All day"}</small></time><span><em>{value(event, "event_type")}</em><h3>{value(event, "title")}</h3><p>{value(event, "notes") || "No additional notes."}</p></span><div>{Boolean(event.system_generated) ? <strong>Automated</strong> : <strong className="manual">Manual</strong>}<small>{value(event, "status")}</small></div></article>)}</div> : <div className="breeding-empty"><CalendarClock size={27}/><b>No upcoming events in this filter</b><p>Workflow dates appear when heat cycles, breeding attempts, pregnancies, puppy care, or placements are recorded.</p></div>}</section>
    {past.length > 0 && <section className="calendar-event-section history"><header><div><small>HISTORY</small><h2>Completed and past dates</h2></div><CheckCircle2 size={21}/></header><div className="automated-event-list compact">{past.slice(0, 30).map((event) => <article key={String(event.id)}><time><b>{day(value(event, "event_date"))}</b></time><span><em>{value(event, "event_type")}</em><h3>{value(event, "title")}</h3></span><div><small>{value(event, "status")}</small></div></article>)}</div></section>}
  </div>;
}
