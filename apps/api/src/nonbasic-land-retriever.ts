import { SCRYFALL_SEARCH_ENDPOINT } from "./card-candidate-retriever.ts";
import type { ResolvedCommander } from "./template-orchestrator.ts";

export const NONBASIC_LAND_BUNDLE_VERSION = "nonbasic-land-bundle/1" as const;
export interface NonbasicLandCandidate { oracleId: string; name: string; colorIdentity: string[]; producedMana: string[]; category: "fixing" | "utility"; entersTapped: boolean; usdPrice: number | null; qualityScore: number; qualityEvidence: string[]; evidence: string; sourceId: "scryfall-search-api/1" }
export interface NonbasicLandBundle { schemaVersion: typeof NONBASIC_LAND_BUNDLE_VERSION; commanderOracleId: string; query: string; maxPriceUsd: number | null; candidates: NonbasicLandCandidate[] }
export interface NonbasicLandRetrieverOptions { fetch?: typeof globalThis.fetch; endpoint?: string; limit?: number }
export interface LandPreferences { maxPriceUsd?: number }
interface SearchCard { oracle_id?: unknown; name?: unknown; type_line?: unknown; oracle_text?: unknown; color_identity?: unknown; produced_mana?: unknown; legalities?: unknown; prices?: unknown }

export function createNonbasicLandRetriever(options: NonbasicLandRetrieverOptions = {}): (commander: ResolvedCommander, preferences?: LandPreferences) => Promise<NonbasicLandBundle> {
  const fetchCards = options.fetch ?? globalThis.fetch;
  const endpoint = options.endpoint ?? SCRYFALL_SEARCH_ENDPOINT;
  const limit = options.limit ?? 15;
  const cache = new Map<string, NonbasicLandCandidate[]>();
  return async (commander, preferences = {}) => {
    const colors = [...commander.colorIdentity].sort().join("").toLowerCase();
    const identity = colors ? `id<=${colors}` : "id:c";
    const query = `t:land -t:basic f:commander ${identity} -is:funny`;
    let candidates = cache.get(query);
    if (!candidates) {
      const url = new URL(endpoint);
      url.searchParams.set("q", query);
      url.searchParams.set("unique", "cards");
      url.searchParams.set("order", "edhrec");
      const response = await fetchCards(url, { headers: { accept: "application/json;q=0.9,*/*;q=0.8", "user-agent": "commander-agent-v1/0.1 (+https://github.com/keldeo0713/commander-agent-v1)" } });
      if (!response.ok) throw new Error(`nonbasic land lookup failed (${response.status})`);
      const body = await response.json() as { data?: unknown };
      if (!Array.isArray(body.data)) throw new Error("nonbasic land provider response is missing data");
      candidates = parseLands(body.data, commander);
      cache.set(query, candidates);
    }
    const maxPriceUsd = typeof preferences.maxPriceUsd === "number" && preferences.maxPriceUsd >= 0 ? preferences.maxPriceUsd : null;
    const filtered = candidates.filter(({ usdPrice }) => maxPriceUsd === null || usdPrice === null || usdPrice <= maxPriceUsd);
    return { schemaVersion: NONBASIC_LAND_BUNDLE_VERSION, commanderOracleId: commander.oracleId, query, maxPriceUsd, candidates: structuredClone(filtered.slice(0, limit)) };
  };
}

function parseLands(data: unknown[], commander: ResolvedCommander): NonbasicLandCandidate[] {
  const allowed = new Set(commander.colorIdentity);
  const seen = new Set<string>();
  return data.flatMap((value): NonbasicLandCandidate[] => {
    if (!value || typeof value !== "object") return [];
    const card = value as SearchCard;
    const legalities = card.legalities && typeof card.legalities === "object" ? card.legalities as Record<string, unknown> : {};
    if (typeof card.oracle_id !== "string" || typeof card.name !== "string" || typeof card.type_line !== "string" || !/Land/i.test(card.type_line) || /Basic/i.test(card.type_line) || !Array.isArray(card.color_identity) || !card.color_identity.every((color) => typeof color === "string" && allowed.has(color)) || legalities["commander"] !== "legal" || seen.has(card.oracle_id)) return [];
    seen.add(card.oracle_id);
    const colorIdentity = (card.color_identity as unknown[]).filter((color): color is string => typeof color === "string");
    const rawProducedMana: unknown[] = Array.isArray(card.produced_mana) ? card.produced_mana as unknown[] : [];
    const producedMana = rawProducedMana.filter((color): color is string => typeof color === "string");
    const oracleText = typeof card.oracle_text === "string" ? card.oracle_text : "";
    const prices = card.prices && typeof card.prices === "object" ? card.prices as Record<string, unknown> : {};
    const usdPrice = typeof prices["usd"] === "string" && Number.isFinite(Number(prices["usd"])) ? Number(prices["usd"]) : null;
    const entersTapped = /enters(?: the battlefield)? tapped/i.test(oracleText);
    const usefulColors = producedMana.filter((color) => allowed.has(color)).length;
    const category = usefulColors >= Math.min(2, Math.max(1, allowed.size)) || /mana of any color|choose a color/i.test(oracleText) ? "fixing" : "utility";
    const qualityEvidence = [category === "fixing" ? "+20 fixing coverage" : "+10 utility role", entersTapped ? "-10 enters tapped" : "+10 no unconditional tapped text", `+${producedMana.length * 2} produced-mana breadth`];
    const qualityScore = (category === "fixing" ? 20 : 10) + (entersTapped ? -10 : 10) + producedMana.length * 2;
    return [{ oracleId: card.oracle_id, name: card.name, colorIdentity, producedMana, category, entersTapped, usdPrice, qualityScore, qualityEvidence, evidence: category === "fixing" ? `produces ${producedMana.join("") || "flexible"} mana within commander identity` : "legal nonbasic utility option; verify its effect against colored-source needs", sourceId: "scryfall-search-api/1" }];
  }).sort((left, right) => right.qualityScore - left.qualityScore || compare(left.name, right.name));
}
function compare(left: string, right: string): number { return left < right ? -1 : left > right ? 1 : 0; }
