import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "../../../../lib/admin-session";

export async function POST(request: Request) {
  const response = NextResponse.json({ authenticated: false });
  const host = new URL(request.url).hostname.toLowerCase();
  const platform = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "breederportal.site";
  const domain = process.env.NODE_ENV === "production" && (host === platform || host.endsWith(`.${platform}`)) ? `.${platform}` : undefined;
  response.cookies.set({ name: ADMIN_SESSION_COOKIE, value: "", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0, domain });
  return response;
}
