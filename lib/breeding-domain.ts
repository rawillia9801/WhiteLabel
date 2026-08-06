export type PedigreeDog = {
  id: number;
  name: string;
  sire_id?: number | null;
  dam_id?: number | null;
};

export type GeneticResult = {
  dog_id: number;
  condition: string;
  gene?: string | null;
  result_status: string;
  inheritance_mode?: string | null;
};

export type HeatCycleLike = { start_date: string };

export type TimelineEvent = {
  title: string;
  eventType: string;
  eventDate: string;
  offsetDays: number;
};

const dateOnly = (value: string) => value.slice(0, 10);

export function addDays(isoDate: string, days: number) {
  const date = new Date(`${dateOnly(isoDate)}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function breedingTimeline(breedingDate: string): TimelineEvent[] {
  if (!breedingDate) return [];
  const milestones = [
    [25, "Ultrasound window opens", "Pregnancy"],
    [30, "Mid-pregnancy check-in", "Pregnancy"],
    [45, "Prepare whelping supplies", "Whelping prep"],
    [55, "X-ray / puppy-count window", "Pregnancy"],
    [58, "Expected whelping window begins", "Whelping"],
    [63, "Estimated due date", "Whelping"],
    [65, "Expected whelping window ends", "Whelping"],
  ] as const;
  return milestones.map(([offsetDays, title, eventType]) => ({
    title,
    eventType,
    eventDate: addDays(breedingDate, offsetDays),
    offsetDays,
  }));
}

export function predictNextHeat(cycles: HeatCycleLike[]) {
  const starts = cycles
    .map((cycle) => dateOnly(cycle.start_date))
    .filter(Boolean)
    .sort();
  if (starts.length < 2) return null;

  const intervals = starts.slice(1).map((value, index) => {
    const current = new Date(`${value}T12:00:00Z`).getTime();
    const previous = new Date(`${starts[index]}T12:00:00Z`).getTime();
    return Math.round((current - previous) / 86400000);
  }).filter((days) => days > 60 && days < 600);
  if (!intervals.length) return null;

  const averageDays = Math.round(intervals.reduce((sum, days) => sum + days, 0) / intervals.length);
  return { averageDays, estimatedDate: addDays(starts.at(-1)!, averageDays) };
}

function ancestryOrder(dogs: PedigreeDog[]) {
  const byId = new Map(dogs.map((dog) => [dog.id, dog]));
  const visiting = new Set<number>();
  const visited = new Set<number>();
  const ordered: PedigreeDog[] = [];

  function visit(id: number | null | undefined) {
    if (!id || visited.has(id)) return;
    if (visiting.has(id)) throw new Error("Pedigree contains a circular parent relationship.");
    const dog = byId.get(id);
    if (!dog) return;
    visiting.add(id);
    visit(dog.sire_id);
    visit(dog.dam_id);
    visiting.delete(id);
    visited.add(id);
    ordered.push(dog);
  }

  dogs.forEach((dog) => visit(dog.id));
  return ordered;
}

export function relationshipMatrix(dogs: PedigreeDog[]) {
  const ordered = ancestryOrder(dogs);
  const positions = new Map(ordered.map((dog, index) => [dog.id, index]));
  const matrix = Array.from({ length: ordered.length }, () => Array(ordered.length).fill(0));

  ordered.forEach((dog, i) => {
    const sire = dog.sire_id ? positions.get(dog.sire_id) : undefined;
    const dam = dog.dam_id ? positions.get(dog.dam_id) : undefined;
    for (let j = 0; j < i; j += 1) {
      const sireRelationship = sire === undefined ? 0 : matrix[sire][j];
      const damRelationship = dam === undefined ? 0 : matrix[dam][j];
      matrix[i][j] = 0.5 * (sireRelationship + damRelationship);
      matrix[j][i] = matrix[i][j];
    }
    const parentRelationship = sire === undefined || dam === undefined ? 0 : matrix[sire][dam];
    matrix[i][i] = 1 + (0.5 * parentRelationship);
  });

  return { ordered, positions, matrix };
}

export function dogCOI(dogId: number, dogs: PedigreeDog[]) {
  const { positions, matrix } = relationshipMatrix(dogs);
  const position = positions.get(dogId);
  return position === undefined ? null : Math.max(0, matrix[position][position] - 1);
}

export function plannedMatingCOI(sireId: number, damId: number, dogs: PedigreeDog[]) {
  const { positions, matrix } = relationshipMatrix(dogs);
  const sire = positions.get(sireId);
  const dam = positions.get(damId);
  if (sire === undefined || dam === undefined) return null;
  return Math.max(0, 0.5 * matrix[sire][dam]);
}

function ancestorDepths(dogId: number, dogs: PedigreeDog[], maxGenerations: number) {
  const byId = new Map(dogs.map((dog) => [dog.id, dog]));
  const depths = new Map<number, number>();
  let frontier = [dogId];
  for (let depth = 1; depth <= maxGenerations; depth += 1) {
    const next: number[] = [];
    frontier.forEach((id) => {
      const dog = byId.get(id);
      [dog?.sire_id, dog?.dam_id].forEach((parentId) => {
        if (!parentId || !byId.has(parentId)) return;
        const existing = depths.get(parentId);
        if (existing === undefined || depth < existing) depths.set(parentId, depth);
        next.push(parentId);
      });
    });
    frontier = next;
  }
  return depths;
}

export function findCommonAncestors(firstId: number, secondId: number, dogs: PedigreeDog[], maxGenerations = 5) {
  const byId = new Map(dogs.map((dog) => [dog.id, dog]));
  const first = ancestorDepths(firstId, dogs, maxGenerations);
  const second = ancestorDepths(secondId, dogs, maxGenerations);
  return [...first.entries()]
    .filter(([id]) => second.has(id))
    .map(([id, firstDepth]) => ({ dog: byId.get(id)!, firstDepth, secondDepth: second.get(id)! }))
    .sort((left, right) => (left.firstDepth + left.secondDepth) - (right.firstDepth + right.secondDepth));
}

export function pedigreeCompleteness(dogId: number, dogs: PedigreeDog[], generations = 5) {
  const byId = new Map(dogs.map((dog) => [dog.id, dog]));
  let knownSlots = 0;
  let frontier: Array<number | null | undefined> = [dogId];
  for (let depth = 1; depth <= generations; depth += 1) {
    const next: Array<number | null | undefined> = [];
    frontier.forEach((id) => {
      const dog = id ? byId.get(id) : undefined;
      [dog?.sire_id, dog?.dam_id].forEach((parentId) => {
        if (parentId && byId.has(parentId)) knownSlots += 1;
        next.push(parentId);
      });
    });
    frontier = next;
  }
  const totalSlots = (2 ** (generations + 1)) - 2;
  return totalSlots ? Math.round((knownSlots / totalSlots) * 100) : 0;
}

export function geneticCompatibility(sireId: number, damId: number, tests: GeneticResult[]) {
  const sireTests = tests.filter((test) => test.dog_id === sireId);
  const damTests = tests.filter((test) => test.dog_id === damId);
  const damByCondition = new Map(damTests.map((test) => [test.condition.toLowerCase(), test]));
  return sireTests.flatMap((sireTest) => {
    const damTest = damByCondition.get(sireTest.condition.toLowerCase());
    if (!damTest) return [];
    const inheritance = (sireTest.inheritance_mode || damTest.inheritance_mode || "").toLowerCase();
    const reproductiveStatuses = new Set(["carrier", "affected", "at risk"]);
    const review = inheritance.includes("recessive")
      && reproductiveStatuses.has(sireTest.result_status.toLowerCase())
      && reproductiveStatuses.has(damTest.result_status.toLowerCase());
    return [{ condition: sireTest.condition, sireStatus: sireTest.result_status, damStatus: damTest.result_status, review }];
  });
}

export function weightChangePercent(previousWeight: number, currentWeight: number) {
  if (!Number.isFinite(previousWeight) || previousWeight <= 0 || !Number.isFinite(currentWeight)) return null;
  return ((currentWeight - previousWeight) / previousWeight) * 100;
}
