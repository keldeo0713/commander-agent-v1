import { describe, expect, it } from "vitest";
import { validatePlayerDeck } from "./player-deck-validator.js";

const base = { commander: { oracleId: "cmd", name: "Commander" }, roles: [{ roleId: "engine", requiredQuantity: 2 }], cards: [{ oracleId: "a", name: "A", roleId: "engine" }, { oracleId: "b", name: "B", roleId: "engine" }], manaBase: { totalLands: 97, entries: [{ quantity: 95, category: "basic" as const, cardName: "Island" }, { quantity: 1, category: "fixing" as const }, { quantity: 1, category: "utility" as const }] }, lands: [{ oracleId: "f", name: "F", category: "fixing" as const }, { oracleId: "u", name: "U", category: "utility" as const }] };

describe("player deck validation", () => {
  it("accepts an exactly named, role-covered 100-card list", () => expect(validatePlayerDeck(base)).toMatchObject({ complete: true, cardQuantity: 100, violations: [] }));
  it("reports role, land, and size gaps", () => expect(validatePlayerDeck({ ...base, cards: base.cards.slice(0, 1), lands: [] }).violations.map(({ code }) => code)).toEqual(["role_coverage", "land_coverage", "land_coverage", "deck_size"]));
  it("rejects singleton collisions across card kinds", () => expect(validatePlayerDeck({ ...base, lands: [{ ...base.lands[0]!, oracleId: "a" }, base.lands[1]!] }).violations).toContainEqual(expect.objectContaining({ code: "singleton" })));
});
