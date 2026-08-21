export const SIMULATOR_SCHEMA_VERSION = "simulator/1" as const;

export type SimCardKind = "land" | "commander" | "eligible_payoff" | "topdeck_setup" | "protection" | "other";
export interface SimCard { id: string; kind: SimCardKind; manaCost: number }
export interface RemovalProfile {
  profileId: string;
  enabled: boolean;
  earliestTurn: number;
  perTurnProbability: number;
}
export interface SimulationPolicy {
  policyId: string;
  targetTurn: number;
  openingHandSize: number;
  maximumMulligans: number;
  minimumOpeningLands: number;
  maximumOpeningLands: number;
  commanderManaCost: number;
  activationManaCost: number;
  onPlay: boolean;
}
export interface SimulationInput {
  deckId: string;
  library: SimCard[];
  commander: SimCard;
  sampleCount: number;
  seeds: number[];
  engineVersion: string;
  datasetId: string;
  rulesSnapshotId: string;
  policy: SimulationPolicy;
  removal: RemovalProfile;
}
export type FailureReason = "commander_not_cast" | "commander_removed" | "activation_mana_missing" | "eligible_payoff_missing";
export interface TrialResult {
  seed: number;
  success: boolean;
  successTurn: number | null;
  mulligans: number;
  commanderCasts: number;
  commanderRemovals: number;
  failureReason: FailureReason | null;
}
export interface SimulationReport {
  schemaVersion: typeof SIMULATOR_SCHEMA_VERSION;
  inputIdentity: Omit<SimulationInput, "library" | "commander" | "seeds">;
  seeds: number[];
  successes: number;
  probability: number;
  wilson95: { low: number; high: number };
  successTurnHistogram: Record<string, number>;
  failureReasons: Record<FailureReason, number>;
  trials: TrialResult[];
}
