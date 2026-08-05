import { renderPuppyApplicationPdf } from "../../../../lib/puppy-application";
import { getTemplatesConfig } from "../../../../lib/templates-config";
import { breederSessionFromRequest, requireAdminSession } from "../../../../lib/admin-session";
import { findKennelById } from "../../../../lib/supabase-auth";

export async function GET(request: Request) {
  const unauthorized = requireAdminSession(request); if (unauthorized) return unauthorized;
  const session = breederSessionFromRequest(request)!;
  const [config, kennel] = await Promise.all([
    getTemplatesConfig(session.kennelId),
    findKennelById(session.kennelId),
  ]);
  const pdf = await renderPuppyApplicationPdf(
    config.documents.puppy_application.content,
    kennel?.name || session.kennelName,
    kennel?.custom_policy_notice || "",
    kennel?.primary_breed || "Dogs",
  );
  return new Response(new Blob([pdf as BlobPart], { type: "application/pdf" }), {
    headers: {
      "content-disposition": 'attachment; filename="puppy-application.pdf"',
      "content-type": "application/pdf",
      "cache-control": "no-store",
    },
  });
}
