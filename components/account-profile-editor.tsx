"use client";

import { type ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import { Building2, CheckCircle2, Globe2, LoaderCircle, Mail, MapPin, Phone, Save, UserRound } from "lucide-react";

type AccountProfile = {
  kennelName: string;
  legalName: string;
  primaryBreed: string;
  publicLocation: string;
  contactEmail: string;
  contactPhone: string;
  websiteUrl: string;
  contactName: string;
  secondaryEmail: string;
  secondaryPhone: string;
  mailingAddress1: string;
  mailingAddress2: string;
  mailingCity: string;
  mailingState: string;
  mailingPostalCode: string;
  mailingCountry: string;
  billingContactName: string;
  billingEmail: string;
  billingPhone: string;
};

const empty: AccountProfile = {
  kennelName: "", legalName: "", primaryBreed: "", publicLocation: "", contactEmail: "", contactPhone: "", websiteUrl: "",
  contactName: "", secondaryEmail: "", secondaryPhone: "", mailingAddress1: "", mailingAddress2: "", mailingCity: "", mailingState: "", mailingPostalCode: "", mailingCountry: "United States",
  billingContactName: "", billingEmail: "", billingPhone: "",
};

export function AccountProfileEditor() {
  const [profile, setProfile] = useState<AccountProfile>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/account/profile", { cache: "no-store" });
      const payload = await response.json() as { profile?: AccountProfile; error?: string };
      if (!response.ok || !payload.profile) throw new Error(payload.error || "Unable to load breeder profile.");
      setProfile({ ...empty, ...payload.profile });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to load breeder profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function field(key: keyof AccountProfile) {
    return { value: profile[key], onChange: (event: ChangeEvent<HTMLInputElement>) => setProfile((current) => ({ ...current, [key]: event.target.value })) };
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/account/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(profile) });
      const payload = await response.json() as { profile?: AccountProfile; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to save breeder profile.");
      if (payload.profile) setProfile((current) => ({ ...current, ...payload.profile }));
      setMessage("Breeder profile saved. Your contact and mailing information is now updated.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to save breeder profile.");
    } finally {
      setSaving(false);
    }
  }

  return <section className="account-card account-profile-editor-card" id="profile">
    <header><div><small>BREEDER PROFILE</small><h2>Business, contact & mailing information</h2><p>Keep the information MyDogPortal uses for your account, business identity, correspondence, and billing contacts current.</p></div><UserRound size={20}/></header>
    {loading ? <div className="account-profile-loading"><LoaderCircle size={19}/> Loading breeder information…</div> : <form className="account-profile-form" onSubmit={save}>
      {error && <div className="account-profile-message error">{error}</div>}
      {message && <div className="account-profile-message success"><CheckCircle2 size={15}/>{message}</div>}

      <section><header><Building2 size={17}/><div><b>Breeding business</b><span>Your operating and public-facing business details.</span></div></header><div className="account-profile-fields">
        <label><span>Kennel / business name</span><input required {...field("kennelName")}/></label>
        <label><span>Legal business name</span><input {...field("legalName")}/></label>
        <label><span>Primary breed</span><input {...field("primaryBreed")}/></label>
        <label><span>Public location</span><input {...field("publicLocation")} placeholder="City, State"/></label>
        <label className="wide"><span>Website</span><div className="profile-input-icon"><Globe2 size={14}/><input type="url" {...field("websiteUrl")} placeholder="https://example.com"/></div></label>
      </div></section>

      <section><header><UserRound size={17}/><div><b>Primary contact</b><span>How MyDogPortal and customers can reach the breeder account.</span></div></header><div className="account-profile-fields">
        <label><span>Primary contact name</span><input {...field("contactName")}/></label>
        <label><span>Business email</span><div className="profile-input-icon"><Mail size={14}/><input type="email" {...field("contactEmail")}/></div></label>
        <label><span>Business phone</span><div className="profile-input-icon"><Phone size={14}/><input type="tel" {...field("contactPhone")}/></div></label>
        <label><span>Backup email</span><input type="email" {...field("secondaryEmail")}/></label>
        <label><span>Backup phone</span><input type="tel" {...field("secondaryPhone")}/></label>
      </div></section>

      <section><header><MapPin size={17}/><div><b>Mailing address</b><span>Private business correspondence and account mailing address.</span></div></header><div className="account-profile-fields">
        <label className="wide"><span>Street address</span><input {...field("mailingAddress1")}/></label>
        <label className="wide"><span>Address line 2</span><input {...field("mailingAddress2")} placeholder="Suite, unit, PO Box, etc."/></label>
        <label><span>City</span><input {...field("mailingCity")}/></label>
        <label><span>State / province</span><input {...field("mailingState")}/></label>
        <label><span>ZIP / postal code</span><input {...field("mailingPostalCode")}/></label>
        <label><span>Country</span><input {...field("mailingCountry")}/></label>
      </div></section>

      <section><header><Mail size={17}/><div><b>Billing contact</b><span>Optional contact information specifically for subscription and billing notices.</span></div></header><div className="account-profile-fields">
        <label><span>Billing contact name</span><input {...field("billingContactName")}/></label>
        <label><span>Billing email</span><input type="email" {...field("billingEmail")}/></label>
        <label><span>Billing phone</span><input type="tel" {...field("billingPhone")}/></label>
      </div></section>

      <footer><span>Changes save to this breeder account only.</span><button type="submit" disabled={saving}>{saving ? <LoaderCircle size={15}/> : <Save size={15}/>} {saving ? "Saving…" : "Save breeder profile"}</button></footer>
    </form>}
  </section>;
}
