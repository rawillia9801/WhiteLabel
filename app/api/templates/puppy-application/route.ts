import { renderPuppyApplicationPdf } from "../../../../lib/puppy-application";
import { getTemplatesConfig } from "../../../../lib/templates-config";
import { breederSessionFromRequest, requireAdminSession } from "../../../../lib/admin-session";

export async function GET(request: Request) {
  const unauthorized = requireAdminSession(request); if (unauthorized) return unauthorized;
  const config = await getTemplatesConfig(breederSessionFromRequest(request)!.kennelId);
  const pdf = await renderPuppyApplicationPdf(config.documents.puppy_application.content);
  return new Response(new Blob([pdf as BlobPart], { type: "application/pdf" }), {
    headers: {
      "content-disposition": 'attachment; filename="swva-chihuahua-puppy-application.pdf"',
      "content-type": "application/pdf",
      "cache-control": "no-store",
    },
  });
}
