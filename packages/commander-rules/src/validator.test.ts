import { describe, expect, it } from "vitest";

import { COMMANDER_FORMAT_2026_02_09 } from "./format.js";
import type { CommanderCardView, CommanderDeck } from "./types.js";
import { validateCommanderDeck } from "./validator.js";

function card(
  oracleId: string,
  name: string,
  overrides: Partial<CommanderCardView> = {},
): CommanderCardView {
  return {
    oracleId,
    name,
    typeLine: "Artifact",
    oracleText: null,
    colorIdentity: [],
    keywords: [],
    commanderLegality: "legal",
    copyLimit: null,
    ...overrides,
  };
}

const kenessos = card("kenessos", "Kenessos, Priest of Thassa", {
  typeLine: "Legendary Creature — Merfolk Cleric",
  colorIdentity: ["U", "G"],
});
const island = card("island", "Island", {
  typeLine: "Basic Land — Island",
  colorIdentity: ["U"],
});
const forest = card("forest", "Forest", {
  typeLine: "Basic Land — Forest",
  colorIdentity: ["G"],
});
const catalog = new Map<string, CommanderCardView>([
  [kenessos.oracleId, kenessos],
  [island.oracleId, island],
  [forest.oracleId, forest],
]);

function deck(cards: CommanderDeck["cards"]): CommanderDeck {
  return { commanders: [kenessos.oracleId], cards };
}

describe("Commander legality", () => {
  it("accepts a generic legal Kenessos fixture", () => {
    const result = validateCommanderDeck(
      deck([
        { oracleId: "kenessos", quantity: 1 },
        { oracleId: "island", quantity: 50 },
        { oracleId: "forest", quantity: 49 },
      ]),
      catalog,
      COMMANDER_FORMAT_2026_02_09,
    );

    expect(result.legal).toBe(true);
    expect(result.commanderColorIdentity).toEqual(["G", "U"]);
  });

  it.each([
    {
      label: "off-color",
      extra: card("mountain", "Mountain", {
        typeLine: "Basic Land — Mountain",
        colorIdentity: ["R"],
      }),
      entries: [
        { oracleId: "kenessos", quantity: 1 },
        { oracleId: "island", quantity: 49 },
        { oracleId: "forest", quantity: 49 },
        { oracleId: "mountain", quantity: 1 },
      ],
      code: "color_identity",
    },
    {
      label: "duplicate",
      extra: card("sol-ring", "Sol Ring"),
      entries: [
        { oracleId: "kenessos", quantity: 1 },
        { oracleId: "island", quantity: 48 },
        { oracleId: "forest", quantity: 49 },
        { oracleId: "sol-ring", quantity: 2 },
      ],
      code: "singleton",
    },
    {
      label: "banned",
      extra: card("ancestral", "Ancestral Recall", { colorIdentity: ["U"] }),
      entries: [
        { oracleId: "kenessos", quantity: 1 },
        { oracleId: "island", quantity: 49 },
        { oracleId: "forest", quantity: 49 },
        { oracleId: "ancestral", quantity: 1 },
      ],
      code: "banned_card",
    },
  ])("rejects the Kenessos $label case", ({ extra, entries, code }) => {
    const cards = new Map(catalog);
    cards.set(extra.oracleId, extra);
    const result = validateCommanderDeck(
      deck(entries),
      cards,
      COMMANDER_FORMAT_2026_02_09,
    );
    expect(result.legal).toBe(false);
    expect(result.violations.map((item) => item.code)).toContain(code);
  });

  it("rejects a 99-card Kenessos deck", () => {
    const result = validateCommanderDeck(
      deck([
        { oracleId: "kenessos", quantity: 1 },
        { oracleId: "island", quantity: 49 },
        { oracleId: "forest", quantity: 49 },
      ]),
      catalog,
      COMMANDER_FORMAT_2026_02_09,
    );
    expect(result.violations.map((item) => item.code)).toContain("deck_size");
  });

  it("supports explicit copy-limit and partner construction exceptions", () => {
    const first = card("p1", "Partner One", {
      typeLine: "Legendary Creature — Human",
      colorIdentity: ["U"],
      keywords: ["Partner"],
    });
    const second = card("p2", "Partner Two", {
      typeLine: "Legendary Creature — Elf",
      colorIdentity: ["G"],
      keywords: ["Partner"],
    });
    const petitioners = card("petitioners", "Persistent Petitioners", {
      colorIdentity: ["U"],
      copyLimit: "unlimited",
    });
    const cards = new Map<string, CommanderCardView>([
      [first.oracleId, first], [second.oracleId, second],
      [petitioners.oracleId, petitioners], [forest.oracleId, forest],
    ]);
    const result = validateCommanderDeck(
      {
        commanders: [first.oracleId, second.oracleId],
        cards: [
          { oracleId: first.oracleId, quantity: 1 },
          { oracleId: second.oracleId, quantity: 1 },
          { oracleId: petitioners.oracleId, quantity: 50 },
          { oracleId: forest.oracleId, quantity: 48 },
        ],
      },
      cards,
      COMMANDER_FORMAT_2026_02_09,
    );
    expect(result.legal).toBe(true);
  });
});
