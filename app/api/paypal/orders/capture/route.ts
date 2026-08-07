import { breederSessionFromRequest } from "../../../../../lib/breeder-session";
import { recordPayPalBillingEvent } from "../../../../../lib/paypal-billing";
import { capturePayPalOrder, getPayPalOrder, oneTimeOffering } from "../../../../../lib/paypal";

export const runtime = "nodejs";

function parseCustomId(value: string | undefined) {
  const match = /^kennel:([0-9a-f-]{36});offering:([a-z0-9-]+)$/i.exec(value || "");
  return match ? { kennelId: match[1], offeringKey: match[2] } : null;
}

export async function POST(request: Request) {
  const session = breederSessionFromRequest(request);
  if (!session) return Response.json({ error: "Sign in before capturing a PayPal order." }, { status: 401 });
  if (!["owner", "admin"].includes(session.role)) return Response.json({ error: "Owner or admin access is required." }, { status: 403 });

  try {
    const body = await request.json() as { order_id?: string };
    const orderId = String(body.order_id || "");
    const order = await getPayPalOrder(orderId);
    const reference = parseCustomId(order.purchase_units?.[0]?.custom_id);
    if (!reference || reference.kennelId !== session.kennelId) {
      return Response.json({ error: "This PayPal order is not assigned to the signed-in kennel." }, { status: 403 });
    }
    const offering = oneTimeOffering(reference.offeringKey);
    if (!offering) return Response.json({ error: "The PayPal order references an unknown offering." }, { status: 409 });

    const captured = order.status === "COMPLETED" ? order : await capturePayPalOrder(orderId);
    const status = String(captured.status || "UNKNOWN").toUpperCase();
    if (status !== "COMPLETED") {
      return Response.json({ error: `PayPal returned order status ${status}.` }, { status: 409 });
    }

    await recordPayPalBillingEvent({
      kennelId: session.kennelId,
      title: `PayPal purchase: ${offering.name}`,
      status: "COMPLETED",
      notes: {
        provider: "paypal",
        kind: "order",
        offering_key: offering.key,
        paypal_id: captured.id,
        amount: offering.price,
        currency: "USD",
      },
    });

    return Response.json({
      captured: true,
      orderId: captured.id,
      offering: offering.key,
      status,
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to capture the PayPal order.";
    return Response.json({ error: message }, { status: 502, headers: { "cache-control": "no-store" } });
  }
}
