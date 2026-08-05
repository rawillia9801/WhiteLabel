import { breederSessionFromRequest, requireAdminSession } from "../../../../lib/admin-session";
import { getTemplatesConfig, saveTemplatesConfig } from "../../../../lib/templates-config";

export async function GET(request: Request) {
  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;
  try {
    return Response.json(await getTemplatesConfig(breederSessionFromRequest(request)!.kennelId), { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load templates." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;
  try {
    return Response.json(await saveTemplatesConfig(breederSessionFromRequest(request)!.kennelId, await request.json()));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to save templates." }, { status: 500 });
  }
}
