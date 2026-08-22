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
});
