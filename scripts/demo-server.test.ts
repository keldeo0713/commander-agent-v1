import { describe, expect, it } from "vitest";
import { createDemoServer, runSelfCheck } from "./demo-server.js";

describe("local demo server", () => {
  it("serves its health endpoint, terminal page, and interactive script", async () => {
    await expect(runSelfCheck()).resolves.toBeUndefined();
  });

  it("runs discovery, mapping, template, and example requests through the local API", async () => {
    const server = createDemoServer({ retrieveCardCandidates: (template) => Promise.resolve({ schemaVersion: "card-candidate-bundle/1", commanderOracleId: template.commander.oracleId, roles: [{ roleId: "ramp", requiredQuantity: 10, queryId: "candidate-query-plan/1:ramp:generic", queryEvidence: "fixture query evidence", candidates: [{ oracleId: "candidate", name: "Nature's Lore", manaValue: 2, typeLine: "Sorcery", oracleText: "Search your library for a Forest card.", colorIdentity: ["G"], roleId: "ramp", evidence: "fixture evidence", rank: 1, rankScore: 25, rankingEvidence: ["fixture ranking evidence"], rankingVersion: "candidate-ranking/1", sourceId: "scryfall-search-api/1" }] }] }) });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (address === null || typeof address === "string") throw new Error("server did not bind");
    const post = async (path: string, body: unknown): Promise<Response> => fetch(`http://127.0.0.1:${address.port}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    try {
      const sessionResponse = await post("/api/session", { commander: "Kenessos", bracket: 3 });
      const session = await sessionResponse.json() as { commander: unknown; mechanics: Array<{ id: string }> };
      expect(sessionResponse.status).toBe(200);
      expect(session.mechanics.length).toBeGreaterThan(1);
      const mappingResponse = await post("/api/map-mechanic", { commander: session.commander, input: "sea monster tribal" });
      expect(mappingResponse.status).toBe(200);
      const templateResponse = await post("/api/template", { commander: session.commander, bracket: 3, mechanicIds: [session.mechanics[0]?.id, "big-creatures"] });
      const template = await templateResponse.json() as { slots: Array<{ quantity: number }> };
      expect(template.slots.reduce((sum, slot) => sum + slot.quantity, 0)).toBe(100);
      const manaResponse = await post("/api/mana-base", { template });
      const mana = await manaResponse.json() as { totalLands: number; entries: Array<{ quantity: number }> };
      expect(manaResponse.status).toBe(200);
      expect(mana.totalLands).toBe(37);
      expect(mana.entries.reduce((sum, entry) => sum + entry.quantity, 0)).toBe(37);
      const candidateResponse = await post("/api/candidates", { template });
      const candidates = await candidateResponse.json() as { roles: Array<{ candidates: unknown[] }> };
      expect(candidateResponse.status).toBe(200);
      expect(candidates.roles[0]?.candidates).toHaveLength(1);
      const exampleResponse = await post("/api/example", { template });
      const example = await exampleResponse.json() as { entries: Array<{ quantity: number; name: string }> };
      expect(example.entries.reduce((sum, entry) => sum + entry.quantity, 0)).toBe(100);
      expect(example.entries.some((entry) => entry.name === "Swamp")).toBe(false);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });
});
