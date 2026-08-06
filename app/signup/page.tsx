"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Globe2,
  KeyRound,
  Mail,
  MessageSquareText,
  MonitorSmartphone,
  PawPrint,
  PhoneCall,
  WalletCards,
} from "lucide-react";

const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "mydogportal.site";
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-").slice(0, 48);

const subscriptions = [
  { name: "Starter", price: 29, buttonId: "W8DM75982MX26", description: "Essential kennel operations, tenant workspace, and Puppy Portal access for a growing program.", featured: false },
  { name: "Professional", price: 59, buttonId: "J7HBTK2F9AMDN", description: "The complete breeder workflow for active programs, family operations, and automation.", featured: true },
  { name: "Studio", price: 99, buttonId: "C5G2BVYNMMUPN", description: "Expanded operating capacity plus a professional customizable breeder website connected to MyDogPortal.", featured: false },
] as const;

const setupServices = [
  {
    id: "brand-launch",
    name: "Brand Launch",
    price: "$149 one-time",
    action: "Add Brand Launch to my setup",
    icon: Globe2,
    description: "Launch an available standard .com with the domain, SSL, and hosting configured while a qualifying MyDogPortal service remains active.",
    details: ["First-year standard .com registration", "Two branded business email addresses", "Standard .com renewal: $29/year", "Premium domains priced separately"],
  },
  {
    id: "custom-website",
    name: "Custom Breeder Website Design",
    price: "$299 one-time",
    action: "Request custom website",
    icon: MonitorSmartphone,
    description: "If the customizable Studio website isn't what you're looking for, we can create a breeder website specifically around your program's specifications for a one-time $299 design fee.",
    details: ["Specify layout, branding, colors, and pages", "Use your photography, content, and program presentation", "Custom functionality outside supported MyDogPortal components may be quoted separately"],
  },
  {
    id: "business-voice",
    name: "Business Voice",
    price: "$69 one-time setup",
    action: "Add Business Voice to my setup",
    icon: PhoneCall,
    description: "A professionally configured local business line with your custom greeting and breeder information.",
    details: ["Local number: $8.99/month or $99/year", "Incoming calls: $0.03/minute", "Outgoing calls: $0.04/minute", "Includes IVR/menu, business hours, voicemail, and call routing"],
  },
  {
    id: "business-sms",
    name: "Business SMS",
    price: "$59 activation/setup",
    action: "Request SMS activation",
    icon: MessageSquareText,
    description: "Optional registered business messaging, separate from Business Voice and the core software subscription.",
    details: ["$14.99/month per active registered campaign", "$25 activation for each additional campaign", "Incoming: $0.02 per SMS segment", "Outgoing: $0.03 per SMS segment"],
    disclosure: "Approval and registration are required, and activation is not guaranteed. Please allow up to 30 days for business messaging approval and activation.",
  },
] as const;

