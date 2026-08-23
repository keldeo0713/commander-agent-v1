import type { CommanderBracket, FunctionalSlot, MechanicCandidate } from "./template-orchestrator.ts";

export const TEMPLATE_ALLOCATION_VERSION = "template-allocation/1" as const;

type AdjustableRole = "ramp" | "primary-engine" | "payoffs-finishers" | "card-advantage" | "interaction" | "protection-rebuild";
type Quantities = Record<AdjustableRole, number>;

const BRACKET_BASELINES: Record<CommanderBracket, Quantities> = {
  1: { ramp: 10, "primary-engine": 14, "payoffs-finishers": 10, "card-advantage": 11, interaction: 8, "protection-rebuild": 9 },
  2: { ramp: 10, "primary-engine": 15, "payoffs-finishers": 11, "card-advantage": 10, interaction: 9, "protection-rebuild": 7 },
  3: { ramp: 10, "primary-engine": 15, "payoffs-finishers": 12, "card-advantage": 9, interaction: 10, "protection-rebuild": 6 },
  4: { ramp: 11, "primary-engine": 16, "payoffs-finishers": 12, "card-advantage": 8, interaction: 11, "protection-rebuild": 4 },
  5: { ramp: 12, "primary-engine": 14, "payoffs-finishers": 13, "card-advantage": 7, interaction: 12, "protection-rebuild": 4 },
};

const MECHANIC_DELTAS: Record<string, Partial<Quantities>> = {
  "top-deck": { "primary-engine": 1, "card-advantage": 1, "payoffs-finishers": -1, "protection-rebuild": -1 },
  "big-creatures": { ramp: 1, "payoffs-finishers": 2, "primary-engine": -2, interaction: -1 },
  graveyard: { "primary-engine": 2, "protection-rebuild": 1, "payoffs-finishers": -1, interaction: -1, "card-advantage": -1 },
  tokens: { "primary-engine": 2, "payoffs-finishers": 1, ramp: -1, "card-advantage": -1, "protection-rebuild": -1 },
  artifacts: { ramp: 1, "primary-engine": 2, "card-advantage": -1, "payoffs-finishers": -1, "protection-rebuild": -1 },
  spells: { interaction: 2, "card-advantage": 1, "primary-engine": 1, "payoffs-finishers": -2, ramp: -1, "protection-rebuild": -1 },
  lands: { "primary-engine": 2, "card-advantage": 1, ramp: -1, interaction: -1, "protection-rebuild": -1 },
  combat: { "payoffs-finishers": 2, "protection-rebuild": 2, "primary-engine": -1, "card-advantage": -1, interaction: -2 },
};

const BOUNDS: Record<AdjustableRole, { min: number; max: number }> = {
  ramp: { min: 8, max: 14 },
  "primary-engine": { min: 11, max: 22 },
  "payoffs-finishers": { min: 8, max: 18 },
  "card-advantage": { min: 7, max: 14 },
  interaction: { min: 7, max: 15 },
  "protection-rebuild": { min: 4, max: 11 },
};

const ROLE_ORDER = Object.keys(BOUNDS) as AdjustableRole[];

export function allocateTemplate(bracket: CommanderBracket, mechanics: MechanicCandidate[]): FunctionalSlot[] {
  const quantities = structuredClone(BRACKET_BASELINES[bracket]);
  const reasons = new Map<AdjustableRole, string[]>(ROLE_ORDER.map((role) => [role, [`bracket ${bracket} baseline ${quantities[role]}`]]));
  for (const mechanic of [...new Map(mechanics.map((item) => [item.id, item])).values()].sort((left, right) => left.id.localeCompare(right.id))) {
    for (const [role, delta] of Object.entries(MECHANIC_DELTAS[mechanic.id] ?? {}) as Array<[AdjustableRole, number]>) {
      quantities[role] += delta;
      reasons.get(role)?.push(`${delta > 0 ? "+" : ""}${delta} ${mechanic.name}`);
    }
  }
  clampAndBalance(quantities, reasons);
  return [
    { quantity: 1, roleId: "commander", objective: "Define the engine", selectionRule: "Resolved commander" },
    { quantity: 37, roleId: "mana-base", objective: "Cast spells on curve", selectionRule: "Conservative 37-land foundation until card-level curve analysis" },
    ...ROLE_ORDER.map((role) => ({ quantity: quantities[role], roleId: role, objective: objective(role), selectionRule: reasons.get(role)?.join("; ") ?? `bracket ${bracket} allocation` })),
  ];
}

function clampAndBalance(quantities: Quantities, reasons: Map<AdjustableRole, string[]>): void {
  for (const role of ROLE_ORDER) {
    const bounded = Math.max(BOUNDS[role].min, Math.min(BOUNDS[role].max, quantities[role]));
    if (bounded !== quantities[role]) reasons.get(role)?.push(`bounded to ${bounded}`);
    quantities[role] = bounded;
  }
  let difference = 62 - ROLE_ORDER.reduce((sum, role) => sum + quantities[role], 0);
  const priority: AdjustableRole[] = ["primary-engine", "card-advantage", "payoffs-finishers", "interaction", "protection-rebuild", "ramp"];
  while (difference !== 0) {
    const direction = Math.sign(difference);
    const role = priority.find((candidate) => direction > 0 ? quantities[candidate] < BOUNDS[candidate].max : quantities[candidate] > BOUNDS[candidate].min);
    if (!role) throw new Error("template allocation cannot satisfy exact size within role bounds");
    quantities[role] += direction;
    reasons.get(role)?.push(`${direction > 0 ? "+1" : "-1"} exact-100 balance`);
    difference -= direction;
  }
}

function objective(role: AdjustableRole): string {
  return {
    ramp: "Develop ahead of curve",
    "primary-engine": "Execute chosen mechanics",
    "payoffs-finishers": "Convert engine into wins",
    "card-advantage": "Maintain resources",
    interaction: "Contest opposing plans",
    "protection-rebuild": "Recover from disruption",
  }[role];
}
