"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, LoaderCircle, MessageSquareText, Send, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import type { PlatformAdminDashboardData } from "../lib/platform-admin";

type Ticket = PlatformAdminDashboardData["supportTickets"][number];

function dateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function tone(value: string) {
  return value.toLowerCase().replaceAll(" ", "-");
}

export function PlatformSupportTickets({ tickets, query }: { tickets: Ticket[]; query: string }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("Open");
  const [selectedId, setSelectedId] = useState<number | null>(tickets[0]?.id || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const visible = useMemo(() => tickets.filter((ticket) => {
    const needle = query.trim().toLowerCase();
    const queryMatch = !needle || [ticket.ticketNumber, ticket.kennelName, ticket.email, ticket.subject, ticket.category, ticket.status, ticket.priority].some((value) => value.toLowerCase().includes(needle));
    const isOpen = !["Resolved", "Closed"].includes(ticket.status);
    const statusMatch = statusFilter === "All" || (statusFilter === "Open" ? isOpen : ticket.status === statusFilter);
    return queryMatch && statusMatch;
  }), [query, statusFilter, tickets]);
  const selected = tickets.find((ticket) => ticket.id === selectedId) || visible[0] || null;

  async function updateTicket(values: { status?: string; priority?: string }) {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/platform-admin/support-tickets/${selected.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(values) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to update ticket.");
      router.refresh();
      setSaving(false);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to update ticket.");
      setSaving(false);
    }
  }

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError("");
    const form = event.currentTarget;
    const body = String(new FormData(form).get("body") || "").trim();
    try {
      const response = await fetch(`/api/platform-admin/support-tickets/${selected.id}/messages`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body, status: "Waiting on Breeder" }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to send reply.");
      form.reset();
      router.refresh();
      setSaving(false);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to send reply.");
      setSaving(false);
    }
  }

  return <section className="admin-panel full platform-support-panel">
    <header><div><small>CUSTOMER SUPPORT</small><h2>Breeder trouble tickets</h2><p>Private support conversations from authenticated MyDogPortal kennel accounts.</p></div><div className="filter-pills">{["Open", "All", "Waiting on Breeder", "Resolved"].map((status) => <button type="button" key={status} className={statusFilter === status ? "active" : ""} onClick={() => setStatusFilter(status)}>{status}</button>)}</div></header>
    {error && <div className="platform-support-error">{error}</div>}
    <div className="platform-support-grid">
      <div className="platform-ticket-list">
        {visible.map((ticket) => <button type="button" className={selected?.id === ticket.id ? "active" : ""} key={ticket.id} onClick={() => setSelectedId(ticket.id)}><span className="ticket-list-top"><small>{ticket.ticketNumber}</small><i className={tone(ticket.priority)}>{ticket.priority}</i></span><b>{ticket.subject}</b><span>{ticket.kennelName}</span><footer><em className={tone(ticket.status)}>{ticket.status}</em><time>{dateTime(ticket.updatedAt)}</time></footer></button>)}
        {!visible.length && <div className="platform-ticket-empty"><CheckCircle2 size={19} /><b>No tickets match this view.</b></div>}
      </div>
      {selected ? <div className="platform-ticket-detail">
        <header><div><small>{selected.ticketNumber} · {selected.category}</small><h3>{selected.subject}</h3><p>{selected.kennelName} · {selected.email || "No contact email"} · Opened {dateTime(selected.createdAt)}</p></div><div className="platform-ticket-controls"><label><span>Priority</span><select value={selected.priority} disabled={saving} onChange={(event) => void updateTicket({ priority: event.target.value })}>{["Low", "Normal", "High", "Urgent"].map((priority) => <option key={priority}>{priority}</option>)}</select></label><label><span>Status</span><select value={selected.status} disabled={saving} onChange={(event) => void updateTicket({ status: event.target.value })}>{["Open", "In Progress", "Waiting on Breeder", "Resolved", "Closed"].map((status) => <option key={status}>{status}</option>)}</select></label></div></header>
        <div className="platform-ticket-thread">
          <article className="breeder"><header><span>{selected.kennelName.slice(0, 2).toUpperCase()}</span><div><b>{selected.kennelName}</b><small>{dateTime(selected.createdAt)} · Ticket opened</small></div></header><p>{selected.description}</p></article>
          {selected.messages.map((message) => <article className={message.authorType === "platform_admin" ? "admin" : "breeder"} key={message.id}><header><span>{message.authorType === "platform_admin" ? <ShieldCheck size={14} /> : message.authorLabel.slice(0, 2).toUpperCase()}</span><div><b>{message.authorType === "platform_admin" ? "MyDogPortal Support" : message.authorLabel}</b><small>{dateTime(message.createdAt)}</small></div></header><p>{message.body}</p></article>)}
        </div>
        {selected.status !== "Closed" && <form className="platform-ticket-reply" onSubmit={sendReply}><label><span>Reply to breeder</span><textarea name="body" required maxLength={5000} rows={4} placeholder="Write a support response…" /></label><button type="submit" disabled={saving}>{saving ? <LoaderCircle size={15} /> : <Send size={15} />} Reply & wait for breeder</button></form>}
      </div> : <div className="platform-ticket-placeholder"><MessageSquareText size={25} /><b>Select a support ticket</b><span>The complete conversation and controls will appear here.</span></div>}
    </div>
  </section>;
}
