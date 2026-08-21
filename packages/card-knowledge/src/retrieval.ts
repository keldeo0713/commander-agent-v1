import { classifyCardRoles, classifyCreatureEligibility } from "./classifier.js";
import type { CandidateCard, CandidateRequest, RetrievalResult, SemanticHit } from "./types.js";

export async function retrieveCandidates(request: CandidateRequest): Promise<RetrievalResult> {
  const limit = request.limit ?? 200;
  const terms = tokenize(request.query);
  const hits = request.semanticAdapter ? await request.semanticAdapter.retrieve(request.query, request.cards, limit) : [];
  const hitById = new Map<string, SemanticHit>(hits.map((hit) => [hit.oracleId, hit]));
  const candidates: CandidateCard[] = [];

  for (const card of request.cards) {
    const text = `${card.name} ${card.typeLine} ${card.oracleText ?? ""}`.toLowerCase();
    const lexical = terms.filter((term) => text.includes(term));
    const eligibility = request.eligibility ? classifyCreatureEligibility(card, request.eligibility) : undefined;
    const semantic = hitById.get(card.oracleId);
    const retrievalReasons: string[] = [];
    if (lexical.length > 0) retrievalReasons.push(`lexical match: ${lexical.join(", ")}`);
    if (eligibility?.eligible) retrievalReasons.push(`eligibility: ${eligibility.reason}`);
    if (semantic) retrievalReasons.push(`semantic (${semantic.modelId}, ${semantic.score.toFixed(3)}): ${semantic.reason}`);
    if (retrievalReasons.length === 0) continue;

    const roles = classifyCardRoles(card, request.datasetId);
    if (semantic) roles.push({
      role: "enabler", confidence: semantic.score,
      provenance: { kind: "semantic", sourceId: semantic.modelId, datasetId: request.datasetId },
      reason: semantic.reason,
    });
    const legal = request.legalOracleIds.has(card.oracleId);
    candidates.push({
      schemaVersion: "card-knowledge/1", card, legal,
      legalityReason: legal ? "present in the supplied legal-card set" : "absent from the supplied legal-card set",
      roles: dedupeRoles(roles), retrievalReasons,
      ...(eligibility ? { eligibility } : {}),
    });
  }

  candidates.sort((a, b) =>
    Number(b.legal) - Number(a.legal)
    || Number(b.eligibility?.eligible) - Number(a.eligibility?.eligible)
    || b.roles.length - a.roles.length
    || a.card.name.localeCompare(b.card.name),
  );
  return { schemaVersion: "candidate-retrieval/1", datasetId: request.datasetId, candidates: candidates.slice(0, limit) };
}

function tokenize(query: string): string[] {
  return [...new Set(query.toLowerCase().match(/[a-z]{4,}/g) ?? [])]
    .filter((term) => !["with", "that", "this", "from", "card", "cards"].includes(term));
}

function dedupeRoles<T extends { role: string }>(roles: T[]): T[] {
  const seen = new Set<string>();
  return roles.filter((role) => !seen.has(role.role) && Boolean(seen.add(role.role)));
}
