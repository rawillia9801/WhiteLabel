import { syncPuppyJourneyMilestones } from "../../../../lib/puppy-journey";
import { supabaseRequest } from "../../../../db/supabase";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) return request.headers.get("authorization") === `Bearer ${secret}`;
  return request.headers.get("user-agent")?.startsWith("vercel-cron/") === true && request.headers.has("x-vercel-cron-schedule");
}

export async function GET(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const response = await supabaseRequest("rest/v1/kennels?select=id", { cache: "no-store" });
    if (!response.ok) throw new Error((await response.text()) || "Unable to load kennel workspaces.");
    const kennels = await response.json() as Array<{ id: string }>;
    const results = [];
    for (const kennel of kennels) results.push({ kennelId: kennel.id, ...(await syncPuppyJourneyMilestones(kennel.id)) });
    return Response.json({ kennels: results.length, results });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to synchronize puppy milestones." }, { status: 500 });
  }
}
