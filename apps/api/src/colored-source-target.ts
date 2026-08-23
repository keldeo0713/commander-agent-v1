export const COLORED_SOURCE_TARGET_VERSION = "colored-source-target/1" as const;
export interface ManaRequirementCard { name: string; manaCost: string; manaValue: number }
export interface ColoredSourceTarget { color: string; targetTurn: number; coloredPips: number; requiredSources: number; availableSources: number; modeledProbability: number; status: "met" | "short" }
export interface ColoredSourceTargetReport { schemaVersion: typeof COLORED_SOURCE_TARGET_VERSION; deckSize: 99; targetProbability: number; drawPolicy: "multiplayer-draw-on-turn-one"; targets: ColoredSourceTarget[]; assumptions: string[] }

export function calculateColoredSourceTargets(cards: ManaRequirementCard[], colorIdentity: string[], availableSources: Record<string, number>, targetProbability = 0.85): ColoredSourceTargetReport {
  if (!(targetProbability > 0 && targetProbability < 1)) throw new Error("target probability must be between zero and one");
  const targets = colorIdentity.flatMap((color): ColoredSourceTarget[] => {
    const requirements = cards.map((card) => ({ card, pips: coloredPips(card.manaCost, color), turn: Math.max(1, Math.min(7, Math.ceil(card.manaValue))) })).filter(({ pips }) => pips > 0);
    if (!requirements.length) return [];
    let selected = { targetTurn: 7, coloredPips: 1, requiredSources: 0, modeledProbability: 1 };
    for (const { pips, turn } of requirements) {
      const draws = Math.min(99, 7 + turn);
      let requiredSources = 99;
      let modeledProbability = probabilityAtLeast(99, requiredSources, draws, pips);
      for (let sources = 0; sources <= 99; sources++) {
        const probability = probabilityAtLeast(99, sources, draws, pips);
        if (probability >= targetProbability) { requiredSources = sources; modeledProbability = probability; break; }
      }
      if (requiredSources > selected.requiredSources || requiredSources === selected.requiredSources && turn < selected.targetTurn) selected = { targetTurn: turn, coloredPips: pips, requiredSources, modeledProbability };
    }
    const available = availableSources[color] ?? 0;
    return [{ color, ...selected, availableSources: available, status: available >= selected.requiredSources ? "met" : "short" }];
  });
  return { schemaVersion: COLORED_SOURCE_TARGET_VERSION, deckSize: 99, targetProbability, drawPolicy: "multiplayer-draw-on-turn-one", targets, assumptions: ["99-card library model", "opening seven plus one draw each turn including turn one", "no mulligans, ramp, filtering, treasures, or tapped-source timing", "mana value is used as the desired cast turn, capped at turn seven"] };
}

export function probabilityAtLeast(deckSize: number, successes: number, draws: number, needed: number): number {
  if (needed <= 0) return 1;
  if (successes < needed || draws < needed) return 0;
  let probability = 0;
  for (let hits = needed; hits <= Math.min(successes, draws); hits++) probability += combination(successes, hits) * combination(deckSize - successes, draws - hits) / combination(deckSize, draws);
  return Math.min(1, probability);
}
function coloredPips(manaCost: string, color: string): number { return (manaCost.match(/\{[^}]+\}/g) ?? []).filter((symbol) => symbol.includes(color)).length; }
function combination(n: number, k: number): number { if (k < 0 || k > n) return 0; const count = Math.min(k, n - k); let result = 1; for (let index = 1; index <= count; index++) result = result * (n - count + index) / index; return result; }
