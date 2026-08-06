import {
  assignWaitlistPuppy,
  completeWhelping,
  createBreedingModuleRecord,
  getBreedingProgramData,
  isBreedingModuleResource,
  moveWaitlistEntry,
  recordWhelpingPuppy,
  startWhelping,
  updateDogBreedingProfile,
  updateLitterPregnancy,
  updateBreedingModuleRecord,
} from "../../../db/breeding-program";
import { breederSessionFromRequest, requireAdminSession } from "../../../lib/admin-session";

const validId = (value: unknown) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

function failure(error: unknown, fallback: string) {
  return Response.json({ error: error instanceof Error ? error.message : fallback }, { status: 400 });
}

export async function GET(request: Request) {
  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;
  const session = breederSessionFromRequest(request)!;
  try {
    return Response.json(await getBreedingProgramData(session.kennelId), { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return failure(error, "Unable to load breeding-program records.");
  }
}

export async function POST(request: Request) {
  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;
  const session = breederSessionFromRequest(request)!;
  try {
    const body = await request.json() as Record<string, unknown>;
    const action = String(body.action ?? "create");

    if (action === "create") {
      if (!isBreedingModuleResource(body.resource) || !body.data || typeof body.data !== "object") {
        return Response.json({ error: "A valid breeding-program resource and data are required." }, { status: 400 });
      }
      return Response.json(await createBreedingModuleRecord(body.resource, body.data as Record<string, unknown>, session.kennelId), { status: 201 });
    }

    if (action === "start_whelping" || action === "complete_whelping") {
      const litterId = validId(body.litter_id);
      if (!litterId) return Response.json({ error: "A litter is required." }, { status: 400 });
      const record = action === "start_whelping" ? await startWhelping(litterId, session.kennelId) : await completeWhelping(litterId, session.kennelId);
      return Response.json(record);
    }

    if (action === "record_whelping_puppy") {
      if (!body.data || typeof body.data !== "object") return Response.json({ error: "Puppy birth information is required." }, { status: 400 });
      return Response.json(await recordWhelpingPuppy(body.data as Record<string, unknown>, session.kennelId), { status: 201 });
    }

    if (action === "update_dog_breeding_profile") {
      const dogId = validId(body.dog_id);
      if (!dogId || !body.data || typeof body.data !== "object") return Response.json({ error: "A dog and breeding profile data are required." }, { status: 400 });
      return Response.json(await updateDogBreedingProfile(dogId, body.data as Record<string, unknown>, session.kennelId));
    }

    if (action === "update_litter_pregnancy") {
      const litterId = validId(body.litter_id);
      if (!litterId || !body.data || typeof body.data !== "object") return Response.json({ error: "A litter and pregnancy information are required." }, { status: 400 });
      return Response.json(await updateLitterPregnancy(litterId, body.data as Record<string, unknown>, session.kennelId));
    }

    if (action === "assign_waitlist_puppy") {
      const entryId = validId(body.entry_id);
      const puppyId = validId(body.puppy_id);
      if (!entryId || !puppyId) return Response.json({ error: "A waitlist entry and puppy are required." }, { status: 400 });
      await assignWaitlistPuppy(entryId, puppyId, session.kennelId, session.userId);
      return Response.json({ success: true });
    }

    if (action === "move_waitlist") {
      const entryId = validId(body.entry_id);
      const direction = Number(body.direction);
      if (!entryId || ![-1, 1].includes(direction)) return Response.json({ error: "A waitlist entry and valid direction are required." }, { status: 400 });
      await moveWaitlistEntry(entryId, direction as -1 | 1, session.kennelId, session.userId);
      return Response.json({ success: true });
    }

    return Response.json({ error: "Unsupported breeding-program action." }, { status: 400 });
  } catch (error) {
    return failure(error, "Unable to save breeding-program information.");
  }
}

export async function PUT(request: Request) {
  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;
  const session = breederSessionFromRequest(request)!;
  try {
    const body = await request.json() as Record<string, unknown>;
    const id = validId(body.id);
    if (!id || !isBreedingModuleResource(body.resource) || !body.data || typeof body.data !== "object") {
      return Response.json({ error: "A valid breeding-program resource, id, and data are required." }, { status: 400 });
    }
    return Response.json(await updateBreedingModuleRecord(body.resource, id, body.data as Record<string, unknown>, session.kennelId, session.userId));
  } catch (error) {
    return failure(error, "Unable to update breeding-program information.");
  }
}
