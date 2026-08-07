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
  MonitorSmartphone,
  PawPrint,
  PhoneCall,
  WalletCards,
} from "lucide-react";

const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "mydogportal.site";
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-").slice(0, 48);

const subscriptions = [
  { id: "starter", name: "Starter", price: 29, annual: 290, position: "GET ORGANIZED", description: "Essential kennel operations, tenant workspace, and Puppy Portal access for a growing program.", featured: false },
  { id: "professional", name: "Professional", price: 59, annual: 590, position: "RUN YOUR BREEDING BUSINESS", description: "The complete breeder workflow for active programs, family operations, and automation.", featured: true },
  { id: "studio", name: "Studio", price: 99, annual: 990, position: "RUN YOUR BUSINESS + YOUR BRAND", description: "Over $1,100.00 Added Value · Prices Locked In. Brand Launch, breeder website personalization, hosting, two business emails, standard .com registration and renewal, Business Voice + custom IVR, and $240/year in Phone System Credits.", featured: false },
] as const;

const websiteTemplates = [
  { id: "willow-creek", name: "Willow Creek", breed: "Chihuahua", description: "Bright, polished and boutique—with a clean presentation for a small companion-breed program.", preview: "https://willowcreekchihuahuas.com" },
  { id: "cedar-creek", name: "Cedar & Creek", breed: "Golden Retriever", description: "Warm, editorial and outdoors-inspired—with a story-first presentation for a family sporting-breed program.", preview: "/templates/cedar-creek" },
] as const;

