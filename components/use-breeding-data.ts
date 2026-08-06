"use client";

import { useCallback, useEffect, useState } from "react";
import { emptyBreedingData, type BreedingDataSet } from "../types/breeding";

export function useBreedingData() {
  const [data, setData] = useState<BreedingDataSet & { litters: Record<string, unknown>[]; puppies: Record<string, unknown>[]; buyers: Record<string, unknown>[]; events: Record<string, unknown>[] }>({ ...emptyBreedingData, litters: [], puppies: [], buyers: [], events: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/breeding", { cache: "no-store" });
      const payload = await response.json() as typeof data & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to load breeding records.");
      setData((current) => ({ ...current, ...payload }));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to load breeding records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const act = useCallback(async (action: string, record: Record<string, unknown>) => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/breeding", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, data: record }) });
      const payload = await response.json() as Record<string, unknown> & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to save the breeding record.");
      await refresh();
      return payload;
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : "Unable to save the breeding record.";
      setError(message);
      throw failure;
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  return { data, loading, saving, error, setError, refresh, act };
}
