import { describe, expect, it } from "vitest";
import { createCandidateSelection, decideCandidate, exportCandidateSelection, reconcileCandidateSelection, summarizeRoleCoverage, type CandidateBundleView } from "./candidate-selection.js";

const bundle: CandidateBundleView = { commanderOracleId: "cmd", roles: [
  { roleId: "ramp", requiredQuantity: 2, candidates: [{ oracleId: "a", name: "Alpha" }, { oracleId: "b", name: "Beta" }, { oracleId: "c", name: "Gamma" }] },
  { roleId: "interaction", requiredQuantity: 1, candidates: [{ oracleId: "x", name: "Answer" }, { oracleId: "a", name: "Alpha" }] },
] };

describe("player candidate selection", () => {
  it("tracks mutually exclusive include/exclude decisions and exact role coverage", () => {
    let state = createCandidateSelection();
    state = decideCandidate(state, bundle, { roleId: "ramp", oracleId: "a" }, "included");
    state = decideCandidate(state, bundle, { roleId: "ramp", oracleId: "b" }, "excluded");
    state = decideCandidate(state, bundle, { roleId: "ramp", oracleId: "b" }, "included");
    expect(summarizeRoleCoverage(state, bundle)[0]).toEqual({ roleId: "ramp", requiredQuantity: 2, includedQuantity: 2, remainingQuantity: 0, excludedQuantity: 0, status: "covered" });
    expect(() => decideCandidate(state, bundle, { roleId: "ramp", oracleId: "c" }, "included")).toThrow("already covered");
  });

  it("rejects cards outside the inspected role pool", () => {
    expect(() => decideCandidate(createCandidateSelection(), bundle, { roleId: "ramp", oracleId: "x" }, "included")).toThrow("not present");
  });

  it("persists available decisions and prunes stale ones after refresh", () => {
    let state = decideCandidate(createCandidateSelection(), bundle, { roleId: "ramp", oracleId: "a" }, "included");
    state = decideCandidate(state, bundle, { roleId: "interaction", oracleId: "x" }, "excluded");
    const refreshed: CandidateBundleView = { ...bundle, roles: [{ ...bundle.roles[0]!, candidates: [{ oracleId: "a", name: "Alpha" }, { oracleId: "c", name: "Gamma" }] }, { ...bundle.roles[1]!, candidates: [] }] };
    expect(reconcileCandidateSelection(state, refreshed).decisions).toEqual([{ roleId: "ramp", oracleId: "a", decision: "included" }]);
  });

  it("enforces singleton choices across roles and exports importer-safe lines", () => {
    let state = decideCandidate(createCandidateSelection(), bundle, { roleId: "ramp", oracleId: "a" }, "included");
    expect(() => decideCandidate(state, bundle, { roleId: "interaction", oracleId: "a" }, "included")).toThrow("another role");
    state = decideCandidate(state, bundle, { roleId: "interaction", oracleId: "x" }, "included");
    expect(exportCandidateSelection(state, bundle, "Test Commander")).toBe("1 Test Commander\n1 Alpha\n1 Answer");
    expect(exportCandidateSelection(state, bundle, "Test Commander")).not.toContain("#");
  });
});
