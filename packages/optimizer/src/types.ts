export const OPTIMIZER_SCHEMA_VERSION = "optimizer/1" as const;

export interface DeckMetrics {
  primaryProbability: number;
  removalProbability: number;
  continuationScore: number;
  interactionCount: number;
  themeScore: number;
}
export interface EvaluatedDeck { deckId: string; oracleIds: string[]; legal: boolean; metrics: DeckMetrics; seeds: number[]; computeSamples: number }
export interface EvaluationPort { evaluate(deckId: string, oracleIds: readonly string[], seeds: readonly number[], samples: number): Promise<EvaluatedDeck> }
export interface Swap { removeOracleId: string; addOracleId: string }
export interface OptimizationRequest {
  baseline: EvaluatedDeck;
  swaps: Swap[];
  candidateOracleIds: Record<string, string[]>;
  searchSeeds: number[];
  holdoutSeeds: number[];
  searchSamples: number;
  holdoutSamples: number;
  minimumPrimaryImprovement: number;
  minimumContinuationScore: number;
  minimumInteractionCount: number;
}
export interface OptimizationResult {
  schemaVersion: typeof OPTIMIZER_SCHEMA_VERSION;
  baseline: EvaluatedDeck;
  evaluated: EvaluatedDeck[];
  pareto: EvaluatedDeck[];
  finalists: EvaluatedDeck[];
  searchHistory: Array<{ deckId: string; swap: Swap; acceptedForHoldout: boolean }>;
  computeSamples: number;
}
