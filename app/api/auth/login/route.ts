import { NextResponse } from "next/server";
import { BREEDER_SESSION_COOKIE, createBreederSessionToken, tenantUrl } from "../../../../lib/breeder-session";
import { breederSessionClaims, signInBreederPassword } from "../../../../lib/supabase-auth";

export const runtime = "nodejs";

function cookieDomain(request: Request) {
  if (process.env.NODE_ENV !== "production") return undefined;
  const host = new URL(request.url).hostname.toLowerCase();
  const platform = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "breederportal.site";
  return host === platform || host.endsWith(`.${platform}`) ? `.${platform}` : undefined;
}

function redirectFor(request: Request, claims: ReturnType<typeof breederSessionClaims>) {
  const url = new URL(request.url);
  if (["localhost", "127.0.0.1"].includes(url.hostname) || url.hostname.endsWith(".vercel.app")) return `${url.origin}/`;
  return tenantUrl(claims, "/");
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: unknown; password?: unknown };
    const account = await signInBreederPassword(String(body.email ?? ""), String(body.password ?? ""));
    const claims = breederSessionClaims(account);
    const token = createBreederSessionToken(claims);
    if (!token) return Response.json({ error: "Session security is not configured." }, { status: 503 });
    const response = NextResponse.json({ authenticated: true, kennel: account.kennel, redirect: redirectFor(request, claims) });
    response.cookies.set({
      name: BREEDER_SESSION_COOKIE, value: token, httpOnly: true,
      secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 30 * 86400,
      domain: cookieDomain(request),
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sign in.";
    return Response.json({ error: /invalid login credentials/i.test(message) ? "The email address or password is incorrect." : message }, { status: 401, headers: { "cache-control": "no-store" } });
  }
}
