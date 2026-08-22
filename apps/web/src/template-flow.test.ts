import { describe, expect, it } from "vitest";
import { createTemplatePlan, mapCustomMechanic, type MechanicOption } from "./template-flow.js";

const mechanic: MechanicOption = { id: "top-deck", name: "Top-deck manipulation", components: ["card-selection", "top-deck-setup"], source: "curated" };

describe("template-first product flow", () => {
  it("maps free-form ideas to registered gameplay components", () => {
    expect(mapCustomMechanic("graveyard value")?.components).toEqual(["graveyard-setup", "recursion", "payoff"]);
    expect(mapCustomMechanic("make every creature wear a silly hat")).toBeNull();
  });

  it("requires commander, mechanics, and exactly 100 template slots", () => {
    expect(() => createTemplatePlan({ commanderName: "", bracket: 3, mechanics: [mechanic], slots: [{ quantity: 100, function: "ALL", objective: "", selectionRule: "" }] })).toThrow("commander");
    expect(() => createTemplatePlan({ commanderName: "Kenessos", bracket: 3, mechanics: [mechanic], slots: [{ quantity: 99, function: "ALL", objective: "", selectionRule: "" }] })).toThrow("exactly 100");
    expect(createTemplatePlan({ commanderName: "Kenessos", bracket: 3, mechanics: [mechanic], slots: [{ quantity: 100, function: "ALL", objective: "", selectionRule: "" }] }).totalCards).toBe(100);
  });
});
