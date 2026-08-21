import { describe, expect, it, vi } from "vitest";

import {
  compileDeckRequest,
  type DeckSpecDraftGenerator,
} from "./compiler.js";
import type { DeckSpec } from "./types.js";
import { validateDeckSpec } from "./validator.js";

function kenessosSpec(): DeckSpec {
  return {
    schemaVersion: "deck-spec/1",
    commander: {
      oracleId: "45b3a028-5705-4dc8-bfab-04bb5e01eea6",
      name: "Kenessos, Priest of Thassa",
    },
    format: {
      name: "commander",
      snapshotId: "commander-2026-02-09",
      gameChangerPolicy: { mode: "max-count", value: 3 },
    },
    hardConstraints: {
      budgetUsd: null,
      lockedOracleIds: [],
      excludedOracleIds: [],
      ownedOnly: false,
    },
    guardrails: {
      minLands: 35,
      minInteraction: 8,
      minThemeScore: 0.65,
    },
    objectives: [
      {
        definitionId: "commander-cheat-eligible-creature-by-turn/1",
        weight: 1,
        parameters: {
          commanderOracleId: "45b3a028-5705-4dc8-bfab-04bb5e01eea6",
          deadlineTurn: 4,
          minimumManaValue: 6,
          eligibleCreatureTypes: ["Kraken", "Leviathan", "Octopus", "Serpent"],
        },
      },
    ],
    continuation: {
      requirements: [
        "repeatable-engine-or-second-threat",
        "commander-protection-or-recovery",
        "sufficient-mana-and-card-access",
      ],
      minimumDeclaredWinPaths: 1,
      winPaths: [],
    },
    preferences: {
      themes: ["fishing", "ocean", "sea monsters"],
      mechanics: ["scry", "top-deck manipulation"],
      avoid: [],
    },
    scenario: {
      model: "commander-removal-stress-v1",
      onPlay: true,
      mulliganPolicyId: "goal-aware-london-v1",
      diagnosticGoldfishBaseline: true,
      opponentInteraction: {
        commanderRemoval: { enabled: true, profile: "moderate-v1" },
      },
    },
    inferences: [
      {
        path: "/guardrails/minThemeScore",
        reason: "Defaulted because the user requested a strongly themed deck",
      },
      {
        path: "/continuation/minimumDeclaredWinPaths",
        reason: "Approved product default requires a credible continuation path",
      },
    ],
  };
}

describe("DeckSpec compiler", () => {
  it("compiles the approved Kenessos request without changing constraint classes", async () => {
    const spec = kenessosSpec();
    const generate = vi.fn<DeckSpecDraftGenerator["generate"]>(async () => spec);
    const result = await compileDeckRequest(
      {
        request: "Build a fishing-themed Kenessos deck using top-deck manipulation with the highest practical chance to hit a large creature by turn 4.",
        resolvedCommander: spec.commander,
        formatSnapshotId: spec.format.snapshotId,
      },
      { generatorId: "fixture-generator/1", generate },
    );

    expect(result).toEqual({ status: "compiled", spec, issues: [] });
    expect(generate.mock.calls[0]?.[0]).toMatchObject({
      approvedDefaults: {
        maximumGameChangers: 3,
        minimumEligibleManaValue: 6,
        commanderRemovalScenario: true,
        minimumDeclaredWinPaths: 1,
      },
    });
    expect(spec.hardConstraints).not.toHaveProperty("minThemeScore");
    expect(spec.guardrails).toHaveProperty("minThemeScore", 0.65);
  });

  it("requires clarification when the commander is unresolved", async () => {
    const generate = vi.fn<DeckSpecDraftGenerator["generate"]>();
    const result = await compileDeckRequest(
      {
        request: "Build me a sea monster deck",
        resolvedCommander: null,
        formatSnapshotId: "commander-2026-02-09",
      },
      { generatorId: "unused", generate },
    );
    expect(result.status).toBe("clarification_required");
    expect(generate).not.toHaveBeenCalled();
  });

  it("returns unsupported when a generator invents an executable metric", async () => {
    const spec = kenessosSpec();
    spec.objectives[0] = {
      definitionId: "subjective-fun-probability/1",
      weight: 1,
      parameters: {},
    };
    const result = await compileDeckRequest(
      {
        request: "Make it objectively fun",
        resolvedCommander: spec.commander,
        formatSnapshotId: spec.format.snapshotId,
      },
      { generatorId: "fixture-generator/1", generate: async () => spec },
    );
    expect(result.status).toBe("unsupported");
  });
});

describe("DeckSpec validation", () => {
  it("accepts the approved reference specification", () => {
    expect(validateDeckSpec(kenessosSpec())).toEqual([]);
  });

  it("reports conflicts and hidden-invalid assumptions structurally", () => {
    const spec = kenessosSpec();
    spec.hardConstraints.lockedOracleIds = ["same-card"];
    spec.hardConstraints.excludedOracleIds = ["same-card"];
    spec.guardrails.minThemeScore = 2;
    spec.scenario.opponentInteraction.commanderRemoval.enabled = false;
    expect(validateDeckSpec(spec).map((item) => item.code)).toEqual([
      "constraint_conflict",
      "invalid_constraint",
      "scenario_missing",
    ]);
  });
});
