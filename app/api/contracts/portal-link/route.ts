import { supabaseRequest } from "../../../../db/supabase";
import { breederSessionFromRequest, requireAdminSession } from "../../../../lib/admin-session";
import { createPortalToken } from "../../../../lib/portal-token";

export async function POST(request: Request) {
  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;
  const session = breederSessionFromRequest(request)!;
  try {
    const body = await request.json() as { buyer_id?: unknown };
    const buyerId = Number(body.buyer_id);
    if (!Number.isInteger(buyerId) || buyerId <= 0) throw new Error("Choose a valid family.");
    const check = await supabaseRequest(`rest/v1/buyers?select=id&id=eq.${buyerId}&kennel_id=eq.${encodeURIComponent(session.kennelId)}&limit=1`, { cache: "no-store" });
    const buyers = await check.json().catch(() => []) as Array<{ id: number }>;
    if (!check.ok || buyers.length === 0) return Response.json({ error: "That family is not part of your kennel." }, { status: 404 });
    const token = await createPortalToken(buyerId, 730, session.kennelId);
    return Response.json({ token, portalUrl: `${new URL(request.url).origin}/portal/${token}` });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create the portal link." }, { status: 400 });
  }
}
