import type { OracleCard } from "@commander-agent/card-data";
import type { CardRole, EligibilityCriteria, EligibilityResult, RoleEvidence } from "./types.js";

const RULES: Array<{ role: CardRole; pattern: RegExp; reason: string }> = [
  { role: "land", pattern: /\bland\b/i, reason: "type line identifies a land" },
  { role: "mana", pattern: /add (?:one mana|\{[wubrgc]\})|search your library for (?:a|up to one) land/i, reason: "rules text produces or finds mana" },
  { role: "card_selection", pattern: /\bscry\b|look at the top|reveal the top|put (?:it|them) on (?:the )?top/i, reason: "rules text inspects or arranges library cards" },
  { role: "card_advantage", pattern: /draw (?:a|one|two|three|x) cards?|exile the top card.*may play/i, reason: "rules text provides additional cards" },
  { role: "tutor", pattern: /search your library for (?:a|an|up to one) (?!basic land|land)/i, reason: "rules text searches for a nonland card" },
  { role: "interaction", pattern: /counter target|destroy target|exile target|return target .* to (?:its|their) owner's hand/i, reason: "rules text can answer an opposing object" },
  { role: "protection", pattern: /hexproof|indestructible|protection from|phase out/i, reason: "rules text protects a permanent or player" },
  { role: "recursion", pattern: /return target .* card from your graveyard|cast .* from your graveyard/i, reason: "rules text recovers graveyard resources" },
  { role: "enabler", pattern: /costs? .* less|you may look at the top card|play with the top card/i, reason: "rules text enables another game plan" },
  { role: "payoff", pattern: /whenever .* enters|combat damage to a player|you win the game/i, reason: "rules text rewards successful setup" },
];

export function classifyCardRoles(card: OracleCard, datasetId: string): RoleEvidence[] {
  const text = `${card.typeLine}\n${card.oracleText ?? ""}`;
  return RULES.filter((rule) => rule.pattern.test(text)).map((rule) => ({
    role: rule.role,
    confidence: 1,
    provenance: { kind: "oracle_rule", sourceId: `role-rule/${rule.role}/1`, datasetId },
    reason: rule.reason,
  }));
}

export function classifyCreatureEligibility(card: OracleCard, criteria: EligibilityCriteria): EligibilityResult {
  const creatureSection = card.typeLine.match(/Creature\s+—\s+(.+)$/i)?.[1] ?? "";
  const subtypeWords = creatureSection.toLowerCase().split(/\s+/);
  const matchedCreatureTypes = criteria.creatureTypes.filter((type) => subtypeWords.includes(type.toLowerCase()));
  const eligible = card.typeLine.includes("Creature") && card.manaValue >= criteria.minimumManaValue && matchedCreatureTypes.length > 0;
  return {
    eligible,
    matchedCreatureTypes,
    reason: eligible
      ? `mana value ${card.manaValue} meets ${criteria.minimumManaValue} and type matches ${matchedCreatureTypes.join(", ")}`
      : `requires a creature with mana value at least ${criteria.minimumManaValue} and one of: ${criteria.creatureTypes.join(", ")}`,
  };
}
