import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { ApplicationStatusSelectEnhancer } from "../components/application-status-select-enhancer";
import { PuppyStatusSelectEnhancer } from "../components/puppy-status-select-enhancer";
import { BuyerEditEnhancer } from "../components/buyer-edit-enhancer";
import { PortalJourneyEnhancer } from "../components/portal-journey-enhancer";
import { PuppyPacketDesignEnhancer } from "../components/puppy-packet-design-enhancer";
import { PuppyPacketEmailEnhancer } from "../components/puppy-packet-email-enhancer";
import { ProfilePhotoEnhancer } from "../components/profile-photo-enhancer";
import { BreedingDogRosterEnhancer } from "../components/breeding-dog-roster-enhancer";
import { DataReconciliationEnhancer } from "../components/data-reconciliation-enhancer";
import { BreederAccountLauncher } from "../components/breeder-account-launcher";
import { TenantTheme } from "../components/tenant-theme";
import { TenantRuntimeProvider, type RuntimeTenant } from "../components/tenant-runtime";
import { tenantConfig } from "../lib/tenant-config";
import { findKennelByHost, findKennelById } from "../lib/supabase-auth";
import "./globals.css";
import "./buyer-edit-enhancer.css";
import "./portal-journey-enhancer.css";
import "./milestone-manager.css";
import "./puppy-packet-design.css";
import "./puppy-packet-email.css";
import "./breeding-management.css";
import "./breeder-os.css";
import "./breeder-auth.css";
import "./breeder-account-launcher.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

async function requestTenant(): Promise<RuntimeTenant | null> {
  try {
    const requestHeaders = await headers();
    const kennelId = requestHeaders.get("x-kennel-id") || "";
    const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "";
    const kennel = kennelId ? await findKennelById(kennelId) : await findKennelByHost(host);
    return kennel ? {
      name: kennel.name, slug: kennel.slug, plan: kennel.plan,
      primaryColor: kennel.primary_color || tenantConfig.theme.primary,
      accentColor: kennel.accent_color || tenantConfig.theme.accent,
      fontFamily: kennel.font_family || "Geist",
      primaryBreed: kennel.primary_breed || "Dogs",
      contactEmail: kennel.contact_email || "",
      contactPhone: kennel.contact_phone || "",
      websiteUrl: kennel.website_url || "",
    } : null;
  } catch { return null; }
}

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const imageUrl = new URL(tenantConfig.brand.socialImageUrl, `${protocol}://${host}`).toString();
  const tenant = await requestTenant();
  const title = tenant?.name || tenantConfig.brand.name;
  const description = tenantConfig.brand.description;
  return {
    title,
    description,
    icons: { icon: tenantConfig.brand.faviconUrl, shortcut: tenantConfig.brand.faviconUrl },
    openGraph: { title, description, images: [{ url: imageUrl, width: 1680, height: 941, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [imageUrl] },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const tenant = await requestTenant();
  const publicSurface = (await headers()).get("x-public-surface") === "1";
  return <html lang={tenantConfig.locale.language}><body className={`${geistSans.variable} ${geistMono.variable}`}><TenantTheme primary={tenant?.primaryColor} accent={tenant?.accentColor} fontFamily={tenant?.fontFamily}/><TenantRuntimeProvider tenant={tenant}>{!publicSurface && <><ApplicationStatusSelectEnhancer /><PuppyStatusSelectEnhancer /><BuyerEditEnhancer /><PortalJourneyEnhancer /><PuppyPacketDesignEnhancer /><PuppyPacketEmailEnhancer /><ProfilePhotoEnhancer /><BreedingDogRosterEnhancer /><DataReconciliationEnhancer /><BreederAccountLauncher /></>}{children}</TenantRuntimeProvider></body></html>;
}
