import { describe, expect, it } from "vitest";

import { CardCatalog } from "./catalog.js";
import { buildCardDataset } from "./snapshot.js";
import { fixtureBytes, fixtureDescriptor } from "./test-helpers.js";

async function snapshot() {
  return buildCardDataset(
    [
      {
        descriptor: fixtureDescriptor("oracle_cards"),
        bytes: await fixtureBytes("oracle-cards.json"),
      },
      {
        descriptor: fixtureDescriptor("default_cards"),
        bytes: await fixtureBytes("default-cards.json"),
      },
    ],
    "2026-08-21T01:00:00.000Z",
  ).snapshot;
}

describe("CardCatalog", () => {
  it("resolves Kenessos to one correct Oracle identity", async () => {
    const catalog = new CardCatalog(await snapshot());
    const matches = catalog.findOracleByName("  KENESSOS, PRIEST OF THASSA ");

    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      oracleId: "45b3a028-5705-4dc8-bfab-04bb5e01eea6",
      manaCost: "{1}{U}",
      manaValue: 2,
      typeLine: "Legendary Creature — Merfolk Cleric",
      colorIdentity: ["G", "U"],
      legalities: { commander: "legal" },
    });
    expect(matches[0]?.oracleText).toContain(
      "Kraken, Leviathan, Octopus, or Serpent",
    );
  });

  it("looks up printings by Scryfall and collector identifiers", async () => {
    const catalog = new CardCatalog(await snapshot());

    expect(
      catalog.findPrintingByScryfallId(
        "0ba97da8-0106-4e8b-b58b-8f2d63e3d618",
      ),
    ).toMatchObject({ setCode: "j22", collectorNumber: "13" });
    expect(catalog.findPrintingByCollector("J22", "13")).toMatchObject({
      name: "Kenessos, Priest of Thassa",
    });
  });
});
