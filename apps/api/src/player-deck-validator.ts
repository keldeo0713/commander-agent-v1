export const PLAYER_DECK_VALIDATION_VERSION = "player-deck-validation/1" as const;

export interface PlayerCardChoice { oracleId: string; name: string; roleId: string }
export interface PlayerLandChoice { oracleId: string; name: string; category: "fixing" | "utility" }
export interface PlayerDeckValidationInput {
  commander: { oracleId: string; name: string };
  roles: Array<{ roleId: string; requiredQuantity: number }>;
  cards: PlayerCardChoice[];
  manaBase: { totalLands: number; entries: Array<{ quantity: number; category: "basic" | "fixing" | "utility"; cardName?: string }> };
  lands: PlayerLandChoice[];
}
export interface PlayerDeckViolation { code: "deck_size" | "role_coverage" | "land_coverage" | "singleton"; message: string; roleId?: string }
export interface PlayerDeckValidation { schemaVersion: typeof PLAYER_DECK_VALIDATION_VERSION; cardQuantity: number; namedQuantity: number; complete: boolean; violations: PlayerDeckViolation[] }

export function validatePlayerDeck(input: PlayerDeckValidationInput): PlayerDeckValidation {
  const violations: PlayerDeckViolation[] = [];
  const basicQuantity = input.manaBase.entries.filter(({ category }) => category === "basic").reduce((sum, { quantity }) => sum + quantity, 0);
  const cardQuantity = 1 + input.cards.length + basicQuantity + input.lands.length;
  const namedQuantity = cardQuantity;
  for (const role of input.roles) {
    const selected = input.cards.filter(({ roleId }) => roleId === role.roleId).length;
    if (selected !== role.requiredQuantity) violations.push({ code: "role_coverage", roleId: role.roleId, message: `${role.roleId} requires ${role.requiredQuantity}; selected ${selected}` });
  }
  for (const category of ["fixing", "utility"] as const) {
    const required = input.manaBase.entries.find((entry) => entry.category === category)?.quantity ?? 0;
    const selected = input.lands.filter((land) => land.category === category).length;
    if (selected !== required) violations.push({ code: "land_coverage", roleId: category, message: `${category} lands require ${required}; selected ${selected}` });
  }
  const identities = [input.commander.oracleId, ...input.cards.map(({ oracleId }) => oracleId), ...input.lands.map(({ oracleId }) => oracleId)];
  if (new Set(identities).size !== identities.length) violations.push({ code: "singleton", message: "named nonbasic cards must have unique Oracle identities" });
  if (cardQuantity !== 100 || input.manaBase.totalLands !== basicQuantity + input.lands.length) violations.push({ code: "deck_size", message: `deck requires 100 cards and ${input.manaBase.totalLands} lands; currently ${cardQuantity} cards` });
  return { schemaVersion: PLAYER_DECK_VALIDATION_VERSION, cardQuantity, namedQuantity, complete: violations.length === 0, violations };
}
