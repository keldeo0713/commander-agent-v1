import { describe, expect, it } from "vitest";

import { normalizeOracleCards, normalizePrintings } from "./normalize.js";
import { fixtureBytes } from "./test-helpers.js";

async function fixture(name: "oracle-cards.json" | "default-cards.json") {
  return JSON.parse(new TextDecoder().decode(await fixtureBytes(name))) as unknown[];
}

describe("Scryfall normalization", () => {
  it("separates oracle facts from printing facts", async () => {
    const oracle = normalizeOracleCards(await fixture("oracle-cards.json"));
    const printings = normalizePrintings(
      await fixture("default-cards.json"),
      new Set(oracle.records.map((card) => card.oracleId)),
    );

    expect(oracle.issues).toEqual([]);
    expect(printings.issues).toEqual([]);
    expect(oracle.records[0]).toMatchObject({
      oracleId: "45b3a028-5705-4dc8-bfab-04bb5e01eea6",
      name: "Kenessos, Priest of Thassa",
      manaValue: 2,
      colorIdentity: ["G", "U"],
    });
    expect(printings.records[0]).toMatchObject({
      scryfallId: "0ba97da8-0106-4e8b-b58b-8f2d63e3d618",
      setCode: "j22",
      collectorNumber: "13",
    });
  });

  it("reports every rejected source record explicitly", async () => {
    const values = await fixture("oracle-cards.json");
    const result = normalizeOracleCards([
      ...values,
      { id: "missing-fields" },
      values[0],
    ]);

    expect(result.records).toHaveLength(1);
    expect(result.issues.map((entry) => entry.code)).toEqual([
      "invalid_record",
      "duplicate_oracle_id",
    ]);
    expect(result.issues.map((entry) => entry.sourceIndex)).toEqual([1, 2]);
  });
});
