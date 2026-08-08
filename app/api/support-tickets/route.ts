import { NextResponse } from "next/server";
import { breederSessionFromRequest } from "../../../lib/breeder-session";
import { createSupportTicket, listKennelSupportTickets, supportCategories, supportPriorities, type SupportCategory, type SupportPriority } from "../../../lib/support-tickets";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Sign in to your kennel account to use MyDogPortal support." }, { status: 401 });
}

export async function GET(request: Request) {
  const session = breederSessionFromRequest(request);
  if (!session) return unauthorized();
  try {
    return NextResponse.json({ tickets: await listKennelSupportTickets(session.kennelId) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load support tickets." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = breederSessionFromRequest(request);
  if (!session) return unauthorized();
  const payload = await request.json().catch(() => ({})) as Record<string, unknown>;
  const subject = String(payload.subject || "").trim();
  const description = String(payload.description || "").trim();
  const category = String(payload.category || "") as SupportCategory;
  const priority = String(payload.priority || "Normal") as SupportPriority;
  if (subject.length < 3 || subject.length > 160) return NextResponse.json({ error: "Enter a subject between 3 and 160 characters." }, { status: 400 });
  if (description.length < 5 || description.length > 5000) return NextResponse.json({ error: "Describe the issue in 5 to 5,000 characters." }, { status: 400 });
  if (!supportCategories.includes(category)) return NextResponse.json({ error: "Choose a valid support category." }, { status: 400 });
  if (!supportPriorities.includes(priority)) return NextResponse.json({ error: "Choose a valid priority." }, { status: 400 });
  try {
    const ticket = await createSupportTicket({ kennelId: session.kennelId, userId: session.userId, subject, category, priority, description });
    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create the support ticket." }, { status: 500 });
  }
}
