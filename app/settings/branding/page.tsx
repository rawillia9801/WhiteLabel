"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Palette } from "lucide-react";

type Settings = {
  name: string;
  slug: string;
  primary_color: string;
  accent_color: string;
  font_family: string;
  primary_breed?: string | null;
  legal_name?: string | null;
  location?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  website_url?: string | null;
  default_puppy_price_cents?: number | null;
  default_deposit_cents?: number | null;
  custom_policy_notice?: string | null;
};

export default function BrandingSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/kennel/settings")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error);
        setSettings(payload);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load kennel settings."));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/kennel/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setSaved(true);
      window.setTimeout(() => window.location.reload(), 650);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save kennel settings.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="brand-settings">
    <style jsx global>{styles}</style>
    <div className="brand-wrap">
      <Link className="brand-back" href="/"><ArrowLeft size={16}/>Back to kennel</Link>
      <section className="brand-card">
        <span className="brand-icon"><Palette/></span>
        <h1>Brand and business setup</h1>
        <p>Set the identity, contact details, starting prices, colors, and font used by your kennel workspace and Buyer Puppy Portals.</p>
        {error && <div className="brand-error" role="alert">{error}</div>}
        {settings && <form onSubmit={submit}>
          <h2>Business identity</h2>
          <div className="field-grid">
            <label><span>Kennel display name</span><input name="name" type="text" defaultValue={settings.name} required/></label>
            <label><span>Primary breed or program</span><input name="primary_breed" type="text" defaultValue={settings.primary_breed || "Dogs"} placeholder="Golden Retrievers"/></label>
            <label><span>Legal business name</span><input name="legal_name" type="text" defaultValue={settings.legal_name || settings.name}/></label>
            <label><span>Business location</span><input name="location" type="text" defaultValue={settings.location || ""} placeholder="City, State"/></label>
            <label><span>Contact email</span><input name="contact_email" type="email" defaultValue={settings.contact_email || ""}/></label>
            <label><span>Contact phone</span><input name="contact_phone" type="tel" defaultValue={settings.contact_phone || ""}/></label>
            <label><span>Website</span><input name="website_url" type="url" defaultValue={settings.website_url || ""} placeholder="https://yourkennel.com"/></label>
          </div>

          <h2>Starting prices</h2>
          <div className="field-grid">
            <label><span>Default puppy price</span><div className="money-input"><b>$</b><input name="default_puppy_price" type="number" min="0" step="0.01" defaultValue={(Number(settings.default_puppy_price_cents) || 0) / 100}/></div></label>
            <label><span>Default deposit</span><div className="money-input"><b>$</b><input name="default_deposit" type="number" min="0" step="0.01" defaultValue={(Number(settings.default_deposit_cents) || 0) / 100}/></div></label>
          </div>

          <h2>Colors and font</h2>
          <div className="color-row">
            <label><span>Primary color</span><div className="color-input"><input name="primary_color" type="color" defaultValue={settings.primary_color}/><code>{settings.primary_color}</code></div></label>
            <label><span>Accent color</span><div className="color-input"><input name="accent_color" type="color" defaultValue={settings.accent_color}/><code>{settings.accent_color}</code></div></label>
          </div>
          <label><span>Font</span><select name="font_family" defaultValue={settings.font_family}><option>Geist</option><option>Arial</option><option>Georgia</option><option>Trebuchet MS</option><option>Verdana</option></select></label>

          <h2>Policy note</h2>
          <label><span>Internal policy note</span><textarea name="custom_policy_notice" rows={3} defaultValue={settings.custom_policy_notice || ""} placeholder="Add an optional internal note for your team."/></label>
          <p className="policy-help">Edit customer-facing applications, agreements, guarantees, and email wording in Automations &amp; templates.</p>

          <div className="brand-preview" style={{ borderTopColor: settings.primary_color, fontFamily: settings.font_family }}>
            <span style={{ color: settings.accent_color }}>{settings.name.toUpperCase()}</span>
            <h3>Your Buyer Puppy Portal</h3>
            <p>High-contrast text stays readable while your own colors and font shape the experience.</p>
          </div>
          {saved && <div className="brand-saved"><CheckCircle2 size={16}/> Settings saved. Refreshing…</div>}
          <button className="brand-submit" disabled={busy}>{busy ? "Saving…" : "Save kennel settings"}</button>
        </form>}
      </section>
    </div>
  </main>;
}

const styles = `
*{box-sizing:border-box}body{margin:0;background:#eef5f4;color:#17343b}.brand-settings{min-height:100vh;padding:32px;font-family:var(--font-geist-sans),Arial,sans-serif}.brand-wrap{width:min(860px,100%);margin:auto}.brand-back{display:inline-flex;gap:7px;align-items:center;color:#075f69;font-weight:800;text-decoration:none}.brand-card{margin-top:22px;padding:34px;border:1px solid #abc9c7;border-radius:22px;background:#fff;box-shadow:0 22px 65px rgba(25,66,72,.12)}.brand-icon{width:52px;height:52px;display:grid;place-items:center;border-radius:15px;background:#dff3f0;color:#087f8c}.brand-card h1{margin:18px 0 8px;font-size:36px}.brand-card>p{color:#567179;line-height:1.6}.brand-card form{display:grid;gap:17px;margin-top:24px}.brand-card form h2{margin:17px 0 -4px;padding-top:17px;border-top:1px solid #d6e4e2;color:#244c54;font-size:18px}.brand-card label>span{display:block;margin-bottom:7px;font-size:12px;font-weight:850}.brand-card input:not([type=color]),.brand-card select,.brand-card textarea{width:100%;min-height:49px;padding:0 13px;border:1px solid #8fb2b0;border-radius:11px;background:white;color:#17343b;font:inherit}.brand-card textarea{padding:12px 13px;resize:vertical}.field-grid,.color-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}.color-input{display:grid;grid-template-columns:58px 1fr;align-items:center;gap:9px}.color-input input[type=color]{width:58px;height:49px;padding:3px;border:1px solid #8fb2b0;border-radius:11px;background:#fff}.color-input code{color:#47656b}.money-input{display:grid;grid-template-columns:auto 1fr;align-items:center;border:1px solid #8fb2b0;border-radius:11px;padding-left:13px}.money-input input{border:0!important}.brand-submit{min-height:49px;border:0;border-radius:12px;background:#087f8c;color:white;font-weight:900}.brand-error,.brand-saved{display:flex;align-items:center;gap:7px;padding:13px;border-radius:11px}.brand-error{background:#fff0ef;color:#8d302b}.brand-saved{background:#e9f8ef;color:#176344}.brand-preview{padding:24px;border:1px solid #b8cfcd;border-top:8px solid #087f8c;border-radius:14px;background:#f8fbfa}.brand-preview span{font-weight:900}.brand-preview h3{font-size:24px}.policy-help{margin:-7px 0 3px;color:#61777c;font-size:12px}@media(max-width:650px){.brand-settings{padding:17px}.brand-card{padding:24px}.field-grid,.color-row{grid-template-columns:1fr}}
`;
