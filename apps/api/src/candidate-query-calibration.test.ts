import { describe, expect, it } from "vitest";
import { buildCandidateQueryPlan } from "./card-candidate-retriever.js";
import type { MechanicCandidate, OptimizedTemplate } from "./template-orchestrator.js";

const archetypes = [
  { commander: "Kenessos, Priest of Thassa", mechanics: ["top-deck", "big-creatures"], engineMarker: "look at the top", payoffMarker: "mv>=5" },
  { commander: "Muldrotha, the Gravetide", mechanics: ["graveyard"], engineMarker: "graveyard", payoffMarker: "graveyard" },
  { commander: "Veyran, Voice of Duality", mechanics: ["spells"], engineMarker: "instant", payoffMarker: "magecraft" },
  { commander: "Rhys the Redeemed", mechanics: ["tokens"], engineMarker: "token", payoffMarker: "tokens you control" },
  { commander: "Urza, Lord High Artificer", mechanics: ["artifacts"], engineMarker: "artifact", payoffMarker: "artifacts you control" },
  { commander: "Wyleth, Soul of Steel", mechanics: ["combat"], engineMarker: "equipment", payoffMarker: "combat damage" },
] as const;

describe("candidate query calibration", () => {
  it("produces differentiated engine and payoff plans for six frozen archetypes", () => {
    for (const roleId of ["primary-engine", "payoffs-finishers"]) {
      const plans = archetypes.map(({ commander, mechanics, engineMarker, payoffMarker }) => {
        const plan = buildCandidateQueryPlan(template(commander, [...mechanics]), roleId);
        expect(plan?.query.toLowerCase()).toContain(roleId === "primary-engine" ? engineMarker : payoffMarker);
        expect(plan?.evidence).toContain("matched selected mechanics");
        return plan;
      });
      expect(new Set(plans.map((plan) => plan?.queryId)).size).toBe(archetypes.length);
      expect(new Set(plans.map((plan) => plan?.query)).size).toBe(archetypes.length);
    }
  });

  it("is invariant to mechanic order and commander identity", () => {
    const forward = buildCandidateQueryPlan(template("Fixture A", ["top-deck", "big-creatures"]), "primary-engine");
    const reverse = buildCandidateQueryPlan(template("Fixture B", ["big-creatures", "top-deck"]), "primary-engine");
    expect(reverse).toEqual(forward);
    expect(JSON.stringify(forward)).not.toMatch(/Kenessos|Muldrotha|Veyran|Rhys|Urza|Wyleth/i);
  });

  it("retains a versioned generic plan for support roles", () => {
    const plan = buildCandidateQueryPlan(template("Fixture", ["tokens"]), "interaction");
    expect(plan).toMatchObject({ queryId: "candidate-query-plan/1:interaction:generic", mechanicIds: [] });
  });
});

function template(commander: string, mechanicIds: string[]): OptimizedTemplate {
  const mechanics: MechanicCandidate[] = mechanicIds.map((id) => ({ id, name: id, componentIds: [`${id}-component`], reason: "fixture", provenanceId: "calibration/1" }));
  return {
    schemaVersion: "functional-template/1",
    commander: { oracleId: `${commander}-fixture`, name: commander, colorIdentity: ["U"] },
    bracket: 3,
    mechanics,
    slots: [],
  };
}
