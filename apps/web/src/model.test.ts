import { describe, expect, it } from "vitest";
import { initialWorkspaceState, JobController, reduceWorkspace } from "./model.js";

describe("workspace", () => {
  it("moves through spec, progress, results, and comparison", () => {
    let state = reduceWorkspace(initialWorkspaceState, { type: "spec_loaded", spec: { commander: "reference" } });
    state = reduceWorkspace(state, { type: "job_started", jobId: "job-1" });
    state = reduceWorkspace(state, { type: "job_progress", jobId: "job-1", progress: 0.6, message: "Simulating" });
    state = reduceWorkspace(state, { type: "job_finished", jobId: "job-1", versionId: "v1" });
    state = reduceWorkspace(state, { type: "compare", leftVersionId: "v0", rightVersionId: "v1" });
    expect(state.activePanel).toBe("comparison");
    expect(state.comparisonVersionIds).toEqual(["v0", "v1"]);
    expect(state.job.status).toBe("completed");
  });

  it("ignores stale job events", () => {
    const running = reduceWorkspace(initialWorkspaceState, { type: "job_started", jobId: "current" });
    expect(reduceWorkspace(running, { type: "job_progress", jobId: "old", progress: 1, message: "stale" })).toBe(running);
  });

  it("aborts a running job through the port signal", async () => {
    let aborted = false;
    const controller = new JobController({
      start: (_request, signal) => new Promise<string>((_resolve, reject) => {
        signal.addEventListener("abort", () => { aborted = true; reject(new Error("aborted")); });
      }),
    });
    const pending = controller.start("build", () => undefined);
    controller.cancel();
    await expect(pending).rejects.toThrow("aborted");
    expect(aborted).toBe(true);
  });
});
