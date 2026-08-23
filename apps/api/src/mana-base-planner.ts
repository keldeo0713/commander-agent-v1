import type { OptimizedTemplate } from "./template-orchestrator.ts";

export const MANA_BASE_PLAN_VERSION = "mana-base-plan/1" as const;
export interface ManaBasePlanEntry { id: string; quantity: number; category: "basic" | "fixing" | "utility"; cardName?: string; selectionRule: string }
export interface ManaBasePlan { schemaVersion: typeof MANA_BASE_PLAN_VERSION; commanderOracleId: string; colorIdentity: string[]; colorDemand: Record<string, number>; analyzedCardCount: number; totalLands: number; namedCardQuantity: number; entries: ManaBasePlanEntry[]; assumptions: string[] }

const BASIC_NAMES: Record<string, string> = { W: "Plains", U: "Island", B: "Swamp", R: "Mountain", G: "Forest" };
const IDENTITY_ORDER = ["W", "U", "B", "R", "G"];
const NONBASIC_SLOTS: Record<number, { fixing: number; utility: number }> = {
  0: { fixing: 0, utility: 10 }, 1: { fixing: 0, utility: 5 }, 2: { fixing: 10, utility: 4 }, 3: { fixing: 14, utility: 4 }, 4: { fixing: 18, utility: 3 }, 5: { fixing: 22, utility: 3 },
};

export function planManaBase(template: OptimizedTemplate, selectedCards: Array<{ manaCost: string }> = []): ManaBasePlan {
  const totalLands = template.slots.find(({ roleId }) => roleId === "mana-base")?.quantity;
  if (!totalLands || totalLands < 1) throw new Error("template requires a positive mana-base role");
  const colorIdentity = [...new Set(template.commander.colorIdentity)].filter((color) => BASIC_NAMES[color]).sort((left, right) => IDENTITY_ORDER.indexOf(left) - IDENTITY_ORDER.indexOf(right));
  const slots = NONBASIC_SLOTS[colorIdentity.length];
  if (!slots) throw new Error("unsupported commander color identity");
  const basicQuantity = totalLands - slots.fixing - slots.utility;
  if (basicQuantity < 1) throw new Error("mana-base allocation leaves no basic-land foundation");
  const colorDemand = analyzeColorDemand(selectedCards, colorIdentity);
  const basics = colorIdentity.length ? distributeBasics(colorIdentity, basicQuantity, colorDemand) : [{ color: "C", quantity: basicQuantity, name: "Wastes" }];
  const entries: ManaBasePlanEntry[] = basics.map(({ color, quantity, name }) => ({ id: `basic-${color.toLowerCase()}`, quantity, category: "basic", cardName: name, selectionRule: `basic source for ${color === "C" ? "colorless" : color} costs` }));
  if (slots.fixing) entries.push({ id: "color-fixing", quantity: slots.fixing, category: "fixing", selectionRule: `choose legal lands producing across ${colorIdentity.join("")} identity; prefer untapped sources appropriate to bracket and budget` });
  if (slots.utility) entries.push({ id: "utility-lands", quantity: slots.utility, category: "utility", selectionRule: "choose legal utility lands only when their benefit justifies reduced colored-source reliability" });
  const total = entries.reduce((sum, entry) => sum + entry.quantity, 0);
  if (total !== totalLands) throw new Error(`mana-base plan requires ${totalLands} lands; received ${total}`);
  return { schemaVersion: MANA_BASE_PLAN_VERSION, commanderOracleId: template.commander.oracleId, colorIdentity, colorDemand, analyzedCardCount: selectedCards.length, totalLands, namedCardQuantity: basics.reduce((sum, entry) => sum + entry.quantity, 0), entries, assumptions: ["37-land template quantity remains authoritative", selectedCards.length ? `basic distribution reflects colored symbols on ${selectedCards.length} included cards` : "no included-card mana costs are available; basics are distributed evenly", "fixing and utility entries are functional slots, not silently selected cards"] };
}

export function analyzeColorDemand(cards: Array<{ manaCost: string }>, colors: string[]): Record<string, number> {
  const demand = Object.fromEntries(colors.map((color) => [color, 0])) as Record<string, number>;
  for (const { manaCost } of cards) for (const symbol of manaCost.match(/\{[^}]+\}/g) ?? []) for (const color of colors) if (symbol.includes(color)) demand[color] = (demand[color] ?? 0) + 1;
  return demand;
}

function distributeBasics(colors: string[], quantity: number, demand: Record<string, number>): Array<{ color: string; quantity: number; name: string }> {
  const totalDemand = colors.reduce((sum, color) => sum + (demand[color] ?? 0), 0);
  if (totalDemand === 0) {
    const base = Math.floor(quantity / colors.length);
    const remainder = quantity % colors.length;
    return colors.map((color, index) => ({ color, quantity: base + (index < remainder ? 1 : 0), name: BASIC_NAMES[color] ?? "Wastes" }));
  }
  const distributable = quantity - colors.length;
  const exact = colors.map((color) => ({ color, exact: distributable * (demand[color] ?? 0) / totalDemand }));
  const allocated = exact.map(({ color, exact: value }) => ({ color, quantity: 1 + Math.floor(value), fraction: value - Math.floor(value) }));
  let remaining = quantity - allocated.reduce((sum, item) => sum + item.quantity, 0);
  for (const item of [...allocated].sort((left, right) => right.fraction - left.fraction || IDENTITY_ORDER.indexOf(left.color) - IDENTITY_ORDER.indexOf(right.color))) if (remaining-- > 0) item.quantity += 1;
  return allocated.map(({ color, quantity: amount }) => ({ color, quantity: amount, name: BASIC_NAMES[color] ?? "Wastes" }));
}
