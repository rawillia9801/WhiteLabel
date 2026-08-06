"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Copy, Globe2 } from "lucide-react";

type DomainResult = {
  domain?: string;
  verified?: boolean;
  error?: string;
  dns?: { type: string; name: string; value: string };
  verification?: Array<{ type?: string; domain?: string; value?: string; reason?: string }>;
};

export default function DomainSettingsPage() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<DomainResult | null>(null);
  const [requestBusy, setRequestBusy] = useState(false);
  const [requestStatus, setRequestStatus] = useState("");

  async function requestBrandLaunch() {
    setRequestBusy(true);
    setRequestStatus("");
    try {
      const response = await fetch("/api/data", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          resource: "events",
          data: {
            title: "Setup request: Brand Launch",
            event_type: "Setup Request",
            event_date: new Date().toISOString().slice(0, 10),
            status: "Requested",
            notes: "$149 one-time. First-year registration of an available standard .com plus domain, DNS, and SSL configuration. Managed domain renewal is $29/year. Hosting and two branded business email addresses are separate at $17.95/month; premium domains are priced separately.",
          },
        }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to add the Brand Launch request.");
      setRequestStatus("Brand Launch was added to your setup requests. No payment was submitted.");
    } catch (error) {
      setRequestStatus(error instanceof Error ? error.message : "Unable to add the Brand Launch request.");
    } finally {
      setRequestBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/kennel/domain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ domain: form.get("domain") }),
      });
      const payload = (await response.json()) as DomainResult;
      if (!response.ok) throw new Error(payload.error || "Unable to connect domain.");
      setResult(payload);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : "Unable to connect domain." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="domain-settings">
      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #eef5f4; color: #17343b; }
        .domain-settings { min-height: 100vh; padding: 32px; font-family: var(--font-geist-sans), Arial, sans-serif; }
        .domain-wrap { width: min(760px, 100%); margin: auto; }
        .domain-back { display: inline-flex; gap: 7px; align-items: center; color: #075f69; font-weight: 800; text-decoration: none; }
        .domain-card { margin-top: 22px; padding: 34px; border: 1px solid #abc9c7; border-radius: 22px; background: #fff; box-shadow: 0 22px 65px rgba(25, 66, 72, .12); }
        .domain-icon { width: 52px; height: 52px; display: grid; place-items: center; border-radius: 15px; background: #dff3f0; color: #087f8c; }
        .domain-card h1 { margin: 18px 0 8px; color: #17343b; font-size: 36px; }
        .domain-card > p { color: #567179; line-height: 1.6; }
        .domain-card form { display: grid; gap: 10px; margin-top: 24px; }
        .domain-card label { font-weight: 850; }
        .domain-input { display: grid; grid-template-columns: auto 1fr; gap: 10px; align-items: center; padding: 0 14px; border: 1px solid #8fb2b0; border-radius: 12px; }
        .domain-input input { min-height: 50px; border: 0; outline: 0; color: #17343b; font: inherit; }
        .domain-card form > button { min-height: 49px; border: 0; border-radius: 12px; background: #087f8c; color: white; font-weight: 900; }
        .brand-launch { display: grid; gap: 13px; margin-top: 24px; padding: 20px; border: 1px solid #c8d9d4; border-radius: 16px; background: #f4faf8; }
        .brand-launch header { display: flex; align-items: baseline; justify-content: space-between; gap: 15px; }
        .brand-launch h2 { margin: 0; color: #17343b; font-size: 22px; }
        .brand-launch header strong { color: #87661f; white-space: nowrap; }
        .brand-launch p { margin: 0; color: #526f6b; line-height: 1.55; }
        .brand-launch ul { display: grid; gap: 7px; margin: 0; padding-left: 20px; color: #456661; font-size: 14px; }
        .brand-launch button { min-height: 45px; justify-self: start; padding: 0 16px; border: 0; border-radius: 10px; background: #087f8c; color: #fff; font-weight: 850; cursor: pointer; }
        .brand-launch button:disabled { opacity: .6; cursor: wait; }
        .brand-launch small { color: #476e62; line-height: 1.45; }
        .domain-result { margin-top: 20px; padding: 17px; border-radius: 14px; background: #edf8f4; color: #205645; }
        .domain-error { margin-top: 20px; padding: 17px; border-radius: 14px; background: #fff0ef; color: #8d302b; }
        .dns-row { display: grid; grid-template-columns: auto 1fr auto; gap: 9px; margin-top: 11px; padding: 12px; border: 1px solid #b7d2cd; border-radius: 10px; background: white; }
        .dns-row code { overflow: auto; }
        .dns-row button { border: 0; background: transparent; color: #087f8c; }
        .domain-note { margin-top: 18px; padding: 15px; border-left: 4px solid #c68b24; background: #fff8e9; color: #624c25; line-height: 1.55; }
      `}</style>
      <div className="domain-wrap">
        <Link className="domain-back" href="/"><ArrowLeft size={16} /> Back to kennel</Link>
        <section className="domain-card">
          <span className="domain-icon"><Globe2 /></span>
          <h1>Brand Launch & custom domain</h1>
          <p>Your included kennel address remains active at yourname.mydogportal.site. Brand Launch provides a professionally configured standard .com. Website hosting and business email are available separately.</p>
          <section className="brand-launch">
            <header><h2>Brand Launch</h2><strong>$149 one-time</strong></header>
            <p>Launch an available standard .com with registration, DNS, and SSL configuration handled for you.</p>
            <ul><li>First-year registration of an available standard .com</li><li>Domain, DNS, and SSL configuration</li><li>Managed domain renewal after the first year: $29/year</li><li>Hosting + two business email addresses available separately for $17.95/month</li><li>Premium domains priced separately</li></ul>
            <button type="button" onClick={() => void requestBrandLaunch()} disabled={requestBusy}>{requestBusy ? "Adding request…" : "Add Brand Launch to my setup"}</button>
            {requestStatus && <small role="status">{requestStatus}</small>}
          </section>
          <p>Already activated? Connect the domain below after registration or purchase is complete.</p>
          <form onSubmit={submit}>
            <label htmlFor="domain">Domain</label>
            <div className="domain-input"><Globe2 size={18} /><input id="domain" name="domain" placeholder="portal.yourkennel.com" required /></div>
            <button disabled={busy}>{busy ? "Checking domain…" : "Connect domain"}</button>
          </form>
          {result?.error && <div className="domain-error" role="alert">{result.error}</div>}
          {result && !result.error && (
            <div className="domain-result">
              <b>{result.verified ? <><CheckCircle2 size={16} /> Domain verified</> : "DNS setup required"}</b>
              {result.dns && (
                <div className="dns-row">
                  <strong>{result.dns.type}</strong>
                  <code>{result.dns.name} → {result.dns.value}</code>
                  <button onClick={() => navigator.clipboard.writeText(result.dns!.value)} aria-label="Copy DNS value"><Copy size={16} /></button>
                </div>
              )}
              {result.verification?.map((item, index) => (
                <div className="dns-row" key={index}><strong>{item.type}</strong><code>{item.domain} → {item.value}</code></div>
              ))}
            </div>
          )}
          <div className="domain-note">DNS changes can take time to propagate. The app will use the custom domain only after Vercel reports it verified.</div>
        </section>
      </div>
    </main>
  );
}
