import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { ApplicationStatusSelectEnhancer } from "../components/application-status-select-enhancer";
import { PuppyStatusSelectEnhancer } from "../components/puppy-status-select-enhancer";
import { CommandDashboardEnhancer } from "../components/command-dashboard-enhancer";
import { NavigationGroupEnhancer } from "../components/navigation-group-enhancer";
import { BuyerEditEnhancer } from "../components/buyer-edit-enhancer";
import { PortalJourneyEnhancer } from "../components/portal-journey-enhancer";
import { PuppyPacketDesignEnhancer } from "../components/puppy-packet-design-enhancer";
import { PuppyPacketEmailEnhancer } from "../components/puppy-packet-email-enhancer";
import { ProfilePhotoEnhancer } from "../components/profile-photo-enhancer";
import { BreedingDogRosterEnhancer } from "../components/breeding-dog-roster-enhancer";
import { DataReconciliationEnhancer } from "../components/data-reconciliation-enhancer";
import { TenantTheme } from "../components/tenant-theme";
import { tenantConfig } from "../lib/tenant-config";
import "./globals.css";
import "./breeder-os.css";
import "./breeder-os-sidebar.css";
import "./command-dashboard-cards.css";
import "./navigation-group-enhancer.css";
import "./buyer-edit-enhancer.css";
import "./portal-journey-enhancer.css";
import "./milestone-manager.css";
import "./puppy-packet-design.css";
import "./puppy-packet-email.css";
import "./swvaos-professional.css";
import "./swvaos-contrast.css";
import "./swvaos-locked-theme.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const imageUrl = new URL(tenantConfig.brand.socialImageUrl, `${protocol}://${host}`).toString();
  const title = tenantConfig.brand.name;
  const description = tenantConfig.brand.description;
  return {
    title,
    description,
    icons: { icon: tenantConfig.brand.faviconUrl, shortcut: tenantConfig.brand.faviconUrl },
    openGraph: { title, description, images: [{ url: imageUrl, width: 1680, height: 941, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [imageUrl] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang={tenantConfig.locale.language}><body className={`${geistSans.variable} ${geistMono.variable}`}><TenantTheme /><ApplicationStatusSelectEnhancer /><PuppyStatusSelectEnhancer /><CommandDashboardEnhancer /><NavigationGroupEnhancer /><BuyerEditEnhancer /><PortalJourneyEnhancer /><PuppyPacketDesignEnhancer /><PuppyPacketEmailEnhancer /><ProfilePhotoEnhancer /><BreedingDogRosterEnhancer /><DataReconciliationEnhancer />{children}</body></html>;
}
