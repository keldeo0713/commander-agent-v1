import { describe, expect, it } from "vitest";
import { planManaBase } from "./mana-base-planner.js";
import type { OptimizedTemplate } from "./template-orchestrator.js";

describe("mana-base planner", () => {
  it.each([
    [[], "Wastes"], [["W"], "Plains"], [["G", "U"], "Island"], [["W", "U", "B", "R", "G"], "Plains"],
  ])("creates an exact identity-aware 37-land template for %j", (colors, expectedBasic) => {
    const plan = planManaBase(template(colors));
    expect(plan.entries.reduce((sum, entry) => sum + entry.quantity, 0)).toBe(37);
    expect(plan.entries.some(({ cardName }) => cardName === expectedBasic)).toBe(true);
    expect(plan.entries.filter(({ cardName }) => cardName).every(({ cardName }) => cardName === "Wastes" || colors.includes(colorForBasic(cardName!)))).toBe(true);
  });

  it("is invariant to duplicate and reordered commander colors", () => {
    expect(planManaBase(template(["U", "G", "U"]))).toEqual(planManaBase(template(["G", "U"])));
  });

  it("keeps unnamed nonbasic slots visible instead of inventing a deck list", () => {
    const plan = planManaBase(template(["G", "U"]));
    const fixing = plan.entries.find(({ category }) => category === "fixing");
    expect(fixing).toMatchObject({ quantity: 10 });
    expect(fixing).not.toHaveProperty("cardName");
    expect(plan.namedCardQuantity).toBe(23);
  });
});

function template(colorIdentity: string[]): OptimizedTemplate {
  return { schemaVersion: "functional-template/1", commander: { oracleId: "cmd", name: "Fixture", colorIdentity }, bracket: 3, mechanics: [], slots: [{ quantity: 1, roleId: "commander", objective: "x", selectionRule: "x" }, { quantity: 37, roleId: "mana-base", objective: "x", selectionRule: "x" }, { quantity: 62, roleId: "primary-engine", objective: "x", selectionRule: "x" }] };
}
function colorForBasic(name: string): string { return ({ Plains: "W", Island: "U", Swamp: "B", Mountain: "R", Forest: "G" } as Record<string, string>)[name] ?? "C"; }
