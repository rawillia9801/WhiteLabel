"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  CircleDollarSign,
  Eye,
  EyeOff,
  Globe2,
  KeyRound,
  Mail,
  MessageSquareText,
  PawPrint,
  PhoneCall,
  Sparkles,
} from "lucide-react";

const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "mydogportal.site";
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-").slice(0, 48);

type PlanId = "starter" | "professional" | "studio";

const plans: Array<{ id: PlanId; name: string; price: number; note: string; popular?: boolean; buttonId: string; features: string[] }> = [
  {
    id: "starter",
    name: "Starter",
    price: 29,
    note: "A complete home base for a growing breeding program.",
    buttonId: "W8DM75982MX26",
    features: ["Dogs, litters, puppies & families", "Breeding calendar & waitlist", "Branded Puppy Portal", "Bills of sale & Puppy Packets"],
  },
  {
    id: "professional",
    name: "Professional",
    price: 59,
    note: "Deeper breeding management and automation for active programs.",
    popular: true,
    buttonId: "J7HBTK2F9AMDN",
    features: ["Everything in Starter", "Pedigrees, genetics & planned matings", "Whelping and newborn workflows", "Automation, reminders & program insights"],
  },
  {
    id: "studio",
    name: "Studio",
    price: 99,
    note: "Your breeder operating system and digital brand in one place.",
    buttonId: "C5G2BVYNMMUPN",
    features: ["Everything in Professional", "Customizable breeder website", "Advanced brand presentation", "Expanded team and program workspace"],
  },
];

