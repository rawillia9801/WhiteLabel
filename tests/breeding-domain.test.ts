import assert from "node:assert/strict";
import test from "node:test";
import {
  addDays,
  breedingTimeline,
  dogCOI,
  findCommonAncestors,
  geneticCompatibility,
  pedigreeCompleteness,
  plannedMatingCOI,
  predictNextHeat,
  weightChangePercent,
  type PedigreeDog,
} from "../lib/breeding-domain.ts";

const pedigree: PedigreeDog[] = [
  { id: 1, name: "Founder A" },
  { id: 2, name: "Founder B" },
  { id: 3, name: "Sibling One", sire_id: 1, dam_id: 2 },
  { id: 4, name: "Sibling Two", sire_id: 1, dam_id: 2 },
  { id: 5, name: "Offspring", sire_id: 3, dam_id: 4 },
];

test("calculates Wright COI for recorded pedigrees and planned matings", () => {
  assert.equal(dogCOI(3, pedigree), 0);
  assert.equal(plannedMatingCOI(3, 4, pedigree), 0.25);
  assert.equal(dogCOI(5, pedigree), 0.25);
  assert.equal(pedigreeCompleteness(5, pedigree, 2), 100);
  assert.deepEqual(findCommonAncestors(3, 4, pedigree).map((item) => item.dog.id).sort(), [1, 2]);
});

test("generates the reproductive calendar from the recorded breeding date", () => {
  assert.equal(addDays("2026-08-05", 63), "2026-10-07");
  const timeline = breedingTimeline("2026-08-05");
  assert.equal(timeline.length, 7);
  assert.deepEqual(timeline.map((item) => item.offsetDays), [25, 30, 45, 55, 58, 63, 65]);
  assert.equal(timeline.find((item) => item.offsetDays === 63)?.title, "Estimated due date");
});

test("predicts the next heat from plausible recorded intervals", () => {
  const forecast = predictNextHeat([
    { start_date: "2025-06-01" },
    { start_date: "2025-12-01" },
    { start_date: "2026-06-02" },
  ]);
  assert.equal(forecast?.averageDays, 183);
  assert.equal(forecast?.estimatedDate, "2026-12-02");
});

test("flags recessive pairings only when both parents have reproductive statuses", () => {
  const results = geneticCompatibility(10, 11, [
    { dog_id: 10, condition: "PRA", result_status: "Carrier", inheritance_mode: "Autosomal Recessive" },
    { dog_id: 11, condition: "PRA", result_status: "Carrier", inheritance_mode: "Autosomal Recessive" },
    { dog_id: 10, condition: "DM", result_status: "Clear", inheritance_mode: "Autosomal Recessive" },
    { dog_id: 11, condition: "DM", result_status: "Carrier", inheritance_mode: "Autosomal Recessive" },
  ]);
  assert.deepEqual(results.map((result) => [result.condition, result.review]), [["PRA", true], ["DM", false]]);
});

test("calculates newborn weight change percentages", () => {
  assert.ok(Math.abs((weightChangePercent(10, 9.4) ?? 0) + 6) < 1e-9);
  assert.equal(weightChangePercent(0, 9), null);
});
