import { describe, expect, it } from "vitest";
import { optimize } from "./optimize.js";
import type { DeckMetrics, EvaluatedDeck, EvaluationPort, OptimizationRequest } from "./types.js";

function metrics(primaryProbability: number, continuationScore = 0.8): DeckMetrics {
  return { primaryProbability, removalProbability: primaryProbability - 0.1, continuationScore, interactionCount: 10, themeScore: 0.7 };
}
function baseline(): EvaluatedDeck {
  return { deckId: "baseline", oracleIds: ["old", "fixed"], legal: true, metrics: metrics(0.5), seeds: [1, 2], computeSamples: 100 };
}

describe("optimizer", () => {
  it("uses paired search seeds, Pareto selection, and fresh holdout seeds", async () => {
    const calls: Array<{ deckId: string; seeds: readonly number[] }> = [];
    const evaluator: EvaluationPort = {
      evaluate: (deckId, oracleIds, seeds, samples) => {
        calls.push({ deckId, seeds });
        const probability = oracleIds.includes("better") ? 0.62 : oracleIds.includes("fragile") ? 0.7 : 0.51;
        const continuation = oracleIds.includes("fragile") ? 0.2 : 0.8;
        return Promise.resolve({ deckId, oracleIds: [...oracleIds], legal: true, metrics: metrics(probability, continuation), seeds: [...seeds], computeSamples: samples });
      },
    };
    const request: OptimizationRequest = {
      baseline: baseline(),
      swaps: [
        { removeOracleId: "old", addOracleId: "better" },
        { removeOracleId: "old", addOracleId: "fragile" },
        { removeOracleId: "old", addOracleId: "neutral" },
      ],
      candidateOracleIds: { baseline: ["old", "fixed"] },
      searchSeeds: [10, 11], holdoutSeeds: [90, 91], searchSamples: 100,
      holdoutSamples: 500, minimumPrimaryImprovement: 0.05,
      minimumContinuationScore: 0.6, minimumInteractionCount: 8,
    };
    const result = await optimize(request, evaluator);
    expect(result.finalists).toHaveLength(1);
    expect(result.finalists[0]?.oracleIds).toContain("better");
    expect(result.evaluated.find((deck) => deck.oracleIds.includes("fragile"))).toBeDefined();
    expect(result.pareto.some((deck) => deck.oracleIds.includes("fragile"))).toBe(false);
    expect(calls.slice(0, 3).every((call) => call.seeds === request.searchSeeds)).toBe(true);
    expect(calls.at(-1)?.seeds).toBe(request.holdoutSeeds);
    expect(result.computeSamples).toBe(800);
  });

  it("returns a documented no-improvement result", async () => {
    const evaluator: EvaluationPort = {
      evaluate: (deckId, oracleIds, seeds, samples) => Promise.resolve({ deckId, oracleIds: [...oracleIds], legal: true, metrics: metrics(0.51), seeds: [...seeds], computeSamples: samples }),
    };
    const request: OptimizationRequest = {
      baseline: baseline(), swaps: [{ removeOracleId: "old", addOracleId: "neutral" }],
      candidateOracleIds: { baseline: ["old", "fixed"] }, searchSeeds: [1], holdoutSeeds: [2],
      searchSamples: 50, holdoutSamples: 100, minimumPrimaryImprovement: 0.05,
      minimumContinuationScore: 0.6, minimumInteractionCount: 8,
    };
    expect((await optimize(request, evaluator)).finalists).toEqual([]);
  });
});
