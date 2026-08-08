import { NextResponse } from "next/server";
import { authorizePlatformAdmin } from "../../../../../lib/platform-admin";
import { breederSessionFromRequest } from "../../../../../lib/breeder-session";
import { supportPriorities, supportStatuses, updateSupportTicketAsAdmin, type SupportPriority, type SupportStatus } from "../../../../../lib/support-tickets";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = breederSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Administrator sign-in required." }, { status: 401 });
  const access = await authorizePlatformAdmin(session);
  if (!access.allowed) return NextResponse.json({ error: access.reason }, { status: 403 });
  const { id } = await context.params;
  const ticketId = Number(id);
  const payload = await request.json().catch(() => ({})) as { status?: string; priority?: string };
  const status = payload.status as SupportStatus | undefined;
  const priority = payload.priority as SupportPriority | undefined;
  if (!Number.isSafeInteger(ticketId) || ticketId <= 0) return NextResponse.json({ error: "Invalid support ticket." }, { status: 400 });
  if (status && !supportStatuses.includes(status)) return NextResponse.json({ error: "Invalid ticket status." }, { status: 400 });
  if (priority && !supportPriorities.includes(priority)) return NextResponse.json({ error: "Invalid ticket priority." }, { status: 400 });
  if (!status && !priority) return NextResponse.json({ error: "No ticket changes were supplied." }, { status: 400 });
  try {
    await updateSupportTicketAsAdmin(ticketId, { status, priority });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update the support ticket." }, { status: 500 });
  }
}
