import { getApplicationFormConfig } from "../../../../lib/application-form-store";
import { findKennelByHost } from "../../../../lib/supabase-auth";
import { websiteCorsHeaders } from "../../../../lib/website-integration";

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  try {
    const kennel = await findKennelByHost(host || "");
    if (!kennel) return Response.json({ error: "This application is not connected to a kennel." }, { status: 404, headers: websiteCorsHeaders(origin, host) });
    const config = await getApplicationFormConfig(kennel.id);
    const headers = websiteCorsHeaders(origin, host);
    headers.set("cache-control", "public, max-age=60");
    return Response.json({ kennel: { name: kennel.name }, form: config }, { headers });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load the application." }, { status: 500, headers: websiteCorsHeaders(origin, host) });
  }
}
