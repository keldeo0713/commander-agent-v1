import { describe, expect, it } from "vitest";
import { assessCoverage, GOALS, REGRESSIONS, type Primitive } from "./generalization.js";

describe("generalization suite", () => {
  it("covers at least five materially different archetypes", () => {
    expect(new Set(REGRESSIONS.map((fixture) => fixture.archetype)).size).toBeGreaterThanOrEqual(5);
    expect(new Set(REGRESSIONS.map((fixture) => fixture.goalId)).size).toBe(REGRESSIONS.length);
    expect(REGRESSIONS.every((fixture) => GOALS.some((goal) => goal.goalId === fixture.goalId && goal.archetype === fixture.archetype))).toBe(true);
  });

  it("executes only goals whose required primitives are implemented", () => {
    const implemented = new Set<Primitive>(["draw", "scry", "topdeck_reveal", "creature_cheat"]);
    const topdeck = GOALS.find((goal) => goal.archetype === "topdeck_cheat");
    const graveyard = GOALS.find((goal) => goal.archetype === "graveyard_recursion");
    expect(topdeck && assessCoverage(topdeck, implemented)).toMatchObject({ supported: true, behavior: "execute", unsupportedPrimitives: [] });
    expect(graveyard && assessCoverage(graveyard, implemented)).toMatchObject({ supported: false, behavior: "report_unsupported", unsupportedPrimitives: ["graveyard_move", "graveyard_cast"] });
  });

  it("keeps Kenessos to one regression fixture with no schema specialization", () => {
    expect(REGRESSIONS.filter((fixture) => fixture.commanderName.includes("Kenessos"))).toHaveLength(1);
    expect(GOALS.some((goal) => JSON.stringify(goal).includes("Kenessos"))).toBe(false);
  });
});
