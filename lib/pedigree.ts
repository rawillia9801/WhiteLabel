import type { CoiResult, CommonAncestor, GeneticCompatibility, GeneticResult, Id, PedigreeDog, PedigreeNode } from "../types/breeding";

const parentIds = (dog: PedigreeDog | undefined) => [dog?.sire_id, dog?.dam_id]
  .map(Number)
  .filter((value): value is number => Number.isInteger(value) && value > 0);

function dogMap(dogs: PedigreeDog[]) {
  return new Map(dogs.map((dog) => [Number(dog.id), dog]));
}

function pathsFrom(startId: Id, dogs: Map<Id, PedigreeDog>, generations: number) {
  const paths = new Map<Id, Id[][]>();
  const visit = (dogId: Id, path: Id[], remaining: number) => {
    const nextPath = [...path, dogId];
    const existing = paths.get(dogId) ?? [];
    existing.push(nextPath);
    paths.set(dogId, existing);
    if (remaining <= 0) return;
    for (const parentId of parentIds(dogs.get(dogId))) {
      if (!nextPath.includes(parentId)) visit(parentId, nextPath, remaining - 1);
    }
  };
  visit(startId, [], Math.max(0, generations));
  return paths;
}

function independent(left: Id[], right: Id[]) {
  const ancestor = left[left.length - 1];
  if (ancestor !== right[right.length - 1]) return false;
  const leftInterior = new Set(left.slice(0, -1));
  return right.slice(0, -1).every((id) => !leftInterior.has(id));
}

function inbreedingForDog(
  dogId: Id,
  dogs: Map<Id, PedigreeDog>,
  generations: number,
  memo: Map<string, number>,
  stack: Set<Id>,
): number {
  const key = `${dogId}:${generations}`;
  if (memo.has(key)) return memo.get(key)!;
  if (generations <= 0 || stack.has(dogId)) return 0;
  const dog = dogs.get(dogId);
  const sireId = Number(dog?.sire_id) || 0;
  const damId = Number(dog?.dam_id) || 0;
  if (!sireId || !damId) return 0;
  stack.add(dogId);
  const value = calculateCoiInternal(sireId, damId, dogs, generations - 1, memo, stack).coefficient;
  stack.delete(dogId);
  memo.set(key, value);
  return value;
}

function completenessForMating(sireId: Id, damId: Id, dogs: Map<Id, PedigreeDog>, generations: number) {
  let known = 0;
  const visit = (dogId: Id | null, remaining: number, trail: Set<Id>) => {
    if (remaining < 0) return;
    if (!dogId || !dogs.has(dogId) || trail.has(dogId)) return;
    known += 1;
    if (remaining === 0) return;
    const dog = dogs.get(dogId)!;
    const nextTrail = new Set(trail).add(dogId);
    visit(Number(dog.sire_id) || null, remaining - 1, nextTrail);
    visit(Number(dog.dam_id) || null, remaining - 1, nextTrail);
  };
  visit(sireId, generations, new Set());
  visit(damId, generations, new Set());
  const possible = 2 * (Math.pow(2, generations + 1) - 1);
  return possible ? known / possible : 0;
}

function calculateCoiInternal(
  sireId: Id,
  damId: Id,
  dogs: Map<Id, PedigreeDog>,
  generations: number,
  memo: Map<string, number>,
  stack: Set<Id>,
): CoiResult {
  if (!dogs.has(sireId) || !dogs.has(damId) || generations < 1) {
    return { coefficient: 0, percentage: 0, generations, commonAncestors: [], pedigreeCompleteness: 0 };
  }

  const sirePaths = pathsFrom(sireId, dogs, generations);
  const damPaths = pathsFrom(damId, dogs, generations);
  const commonAncestors: CommonAncestor[] = [];
  let coefficient = 0;

  for (const [ancestorId, leftPaths] of sirePaths) {
    const rightPaths = damPaths.get(ancestorId);
    const ancestor = dogs.get(ancestorId);
    if (!rightPaths || !ancestor) continue;
    const validPairs: Array<[Id[], Id[]]> = [];
    let contribution = 0;
    const ancestorCoi = inbreedingForDog(ancestorId, dogs, generations, memo, stack);
    for (const left of leftPaths) {
      for (const right of rightPaths) {
        if (!independent(left, right)) continue;
        validPairs.push([left, right]);
        const sireDistance = left.length - 1;
        const damDistance = right.length - 1;
        contribution += Math.pow(0.5, sireDistance + damDistance + 1) * (1 + ancestorCoi);
      }
    }
    if (!validPairs.length) continue;
    coefficient += contribution;
    commonAncestors.push({
      dog: ancestor,
      sirePaths: validPairs.map(([left]) => left),
      damPaths: validPairs.map(([, right]) => right),
      independentPathPairs: validPairs.length,
      contribution,
      ancestorCoi,
    });
  }

  commonAncestors.sort((left, right) => right.contribution - left.contribution || left.dog.name.localeCompare(right.dog.name));
  const bounded = Math.max(0, Math.min(1, coefficient));
  return {
    coefficient: bounded,
    percentage: bounded * 100,
    generations,
    commonAncestors,
    pedigreeCompleteness: completenessForMating(sireId, damId, dogs, generations) * 100,
  };
}

