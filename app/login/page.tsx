"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, KeyRound, Mail, PawPrint, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
      const result = await response.json() as { error?: string; redirect?: string };
      if (!response.ok) throw new Error(result.error || "Unable to sign in.");
      window.location.assign(result.redirect || "/");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in.");
      setSubmitting(false);
    }
  }

  return <main className="breeder-auth-page">
    <section className="breeder-auth-story">
      <span className="breeder-auth-logo"><PawPrint size={27}/></span>
      <small>MYDOGPORTAL BREEDER OS</small>
      <h1>The operating system behind your breeding program.</h1>
      <p>Move from pairing plans to puppy go-home with every dog, litter, family, payment, document, and milestone connected.</p>
      <div className="breeder-auth-domain"><ShieldCheck size={19}/><span><b>Private breeder workspace</b><small>Sign in with your MyDogPortal account. Your kennel records remain isolated from every other breeder.</small></span></div>
    </section>
    <section className="breeder-auth-panel">
      <div className="breeder-auth-card">
        <span>KENNEL SIGN IN</span><h2>Welcome back</h2><p>Open your breeder command center.</p>
        <form onSubmit={submit}>
          <label><span>Email address</span><div className="breeder-auth-input"><Mail size={18}/><input name="email" type="email" autoComplete="email" placeholder="you@yourkennel.com" required/></div></label>
          <label><span>Password</span><div className="breeder-auth-input"><KeyRound size={18}/><input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required/><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label>
          {error && <div className="breeder-auth-error" role="alert">{error}</div>}
          <button className="breeder-auth-submit" type="submit" disabled={submitting}>{submitting ? "Signing in…" : "Open my kennel"}<ArrowRight size={17}/></button>
        </form>
        <div className="breeder-auth-switch"><b>New to MyDogPortal?</b><span>Claim your kennel address and create the owner account.</span><Link href="/signup">Create a kennel account</Link></div>
      </div>
    </section>
  </main>;
}
