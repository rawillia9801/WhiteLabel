"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Copy, Eye, EyeOff, Globe2, Image as ImageIcon, LoaderCircle, MonitorSmartphone, RefreshCw, Save, Settings2, Sparkles } from "lucide-react";
import type { PuppyWebsiteConfig } from "../../../lib/puppy-website-config";
import "./puppy-website.css";

type Puppy = {
  id: number;
  name: string;
  sex: string | null;
  color: string | null;
  markings?: string | null;
  coat_type?: string | null;
  birth_date: string | null;
  status: string;
  price_cents: number | null;
  buyer_id: number | null;
  photo_url?: string | null;
};

const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "mydogportal.site";
const money = (cents: number | null) => cents == null ? "Price not listed" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
const date = (value: string | null) => value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value.slice(0, 10)}T12:00:00`)) : "";

export default function PuppyWebsiteBuilderPage() {
  const [config, setConfig] = useState<PuppyWebsiteConfig | null>(null);
  const [puppies, setPuppies] = useState<Puppy[]>([]);
  const [kennel, setKennel] = useState({ slug: "", name: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [configResponse, dataResponse] = await Promise.all([
        fetch("/api/puppy-website/config", { cache: "no-store" }),
        fetch("/api/data", { cache: "no-store" }),
      ]);
      const [configPayload, dataPayload] = await Promise.all([
        configResponse.json() as Promise<{ config?: PuppyWebsiteConfig; kennel?: { slug: string; name: string }; error?: string }>,
        dataResponse.json() as Promise<{ puppies?: Puppy[]; error?: string }>,
      ]);
      if (!configResponse.ok || !configPayload.config || !configPayload.kennel) throw new Error(configPayload.error || "Unable to load Puppy Website Builder settings.");
      if (!dataResponse.ok) throw new Error(dataPayload.error || "Unable to load puppy records.");
      setConfig(configPayload.config);
      setKennel(configPayload.kennel);
      setPuppies(dataPayload.puppies || []);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to load the Puppy Website Builder.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(""), 2800); return () => window.clearTimeout(timer); }, [notice]);

  const available = useMemo(() => puppies.filter((puppy) => puppy.buyer_id == null && puppy.status.toLowerCase().includes("avail")), [puppies]);
  const visible = useMemo(() => available.filter((puppy) => !config?.hiddenPuppyIds.includes(puppy.id)), [available, config?.hiddenPuppyIds]);
  const base = kennel.slug ? `https://${kennel.slug}.${platformDomain}` : `https://${platformDomain}`;
  const embedCode = kennel.slug ? `<div id="mydogportal-puppies"></div>\n<script src="${base}/api/website/puppy-embed?kennel=${encodeURIComponent(kennel.slug)}" data-target="mydogportal-puppies" async></script>` : "";
  const headlessUrl = kennel.slug ? `${base}/api/website/puppies?kennel=${encodeURIComponent(kennel.slug)}` : "";

  function patch(values: Partial<PuppyWebsiteConfig>) {
    setConfig((current) => current ? { ...current, ...values } : current);
  }

  function togglePuppy(id: number) {
    if (!config) return;
    const hidden = new Set(config.hiddenPuppyIds);
    if (hidden.has(id)) hidden.delete(id); else hidden.add(id);
    patch({ hiddenPuppyIds: [...hidden] });
  }

  async function save() {
    if (!config) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/puppy-website/config", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(config) });
      const payload = await response.json() as { config?: PuppyWebsiteConfig; error?: string };
      if (!response.ok || !payload.config) throw new Error(payload.error || "Unable to save Puppy Website Builder settings.");
      setConfig(payload.config);
      setNotice("Puppy website settings saved. The live feed is updated.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to save Puppy Website Builder settings.");
    } finally {
      setSaving(false);
    }
  }

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(`${label} copied`);
    } catch {
      setError("Your browser blocked clipboard access. Select and copy the code manually.");
    }
  }

  if (loading) return <main className="puppy-builder-loading"><LoaderCircle size={24}/> Loading Puppy Website Builder…</main>;
  if (!config) return <main className="puppy-builder-loading"><b>Puppy Website Builder is unavailable.</b><span>{error}</span><Link href="/">Return to Breeder OS</Link></main>;

  return <main className="puppy-builder-page">
    <header className="puppy-builder-topbar"><div><Link href="/"><ArrowLeft size={15}/> Breeder OS</Link><small>PUPPIES / WEBSITE BUILDER</small><h1>Publish puppies from the OS to your website</h1><p>One puppy record, two surfaces. Changes made in MyDogPortal automatically flow to the connected public listing.</p></div><button type="button" onClick={() => void save()} disabled={saving}>{saving ? <LoaderCircle size={16}/> : <Save size={16}/>} {saving ? "Saving…" : "Save & publish"}</button></header>
    {error && <div className="puppy-builder-alert error">{error}</div>}{notice && <div className="puppy-builder-alert success"><Check size={15}/>{notice}</div>}
    <div className="puppy-builder-shell">
      <section className="puppy-builder-controls">
        <article className="builder-panel publish-panel"><header><span><Globe2 size={17}/></span><div><small>PUBLIC FEED</small><h2>Website publishing</h2></div><label className="builder-switch"><input type="checkbox" checked={config.enabled} onChange={(event) => patch({ enabled: event.target.checked })}/><i/><b>{config.enabled ? "Live" : "Paused"}</b></label></header><p>When live, only unassigned puppies whose OS status contains “Available” can publish. Assigned, sold, reserved, or deleted puppies automatically leave the feed.</p></article>
        <article className="builder-panel"><header><span><Settings2 size={17}/></span><div><small>CONTENT & STYLE</small><h2>Listing appearance</h2></div></header><div className="builder-form-grid"><label className="wide"><span>Heading</span><input value={config.title} onChange={(event) => patch({ title: event.target.value })}/></label><label className="wide"><span>Introduction</span><textarea rows={4} value={config.introduction} onChange={(event) => patch({ introduction: event.target.value })}/></label><label><span>Layout</span><select value={config.layout} onChange={(event) => patch({ layout: event.target.value as "cards" | "compact" })}><option value="cards">Photo cards</option><option value="compact">Compact rows</option></select></label><label><span>Primary color</span><input type="color" value={config.primaryColor} onChange={(event) => patch({ primaryColor: event.target.value })}/></label><label><span>Accent color</span><input type="color" value={config.accentColor} onChange={(event) => patch({ accentColor: event.target.value })}/></label><label className="wide"><span>Application button text</span><input value={config.applicationLabel} onChange={(event) => patch({ applicationLabel: event.target.value })}/></label><label className="wide"><span>Application URL</span><input type="url" placeholder={`${base}/apply`} value={config.applicationUrl} onChange={(event) => patch({ applicationUrl: event.target.value })}/><small>Leave blank to use this kennel&apos;s MyDogPortal application.</small></label></div><div className="builder-fields-toggle">{[["showPrice","Price"],["showBirthDate","Birth date"],["showSex","Sex"],["showColor","Color"],["showCoat","Coat"],["showMarkings","Markings"]].map(([key,label]) => <label key={key}><input type="checkbox" checked={Boolean(config[key as keyof PuppyWebsiteConfig])} onChange={(event) => patch({ [key]: event.target.checked })}/><span>{label}</span></label>)}</div></article>
        <article className="builder-panel"><header><span><Eye size={17}/></span><div><small>PUBLIC PUPPIES</small><h2>Choose what appears</h2></div><button type="button" className="refresh-button" onClick={() => void load()}><RefreshCw size={14}/> Refresh OS</button></header><div className="builder-puppy-list">{available.map((puppy) => { const shown = !config.hiddenPuppyIds.includes(puppy.id); return <div key={puppy.id}><span className="builder-puppy-photo">{puppy.photo_url ? <img src={puppy.photo_url} alt=""/> : <ImageIcon size={18}/>}</span><p><b>{puppy.name}</b><small>{[puppy.sex,puppy.color,money(puppy.price_cents)].filter(Boolean).join(" · ")}</small></p><button type="button" className={shown ? "shown" : "hidden"} onClick={() => togglePuppy(puppy.id)}>{shown ? <Eye size={14}/> : <EyeOff size={14}/>} {shown ? "Shown" : "Hidden"}</button></div>})}{!available.length && <div className="builder-empty">No unassigned puppies are currently marked Available in the OS.</div>}</div></article>
        <article className="builder-panel install-panel"><header><span><MonitorSmartphone size={17}/></span><div><small>WEBSITE INSTALLATION</small><h2>Embed on the breeder&apos;s website</h2></div></header><div className="install-stack"><div><b>Native live listing</b><p>Paste this into an HTML/code block. It renders responsive puppy cards directly in the website and reads the latest public OS data each time the page loads.</p><textarea readOnly rows={6} value={embedCode}/><button type="button" onClick={() => void copy(embedCode,"Embed code")}><Copy size={14}/> Copy embed code</button></div><div><b>Headless JSON feed</b><p>For a fully custom website design, use the read-only JSON feed. No Supabase credentials are exposed.</p><textarea readOnly rows={3} value={headlessUrl}/><button type="button" onClick={() => void copy(headlessUrl,"Feed URL")}><Copy size={14}/> Copy feed URL</button></div><label><span>Authorized website origins</span><textarea rows={4} placeholder="https://willowcreekchihuahuas.com" value={config.allowedOrigins.join("\n")} onChange={(event) => patch({ allowedOrigins: event.target.value.split(/\r?\n|,/).map((value) => value.trim()).filter(Boolean) })}/><small>Add the full https:// origin for every external website allowed to load this kennel&apos;s puppy feed.</small></label></div></article>
      </section>
      <aside className="puppy-builder-preview"><div className="preview-sticky"><header><span><Sparkles size={16}/></span><div><small>LIVE PREVIEW</small><b>{visible.length} published pupp{visible.length === 1 ? "y" : "ies"}</b></div></header><section style={{ "--preview-primary": config.primaryColor, "--preview-accent": config.accentColor } as React.CSSProperties}><small className="preview-eyebrow">{kennel.name}</small><h2>{config.title}</h2><p>{config.introduction}</p><div className={`preview-puppies ${config.layout}`}>{visible.map((puppy) => <article key={puppy.id}><div className="preview-photo">{puppy.photo_url ? <img src={puppy.photo_url} alt={`${puppy.name} puppy`}/> : <ImageIcon size={26}/>}</div><div><span><h3>{puppy.name}</h3><em>Available</em></span><ul>{config.showSex && puppy.sex && <li>{puppy.sex}</li>}{config.showColor && puppy.color && <li>{puppy.color}</li>}{config.showCoat && puppy.coat_type && <li>{puppy.coat_type}</li>}{config.showMarkings && puppy.markings && <li>{puppy.markings}</li>}{config.showBirthDate && puppy.birth_date && <li>Born {date(puppy.birth_date)}</li>}</ul>{config.showPrice && <strong>{money(puppy.price_cents)}</strong>}<button type="button">{config.applicationLabel}</button></div></article>)}</div>{!visible.length && <div className="preview-empty">No puppies are currently selected for the public feed.</div>}</section></div></aside>
    </div>
  </main>;
}
