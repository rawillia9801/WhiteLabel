"use client";

import { createContext, useContext } from "react";

export type RuntimeTenant = {
  name: string;
  slug: string;
  plan: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  primaryBreed: string;
  contactEmail: string;
  contactPhone: string;
  websiteUrl: string;
};

const fallback: RuntimeTenant = { name: "Breeder Portal", slug: "", plan: "starter", primaryColor: "#087f8c", accentColor: "#c68b24", fontFamily: "Geist", primaryBreed: "Dogs", contactEmail: "", contactPhone: "", websiteUrl: "" };
const TenantContext = createContext<RuntimeTenant>(fallback);

export function TenantRuntimeProvider({ tenant, children }: { tenant?: RuntimeTenant | null; children: React.ReactNode }) {
  return <TenantContext.Provider value={tenant || fallback}>{children}</TenantContext.Provider>;
}

export function useTenant() { return useContext(TenantContext); }
