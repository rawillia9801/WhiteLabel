"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, ChevronRight, Headphones, LoaderCircle, MessageSquareText, Plus, Send, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { SupportTicket } from "../lib/support-tickets";

const categories = ["Account", "Billing", "Technical", "Website", "Domain & Email", "Phone", "Puppy Portal", "Data", "Other"];
const priorities = ["Low", "Normal", "High", "Urgent"];

function dateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function tone(value: string) {
  return value.toLowerCase().replaceAll(" ", "-");
}

export function BreederSupportDesk({ kennelName }: { kennelName: string }) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/support-tickets", { cache: "no-store" });
      const payload = await response.json() as { tickets?: SupportTicket[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to load support tickets.");
      const next = payload.tickets || [];
      setTickets(next);
      setSelectedId((current) => current && next.some((ticket) => ticket.id === current) ? current : next[0]?.id || null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to load support tickets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/support-tickets", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as { tickets?: SupportTicket[]; error?: string };
        if (!response.ok) throw new Error(payload.error || "Unable to load support tickets.");
        if (!active) return;
        const next = payload.tickets || [];
        setTickets(next);
        setSelectedId(next[0]?.id || null);
      })
      .catch((failure) => { if (active) setError(failure instanceof Error ? failure.message : "Unable to load support tickets."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const selected = useMemo(() => tickets.find((ticket) => ticket.id === selectedId) || null, [selectedId, tickets]);
  const openCount = tickets.filter((ticket) => !["Resolved", "Closed"].includes(ticket.status)).length;

  async function submitTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch("/api/support-tickets", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(values) });
      const payload = await response.json() as { ticket?: SupportTicket; error?: string };
      if (!response.ok || !payload.ticket) throw new Error(payload.error || "Unable to create the support ticket.");
      setCreating(false);
      await load();
      setSelectedId(payload.ticket.id);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to create the support ticket.");
    } finally {
      setSaving(false);
    }
  }

  async function submitReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError("");
    const form = event.currentTarget;
    const body = String(new FormData(form).get("body") || "").trim();
    try {
      const response = await fetch(`/api/support-tickets/${selected.id}/messages`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to send the reply.");
      form.reset();
      await load();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to send the reply.");
    } finally {
      setSaving(false);
    }
  }

  return <main className="support-desk">
    <aside className="support-rail">
      <Link href="/"><ArrowLeft size={15} /> Back to breeder OS</Link>
      <div className="support-brand"><span><Headphones size={20} /></span><div><b>MyDogPortal Support</b><small>{kennelName}</small></div></div>
      <button className="support-new" type="button" onClick={() => setCreating(true)}><Plus size={16} /> New support ticket</button>
      <div className="support-summary"><span><b>{openCount}</b><small>Open tickets</small></span><span><b>{tickets.length}</b><small>Total tickets</small></span></div>
      <nav aria-label="Support tickets">
        {tickets.map((ticket) => <button type="button" key={ticket.id} className={selectedId === ticket.id ? "active" : ""} onClick={() => { setSelectedId(ticket.id); setCreating(false); }}><span><small>{ticket.ticketNumber}</small><b>{ticket.subject}</b><em>{ticket.category} · {dateTime(ticket.updatedAt)}</em></span><i className={tone(ticket.status)}>{ticket.status}</i><ChevronRight size={14} /></button>)}
        {!loading && !tickets.length && <div className="support-empty-rail"><CheckCircle2 size={18} /><b>No support tickets</b><small>When you need us, open a ticket here.</small></div>}
      </nav>
    </aside>

    <section className="support-workspace">
      <header><div><small>MYDOGPORTAL / CUSTOMER SUPPORT</small><h1>{creating ? "How can we help?" : selected ? selected.subject : "Support center"}</h1><p>{creating ? "Tell us what is happening and your ticket will go directly to the MyDogPortal administration team." : selected ? `${selected.ticketNumber} · Opened ${dateTime(selected.createdAt)}` : "Create a ticket and keep every response together in one private conversation."}</p></div><button type="button" onClick={() => setCreating(true)}><Plus size={15} /> New ticket</button></header>
      {error && <div className="support-error"><AlertCircle size={17} /><span>{error}</span><button type="button" onClick={() => void load()}>Retry</button></div>}
      {loading ? <div className="support-loading"><LoaderCircle size={23} /> Loading support…</div> : creating ?
        <form className="support-create-form" onSubmit={submitTicket}>
          <div className="support-form-intro"><span><MessageSquareText size={21} /></span><div><small>NEW SUPPORT TICKET</small><h2>Tell us what you need</h2><p>Please include what you were trying to do, what happened, and any error message you saw. Your kennel identity is attached automatically.</p></div></div>
          <label className="full"><span>Subject</span><input name="subject" required minLength={3} maxLength={160} placeholder="Example: Puppy Portal is not showing a new document" /></label>
          <label><span>Category</span><select name="category" required defaultValue="Technical">{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label><span>Priority</span><select name="priority" required defaultValue="Normal">{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
          <label className="full"><span>What happened?</span><textarea name="description" required minLength={5} maxLength={5000} rows={8} placeholder="Describe the issue, including the page or feature involved and what you expected to happen." /></label>
          <div className="support-form-actions"><button type="button" className="secondary" onClick={() => setCreating(false)}>Cancel</button><button type="submit" disabled={saving}>{saving ? <LoaderCircle size={16} /> : <Send size={16} />} Submit ticket</button></div>
        </form> : selected ?
        <div className="support-ticket-view">
          <section className="ticket-meta"><span><small>STATUS</small><b className={tone(selected.status)}>{selected.status}</b></span><span><small>PRIORITY</small><b>{selected.priority}</b></span><span><small>CATEGORY</small><b>{selected.category}</b></span><span><small>LAST ACTIVITY</small><b>{dateTime(selected.updatedAt)}</b></span></section>
          <section className="ticket-thread">
            <article className="ticket-message breeder"><header><span>{kennelName.slice(0, 2).toUpperCase()}</span><div><b>{kennelName}</b><small>{dateTime(selected.createdAt)} · Ticket opened</small></div></header><p>{selected.description}</p></article>
            {selected.messages.map((message) => <article className={`ticket-message ${message.authorType === "platform_admin" ? "admin" : "breeder"}`} key={message.id}><header><span>{message.authorType === "platform_admin" ? <ShieldCheck size={15} /> : message.authorLabel.slice(0, 2).toUpperCase()}</span><div><b>{message.authorType === "platform_admin" ? "MyDogPortal Support" : message.authorLabel}</b><small>{dateTime(message.createdAt)}</small></div></header><p>{message.body}</p></article>)}
          </section>
          {selected.status !== "Closed" && <form className="ticket-reply" onSubmit={submitReply}><label><span>Reply to MyDogPortal Support</span><textarea name="body" required maxLength={5000} rows={4} placeholder="Add more information or reply to the support team…" /></label><button type="submit" disabled={saving}>{saving ? <LoaderCircle size={16} /> : <Send size={16} />} Send reply</button></form>}
        </div> : <div className="support-welcome"><Headphones size={30} /><h2>We’re here when you need us.</h2><p>Open a support ticket for account, billing, website, domain, phone, Puppy Portal, data, or technical questions.</p><button type="button" onClick={() => setCreating(true)}><Plus size={15} /> Open your first ticket</button></div>}
    </section>
  </main>;
}
