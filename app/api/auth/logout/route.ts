import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "../../../../lib/admin-session";
import { BREEDER_SESSION_COOKIE } from "../../../../lib/breeder-session";

export async function POST(request: Request) {
  const response = NextResponse.json({ authenticated: false });
  const host = new URL(request.url).hostname.toLowerCase();
  const platform = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "mydogportal.site";
  const domain = process.env.NODE_ENV === "production" && (host === platform || host.endsWith(`.${platform}`)) ? `.${platform}` : undefined;
  const clear = { value: "", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 0, domain };
  response.cookies.set({ name: BREEDER_SESSION_COOKIE, ...clear });
  response.cookies.set({ name: ADMIN_SESSION_COOKIE, ...clear });
  return response;
}
