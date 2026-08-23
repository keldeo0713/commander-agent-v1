import { describe, expect, it } from "vitest";
import { CANDIDATE_RANKING_VERSION, rankCardCandidates, type CardCandidate } from "./card-candidate-retriever.js";

describe("candidate ranking", () => {
  it("ranks role and selected-mechanic evidence ahead of a query-only match", () => {
    const ranked = rankCardCandidates([
      card("generic", "Generic Card", 3, "Creature", "Flying"),
      card("synergy", "Token Engine", 3, "Enchantment", "Whenever you attack, create a 1/1 creature token."),
    ], "primary-engine", ["tokens"]);
    expect(ranked.map(({ oracleId }) => oracleId)).toEqual(["synergy", "generic"]);
    expect(ranked[0]).toMatchObject({ rank: 1, rankScore: 37, rankingVersion: CANDIDATE_RANKING_VERSION });
    expect(ranked[0]?.rankingEvidence).toEqual(["+20 primary-engine text signal", "+12 tokens mechanic signal", "+5 primary-engine mana-value fit"]);
  });

  it("is invariant to provider order and mechanic order", () => {
    const candidates = [card("b", "Beta", 2, "Instant", "Counter target spell."), card("a", "Alpha", 2, "Instant", "Counter target spell.")];
    const forward = rankCardCandidates(candidates, "interaction", ["spells", "top-deck"]);
    const reverse = rankCardCandidates([...candidates].reverse(), "interaction", ["top-deck", "spells", "spells"]);
    expect(reverse).toEqual(forward);
    expect(forward.map(({ name, rank }) => [name, rank])).toEqual([["Alpha", 1], ["Beta", 2]]);
  });

  it("uses role-specific mana-value fit without claiming optimality", () => {
    const low = card("low", "Small Answer", 2, "Instant", "Counter target spell.");
    const high = card("high", "Large Answer", 5, "Instant", "Counter target spell.");
    expect(rankCardCandidates([high, low], "interaction", [])[0]?.oracleId).toBe("low");
    expect(rankCardCandidates([low, high], "payoffs-finishers", [])[0]?.oracleId).toBe("high");
  });
});

function card(oracleId: string, name: string, manaValue: number, typeLine: string, oracleText: string): CardCandidate {
  return { oracleId, name, manaValue, typeLine, oracleText, colorIdentity: ["U"], roleId: "fixture", evidence: "query fixture", rank: 0, rankScore: 0, rankingEvidence: [], rankingVersion: CANDIDATE_RANKING_VERSION, sourceId: "scryfall-search-api/1" };
}
