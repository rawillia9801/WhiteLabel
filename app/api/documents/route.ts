import { deleteBuyerDocumentFromSupabase, registerBuyerDocumentUpload, uploadBuyerDocumentToSupabase } from "../../../db/supabase-documents";
import { breederSessionFromRequest, requireAdminSession } from "../../../lib/admin-session";
import { sendOwnerNotification } from "../../../lib/email-service";

export async function POST(request: Request) {
  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;
  const session = breederSessionFromRequest(request)!;
  try {
    const document = request.headers.get("content-type")?.includes("application/json")
      ? await registerBuyerDocumentUpload(await request.json() as Record<string, unknown>, session.kennelId)
      : await uploadBuyerDocumentToSupabase(await request.formData(), session.kennelId);

    try {
      const row = document as Record<string, unknown>;
      await sendOwnerNotification({
        kennelId: session.kennelId,
        kennelName: session.kennelName,
        category: "Document",
        subject: `Document added: ${String(row.title || row.file_name || "Buyer document")}`,
        buyerId: Number(row.buyer_id) || null,
        body: [
          "A document was added to a buyer file in Breeder Portal.",
          "",
          `Title: ${String(row.title || "Not provided")}`,
          `Document type: ${String(row.document_type || "Other")}`,
          `File name: ${String(row.file_name || "Not available")}`,
          `Buyer ID: ${String(row.buyer_id || "Not available")}`,
          "",
          "Review the document in Breeder Portal:",
          `${new URL(request.url).origin}/?view=Vault`,
        ].join("\n"),
      });
    } catch (emailError) {
      console.error("Owner document notification failed", emailError instanceof Error ? emailError.message : emailError);
    }

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
    await deleteBuyerDocumentFromSupabase(documentId, breederSessionFromRequest(request)!.kennelId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to delete the document." }, { status: 500 });
  }
}
