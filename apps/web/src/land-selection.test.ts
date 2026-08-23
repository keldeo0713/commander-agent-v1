import { describe, expect, it } from "vitest";
import { createLandSelection, selectedLandNames, toggleLandSelection, validateColoredSources, type LandOptionBundle, type ManaPlanView } from "./land-selection.js";

const bundle: LandOptionBundle = { candidates: [
  { oracleId: "dual", name: "Dual", producedMana: ["G", "U"], category: "fixing" },
  { oracleId: "utility", name: "Utility", producedMana: ["C"], category: "utility" },
  { oracleId: "second", name: "Second Dual", producedMana: ["G", "U"], category: "fixing" },
] };
const plan: ManaPlanView = { colorIdentity: ["U", "G"], colorDemand: { U: 2, G: 3 }, entries: [
  { quantity: 12, category: "basic", cardName: "Island" }, { quantity: 11, category: "basic", cardName: "Forest" }, { quantity: 1, category: "fixing" }, { quantity: 1, category: "utility" },
] };

describe("player land selection", () => {
  it("toggles known lands with deterministic singleton identity", () => {
    let state = toggleLandSelection(createLandSelection(), bundle, plan, "dual");
    expect(state.selectedOracleIds).toEqual(["dual"]);
    state = toggleLandSelection(state, bundle, plan, "dual");
    expect(state.selectedOracleIds).toEqual([]);
    expect(() => toggleLandSelection(state, bundle, plan, "missing")).toThrow("not present");
  });
  it("does not exceed fixing or utility slot capacities", () => {
    const state = toggleLandSelection(createLandSelection(), bundle, plan, "dual");
    expect(() => toggleLandSelection(state, bundle, plan, "second")).toThrow("already covered");
  });
  it("counts named colored sources without claiming cast-on-curve sufficiency", () => {
    const state = toggleLandSelection(createLandSelection(), bundle, plan, "dual");
    expect(validateColoredSources(state, bundle, plan)).toMatchObject({ colors: [{ color: "U", demandPips: 2, namedSources: 13, status: "present" }, { color: "G", demandPips: 3, namedSources: 12, status: "present" }] });
    expect(validateColoredSources(state, bundle, plan).limitation).toContain("Presence validation only");
    expect(selectedLandNames(state, bundle)).toEqual(["Dual"]);
  });
});
