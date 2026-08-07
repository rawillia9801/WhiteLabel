"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ExternalLink, Globe2, Mail, PhoneCall, ShieldCheck, Sparkles } from "lucide-react";
import "./billing.css";

type RecurringOffering = {
  key: string;
  group: "platform" | "service";
  name: string;
  description: string;
  price: string;
  interval: "month" | "year";
  setupFee: string | null;
  hasTrial: boolean;
  planId: string;
};
type OneTimeOffering = { key: string; name: string; description: string; price: string };
type BillingConfig = {
  clientId: string;
  environment: "live" | "sandbox";
  kennelId: string;
  currentPlan: string;
  recurring: RecurringOffering[];
  oneTime: OneTimeOffering[];
};
type PayPalButtons = { render: (target: HTMLElement) => Promise<void>; close?: () => Promise<void> };

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: {
        style?: Record<string, unknown>;
        createSubscription?: (_data: unknown, actions: { subscription: { create: (input: Record<string, unknown>) => Promise<string> } }) => Promise<string>;
        onApprove?: (data: { subscriptionID?: string }) => Promise<void>;
        onError?: (error: unknown) => void;
      }) => PayPalButtons;
    };
  }
}

const planCopy = {
  Starter: ["Breeder workspace", "Kennel subdomain", "Family Puppy Portals", "Core records and workflows"],
  Professional: ["Everything in Starter", "Complete breeder workflow", "Documents and automation", "Expanded business tools"],
  Studio: ["Everything in Professional", "Customizable breeder website", "Brand + domain launch package", "Business Voice + annual phone credits"],
} as const;

function dollars(value: string) {
  return "$" + Number(value).toLocaleString("en-US", { minimumFractionDigits: Number(value) % 1 ? 2 : 0, maximumFractionDigits: 2 });
}