export default function SignupPage() {
  const [kennelName, setKennelName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [setupRequests, setSetupRequests] = useState<string[]>([]);

  useEffect(() => {
    if (slug.length < 3) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/auth/availability?slug=${encodeURIComponent(slug)}`, { signal: controller.signal });
        const result = await response.json() as { available?: boolean };
        if (!response.ok || typeof result.available !== "boolean") throw new Error("Unable to check that address.");
        setAvailable(result.available);
      } catch {
        if (!controller.signal.aborted) setAvailable(null);
      }
    }, 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [slug]);

  function toggleSetupRequest(id: string) {
    setSetupRequests((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kennel_name: form.get("kennel_name"), kennel_slug: form.get("kennel_slug"), email: form.get("email"), password: form.get("password"), plan: "starter", setup_requests: setupRequests }),
      });
      const result = await response.json() as { error?: string; redirect?: string };
      if (!response.ok) throw new Error(result.error || "Unable to create your kennel account.");
      window.location.assign(result.redirect || "/");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to create your kennel account.");
      setBusy(false);
    }
  }

  return (
    <main className="signup-page">
      <section className="signup-intro">
        <span className="signup-logo"><PawPrint size={27} /></span>
        <small>MYDOGPORTAL</small>
        <h1>Your breeding program. Your brand. Your families. One connected system.</h1>
        <p>The complete business operating system for dog breeders, with a private workspace and connected family experience.</p>
        <div className="signup-points"><span><Check size={16} />Secure individual owner login</span><span><Check size={16} />Private tenant-isolated records</span><span><Check size={16} />Family Puppy Portals you control</span></div>
      </section>

      <section className="signup-panel">
        <div className="signup-stack">
          <form className="signup-card" id="account-form" onSubmit={submit}>
            <span>CREATE YOUR KENNEL</span>
            <h2>Claim your workspace</h2>
            <p>Start with the kennel address your team and families will recognize.</p>
            <label><span>1. Kennel or business name</span><div className="signup-input"><Building2 size={18} /><input name="kennel_name" value={kennelName} onChange={(event) => { const value = event.target.value; setKennelName(value); if (!slugEdited) setSlug(slugify(value)); setAvailable(null); }} autoComplete="organization" placeholder="Willow Creek Goldens" required /></div></label>
            <label><span>2. Included kennel address</span><div className="signup-input slug"><Globe2 size={18} /><input name="kennel_slug" value={slug} onChange={(event) => { setSlugEdited(true); setSlug(slugify(event.target.value)); setAvailable(null); }} aria-describedby="slug-status" minLength={3} required /><b>.{platformDomain}</b></div><small id="slug-status" className={available === true ? "available" : available === false ? "unavailable" : ""}>{available === true ? "Available—this address is yours when signup finishes." : available === false ? "Already in use—try another kennel address." : "Use lowercase letters, numbers, and hyphens."}</small></label>
            <label><span>3. Owner email</span><div className="signup-input"><Mail size={18} /><input name="email" type="email" autoComplete="email" placeholder="owner@yourkennel.com" required /></div></label>
            <label><span>4. Create your password</span><div className="signup-input"><KeyRound size={18} /><input name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={10} required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div><small>At least 10 characters with uppercase, lowercase, and a number.</small></label>
            {setupRequests.length > 0 && <div className="signup-request-summary"><b>{setupRequests.length} optional setup request{setupRequests.length === 1 ? "" : "s"} selected</b><small>They will be added to your workspace when the account is created. No add-on payment is submitted here.</small></div>}
            {error && <div className="signup-error" role="alert">{error}</div>}
            <button className="signup-submit" disabled={busy || available === false}>{busy ? "Creating your kennel…" : "Create account and open kennel"}<ArrowRight size={17} /></button>
            <footer>Already registered? <Link href="/login">Sign in</Link></footer>
          </form>

          <section className="subscription-section" aria-labelledby="subscription-heading">
            <header><span><WalletCards size={17} /></span><div><small>14-DAY PLATFORM FREE TRIAL</small><h2 id="subscription-heading">Choose the plan that fits your program</h2><p>Core MyDogPortal subscriptions are handled securely by PayPal. MyDogPortal does not process puppy purchases between breeders and their families.</p></div></header>
            <div className="subscription-grid">
              {subscriptions.map((plan) => (
                <article className={plan.featured ? "featured" : ""} key={plan.name}>
                  {plan.featured && <em>MOST POPULAR</em>}
                  <h3>{plan.name}</h3>
                  <p><b>${plan.price}</b><span>/month</span></p>
                  <small>{plan.description}</small>
                  <a href={`https://www.paypal.com/ncp/payment/${plan.buttonId}`} target="_blank" rel="noreferrer" data-paypal-hosted-button-id={plan.buttonId} aria-label={`Continue to PayPal for the ${plan.name} subscription`}>Continue to PayPal <ExternalLink size={14} /></a>
                </article>
              ))}
            </div>
          </section>

          <section className="setup-services" aria-labelledby="setup-services-heading">
            <header><small>OPTIONAL SERVICES</small><h2 id="setup-services-heading">Build your launch package</h2><p>These services are separate from the $29, $59, and $99 subscriptions. Select a request for your setup—no payment is taken from these buttons.</p></header>
            <div className="setup-service-grid">
              {setupServices.map((service) => {
                const Icon = service.icon;
                const selected = setupRequests.includes(service.id);
                return (
                  <article key={service.id}>
                    <header><span><Icon size={19} /></span><div><h3>{service.name}</h3><strong>{service.price}</strong></div></header>
                    <p>{service.description}</p>
                    <ul>{service.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
                    {"disclosure" in service && <aside>{service.disclosure}</aside>}
                    <button type="button" className={selected ? "selected" : ""} aria-pressed={selected} data-setup-request={service.id} onClick={() => toggleSetupRequest(service.id)}>{selected ? "Added to signup request" : service.action}</button>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="studio-website-note">
            <div><small>STUDIO WEBSITE</small><h2>Your public breeder website, connected</h2><p>Studio includes a professional customizable breeder website that can use breeder-maintained MyDogPortal information for available puppies, litters, dams, sires, health testing, applications, policies, contact details, branding, photography, and Puppy Portal access.</p></div>
            <a href="https://willowcreekchihuahuas.com" target="_blank" rel="noreferrer"><span>Demonstration breeder website</span><b>See MyDogPortal in action</b><small>View Willow Creek Chihuahuas <ExternalLink size={13} /></small></a>
          </section>
        </div>
      </section>
    </main>
  );
}
