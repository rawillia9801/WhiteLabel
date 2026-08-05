import assert from "node:assert/strict";
import test from "node:test";
import { ADMIN_SESSION_COOKIE, adminSessionTokenFromRequest, breederSessionFromRequest, isValidAdminSessionToken, requireAdminSession } from "../lib/admin-session.ts";
import { createBreederSessionToken } from "../lib/breeder-session.ts";

test("breeder sessions are signed, tenant-bound, and required by protected routes", async () => {
  process.env.BREEDER_SESSION_SECRET = "unit-test-session-secret-at-least-32-characters";
  const token = createBreederSessionToken({
    userId: "3a7af1de-1111-4444-8888-1bc514d717a1",
    kennelId: "7bf1b1fb-2222-4444-8888-0ca645db4111",
    kennelSlug: "willow-creek",
    kennelName: "Willow Creek",
    role: "owner",
    plan: "starter",
  });
  assert.ok(token);
  assert.equal(isValidAdminSessionToken(token), true);
  assert.equal(isValidAdminSessionToken(`${token}0`), false);

  const authorizedRequest = new Request("https://willow-creek.breederportal.site/api/data", { headers: { cookie: `${ADMIN_SESSION_COOKIE}=${token}` } });
  assert.equal(adminSessionTokenFromRequest(authorizedRequest), token);
  assert.equal(breederSessionFromRequest(authorizedRequest)?.kennelSlug, "willow-creek");
  assert.equal(requireAdminSession(authorizedRequest), null);

  const unauthorized = requireAdminSession(new Request("https://example.test/api/data"));
  assert.equal(unauthorized?.status, 401);
  assert.deepEqual(await unauthorized?.json(), { error: "Sign in to your breeder account to continue." });
  delete process.env.BREEDER_SESSION_SECRET;
});
