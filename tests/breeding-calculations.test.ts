import assert from "node:assert/strict";
import test from "node:test";
import { breedingCalendarEvents, estimateNextHeat, estimatePregnancyWindow, puppyCalendarEvents, puppyWeightTrend } from "../lib/breeding-calculations.ts";

test("next heat estimation uses the average of valid recorded intervals", () => {
  const result = estimateNextHeat(["2025-01-01", "2025-07-01", "2026-01-03"]);
  assert.equal(result.averageIntervalDays, 184);
  assert.equal(result.estimatedDate, "2026-07-06");
  assert.equal(result.sourceCycles, 3);
});

test("pregnancy window spans 58 days from first attempt through 68 from last", () => {
  const result = estimatePregnancyWindow(["2026-08-02", "2026-08-04"]);
  assert.deepEqual(result && { start: result.start, end: result.end, midpoint: result.midpoint }, { start: "2026-09-29", end: "2026-10-11", midpoint: "2026-10-05" });
});

test("calendar automation keys are deterministic and workflow-specific", () => {
  const breeding = breedingCalendarEvents({ breedingRecordId: 9, damId: 4, firstAttempt: "2026-08-02", lastAttempt: "2026-08-04" });
  assert.equal(new Set(breeding.map((item) => item.automationKey)).size, breeding.length);
  assert.deepEqual(breeding.map((item) => item.eventDate), ["2026-08-30", "2026-09-25", "2026-09-29", "2026-10-11"]);
  const puppy = puppyCalendarEvents({ puppyId: 12, puppyName: "Blue", birthDate: "2026-08-05" });
  assert.equal(new Set(puppy.map((item) => item.automationKey)).size, puppy.length);
  assert.ok(puppy.every((item) => item.relatedType === "puppies" && item.relatedId === 12));
});

test("weight trend normalizes units and raises operational alerts", () => {
  const result = puppyWeightTrend({
    birthWeight: 10,
    birthUnit: "oz",
    entries: [
      { measuredAt: "2026-08-05T12:00:00Z", weight: 270, unit: "g" },
      { measuredAt: "2026-08-06T13:00:00Z", weight: 250, unit: "g" },
    ],
  });
  assert.ok(result.changeFromBirthPercent < -10);
  assert.equal(result.warnings.length, 2);
  assert.match(result.disclaimer, /do not diagnose/i);
});
