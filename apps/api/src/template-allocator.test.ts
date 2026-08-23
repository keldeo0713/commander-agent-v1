import { describe, expect, it } from "vitest";
import { allocateTemplate } from "./template-allocator.js";
import type { CommanderBracket, MechanicCandidate } from "./template-orchestrator.js";

const mechanic = (id: string, name = id): MechanicCandidate => ({ id, name, componentIds: [`${id}-component`], reason: "selected", provenanceId: "taxonomy/1" });

describe("mechanic-aware template allocation", () => {
  it("produces exact deterministic templates for every bracket and mechanic combination", () => {
    const mechanics = ["top-deck", "big-creatures", "graveyard", "tokens", "artifacts", "spells", "lands", "combat"].map((id) => mechanic(id));
    for (const bracket of [1, 2, 3, 4, 5] as CommanderBracket[]) {
      for (let count = 1; count <= mechanics.length; count += 1) {
        const first = allocateTemplate(bracket, mechanics.slice(0, count));
        const second = allocateTemplate(bracket, [...mechanics.slice(0, count)].reverse());
        expect(first).toEqual(second);
        expect(first.reduce((sum, slot) => sum + slot.quantity, 0)).toBe(100);
        expect(first.find(({ roleId }) => roleId === "mana-base")?.quantity).toBe(37);
        expect(first.every(({ quantity }) => quantity > 0)).toBe(true);
      }
    }
  });

  it("changes quantities and exposes reasons when strategy or bracket changes", () => {
    const setup = allocateTemplate(3, [mechanic("top-deck", "Top-deck manipulation")]);
    const combat = allocateTemplate(3, [mechanic("combat", "Combat / Voltron")]);
    const highPower = allocateTemplate(5, [mechanic("top-deck", "Top-deck manipulation")]);
    expect(setup).not.toEqual(combat);
    expect(setup).not.toEqual(highPower);
    expect(setup.find(({ roleId }) => roleId === "primary-engine")?.selectionRule).toContain("Top-deck manipulation");
  });

  it("deduplicates repeated mechanic selections", () => {
    const selected = mechanic("tokens", "Tokens / go-wide");
    expect(allocateTemplate(2, [selected, selected])).toEqual(allocateTemplate(2, [selected]));
  });
});
