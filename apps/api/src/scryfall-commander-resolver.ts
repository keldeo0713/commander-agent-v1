import type { ResolvedCommander } from "./template-orchestrator.ts";

export const SCRYFALL_NAMED_CARD_ENDPOINT = "https://api.scryfall.com/cards/named";

interface ScryfallNamedCard {
  oracle_id?: unknown;
  name?: unknown;
  type_line?: unknown;
  oracle_text?: unknown;
  color_identity?: unknown;
  legalities?: unknown;
}

export interface CommanderResolverOptions {
  fetch?: typeof globalThis.fetch;
  endpoint?: string;
}

export function createScryfallCommanderResolver(options: CommanderResolverOptions = {}): (name: string) => Promise<ResolvedCommander | null> {
  const fetchCard = options.fetch ?? globalThis.fetch;
  const endpoint = options.endpoint ?? SCRYFALL_NAMED_CARD_ENDPOINT;
  const cache = new Map<string, ResolvedCommander | null>();
  return async (name) => {
    const query = name.replace(/\s+/g, " ").trim();
    if (!query) return null;
    const key = query.toLocaleLowerCase("en-US");
    const cached = cache.get(key);
    if (cached !== undefined) return structuredClone(cached);
    const url = new URL(endpoint);
    url.searchParams.set("exact", query);
    const response = await fetchCard(url, { headers: { "accept": "application/json", "user-agent": "commander-agent-v1/0.1 (+https://github.com/keldeo0713/commander-agent-v1)" } });
    if (response.status === 404) { cache.set(key, null); return null; }
    if (!response.ok) throw new Error(`commander lookup failed (${response.status})`);
    const card = await response.json() as ScryfallNamedCard;
    const resolved = parseCommanderCard(card);
    cache.set(key, resolved);
    return structuredClone(resolved);
  };
}

function parseCommanderCard(card: ScryfallNamedCard): ResolvedCommander | null {
  if (typeof card.oracle_id !== "string" || typeof card.name !== "string" || typeof card.type_line !== "string" || !Array.isArray(card.color_identity) || !card.color_identity.every((color) => typeof color === "string")) return null;
  const oracleText = typeof card.oracle_text === "string" ? card.oracle_text : "";
  const legalities = card.legalities && typeof card.legalities === "object" ? card.legalities as Record<string, unknown> : {};
  const eligibleType = /(?:^|\/\/ )Legendary Creature\b/i.test(card.type_line);
  const explicitPermission = /can be your commander/i.test(oracleText);
  if (legalities["commander"] !== "legal" || (!eligibleType && !explicitPermission)) return null;
  return {
    oracleId: card.oracle_id,
    name: card.name,
    colorIdentity: card.color_identity,
    oracleText,
    typeLine: card.type_line,
    sourceId: "scryfall-named-api/1",
  };
}
