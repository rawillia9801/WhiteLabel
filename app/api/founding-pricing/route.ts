import { foundingPricingStatus } from "../../../lib/founding-pricing";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await foundingPricingStatus();
    return Response.json(status, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ available: false, remaining: 0, limit: 100 }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
