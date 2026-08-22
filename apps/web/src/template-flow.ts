export const TEMPLATE_FLOW_VERSION = "template-flow/1" as const;

export type CommanderBracket = 1 | 2 | 3 | 4 | 5;
export interface MechanicOption { id: string; name: string; components: string[]; source: "curated" | "mapped-custom" }
export interface TemplateSlot { quantity: number; function: string; objective: string; selectionRule: string }
export interface TemplatePlan { schemaVersion: typeof TEMPLATE_FLOW_VERSION; commanderName: string; bracket: CommanderBracket; mechanics: MechanicOption[]; slots: TemplateSlot[]; totalCards: 100 }

const CUSTOM_COMPONENT_RULES: Array<{ pattern: RegExp; components: string[] }> = [
  { pattern: /grave|reanimat|recursion/i, components: ["graveyard-setup", "recursion", "payoff"] },
  { pattern: /token|go wide|creature swarm/i, components: ["token-production", "board-scaling", "finisher"] },
  { pattern: /top.?deck|scry|surveil/i, components: ["card-selection", "top-deck-setup", "payoff-density"] },
  { pattern: /artifact|treasure/i, components: ["artifact-density", "mana-acceleration", "artifact-payoff"] },
  { pattern: /spell|instant|sorcery|storm/i, components: ["spell-density", "cost-reduction", "spell-payoff"] },
  { pattern: /land|landfall/i, components: ["land-development", "land-access", "land-payoff"] },
  { pattern: /combat|attack|voltron|equipment|aura/i, components: ["threat-development", "combat-enabler", "protection"] },
];

export function mapCustomMechanic(input: string): MechanicOption | null {
  const name = input.trim();
  if (!name) return null;
  const matches = CUSTOM_COMPONENT_RULES.filter((rule) => rule.pattern.test(name));
  if (matches.length === 0) return null;
  return { id: `custom:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`, name, components: [...new Set(matches.flatMap((match) => match.components))], source: "mapped-custom" };
}

export function createTemplatePlan(input: { commanderName: string; bracket: CommanderBracket; mechanics: MechanicOption[]; slots: TemplateSlot[] }): TemplatePlan {
  const commanderName = input.commanderName.trim();
  if (!commanderName) throw new Error("commander is required");
  if (input.mechanics.length === 0) throw new Error("at least one mechanic is required");
  const total = input.slots.reduce((sum, slot) => sum + slot.quantity, 0);
  if (total !== 100) throw new Error(`template requires exactly 100 cards; received ${total}`);
  return { schemaVersion: TEMPLATE_FLOW_VERSION, commanderName, bracket: input.bracket, mechanics: structuredClone(input.mechanics), slots: structuredClone(input.slots), totalCards: 100 };
}