function PayPalSubscriptionButton(props: {
  offering: RecurringOffering;
  kennelId: string;
  ready: boolean;
  label?: string;
  onApproved: (subscriptionId: string, offeringKey: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const { offering, kennelId, ready, onApproved, onError } = props;

  useEffect(() => {
    if (!ready || !host.current || !window.paypal) return;
    host.current.replaceChildren();
    const buttons = window.paypal.Buttons({
      style: { layout: "vertical", color: "gold", shape: "rect", label: "subscribe", height: 40 },
      createSubscription: (_data, actions) => actions.subscription.create({ plan_id: offering.planId, custom_id: kennelId }),
      onApprove: async (data) => {
        if (!data.subscriptionID) throw new Error("PayPal did not return a subscription ID.");
        await onApproved(data.subscriptionID, offering.key);
      },
      onError: (failure) => onError(failure instanceof Error ? failure.message : "PayPal checkout could not be completed."),
    });
    void buttons.render(host.current);
    return () => { void buttons.close?.(); };
  }, [kennelId, offering, onApproved, onError, ready]);

  return <div className="paypal-choice">{props.label && <small>{props.label}</small>}<div className="paypal-button-host" ref={host}>{!ready && <span>Loading secure PayPal checkout…</span>}</div></div>;
}

export default function BillingPage() {
  const [config, setConfig] = useState<BillingConfig | null>(null);
  const [billingCycle, setBillingCycle] = useState<"month" | "year">("month");
  const [sdkReady, setSdkReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const showError = useCallback((message: string) => setError(message), []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/paypal/catalog", { method: "POST", headers: { "content-type": "application/json" } });
        const payload = await response.json() as BillingConfig & { error?: string };
        if (!response.ok) throw new Error(payload.error || "Unable to initialize PayPal billing.");
        if (active) setConfig(payload);
      } catch (failure) {
        if (active) setError(failure instanceof Error ? failure.message : "Unable to initialize PayPal billing.");
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!config?.clientId) return;
    if (window.paypal) { setSdkReady(true); return; }
    const onLoad = () => setSdkReady(true);
    const onFailure = () => setError("The secure PayPal checkout could not load.");
    const existing = document.getElementById("paypal-subscriptions-sdk") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", onLoad);
      existing.addEventListener("error", onFailure);
      return () => { existing.removeEventListener("load", onLoad); existing.removeEventListener("error", onFailure); };
    }
    const script = document.createElement("script");
    script.id = "paypal-subscriptions-sdk";
    script.src = "https://www.paypal.com/sdk/js?client-id=" + encodeURIComponent(config.clientId) + "&components=buttons&currency=USD&vault=true&intent=subscription";
    script.async = true;
    script.addEventListener("load", onLoad);
    script.addEventListener("error", onFailure);
    document.head.appendChild(script);
    return () => { script.removeEventListener("load", onLoad); script.removeEventListener("error", onFailure); };
  }, [config?.clientId]);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    if (search.get("paypal_cancelled") === "1") {
      setNotice("PayPal checkout was cancelled. Nothing was charged.");
      window.history.replaceState({}, "", "/billing");
      return;
    }
    const orderId = search.get("token");
    if (search.get("paypal_capture") !== "1" || !orderId) return;
    setBusy(true);
    void (async () => {
      try {
        const response = await fetch("/api/paypal/orders/capture", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ order_id: orderId }),
        });
        const payload = await response.json() as { error?: string };
        if (!response.ok) throw new Error(payload.error || "Unable to complete PayPal purchase.");
        setNotice("Purchase complete. Your add-on is connected to this kennel.");
        window.history.replaceState({}, "", "/billing");
      } catch (failure) {
        setError(failure instanceof Error ? failure.message : "Unable to complete PayPal purchase.");
      } finally { setBusy(false); }
    })();
  }, []);

  const platformOfferings = useMemo(() => {
    if (!config) return [];
    return ["Starter", "Professional", "Studio"]
      .map((name) => config.recurring.find((offering) => offering.group === "platform" && offering.name === name && offering.interval === billingCycle))
      .filter(Boolean) as RecurringOffering[];
  }, [billingCycle, config]);

  const serviceOffering = useCallback((key: string) => config?.recurring.find((offering) => offering.key === key), [config]);

  const confirmSubscription = useCallback(async (subscriptionId: string, offeringKey: string) => {
    setError("");
    setNotice("Confirming your PayPal subscription…");
    const response = await fetch("/api/paypal/subscriptions/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ subscription_id: subscriptionId, offering_key: offeringKey }),
    });
    const payload = await response.json() as { error?: string };
    if (!response.ok) throw new Error(payload.error || "Unable to confirm the PayPal subscription.");
    setNotice("Subscription confirmed. Your MyDogPortal billing is now connected to this kennel.");
  }, []);

  const startOrder = useCallback(async (offeringKey: string) => {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/paypal/orders", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ offering_key: offeringKey }),
      });
      const payload = await response.json() as { approvalUrl?: string; error?: string };
      if (!response.ok || !payload.approvalUrl) throw new Error(payload.error || "Unable to start PayPal checkout.");
      window.location.assign(payload.approvalUrl);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to start PayPal checkout.");
      setBusy(false);
    }
  }, []);

  const welcome = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("welcome") === "1";
  const voiceMonthly = serviceOffering("business-voice-monthly");
  const voiceAnnual = serviceOffering("business-voice-annual");

  return (
    <main className="billing-page">
      <header className="billing-hero">
        <Link href="/"><ArrowLeft size={16} /> Back to MyDogPortal</Link>
        <span className="billing-kicker"><ShieldCheck size={15} /> SECURE PAYPAL BILLING</span>
        <h1>{welcome ? "Your kennel is ready. Choose your plan." : "Plans & breeder services"}</h1>
        <p>Subscriptions and add-ons are connected directly to your kennel. MyDogPortal never receives your PayPal password or card details.</p>
        <div className="trial-promise"><Sparkles size={18} /><div><b>Every MyDogPortal software plan starts with 14 days free.</b><span>The $0 trial is built into the PayPal billing plan. Your recurring charge starts after the trial unless you cancel first.</span></div></div>
      </header>

      <section className="billing-shell">
        {error && <div className="billing-alert error" role="alert">{error}</div>}
        {notice && <div className="billing-alert success" role="status">{notice}</div>}
        {!config && !error && <div className="billing-loading">Preparing your secure PayPal checkout…</div>}

        {config && <>
          <section className="plan-section" aria-labelledby="plans-heading">
            <div className="section-heading">
              <div><small>MYDOGPORTAL SUBSCRIPTIONS</small><h2 id="plans-heading">Choose the operating system behind your kennel</h2></div>
              <div className="cycle-toggle" role="group" aria-label="Billing cycle">
                <button type="button" className={billingCycle === "month" ? "active" : ""} onClick={() => setBillingCycle("month")}>Monthly</button>
                <button type="button" className={billingCycle === "year" ? "active" : ""} onClick={() => setBillingCycle("year")}>Annual · 2 months free</button>
              </div>
            </div>
            <div className="billing-plan-grid">
              {platformOfferings.map((offering) => (
                <article className={offering.name === "Professional" ? "popular" : offering.name === "Studio" ? "studio" : ""} key={offering.key}>
                  {offering.name === "Professional" && <em>MOST POPULAR</em>}
                  <small>{offering.name === "Starter" ? "GET ORGANIZED" : offering.name === "Professional" ? "RUN YOUR BREEDING BUSINESS" : "RUN YOUR BUSINESS + YOUR BRAND"}</small>
                  <h3>{offering.name}</h3>
                  <div className="plan-price"><b>{dollars(offering.price)}</b><span>/{offering.interval}</span></div>
                  <div className="trial-chip">14 DAYS FREE · THEN {dollars(offering.price).toUpperCase()}/{offering.interval.toUpperCase()}</div>
                  {offering.name === "Studio" && <div className="studio-value">Over $1,100.00 Added Value · Prices Locked In</div>}
                  <ul>{planCopy[offering.name as keyof typeof planCopy].map((item) => <li key={item}><Check size={14} />{item}</li>)}</ul>
                  <PayPalSubscriptionButton offering={offering} kennelId={config.kennelId} ready={sdkReady} onApproved={confirmSubscription} onError={showError} />
                </article>
              ))}
            </div>
          </section>

          <section className="addon-section" aria-labelledby="addons-heading">
            <div className="section-heading"><div><small>À-LA-CARTE BREEDER SERVICES</small><h2 id="addons-heading">Add only what your kennel needs</h2><p>These are standalone services. The prices below are the actual add-on prices—not “value” figures.</p></div></div>
            <div className="addon-grid">
              {serviceOffering("hosting-monthly") && <article><span><Mail size={20} /></span><h3>Website Hosting + Business Email</h3><strong>$17.95/month</strong><p>Dog-breeder website hosting, SSL, two branded business email addresses, and basic hosting/email support. No MyDogPortal software subscription included.</p><PayPalSubscriptionButton offering={serviceOffering("hosting-monthly")!} kennelId={config.kennelId} ready={sdkReady} onApproved={confirmSubscription} onError={showError} /></article>}
              {serviceOffering("brand-launch-renewal") && <article><span><Globe2 size={20} /></span><h3>Brand Launch</h3><strong>$149 setup · then $29/year</strong><p>Standard .com registration, DNS and SSL setup. The first year is covered at launch; managed standard .com renewal begins after year one.</p><PayPalSubscriptionButton offering={serviceOffering("brand-launch-renewal")!} kennelId={config.kennelId} ready={sdkReady} onApproved={confirmSubscription} onError={showError} /></article>}
              {config.oneTime.find((item) => item.key === "website-personalization") && <article><span><Sparkles size={20} /></span><h3>Breeder Website Personalization</h3><strong>$299 one-time</strong><p>Personalize a supported MyDogPortal website style with your kennel identity, colors, photography, and content.</p><button className="order-button" type="button" disabled={busy} onClick={() => void startOrder("website-personalization")}>Buy securely with PayPal <ExternalLink size={14} /></button></article>}
              <article><span><Globe2 size={20} /></span><h3>Custom Breeder Website</h3><strong>From $749 · Quote only</strong><p>Custom layout, page planning, branding, photography and content implementation. Final scope is confirmed before work begins.</p><Link className="quote-button" href="/signup#account-form">Request a custom website quote</Link></article>
              {voiceMonthly && voiceAnnual && <article><span><PhoneCall size={20} /></span><h3>Business Voice</h3><strong>$69 setup + local number</strong><p>Custom IVR/menu, business hours, voicemail and routing. Metered calls are billed separately.</p><PayPalSubscriptionButton label="$8.99/month" offering={voiceMonthly} kennelId={config.kennelId} ready={sdkReady} onApproved={confirmSubscription} onError={showError} /><PayPalSubscriptionButton label="$99/year" offering={voiceAnnual} kennelId={config.kennelId} ready={sdkReady} onApproved={confirmSubscription} onError={showError} /></article>}
            </div>
            <p className="billing-footnote">SMS is not offered. Premium domains and metered voice usage are separate where applicable.</p>
          </section>
        </>}
      </section>
    </main>
  );
}
