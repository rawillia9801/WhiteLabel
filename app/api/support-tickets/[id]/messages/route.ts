import { NextResponse } from "next/server";
import { breederSessionFromRequest } from "../../../../../lib/breeder-session";
import { addBreederSupportReply } from "../../../../../lib/support-tickets";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = breederSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Sign in to your kennel account to reply." }, { status: 401 });
  const { id } = await context.params;
  const ticketId = Number(id);
  const payload = await request.json().catch(() => ({})) as { body?: unknown };
  const body = String(payload.body || "").trim();
  if (!Number.isSafeInteger(ticketId) || ticketId <= 0) return NextResponse.json({ error: "Invalid support ticket." }, { status: 400 });
  if (!body || body.length > 5000) return NextResponse.json({ error: "Reply must be between 1 and 5,000 characters." }, { status: 400 });
  try {
    await addBreederSupportReply({ ticketId, kennelId: session.kennelId, userId: session.userId, kennelName: session.kennelName, body });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send the reply.";
    return NextResponse.json({ error: message }, { status: /not found/i.test(message) ? 404 : 500 });
  }
}
