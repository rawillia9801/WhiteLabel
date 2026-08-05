import {
  BREEDER_SESSION_COOKIE,
  breederSessionFromRequest,
  readBreederSessionToken,
  sessionCookieFromRequest,
} from "./breeder-session.ts";

export const ADMIN_SESSION_COOKIE = BREEDER_SESSION_COOKIE;

export const adminSessionTokenFromRequest = sessionCookieFromRequest;
export const isValidAdminSessionToken = (token: string | null | undefined) => Boolean(readBreederSessionToken(token));

export function requireAdminSession(request: Request) {
  if (breederSessionFromRequest(request)) return null;
  return Response.json(
    { error: "Sign in to your breeder account to continue." },
    { status: 401, headers: { "cache-control": "no-store" } },
  );
}

export { breederSessionFromRequest };
