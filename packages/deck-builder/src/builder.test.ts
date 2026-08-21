import { describe, expect, it } from "vitest";
import { buildBaseline } from "./builder.js";
import type { BuildCandidate, BuildConstraints } from "./types.js";

function candidates(): BuildCandidate[] {
  return Array.from({ length: 110 }, (_, index) => ({
    oracleId: `card-${String(index).padStart(3, "0")}`,
    roles: index < 38 ? ["land"] : index < 50 ? ["interaction"] : index < 60 ? ["continuation", "payoff"] : ["support"],
    score: 110 - index,
    legal: true,
    gameChanger: index >= 38 && index < 40,
  }));
}
function constraints(): BuildConstraints {
  return {
    deckSize: 100, commanderOracleIds: ["commander"], lockedOracleIds: ["card-001"],
    excludedOracleIds: [], minimumByRole: { land: 35, interaction: 8, continuation: 1 },
    maximumGameChangers: 3, minimumWinPaths: 1, declaredWinPathIds: ["combat-damage"],
  };
}

describe("baseline builder", () => {
  it("constructs a deterministic constrained 100-card deck", () => {
    const first = buildBaseline(candidates(), constraints());
    const second = buildBaseline(candidates(), constraints());
    expect(first).toEqual(second);
    expect(first.status).toBe("built");
    if (first.status === "built") {
      expect(first.deck.oracleIds).toHaveLength(99);
      expect(first.deck.roleCounts.land).toBeGreaterThanOrEqual(35);
      expect(first.deck.roleCounts.interaction).toBeGreaterThanOrEqual(8);
      expect(first.deck.roleCounts.continuation).toBeGreaterThanOrEqual(1);
      expect(first.deck.declaredWinPathIds).toEqual(["combat-damage"]);
    }
  });

  it("reports impossible requirements instead of relaxing them", () => {
    const request = constraints();
    request.minimumByRole.interaction = 99;
    request.declaredWinPathIds = [];
    const result = buildBaseline(candidates(), request);
    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.failures.map((failure) => failure.code)).toContain("role_minimum_unreachable");
      expect(result.failures.map((failure) => failure.code)).toContain("continuation_missing");
    }
  });
});
