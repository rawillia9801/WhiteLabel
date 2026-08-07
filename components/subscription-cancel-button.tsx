"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

export function SubscriptionCancelButton() {
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<"idle" | "working" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function cancelSubscription() {
    setStatus("working");
    setMessage("");
    try {
      const response = await fetch("/api/paypal/subscriptions/cancel", {
        method: "POST",
        headers: { accept: "application/json" },
      });
      const payload = await response.json().catch(() => null) as { error?: string; message?: string } | null;
      if (!response.ok) throw new Error(payload?.error || "Unable to cancel the subscription.");
      setStatus("success");
      setMessage(payload?.message || "Your MyDogPortal subscription has been cancelled.");
      window.setTimeout(() => window.location.reload(), 1400);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to cancel the subscription.");
    }
  }

  if (!confirming) {
    return <button className="subscription-cancel-trigger" type="button" onClick={() => setConfirming(true)}>
      Cancel subscription
    </button>;
  }

  return <div className="subscription-cancel-panel" role="region" aria-label="Cancel MyDogPortal subscription">
    {status === "success" ? <div className="subscription-cancel-message success"><CheckCircle2 size={15}/><span>{message}</span></div> : <>
      <div className="subscription-cancel-copy">
        <span className="subscription-cancel-icon"><AlertTriangle size={15}/></span>
        <div><b>Cancel MyDogPortal subscription?</b><span>This stops future recurring MyDogPortal subscription billing. No phone call, email, or support ticket is required.</span></div>
      </div>
      {status === "error" && <div className="subscription-cancel-message error" role="alert">{message}</div>}
      <div className="subscription-cancel-actions">
        <button type="button" className="keep-subscription" disabled={status === "working"} onClick={() => { setConfirming(false); setStatus("idle"); setMessage(""); }}>
          <X size={13}/> Keep subscription
        </button>
        <button type="button" className="confirm-cancellation" disabled={status === "working"} onClick={cancelSubscription}>
          {status === "working" ? "Cancelling…" : "Yes, cancel subscription"}
        </button>
      </div>
    </>}
  </div>;
}
