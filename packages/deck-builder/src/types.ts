export const DECK_BUILDER_SCHEMA_VERSION = "deck-builder/1" as const;

export interface BuildCandidate {
  oracleId: string;
  roles: string[];
  score: number;
  legal: boolean;
  gameChanger: boolean;
}
export interface BuildConstraints {
  deckSize: number;
  commanderOracleIds: string[];
  lockedOracleIds: string[];
  excludedOracleIds: string[];
  minimumByRole: Record<string, number>;
  maximumGameChangers: number;
  minimumWinPaths: number;
  declaredWinPathIds: string[];
}
export interface BuiltDeck {
  schemaVersion: typeof DECK_BUILDER_SCHEMA_VERSION;
  commanderOracleIds: string[];
  oracleIds: string[];
  roleCounts: Record<string, number>;
  gameChangerCount: number;
  declaredWinPathIds: string[];
}
export type BuildFailure =
  | { code: "locked_card_unavailable"; oracleIds: string[] }
  | { code: "role_minimum_unreachable"; role: string; required: number; available: number }
  | { code: "game_changer_limit"; count: number; maximum: number }
  | { code: "continuation_missing"; required: number; available: number }
  | { code: "deck_size_unreachable"; required: number; available: number };
export type BuildResult = { status: "built"; deck: BuiltDeck } | { status: "failed"; failures: BuildFailure[] };
