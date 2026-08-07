import { breederSessionFromRequest } from "../../../../lib/breeder-session";
import { createPayPalOrder, oneTimeOffering } from "../../../../lib/paypal";

export const runtime = "nodejs";

function tenantOrigin(request: Request) {
  const url = new URL(request.url);
  return url.origin;
}

export async function POST(request: Request) {
  const session = breederSessionFromRequest(request);
  if (!session) return Response.json({ error: "Sign in before purchasing an add-on." }, { status: 401 });
  if (!["owner", "admin"].includes(session.role)) return Response.json({ error: "Owner or admin access is required." }, { status: 403 });

  try {
    const body = await request.json() as { offering_key?: string };
    const offering = oneTimeOffering(String(body.offering_key || ""));
    if (!offering) return Response.json({ error: "Unknown one-time PayPal offering." }, { status: 400 });
    const origin = tenantOrigin(request);
    const order = await createPayPalOrder({
      offering,
      kennelId: session.kennelId,
      returnUrl: `${origin}/billing?paypal_capture=1`,
      cancelUrl: `${origin}/billing?paypal_cancelled=1`,
    });
    return Response.json({
      orderId: order.id,
      approvalUrl: order.approvalUrl,
    }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start PayPal checkout.";
    return Response.json({ error: message }, { status: 502, headers: { "cache-control": "no-store" } });
  }
}
