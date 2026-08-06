"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, Check, Eye, EyeOff, Globe2, KeyRound, Mail, PawPrint } from "lucide-react";

const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "mydogportal.site";
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9-]+/g,"-").replace(/^-+|-+$/g,"").replace(/-{2,}/g,"-").slice(0,48);

export default function SignupPage() {
  const [kennelName, setKennelName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (slug.length < 3) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/auth/availability?slug=${encodeURIComponent(slug)}`, { signal: controller.signal });
        const result = await response.json() as { available?: boolean };
        if (!response.ok || typeof result.available !== "boolean") throw new Error("Unable to check that address.");
        setAvailable(result.available);
      }
      catch { if (!controller.signal.aborted) setAvailable(null); }
    }, 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [slug]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/signup", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({ kennel_name:form.get("kennel_name"), kennel_slug:form.get("kennel_slug"), email:form.get("email"), password:form.get("password"), plan:form.get("plan") }) });
      const result = await response.json() as { error?:string; redirect?:string };
      if (!response.ok) throw new Error(result.error || "Unable to create your kennel account.");
      window.location.assign(result.redirect || "/");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Unable to create your kennel account."); setBusy(false); }
  }

  return <main className="signup-page">
    <style jsx global>{signupStyles}</style>
    <section className="signup-intro"><span className="signup-logo"><PawPrint size={29}/></span><small>START YOUR BREEDER PORTAL</small><h1>Your brand. Your kennel. Your portal.</h1><p>Choose your kennel address first. Then create the owner login that controls your private workspace and your families’ puppy portals.</p><div className="signup-points"><span><Check size={17}/>No shared staff password</span><span><Check size={17}/>Separate private kennel data</span><span><Check size={17}/>Buyer puppy portals you control</span></div></section>
    <section className="signup-panel"><form className="signup-card" onSubmit={submit}>
      <span>CREATE KENNEL</span><h2>Claim your workspace</h2><p>Your password comes last—first set up the kennel your account belongs to.</p>
      <label><span>1. Kennel or business name</span><div className="signup-input"><Building2 size={18}/><input name="kennel_name" value={kennelName} onChange={(event)=>{const value=event.target.value;setKennelName(value);if(!slugEdited)setSlug(slugify(value));setAvailable(null);}} autoComplete="organization" placeholder="Willow Creek Goldens" required/></div></label>
      <label><span>2. Included kennel address</span><div className="signup-input slug"><Globe2 size={18}/><input name="kennel_slug" value={slug} onChange={(event)=>{setSlugEdited(true);setSlug(slugify(event.target.value));setAvailable(null);}} aria-describedby="slug-status" minLength={3} required/><b>.{platformDomain}</b></div><small id="slug-status" className={available === true ? "available" : available === false ? "unavailable" : ""}>{available === true ? "Available—this address is yours when signup finishes." : available === false ? "Already in use—try another kennel address." : "Use lowercase letters, numbers, and hyphens."}</small></label>
      <fieldset><legend>3. Package</legend><label><input type="radio" name="plan" value="starter" defaultChecked/><span><b>Breeder Portal</b><small>{slug || "kennelname"}.{platformDomain} included</small></span></label><label><input type="radio" name="plan" value="custom_domain"/><span><b>Custom Domain package</b><small>Start on the included address, then connect your own verified domain.</small></span></label></fieldset>
      <label><span>4. Owner email</span><div className="signup-input"><Mail size={18}/><input name="email" type="email" autoComplete="email" placeholder="owner@yourkennel.com" required/></div></label>
      <label><span>5. Create your password</span><div className="signup-input"><KeyRound size={18}/><input name="password" type={showPassword?"text":"password"} autoComplete="new-password" minLength={10} required/><button type="button" onClick={()=>setShowPassword((value)=>!value)} aria-label={showPassword?"Hide password":"Show password"}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div><small>At least 10 characters with uppercase, lowercase, and a number.</small></label>
      {error&&<div className="signup-error" role="alert">{error}</div>}
      <button className="signup-submit" disabled={busy||available===false}>{busy?"Creating your kennel…":"Create account and open kennel"}<ArrowRight size={17}/></button>
      <footer>Already registered? <Link href="/login">Sign in</Link></footer>
    </form></section>
  </main>;
}

const signupStyles=`
*{box-sizing:border-box}body{margin:0}.signup-page{min-height:100vh;display:grid;grid-template-columns:minmax(350px,.82fr) minmax(520px,1.18fr);background:#f4f8f7;color:#172d33;font-family:var(--font-geist-sans),Arial,sans-serif}.signup-intro{display:flex;flex-direction:column;justify-content:center;padding:clamp(42px,7vw,88px);background:linear-gradient(150deg,#092d39,#0e5360);color:#fff}.signup-logo{width:58px;height:58px;display:grid;place-items:center;border-radius:18px;background:#38d4d5;color:#062a35}.signup-intro>small{margin-top:28px;color:#72eff0;font-size:12px;font-weight:900;letter-spacing:.17em}.signup-intro h1{margin:13px 0 18px;color:#fff;font-size:clamp(43px,5vw,68px);line-height:1.02;letter-spacing:-.05em}.signup-intro>p{margin:0;color:#d3e9ec;font-size:17px;line-height:1.65}.signup-points{display:grid;gap:12px;margin-top:30px}.signup-points span{display:flex;gap:10px;align-items:center;color:#e6f5f6;font-weight:750}.signup-panel{display:grid;place-items:center;padding:30px}.signup-card{width:min(620px,100%);display:grid;gap:17px;padding:36px;border:1px solid #b9d1d0;border-radius:25px;background:#fff;box-shadow:0 26px 75px rgba(25,66,72,.15)}.signup-card>span{color:#066e77;font-size:11px;font-weight:900;letter-spacing:.15em}.signup-card h2{margin:-7px 0 -8px;color:#172d33;font-size:38px;letter-spacing:-.04em}.signup-card>p{margin:0 0 5px;color:#526c73}.signup-card label>span,.signup-card legend{display:block;margin-bottom:7px;color:#294b53;font-size:12px;font-weight:850}.signup-input{min-height:50px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;padding:0 14px;border:1px solid #91b3b2;border-radius:12px;background:#fff;color:#335e66}.signup-input:focus-within{border-color:#087f8c;box-shadow:0 0 0 3px rgba(8,127,140,.16)}.signup-input input{min-width:0;border:0!important;outline:0!important;background:transparent!important;color:#102f37!important;font:inherit}.signup-input button{display:grid;place-items:center;padding:6px;border:0;background:transparent;color:#315f67}.signup-input b{color:#315f67;font-size:13px;white-space:nowrap}.signup-card label>small{display:block;margin-top:6px;color:#60777d;font-size:11px}.signup-card label>small.available{color:#14724c}.signup-card label>small.unavailable{color:#9b352f}.signup-card fieldset{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0;padding:0;border:0}.signup-card fieldset legend{grid-column:1/-1}.signup-card fieldset label{display:grid;grid-template-columns:auto 1fr;gap:9px;padding:13px;border:1px solid #b8cecd;border-radius:12px;cursor:pointer}.signup-card fieldset b,.signup-card fieldset small{display:block}.signup-card fieldset small{margin-top:3px;color:#60777d;line-height:1.35}.signup-submit{min-height:51px;display:flex;align-items:center;justify-content:center;gap:9px;border:0;border-radius:12px;background:#087f8c!important;color:#fff!important;font:inherit;font-weight:900;cursor:pointer}.signup-submit:disabled{opacity:.58}.signup-error{padding:12px 14px;border:1px solid #e8a5a0;border-radius:11px;background:#fff0ef;color:#852f2b}.signup-card footer{text-align:center;color:#60777d}.signup-card footer a{color:#066e77;font-weight:900}@media(max-width:900px){.signup-page{grid-template-columns:1fr}.signup-intro{min-height:430px;padding:38px 26px}.signup-panel{padding:18px}.signup-card{padding:26px}}@media(max-width:560px){.signup-card fieldset{grid-template-columns:1fr}.signup-input.slug{grid-template-columns:auto 1fr}.signup-input.slug b{grid-column:2;font-size:11px;padding-bottom:8px}}
`;
