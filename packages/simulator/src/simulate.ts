import type { FailureReason, SimCard, SimulationInput, SimulationReport, TrialResult } from "./types.js";

class Prng {
  private state: number;
  constructor(seed: number) { this.state = seed >>> 0 || 0x6d2b79f5; }
  next(): number {
    let x = this.state;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.state = x >>> 0;
    return this.state / 0x1_0000_0000;
  }
}

export function simulate(input: SimulationInput): SimulationReport {
  validateInput(input);
  const seeds = Array.from({ length: input.sampleCount }, (_, index) => input.seeds[index % input.seeds.length] as number);
  const trials = seeds.map((seed, index) => runTrial(input, (seed + index) >>> 0));
  const successes = trials.filter((trial) => trial.success).length;
  const failureReasons = emptyFailures();
  const successTurnHistogram: Record<string, number> = {};
  for (const trial of trials) {
    if (trial.failureReason) failureReasons[trial.failureReason] += 1;
    if (trial.successTurn !== null) {
      const turn = String(trial.successTurn);
      successTurnHistogram[turn] = (successTurnHistogram[turn] ?? 0) + 1;
    }
  }
  return {
    schemaVersion: "simulator/1",
    inputIdentity: {
      deckId: input.deckId, sampleCount: input.sampleCount, engineVersion: input.engineVersion,
      datasetId: input.datasetId, rulesSnapshotId: input.rulesSnapshotId,
      policy: input.policy, removal: input.removal,
    },
    seeds, successes, probability: successes / input.sampleCount,
    wilson95: wilson(successes, input.sampleCount), successTurnHistogram, failureReasons, trials,
  };
}

function runTrial(input: SimulationInput, seed: number): TrialResult {
  const rng = new Prng(seed);
  let mulligans = 0;
  let library: SimCard[] = [];
  let hand: SimCard[] = [];
  do {
    library = shuffle(input.library, rng);
    hand = library.splice(0, input.policy.openingHandSize);
    const lands = countKind(hand, "land");
    if (lands >= input.policy.minimumOpeningLands && lands <= input.policy.maximumOpeningLands) break;
    mulligans += 1;
  } while (mulligans <= input.policy.maximumMulligans);

  if (mulligans > 0) {
    const bottomCount = Math.min(mulligans, hand.length);
    const bottom = [...hand].sort((a, b) => bottomPriority(a) - bottomPriority(b)).slice(0, bottomCount);
    hand = hand.filter((card) => !bottom.includes(card));
    library.push(...bottom);
  }

  let landsInPlay = 0;
  let commanderInPlay = false;
  let commanderCasts = 0;
  let commanderRemovals = 0;
  let lastFailure: FailureReason = "commander_not_cast";

  for (let turn = 1; turn <= input.policy.targetTurn; turn += 1) {
    if (!(input.policy.onPlay && turn === 1)) {
      const drawn = library.shift();
      if (drawn) hand.push(drawn);
    }
    const landIndex = hand.findIndex((card) => card.kind === "land");
    if (landIndex >= 0) { hand.splice(landIndex, 1); landsInPlay += 1; }

    const tax = commanderCasts * 2;
    if (!commanderInPlay && landsInPlay >= input.policy.commanderManaCost + tax) {
      commanderInPlay = true;
      commanderCasts += 1;
    }
    if (!commanderInPlay) { lastFailure = "commander_not_cast"; continue; }

    if (input.removal.enabled && turn >= input.removal.earliestTurn && rng.next() < input.removal.perTurnProbability) {
      commanderInPlay = false;
      commanderRemovals += 1;
      lastFailure = "commander_removed";
      continue;
    }
    if (landsInPlay < input.policy.activationManaCost) {
      lastFailure = "activation_mana_missing";
      continue;
    }

    if (hand.some((card) => card.kind === "topdeck_setup")) {
      const eligibleIndex = library.slice(0, 2).findIndex((card) => card.kind === "eligible_payoff");
      if (eligibleIndex > 0) {
        const selected = library.splice(eligibleIndex, 1)[0];
        if (selected) library.unshift(selected);
      }
    }
    if (library[0]?.kind === "eligible_payoff") {
      return { seed, success: true, successTurn: turn, mulligans, commanderCasts, commanderRemovals, failureReason: null };
    }
    lastFailure = "eligible_payoff_missing";
  }
  return { seed, success: false, successTurn: null, mulligans, commanderCasts, commanderRemovals, failureReason: lastFailure };
}

function shuffle<T>(values: readonly T[], rng: Prng): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const selected = Math.floor(rng.next() * (index + 1));
    [result[index], result[selected]] = [result[selected] as T, result[index] as T];
  }
  return result;
}
function countKind(cards: readonly SimCard[], kind: SimCard["kind"]): number { return cards.filter((card) => card.kind === kind).length; }
function bottomPriority(card: SimCard): number { return card.kind === "other" ? 0 : card.kind === "eligible_payoff" ? 1 : 2; }
function emptyFailures(): Record<FailureReason, number> { return { commander_not_cast: 0, commander_removed: 0, activation_mana_missing: 0, eligible_payoff_missing: 0 }; }
function wilson(successes: number, samples: number): { low: number; high: number } {
  const z = 1.959963984540054;
  const p = successes / samples;
  const denominator = 1 + (z * z) / samples;
  const center = (p + (z * z) / (2 * samples)) / denominator;
  const margin = (z * Math.sqrt((p * (1 - p) + (z * z) / (4 * samples)) / samples)) / denominator;
  return { low: Math.max(0, center - margin), high: Math.min(1, center + margin) };
}
function validateInput(input: SimulationInput): void {
  if (input.library.length !== 99) throw new Error("simulation library must contain exactly 99 cards");
  if (input.commander.kind !== "commander") throw new Error("commander must have commander kind");
  if (!Number.isInteger(input.sampleCount) || input.sampleCount < 1) throw new Error("sampleCount must be a positive integer");
  if (input.seeds.length === 0) throw new Error("at least one seed is required");
  if (input.removal.perTurnProbability < 0 || input.removal.perTurnProbability > 1) throw new Error("removal probability must be between 0 and 1");
}
