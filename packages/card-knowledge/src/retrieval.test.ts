import { describe, expect, it } from "vitest";
import type { OracleCard } from "@commander-agent/card-data";
import { classifyCardRoles, classifyCreatureEligibility, retrieveCandidates, type SemanticRetrievalAdapter } from "./index.js";

function card(oracleId: string, name: string, manaValue: number, typeLine: string, oracleText: string): OracleCard {
  return { schemaVersion: "oracle-card/1", oracleId, name, faceNames: [name], layout: "normal", manaCost: null, manaValue, typeLine, oracleText, colors: [], colorIdentity: ["U"], keywords: [], legalities: { commander: "legal" } };
}

const benchmark = [
  card("top", "Crystal Ball", 3, "Artifact", "{1}, {T}: Scry 2."),
  card("multi", "Sea Gate Loremaster", 5, "Creature — Merfolk Wizard", "{T}: Draw a card for each Ally you control."),
  card("kraken", "Deep-Sea Kraken", 10, "Creature — Kraken", "Deep-Sea Kraken can't be blocked."),
  card("serpent", "Serpent of Yawning Depths", 6, "Enchantment Creature — Serpent", "Krakens, Leviathans, Octopuses, and Serpents you control can't be blocked except by those creature types."),
  card("illegal", "Red Kraken", 8, "Creature — Kraken", "Whenever Red Kraken enters, destroy target permanent."),
] as const;

describe("card knowledge", () => {
  it("classifies all applicable roles with source provenance", () => {
    const roles = classifyCardRoles(card("x", "Utility", 2, "Artifact", "Scry 2, then draw a card. Target creature gains hexproof."), "dataset-1");
    expect(roles.map((item) => item.role)).toEqual(["card_selection", "card_advantage", "protection"]);
    expect(roles.every((item) => item.provenance.datasetId === "dataset-1")).toBe(true);
  });

  it("applies generic creature type and mana-value eligibility deterministically", () => {
    expect(classifyCreatureEligibility(benchmark[2], { minimumManaValue: 6, creatureTypes: ["Kraken", "Leviathan", "Octopus", "Serpent"] })).toMatchObject({ eligible: true, matchedCreatureTypes: ["Kraken"] });
    expect(classifyCreatureEligibility(benchmark[1], { minimumManaValue: 6, creatureTypes: ["Kraken"] }).eligible).toBe(false);
  });

  it("meets 100% recall on the curated reference benchmark", async () => {
    const semanticAdapter: SemanticRetrievalAdapter = {
      retrieve: () => Promise.resolve([{ oracleId: "top", score: 0.91, reason: "top-deck setup", modelId: "fixture-semantic/1" }]),
    };
    const result = await retrieveCandidates({
      datasetId: "fixture-dataset/1", cards: benchmark,
      legalOracleIds: new Set(["top", "multi", "kraken", "serpent"]),
      query: "top deck scry ocean",
      eligibility: { minimumManaValue: 6, creatureTypes: ["Kraken", "Leviathan", "Octopus", "Serpent"] },
      semanticAdapter,
    });
    const expected = new Set(["top", "kraken", "serpent", "illegal"]);
    const retrieved = new Set(result.candidates.map((item) => item.card.oracleId));
    expect([...expected].filter((id) => retrieved.has(id)).length / expected.size).toBe(1);
    expect(result.candidates.every((item) => item.retrievalReasons.length > 0 && item.legalityReason.length > 0)).toBe(true);
    expect(result.candidates.find((item) => item.card.oracleId === "illegal")?.legal).toBe(false);
  });
});
