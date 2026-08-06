"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ApplicationField, ApplicationFormConfig } from "../../lib/application-form";
import styles from "./apply.module.css";

type PublicConfig = { kennel: { name: string }; form: ApplicationFormConfig };

function ApplicationInput({ field }: { field: ApplicationField }) {
  const requiredMark = field.required ? <span className={styles.required}> *</span> : null;
  if (field.type === "checkbox") return <label className={styles.checkbox}><input name={field.key} type="checkbox" required={field.required} /><span>{field.label}{requiredMark}{field.help ? <small> {field.help}</small> : null}</span></label>;
  if (field.type === "radio") return <div className={`${styles.field} ${styles.wide}`}><span>{field.label}{requiredMark}</span><div className={styles.choiceGrid}>{field.options.map((option) => <label className={styles.choice} key={option}><input name={field.key} type="radio" value={option} required={field.required} />{option}</label>)}</div>{field.help ? <small>{field.help}</small> : null}</div>;
  if (field.type === "select") return <label className={styles.field}><span>{field.label}{requiredMark}</span><select name={field.key} required={field.required} defaultValue=""><option value="" disabled>Select one</option>{field.options.map((option) => <option key={option}>{option}</option>)}</select>{field.help ? <small>{field.help}</small> : null}</label>;
  if (field.type === "textarea") return <label className={`${styles.field} ${styles.wide}`}><span>{field.label}{requiredMark}</span><textarea name={field.key} required={field.required} />{field.help ? <small>{field.help}</small> : null}</label>;
  return <label className={styles.field}><span>{field.label}{requiredMark}</span><input name={field.key} type={field.type} required={field.required} />{field.help ? <small>{field.help}</small> : null}</label>;
}

export default function PublicApplicationPage() {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/website/application-config", { cache: "no-store", signal: controller.signal })
      .then(async (response) => { const payload = await response.json() as PublicConfig & { error?: string }; if (!response.ok) throw new Error(payload.error || "Unable to load this application."); setConfig(payload); })
      .catch((failure) => { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Unable to load this application."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const sections = useMemo(() => config ? [...new Set(config.form.fields.map((field) => field.section))] : [], [config]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!config) return;
    const formElement = event.currentTarget;
    setSending(true); setError(""); setSuccess("");
    const form = new FormData(formElement);
    const application: Record<string, string | boolean> = {};
    for (const field of config.form.fields) application[field.key] = field.type === "checkbox" ? form.get(field.key) === "on" : String(form.get(field.key) ?? "");
    application.company = String(form.get("company") ?? "");
    try {
      const response = await fetch("/api/website/applications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ application }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to submit your application.");
      formElement.reset();
      setSuccess(config.form.successMessage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to submit your application.");
    } finally { setSending(false); }
  }

  if (loading) return <main className={styles.state}><h1>Loading application…</h1><p>Connecting to the breeder&apos;s application form.</p></main>;
  if (!config) return <main className={styles.state}><h1>Application unavailable</h1><p>{error || "This form is not currently available."}</p></main>;

  return <main className={styles.page}><div className={styles.shell}>
    <section className={styles.hero}><small>{config.kennel.name.toUpperCase()}</small><h1>{config.form.title}</h1><p>{config.form.introduction}</p></section>
    {error && <div className={styles.error} role="alert">{error}</div>}
    {success && <div className={styles.success} role="status">{success}</div>}
    <form className={styles.form} onSubmit={submit}>
      <label className={styles.honeypot} aria-hidden="true">Company<input name="company" tabIndex={-1} autoComplete="off" /></label>
      {sections.map((section) => <section className={styles.section} key={section}><h2>{section}</h2><div className={styles.grid}>{config.form.fields.filter((field) => field.section === section).map((field) => <ApplicationInput field={field} key={field.id} />)}</div></section>)}
      <footer className={styles.footer}><p>Submitting this form sends your answers to {config.kennel.name} for review. It does not guarantee approval, reserve a puppy, or create a purchase agreement.</p><button disabled={sending}>{sending ? "Submitting…" : config.form.submitLabel}</button></footer>
    </form>
  </div></main>;
}
