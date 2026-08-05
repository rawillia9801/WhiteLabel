import { getSupabaseConfig, supabaseRequest } from "../../../../db/supabase";
import { isAllowedWebsiteOrigin, publicPuppy, websiteCorsHeaders } from "../../../../lib/website-integration";
import { findKennelByHost } from "../../../../lib/supabase-auth";

function response(origin: string | null, host: string | null, payload: Record<string, unknown>, status = 200) {
  const headers = websiteCorsHeaders(origin, host);
  headers.set("cache-control", "public, s-maxage=60, stale-while-revalidate=300");
  return Response.json(payload, { status, headers });
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  return new Response(null, {
    status: isAllowedWebsiteOrigin(origin, host) ? 204 : 403,
    headers: websiteCorsHeaders(origin, host),
  });
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (origin && !isAllowedWebsiteOrigin(origin, host)) {
    return response(origin, host, { error: "This request source is not allowed." }, 403);
  }

  try {
    if (!getSupabaseConfig().serviceRoleKey) {
      return response(origin, host, { error: "Puppy listings are temporarily unavailable." }, 503);
    }
    const kennel = await findKennelByHost(host || "");
    if (!kennel) return response(origin, host, { error: "This puppy feed is not connected to a kennel." }, 404);
    const params = new URLSearchParams({
      select: "*",
      buyer_id: "is.null",
      kennel_id: `eq.${kennel.id}`,
      order: "created_at.desc",
    });
    const result = await supabaseRequest(`rest/v1/puppies?${params}`, { cache: "no-store" });
    if (!result.ok) throw new Error("Unable to load puppy listings.");
    const rows = await result.json() as Record<string, unknown>[];
    return response(origin, host, { puppies: rows.map(publicPuppy).filter(Boolean) });
  } catch (error) {
    console.error("Public puppy feed failed", error instanceof Error ? error.message : error);
    return response(origin, host, { error: "Unable to load puppy listings right now." }, 500);
  }
}
