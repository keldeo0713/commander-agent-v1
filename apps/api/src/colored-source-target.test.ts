import { describe, expect, it } from "vitest";
import { calculateColoredSourceTargets, probabilityAtLeast } from "./colored-source-target.js";

describe("colored source targets", () => {
  it("uses exact hypergeometric probabilities", () => {
    expect(probabilityAtLeast(99, 0, 10, 1)).toBe(0);
    expect(probabilityAtLeast(99, 99, 10, 1)).toBe(1);
    expect(probabilityAtLeast(99, 20, 10, 1)).toBeGreaterThan(probabilityAtLeast(99, 10, 10, 1));
  });
  it("finds the hardest turn-aware requirement per color", () => {
    const report = calculateColoredSourceTargets([{ name: "Early", manaCost: "{U}{U}", manaValue: 2 }, { name: "Later", manaCost: "{3}{G}", manaValue: 4 }], ["U", "G"], { U: 30, G: 5 }, 0.8);
    expect(report.targets.find(({ color }) => color === "U")).toMatchObject({ targetTurn: 2, coloredPips: 2, status: "met" });
    expect(report.targets.find(({ color }) => color === "G")?.status).toBe("short");
    expect(report.assumptions).toContain("no mulligans, ramp, filtering, treasures, or tapped-source timing");
  });
  it("omits colors with no selected-card demand", () => {
    expect(calculateColoredSourceTargets([], ["U", "G"], {}).targets).toEqual([]);
  });
});
