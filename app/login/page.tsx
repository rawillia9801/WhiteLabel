"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, KeyRound, Mail, PawPrint, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
      const result = await response.json() as { error?: string; redirect?: string };
      if (!response.ok) throw new Error(result.error || "Unable to sign in.");
      window.location.assign(result.redirect || "/");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in."); setSubmitting(false);
    }
  }

  return <main className="breeder-auth-page">
    <style jsx global>{authStyles}</style>
    <section className="breeder-auth-story">
      <span className="breeder-auth-logo"><PawPrint size={29}/></span>
      <small>BREEDER PORTAL</small>
      <h1>Your kennel’s private workspace.</h1>
      <p>Manage dogs, litters, families, puppy portals, documents, payments, and communication from your own branded address.</p>
      <div className="breeder-auth-domain"><ShieldCheck size={19}/><span><b>One account per person</b><small>No shared kennel password. Sign in with the password you created for your account.</small></span></div>
    </section>
    <section className="breeder-auth-panel">
      <div className="breeder-auth-card">
        <span>KENNEL SIGN IN</span><h2>Welcome back</h2><p>Enter your breeder-account email and password.</p>
        <form onSubmit={submit}>
          <label><span>Email address</span><div className="breeder-auth-input"><Mail size={18}/><input name="email" type="email" autoComplete="email" placeholder="you@yourkennel.com" required/></div></label>
          <label><span>Your password</span><div className="breeder-auth-input"><KeyRound size={18}/><input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required/><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label>
          {error && <div className="breeder-auth-error" role="alert">{error}</div>}
          <button className="breeder-auth-submit" type="submit" disabled={submitting}>{submitting ? "Signing in…" : "Open my kennel"}<ArrowRight size={17}/></button>
        </form>
        <div className="breeder-auth-switch"><b>New to Breeder Portal?</b><span>Create your kennel address and owner account first.</span><Link href="/signup">Create a kennel account</Link></div>
      </div>
    </section>
  </main>;
}

const authStyles = `
*{box-sizing:border-box}body{margin:0}.breeder-auth-page{min-height:100vh;display:grid;grid-template-columns:minmax(360px,.9fr) minmax(440px,1.1fr);background:#f4f8f7;color:#172d33;font-family:var(--font-geist-sans),Arial,sans-serif}.breeder-auth-story{display:flex;flex-direction:column;justify-content:center;padding:clamp(42px,7vw,92px);background:linear-gradient(150deg,#092d39,#0e5360);color:#fff}.breeder-auth-logo{width:58px;height:58px;display:grid;place-items:center;border-radius:18px;background:#38d4d5;color:#062a35;box-shadow:0 16px 38px rgba(0,0,0,.22)}.breeder-auth-story>small{margin-top:28px;color:#72eff0;font-size:12px;font-weight:900;letter-spacing:.18em}.breeder-auth-story h1{max-width:620px;margin:13px 0 18px;color:#fff;font-size:clamp(43px,5.5vw,72px);line-height:1.01;letter-spacing:-.05em}.breeder-auth-story>p{max-width:590px;margin:0;color:#d3e9ec;font-size:17px;line-height:1.65}.breeder-auth-domain{display:flex;gap:13px;align-items:flex-start;max-width:570px;margin-top:34px;padding:17px;border:1px solid rgba(255,255,255,.22);border-radius:18px;background:rgba(255,255,255,.08)}.breeder-auth-domain b,.breeder-auth-domain small{display:block}.breeder-auth-domain small{margin-top:4px;color:#c7e0e4;line-height:1.5}.breeder-auth-panel{display:grid;place-items:center;padding:34px}.breeder-auth-card{width:min(530px,100%);padding:38px;border:1px solid #b9d1d0;border-radius:25px;background:#fff;box-shadow:0 26px 75px rgba(25,66,72,.15)}.breeder-auth-card>span{color:#066e77;font-size:11px;font-weight:900;letter-spacing:.15em}.breeder-auth-card h2{margin:9px 0 8px;color:#172d33;font-size:38px;letter-spacing:-.04em}.breeder-auth-card>p{margin:0 0 25px;color:#526c73;line-height:1.55}.breeder-auth-card form{display:grid;gap:17px}.breeder-auth-card label>span{display:block;margin-bottom:7px;color:#294b53;font-size:12px;font-weight:850}.breeder-auth-input{min-height:51px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;padding:0 14px;border:1px solid #91b3b2;border-radius:12px;background:#fff;color:#335e66}.breeder-auth-input:focus-within{border-color:#087f8c;box-shadow:0 0 0 3px rgba(8,127,140,.16)}.breeder-auth-input input{min-width:0;border:0!important;outline:0!important;background:transparent!important;color:#102f37!important;font:inherit}.breeder-auth-input button{display:grid;place-items:center;padding:6px;border:0;background:transparent;color:#315f67;cursor:pointer}.breeder-auth-submit{min-height:50px;display:flex;align-items:center;justify-content:center;gap:9px;border:0;border-radius:12px;background:#087f8c!important;color:#fff!important;font:inherit;font-weight:900;cursor:pointer}.breeder-auth-submit:disabled{opacity:.6}.breeder-auth-error{padding:12px 14px;border:1px solid #e8a5a0;border-radius:11px;background:#fff0ef;color:#852f2b}.breeder-auth-switch{display:grid;gap:5px;margin-top:25px;padding-top:22px;border-top:1px solid #d5e2e1;color:#526c73}.breeder-auth-switch b{color:#18363d}.breeder-auth-switch a{width:max-content;margin-top:6px;color:#066e77;font-weight:900;text-decoration:none}.breeder-auth-switch a:hover{text-decoration:underline}@media(max-width:850px){.breeder-auth-page{grid-template-columns:1fr}.breeder-auth-story{min-height:440px;padding:38px 26px}.breeder-auth-panel{padding:18px}.breeder-auth-card{padding:27px}}
`;
