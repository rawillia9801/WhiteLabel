import { breederSessionFromRequest, requireAdminSession } from "../../../../lib/admin-session";
import { getApplicationFormConfig, saveApplicationFormConfig } from "../../../../lib/application-form-store";

export async function GET(request: Request) {
  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;
  try {
    const session = breederSessionFromRequest(request)!;
    return Response.json(await getApplicationFormConfig(session.kennelId), { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load the application builder." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;
  try {
    const session = breederSessionFromRequest(request)!;
    const config = await saveApplicationFormConfig(session.kennelId, await request.json());
    return Response.json(config);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to save the application builder." }, { status: 400 });
  }
}

