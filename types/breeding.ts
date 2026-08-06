export type Id = number;

export type PedigreeDog = {
  id: Id;
  name: string;
  registered_name?: string | null;
  call_name?: string | null;
  sex?: string | null;
  breed?: string | null;
  color?: string | null;
  sire_id?: Id | null;
  dam_id?: Id | null;
};

export type GeneticResult = {
  id?: Id;
  dog_id: Id;
  provider: string;
  test_name: string;
  gene_or_condition: string;
  result: "Clear" | "Carrier" | "At Risk" | "Affected" | "Indeterminate" | "Pending";
  inheritance_mode?: string | null;
  result_date?: string | null;
  laboratory_reference?: string | null;
  document_id?: Id | null;
  notes?: string | null;
};

export type PedigreeNode = {
  slot: string;
  generation: number;
  dog: PedigreeDog | null;
  sire: PedigreeNode | null;
  dam: PedigreeNode | null;
};

export type CommonAncestor = {
  dog: PedigreeDog;
  sirePaths: Id[][];
  damPaths: Id[][];
  independentPathPairs: number;
  contribution: number;
  ancestorCoi: number;
};

export type CoiResult = {
  coefficient: number;
  percentage: number;
  generations: number;
  commonAncestors: CommonAncestor[];
  pedigreeCompleteness: number;
};

export type GeneticCompatibility = {
  condition: string;
  sireResult: GeneticResult["result"] | "Not recorded";
  damResult: GeneticResult["result"] | "Not recorded";
  level: "clear" | "review" | "warning";
  message: string;
};

export type BreedingDataSet = {
  dogs: Array<PedigreeDog & Record<string, unknown>>;
  dog_genetic_results: Array<GeneticResult & Record<string, unknown>>;
  heat_cycles: Array<Record<string, unknown>>;
  progesterone_tests: Array<Record<string, unknown>>;
  breeding_records: Array<Record<string, unknown>>;
  breeding_attempts: Array<Record<string, unknown>>;
  pregnancies: Array<Record<string, unknown>>;
  whelping_sessions: Array<Record<string, unknown>>;
  puppy_weight_logs: Array<Record<string, unknown>>;
  puppy_care_records: Array<Record<string, unknown>>;
  kennel_waitlist_entries: Array<Record<string, unknown>>;
  kennel_waitlist_history: Array<Record<string, unknown>>;
};

export const emptyBreedingData: BreedingDataSet = {
  dogs: [],
  dog_genetic_results: [],
  heat_cycles: [],
  progesterone_tests: [],
  breeding_records: [],
  breeding_attempts: [],
  pregnancies: [],
  whelping_sessions: [],
  puppy_weight_logs: [],
  puppy_care_records: [],
  kennel_waitlist_entries: [],
  kennel_waitlist_history: [],
};
