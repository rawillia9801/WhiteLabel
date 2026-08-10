"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  Globe2,
  KeyRound,
  Mail,
  PawPrint,
  WalletCards,
} from "lucide-react";

const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "mydogportal.site";
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-").slice(0, 48);

const subscriptions = [
  { id: "starter", name: "Starter", price: 19, annual: 190, regular: 29, regularAnnual: 290, position: "GET ORGANIZED", description: "Essential breeder operations, applications, family records, health tracking, payments, and private Puppy Portals for a growing program.", featured: false },
  { id: "professional", name: "Professional", price: 39, annual: 390, regular: 69, regularAnnual: 690, position: "RUN YOUR BREEDING BUSINESS", description: "Everything in Starter plus pedigrees and COI, reproduction and whelping management, waitlists, DogBreederDocs, e-signatures, and automation.", featured: true },
  { id: "studio", name: "Studio", price: 69, annual: 690, regular: 119, regularAnnual: 1190, position: "THE CONNECTED BREEDER SUITE", description: "Everything in Professional plus the connected DogBreederWeb website plan, standard .com domain, hosting, SSL, two branded business emails, Business Voice, and $20/month in Phone System Credits.", featured: false },
] as const;

export default function SignupPage() {
  const [kennelName, setKennelName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "professional" | "studio">("professional");
  const [founding, setFounding] = useState({ available: true, remaining: 100, limit: 100 });

  useEffect(() => {
    let active = true;
    void fetch("/api/founding-pricing", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as { available?: boolean; remaining?: number; limit?: number };
        if (active && response.ok && typeof payload.available === "boolean") {
          setFounding({ available: payload.available, remaining: Number(payload.remaining ?? 0), limit: Number(payload.limit ?? 100) });
        }
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedPlan = params.get("plan") || "";
    const timer = window.setTimeout(() => {
      if (["starter", "professional", "studio"].includes(requestedPlan)) {
        setSelectedPlan(requestedPlan as "starter" | "professional" | "studio");
      }
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kennel_name: form.get("kennel_name"),
          kennel_slug: form.get("kennel_slug"),
          email: form.get("email"),
          password: form.get("password"),
          plan: "starter",
          requested_plan: selectedPlan,
          setup_requests: [],
          website_template: "",
        }),
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
        <h1>Your breeding program. One connected operating system.</h1>
        <p>Start with the breeder-management platform. Add the connected website and document products only when your plan calls for them.</p>
        <div className="signup-points">
          <span><Check size={16} />Secure individual owner login</span>
          <span><Check size={16} />Private tenant-isolated records</span>
          <span><Check size={16} />Family Puppy Portals you control</span>
          <span><Check size={16} />Automation that follows your workflow</span>
          <span><Check size={16} />DogBreederDocs included with Professional + Studio</span>
          <span><Check size={16} />DogBreederWeb included with Studio</span>
        </div>
      </section>

      <section className="signup-panel">
        <div className="signup-stack">
          <form className="signup-card" id="account-form" onSubmit={submit}>
            <span>CREATE YOUR KENNEL</span>
            <h2>Claim your MyDogPortal workspace</h2>
            <p>Create the private breeder account first. Your selected MyDogPortal plan determines which connected products are included.</p>
            <label><span>1. Kennel or business name</span><div className="signup-input"><Building2 size={18} /><input name="kennel_name" value={kennelName} onChange={(event) => { const value = event.target.value; setKennelName(value); if (!slugEdited) setSlug(slugify(value)); setAvailable(null); }} autoComplete="organization" placeholder="Willow Creek Goldens" required /></div></label>
            <label><span>2. Included MyDogPortal workspace address</span><div className="signup-input slug"><Globe2 size={18} /><input name="kennel_slug" value={slug} onChange={(event) => { setSlugEdited(true); setSlug(slugify(event.target.value)); setAvailable(null); }} aria-describedby="slug-status" minLength={3} required /><b>.{platformDomain}</b></div><small id="slug-status" className={available === true ? "available" : available === false ? "unavailable" : ""}>{available === true ? "Available—this workspace address is yours when signup finishes." : available === false ? "Already in use—try another kennel address." : "Use lowercase letters, numbers, and hyphens."}</small></label>
            <label><span>3. Owner email</span><div className="signup-input"><Mail size={18} /><input name="email" type="email" autoComplete="email" placeholder="owner@yourkennel.com" required /></div></label>
            <label><span>4. Create your password</span><div className="signup-input"><KeyRound size={18} /><input name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={10} required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div><small>At least 10 characters with uppercase, lowercase, and a number.</small></label>
            {error && <div className="signup-error" role="alert">{error}</div>}
            <button className="signup-submit" disabled={busy || available === false}>{busy ? "Creating your kennel…" : "Create account and continue to secure checkout"}<ArrowRight size={17} /></button>
            <footer>Already registered? <Link href="/login">Sign in</Link></footer>
          </form>

          <section className="subscription-section" aria-labelledby="subscription-heading">
            <header><span><WalletCards size={17} /></span><div><small>14-DAY PLATFORM FREE TRIAL</small><h2 id="subscription-heading">{founding.available ? "Lock in your introductory MyDogPortal rate" : "Choose the MyDogPortal plan that fits your program"}</h2><p>{founding.available ? `Founding Breeder pricing · ${founding.remaining} of ${founding.limit} spots remain. Start with the 14-day $0 trial, then keep your Founding rate for as long as your subscription remains continuously active.` : "The Founding Breeder offer has been fully claimed. Every MyDogPortal software plan still begins with a 14-day $0 trial."}</p></div></header>
            <div className="subscription-grid">
              {subscriptions.map((plan) => (
                <article className={[plan.featured ? "featured" : "", selectedPlan === plan.id ? "selected" : ""].filter(Boolean).join(" ")} key={plan.name}>
                  {plan.featured && <em>MOST POPULAR</em>}
                  <small className="subscription-position">{plan.position}</small>
                  <h3>{plan.name}</h3>
                  <div className="signup-founding-price">{founding.available && <small>REGULAR ${plan.regular}/MONTH</small>}<p><b>${founding.available ? plan.price : plan.regular}</b><span>/month{founding.available ? " Founding" : ""}</span></p></div>
                  <div className="subscription-annual"><b>${founding.available ? plan.annual : plan.regularAnnual}/year{founding.available ? " Founding" : ""}</b><span>{founding.available ? `Regular ${plan.regularAnnual}/year` : "Two months free"}</span></div>
                  <small>{plan.description}</small>
                  <button type="button" aria-pressed={selectedPlan === plan.id} onClick={() => setSelectedPlan(plan.id)}>{selectedPlan === plan.id ? "Selected for checkout" : "Choose " + plan.name}</button>
                </article>
              ))}
            </div>
            <aside className="subscription-billing-note">{founding.available ? <><b>Founding Breeder disclaimer:</b> Founding pricing is limited to the first 100 eligible kennel accounts and is confirmed when the account is created. Your Founding rate remains locked only while that subscription stays continuously active. If you cancel or allow it to lapse, the Founding rate is forfeited and any later subscription will be at the then-current published price.</> : <>Monthly or annual billing is selected on the secure billing page. Annual plans include two months free.</>}</aside>
          </section>

          <section className="studio-website-note">
            <div><small>ONE PRODUCT FAMILY · CLEAR RESPONSIBILITIES</small><h2>MyDogPortal runs the kennel. The connected products do their own jobs.</h2><p><b>DogBreederWeb.Site</b> is the dedicated public website platform. <b>DogBreederDocs.Online</b> is the dedicated breeder-document platform. MyDogPortal remains the breeder operating system. Professional includes DogBreederDocs. Studio includes both DogBreederDocs and DogBreederWeb, plus Business Voice and $20/month in Phone System Credits. You are not being asked to repurchase the same service under different names.</p></div>
            <Link href="/#products"><span>CONNECTED PRODUCT FAMILY</span><b>See what each product does</b><small>View the MyDogPortal ecosystem <ArrowRight size={13} /></small></Link>
          </section>
        </div>
      </section>
    </main>
  );
}
