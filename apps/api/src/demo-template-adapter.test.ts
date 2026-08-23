import { describe, expect, it } from "vitest";
import { demoTemplateOrchestrator } from "./demo-template-adapter.js";

describe("commander-linked demo mechanics", () => {
  it("ranks mechanics supported by authoritative commander text first", async () => {
    const result = await demoTemplateOrchestrator.start("Kenessos", 3);
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.mechanics.slice(0, 2).map(({ id }) => id)).toEqual(["top-deck", "big-creatures"]);
    expect(result.mechanics[0]?.reason).toContain("Kenessos");
    expect(result.commander).toMatchObject({ colorIdentity: ["G", "U"], sourceId: "cp-01-kenessos-fixture/1" });
  });

  it("keeps the optional example aligned when bracket and mechanics change quantities", async () => {
    const session = await demoTemplateOrchestrator.start("Kenessos", 5);
    if (session.status !== "ready") throw new Error("fixture commander did not resolve");
    const selected = session.mechanics.filter(({ id }) => ["top-deck", "big-creatures", "combat"].includes(id));
    const template = await demoTemplateOrchestrator.optimize(session.commander, 5, selected);
    const example = await demoTemplateOrchestrator.example(template);
    expect(example.reduce((sum, entry) => sum + entry.quantity, 0)).toBe(100);
    for (const slot of template.slots) expect(example.filter(({ roleId }) => roleId === slot.roleId).reduce((sum, entry) => sum + entry.quantity, 0)).toBe(slot.quantity);
  });
});
