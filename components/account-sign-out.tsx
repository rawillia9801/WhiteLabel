"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

export function AccountSignOut() {
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", headers: { accept: "application/json" } });
    } finally {
      window.location.assign("/login");
    }
  }

  return <button className="account-signout" type="button" onClick={() => void signOut()} disabled={busy}><LogOut size={15}/>{busy ? "Signing out…" : "Sign out"}</button>;
}
