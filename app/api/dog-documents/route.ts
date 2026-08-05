import { deleteDogDocumentFromSupabase, registerDogDocumentUpload, uploadDogDocumentToSupabase } from "../../../db/supabase-documents";
import { breederSessionFromRequest, requireAdminSession } from "../../../lib/admin-session";

export async function POST(request: Request) {
  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;
  const session = breederSessionFromRequest(request)!;
  try {
    const document = request.headers.get("content-type")?.includes("application/json")
      ? await registerDogDocumentUpload(await request.json() as Record<string, unknown>, session.kennelId)
      : await uploadDogDocumentToSupabase(await request.formData(), session.kennelId);
    return Response.json(document, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to upload the document." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;
  try {
    const documentId = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isInteger(documentId) || documentId <= 0) return Response.json({ error: "A valid document is required." }, { status: 400 });
    await deleteDogDocumentFromSupabase(documentId, breederSessionFromRequest(request)!.kennelId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to delete the document." }, { status: 500 });
  }
}
