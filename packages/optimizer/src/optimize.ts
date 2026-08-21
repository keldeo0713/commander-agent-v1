import type { EvaluatedDeck, OptimizationRequest, OptimizationResult } from "./types.js";

export async function optimize(request: OptimizationRequest, evaluator: import("./types.js").EvaluationPort): Promise<OptimizationResult> {
  const evaluated: EvaluatedDeck[] = [];
  const searchHistory: OptimizationResult["searchHistory"] = [];
  for (const swap of request.swaps) {
    const baseCards = request.candidateOracleIds[request.baseline.deckId] ?? request.baseline.oracleIds;
    const oracleIds = baseCards.map((id) => id === swap.removeOracleId ? swap.addOracleId : id);
    const deckId = `${request.baseline.deckId}/swap/${swap.removeOracleId}/${swap.addOracleId}`;
    const result = await evaluator.evaluate(deckId, oracleIds, request.searchSeeds, request.searchSamples);
    const acceptedForHoldout = passes(result, request) && result.metrics.primaryProbability >= request.baseline.metrics.primaryProbability + request.minimumPrimaryImprovement;
    evaluated.push(result);
    searchHistory.push({ deckId, swap, acceptedForHoldout });
  }
  const pareto = evaluated.filter((candidate) => passes(candidate, request) && !evaluated.some((other) => dominates(other, candidate)));
  const finalists: EvaluatedDeck[] = [];
  for (const candidate of pareto.filter((item) => searchHistory.find((entry) => entry.deckId === item.deckId)?.acceptedForHoldout)) {
    const holdout = await evaluator.evaluate(candidate.deckId, candidate.oracleIds, request.holdoutSeeds, request.holdoutSamples);
    if (passes(holdout, request) && holdout.metrics.primaryProbability >= request.baseline.metrics.primaryProbability + request.minimumPrimaryImprovement) finalists.push(holdout);
  }
  return {
    schemaVersion: "optimizer/1", baseline: request.baseline, evaluated, pareto, finalists, searchHistory,
    computeSamples: evaluated.reduce((sum, item) => sum + item.computeSamples, 0) + finalists.reduce((sum, item) => sum + item.computeSamples, 0),
  };
}

function passes(deck: EvaluatedDeck, request: OptimizationRequest): boolean {
  return deck.legal && deck.metrics.continuationScore >= request.minimumContinuationScore && deck.metrics.interactionCount >= request.minimumInteractionCount;
}
function dominates(a: EvaluatedDeck, b: EvaluatedDeck): boolean {
  const am = a.metrics, bm = b.metrics;
  const noWorse = am.primaryProbability >= bm.primaryProbability && am.removalProbability >= bm.removalProbability && am.continuationScore >= bm.continuationScore && am.interactionCount >= bm.interactionCount && am.themeScore >= bm.themeScore;
  const better = am.primaryProbability > bm.primaryProbability || am.removalProbability > bm.removalProbability || am.continuationScore > bm.continuationScore || am.interactionCount > bm.interactionCount || am.themeScore > bm.themeScore;
  return noWorse && better;
}
