import { NextResponse } from "next/server";
import { authorizePlatformAdmin } from "../../../../../../lib/platform-admin";
import { breederSessionFromRequest } from "../../../../../../lib/breeder-session";
import { addAdminSupportReply, supportStatuses, type SupportStatus } from "../../../../../../lib/support-tickets";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = breederSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Administrator sign-in required." }, { status: 401 });
  const access = await authorizePlatformAdmin(session);
  if (!access.allowed) return NextResponse.json({ error: access.reason }, { status: 403 });
  const { id } = await context.params;
  const ticketId = Number(id);
  const payload = await request.json().catch(() => ({})) as { body?: unknown; status?: string };
  const body = String(payload.body || "").trim();
  const status = payload.status as SupportStatus | undefined;
  if (!Number.isSafeInteger(ticketId) || ticketId <= 0) return NextResponse.json({ error: "Invalid support ticket." }, { status: 400 });
  if (!body || body.length > 5000) return NextResponse.json({ error: "Reply must be between 1 and 5,000 characters." }, { status: 400 });
  if (status && !supportStatuses.includes(status)) return NextResponse.json({ error: "Invalid ticket status." }, { status: 400 });
  try {
    await addAdminSupportReply({ ticketId, adminUserId: session.userId, adminLabel: access.email || "MyDogPortal Support", body, status });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to send the support reply." }, { status: 500 });
  }
}
