import type { OptimizedTemplate, ResolvedCommander } from "./template-orchestrator.ts";

export const CARD_CANDIDATE_BUNDLE_VERSION = "card-candidate-bundle/1" as const;
export const CANDIDATE_QUERY_PLAN_VERSION = "candidate-query-plan/1" as const;
export const CANDIDATE_RANKING_VERSION = "candidate-ranking/1" as const;
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
  rank: number;
  rankScore: number;
  rankingEvidence: string[];
  rankingVersion: typeof CANDIDATE_RANKING_VERSION;
  sourceId: "scryfall-search-api/1";
}
export interface CandidateQueryPlan { schemaVersion: typeof CANDIDATE_QUERY_PLAN_VERSION; queryId: string; roleId: string; mechanicIds: string[]; query: string; evidence: string }
export interface CandidateRole { roleId: string; requiredQuantity: number; queryId: string; queryEvidence: string; candidates: CardCandidate[] }
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

const MECHANIC_ROLE_QUERIES: Record<string, { engine: string; payoff: string; evidence: string }> = {
  "top-deck": { engine: `(o:"scry" or o:"surveil" or o:"look at the top")`, payoff: `(mv>=5 and (t:creature or o:"from the top"))`, evidence: "top-deck setup and high-impact reveals" },
  "big-creatures": { engine: `(o:"mana value" or o:"power 4 or greater")`, payoff: `(t:creature and mv>=6)`, evidence: "large-creature setup and closing threats" },
  graveyard: { engine: `(o:"graveyard" or o:"mill" or o:"discard")`, payoff: `(o:"return" and o:"graveyard")`, evidence: "graveyard setup and recursion" },
  tokens: { engine: `(o:"create" and o:"token")`, payoff: `(o:"tokens you control" or o:"creatures you control get")`, evidence: "token production and board scaling" },
  artifacts: { engine: `(t:artifact or o:"artifact you control")`, payoff: `(o:"artifacts you control" or o:"for each artifact")`, evidence: "artifact density and artifact payoffs" },
  spells: { engine: `(t:instant or t:sorcery or o:"copy target spell")`, payoff: `(o:"magecraft" or o:"whenever you cast" or o:"copy that spell")`, evidence: "instant/sorcery density and cast payoffs" },
  lands: { engine: `(o:"landfall" or o:"play an additional land")`, payoff: `(o:"landfall" or o:"for each land you control")`, evidence: "land development and landfall payoffs" },
  combat: { engine: `(t:equipment or t:aura or o:"attacks")`, payoff: `(o:"combat damage" or o:"double strike" or o:"commander you control")`, evidence: "combat setup and commander-damage payoffs" },
};

const ROLE_SIGNALS: Record<string, RegExp> = {
  ramp: /add .*mana|search your library for .*land|additional land/i,
  "primary-engine": /whenever|at the beginning|scry|surveil|copy|graveyard|token|artifact|landfall|attacks/i,
  "payoffs-finishers": /you win the game|double strike|combat damage|for each|creatures you control get|artifacts you control/i,
  "card-advantage": /draw|exile the top|return .* from your graveyard/i,
  interaction: /destroy target|exile target|counter target|deals? .* damage to target/i,
  "protection-rebuild": /hexproof|indestructible|protection from|return .*graveyard|phase out/i,
};

const MECHANIC_SIGNALS: Record<string, RegExp> = {
  "top-deck": /scry|surveil|top (?:card|cards)|library/i,
  "big-creatures": /kraken|leviathan|octopus|serpent|power [4-9]|mana value [4-9]/i,
  graveyard: /graveyard|mill|discard|reanimate/i,
  tokens: /create .*token|tokens? you control/i,
  artifacts: /artifact|treasure|clue|food/i,
  spells: /instant|sorcery|cast .*spell|copy .*spell|magecraft/i,
  lands: /landfall|land enters|additional land|lands? you control/i,
  combat: /combat|attacks?|equipment|aura|double strike/i,
};

export function buildCandidateQueryPlan(template: OptimizedTemplate, roleId: string): CandidateQueryPlan | null {
  const base = ROLE_QUERIES[roleId];
  if (!base) return null;
  const mechanicIds = [...new Set(template.mechanics.map(({ id }) => id).filter((id) => MECHANIC_ROLE_QUERIES[id]))].sort();
  if ((roleId === "primary-engine" || roleId === "payoffs-finishers") && mechanicIds.length) {
    const field = roleId === "primary-engine" ? "engine" : "payoff";
    const rules = mechanicIds.map((id) => MECHANIC_ROLE_QUERIES[id]).filter((rule): rule is NonNullable<typeof rule> => rule !== undefined);
    const query = `(${rules.map((rule) => rule[field]).join(" or ")})`;
    const evidence = `${rules.map((rule) => rule.evidence).join("; ")} matched selected mechanics`;
    return { schemaVersion: CANDIDATE_QUERY_PLAN_VERSION, queryId: `${CANDIDATE_QUERY_PLAN_VERSION}:${roleId}:${mechanicIds.join("+")}`, roleId, mechanicIds, query, evidence };
  }
  return { schemaVersion: CANDIDATE_QUERY_PLAN_VERSION, queryId: `${CANDIDATE_QUERY_PLAN_VERSION}:${roleId}:generic`, roleId, mechanicIds: [], query: base.query, evidence: base.evidence };
}