export default function SignupPage() {
  const [kennelName, setKennelName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("professional");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [checkout, setCheckout] = useState<{ redirect: string; plan: PlanId } | null>(null);
  const selected = useMemo(() => plans.find((plan) => plan.id === selectedPlan) || plans[1], [selectedPlan]);

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
          plan: selectedPlan,
        }),
      });
      const result = await response.json() as { error?: string; redirect?: string };
      if (!response.ok) throw new Error(result.error || "Unable to create your kennel account.");
      setCheckout({ redirect: result.redirect || "/", plan: selectedPlan });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to create your kennel account.");
    } finally {
      setBusy(false);
    }
  }

  if (checkout) {
    const checkoutPlan = plans.find((plan) => plan.id === checkout.plan) || selected;
    return <main className="signup-page checkout-page">
      <style jsx global>{signupStyles}</style>
      <section className="signup-intro checkout-intro">
        <span className="signup-logo"><PawPrint size={29}/></span>
        <small>MYDOGPORTAL</small>
        <h1>Your kennel workspace is ready.</h1>
        <p>Your MyDogPortal account has been created. Authorize the {checkoutPlan.name} subscription securely with PayPal, then return to your kennel.</p>
        <div className="signup-points"><span><BadgeCheck size={17}/>MyDogPortal never receives your card or bank details</span><span><Check size={17}/>Your Puppy Portal and breeder records stay in your branded workspace</span></div>
      </section>
      <section className="signup-panel">
        <div className="signup-card checkout-card">
          <span>FINAL STEP</span><h2>{checkoutPlan.name} · ${checkoutPlan.price}/month</h2>
          <p>Your 14-day MyDogPortal platform trial is included. PayPal will show the subscription billing schedule before you approve it.</p>
          <div className="checkout-summary">{checkoutPlan.features.map((feature) => <span key={feature}><Check size={16}/>{feature}</span>)}</div>
          <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top" className="paypal-form">
            <input type="hidden" name="cmd" value="_s-xclick" />
            <input type="hidden" name="hosted_button_id" value={checkoutPlan.buttonId} />
            <input type="hidden" name="currency_code" value="USD" />
            <button type="submit" className="signup-submit"><CircleDollarSign size={18}/>Continue securely with PayPal<ArrowRight size={17}/></button>
          </form>
          <p className="checkout-help">PayPal is used only for your MyDogPortal subscription. MyDogPortal does not process payments between breeders and puppy families.</p>
          <Link className="open-kennel-link" href={checkout.redirect}>Open my kennel workspace <ArrowRight size={16}/></Link>
        </div>
      </section>
    </main>;
  }

  return <main className="signup-page">
    <style jsx global>{signupStyles}</style>
    <section className="signup-intro">
      <span className="signup-logo"><PawPrint size={29}/></span>
      <small>THE OPERATING SYSTEM FOR YOUR BREEDING PROGRAM</small>
      <h1>Your program. Your brand. One system.</h1>
      <p>Run dogs, breeding, litters, whelping, families, documents, payments, communication, and the entire puppy experience from one professional workspace.</p>
      <div className="signup-points"><span><Check size={17}/>A private workspace for your breeding program</span><span><Check size={17}/>Branded Puppy Portals that populate from your records</span><span><Check size={17}/>Documents, reminders, family journey and go-home workflow</span></div>
      <div className="signup-trial"><Sparkles size={18}/><span><b>14-day platform trial</b><small>Choose the system that fits your program. Your subscription is authorized through PayPal after your account is created.</small></span></div>
    </section>
    <section className="signup-panel"><form className="signup-card" onSubmit={submit}>
      <span>CREATE YOUR KENNEL</span><h2>Build your workspace</h2><p>Start with a plan, claim your kennel address, and create the owner account that controls your private operating system.</p>

      <fieldset className="plan-picker"><legend>1. Choose your MyDogPortal plan</legend>{plans.map((plan) => <label key={plan.id} className={selectedPlan === plan.id ? "selected" : ""}>
        <input type="radio" name="plan" value={plan.id} checked={selectedPlan === plan.id} onChange={() => setSelectedPlan(plan.id)}/>
        <span className="plan-copy"><span className="plan-title"><b>{plan.name}</b>{plan.popular && <em>Most Popular</em>}<strong>${plan.price}<small>/mo</small></strong></span><small>{plan.note}</small><span className="plan-features">{plan.features.map((feature) => <i key={feature}><Check size={12}/>{feature}</i>)}</span></span>
      </label>)}</fieldset>

      <label><span>2. Kennel or business name</span><div className="signup-input"><Building2 size={18}/><input name="kennel_name" value={kennelName} onChange={(event) => { const value = event.target.value; setKennelName(value); if (!slugEdited) setSlug(slugify(value)); setAvailable(null); }} autoComplete="organization" placeholder="Willow Creek Chihuahuas" required/></div></label>
      <label><span>3. Included kennel address</span><div className="signup-input slug"><Globe2 size={18}/><input name="kennel_slug" value={slug} onChange={(event) => { setSlugEdited(true); setSlug(slugify(event.target.value)); setAvailable(null); }} aria-describedby="slug-status" minLength={3} required/><b>.{platformDomain}</b></div><small id="slug-status" className={available === true ? "available" : available === false ? "unavailable" : ""}>{available === true ? "Available — this address is yours when signup finishes." : available === false ? "Already in use — try another kennel address." : "Use lowercase letters, numbers, and hyphens."}</small></label>
      <div className="owner-grid">
        <label><span>4. Owner email</span><div className="signup-input"><Mail size={18}/><input name="email" type="email" autoComplete="email" placeholder="owner@yourkennel.com" required/></div></label>
        <label><span>5. Create your password</span><div className="signup-input"><KeyRound size={18}/><input name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={10} required/><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div><small>10+ characters with uppercase, lowercase, and a number.</small></label>
      </div>

      <section className="addons"><header><div><span>OPTIONAL BRAND & COMMUNICATION ADD-ONS</span><h3>Build the rest of your breeder presence when you’re ready.</h3></div><small>Requested separately — not added to today’s PayPal subscription.</small></header><div className="addon-grid">
        <article><Globe2 size={20}/><div><b>Brand Launch</b><strong>$149 <small>one time</small></strong></div><p>Available standard .com, first-year registration, secure connection, hosting while qualifying service is active, and two branded email addresses. Standard .com renewal is $29/year after year one; premium domains are separate.</p></article>
        <article><Sparkles size={20}/><div><b>Custom Website Design</b><strong>$299 <small>one time</small></strong></div><p>Studio includes a professional customizable breeder website. If that template is not what you want, we can create a breeder website to your specifications. Unsupported custom functionality is quoted separately.</p></article>
        <article><PhoneCall size={20}/><div><b>Business Voice</b><strong>$69 <small>setup</small></strong></div><p>Local number $8.99/month or $99/year. Inbound $0.03/min; outbound $0.04/min. Includes greeting, call menu, hours, voicemail, routing, and program information.</p></article>
        <article><MessageSquareText size={20}/><div><b>Business SMS</b><strong>$59 <small>activation</small></strong></div><p>$14.99/month per active registered campaign; additional campaign activation $25. Incoming $0.02/SMS segment; outgoing $0.03/SMS segment. Approval can take up to 30 days and is not guaranteed.</p></article>
      </div></section>

      {error && <div className="signup-error" role="alert">{error}</div>}
      <button className="signup-submit" disabled={busy || available === false}>{busy ? "Creating your kennel…" : `Create account · ${selected.name} $${selected.price}/mo`}<ArrowRight size={17}/></button>
      <small className="paypal-note">Next: authorize your MyDogPortal subscription with PayPal. We do not collect or store your payment details.</small>
      <footer>Already registered? <Link href="/login">Sign in</Link></footer>
    </form></section>
  </main>;
}

