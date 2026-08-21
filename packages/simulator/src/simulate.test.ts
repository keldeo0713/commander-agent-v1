import { describe, expect, it } from "vitest";
import { simulate } from "./simulate.js";
import type { SimCard, SimulationInput } from "./types.js";

function cards(count: number, kind: SimCard["kind"], manaCost = 0, offset = 0): SimCard[] {
  return Array.from({ length: count }, (_, index) => ({ id: `${kind}-${offset + index}`, kind, manaCost }));
}
function fixture(removalProbability = 0): SimulationInput {
  return {
    deckId: "frozen-reference/1",
    library: [...cards(40, "land"), ...cards(12, "eligible_payoff", 6), ...cards(8, "topdeck_setup", 1), ...cards(39, "other", 2)],
    commander: { id: "reference-commander", kind: "commander", manaCost: 2 },
    sampleCount: 500,
    seeds: [11, 29, 47, 83],
    engineVersion: "simulator/1",
    datasetId: "fixture-dataset/1",
    rulesSnapshotId: "commander-fixture/1",
    policy: {
      policyId: "goal-aware-london-v1", targetTurn: 4, openingHandSize: 7,
      maximumMulligans: 2, minimumOpeningLands: 2, maximumOpeningLands: 5,
      commanderManaCost: 2, activationManaCost: 4, onPlay: true,
    },
    removal: { profileId: "fixture-removal/1", enabled: removalProbability > 0, earliestTurn: 2, perTurnProbability: removalProbability },
    unsupportedMechanics: [],
  };
}

describe("deterministic simulator", () => {
  it("reproduces identical reports for the same manifest inputs", () => {
    expect(simulate(fixture())).toEqual(simulate(fixture()));
  });

  it("tracks intervals, turn histograms, and exhaustive failure reasons", () => {
    const report = simulate(fixture());
    expect(report.successes).toBeGreaterThan(0);
    expect(report.wilson95.low).toBeLessThanOrEqual(report.probability);
    expect(report.wilson95.high).toBeGreaterThanOrEqual(report.probability);
    expect(Object.values(report.failureReasons).reduce((sum, value) => sum + value, 0) + report.successes).toBe(500);
    expect(Object.values(report.successTurnHistogram).reduce((sum, value) => sum + value, 0)).toBe(report.successes);
  });

  it("makes commander removal assumptions observable and changes outcomes", () => {
    const goldfish = simulate(fixture(0));
    const removal = simulate(fixture(1));
    expect(removal.probability).toBeLessThan(goldfish.probability);
    expect(removal.failureReasons.commander_removed).toBeGreaterThan(0);
    expect(removal.trials.filter((trial) => trial.commanderCasts > 0).every((trial) => trial.commanderRemovals > 0)).toBe(true);
  });

  it("agrees with exact zero and one probability fixtures", () => {
    const certain = fixture();
    certain.library = cards(99, "eligible_payoff", 6);
    certain.policy = { ...certain.policy, minimumOpeningLands: 0, maximumOpeningLands: 7, commanderManaCost: 0, activationManaCost: 0 };
    expect(simulate(certain).probability).toBe(1);

    const impossible = fixture();
    impossible.library = cards(99, "other", 1);
    impossible.policy = { ...impossible.policy, minimumOpeningLands: 0, maximumOpeningLands: 7, commanderManaCost: 0, activationManaCost: 0 };
    expect(simulate(impossible).probability).toBe(0);
  });

  it("keeps unsupported mechanics visible in the report identity", () => {
    const input = fixture();
    input.unsupportedMechanics = ["political threat assessment"];
    expect(simulate(input).inputIdentity.unsupportedMechanics).toEqual(["political threat assessment"]);
  });

  it("rejects decks that cannot satisfy the Commander zone contract", () => {
    const input = fixture();
    input.library.pop();
    expect(() => simulate(input)).toThrow("exactly 99");
  });
});
