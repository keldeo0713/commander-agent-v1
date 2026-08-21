import { describe, expect, it } from "vitest";
import { Adviser, type AdviserPorts, type AdviserSpec } from "./adviser.js";

const fact = { kind: "card_fact" as const, sourceId: "dataset/card-a" };
const run = { kind: "simulation" as const, sourceId: "run/1" };
function ports(explanationEvidence = [fact, run]): AdviserPorts {
  return {
    compile: () => Promise.resolve({ status: "compiled", spec: { commanderOracleId: "commander", lockedOracleIds: [], excludedOracleIds: [], values: { turn: 4 } } }),
    retrieve: () => Promise.resolve({ candidateOracleIds: ["card-a", "card-b"], evidence: [fact] }),
    build: (spec, candidates) => Promise.resolve({ status: "built", oracleIds: [spec.commanderOracleId, ...candidates.filter((id) => !spec.excludedOracleIds.includes(id)), ...spec.lockedOracleIds] }),
    evaluate: (_spec, oracleIds) => Promise.resolve({ metrics: { primary: oracleIds.includes("card-a") ? 0.6 : 0.4 }, evidence: [run] }),
    explain: () => Promise.resolve([{ claim: "Card A improves the measured plan.", evidence: explanationEvidence }]),
  };
}

describe("adviser", () => {
  it("completes request-to-version and immutable revision flows", async () => {
    const adviser = new Adviser(ports(), () => "2026-08-21T00:00:00.000Z");
    const initial = await adviser.build("Build a Commander deck");
    expect(initial.status).toBe("complete");
    if (initial.status !== "complete") return;
    const revised = await adviser.revise(initial.version.versionId, { kind: "exclude", oracleId: "card-a" });
    expect(revised.status).toBe("complete");
    if (revised.status !== "complete") return;
    expect(revised.version.parentVersionId).toBe(initial.version.versionId);
    expect(revised.version.versionId).not.toBe(initial.version.versionId);
    expect(initial.version.spec.excludedOracleIds).toEqual([]);
    expect(revised.version.spec.excludedOracleIds).toEqual(["card-a"]);
    expect(adviser.compare(initial.version.versionId, revised.version.versionId)?.metricDelta.primary).toBeCloseTo(-0.2);
  });

  it("rejects explanations that cite evidence absent from retrieval and runs", async () => {
    const adviser = new Adviser(ports([{ kind: "card_fact", sourceId: "model-memory" }]));
    expect(await adviser.build("unsupported evidence")).toEqual({ status: "failed", reasons: ["explanation contains an unbound evidence reference"] });
  });

  it("passes clarification through without executing downstream ports", async () => {
    let retrieved = false;
    const base = ports();
    const adviser = new Adviser({ ...base, compile: () => Promise.resolve({ status: "clarification", questions: ["Which commander?"] }), retrieve: (spec: AdviserSpec) => { retrieved = true; return base.retrieve(spec); } });
    expect(await adviser.build("make a deck")).toEqual({ status: "clarification", questions: ["Which commander?"] });
    expect(retrieved).toBe(false);
  });
});