const setupServices = [
  {
    id: "hosting-email",
    name: "Website Hosting + Business Email",
    price: "$17.95/month",
    action: "Add hosting + email to my setup",
    icon: Mail,
    description: "Standalone managed website hosting and professional email exclusively for dog breeders. No MyDogPortal software subscription is included.",
    details: ["Managed website hosting + SSL", "Two branded business email addresses", "Connect an existing domain", "Basic hosting and email support"],
  },
  {
    id: "brand-launch",
    name: "Brand Launch",
    price: "$149 setup · then $29/year renewal",
    action: "Add Brand Launch to my setup",
    icon: Globe2,
    description: "Launch an available standard .com with registration, DNS, and SSL configuration.",
    details: ["Available standard .com registration", "Domain, DNS, and SSL configuration", "First year registration included with launch", "Managed standard .com renewal: $29/year after year one", "Premium domains priced separately"],
  },
  {
    id: "website-personalization",
    name: "Breeder Website Personalization",
    price: "$299 one-time",
    action: "Request website personalization",
    icon: MonitorSmartphone,
    description: "Personalize a supported MyDogPortal website style around your kennel so the demonstration content becomes your brand and breeding program.",
    details: ["Kennel identity, colors, and photography", "Your content across supported pages and layouts", "Connected MyDogPortal information where supported"],
  },
  {
    id: "custom-website",
    name: "Custom Breeder Website",
    price: "From $749",
    action: "Request a custom website quote",
    icon: MonitorSmartphone,
    description: "For breeder brands that need a website beyond the supported template system, with scope planned around the program before work begins.",
    details: ["Custom layout and page planning", "Brand, photography, and content implementation", "Connected MyDogPortal information where supported", "Final scope and price confirmed before work begins"],
  },
  {
    id: "business-voice",
    name: "Business Voice",
    price: "$69 setup + $8.99/month or $99/year",
    action: "Add Business Voice to my setup",
    icon: PhoneCall,
    description: "A professionally configured local business voice line with your custom greeting and breeder information.",
    details: ["Local number: $8.99/month or $99/year", "Incoming calls: $0.03/minute", "Outgoing calls: $0.04/minute", "Custom IVR/menu, business hours, voicemail, and call routing", "SMS is not offered"],
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
  const [websiteTemplate, setWebsiteTemplate] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "professional" | "studio">("professional");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedTemplate = params.get("website_template") || "";
    const requestedPlan = params.get("plan") || "";
    const timer = window.setTimeout(() => {
      if (websiteTemplates.some((template) => template.id === requestedTemplate)) setWebsiteTemplate(requestedTemplate);
      if (["starter", "professional", "studio"].includes(requestedPlan)) setSelectedPlan(requestedPlan as "starter" | "professional" | "studio");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

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
        body: JSON.stringify({ kennel_name: form.get("kennel_name"), kennel_slug: form.get("kennel_slug"), email: form.get("email"), password: form.get("password"), plan: "starter", requested_plan: selectedPlan, setup_requests: setupRequests, website_template: websiteTemplate }),
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
            <button className="signup-submit" disabled={busy || available === false}>{busy ? "Creating your kennel…" : "Create account and continue to secure checkout"}<ArrowRight size={17} /></button>
            <footer>Already registered? <Link href="/login">Sign in</Link></footer>
          </form>

          <section className="website-template-picker" aria-labelledby="website-template-heading">
            <header><small>WEBSITE TEMPLATE GALLERY</small><h2 id="website-template-heading">Choose the look you want to start with</h2><p>Pick a starting style now or leave it open. Your kennel name, breed, dogs, photography, colors, policies, and content replace everything shown in the demonstrations.</p></header>
            <div className="website-template-grid">
              {websiteTemplates.map((template, index) => {
                const selected = websiteTemplate === template.id;
                return (
                  <article className={selected ? "selected" : ""} key={template.id}>
                    <small>WEBSITE TEMPLATE {String(index + 1).padStart(2, "0")}</small>
                    <h3>{template.name}</h3>
                    <b>{template.breed} demonstration</b>
                    <p>{template.description}</p>
                    <div><a href={template.preview} target="_blank" rel="noreferrer">Preview template <ExternalLink size={13} /></a><button type="button" aria-pressed={selected} onClick={() => setWebsiteTemplate(selected ? "" : template.id)}>{selected ? <><Check size={14} /> Selected</> : "Choose this style"}</button></div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="subscription-section" aria-labelledby="subscription-heading">
            <header><span><WalletCards size={17} /></span><div><small>14-DAY PLATFORM FREE TRIAL</small><h2 id="subscription-heading">Choose the plan that fits your program</h2><p>Create your kennel first, then complete the connected PayPal checkout. The 14-day $0 trial is built into every MyDogPortal software billing plan.</p></div></header>
            <div className="subscription-grid">
              {subscriptions.map((plan) => (
                <article className={[plan.featured ? "featured" : "", selectedPlan === plan.id ? "selected" : ""].filter(Boolean).join(" ")} key={plan.name}>
                  {plan.featured && <em>MOST POPULAR</em>}
                  <small className="subscription-position">{plan.position}</small>
                  <h3>{plan.name}</h3>
                  <p><b>${plan.price}</b><span>/month</span></p>
                  <div className="subscription-annual"><b>${plan.annual}/year</b><span>Two months free</span></div>
                  <small>{plan.description}</small>
                  <button type="button" aria-pressed={selectedPlan === plan.id} onClick={() => setSelectedPlan(plan.id)}>{selectedPlan === plan.id ? "Selected for checkout" : "Choose " + plan.name}</button>
                </article>
              ))}
            </div>
            <aside className="subscription-billing-note">Monthly or annual billing is selected on the secure billing page after your kennel account is created. Annual plans include two months free.</aside>
          </section>

          <section className="setup-services" aria-labelledby="setup-services-heading">
            <header><small>À-LA-CARTE BREEDER SERVICES</small><h2 id="setup-services-heading">Build your launch package</h2><p>These five cards are standalone add-ons with their actual prices. Studio bundle value is shown separately below. No add-on payment is taken from these request buttons.</p></header>
            <div className="setup-service-grid">
              {setupServices.map((service) => {
                const Icon = service.icon;
                const selected = setupRequests.includes(service.id);
                return (
                  <article key={service.id}>
                    <header><span><Icon size={19} /></span><div><h3>{service.name}</h3><strong>{service.price}</strong></div></header>
                    <p>{service.description}</p>
                    <ul>{service.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
                    <button type="button" className={selected ? "selected" : ""} aria-pressed={selected} data-setup-request={service.id} onClick={() => toggleSetupRequest(service.id)}>{selected ? "Added to signup request" : service.action}</button>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="studio-website-note">
            <div><small>STUDIO · COMPLETE BRAND PACKAGE · PRICES LOCKED IN</small><h2>Over $1,100.00 Added Value</h2><p>Studio includes $869.28 in Brand Launch, breeder website personalization, standard .com registration and renewal, hosting with two branded business emails, and Business Voice system value, plus $240/year in Phone System Credits. That is $1,109.28 in added service value before counting the MyDogPortal software itself. Your Studio subscription rate stays locked in while your Studio subscription remains continuously active. Your connected website can use breeder-maintained MyDogPortal information for puppies, litters, parent dogs, health testing, applications, policies, contact details, branding, photography, and Puppy Portal access.</p></div>
            <Link href="/#examples"><span>CONNECTED TEMPLATE GALLERY</span><b>Compare the website styles</b><small>View all live examples <ArrowRight size={13} /></small></Link>
          </section>
        </div>
      </section>
    </main>
  );
}
