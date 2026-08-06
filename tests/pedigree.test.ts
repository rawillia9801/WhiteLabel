import assert from "node:assert/strict";
import test from "node:test";
import { analyzeGeneticCompatibility, buildPedigree, calculateCoi, calculateDogCoi } from "../lib/pedigree.ts";
import type { PedigreeDog } from "../types/breeding.ts";

const dog = (id: number, name: string, sire_id: number | null = null, dam_id: number | null = null): PedigreeDog => ({ id, name, sire_id, dam_id });

test("Wright path COI is zero for unrelated parents", () => {
  const result = calculateCoi(1, 2, [dog(1, "Sire"), dog(2, "Dam")], 5);
  assert.equal(result.coefficient, 0);
  assert.deepEqual(result.commonAncestors, []);
});

test("Wright path COI is 25% for a father-daughter mating", () => {
  const dogs = [dog(1, "Father"), dog(2, "Unrelated dam"), dog(3, "Daughter", 1, 2)];
  const result = calculateCoi(1, 3, dogs, 5);
  assert.equal(result.percentage, 25);
  assert.equal(result.commonAncestors[0].dog.name, "Father");
  assert.equal(result.commonAncestors[0].independentPathPairs, 1);
});

test("Wright path COI sums two independent ancestors for full siblings", () => {
  const dogs = [dog(1, "Father"), dog(2, "Mother"), dog(3, "Son", 1, 2), dog(4, "Daughter", 1, 2)];
  const result = calculateCoi(3, 4, dogs, 5);
  assert.equal(result.percentage, 25);
  assert.deepEqual(result.commonAncestors.map((item) => item.contribution), [0.125, 0.125]);
});

test("Wright path COI is 12.5% for half siblings", () => {
  const dogs = [dog(1, "Shared sire"), dog(2, "Dam one"), dog(3, "Dam two"), dog(4, "Son", 1, 2), dog(5, "Daughter", 1, 3)];
  assert.equal(calculateCoi(4, 5, dogs, 5).percentage, 12.5);
});

test("pedigree completeness counts missing pedigree positions", () => {
  const sparse = [dog(1, "Sire"), dog(2, "Dam")];
  assert.ok(Math.abs(calculateCoi(1, 2, sparse, 1).pedigreeCompleteness - (100 / 3)) < 1e-10);
  const complete = [
    dog(1, "Sire", 3, 4), dog(2, "Dam", 5, 6),
    dog(3, "Sire sire"), dog(4, "Sire dam"), dog(5, "Dam sire"), dog(6, "Dam dam"),
  ];
  assert.equal(calculateCoi(1, 2, complete, 1).pedigreeCompleteness, 100);
});

test("dog COI and pedigree tree use the recorded parent links", () => {
  const dogs = [dog(1, "Father"), dog(2, "Mother"), dog(3, "Subject", 1, 2)];
  assert.equal(calculateDogCoi(3, dogs).percentage, 0);
  const pedigree = buildPedigree(3, dogs, 3);
  assert.equal(pedigree?.sire?.dog?.name, "Father");
  assert.equal(pedigree?.dam?.dog?.name, "Mother");
  assert.equal(pedigree?.sire?.sire?.dog, null);
});

test("genetic compatibility warns for two carriers and reviews missing results", () => {
  const results = [
    { dog_id: 1, provider: "Lab", test_name: "Panel", gene_or_condition: "PRA", result: "Carrier" as const },
    { dog_id: 2, provider: "Lab", test_name: "Panel", gene_or_condition: "PRA", result: "Carrier" as const },
    { dog_id: 1, provider: "Lab", test_name: "Panel", gene_or_condition: "DM", result: "Clear" as const },
  ];
  const compatibility = analyzeGeneticCompatibility(1, 2, results);
  assert.equal(compatibility.find((item) => item.condition === "PRA")?.level, "warning");
  assert.equal(compatibility.find((item) => item.condition === "DM")?.level, "review");
});