export function createCardCandidateRetriever(options: CandidateRetrieverOptions = {}): (template: OptimizedTemplate) => Promise<CardCandidateBundle> {
  const fetchCards = options.fetch ?? globalThis.fetch;
  const endpoint = options.endpoint ?? SCRYFALL_SEARCH_ENDPOINT;
  const delayMs = options.delayMs ?? 110;
  const fixedLimit = options.limitPerRole;
  const cache = new Map<string, CardCandidate[]>();
  return async (template) => {
    const roles: CandidateRole[] = [];
    for (const slot of template.slots.filter(({ roleId }) => roleId !== "commander" && roleId !== "mana-base")) {
      const plan = buildCandidateQueryPlan(template, slot.roleId);
      if (!plan) continue;
      const query = `${plan.query} f:commander ${identityQuery(template.commander)} -is:funny`;
      let candidates = cache.get(query);
      if (!candidates) {
        const url = new URL(endpoint);
        url.searchParams.set("q", query);
        url.searchParams.set("unique", "cards");
        url.searchParams.set("order", "edhrec");
        const response = await fetchCards(url, { headers: { accept: "application/json;q=0.9,*/*;q=0.8", "user-agent": "commander-agent-v1/0.1 (+https://github.com/keldeo0713/commander-agent-v1)" } });
        if (!response.ok) throw new Error(`candidate lookup failed for ${slot.roleId} (${response.status})`);
        candidates = rankCardCandidates(parseCandidates(await response.json() as ScryfallSearchPage, template.commander, slot.roleId, plan.evidence), slot.roleId, plan.mechanicIds);
        cache.set(query, candidates);
        if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      const limit = fixedLimit ?? Math.min(25, Math.max(12, slot.quantity));
      roles.push({ roleId: slot.roleId, requiredQuantity: slot.quantity, queryId: plan.queryId, queryEvidence: plan.evidence, candidates: structuredClone(candidates.slice(0, limit)) });
    }
    return { schemaVersion: CARD_CANDIDATE_BUNDLE_VERSION, commanderOracleId: template.commander.oracleId, roles };
  };
}

export function rankCardCandidates(candidates: CardCandidate[], roleId: string, mechanicIds: string[]): CardCandidate[] {
  const selectedMechanics = [...new Set(mechanicIds)].sort();
  const ranked = candidates.map((candidate) => {
    const text = `${candidate.typeLine} ${candidate.oracleText}`;
    const evidence: string[] = [];
    let score = 0;
    if (ROLE_SIGNALS[roleId]?.test(text)) {
      score += 20;
      evidence.push(`+20 ${roleId} text signal`);
    }
    for (const mechanicId of selectedMechanics) if (MECHANIC_SIGNALS[mechanicId]?.test(text)) {
      score += 12;
      evidence.push(`+12 ${mechanicId} mechanic signal`);
    }
    const curve = curveScore(roleId, candidate.manaValue);
    if (curve > 0) {
      score += curve;
      evidence.push(`+${curve} ${roleId} mana-value fit`);
    }
    if (!evidence.length) evidence.push("+0 provider query match only");
    return { ...candidate, rank: 0, rankScore: score, rankingEvidence: evidence, rankingVersion: CANDIDATE_RANKING_VERSION };
  }).sort((left, right) => right.rankScore - left.rankScore || compareText(left.name, right.name) || compareText(left.oracleId, right.oracleId));
  return ranked.map((candidate, index) => ({ ...candidate, rank: index + 1 }));
}

function curveScore(roleId: string, manaValue: number): number {
  if (roleId === "payoffs-finishers") return manaValue >= 6 ? 5 : manaValue >= 4 ? 3 : 0;
  if (["ramp", "interaction", "protection-rebuild"].includes(roleId)) return manaValue <= 2 ? 5 : manaValue <= 3 ? 3 : 0;
  if (["primary-engine", "card-advantage"].includes(roleId)) return manaValue <= 3 ? 5 : manaValue <= 4 ? 3 : 0;
  return 0;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
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
    candidates.push({ oracleId: card.oracle_id, name: card.name, manaValue: card.cmc, typeLine: card.type_line, oracleText: typeof card.oracle_text === "string" ? card.oracle_text : "", colorIdentity: card.color_identity, roleId, evidence, rank: 0, rankScore: 0, rankingEvidence: [], rankingVersion: CANDIDATE_RANKING_VERSION, sourceId: "scryfall-search-api/1" });
  }
  return candidates;
}
