import type { OracleCard } from "@commander-agent/card-data";

export const CARD_KNOWLEDGE_SCHEMA_VERSION = "card-knowledge/1" as const;
export type CardRole = "mana" | "card_selection" | "card_advantage" | "tutor" | "interaction" | "protection" | "recursion" | "payoff" | "enabler" | "land";
export type ProvenanceKind = "oracle_rule" | "curated" | "semantic";
export interface RoleEvidence { role: CardRole; confidence: number; provenance: { kind: ProvenanceKind; sourceId: string; datasetId: string }; reason: string }
export interface EligibilityCriteria { minimumManaValue: number; creatureTypes: string[] }
export interface EligibilityResult { eligible: boolean; reason: string; matchedCreatureTypes: string[] }
export interface SemanticHit { oracleId: string; score: number; reason: string; modelId: string }
export interface SemanticRetrievalAdapter { retrieve(query: string, cards: readonly OracleCard[], limit: number): Promise<SemanticHit[]> }
export interface CandidateRequest { datasetId: string; cards: readonly OracleCard[]; legalOracleIds: ReadonlySet<string>; query: string; eligibility?: EligibilityCriteria; semanticAdapter?: SemanticRetrievalAdapter; limit?: number }
export interface CandidateCard { schemaVersion: typeof CARD_KNOWLEDGE_SCHEMA_VERSION; card: OracleCard; legal: boolean; legalityReason: string; roles: RoleEvidence[]; retrievalReasons: string[]; eligibility?: EligibilityResult }
export interface RetrievalResult { schemaVersion: "candidate-retrieval/1"; datasetId: string; candidates: CandidateCard[] }
