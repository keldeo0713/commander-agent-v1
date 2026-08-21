export const DECK_SPEC_SCHEMA_VERSION = "deck-spec/1" as const;

export interface GoalSpec {
  definitionId: string;
  weight: number;
  parameters: Record<string, string | number | boolean | string[]>;
}

export interface DeckSpecInference {
  path: string;
  reason: string;
}

export interface DeckSpec {
  schemaVersion: typeof DECK_SPEC_SCHEMA_VERSION;
  commander: { oracleId: string; name: string };
  format: {
    name: "commander";
    snapshotId: string;
    gameChangerPolicy:
      | { mode: "max-count"; value: number }
      | { mode: "unlimited" };
  };
  hardConstraints: {
    budgetUsd: number | null;
    lockedOracleIds: string[];
    excludedOracleIds: string[];
    ownedOnly: boolean;
  };
  guardrails: {
    minLands: number;
    minInteraction: number;
    minThemeScore: number;
  };
  objectives: GoalSpec[];
  continuation: {
    requirements: string[];
    minimumDeclaredWinPaths: number;
    winPaths: string[];
  };
  preferences: {
    themes: string[];
    mechanics: string[];
    avoid: string[];
  };
  scenario: {
    model: string;
    onPlay: boolean;
    mulliganPolicyId: string;
    diagnosticGoldfishBaseline: boolean;
    opponentInteraction: {
      commanderRemoval: { enabled: boolean; profile: string };
    };
  };
  inferences: DeckSpecInference[];
}

export type DeckSpecIssueCode =
  | "schema_version"
  | "commander_missing"
  | "format_snapshot_missing"
  | "invalid_constraint"
  | "constraint_conflict"
  | "unsupported_goal"
  | "invalid_goal"
  | "continuation_missing"
  | "scenario_missing"
  | "inference_missing";

export interface DeckSpecIssue {
  code: DeckSpecIssueCode;
  path: string;
  message: string;
}

export type DeckSpecCompileResult =
  | { status: "compiled"; spec: DeckSpec; issues: [] }
  | { status: "clarification_required"; questions: string[]; issues: DeckSpecIssue[] }
  | { status: "unsupported"; issues: DeckSpecIssue[] };
