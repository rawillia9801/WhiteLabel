import "server-only";

import { supabaseRequest } from "../db/supabase";

export const supportCategories = ["Account", "Billing", "Technical", "Website", "Domain & Email", "Phone", "Puppy Portal", "Data", "Other"] as const;
export const supportPriorities = ["Low", "Normal", "High", "Urgent"] as const;
export const supportStatuses = ["Open", "In Progress", "Waiting on Breeder", "Resolved", "Closed"] as const;

export type SupportCategory = typeof supportCategories[number];
export type SupportPriority = typeof supportPriorities[number];
export type SupportStatus = typeof supportStatuses[number];

export type SupportTicketMessage = {
  id: number;
  ticketId: number;
  authorType: "breeder" | "platform_admin";
  authorLabel: string;
  body: string;
  createdAt: string;
};

export type SupportTicket = {
  id: number;
  ticketNumber: string;
  kennelId: string;
  requesterUserId: string;
  subject: string;
  category: SupportCategory;
  priority: SupportPriority;
  status: SupportStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
  lastReplyAt: string | null;
  closedAt: string | null;
  messages: SupportTicketMessage[];
};

type TicketRow = {
  id: number;
  kennel_id: string;
  requester_user_id: string;
  subject: string;
  category: SupportCategory;
  priority: SupportPriority;
  status: SupportStatus;
  description: string;
  created_at: string;
  updated_at: string;
  last_reply_at: string | null;
  closed_at: string | null;
};

type MessageRow = {
  id: number;
  ticket_id: number;
  author_type: "breeder" | "platform_admin";
  author_label: string;
  body: string;
  created_at: string;
};

async function rest<T>(path: string, init: RequestInit = {}) {
  const response = await supabaseRequest(path, { cache: "no-store", ...init });
  const payload = await response.json().catch(() => null) as T | { message?: string } | null;
  if (!response.ok) throw new Error((payload as { message?: string } | null)?.message || "Unable to access support tickets.");
  return payload as T;
}

function displayNumber(id: number) {
  return `MDP-${String(id).padStart(6, "0")}`;
}

function mapMessage(row: MessageRow): SupportTicketMessage {
  return { id: row.id, ticketId: row.ticket_id, authorType: row.author_type, authorLabel: row.author_label, body: row.body, createdAt: row.created_at };
}

function mapTickets(rows: TicketRow[], messages: MessageRow[]) {
  const messageMap = new Map<number, SupportTicketMessage[]>();
  for (const row of messages) messageMap.set(row.ticket_id, [...(messageMap.get(row.ticket_id) || []), mapMessage(row)]);
  return rows.map((row): SupportTicket => ({
    id: row.id,
    ticketNumber: displayNumber(row.id),
    kennelId: row.kennel_id,
    requesterUserId: row.requester_user_id,
    subject: row.subject,
    category: row.category,
    priority: row.priority,
    status: row.status,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastReplyAt: row.last_reply_at,
    closedAt: row.closed_at,
    messages: messageMap.get(row.id) || [],
  }));
}

export async function listKennelSupportTickets(kennelId: string) {
  const filter = encodeURIComponent(`eq.${kennelId}`);
  const [tickets, messages] = await Promise.all([
    rest<TicketRow[]>(`rest/v1/platform_support_tickets?select=*&kennel_id=${filter}&order=updated_at.desc&limit=200`),
    rest<MessageRow[]>(`rest/v1/platform_support_ticket_messages?select=id,ticket_id,author_type,author_label,body,created_at&kennel_id=${filter}&order=created_at.asc&limit=3000`),
  ]);
  return mapTickets(tickets, messages);
}

export async function listAllSupportTickets() {
  const [tickets, messages] = await Promise.all([
    rest<TicketRow[]>("rest/v1/platform_support_tickets?select=*&order=updated_at.desc&limit=2000"),
    rest<MessageRow[]>("rest/v1/platform_support_ticket_messages?select=id,ticket_id,author_type,author_label,body,created_at&order=created_at.asc&limit=10000"),
  ]);
  return mapTickets(tickets, messages);
}

export async function createSupportTicket(input: { kennelId: string; userId: string; subject: string; category: SupportCategory; priority: SupportPriority; description: string }) {
  const rows = await rest<TicketRow[]>("rest/v1/platform_support_tickets?select=*", {
    method: "POST",
    headers: { "content-type": "application/json", prefer: "return=representation" },
    body: JSON.stringify({ kennel_id: input.kennelId, requester_user_id: input.userId, subject: input.subject, category: input.category, priority: input.priority, description: input.description }),
  });
  if (!rows[0]) throw new Error("The support ticket could not be created.");
  return mapTickets(rows, [])[0];
}

async function ticketForKennel(ticketId: number, kennelId: string) {
  const rows = await rest<TicketRow[]>(`rest/v1/platform_support_tickets?select=*&id=eq.${ticketId}&kennel_id=eq.${encodeURIComponent(kennelId)}&limit=1`);
  return rows[0] || null;
}

export async function addBreederSupportReply(input: { ticketId: number; kennelId: string; userId: string; kennelName: string; body: string }) {
  const ticket = await ticketForKennel(input.ticketId, input.kennelId);
  if (!ticket) throw new Error("Support ticket not found.");
  await rest<MessageRow[]>("rest/v1/platform_support_ticket_messages", {
    method: "POST",
    headers: { "content-type": "application/json", prefer: "return=minimal" },
    body: JSON.stringify({ ticket_id: input.ticketId, kennel_id: input.kennelId, author_type: "breeder", author_user_id: input.userId, author_label: input.kennelName, body: input.body }),
  });
  const nextStatus = ["Resolved", "Closed", "Waiting on Breeder"].includes(ticket.status) ? "Open" : ticket.status;
  await updateTicket(input.ticketId, { status: nextStatus as SupportStatus, last_reply_at: new Date().toISOString(), closed_at: null });
}

export async function addAdminSupportReply(input: { ticketId: number; adminUserId: string; adminLabel: string; body: string; status?: SupportStatus }) {
  const rows = await rest<TicketRow[]>(`rest/v1/platform_support_tickets?select=*&id=eq.${input.ticketId}&limit=1`);
  const ticket = rows[0];
  if (!ticket) throw new Error("Support ticket not found.");
  await rest<MessageRow[]>("rest/v1/platform_support_ticket_messages", {
    method: "POST",
    headers: { "content-type": "application/json", prefer: "return=minimal" },
    body: JSON.stringify({ ticket_id: input.ticketId, kennel_id: ticket.kennel_id, author_type: "platform_admin", author_user_id: input.adminUserId, author_label: input.adminLabel, body: input.body }),
  });
  const status = input.status || "Waiting on Breeder";
  await updateTicket(input.ticketId, { status, last_reply_at: new Date().toISOString(), closed_at: ["Resolved", "Closed"].includes(status) ? new Date().toISOString() : null });
}

export async function updateSupportTicketAsAdmin(ticketId: number, input: { status?: SupportStatus; priority?: SupportPriority }) {
  await updateTicket(ticketId, {
    ...input,
    closed_at: input.status && ["Resolved", "Closed"].includes(input.status) ? new Date().toISOString() : input.status ? null : undefined,
  });
}

async function updateTicket(ticketId: number, values: Record<string, unknown>) {
  const body = Object.fromEntries(Object.entries({ ...values, updated_at: new Date().toISOString() }).filter(([, value]) => value !== undefined));
  await rest<unknown>(`rest/v1/platform_support_tickets?id=eq.${ticketId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", prefer: "return=minimal" },
    body: JSON.stringify(body),
  });
}
