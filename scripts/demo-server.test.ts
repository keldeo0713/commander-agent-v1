import { describe, expect, it } from "vitest";
import { runSelfCheck } from "./demo-server.js";

describe("local demo server", () => {
  it("serves its health endpoint, terminal page, and interactive script", async () => {
    await expect(runSelfCheck()).resolves.toBeUndefined();
  });
});
