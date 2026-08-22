import { describe, expect, it } from "vitest";
import { exportArchidektText, parseDeckList, type PortableDeck } from "./decklist.js";

function deck(): PortableDeck {
  return {
    name: "Reference deck",
    commanders: [{ oracleId: "commander", name: "Reference Commander", quantity: 1 }],
    cards: Array.from({ length: 99 }, (_, index) => ({ oracleId: `card-${index}`, name: `Card ${String(index).padStart(2, "0")}`, quantity: 1 })),
  };
}

describe("portable deck lists", () => {
  it("exports a complete importer-safe list without comments", () => {
    const source = deck();
    const text = exportArchidektText(source);
    const parsed = parseDeckList(text);
    expect(parsed.issues).toEqual([]);
    expect(text).not.toContain("//");
    expect(text).not.toContain("#");
    expect(parsed.entries.reduce((sum, entry) => sum + entry.quantity, 0)).toBe(100);
    expect(new Set(parsed.entries.map((entry) => entry.name))).toEqual(new Set([...source.commanders, ...source.cards].map((entry) => entry.name)));
  });

  it("accepts set and collector suffixes from common deck-list exports", () => {
    const parsed = parseDeckList("// COMMANDER\n1 Kenessos, Priest of Thassa (J22) 12\n\n// DECK\n1 Island (FDN) 275");
    expect(parsed.issues).toEqual([]);
    expect(parsed.entries.map((entry) => entry.name)).toEqual(["Kenessos, Priest of Thassa", "Island"]);
  });

  it("rejects incomplete exports before data loss", () => {
    const source = deck();
    source.cards.pop();
    expect(() => exportArchidektText(source)).toThrow("exactly 100");
  });
});
