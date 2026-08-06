import { breederSessionFromRequest, requireAdminSession } from "../../../lib/admin-session";
import {
  addWhelpingPuppy,
  assignWaitlistPuppy,
  BreedingValidationError,
  completeWhelping,
  getBreedingData,
  moveWaitlistEntry,
  recordPuppyCare,
  recordPuppyWeight,
  reorderWaitlist,
  saveBreedingAttempt,
  saveBreedingRecord,
  saveGeneticResult,
  saveHeatCycle,
  savePregnancy,
  saveProgesteroneTest,
  saveWaitlistEntry,
  startWhelping,
} from "../../../db/breeding";

type Action =
  | "genetic_result" | "heat_cycle" | "progesterone_test" | "breeding_record"
  | "breeding_attempt" | "pregnancy" | "start_whelping" | "add_whelping_puppy"
  | "complete_whelping" | "puppy_weight" | "puppy_care" | "waitlist_entry"
  | "reorder_waitlist" | "assign_waitlist_puppy" | "move_waitlist_entry";

const actions: Record<Action, (input: Record<string, unknown>, kennelId: string) => Promise<unknown>> = {
  genetic_result: saveGeneticResult,
  heat_cycle: saveHeatCycle,
  progesterone_test: saveProgesteroneTest,
  breeding_record: saveBreedingRecord,
  breeding_attempt: saveBreedingAttempt,
  pregnancy: savePregnancy,
  start_whelping: startWhelping,
  add_whelping_puppy: addWhelpingPuppy,
  complete_whelping: completeWhelping,
  puppy_weight: recordPuppyWeight,
  puppy_care: recordPuppyCare,
  waitlist_entry: saveWaitlistEntry,
  reorder_waitlist: reorderWaitlist,
  assign_waitlist_puppy: assignWaitlistPuppy,
  move_waitlist_entry: moveWaitlistEntry,
};

export async function GET(request: Request) {
  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;
  try {
    const session = breederSessionFromRequest(request)!;
    return Response.json(await getBreedingData(session.kennelId), { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load breeding records." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;
  try {
    const body = await request.json() as { action?: unknown; data?: unknown };
    const action = String(body.action ?? "") as Action;
    if (!actions[action] || !body.data || typeof body.data !== "object" || Array.isArray(body.data)) return Response.json({ error: "A valid breeding action and record are required." }, { status: 400 });
    const session = breederSessionFromRequest(request)!;
    const result = await actions[action](body.data as Record<string, unknown>, session.kennelId);
    return Response.json(result, { status: 201, headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to save the breeding record." }, { status: error instanceof BreedingValidationError ? 400 : 500 });
  }
}
