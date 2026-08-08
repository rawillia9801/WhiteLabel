"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  MessageSquareText,
  Users,
  WalletCards,
} from "lucide-react";
import type { PlatformAdminDashboardData } from "../lib/platform-admin";
import { PlatformSupportTickets } from "./platform-support-tickets";

type View = "overview" | "customers" | "payments" | "requests" | "support" | "activity";

function money(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

function dateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function dateOnly(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function stageClass(stage: string) {
  const value = stage.toLowerCase();
  if (value === "trial") return "trial";
  if (value === "active" || value === "completed") return "active";
  if (value.includes("incomplete")) return "pending";
  if (value.includes("cancel") || value.includes("suspend") || value.includes("denied") || value.includes("expired")) return "danger";
  return "neutral";
}

function matchesQuery(values: Array<string>, query: string) {
  if (!query) return true;
  const needle = query.toLowerCase();
  return values.some((value) => value.toLowerCase().includes(needle));
}

export function PlatformAdminDashboard({ data }: { data: PlatformAdminDashboardData }) {
  const [view, setView] = useState<View>("overview");
  const [query, setQuery] = useState("");
  const [customerStage, setCustomerStage] = useState("All");
  const [requestStatus, setRequestStatus] = useState("Open");

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    window.location.assign("/login");
  }

  const customers = useMemo(() => data.customers.filter((customer) => {
    const queryMatch = matchesQuery([customer.kennelName, customer.email, customer.slug, customer.plan, customer.stage], query);
    const stageMatch = customerStage === "All" || customer.stage === customerStage;
    return queryMatch && stageMatch;
  }), [customerStage, data.customers, query]);

  const payments = useMemo(() => data.payments.filter((payment) =>
    matchesQuery([payment.kennelName, payment.email, payment.offering, payment.kind, payment.status, payment.paypalId], query)
  ), [data.payments, query]);

  const requests = useMemo(() => data.requests.filter((request) => {
    const queryMatch = matchesQuery([request.kennelName, request.email, request.title, request.status, request.details], query);
    const open = !["COMPLETED", "CLOSED", "CANCELLED"].includes(request.status.toUpperCase());
    const statusMatch = requestStatus === "All" || (requestStatus === "Open" ? open : request.status.toLowerCase() === requestStatus.toLowerCase());
    return queryMatch && statusMatch;
  }), [data.requests, query, requestStatus]);

  const planTotal = Math.max(1, data.planMix.reduce((sum, item) => sum + item.count, 0));
  const nav = [
    { id: "overview" as const, label: "Overview", icon: LayoutDashboard, count: null },
    { id: "customers" as const, label: "Customers & trials", icon: Users, count: data.metrics.totalKennels },
    { id: "payments" as const, label: "Payments", icon: CreditCard, count: data.payments.length },
    { id: "requests" as const, label: "Service requests", icon: Settings2, count: data.metrics.openRequests },
    { id: "support" as const, label: "Support tickets", icon: MessageSquareText, count: data.metrics.openSupportTickets },
    { id: "activity" as const, label: "Platform activity", icon: Activity, count: data.activity.length },
  ];

  return (
    <main className="platform-admin">
      <aside className="platform-sidebar">
        <header><span><ShieldCheck size={21} /></span><div><b>MyDogPortal</b><small>PLATFORM ADMIN</small></div></header>
        <nav>
          <small>BUSINESS CONTROL</small>
          {nav.map((item) => {
            const Icon = item.icon;
            return <button type="button" key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><Icon size={16} /><span>{item.label}</span>{item.count !== null && <em>{item.count}</em>}</button>;
          })}
        </nav>
        <footer><div><span>RA</span><p><b>Platform owner</b><small>{data.adminEmail || "Authorized account"}</small></p></div><button type="button" onClick={() => void signOut()} aria-label="Sign out"><LogOut size={15} /></button></footer>
      </aside>

      <section className="platform-main">
        <header className="platform-topbar">
          <div><small>MYDOGPORTAL / ADMINISTRATION</small><h1>{view === "overview" ? "Business command center" : nav.find((item) => item.id === view)?.label}</h1></div>
          <div className="platform-top-actions">
            <label><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search kennel, email, plan…" /></label>
            <button type="button" onClick={() => window.location.reload()}><RefreshCw size={14} /> Refresh</button>
          </div>
        </header>

        <div className="platform-content">
          {view === "overview" && <>
            <section className="admin-metrics">
              <article><span><Building2 size={17} /></span><div><small>TOTAL KENNELS</small><b>{data.metrics.totalKennels}</b><p>Customer accounts</p></div></article>
              <article><span><CalendarClock size={17} /></span><div><small>ACTIVE TRIALS</small><b>{data.metrics.activeTrials}</b><p>14-day PayPal trials</p></div></article>
              <article><span><WalletCards size={17} /></span><div><small>ACTIVE PAID</small><b>{data.metrics.activePaid}</b><p>Software subscriptions</p></div></article>
              <article><span><CircleDollarSign size={17} /></span><div><small>COLLECTED</small><b>{money(data.metrics.collected)}</b><p>Recorded PayPal payments</p></div></article>
              <article><span><Sparkles size={17} /></span><div><small>RECURRING RUN RATE</small><b>{money(data.metrics.recurringRunRate)}</b><p>Monthly equivalent</p></div></article>
              <article className={data.metrics.attention || data.metrics.openSupportTickets ? "attention" : ""}><span><AlertTriangle size={17} /></span><div><small>NEEDS ATTENTION</small><b>{data.metrics.attention + data.metrics.checkoutIncomplete + data.metrics.openSupportTickets}</b><p>{data.metrics.checkoutIncomplete} checkout · {data.metrics.openSupportTickets} support</p></div></article>
            </section>

            <section className="admin-overview-grid">
              <article className="admin-panel admin-customer-preview">
                <header><div><small>CUSTOMER PIPELINE</small><h2>Trials and subscriptions</h2></div><button type="button" onClick={() => setView("customers")}>View all <ChevronRight size={14} /></button></header>
                <div className="admin-table compact">
                  <div className="table-head"><span>Customer</span><span>Plan</span><span>Status</span><span>Trial / billing</span></div>
                  {data.customers.slice(0, 7).map((customer) => <div className="table-row" key={customer.kennelId}><span className="customer-cell"><i>{customer.kennelName.slice(0, 2).toUpperCase()}</i><span><b>{customer.kennelName}</b><small>{customer.email || customer.slug + ".mydogportal.site"}</small></span></span><span><b>{customer.plan}</b></span><span><em className={"status " + stageClass(customer.stage)}>{customer.stage}</em></span><span><small>{customer.trialEndsAt ? "Ends " + dateOnly(customer.trialEndsAt) : customer.nextBillingAt ? "Next " + dateOnly(customer.nextBillingAt) : "No PayPal subscription"}</small></span></div>)}
                  {!data.customers.length && <div className="admin-empty">No kennel accounts have signed up yet.</div>}
                </div>
              </article>

              <article className="admin-panel plan-mix">
                <header><div><small>PLAN MIX</small><h2>Customer selection</h2></div></header>
                <div className="plan-bars">{data.planMix.map((item) => <div key={item.plan}><span><b>{item.plan}</b><small>{item.count} kennel{item.count === 1 ? "" : "s"}</small></span><div><i style={{ width: String((item.count / planTotal) * 100) + "%" }} /></div><strong>{Math.round((item.count / planTotal) * 100)}%</strong></div>)}</div>
                <footer><div><b>{data.metrics.openRequests}</b><span>Open service requests</span></div><button type="button" onClick={() => setView("requests")}>Review queue <ArrowUpRight size={13} /></button></footer>
              </article>
            </section>

            <section className="admin-overview-grid lower">
              <article className="admin-panel">
                <header><div><small>RECENT PAYMENTS</small><h2>Money movement</h2></div><button type="button" onClick={() => setView("payments")}>All payments <ChevronRight size={14} /></button></header>
                <div className="money-list">{data.payments.slice(0, 6).map((payment) => <div key={payment.id}><span className={payment.status.toUpperCase() === "COMPLETED" ? "money-ok" : "money-warn"}><CircleDollarSign size={15} /></span><p><b>{payment.kennelName}</b><small>{payment.kind} · {payment.offering}</small></p><strong>{money(payment.amount)}</strong><em className={"status " + stageClass(payment.status)}>{payment.status}</em></div>)}{!data.payments.length && <div className="admin-empty">Completed and failed PayPal transactions will appear here.</div>}</div>
              </article>
              <article className="admin-panel">
                <header><div><small>SETUP QUEUE</small><h2>Customer requests</h2></div><button type="button" onClick={() => setView("requests")}>Open queue <ChevronRight size={14} /></button></header>
                <div className="request-list">{data.requests.filter((request) => !["COMPLETED", "CLOSED", "CANCELLED"].includes(request.status.toUpperCase())).slice(0, 6).map((request) => <div key={request.id}><span><Settings2 size={14} /></span><p><b>{request.title}</b><small>{request.kennelName} · {dateOnly(request.createdAt)}</small></p><em className="status pending">{request.status}</em></div>)}{!data.metrics.openRequests && <div className="admin-empty"><CheckCircle2 size={18} /> No open setup requests.</div>}</div>
              </article>
            </section>
          </>}

          {view === "customers" && <section className="admin-panel full">
            <header><div><small>CUSTOMER LIFECYCLE</small><h2>Trials, subscriptions and incomplete checkout</h2><p>Every kennel signup, its selected plan, PayPal subscription stage, and next billing date.</p></div><div className="filter-pills">{["All", "Trial", "Active", "Checkout incomplete"].map((stage) => <button type="button" key={stage} className={customerStage === stage ? "active" : ""} onClick={() => setCustomerStage(stage)}>{stage}</button>)}</div></header>
            <div className="admin-table customers-table">
              <div className="table-head"><span>Customer</span><span>Plan</span><span>Stage</span><span>Joined</span><span>Trial ends</span><span>Next billing</span></div>
              {customers.map((customer) => <div className="table-row" key={customer.kennelId}><span className="customer-cell"><i>{customer.kennelName.slice(0, 2).toUpperCase()}</i><span><b>{customer.kennelName}</b><small>{customer.email}</small><small>{customer.slug}.mydogportal.site</small></span></span><span><b>{customer.plan}</b></span><span><em className={"status " + stageClass(customer.stage)}>{customer.stage}</em></span><span>{dateOnly(customer.joinedAt)}</span><span>{dateOnly(customer.trialEndsAt)}</span><span>{dateOnly(customer.nextBillingAt)}</span></div>)}
              {!customers.length && <div className="admin-empty">No customers match these filters.</div>}
            </div>
          </section>}

          {view === "payments" && <section className="admin-panel full">
            <header><div><small>PAYPAL LEDGER</small><h2>Payments and add-on purchases</h2><p>Recurring subscription collections and captured one-time PayPal orders recorded by MyDogPortal.</p></div><strong className="panel-total">{money(data.metrics.collected)}<small>RECORDED COLLECTED</small></strong></header>
            <div className="admin-table payments-table">
              <div className="table-head"><span>Customer</span><span>Type</span><span>Offering</span><span>PayPal ID</span><span>Date</span><span>Status</span><span>Amount</span></div>
              {payments.map((payment) => <div className="table-row" key={payment.id}><span><b>{payment.kennelName}</b><small>{payment.email}</small></span><span>{payment.kind}</span><span>{payment.offering}</span><span><code>{payment.paypalId}</code></span><span>{dateTime(payment.createdAt)}</span><span><em className={"status " + stageClass(payment.status)}>{payment.status}</em></span><span><b>{money(payment.amount)}</b></span></div>)}
              {!payments.length && <div className="admin-empty">No PayPal payment records match this search.</div>}
            </div>
          </section>}

          {view === "requests" && <section className="admin-panel full">
            <header><div><small>SERVICE FULFILLMENT</small><h2>Setup and add-on request queue</h2><p>Hosting/email, Brand Launch, website personalization, custom website and Business Voice requests submitted during signup.</p></div><div className="filter-pills">{["Open", "All", "Completed"].map((status) => <button type="button" key={status} className={requestStatus === status ? "active" : ""} onClick={() => setRequestStatus(status)}>{status}</button>)}</div></header>
            <div className="request-cards">{requests.map((request) => <article key={request.id}><header><span><Settings2 size={15} /></span><div><small>{request.kennelName}</small><h3>{request.title}</h3></div><em className={"status " + stageClass(request.status)}>{request.status}</em></header><p>{request.details}</p><footer><span>{request.email}</span><time>{dateTime(request.createdAt)}</time></footer></article>)}{!requests.length && <div className="admin-empty">No service requests match these filters.</div>}</div>
          </section>}

          {view === "support" && <PlatformSupportTickets tickets={data.supportTickets} query={query} />}

          {view === "activity" && <section className="admin-panel full">
            <header><div><small>AUDIT STREAM</small><h2>Recent platform activity</h2><p>Signup, billing and setup-request events across every kennel.</p></div></header>
            <div className="activity-timeline">{data.activity.filter((item) => matchesQuery([item.kennelName, item.type, item.title, item.status], query)).map((item) => <div key={item.id}><span className={"activity-dot " + (item.type === "Billing" ? "billing" : item.type === "Trial Signup" ? "trial" : "request")} /><p><b>{item.title}</b><small>{item.kennelName} · {item.type}</small></p><em className={"status " + stageClass(item.status)}>{item.status}</em><time>{dateTime(item.createdAt)}</time></div>)}</div>
          </section>}
        </div>
      </section>
    </main>
  );
}
