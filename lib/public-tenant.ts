export const publicTenant = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "Your Breeder OS",
  shortName: process.env.NEXT_PUBLIC_BRAND_SHORT_NAME || "BREEDER OS",
  tagline: process.env.NEXT_PUBLIC_BRAND_TAGLINE || "Thoughtful breeding. Organized beautifully.",
  email: process.env.NEXT_PUBLIC_BREEDER_EMAIL || "hello@example.com",
  phone: process.env.NEXT_PUBLIC_BREEDER_PHONE || "+1 555 123 4567",
  website: process.env.NEXT_PUBLIC_BREEDER_WEBSITE || "https://example.com",
  location: process.env.NEXT_PUBLIC_BREEDER_LOCATION || "Your City, State",
  locale: process.env.NEXT_PUBLIC_LOCALE || "en-US",
  currency: process.env.NEXT_PUBLIC_CURRENCY || "USD",
  features: {
    phoneCenter: process.env.NEXT_PUBLIC_FEATURE_PHONE_CENTER === "true",
    transportation: process.env.NEXT_PUBLIC_FEATURE_TRANSPORTATION === "true",
    familyPortal: process.env.NEXT_PUBLIC_FEATURE_FAMILY_PORTAL !== "false",
    applications: process.env.NEXT_PUBLIC_FEATURE_APPLICATIONS !== "false",
  },
};

export const tenantInitials = publicTenant.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
