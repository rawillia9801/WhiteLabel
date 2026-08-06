"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Download, FileSignature, ListFilter, RefreshCw, Search, Settings2, ShieldCheck } from "lucide-react";
import { ApplicationBuilder } from "../../components/application-builder";
import { applicationAnswerByMapping, defaultApplicationFormConfig, readApplicationRecord, type ApplicationFormConfig } from "../../lib/application-form";

type Buyer = { id: number; first_name: string; last_name: string; email: string; phone: string | null; city: string | null; state: string | null; postal_code?: string | null; application_status: string; preferred_sex: string | null; preferred_color: string | null; notes: string | null };
type Puppy = { id: number; buyer_id: number | null; name: string; sex: string | null; color: string | null; birth_date: string | null; price_cents: number | null; status: string };
type DataSet = { buyers: Buyer[]; puppies: Puppy[] };

const fullName = (buyer: Buyer) => [buyer.first_name, buyer.last_name].filter(Boolean).join(" ") || buyer.email || `Buyer #${buyer.id}`;
const money = (cents: number | null | undefined) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((cents ?? 0) / 100);
const today = () => new Date().toISOString().slice(0, 10);

export default function ApplicationsPage() {
  const [data, setData] = useState<DataSet>({ buyers: [], puppies: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [query, setQuery] = useState("");
  const [answerField, setAnswerField] = useState("");
  const [answerValue, setAnswerValue] = useState("");
  const [mode, setMode] = useState<"inbox" | "builder">("inbox");
  const [applicationConfig, setApplicationConfig] = useState<ApplicationFormConfig>(defaultApplicationFormConfig);
  const [selectedBuyerId, setSelectedBuyerId] = useState<number | null>(null);
  const [showAgreement, setShowAgreement] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const [response, configResponse] = await Promise.all([
        fetch("/api/data", { cache: "no-store" }),
        fetch("/api/applications/config", { cache: "no-store" }),
      ]);
      const [payload, formConfig] = await Promise.all([
        response.json() as Promise<DataSet & { error?: string }>,
        configResponse.json() as Promise<ApplicationFormConfig & { error?: string }>,
      ]);
      if (!response.ok) throw new Error(payload.error || "Unable to load applications.");
      if (!configResponse.ok) throw new Error(formConfig.error || "Unable to load the application builder.");
      setData({ buyers: payload.buyers ?? [], puppies: payload.puppies ?? [] });
      setApplicationConfig(formConfig);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to load applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(""), 2800); return () => window.clearTimeout(timer); }, [toast]);

  const buyers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const answerNeedle = answerValue.trim().toLowerCase();
    return [...data.buyers]
      .filter((buyer) => {
        const record = readApplicationRecord(buyer.notes);
        const allAnswers = record ? Object.values(record.answers).map(String).join(" ") : "";
        const matchesSearch = !needle || `${fullName(buyer)} ${buyer.email} ${buyer.phone ?? ""} ${buyer.application_status} ${allAnswers}`.toLowerCase().includes(needle);
        const fieldAnswer = answerField && record ? String(record.answers[answerField] ?? "").toLowerCase() : "";
        return matchesSearch && (!answerField || !answerNeedle || fieldAnswer.includes(answerNeedle));
      })
      .sort((left, right) => {
        const priority = (status: string) => status === "Approved" ? 2 : ["Declined", "Archived"].includes(status) ? 3 : 1;
        return priority(left.application_status) - priority(right.application_status) || fullName(left).localeCompare(fullName(right));
      });
  }, [answerField, answerValue, data.buyers, query]);

  const selectedBuyer = data.buyers.find((buyer) => buyer.id === selectedBuyerId) ?? null;
  const buyerPuppies = selectedBuyer ? data.puppies.filter((puppy) => puppy.buyer_id === selectedBuyer.id) : [];
  const selectedApplication = readApplicationRecord(selectedBuyer?.notes);
  const coBuyerFromApplication = applicationAnswerByMapping(selectedApplication, "co_buyer_name");
  const streetFromApplication = applicationAnswerByMapping(selectedApplication, "buyer_street_address");
  const selectedFilterField = applicationConfig.fields.find((field) => field.key === answerField);
  const agreementHref = selectedBuyer && buyerPuppies[0]
    ? `/forms/bill-of-sale-health-guarantee?buyer_id=${selectedBuyer.id}&puppy_id=${buyerPuppies[0].id}`
    : "";

  async function approve(buyer: Buyer) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/buyers/${buyer.id}/approve`, { method: "POST" });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to approve the application.");
      setToast(`${fullName(buyer)} approved`);
      setSelectedBuyerId(buyer.id);
      await load();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to approve the application.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(buyer: Buyer, status: string) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/data", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ resource: "buyers", id: buyer.id, data: { application_status: status } }) });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to update the application.");
      setToast(`Application marked ${status}`);
      await load();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to update the application.");
    } finally {
      setSaving(false);
    }
  }

  async function createAgreement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedBuyer) return;
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form.entries()) as Record<string, unknown>;
    values.buyer_id = selectedBuyer.id;
    values.autopay_required = form.get("autopay_required") === "on";
    try {
      const response = await fetch("/api/payment-agreements", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(values) });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to create the payment agreement.");
      setShowAgreement(false);
      setToast("Payment agreement created and saved to the buyer vault");
      await load();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to create the payment agreement.");
    } finally {
      setSaving(false);
    }
  }

  return <main className="applications-page">
    <style jsx global>{`
      body { margin: 0; background: #eef4f2; color: #183536; }
      * { box-sizing: border-box; }
      button, input, select, textarea { font: inherit; }
      .applications-page { min-height: 100vh; padding: 28px; font-family: var(--font-geist-sans), Arial, sans-serif; }
      .applications-shell { width: min(1320px, 100%); margin: 0 auto; }
      .applications-head { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 22px; }
      .applications-head > div { display: grid; gap: 5px; }
      .applications-head small { color: #597373; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
      .applications-head h1 { margin: 0; font-size: clamp(28px, 4vw, 46px); letter-spacing: -.04em; }
      .applications-head p { margin: 0; color: #637a7a; }
      .back-link { display: inline-flex; align-items: center; gap: 8px; padding: 11px 14px; border: 1px solid #b8cfca; border-radius: 10px; background: white; color: #24565b; text-decoration: none; font-weight: 750; }
      .application-modes { display: inline-flex; gap: 5px; margin-bottom: 16px; padding: 5px; border: 1px solid #bfd2ce; border-radius: 11px; background: #e7efec; }
      .application-modes button { min-height: 38px; display: inline-flex; align-items: center; gap: 7px; padding: 0 13px; border: 0; border-radius: 8px; background: transparent; color: #52706a; font-weight: 800; cursor: pointer; }
      .application-modes button.active { background: #fff; color: #1e5552; box-shadow: 0 5px 14px rgba(25,66,61,.08); }
      .applications-tools { display: flex; gap: 12px; margin-bottom: 18px; }
      .applications-search { flex: 1; display: flex; align-items: center; gap: 10px; padding: 0 14px; border: 1px solid #bfd2ce; border-radius: 12px; background: white; }
      .applications-search input { width: 100%; height: 46px; border: 0; outline: 0; background: transparent; }
      .answer-filter { min-width: 390px; display: grid; grid-template-columns: minmax(150px,.9fr) minmax(150px,1.1fr); gap: 7px; }
      .answer-filter label { display: flex; align-items: center; gap: 7px; min-width: 0; padding: 0 10px; border: 1px solid #bfd2ce; border-radius: 11px; background: white; color: #54716b; }
      .answer-filter select, .answer-filter input { width: 100%; min-width: 0; height: 44px; border: 0; outline: 0; background: transparent; color: #274d48; font-size: 11px; }
      .refresh { min-width: 46px; border: 1px solid #bfd2ce; border-radius: 12px; background: white; color: #24565b; cursor: pointer; }
      .applications-grid { display: grid; grid-template-columns: minmax(0, 1fr) 390px; gap: 18px; align-items: start; }
      .applications-panel { border: 1px solid #bdd0cc; border-radius: 16px; background: rgba(255,255,255,.93); box-shadow: 0 16px 45px rgba(36,79,78,.08); overflow: hidden; }
      .panel-title { padding: 18px 20px; border-bottom: 1px solid #d6e3df; background: #f8fbfa; }
      .panel-title span { display: block; margin-bottom: 4px; color: #57807a; font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
      .panel-title h2 { margin: 0; font-size: 20px; }
      .application-list { display: grid; }
      .application-card { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 14px; padding: 17px 20px; border-bottom: 1px solid #e0e9e6; }
      .application-card:last-child { border-bottom: 0; }
      .application-main { min-width: 0; border: 0; background: transparent; text-align: left; cursor: pointer; }
      .application-main b { display: block; margin-bottom: 5px; font-size: 16px; }
      .application-main small { display: block; overflow: hidden; color: #6d8381; text-overflow: ellipsis; white-space: nowrap; }
      .application-actions { display: flex; align-items: center; gap: 8px; }
      .application-actions button, .detail-actions button { min-height: 36px; padding: 0 11px; border: 1px solid #b8cfca; border-radius: 8px; background: white; color: #285b5f; font-weight: 750; cursor: pointer; }
      .application-actions .approve, .detail-actions .primary { border-color: #227d68; background: #227d68; color: white; }
      .status { display: inline-flex; width: fit-content; padding: 5px 8px; border-radius: 999px; background: #edf2f1; color: #58706e; font-size: 11px; font-weight: 800; }
      .status.approved { background: #e2f5ec; color: #187052; }
      .detail-body { display: grid; gap: 16px; padding: 20px; }
      .detail-body dl { display: grid; grid-template-columns: 115px minmax(0,1fr); gap: 10px 12px; margin: 0; }
      .detail-body dt { color: #718482; font-size: 12px; font-weight: 750; }
      .detail-body dd { margin: 0; overflow-wrap: anywhere; font-weight: 650; }
      .detail-actions { display: grid; gap: 9px; }
      .detail-actions button { min-height: 42px; }
      .detail-actions a { min-height: 42px; display: inline-flex; align-items: center; justify-content: center; gap: 7px; border: 1px solid #227d68; border-radius: 8px; background: #f3faf7; color: #22705e; font-weight: 800; text-decoration: none; }
      .application-answers { display: grid; gap: 9px; padding-top: 14px; border-top: 1px solid #dbe4e0; }
      .application-answers > header small { color: #628079; font-size: 9px; font-weight: 900; letter-spacing: .11em; }
      .application-answers > header h3 { margin: 3px 0 0; font-size: 16px; }
      .application-answer { display: grid; gap: 4px; padding: 10px 11px; border: 1px solid #dbe4e0; border-radius: 9px; background: #fafbf8; }
      .application-answer small { color: #71837f; font-size: 9px; font-weight: 800; }
      .application-answer b { color: #2b504a; font-size: 11px; line-height: 1.45; white-space: pre-wrap; }
      .application-builder-layout { display: grid; grid-template-columns: minmax(0,1fr) 360px; gap: 18px; align-items: start; }
      .builder-title { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
      .builder-title > div { min-width: 0; }
      .builder-title p { margin: 5px 0 0; color: #6a7f7a; font-size: 11px; line-height: 1.5; }
      .builder-save,.builder-footer button,.install-card button { min-height: 39px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 0 12px; border: 1px solid #227d68; border-radius: 8px; background: #227d68; color: #fff; font-size: 10px; font-weight: 850; cursor: pointer; white-space: nowrap; }
      .builder-settings { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 18px 20px; border-bottom: 1px solid #dce5e1; }
      .builder-settings label,.builder-field-grid label { display: grid; gap: 5px; color: #54706a; font-size: 9px; font-weight: 820; }
      .builder-settings .wide,.builder-field-grid .wide { grid-column: 1/-1; }
      .builder-settings input,.builder-settings textarea,.builder-field-grid input,.builder-field-grid select { width: 100%; min-height: 38px; padding: 7px 9px; border: 1px solid #c7d6d0; border-radius: 7px; outline: 0; background: #fff; color: #244a45; font: inherit; font-size: 10px; }
      .builder-fields { display: grid; gap: 10px; padding: 14px; background: #f4f7f4; }
      .builder-field { overflow: hidden; border: 1px solid #d1ddd8; border-radius: 11px; background: #fff; }
      .builder-field > header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 11px 13px; border-bottom: 1px solid #e2e8e4; background: #fbfcf9; }
      .builder-field > header > div:first-child { min-width: 0; display: grid; gap: 2px; }
      .builder-field > header small { color: #7a8c87; font-size: 7px; font-weight: 900; letter-spacing: .1em; }
      .builder-field > header b { overflow: hidden; color: #294c46; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
      .builder-field > header > div:last-child { display: flex; gap: 4px; }
      .builder-field > header button { width: 30px; height: 30px; display: grid; place-items: center; border: 1px solid #d2ded9; border-radius: 7px; background: #fff; color: #5b746e; cursor: pointer; }
      .builder-field > header button:disabled { opacity: .35; cursor: not-allowed; }
      .builder-field-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 9px; padding: 13px; }
      .builder-required { align-self: end; min-height: 38px; display: flex!important; align-items: center; gap: 7px!important; padding: 0 9px; border: 1px solid #d5e0db; border-radius: 7px; background: #fafbf8; }
      .builder-required input { width: 15px!important; min-height: 15px!important; padding: 0!important; }
      .builder-footer { display: flex; align-items: center; justify-content: space-between; gap: 15px; padding: 15px 20px; border-top: 1px solid #d8e2de; }
      .builder-footer span { color: #6a807a; font-size: 9px; }
      .builder-message { margin: 0 20px 20px; padding: 11px 13px; border-radius: 8px; background: #edf7f2; color: #28624f; font-size: 10px; font-weight: 760; }
      .install-body { display: grid; gap: 11px; padding: 14px; }
      .install-card { display: grid; gap: 9px; padding: 14px; border: 1px solid #d6e1dc; border-radius: 10px; background: #fafbf8; }
      .install-card>small { color: #648078; font-size: 8px; font-weight: 900; letter-spacing: .1em; }
      .install-card>a { display: flex; align-items: center; gap: 5px; overflow-wrap: anywhere; color: #176b64; font-size: 10px; font-weight: 800; }
      .install-card p { margin: 0; color: #667d76; font-size: 10px; line-height: 1.55; }
      .install-card textarea { width: 100%; padding: 9px; border: 1px solid #ccd9d4; border-radius: 7px; background: #fff; color: #365953; font-family: var(--font-geist-mono),monospace; font-size: 8px; line-height: 1.5; resize: vertical; }
      .install-flow ol { display: grid; gap: 8px; margin: 0; padding-left: 19px; color: #42635c; font-size: 10px; line-height: 1.45; }
      .error { margin-bottom: 16px; padding: 13px 15px; border: 1px solid #e3aaa3; border-radius: 10px; background: #fff0ee; color: #8d332c; font-weight: 700; }
      .toast { position: fixed; right: 24px; bottom: 24px; z-index: 50; padding: 13px 16px; border-radius: 10px; background: #183f3e; color: white; box-shadow: 0 10px 30px rgba(0,0,0,.2); }
      .empty { padding: 36px 22px; color: #6c8380; text-align: center; }
      .agreement-backdrop { position: fixed; inset: 0; z-index: 40; display: grid; place-items: center; padding: 22px; background: rgba(16,41,40,.58); }
      .agreement-modal { width: min(980px, 100%); max-height: calc(100vh - 44px); overflow: auto; border-radius: 17px; background: white; box-shadow: 0 24px 80px rgba(0,0,0,.28); }
      .agreement-modal header { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 20px; border-bottom: 1px solid #d6e3df; background: #f8fbfa; }
      .agreement-modal header h2 { margin: 0; }
      .agreement-modal header button { border: 1px solid #b8cfca; border-radius: 8px; background: white; padding: 9px 12px; cursor: pointer; }
      .agreement-form { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 14px; padding: 20px; }
      .agreement-form label { display: grid; gap: 6px; color: #496764; font-size: 12px; font-weight: 750; }
      .agreement-form input, .agreement-form select, .agreement-form textarea { width: 100%; min-height: 42px; padding: 9px 10px; border: 1px solid #bdd0cc; border-radius: 8px; background: #fbfdfc; color: #183536; }
      .agreement-form .wide { grid-column: 1 / -1; }
      .agreement-form .check { display: flex; align-items: center; gap: 9px; }
      .agreement-form .check input { width: 18px; min-height: 18px; }
      .agreement-form footer { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 10px; padding-top: 8px; }
      .agreement-form footer button { min-height: 43px; padding: 0 15px; border: 1px solid #b8cfca; border-radius: 9px; background: white; color: #285b5f; font-weight: 800; cursor: pointer; }
      .agreement-form footer .primary { border-color: #227d68; background: #227d68; color: white; }
      @media (max-width: 1050px) { .application-builder-layout { grid-template-columns: 1fr; } .answer-filter { min-width: 320px; } }
      @media (max-width: 900px) { .applications-grid { grid-template-columns: 1fr; } .applications-head { align-items: flex-start; flex-direction: column-reverse; } .applications-tools { flex-wrap: wrap; } .applications-search { min-width: 100%; } .answer-filter { flex:1; } }
      @media (max-width: 650px) { .applications-page { padding: 16px; } .application-card { grid-template-columns: 1fr; } .application-actions { flex-wrap: wrap; } .agreement-form,.builder-settings,.builder-field-grid { grid-template-columns: 1fr; } .agreement-form .wide,.builder-settings .wide,.builder-field-grid .wide { grid-column: auto; } .answer-filter { min-width: 100%; grid-template-columns: 1fr; } .builder-title { align-items: flex-start; flex-direction: column; } .builder-save { width: 100%; } }
    `}</style>
    <div className="applications-shell">
      <div className="applications-head">
        <div><small>Buyer workflow</small><h1>Applications & Agreements</h1><p>Build your application, publish it on your website, review answers, then prepare documents after approval.</p></div>
        <Link className="back-link" href="/"><ArrowLeft size={17} /> Back to Breeder Portal</Link>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="application-modes" aria-label="Application workspace"><button type="button" className={mode === "inbox" ? "active" : ""} onClick={() => setMode("inbox")}><ListFilter size={15} /> Application inbox</button><button type="button" className={mode === "builder" ? "active" : ""} onClick={() => setMode("builder")}><Settings2 size={15} /> Builder + website embed</button></div>
      {mode === "builder" ? <ApplicationBuilder key={applicationConfig.updatedAt || applicationConfig.title} config={applicationConfig} onSaved={(config) => { setApplicationConfig(config); setToast("Application builder saved"); }} /> : <>
      <div className="applications-tools"><label className="applications-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search applicants and every application answer..." /></label><div className="answer-filter"><label><ListFilter size={15} /><select value={answerField} onChange={(event) => { setAnswerField(event.target.value); setAnswerValue(""); }} aria-label="Filter by application question"><option value="">Filter by answer…</option>{applicationConfig.fields.map((field) => <option key={field.key} value={field.key}>{field.section}: {field.label}</option>)}</select></label>{answerField && (selectedFilterField?.type === "select" || selectedFilterField?.type === "radio") ? <label><select value={answerValue} onChange={(event) => setAnswerValue(event.target.value)} aria-label="Choose answer"><option value="">Any answer</option>{selectedFilterField.options.map((option) => <option key={option}>{option}</option>)}</select></label> : answerField ? <label><input value={answerValue} onChange={(event) => setAnswerValue(event.target.value)} placeholder="Answer contains…" aria-label="Answer contains" /></label> : null}</div><a className="back-link" href="/api/templates/puppy-application"><Download size={16} /> PDF template</a><button className="refresh" onClick={() => void load()} title="Refresh"><RefreshCw size={18} /></button></div>
      <div className="applications-grid">
        <section className="applications-panel"><div className="panel-title"><span>Application queue</span><h2>{buyers.length} families</h2></div>{loading ? <div className="empty">Loading applications...</div> : buyers.length ? <div className="application-list">{buyers.map((buyer) => <article className="application-card" key={buyer.id}><button className="application-main" onClick={() => setSelectedBuyerId(buyer.id)}><b>{fullName(buyer)}</b><small>{[buyer.email, buyer.phone, buyer.city, buyer.state].filter(Boolean).join(" • ") || "No contact information"}</small><span className={`status ${buyer.application_status === "Approved" ? "approved" : ""}`}>{buyer.application_status || "New"}</span></button><div className="application-actions">{buyer.application_status !== "Approved" && <button className="approve" disabled={saving} onClick={() => void approve(buyer)}><CheckCircle2 size={15} /> Approve</button>}<button onClick={() => setSelectedBuyerId(buyer.id)}>Review</button></div></article>)}</div> : <div className="empty">No applications found.</div>}</section>
        <aside className="applications-panel"><div className="panel-title"><span>Selected family</span><h2>{selectedBuyer ? fullName(selectedBuyer) : "Choose an applicant"}</h2></div>{selectedBuyer ? <div className="detail-body"><dl><dt>Status</dt><dd><span className={`status ${selectedBuyer.application_status === "Approved" ? "approved" : ""}`}>{selectedBuyer.application_status}</span></dd><dt>Email</dt><dd>{selectedBuyer.email || "Not recorded"}</dd><dt>Phone</dt><dd>{selectedBuyer.phone || "Not recorded"}</dd><dt>Location</dt><dd>{[selectedBuyer.city, selectedBuyer.state, selectedBuyer.postal_code].filter(Boolean).join(", ") || "Not recorded"}</dd><dt>Preferences</dt><dd>{[selectedBuyer.preferred_sex, selectedBuyer.preferred_color].filter(Boolean).join(" / ") || "Not recorded"}</dd><dt>Assigned puppy</dt><dd>{buyerPuppies.length ? buyerPuppies.map((puppy) => `${puppy.name} (${money(puppy.price_cents)})`).join(", ") : "No puppy assigned"}</dd>{!selectedApplication && <><dt>Notes</dt><dd>{selectedBuyer.notes || "No notes"}</dd></>}</dl>{selectedApplication && <section className="application-answers"><header><small>SUBMITTED ANSWERS</small><h3>{selectedApplication.formTitle}</h3></header>{selectedApplication.fields.map((field) => { const value = selectedApplication.answers[field.key]; return <div className="application-answer" key={field.key}><small>{field.section} · {field.label}{field.mapping !== "none" ? " · mapped to documents" : ""}</small><b>{typeof value === "boolean" ? (value ? "Yes" : "No") : String(value || "Not answered")}</b></div>; })}</section>}<div className="detail-actions">{selectedBuyer.application_status !== "Approved" && <button className="primary" disabled={saving} onClick={() => void approve(selectedBuyer)}><ShieldCheck size={16} /> Approve application</button>}<button disabled={saving} onClick={() => void changeStatus(selectedBuyer, "Wait list")}>Move to wait list</button><button disabled={saving} onClick={() => void changeStatus(selectedBuyer, "Declined")}>Decline application</button>{selectedBuyer.application_status === "Approved" && buyerPuppies.length ? <Link href={agreementHref}><FileSignature size={16} /> Prepare Bill of Sale + Health Guarantee</Link> : <button disabled><FileSignature size={16} /> {selectedBuyer.application_status !== "Approved" ? "Approve before preparing documents" : "Assign a puppy before preparing documents"}</button>}<button className="primary" disabled={saving || selectedBuyer.application_status !== "Approved"} onClick={() => setShowAgreement(true)}><FileSignature size={16} /> Create payment agreement</button></div></div> : <div className="empty">Select a family to review the record and take action.</div>}</aside>
      </div>
      </>}
    </div>
    {toast && <div className="toast">{toast}</div>}
    {showAgreement && selectedBuyer && <div className="agreement-backdrop"><div className="agreement-modal"><header><div><small>Approved family</small><h2>Payment agreement for {fullName(selectedBuyer)}</h2></div><button onClick={() => setShowAgreement(false)}>Close</button></header><form className="agreement-form" onSubmit={createAgreement}>
      <label><span>Plan name</span><input name="plan_name" defaultValue={`Payment Agreement - ${fullName(selectedBuyer)}`} required /></label>
      <label><span>Puppy</span><select name="puppy_id" defaultValue={buyerPuppies[0]?.id ?? ""}><option value="">Not yet assigned</option>{buyerPuppies.map((puppy) => <option key={puppy.id} value={puppy.id}>{puppy.name} — {money(puppy.price_cents)}</option>)}</select></label>
      <label><span>Plan type</span><select name="plan_type" defaultValue="Post-transfer financing"><option>Pre-transfer purchase plan</option><option>Post-transfer financing</option></select></label>
      <label><span>Payment processor</span><select name="processor" defaultValue="Good Dog"><option>Good Dog</option><option>Card/ACH processor</option><option>Other approved processor</option></select></label>
      <label><span>Co-buyer / borrower</span><input name="co_buyer_name" defaultValue={coBuyerFromApplication} /></label>
      <label><span>Billing address</span><input name="billing_address" defaultValue={[streetFromApplication, [selectedBuyer.city, selectedBuyer.state, selectedBuyer.postal_code].filter(Boolean).join(", ")].filter(Boolean).join(", ")} /></label>
      <label><span>Registry</span><select name="registry" defaultValue="AKC"><option>AKC</option><option>CKC</option><option>ACA</option><option>Not yet determined</option></select></label>
      <label><span>Planned transfer date</span><input name="planned_transfer_date" type="date" /></label>
      <label><span>Cash price of puppy</span><input name="cash_price" type="number" min="0" step="0.01" defaultValue={(buyerPuppies[0]?.price_cents ?? 0) / 100} required /></label>
      <label><span>Sales tax, if applicable</span><input name="sales_tax" type="number" min="0" step="0.01" defaultValue="0" /></label>
      <label><span>Transport / delivery</span><input name="transport" type="number" min="0" step="0.01" defaultValue="0" /></label>
      <label><span>Other purchase charges</span><input name="other_charges" type="number" min="0" step="0.01" defaultValue="0" /></label>
      <label><span>Reservation deposit credit</span><input name="deposit_credit" type="number" min="0" step="0.01" defaultValue="0" /></label>
      <label><span>Additional down payment</span><input name="down_payment" type="number" min="0" step="0.01" defaultValue="0" /></label>
      <label><span>Other credit</span><input name="other_credit" type="number" min="0" step="0.01" defaultValue="0" /></label>
      <label><span>APR</span><input name="apr" type="number" min="0" step="0.01" defaultValue="0" required /></label>
      <label><span>Finance charge</span><input name="finance_charge" type="number" min="0" step="0.01" defaultValue="0" required /></label>
      <label><span>Number of installments</span><input name="installment_count" type="number" min="1" max="60" defaultValue="6" required /></label>
      <label><span>Installment amount</span><input name="installment_amount" type="number" min="0.01" step="0.01" required /></label>
      <label><span>Payment frequency</span><select name="frequency" defaultValue="Monthly"><option>Weekly</option><option>Biweekly</option><option>Monthly</option></select></label>
      <label><span>First payment due</span><input name="first_due_date" type="date" defaultValue={today()} required /></label>
      <label><span>Final payment due</span><input name="final_due_date" type="date" required /></label>
      <label><span>Monthly admin fee</span><input name="monthly_admin_fee" type="number" min="0" step="0.01" defaultValue="0" /></label>
      <label><span>Late fee</span><input name="late_fee" type="number" min="0" step="0.01" defaultValue="0" /></label>
      <label><span>Grace period in days</span><input name="grace_days" type="number" min="0" defaultValue="0" /></label>
      <label><span>Returned-payment fee</span><input name="returned_payment_fee" type="number" min="0" step="0.01" defaultValue="0" /></label>
      <label><span>On-time payment credit</span><input name="on_time_credit" type="number" min="0" step="0.01" defaultValue="0" /></label>
      <label className="check"><input name="autopay_required" type="checkbox" defaultChecked /><span>Autopay required</span></label>
      <label className="wide"><span>Additional written terms or conditions</span><textarea name="notes" rows={4} placeholder="Only add terms that have been reviewed and agreed to." /></label>
      <footer><button type="button" onClick={() => setShowAgreement(false)}>Cancel</button><button className="primary" disabled={saving}>{saving ? "Creating..." : "Create and save agreement"}</button></footer>
    </form></div></div>}
  </main>;
}
