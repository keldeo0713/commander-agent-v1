export const COMMANDER_RULES_SCHEMA_VERSION = "commander-rules/1" as const;

export type Color = "W" | "U" | "B" | "R" | "G";

export interface CommanderCardView {
  oracleId: string;
  name: string;
  typeLine: string;
  oracleText: string | null;
  colorIdentity: Color[];
  keywords: string[];
  commanderLegality: "legal" | "banned" | "not_legal" | "restricted";
  copyLimit: number | "unlimited" | null;
}

export interface DeckEntry {
  oracleId: string;
  quantity: number;
}

export interface CommanderDeck {
  commanders: string[];
  companionOracleId?: string;
  cards: DeckEntry[];
}

export interface CommanderFormatSnapshot {
  schemaVersion: typeof COMMANDER_RULES_SCHEMA_VERSION;
  snapshotId: string;
  effectiveDate: string;
  deckSize: number;
  sourceUrls: string[];
  bannedNames: string[];
  companionBannedNames: string[];
  supportedCommanderPairs: Array<
    "partner" | "friends_forever" | "choose_background" | "doctors_companion"
  >;
}

export type LegalityViolationCode =
  | "invalid_quantity"
  | "unknown_card"
  | "deck_size"
  | "commander_count"
  | "commander_missing_from_deck"
  | "commander_not_eligible"
  | "unsupported_commander_pair"
  | "color_identity"
  | "singleton"
  | "banned_card"
  | "format_illegal_card"
  | "companion_banned";

export interface LegalityViolation {
  code: LegalityViolationCode;
  message: string;
  oracleIds: string[];
  details: Record<string, string | number | string[]>;
}

export interface LegalityResult {
  schemaVersion: "commander-legality-result/1";
  legal: boolean;
  rulesSnapshotId: string;
  commanderColorIdentity: Color[];
  violations: LegalityViolation[];
}
