import { NextRequest, NextResponse } from "next/server";
import { BREEDER_SESSION_COOKIE, readBreederSessionToken, tenantUrl } from "./lib/breeder-session";
import { breederCheckoutRequired } from "./lib/breeder-account";

const publicPath = (pathname: string) =>
  pathname === "/login"
  || pathname === "/signup"
  || pathname === "/apply"
  || pathname.startsWith("/templates/")
  || pathname.startsWith("/api/auth/")
  || pathname === "/api/founding-pricing"
  || pathname.startsWith("/portal/")
  || pathname.startsWith("/api/portal/")
  || pathname.startsWith("/api/website/")
  || pathname === "/api/paypal/webhook"
  || (process.env.NEXT_PUBLIC_FEATURE_PHONE_CENTER === "true" && pathname.startsWith("/api/voice/"))
  || (process.env.NEXT_PUBLIC_FEATURE_PHONE_CENTER === "true" && pathname === "/api/caller-crm/lookup");

export function isReservedMarketingHost(hostValue: string, platformValue = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "mydogportal.site") {
  const host = hostValue.trim().toLowerCase().split(":")[0];
  const platformDomain = platformValue.trim().toLowerCase();
  return host === platformDomain || host === `www.${platformDomain}`;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").split(":")[0].toLowerCase();
  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN?.trim().toLowerCase() || "mydogportal.site";

  const canonicalMarketingHost = host === "mydogportal.site" || host === "www.mydogportal.site";

  if (canonicalMarketingHost || isReservedMarketingHost(host, platformDomain)) {
    if (pathname === "/") {
      const marketingUrl = request.nextUrl.clone();
      marketingUrl.pathname = "/marketing";
      return NextResponse.rewrite(marketingUrl);
    }
    if (pathname === "/marketing") return NextResponse.next();
  }

  if (publicPath(pathname)) {
    const headers = new Headers(request.headers);
    headers.set("x-public-surface", "1");
    return NextResponse.next({ request: { headers } });
  }

  const session = readBreederSessionToken(request.cookies.get(BREEDER_SESSION_COOKIE)?.value);
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  const billingAllowed = pathname === "/billing" || pathname.startsWith("/api/paypal/");
  if (!billingAllowed && session.billingStatus !== "active" && await breederCheckoutRequired(session.kennelId)) {
    return NextResponse.redirect(tenantUrl(session, "/billing?required=1"));
  }

  const expectedSubdomain = `${session.kennelSlug}.${platformDomain}`;
  const localOrPreview = host === "localhost" || host === "127.0.0.1" || host.endsWith(".vercel.app");
  const expectedHost = session.plan === "custom_domain" && session.customDomain ? session.customDomain : expectedSubdomain;
  if (!localOrPreview && host !== expectedHost && host !== `www.${expectedHost}`) {
    return NextResponse.redirect(tenantUrl(session, `${pathname}${request.nextUrl.search}`));
  }

  const headers = new Headers(request.headers);
  headers.set("x-kennel-id", session.kennelId);
  headers.set("x-kennel-slug", session.kennelSlug);
  headers.set("x-breeder-user-id", session.userId);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
