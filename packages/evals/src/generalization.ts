export const GENERALIZATION_SCHEMA_VERSION = "generalization-suite/1" as const;

export type Archetype = "topdeck_cheat" | "graveyard_recursion" | "spellslinger" | "go_wide_tokens" | "artifact_combo" | "voltron";
export type Primitive =
  | "draw" | "scry" | "topdeck_reveal" | "creature_cheat" | "graveyard_move" | "graveyard_cast"
  | "spell_cast" | "token_create" | "artifact_activate" | "counter_change" | "combat_damage" | "commander_damage";
export interface GoalDefinition {
  goalId: string;
  archetype: Archetype;
  requiredPrimitives: Primitive[];
  milestone: string;
}
export interface CommanderRegression {
  commanderName: string;
  commanderOracleId: string;
  archetype: Archetype;
  goalId: string;
}
export interface CoverageResult {
  supported: boolean;
  supportedPrimitives: Primitive[];
  unsupportedPrimitives: Primitive[];
  behavior: "execute" | "report_unsupported";
}

export const GOALS: GoalDefinition[] = [
  { goalId: "topdeck-cheat-by-turn/1", archetype: "topdeck_cheat", requiredPrimitives: ["draw", "scry", "topdeck_reveal", "creature_cheat"], milestone: "Put an eligible creature onto the battlefield from the library" },
  { goalId: "reanimate-value-by-turn/1", archetype: "graveyard_recursion", requiredPrimitives: ["draw", "graveyard_move", "graveyard_cast"], milestone: "Return or cast a value permanent from the graveyard" },
  { goalId: "spells-cast-by-turn/1", archetype: "spellslinger", requiredPrimitives: ["draw", "spell_cast"], milestone: "Cast a requested count of instants or sorceries" },
  { goalId: "token-board-by-turn/1", archetype: "go_wide_tokens", requiredPrimitives: ["draw", "token_create"], milestone: "Control a requested token count" },
  { goalId: "artifact-engine-by-turn/1", archetype: "artifact_combo", requiredPrimitives: ["draw", "artifact_activate", "counter_change"], milestone: "Activate a declared artifact engine" },
  { goalId: "commander-damage-by-turn/1", archetype: "voltron", requiredPrimitives: ["draw", "combat_damage", "commander_damage"], milestone: "Deal a requested amount of commander damage" },
];

export const REGRESSIONS: CommanderRegression[] = [
  { commanderName: "Kenessos, Priest of Thassa", commanderOracleId: "45b3a028-5705-4dc8-bfab-04bb5e01eea6", archetype: "topdeck_cheat", goalId: "topdeck-cheat-by-turn/1" },
  { commanderName: "Muldrotha, the Gravetide", commanderOracleId: "muldrotha-fixture", archetype: "graveyard_recursion", goalId: "reanimate-value-by-turn/1" },
  { commanderName: "Veyran, Voice of Duality", commanderOracleId: "veyran-fixture", archetype: "spellslinger", goalId: "spells-cast-by-turn/1" },
  { commanderName: "Rhys the Redeemed", commanderOracleId: "rhys-fixture", archetype: "go_wide_tokens", goalId: "token-board-by-turn/1" },
  { commanderName: "Urza, Lord High Artificer", commanderOracleId: "urza-fixture", archetype: "artifact_combo", goalId: "artifact-engine-by-turn/1" },
  { commanderName: "Wyleth, Soul of Steel", commanderOracleId: "wyleth-fixture", archetype: "voltron", goalId: "commander-damage-by-turn/1" },
];

export function assessCoverage(goal: GoalDefinition, implemented: ReadonlySet<Primitive>): CoverageResult {
  const supportedPrimitives = goal.requiredPrimitives.filter((primitive) => implemented.has(primitive));
  const unsupportedPrimitives = goal.requiredPrimitives.filter((primitive) => !implemented.has(primitive));
  return { supported: unsupportedPrimitives.length === 0, supportedPrimitives, unsupportedPrimitives, behavior: unsupportedPrimitives.length === 0 ? "execute" : "report_unsupported" };
}
