import { supabaseRequest } from "../../../../../db/supabase";
import { breederSessionFromRequest, requireAdminSession } from "../../../../../lib/admin-session";
import { sendPortalAccountSetupEmail } from "../../../../../lib/email-service";
import { createPortalToken } from "../../../../../lib/portal-token";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;
  const session = breederSessionFromRequest(request)!;
  try {
    const buyerId = Number((await params).id);
    if (!Number.isInteger(buyerId) || buyerId <= 0) return Response.json({ error: "Choose a valid family." }, { status: 400 });
    const response = await supabaseRequest(`rest/v1/buyers?select=id,first_name,last_name,email&id=eq.${buyerId}&kennel_id=eq.${encodeURIComponent(session.kennelId)}&limit=1`, { cache: "no-store" });
    const buyers = await response.json().catch(() => []) as Array<{ id: number; first_name?: string; last_name?: string; email?: string }>;
    const buyer = buyers[0];
    if (!response.ok || !buyer) return Response.json({ error: "That family is not part of your kennel." }, { status: 404 });
    if (!buyer.email) return Response.json({ error: "Add an email address to this family before creating portal access." }, { status: 400 });
    const token = await createPortalToken(buyerId, 7, session.kennelId);
    const setupUrl = `${new URL(request.url).origin}/portal/setup?token=${encodeURIComponent(token)}`;
    const result = await sendPortalAccountSetupEmail({
      kennelId: session.kennelId, kennelName: session.kennelName,
      to: buyer.email, buyerId, firstName: buyer.first_name || [buyer.first_name, buyer.last_name].filter(Boolean).join(" "),
      setupLink: setupUrl, dedupeKey: `breeder-portal-invite-${buyerId}-${Math.floor(Date.now() / 600_000)}`,
    });
    return Response.json({ sent: result.sent, message: result.sent ? `Portal invitation sent to ${buyer.email}.` : result.skipped || "Portal invitation created.", setupUrl });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create buyer portal access." }, { status: 500 });
  }
}
