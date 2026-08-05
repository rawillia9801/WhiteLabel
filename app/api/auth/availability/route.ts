import { kennelSlugAvailable, normalizeKennelSlug } from "../../../../lib/supabase-auth";

export async function GET(request: Request) {
  try {
    const slug = normalizeKennelSlug(new URL(request.url).searchParams.get("slug") || "");
    return Response.json({ slug, available: await kennelSlugAvailable(slug) }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to check that address." }, { status: 500 });
  }
}
