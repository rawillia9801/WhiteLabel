export type TenantConfig = {
  brand: {
    name: string;
    shortName: string;
    tagline: string;
    description: string;
    logoUrl: string;
    faviconUrl: string;
    socialImageUrl: string;
  };
  contact: {
    legalName: string;
    email: string;
    phone: string;
    website: string;
    location: string;
  };
  locale: { language: string; locale: string; currency: string; timezone: string };
  theme: {
    primary: string;
    primaryDark: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    mutedText: string;
    border: string;
    radius: string;
  };
  pricing: {
    defaultPuppyPriceCents: number;
    defaultDepositCents: number;
    deliveryFeeCents: number;
    specialCareFeeCents: number;
  };
  policies: {
    jurisdiction: string;
    healthExamHours: number;
    healthGuaranteeMonths: number;
    depositRefundable: boolean;
    customNotice: string;
  };
  features: { phoneCenter: boolean; transportation: boolean; familyPortal: boolean; applications: boolean };
};

const env = (key: string, fallback: string) => process.env[key]?.trim() || fallback;
const cents = (key: string, fallback: number) => {
  const value = Number(process.env[key]);
  return Number.isFinite(value) ? Math.round(value * 100) : fallback;
};
const enabled = (key: string, fallback: boolean) => {
  const value = process.env[key]?.trim().toLowerCase();
  return value == null || value === "" ? fallback : !["false", "0", "off", "no"].includes(value);
};

export const tenantConfig: TenantConfig = {
  brand: {
    name: env("NEXT_PUBLIC_BRAND_NAME", "Your Breeder OS"),
    shortName: env("NEXT_PUBLIC_BRAND_SHORT_NAME", "BREEDER OS"),
    tagline: env("NEXT_PUBLIC_BRAND_TAGLINE", "Thoughtful breeding. Organized beautifully."),
    description: env("NEXT_PUBLIC_BRAND_DESCRIPTION", "A complete operating system for responsible dog breeders."),
    logoUrl: env("NEXT_PUBLIC_BRAND_LOGO_URL", ""),
    faviconUrl: env("NEXT_PUBLIC_BRAND_FAVICON_URL", "/favicon.svg"),
    socialImageUrl: env("NEXT_PUBLIC_BRAND_SOCIAL_IMAGE_URL", "/og.png"),
  },
  contact: {
    legalName: env("BREEDER_LEGAL_NAME", "Your Breeding Business LLC"),
    email: env("NEXT_PUBLIC_BREEDER_EMAIL", "hello@example.com"),
    phone: env("NEXT_PUBLIC_BREEDER_PHONE", "+1 555 123 4567"),
    website: env("NEXT_PUBLIC_BREEDER_WEBSITE", "https://example.com"),
    location: env("NEXT_PUBLIC_BREEDER_LOCATION", "Your City, State"),
  },
  locale: {
    language: env("NEXT_PUBLIC_LANGUAGE", "en"), locale: env("NEXT_PUBLIC_LOCALE", "en-US"),
    currency: env("NEXT_PUBLIC_CURRENCY", "USD"), timezone: env("BREEDER_TIMEZONE", "America/New_York"),
  },
  theme: {
    primary: env("NEXT_PUBLIC_COLOR_PRIMARY", "#087f8c"), primaryDark: env("NEXT_PUBLIC_COLOR_PRIMARY_DARK", "#155f69"),
    accent: env("NEXT_PUBLIC_COLOR_ACCENT", "#c68b24"), background: env("NEXT_PUBLIC_COLOR_BACKGROUND", "#f3f7f6"),
    surface: env("NEXT_PUBLIC_COLOR_SURFACE", "#ffffff"), text: env("NEXT_PUBLIC_COLOR_TEXT", "#173941"),
    mutedText: env("NEXT_PUBLIC_COLOR_MUTED_TEXT", "#627b7e"), border: env("NEXT_PUBLIC_COLOR_BORDER", "#c8d8d5"),
    radius: env("NEXT_PUBLIC_BORDER_RADIUS", "14px"),
  },
  pricing: {
    defaultPuppyPriceCents: cents("BREEDER_DEFAULT_PUPPY_PRICE", 0), defaultDepositCents: cents("BREEDER_DEFAULT_DEPOSIT", 0),
    deliveryFeeCents: cents("BREEDER_DELIVERY_FEE", 0), specialCareFeeCents: cents("BREEDER_SPECIAL_CARE_FEE", 0),
  },
  policies: {
    jurisdiction: env("BREEDER_POLICY_JURISDICTION", "Your state or province"),
    healthExamHours: Number(env("BREEDER_HEALTH_EXAM_HOURS", "72")),
    healthGuaranteeMonths: Number(env("BREEDER_HEALTH_GUARANTEE_MONTHS", "12")),
    depositRefundable: enabled("BREEDER_DEPOSIT_REFUNDABLE", false),
    customNotice: env("BREEDER_CUSTOM_POLICY_NOTICE", ""),
  },
  features: {
    phoneCenter: enabled("NEXT_PUBLIC_FEATURE_PHONE_CENTER", false), transportation: enabled("NEXT_PUBLIC_FEATURE_TRANSPORTATION", false),
    familyPortal: enabled("NEXT_PUBLIC_FEATURE_FAMILY_PORTAL", true), applications: enabled("NEXT_PUBLIC_FEATURE_APPLICATIONS", true),
  },
};

export const formatMoney = (valueCents: number) => new Intl.NumberFormat(tenantConfig.locale.locale, {
  style: "currency", currency: tenantConfig.locale.currency,
}).format(valueCents / 100);
