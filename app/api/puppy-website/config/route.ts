import { breederSessionFromRequest } from "../../../../lib/breeder-session";
import { getPuppyWebsiteConfig, savePuppyWebsiteConfig } from "../../../../lib/puppy-website-config";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = breederSessionFromRequest(request);
  if (!session) return Response.json({ error: "Sign in to manage your puppy website feed." }, { status: 401 });
  try {
    const config = await getPuppyWebsiteConfig(session.kennelId);
    return Response.json({ config, kennel: { slug: session.kennelSlug, name: session.kennelName } }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load puppy website settings." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = breederSessionFromRequest(request);
  if (!session) return Response.json({ error: "Sign in to manage your puppy website feed." }, { status: 401 });
  if (!["owner", "admin"].includes(session.role)) return Response.json({ error: "Owner or admin access is required." }, { status: 403 });
  try {
    const config = await savePuppyWebsiteConfig(session.kennelId, await request.json());
    return Response.json({ config }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to save puppy website settings." }, { status: 400 });
  }
}
