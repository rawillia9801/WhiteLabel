"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Copy, ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import { useTenant } from "./tenant-runtime";
import {
  APPLICATION_FIELD_MAPPINGS,
  APPLICATION_FIELD_TYPES,
  type ApplicationField,
  type ApplicationFormConfig,
} from "../lib/application-form";

const protectedMappings = new Set(["full_name", "email", "phone"]);

type ApplicationBuilderProps = {
  config: ApplicationFormConfig;
  onSaved: (config: ApplicationFormConfig) => void;
  demoMode?: boolean;
  demoTenant?: { slug: string; name: string; websiteUrl?: string };
};

export function ApplicationBuilder({ config, onSaved, demoMode = false, demoTenant }: ApplicationBuilderProps) {
  const tenant = useTenant();
  const [draft, setDraft] = useState(config);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const updateField = (id: string, next: Partial<ApplicationField>) => setDraft((current) => ({ ...current, fields: current.fields.map((field) => field.id === id ? { ...field, ...next } : field) }));
  const moveField = (id: string, direction: -1 | 1) => setDraft((current) => {
    const index = current.fields.findIndex((field) => field.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= current.fields.length) return current;
    const fields = [...current.fields];
    [fields[index], fields[target]] = [fields[target], fields[index]];
    return { ...current, fields };
  });
  const removeField = (field: ApplicationField) => {
    if (protectedMappings.has(field.mapping)) return;
    setDraft((current) => ({ ...current, fields: current.fields.filter((item) => item.id !== field.id) }));
  };
  const addField = () => {
    const id = `custom_${Date.now().toString(36)}`;
    setDraft((current) => ({ ...current, fields: [...current.fields, { id, key: id, label: "New application question", type: "text", section: "Custom questions", required: false, options: [], mapping: "none", help: "" }] }));
  };

  async function save() {
    setSaving(true); setMessage("");
    try {
      if (demoMode) {
        onSaved(draft);
        setMessage("Interactive demo updated for this session. No breeder or customer data was changed.");
        return;
      }
      const response = await fetch("/api/applications/config", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) });
      const payload = await response.json() as ApplicationFormConfig & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to save the application form.");
      setDraft(payload); onSaved(payload); setMessage("Application builder saved. The hosted and embedded form is updated.");
    } catch (failure) {
      setMessage(failure instanceof Error ? failure.message : "Unable to save the application form.");
    } finally { setSaving(false); }
  }

  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "mydogportal.site";
  const tenantSlug = demoTenant?.slug || tenant.slug;
  const applicationUrl = tenantSlug ? `https://${tenantSlug}.${platformDomain}/apply` : "/apply";
  const embedCode = `<iframe src="${applicationUrl}" title="Puppy application" loading="lazy" style="width:100%;min-height:1100px;border:0;border-radius:16px" allow="clipboard-write"></iframe>`;
  const applicationOrigin = tenantSlug ? `https://${tenantSlug}.${platformDomain}` : "";
  const configUrl = `${applicationOrigin}/api/website/application-config`;
  const submissionUrl = `${applicationOrigin}/api/website/applications`;
  const nativeEmbedCode = `<div id="mydogportal-application"></div>\n<script src="${applicationOrigin}/api/website/application-embed" data-target="mydogportal-application"></script>`;
  const headlessEndpoints = `GET  ${configUrl}\nPOST ${submissionUrl}`;
  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(demoMode ? "Sample installation code copied. Demo data remains isolated." : "Copied to clipboard.");
    } catch {
      setMessage("Your browser blocked clipboard access. Select and copy the text manually.");
    }
  };

  return <div className="application-builder-layout">
    <section className="applications-panel application-builder-panel">
      <div className="panel-title builder-title"><div><span>{demoMode ? `${demoTenant?.name || "Sample kennel"} · application builder` : "Application builder"}</span><h2>Build the questions your program actually needs</h2><p>Name, email, and phone stay protected so every submission can connect to a family record.</p></div><button className="builder-save" type="button" disabled={saving} onClick={() => void save()}><Save size={16} /> {saving ? "Saving…" : demoMode ? "Preview changes" : "Save application"}</button></div>
      <div className="builder-settings">
        <label><span>Form title</span><input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} /></label>
        <label className="wide"><span>Introduction</span><textarea rows={3} value={draft.introduction} onChange={(event) => setDraft((current) => ({ ...current, introduction: event.target.value }))} /></label>
        <label><span>Submit button</span><input value={draft.submitLabel} onChange={(event) => setDraft((current) => ({ ...current, submitLabel: event.target.value }))} /></label>
        <label><span>Success message</span><input value={draft.successMessage} onChange={(event) => setDraft((current) => ({ ...current, successMessage: event.target.value }))} /></label>
        <label className="wide"><span>Authorized breeder website origins</span><textarea rows={3} placeholder="https://puppybreeder.com" value={(draft.allowedOrigins ?? []).join("\n")} onChange={(event) => setDraft((current) => ({ ...current, allowedOrigins: event.target.value.split(/\r?\n|,/).map((value) => value.trim()).filter(Boolean) }))} /><small>Add every website allowed to load and submit this application. Use the full https:// origin. The kennel website configured in MyDogPortal is also accepted automatically.</small></label>
      </div>
      <div className="builder-fields">
        {draft.fields.map((field, index) => {
          const locked = protectedMappings.has(field.mapping);
          const hasOptions = field.type === "select" || field.type === "radio";
          return <article className="builder-field" key={field.id}>
            <header><div><small>QUESTION {index + 1}</small><b>{field.label}</b></div><div><button type="button" title="Move up" disabled={index === 0} onClick={() => moveField(field.id, -1)}><ArrowUp size={14} /></button><button type="button" title="Move down" disabled={index === draft.fields.length - 1} onClick={() => moveField(field.id, 1)}><ArrowDown size={14} /></button><button type="button" title={locked ? "Required identity field" : "Delete question"} disabled={locked} onClick={() => removeField(field)}><Trash2 size={14} /></button></div></header>
            <div className="builder-field-grid">
              <label className="wide"><span>Question</span><input value={field.label} onChange={(event) => updateField(field.id, { label: event.target.value })} /></label>
              <label><span>Section</span><input value={field.section} onChange={(event) => updateField(field.id, { section: event.target.value })} /></label>
              <label><span>Answer type</span><select value={field.type} onChange={(event) => updateField(field.id, { type: event.target.value as ApplicationField["type"] })}>{APPLICATION_FIELD_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
              <label><span>Use this answer as</span><select value={field.mapping} disabled={locked} onChange={(event) => updateField(field.id, { mapping: event.target.value as ApplicationField["mapping"] })}>{APPLICATION_FIELD_MAPPINGS.map((mapping) => <option key={mapping.value} value={mapping.value} disabled={mapping.value !== "none" && mapping.value !== field.mapping && draft.fields.some((item) => item.mapping === mapping.value)}>{mapping.label}</option>)}</select></label>
              <label className="builder-required"><input type="checkbox" checked={field.required} disabled={locked} onChange={(event) => updateField(field.id, { required: event.target.checked })} /><span>Required answer</span></label>
              {hasOptions && <label className="wide"><span>Choices — separate with commas</span><input value={field.options.join(", ")} onChange={(event) => updateField(field.id, { options: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label>}
              <label className="wide"><span>Optional help text</span><input value={field.help || ""} onChange={(event) => updateField(field.id, { help: event.target.value })} /></label>
            </div>
          </article>;
        })}
      </div>
      <footer className="builder-footer"><button type="button" onClick={addField}><Plus size={16} /> Add question</button><span>{draft.fields.length} questions · answers are stored with each applicant</span></footer>
      {message && <div className="builder-message" role="status">{message}</div>}
    </section>

    <aside className="applications-panel application-install-panel">
      <div className="panel-title"><span>Website installation</span><h2>Put this application on any website</h2></div>
      <div className="install-body">
        <div className="install-card"><small>DIRECT APPLICATION LINK</small><a href={applicationUrl} target="_blank" rel="noreferrer">{applicationUrl} <ExternalLink size={13} /></a><button type="button" onClick={() => void copy(applicationUrl)}><Copy size={14} /> Copy link</button></div>
        <div className="install-card"><small>EMBED ON AN EXISTING WEBSITE</small><p>Paste this iframe into an HTML/embed block on the breeder&apos;s website. The form stays managed by MyDogPortal.</p><textarea readOnly rows={7} value={embedCode} /><button type="button" onClick={() => void copy(embedCode)}><Copy size={14} /> Copy embed code</button></div>
        <div className="install-card"><small>NATIVE WEBSITE INSTALL · FULLY CUSTOMIZABLE</small><p>Use this on WordPress, Wix custom code, Squarespace code blocks, or a custom website. The form renders into the website DOM so the breeder&apos;s CSS can restyle every .mdp-* element while MyDogPortal still owns the questions, intake, automations, and document mappings.</p><textarea readOnly rows={7} value={nativeEmbedCode} /><button type="button" onClick={() => void copy(nativeEmbedCode)}><Copy size={14} /> Copy native install code</button></div>
        <div className="install-card"><small>HEADLESS / DEVELOPER INTEGRATION</small><p>For a completely custom form layout, build any HTML/UI you want, load the published field schema from the GET endpoint, and POST the answers to the submission endpoint. No Supabase key or private credential belongs on the breeder website.</p><textarea readOnly rows={4} value={headlessEndpoints} /><button type="button" onClick={() => void copy(headlessEndpoints)}><Copy size={14} /> Copy API endpoints</button></div>
        <div className="install-card install-flow"><small>CONNECTED WORKFLOW</small><ol><li>Family submits the hosted form.</li><li>Answers land in the application queue.</li><li>Breeder filters and reviews the answers.</li><li>Approval unlocks document preparation.</li><li>Mapped answers prefill agreements.</li></ol></div>
      </div>
    </aside>
  </div>;
}
