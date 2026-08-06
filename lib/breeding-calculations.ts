export type CalendarEventSpec = {
  automationKey: string;
  title: string;
  eventType: string;
  eventDate: string;
  relatedType: string;
  relatedId: number;
  sourceType: string;
  sourceId: number;
  notes: string;
};

const dateOnly = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
  if (Number.isNaN(date.getTime())) throw new Error("A valid date is required.");
  return date.toISOString().slice(0, 10);
};

export function addDays(value: string | Date, days: number) {
  const date = new Date(`${dateOnly(value)}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function estimateNextHeat(starts: string[]) {
  const sorted = starts.map(dateOnly).sort();
  if (!sorted.length) return { estimatedDate: null, averageIntervalDays: null, sourceCycles: 0 };
  if (sorted.length === 1) return { estimatedDate: addDays(sorted[0], 183), averageIntervalDays: 183, sourceCycles: 1 };
  const intervals = sorted.slice(1).map((date, index) => Math.round((new Date(`${date}T12:00:00Z`).getTime() - new Date(`${sorted[index]}T12:00:00Z`).getTime()) / 86_400_000)).filter((days) => days >= 60 && days <= 730);
  const average = intervals.length ? Math.round(intervals.reduce((sum, days) => sum + days, 0) / intervals.length) : 183;
  return { estimatedDate: addDays(sorted[sorted.length - 1], average), averageIntervalDays: average, sourceCycles: sorted.length };
}

export function estimatePregnancyWindow(attemptDates: string[]) {
  const sorted = attemptDates.map(dateOnly).sort();
  if (!sorted.length) return null;
  const midpointAttempt = new Date(Math.round((new Date(`${sorted[0]}T12:00:00Z`).getTime() + new Date(`${sorted[sorted.length - 1]}T12:00:00Z`).getTime()) / 2));
  return {
    start: addDays(sorted[0], 58),
    end: addDays(sorted[sorted.length - 1], 68),
    midpoint: addDays(midpointAttempt, 63),
    disclaimer: "Estimated from recorded breeding dates. Ovulation timing and gestation length vary; confirm the care plan with a veterinarian.",
  };
}

export function breedingCalendarEvents(input: { breedingRecordId: number; damId: number; firstAttempt: string; lastAttempt?: string }) {
  const base = dateOnly(input.firstAttempt);
  const last = dateOnly(input.lastAttempt || input.firstAttempt);
  const prefix = `breeding:${input.breedingRecordId}`;
  return [
    { key: "ultrasound", title: "Estimated ultrasound window", type: "Pregnancy milestone", date: addDays(base, 28), notes: "Estimated planning date generated from the first recorded breeding attempt." },
    { key: "xray", title: "Estimated X-ray window", type: "Pregnancy milestone", date: addDays(last, 52), notes: "Estimated planning date generated from the latest recorded breeding attempt." },
    { key: "whelping-start", title: "Estimated whelping window begins", type: "Whelping", date: addDays(base, 58), notes: "Estimated date only. Actual timing varies." },
    { key: "whelping-end", title: "Estimated whelping window ends", type: "Whelping", date: addDays(last, 68), notes: "Estimated date only. Contact the attending veterinarian about the appropriate care plan." },
  ].map((event): CalendarEventSpec => ({
    automationKey: `${prefix}:${event.key}`,
    title: event.title,
    eventType: event.type,
    eventDate: event.date,
    relatedType: "dogs",
    relatedId: input.damId,
    sourceType: "breeding_records",
    sourceId: input.breedingRecordId,
    notes: event.notes,
  }));
}

export function puppyCalendarEvents(input: { puppyId: number; puppyName: string; birthDate: string }) {
  const milestones = [
    [14, "Two-week development check", "Puppy milestone"],
    [14, "Deworming review", "Care"],
    [28, "Four-week development check", "Puppy milestone"],
    [28, "Deworming review", "Care"],
    [42, "Veterinary and vaccination review", "Care"],
    [42, "Family update due", "Family update"],
    [56, "Eight-week development check", "Puppy milestone"],
    [56, "Go-home readiness review", "Homecoming"],
  ] as const;
  return milestones.map(([days, title, type], index): CalendarEventSpec => ({
    automationKey: `puppy:${input.puppyId}:${days}:${index}`,
    title: `${input.puppyName}: ${title}`,
    eventType: type,
    eventDate: addDays(input.birthDate, days),
    relatedType: "puppies",
    relatedId: input.puppyId,
    sourceType: "puppies",
    sourceId: input.puppyId,
    notes: "System-generated planning event. Complete or reschedule it to match the puppy's individualized care plan.",
  }));
}

const grams = (weight: number, unit: string) => {
  if (unit === "kg") return weight * 1000;
  if (unit === "oz") return weight * 28.349523125;
  if (unit === "lb") return weight * 453.59237;
  return weight;
};

export function puppyWeightTrend(input: { birthWeight: number; birthUnit: string; entries: Array<{ measuredAt: string; weight: number; unit: string }>; lossWarningPercent?: number; noGainHours?: number }) {
  const birth = grams(input.birthWeight, input.birthUnit);
  const entries = input.entries
    .map((entry) => ({ ...entry, grams: grams(entry.weight, entry.unit), timestamp: new Date(entry.measuredAt).getTime() }))
    .filter((entry) => entry.grams > 0 && Number.isFinite(entry.timestamp))
    .sort((left, right) => left.timestamp - right.timestamp);
  const latest = entries[entries.length - 1];
  const previous = entries[entries.length - 2];
  const changeFromBirthPercent = latest && birth > 0 ? ((latest.grams - birth) / birth) * 100 : 0;
  const latestChangePercent = latest && previous ? ((latest.grams - previous.grams) / previous.grams) * 100 : 0;
  const warnings: string[] = [];
  const lossThreshold = Math.abs(input.lossWarningPercent ?? 10);
  if (latest && changeFromBirthPercent <= -lossThreshold) warnings.push(`Recorded weight is ${Math.abs(changeFromBirthPercent).toFixed(1)}% below birth weight.`);
  if (latest && previous && latest.grams <= previous.grams && latest.timestamp - previous.timestamp >= (input.noGainHours ?? 24) * 3_600_000) warnings.push("The latest interval does not show a recorded gain.");
  return {
    entries,
    latestGrams: latest?.grams ?? null,
    changeFromBirthPercent,
    latestChangePercent,
    warnings,
    disclaimer: "Weight alerts are configurable operational signals. They do not diagnose a medical condition; contact a veterinarian when a puppy's condition is concerning.",
  };
}
