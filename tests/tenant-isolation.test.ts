import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("breeding domain requests are kennel-scoped and validate linked records", async () => {
  const source = await readFile(new URL("../db/breeding.ts", import.meta.url), "utf8");
  assert.match(source, /const kennelQuery = \(kennelId: string\) => `kennel_id=eq\.\$\{encodeURIComponent\(kennelId\)\}`/);
  assert.match(source, /requireRow\("dogs", input\.dog_id, kennelId/);
  assert.match(source, /requireRow\("puppies", input\.puppy_id, kennelId/);
  assert.match(source, /requireRow\("buyers", input\.buyer_id, kennelId/);
});

test("legacy puppy workflows require and persist kennel ownership", async () => {
  const journey = await readFile(new URL("../lib/puppy-journey.ts", import.meta.url), "utf8");
  const weights = await readFile(new URL("../lib/puppy-weight-log.ts", import.meta.url), "utf8");
  assert.match(journey, /syncPuppyJourneyMilestones\(kennelId: string/);
  assert.match(journey, /kennel_id: kennelId/);
  assert.match(journey, /&kennel_id=eq\.\$\{encodeURIComponent\(kennelId\)\}/);
  assert.match(weights, /recordWeeklyPuppyWeight\(puppy: Row, kennelId: string\)/);
  assert.match(weights, /kennel_id: kennelId/);
});

test("migration enables membership and family portal RLS on breeder data", async () => {
  const migration = await readFile(new URL("../supabase/migrations/20260805163000_professional_breeding_management.sql", import.meta.url), "utf8");
  assert.match(migration, /create policy mydogportal_member_select/);
  assert.match(migration, /public\.is_kennel_member\(kennel_id\)/);
  assert.match(migration, /create policy mydogportal_portal_puppy_select/);
  assert.match(migration, /buyer_id = public\.portal_buyer_id\(\)/);
  assert.match(migration, /create policy mydogportal_portal_care_select/);
  assert.match(migration, /visible_to_family = true/);
  assert.doesNotMatch(migration, /foldername\(name\)\)\[2\]\)::uuid/);
});
