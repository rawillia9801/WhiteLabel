import { breederSessionFromRequest } from "../../../../../lib/breeder-session";
import { loadBreederAccount } from "../../../../../lib/breeder-account";
import { cancelPayPalSubscription } from "../../../../../lib/paypal";
import { removeMyDogPortalDogBreederDocsPacket, updatePayPalBillingEventByProviderId } from "../../../../../lib/paypal-billing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = breederSessionFromRequest(request);
  if (!session) return Response.json({ error: "Sign in to manage your subscription." }, { status: 401 });
  if (!["owner", "admin"].includes(session.role)) {
    return Response.json({ error: "Owner or admin access is required to cancel a subscription." }, { status: 403 });
  }

  try {
    const account = await loadBreederAccount(session.kennelId);
    const subscriptionId = account.subscription?.paypalId;
    if (!subscriptionId || account.subscription?.offeringKey === "dogbreederweb-connected") {
      return Response.json({ error: "No active MyDogPortal PayPal subscription was found for this kennel." }, { status: 404 });
    }

    await cancelPayPalSubscription(subscriptionId, "Cancelled by breeder from the MyDogPortal Account Center.");
    await updatePayPalBillingEventByProviderId(subscriptionId, "CANCELLED", { next_billing_time: null });
    await removeMyDogPortalDogBreederDocsPacket(session.kennelId);

    return Response.json(
      { cancelled: true, message: "Your MyDogPortal subscription has been cancelled. No further recurring subscription charges are scheduled, and plan-included DogBreederDocs access has been removed. Standalone document purchases remain yours." },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to cancel the subscription right now.";
    return Response.json({ error: message }, { status: 502, headers: { "cache-control": "no-store" } });
  }
}
