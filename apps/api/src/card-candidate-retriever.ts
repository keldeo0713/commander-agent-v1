import type { OptimizedTemplate, ResolvedCommander } from "./template-orchestrator.ts";

export const CARD_CANDIDATE_BUNDLE_VERSION = "card-candidate-bundle/1" as const;
export const SCRYFALL_SEARCH_ENDPOINT = "https://api.scryfall.com/cards/search";

export interface CardCandidate {
  oracleId: string;
  name: string;
  manaValue: number;
  typeLine: string;
  oracleText: string;
  colorIdentity: string[];
  roleId: string;
  evidence: string;
  sourceId: "scryfall-search-api/1";
}
export interface CandidateRole { roleId: string; requiredQuantity: number; candidates: CardCandidate[] }
export interface CardCandidateBundle { schemaVersion: typeof CARD_CANDIDATE_BUNDLE_VERSION; commanderOracleId: string; roles: CandidateRole[] }
export interface CandidateRetrieverOptions { fetch?: typeof globalThis.fetch; endpoint?: string; delayMs?: number; limitPerRole?: number }

interface ScryfallSearchCard { oracle_id?: unknown; name?: unknown; cmc?: unknown; type_line?: unknown; oracle_text?: unknown; color_identity?: unknown; legalities?: unknown }
interface ScryfallSearchPage { data?: unknown }

const ROLE_QUERIES: Record<string, { query: string; evidence: string }> = {
  ramp: { query: `(o:"add" or o:"search your library for a land")`, evidence: "mana production or land access matched the ramp retrieval rule" },
  "primary-engine": { query: `(o:"whenever" or o:"at the beginning" or o:"look at the top")`, evidence: "repeatable or setup text matched the engine retrieval rule" },
  "payoffs-finishers": { query: `(mv>=5 or o:"you win the game")`, evidence: "high-impact or explicit closing text matched the payoff retrieval rule" },
  "card-advantage": { query: `(o:"draw" or o:"exile the top")`, evidence: "card-flow text matched the card-advantage retrieval rule" },
  interaction: { query: `(o:"destroy target" or o:"exile target" or o:"counter target")`, evidence: "answer text matched the interaction retrieval rule" },
  "protection-rebuild": { query: `(o:"hexproof" or o:"indestructible" or o:"return target" or o:"return a")`, evidence: "protection or recovery text matched the rebuild retrieval rule" },
};

export function createCardCandidateRetriever(options: CandidateRetrieverOptions = {}): (template: OptimizedTemplate) => Promise<CardCandidateBundle> {
  const fetchCards = options.fetch ?? globalThis.fetch;
  const endpoint = options.endpoint ?? SCRYFALL_SEARCH_ENDPOINT;
  const delayMs = options.delayMs ?? 110;
  const limit = options.limitPerRole ?? 5;
  const cache = new Map<string, CardCandidate[]>();
  return async (template) => {
    const roles: CandidateRole[] = [];
    for (const slot of template.slots.filter(({ roleId }) => roleId !== "commander" && roleId !== "mana-base")) {
      const rule = ROLE_QUERIES[slot.roleId];
      if (!rule) continue;
      const query = `${rule.query} f:commander ${identityQuery(template.commander)} -is:funny`;
      let candidates = cache.get(query);
      if (!candidates) {
        const url = new URL(endpoint);
        url.searchParams.set("q", query);
        url.searchParams.set("unique", "cards");
        url.searchParams.set("order", "edhrec");
        const response = await fetchCards(url, { headers: { accept: "application/json;q=0.9,*/*;q=0.8", "user-agent": "commander-agent-v1/0.1 (+https://github.com/keldeo0713/commander-agent-v1)" } });
        if (!response.ok) throw new Error(`candidate lookup failed for ${slot.roleId} (${response.status})`);
        candidates = parseCandidates(await response.json() as ScryfallSearchPage, template.commander, slot.roleId, rule.evidence).slice(0, limit);
        cache.set(query, candidates);
        if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      roles.push({ roleId: slot.roleId, requiredQuantity: slot.quantity, candidates: structuredClone(candidates) });
    }
    return { schemaVersion: CARD_CANDIDATE_BUNDLE_VERSION, commanderOracleId: template.commander.oracleId, roles };
  };
}

function identityQuery(commander: ResolvedCommander): string {
  const colors = [...commander.colorIdentity].sort().join("").toLowerCase();
  return colors ? `id<=${colors}` : "id:c";
}

function parseCandidates(page: ScryfallSearchPage, commander: ResolvedCommander, roleId: string, evidence: string): CardCandidate[] {
  if (!Array.isArray(page.data)) throw new Error("candidate provider response is missing data");
  const seen = new Set<string>();
  const allowed = new Set(commander.colorIdentity);
  const candidates: CardCandidate[] = [];
  for (const value of page.data) {
    if (!value || typeof value !== "object") continue;
    const card = value as ScryfallSearchCard;
    const legalities = card.legalities && typeof card.legalities === "object" ? card.legalities as Record<string, unknown> : {};
    if (typeof card.oracle_id !== "string" || typeof card.name !== "string" || typeof card.cmc !== "number" || typeof card.type_line !== "string" || !Array.isArray(card.color_identity) || !card.color_identity.every((color) => typeof color === "string") || legalities["commander"] !== "legal" || card.oracle_id === commander.oracleId || seen.has(card.oracle_id) || !card.color_identity.every((color) => allowed.has(color))) continue;
    seen.add(card.oracle_id);
    candidates.push({ oracleId: card.oracle_id, name: card.name, manaValue: card.cmc, typeLine: card.type_line, oracleText: typeof card.oracle_text === "string" ? card.oracle_text : "", colorIdentity: card.color_identity, roleId, evidence, sourceId: "scryfall-search-api/1" });
  }
  return candidates;
}