export function calculateCoi(sireId: Id, damId: Id, dogs: PedigreeDog[], generations = 5): CoiResult {
  const safeGenerations = Math.max(1, Math.min(12, Math.round(generations)));
  return calculateCoiInternal(sireId, damId, dogMap(dogs), safeGenerations, new Map(), new Set());
}

export function calculateDogCoi(dogId: Id, dogs: PedigreeDog[], generations = 5): CoiResult {
  const map = dogMap(dogs);
  const dog = map.get(dogId);
  const sireId = Number(dog?.sire_id) || 0;
  const damId = Number(dog?.dam_id) || 0;
  if (!sireId || !damId) return { coefficient: 0, percentage: 0, generations, commonAncestors: [], pedigreeCompleteness: 0 };
  return calculateCoi(sireId, damId, dogs, generations);
}

export function buildPedigree(dogId: Id, dogs: PedigreeDog[], generations = 3): PedigreeNode | null {
  const map = dogMap(dogs);
  const build = (id: Id | null, generation: number, slot: string, trail: Set<Id>): PedigreeNode | null => {
    if (generation > generations) return null;
    const dog = id ? map.get(id) ?? null : null;
    if (!dog) return { slot, generation, dog: null, sire: null, dam: null };
    if (trail.has(dog.id)) return { slot, generation, dog, sire: null, dam: null };
    const nextTrail = new Set(trail).add(dog.id);
    return {
      slot,
      generation,
      dog,
      sire: generation < generations ? build(Number(dog.sire_id) || null, generation + 1, `${slot}S`, nextTrail) : null,
      dam: generation < generations ? build(Number(dog.dam_id) || null, generation + 1, `${slot}D`, nextTrail) : null,
    };
  };
  return build(dogId, 0, "P", new Set());
}

const normalizedCondition = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");

export function analyzeGeneticCompatibility(sireId: Id, damId: Id, results: GeneticResult[]): GeneticCompatibility[] {
  const sire = results.filter((result) => Number(result.dog_id) === sireId);
  const dam = results.filter((result) => Number(result.dog_id) === damId);
  const conditions = [...new Set([...sire, ...dam].map((result) => normalizedCondition(result.gene_or_condition)).filter(Boolean))];
  return conditions.map((condition) => {
    const sireResult = sire.find((result) => normalizedCondition(result.gene_or_condition) === condition);
    const damResult = dam.find((result) => normalizedCondition(result.gene_or_condition) === condition);
    const left = sireResult?.result ?? "Not recorded";
    const right = damResult?.result ?? "Not recorded";
    const display = sireResult?.gene_or_condition || damResult?.gene_or_condition || condition;
    const affected = [left, right].some((result) => ["At Risk", "Affected"].includes(result));
    const bothCarry = [left, right].every((result) => ["Carrier", "At Risk", "Affected"].includes(result));
    if (affected || bothCarry) {
      return { condition: display, sireResult: left, damResult: right, level: "warning", message: "The recorded results indicate a potentially incompatible pairing. Review the laboratory reports and consult a qualified veterinarian or genetics professional." };
    }
    if (left === "Not recorded" || right === "Not recorded" || [left, right].includes("Indeterminate") || [left, right].includes("Pending")) {
      return { condition: display, sireResult: left, damResult: right, level: "review", message: "Results are incomplete or unresolved for this pairing. Confirm both dogs' current laboratory records before breeding." };
    }
    return { condition: display, sireResult: left, damResult: right, level: "clear", message: "No conflict is indicated by the structured results currently recorded." };
  });
}

export const GENETICS_DISCLAIMER = "Compatibility warnings summarize recorded laboratory results for planning purposes. They are informational and are not veterinary advice.";
