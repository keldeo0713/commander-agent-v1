import { describe, expect, it } from "vitest";
import { deriveOperationalTargets, JobCoordinator, scenarioFingerprint, type DurableJob, type DurableJobStore, type InteractionScenario } from "./operations.js";

class MemoryStore<T> implements DurableJobStore<T> {
  records = new Map<string, DurableJob<T>>();
  putIfAbsent(job: DurableJob<T>): Promise<boolean> { if (this.records.has(job.jobId)) return Promise.resolve(false); this.records.set(job.jobId, structuredClone(job)); return Promise.resolve(true); }
  get(id: string): Promise<DurableJob<T> | null> { return Promise.resolve(structuredClone(this.records.get(id) ?? null)); }
  compareAndSet(id: string, expected: DurableJob<T>["status"], next: DurableJob<T>): Promise<boolean> { if (this.records.get(id)?.status !== expected) return Promise.resolve(false); this.records.set(id, structuredClone(next)); return Promise.resolve(true); }
  list(): Promise<DurableJob<T>[]> { return Promise.resolve(structuredClone([...this.records.values()])); }
}

describe("operations", () => {
  it("fingerprints every explicit interaction assumption", () => {
    const scenario: InteractionScenario = { schemaVersion: "interaction-scenario/1", scenarioId: "moderate/1", commanderRemoval: { earliestTurn: 3, perTurnProbability: 0.2 }, boardWipes: { earliestTurn: 5, perTurnProbability: 0.08 }, stackInteraction: { perRelevantActionProbability: 0.1 }, opponents: 3 };
    expect(scenarioFingerprint(scenario)).toBe(scenarioFingerprint(structuredClone(scenario)));
    expect(scenarioFingerprint({ ...scenario, opponents: 2 })).not.toBe(scenarioFingerprint(scenario));
  });

  it("releases failed and expired leases without losing accepted jobs", async () => {
    let now = 1000;
    const store = new MemoryStore<{ deckId: string }>();
    const queue = new JobCoordinator(store, () => now);
    expect(await queue.accept("job-1", { deckId: "deck-1" })).toBe(true);
    expect(await queue.accept("job-1", { deckId: "different" })).toBe(false);
    expect((await queue.lease("worker-a", 100))?.attempts).toBe(1);
    now = 1200;
    expect((await queue.lease("worker-b", 100))?.attempts).toBe(2);
    expect(await queue.fail("job-1", "worker-b", "worker crashed")).toBe(true);
    expect((await queue.lease("worker-c", 100))?.attempts).toBe(3);
    expect(await queue.complete("job-1", "worker-c", { ok: true })).toBe(true);
    expect((await store.get("job-1"))?.status).toBe("completed");
  });

  it("derives targets from benchmark observations rather than guesses", () => {
    const targets = deriveOperationalTargets([
      { durationMs: 1000, samples: 10000, estimatedCostUsd: 0.01, completed: true },
      { durationMs: 2000, samples: 10000, estimatedCostUsd: 0.02, completed: true },
      { durationMs: 4000, samples: 10000, estimatedCostUsd: 0.04, completed: false },
    ]);
    expect(targets).toMatchObject({ sourceSampleCount: 3, completionRate: 2 / 3, p95DurationMs: 4000 });
    expect(targets.simulationsPerSecond).toBeCloseTo(30000 / 7);
    expect(targets.estimatedCostPerMillionSimulationsUsd).toBeCloseTo(0.07 / 30000 * 1_000_000);
  });
});
