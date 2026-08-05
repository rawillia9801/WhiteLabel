"use client";

import { createContext, useContext } from "react";

export type RuntimeTenant = {
  name: string;
  slug: string;
  plan: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
};

const fallback: RuntimeTenant = { name: "Breeder Portal", slug: "", plan: "starter", primaryColor: "#087f8c", accentColor: "#c68b24", fontFamily: "Geist" };
const TenantContext = createContext<RuntimeTenant>(fallback);

export function TenantRuntimeProvider({ tenant, children }: { tenant?: RuntimeTenant | null; children: React.ReactNode }) {
  return <TenantContext.Provider value={tenant || fallback}>{children}</TenantContext.Provider>;
}

export function useTenant() { return useContext(TenantContext); }
