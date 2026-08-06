import { NextResponse } from "next/server";
import { BREEDER_SESSION_COOKIE, createBreederSessionToken, tenantUrl, type BreederSession } from "../../../../lib/breeder-session";
import { breederSessionClaims, createBreederAccount } from "../../../../lib/supabase-auth";

export const runtime = "nodejs";

function cookieDomain(request: Request) {
  if (process.env.NODE_ENV !== "production") return undefined;
  const host = new URL(request.url).hostname.toLowerCase();
  const platform = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "mydogportal.site";
  return host === platform || host.endsWith(`.${platform}`) ? `.${platform}` : undefined;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const requestedPlan = String(body.plan ?? "starter") as BreederSession["plan"];
    const plan = (["starter", "professional", "studio"] as const).includes(requestedPlan) ? requestedPlan : "starter";
    const account = await createBreederAccount({
      email: String(body.email ?? ""), password: String(body.password ?? ""),
      kennelName: String(body.kennel_name ?? ""), kennelSlug: String(body.kennel_slug ?? ""), plan,
    });
    const claims = breederSessionClaims(account);
    const token = createBreederSessionToken(claims);
    if (!token) return Response.json({ error: "Set BREEDER_SESSION_SECRET to a random value of at least 32 characters." }, { status: 503 });
    const requestUrl = new URL(request.url);
    const redirect = ["localhost", "127.0.0.1"].includes(requestUrl.hostname) || requestUrl.hostname.endsWith(".vercel.app")
      ? `${requestUrl.origin}/`
      : tenantUrl(claims, "/");
    const response = NextResponse.json({ created: true, kennel: account.kennel, redirect }, { status: 201 });
    response.cookies.set({
      name: BREEDER_SESSION_COOKIE, value: token, httpOnly: true,
      secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 30 * 86400,
      domain: cookieDomain(request),
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create the kennel account.";
    return Response.json({ error: message }, { status: /already|in use|valid|choose|enter|characters/i.test(message) ? 400 : 500, headers: { "cache-control": "no-store" } });
  }
}
