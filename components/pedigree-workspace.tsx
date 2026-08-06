"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Dna, Printer, ShieldAlert } from "lucide-react";
import { buildPedigree, calculateDogCoi, GENETICS_DISCLAIMER } from "../lib/pedigree";
import type { PedigreeNode } from "../types/breeding";
import { useBreedingData } from "./use-breeding-data";

function flatten(node: PedigreeNode | null): PedigreeNode[] {
  return node ? [node, ...flatten(node.sire), ...flatten(node.dam)] : [];
}

export function PedigreeWorkspace({ dogId }: { dogId: number }) {
  const { data, loading, error } = useBreedingData();
  const [generations, setGenerations] = useState<3 | 5>(3);
  const dog = data.dogs.find((candidate) => Number(candidate.id) === dogId);
  const pedigree = useMemo(() => dog ? buildPedigree(dogId, data.dogs, generations) : null, [data.dogs, dog, dogId, generations]);
  const nodes = useMemo(() => flatten(pedigree), [pedigree]);
  const coi = useMemo(() => dog ? calculateDogCoi(dogId, data.dogs, generations) : null, [data.dogs, dog, dogId, generations]);
  const genetics = data.dog_genetic_results.filter((result) => Number(result.dog_id) === dogId);

  if (loading) return <main className="pedigree-page pedigree-state">Loading pedigree…</main>;
  if (error) return <main className="pedigree-page pedigree-state"><b>Pedigree unavailable</b><p>{error}</p></main>;
  if (!dog) return <main className="pedigree-page pedigree-state"><b>Dog not found</b><Link href="/">Return to Dogs</Link></main>;

  return <main className="pedigree-page">
    <header className="pedigree-head">
      <Link href={`/dogs/${dogId}`}><ArrowLeft size={17}/> Dog profile</Link>
      <div><small>BREEDING PROGRAM / PEDIGREE</small><h1>{String(dog.registered_name || dog.name)}</h1><p>{[dog.call_name || dog.name, dog.breed, dog.sex, dog.color].filter(Boolean).join(" · ")}</p></div>
      <div className="pedigree-actions"><div className="segment-control"><button className={generations === 3 ? "active" : ""} onClick={() => setGenerations(3)}>3 generations</button><button className={generations === 5 ? "active" : ""} onClick={() => setGenerations(5)}>5 generations</button></div><button onClick={() => window.print()}><Printer size={16}/> Print pedigree</button></div>
    </header>

    <section className="pedigree-metrics">
      <article><small>COEFFICIENT OF INBREEDING</small><b>{coi?.percentage.toFixed(3)}%</b><span>Wright path calculation · {generations} generations</span></article>
      <article><small>PEDIGREE COMPLETENESS</small><b>{coi?.pedigreeCompleteness.toFixed(1)}%</b><span>Known ancestor positions in this view</span></article>
      <article><small>COMMON ANCESTORS</small><b>{coi?.commonAncestors.length ?? 0}</b><span>{coi?.commonAncestors.reduce((sum, ancestor) => sum + ancestor.independentPathPairs, 0) ?? 0} independent path pairs</span></article>
      <article><small>GENETIC RESULTS</small><b>{genetics.length}</b><span>Structured laboratory records</span></article>
    </section>

    <section className={`pedigree-chart generations-${generations}`} aria-label={`${generations}-generation pedigree`}>
      {Array.from({ length: generations + 1 }, (_, generation) => <div className="pedigree-column" key={generation}><header>Generation {generation}</header>{nodes.filter((node) => node.generation === generation).map((node) => <article className={node.dog ? "known" : "unknown"} key={node.slot}><small>{node.slot.endsWith("S") ? "SIRE" : node.slot.endsWith("D") ? "DAM" : "SUBJECT"}</small>{node.dog ? <><b>{node.dog.registered_name || node.dog.name}</b><span>{[node.dog.call_name && `“${node.dog.call_name}”`, node.dog.color].filter(Boolean).join(" · ")}</span></> : <><b>Unknown</b><span>Ancestor not recorded</span></>}</article>)}</div>)}
    </section>

    <section className="pedigree-detail-grid">
      <article className="breeding-panel"><header><div><small>COI CONTRIBUTIONS</small><h2>Common ancestors</h2></div></header>{coi?.commonAncestors.length ? <div className="ancestor-list">{coi.commonAncestors.map((ancestor) => <div key={ancestor.dog.id}><span><b>{ancestor.dog.registered_name || ancestor.dog.name}</b><small>{ancestor.independentPathPairs} independent path pair{ancestor.independentPathPairs === 1 ? "" : "s"}</small></span><strong>{(ancestor.contribution * 100).toFixed(4)}%</strong></div>)}</div> : <div className="breeding-empty"><b>No common ancestors found</b><p>No valid common-ancestor loops were found in the recorded {generations}-generation pedigree. Missing ancestors reduce certainty.</p></div>}</article>
      <article className="breeding-panel"><header><div><small>STRUCTURED RESULTS</small><h2>Genetics</h2></div><Dna size={22}/></header>{genetics.length ? <div className="genetics-list">{genetics.map((result) => <div key={String(result.id)}><span><b>{result.gene_or_condition}</b><small>{result.provider} · {result.test_name}</small></span><em className={`genetic-${String(result.result).toLowerCase().replaceAll(" ", "-")}`}>{result.result}</em></div>)}</div> : <div className="breeding-empty"><b>No structured genetic results</b><p>Add laboratory results from the Dogs workspace before evaluating a planned pairing.</p></div>}<p className="info-disclaimer"><ShieldAlert size={15}/>{GENETICS_DISCLAIMER}</p></article>
    </section>
  </main>;
}
