import { describe, expect, it, vi } from "vitest";
import { createNonbasicLandRetriever } from "./nonbasic-land-retriever.js";

const commander = { oracleId: "cmd", name: "Fixture", colorIdentity: ["G", "U"] };
const land = { oracle_id: "dual", name: "Fixture Dual", type_line: "Land", oracle_text: "{T}: Add {G} or {U}.", color_identity: ["G", "U"], produced_mana: ["G", "U"], legalities: { commander: "legal" }, prices: { usd: "2.50" } };

describe("nonbasic land retrieval", () => {
  it("returns legal in-identity nonbasic options with fixing evidence", async () => {
    const fetchCards = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ data: [land, { ...land, oracle_id: "off", color_identity: ["B"] }, { ...land, oracle_id: "basic", type_line: "Basic Land — Forest" }] }), { status: 200 }));
    const bundle = await createNonbasicLandRetriever({ fetch: fetchCards })(commander);
    expect(bundle.candidates).toEqual([{ oracleId: "dual", name: "Fixture Dual", colorIdentity: ["G", "U"], producedMana: ["G", "U"], category: "fixing", entersTapped: false, usdPrice: 2.5, qualityScore: 34, qualityEvidence: ["+20 fixing coverage", "+10 no unconditional tapped text", "+4 produced-mana breadth"], evidence: "produces GU mana within commander identity", sourceId: "scryfall-search-api/1" }]);
    expect(String((fetchCards.mock.calls[0]?.[0] as URL).searchParams.get("q"))).toContain("id<=gu");
  });
  it("caches identical identity searches", async () => {
    const fetchCards = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ data: [land] }), { status: 200 }));
    const retrieve = createNonbasicLandRetriever({ fetch: fetchCards });
    await retrieve(commander); await retrieve({ ...commander, name: "Other" });
    expect(fetchCards).toHaveBeenCalledTimes(1);
  });
  it("fails visibly on malformed provider data", async () => {
    await expect(createNonbasicLandRetriever({ fetch: vi.fn<typeof fetch>().mockResolvedValue(new Response("{}", { status: 200 })) })(commander)).rejects.toThrow("missing data");
  });
  it("filters known prices above an explicit per-land budget while retaining unknown prices", async () => {
    const fetchCards = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ data: [land, { ...land, oracle_id: "unknown", name: "Unknown", prices: {} }] }), { status: 200 }));
    const bundle = await createNonbasicLandRetriever({ fetch: fetchCards })(commander, { maxPriceUsd: 1 });
    expect(bundle.maxPriceUsd).toBe(1);
    expect(bundle.candidates.map(({ name }) => name)).toEqual(["Unknown"]);
  });
});