const signupStyles = `
*{box-sizing:border-box}body{margin:0}.signup-page{min-height:100vh;display:grid;grid-template-columns:minmax(370px,.78fr) minmax(600px,1.22fr);background:#f1f5f4;color:#172d33;font-family:var(--font-geist-sans),Arial,sans-serif}.signup-intro{position:sticky;top:0;align-self:start;min-height:100vh;display:flex;flex-direction:column;justify-content:center;padding:clamp(44px,6vw,86px);overflow:hidden;background:radial-gradient(circle at 15% 12%,rgba(36,203,191,.19),transparent 25%),linear-gradient(150deg,#082b37 0%,#0b4652 62%,#0d5d62 100%);color:#fff}.signup-intro:after{content:"";position:absolute;right:-130px;bottom:-150px;width:380px;height:380px;border:1px solid rgba(255,255,255,.08);border-radius:50%;box-shadow:0 0 0 60px rgba(255,255,255,.025),0 0 0 120px rgba(255,255,255,.018)}.signup-logo{width:58px;height:58px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.24);border-radius:18px;background:linear-gradient(145deg,#17b8b8,#42d4ca);color:#062a35;box-shadow:0 16px 36px rgba(0,0,0,.18)}.signup-intro>small{margin-top:29px;color:#72eff0;font-size:11px;font-weight:900;letter-spacing:.17em;line-height:1.5}.signup-intro h1{position:relative;z-index:1;margin:14px 0 20px;color:#fff;font-family:Georgia,"Times New Roman",serif;font-size:clamp(45px,5vw,72px);font-weight:500;line-height:1.01;letter-spacing:-.045em}.signup-intro>p{position:relative;z-index:1;max-width:620px;margin:0;color:#d3e9ec;font-size:17px;line-height:1.7}.signup-points{position:relative;z-index:1;display:grid;gap:12px;margin-top:30px}.signup-points span{display:flex;gap:10px;align-items:center;color:#e6f5f6;font-weight:720}.signup-points svg{flex:0 0 auto;color:#73e0ce}.signup-trial{position:relative;z-index:1;display:grid;grid-template-columns:auto 1fr;gap:12px;margin-top:32px;padding:17px;border:1px solid rgba(255,255,255,.18);border-radius:16px;background:rgba(255,255,255,.07)}.signup-trial svg{color:#e4b64f}.signup-trial b,.signup-trial small{display:block}.signup-trial small{margin-top:5px;color:#bddadd;line-height:1.5}.signup-panel{display:grid;place-items:start center;padding:42px clamp(22px,4vw,70px)}.signup-card{width:min(850px,100%);display:grid;gap:19px;padding:38px;border:1px solid #b9d1d0;border-radius:26px;background:#fff;box-shadow:0 28px 78px rgba(25,66,72,.13)}.signup-card>span{color:#066e77;font-size:11px;font-weight:900;letter-spacing:.15em}.signup-card h2{margin:-8px 0 -8px;color:#172d33;font-family:Georgia,"Times New Roman",serif;font-size:40px;font-weight:500;letter-spacing:-.035em}.signup-card>p{margin:0 0 4px;color:#526c73;line-height:1.55}.signup-card label>span,.signup-card legend{display:block;margin-bottom:7px;color:#294b53;font-size:12px;font-weight:850}.plan-picker{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:4px 0 2px;padding:0;border:0}.plan-picker legend{grid-column:1/-1}.plan-picker>label{position:relative;display:block!important;padding:16px!important;border:1px solid #c6d7d5!important;border-radius:16px!important;background:#fbfdfc;cursor:pointer;transition:.18s ease}.plan-picker>label:hover{border-color:#75adab!important;transform:translateY(-1px)}.plan-picker>label.selected{border-color:#0b858d!important;background:linear-gradient(150deg,#edf9f7,#fff);box-shadow:0 0 0 2px rgba(11,133,141,.1)}.plan-picker>label>input{position:absolute;right:13px;top:13px;accent-color:#087f8c}.plan-copy{display:block!important;margin:0!important}.plan-title{display:grid!important;grid-template-columns:1fr auto;gap:6px;align-items:center;margin:0 20px 7px 0!important}.plan-title b{font-family:Georgia,"Times New Roman",serif;font-size:20px;font-weight:500}.plan-title strong{grid-row:2;font-size:25px;color:#0b6f76}.plan-title strong small{font-size:10px;color:#6b7f83}.plan-title em{grid-column:1/-1;justify-self:start;padding:4px 7px;border-radius:999px;background:#d7a543;color:#422f09;font-size:8px;font-style:normal;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.plan-copy>small{min-height:47px;margin:0!important;color:#62777b!important;line-height:1.45!important}.plan-features{display:grid!important;gap:6px;margin:11px 0 0!important;padding-top:10px;border-top:1px solid #e0e9e7}.plan-features i{display:flex;gap:5px;align-items:flex-start;color:#3e5f64;font-size:10px;font-style:normal;font-weight:650;line-height:1.35}.plan-features svg{flex:0 0 auto;color:#168069}.signup-input{min-height:52px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;padding:0 14px;border:1px solid #91b3b2;border-radius:12px;background:#fff;color:#335e66}.signup-input:focus-within{border-color:#087f8c;box-shadow:0 0 0 3px rgba(8,127,140,.14)}.signup-input input{min-width:0;border:0!important;outline:0!important;background:transparent!important;color:#102f37!important;font:inherit}.signup-input button{display:grid;place-items:center;padding:6px;border:0;background:transparent;color:#315f67}.signup-input b{color:#315f67;font-size:13px;white-space:nowrap}.signup-card label>small{display:block;margin-top:6px;color:#60777d;font-size:11px}.signup-card label>small.available{color:#14724c}.signup-card label>small.unavailable{color:#9b352f}.owner-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px}.addons{display:grid;gap:13px;margin-top:2px;padding-top:20px;border-top:1px solid #dce7e5}.addons>header{display:flex;justify-content:space-between;gap:20px;align-items:end}.addons>header span{color:#08737b;font-size:9px;font-weight:900;letter-spacing:.13em}.addons>header h3{margin:5px 0 0;font-family:Georgia,"Times New Roman",serif;font-size:21px;font-weight:500}.addons>header>small{max-width:245px;color:#718286;text-align:right;line-height:1.4}.addon-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.addon-grid article{display:grid;grid-template-columns:auto 1fr;gap:9px;padding:14px;border:1px solid #d2dfdd;border-radius:14px;background:#f9fbfa}.addon-grid article>svg{margin-top:2px;color:#0b7c83}.addon-grid article>div{display:flex;justify-content:space-between;gap:12px;align-items:start}.addon-grid article b{font-size:12px}.addon-grid article strong{color:#0a6770;font-size:12px;white-space:nowrap}.addon-grid article strong small{color:#718286;font-size:8px;font-weight:700}.addon-grid article p{grid-column:2;margin:0;color:#667b7f;font-size:9px;line-height:1.55}.signup-submit{min-height:53px;display:flex;align-items:center;justify-content:center;gap:9px;border:0;border-radius:12px;background:linear-gradient(135deg,#087f8c,#0aa1a2)!important;color:#fff!important;font:inherit;font-weight:900;cursor:pointer;box-shadow:0 10px 24px rgba(8,127,140,.18)}.signup-submit:disabled{opacity:.58}.signup-error{padding:12px 14px;border:1px solid #e8a5a0;border-radius:11px;background:#fff0ef;color:#852f2b}.paypal-note{margin:-10px 0 0;color:#6d8084;text-align:center;line-height:1.45}.signup-card footer{text-align:center;color:#60777d}.signup-card footer a,.open-kennel-link{color:#066e77;font-weight:900}.checkout-page{min-height:100vh}.checkout-intro{position:relative}.checkout-card{align-self:center}.checkout-summary{display:grid;gap:9px;padding:18px;border:1px solid #d5e4e1;border-radius:15px;background:#f5faf8}.checkout-summary span{display:flex;gap:8px;align-items:center;color:#315a5f;font-weight:700}.checkout-summary svg{color:#197857}.paypal-form{display:block}.paypal-form .signup-submit{width:100%}.checkout-help{padding:13px 14px;border-left:3px solid #b98832;background:#fff8eb;color:#625333!important;font-size:12px;line-height:1.5!important}.open-kennel-link{display:flex;justify-content:center;gap:7px;align-items:center;text-decoration:none}.checkout-card h2{font-size:35px}@media(max-width:1100px){.signup-page{grid-template-columns:minmax(330px,.68fr) minmax(540px,1.32fr)}.signup-intro{padding:44px}.plan-picker{grid-template-columns:1fr}.plan-copy>small{min-height:0}.addon-grid{grid-template-columns:1fr}}@media(max-width:900px){.signup-page{display:block}.signup-intro{position:relative;min-height:auto;padding:40px 26px 44px}.signup-intro h1{font-size:48px}.signup-panel{padding:20px 14px 38px}.signup-card{padding:27px}.plan-picker{grid-template-columns:repeat(3,1fr)}}@media(max-width:720px){.plan-picker,.owner-grid,.addon-grid{grid-template-columns:1fr}.addons>header{display:block}.addons>header>small{display:block;max-width:none;margin-top:8px;text-align:left}.signup-input.slug{grid-template-columns:auto 1fr}.signup-input.slug b{grid-column:2;font-size:11px;padding-bottom:8px}.signup-card h2{font-size:34px}}
`;
