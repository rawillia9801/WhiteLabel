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
  currentSubscriptionId: string;
  currentOfferingKey: string;
  founding: { limit: number; claimed: number; remaining: number; available: boolean; eligible: boolean };
  recurring: RecurringOffering[];
  changes: RecurringOffering[];
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
  Starter: [
    "Private breeder workspace + kennel subdomain",
    "Dogs, litters, puppies, applications, and families",
    "Puppy health, growth, vaccinations, and care records",
    "Private family Puppy Portals",
    "Deposits, balances, payment history, and core calendar",
  ],
  Professional: [
    "Everything in Starter",
    "Pedigrees, COI, common ancestors, and planned matings",
    "Heat cycles, progesterone, due dates, and pregnancy tracking",
    "Whelping Mode, newborn records, daily weights, and warnings",
    "Waitlist and puppy-picking workflow",
    "Complete DogBreederDocs editable packet + e-signatures",
    "Automated application, payment, milestone, and breeder workflows",
  ],
  Studio: [
    "Everything in Professional",
    "Five customizable breeder website starting points",
    "BreederWeb Designer + connected puppy/litter publishing",
    "Standard .com launch and managed renewal",
    "Managed website service + two branded business emails",
    "Business Voice + custom IVR + annual phone credits",
  ],
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
  const [welcome, setWelcome] = useState(false);
  const [required, setRequired] = useState(false);
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
    if (window.paypal) {
      const readyTimer = window.setTimeout(() => setSdkReady(true), 0);
      return () => window.clearTimeout(readyTimer);
    }
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
    const timer = window.setTimeout(() => {
      const search = new URLSearchParams(window.location.search);
      setWelcome(search.get("welcome") === "1");
      setRequired(search.get("required") === "1");
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
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const platformOfferings = useMemo(() => {
    if (!config) return [];
    const source = config.currentSubscriptionId ? config.changes : config.recurring;
    return ["Starter", "Professional", "Studio"]
      .map((name) => source.find((offering) => offering.group === "platform" && offering.name === name && offering.interval === billingCycle))
      .filter(Boolean) as RecurringOffering[];
  }, [billingCycle, config]);

  const currentPlanName = config?.currentPlan === "custom_domain" ? "Studio" : config?.currentPlan === "professional" ? "Professional" : "Starter";
  const planRank = (name: string) => name === "Studio" ? 3 : name === "Professional" ? 2 : 1;

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
    if (/(starter|professional|studio)-(monthly|annual)$/.test(offeringKey)) {
      window.setTimeout(() => window.location.assign("/account#subscription"), 900);
    }
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

  const voiceMonthly = serviceOffering("business-voice-monthly");
  const voiceAnnual = serviceOffering("business-voice-annual");

  return (
    <main className="billing-page">
      <header className="billing-hero">
        <Link href="/"><ArrowLeft size={16} /> Back to MyDogPortal</Link>
        <span className="billing-kicker"><ShieldCheck size={15} /> SECURE PAYPAL BILLING</span>
        <h1>{required ? "Complete PayPal approval to open your kennel." : welcome ? "Your kennel is ready. Choose your plan." : "Plans & breeder services"}</h1>
        <p>{required ? "Approve your MyDogPortal subscription below. That approval starts the 14-day free trial; your breeder workspace unlocks immediately after PayPal confirms it." : "Subscriptions and add-ons are connected directly to your kennel. MyDogPortal never receives your PayPal password or card details."}</p>
        <div className="trial-promise"><Sparkles size={18} /><div><b>Every MyDogPortal software plan starts with 14 days free.</b><span>The $0 trial is built into the PayPal billing plan. Cancel anytime from your Account Center—no phone call, email, or support ticket required.</span></div></div>
      </header>

      <section className="billing-shell">
        {error && <div className="billing-alert error" role="alert">{error}</div>}
        {notice && <div className="billing-alert success" role="status">{notice}</div>}
        {!config && !error && <div className="billing-loading">Preparing your secure PayPal checkout…</div>}

        {config && <>
          <section className="plan-section" aria-labelledby="plans-heading">
            {config.founding?.eligible && <div className="founding-billing-banner"><Sparkles size={18}/><div><b>Founding Breeder rate reserved for this kennel</b><span>You are one of the first {config.founding.limit} MyDogPortal kennel accounts. Your introductory subscription rate stays locked while the subscription remains continuously active. If it is cancelled or lapses, the Founding rate is forfeited and any future subscription uses the then-current published price.</span></div></div>}
            <div className="section-heading">
              <div><small>MYDOGPORTAL SUBSCRIPTIONS</small><h2 id="plans-heading">{config.currentSubscriptionId ? "Upgrade, downgrade, or change billing cycle" : "Choose the operating system behind your kennel"}</h2>{config.currentSubscriptionId && <p>Your active {currentPlanName} subscription is protected while you choose. A plan change creates the replacement first and closes the prior PayPal subscription only after the replacement is confirmed. Plan changes do not start another free trial.</p>}</div>
              <div className="cycle-toggle" role="group" aria-label="Billing cycle">
                <button type="button" className={billingCycle === "month" ? "active" : ""} onClick={() => setBillingCycle("month")}>Monthly</button>
                <button type="button" className={billingCycle === "year" ? "active" : ""} onClick={() => setBillingCycle("year")}>Annual · 2 months free</button>
              </div>
            </div>
            <div className="billing-plan-grid">
              {platformOfferings.map((offering) => (
                <article className={`${offering.name === "Professional" ? "popular" : offering.name === "Studio" ? "studio" : ""}${config.currentSubscriptionId && offering.name === currentPlanName ? " current-plan" : ""}`} key={offering.key}>
                  {offering.name === "Professional" && <em>MOST POPULAR</em>}
                  <small>{offering.name === "Starter" ? "GET ORGANIZED" : offering.name === "Professional" ? "RUN YOUR BREEDING BUSINESS" : "RUN YOUR BUSINESS + YOUR BRAND"}</small>
                  <h3>{offering.name}</h3>
                  {config.founding?.eligible && <div className="founding-plan-label">FOUNDING BREEDER PRICE</div>}<div className="plan-price"><b>{dollars(offering.price)}</b><span>/{offering.interval}</span></div>
                  <div className="trial-chip">{config.currentSubscriptionId ? offering.name === currentPlanName ? "CURRENT PLAN · CHANGE BILLING CYCLE BELOW" : `${planRank(offering.name) > planRank(currentPlanName) ? "UPGRADE" : "DOWNGRADE"} · NO NEW TRIAL` : `14 DAYS FREE · THEN ${dollars(offering.price).toUpperCase()}/${offering.interval.toUpperCase()}`}</div>
                  {offering.name === "Studio" && <div className="studio-value">Over $1,160 in First-Year Included Service Value · Prices Locked In</div>}
                  <ul>{planCopy[offering.name as keyof typeof planCopy].map((item) => <li key={item}><Check size={14} />{item}</li>)}</ul>
                  {config.currentSubscriptionId && offering.name === currentPlanName && config.currentOfferingKey.includes(billingCycle === "month" ? "monthly" : "annual") ? <div className="current-plan-marker"><Check size={15}/> Current subscription</div> : <PayPalSubscriptionButton label={config.currentSubscriptionId ? offering.name === currentPlanName ? `Change ${currentPlanName} to ${billingCycle === "month" ? "monthly" : "annual"} billing` : `${planRank(offering.name) > planRank(currentPlanName) ? "Upgrade" : "Downgrade"} to ${offering.name}` : undefined} offering={offering} kennelId={config.kennelId} ready={sdkReady} onApproved={confirmSubscription} onError={showError} />}
                </article>
              ))}
            </div>
          </section>

          <section className="addon-section" id="addons" aria-labelledby="addons-heading">
            <div className="section-heading"><div><small>À-LA-CARTE BREEDER SERVICES</small><h2 id="addons-heading">Add only what your kennel needs</h2><p>These are standalone services. The prices below are the actual add-on prices—not “value” figures.</p></div></div>
            <div className="addon-grid">
              {serviceOffering("hosting-monthly") && <article><span><Mail size={20} /></span><h3>Dog Breeder Web Website Service</h3><strong>$24.95/month</strong><p>BreederWeb Designer, managed website hosting, SSL, two branded business email addresses, publishing, forms, embeds, brand controls, and integration readiness. No MyDogPortal software subscription included.</p><PayPalSubscriptionButton offering={serviceOffering("hosting-monthly")!} kennelId={config.kennelId} ready={sdkReady} onApproved={confirmSubscription} onError={showError} /></article>}
              {serviceOffering("brand-launch-renewal") && <article><span><Globe2 size={20} /></span><h3>Brand Launch</h3><strong>$149 setup · then $39/year</strong><p>First-year standard .com registration, DNS and SSL setup. Managed standard .com renewal begins after year one.</p><PayPalSubscriptionButton offering={serviceOffering("brand-launch-renewal")!} kennelId={config.kennelId} ready={sdkReady} onApproved={confirmSubscription} onError={showError} /></article>}
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
