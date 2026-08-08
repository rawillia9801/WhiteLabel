import { getSupabaseConfig, supabaseRequest } from "../../../../db/supabase";
import { isAllowedWebsiteOrigin, publicPuppy, websiteCorsHeaders } from "../../../../lib/website-integration";
import { findKennelByHost } from "../../../../lib/supabase-auth";
import { getPuppyWebsiteConfig } from "../../../../lib/puppy-website-config";

function response(origin: string | null, host: string | null, allowedOrigins: string[], payload: Record<string, unknown>, status = 200) {
  const headers = websiteCorsHeaders(origin, host, allowedOrigins);
  headers.set("cache-control", "public, max-age=0, s-maxage=15, stale-while-revalidate=30");
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

  try {
    if (!getSupabaseConfig().serviceRoleKey) {
      return response(origin, host, [], { error: "Puppy listings are temporarily unavailable." }, 503);
    }
    const requestUrl = new URL(request.url);
    const slug = requestUrl.searchParams.get("kennel")?.trim().toLowerCase() || "";
    const platform = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN?.trim().toLowerCase() || "mydogportal.site";
    const kennel = await findKennelByHost(slug ? `${slug}.${platform}` : host || "");
    if (!kennel) return response(origin, host, [], { error: "This puppy feed is not connected to a kennel." }, 404);
    const config = await getPuppyWebsiteConfig(kennel.id);
    const allowedOrigins = [kennel.website_url || "", ...config.allowedOrigins].filter(Boolean);
    if (origin && !isAllowedWebsiteOrigin(origin, host, allowedOrigins)) {
      return response(origin, host, allowedOrigins, { error: "This website is not authorized to load this kennel's puppy feed." }, 403);
    }
    if (!config.enabled) return response(origin, host, allowedOrigins, { kennel: { name: kennel.name, slug: kennel.slug }, config, puppies: [] });
    const params = new URLSearchParams({
      select: "*",
      buyer_id: "is.null",
      kennel_id: `eq.${kennel.id}`,
      order: "created_at.desc",
    });
    const result = await supabaseRequest(`rest/v1/puppies?${params}`, { cache: "no-store" });
    if (!result.ok) throw new Error("Unable to load puppy listings.");
    const rows = await result.json() as Record<string, unknown>[];
    const hidden = new Set(config.hiddenPuppyIds);
    const puppies = rows.map(publicPuppy).filter((puppy): puppy is NonNullable<ReturnType<typeof publicPuppy>> => Boolean(puppy && !hidden.has(puppy.id)));
    return response(origin, host, allowedOrigins, { kennel: { name: kennel.name, slug: kennel.slug }, config, puppies });
  } catch (error) {
    console.error("Public puppy feed failed", error instanceof Error ? error.message : error);
    return response(origin, host, [], { error: "Unable to load puppy listings right now." }, 500);
  }
}
