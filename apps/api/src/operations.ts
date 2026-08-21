import { createHash } from "node:crypto";

export interface InteractionScenario {
  schemaVersion: "interaction-scenario/1";
  scenarioId: string;
  commanderRemoval: { earliestTurn: number; perTurnProbability: number };
  boardWipes: { earliestTurn: number; perTurnProbability: number };
  stackInteraction: { perRelevantActionProbability: number };
  opponents: number;
}
export function scenarioFingerprint(scenario: InteractionScenario): string {
  return createHash("sha256").update(JSON.stringify(scenario)).digest("hex");
}

export type JobStatus = "accepted" | "leased" | "completed" | "failed";
export interface DurableJob<T> {
  jobId: string; payload: T; status: JobStatus; attempts: number;
  leaseOwner: string | null; leaseExpiresAt: number | null; result: unknown; error: string | null;
}
export interface DurableJobStore<T> {
  putIfAbsent(job: DurableJob<T>): Promise<boolean>;
  get(jobId: string): Promise<DurableJob<T> | null>;
  compareAndSet(jobId: string, expected: JobStatus, next: DurableJob<T>): Promise<boolean>;
  list(): Promise<DurableJob<T>[]>;
}
export class JobCoordinator<T> {
  constructor(private readonly store: DurableJobStore<T>, private readonly clock: () => number) {}
  async accept(jobId: string, payload: T): Promise<boolean> {
    return this.store.putIfAbsent({ jobId, payload, status: "accepted", attempts: 0, leaseOwner: null, leaseExpiresAt: null, result: null, error: null });
  }
  async lease(workerId: string, leaseMs: number): Promise<DurableJob<T> | null> {
    for (const job of await this.store.list()) {
      const available = job.status === "accepted" || (job.status === "leased" && (job.leaseExpiresAt ?? 0) <= this.clock());
      if (!available) continue;
      const leased = { ...job, status: "leased" as const, attempts: job.attempts + 1, leaseOwner: workerId, leaseExpiresAt: this.clock() + leaseMs };
      if (await this.store.compareAndSet(job.jobId, job.status, leased)) return leased;
    }
    return null;
  }
  async complete(jobId: string, workerId: string, result: unknown): Promise<boolean> {
    const job = await this.store.get(jobId);
    if (!job || job.status !== "leased" || job.leaseOwner !== workerId) return false;
    return this.store.compareAndSet(jobId, "leased", { ...job, status: "completed", result, leaseOwner: null, leaseExpiresAt: null });
  }
  async fail(jobId: string, workerId: string, error: string): Promise<boolean> {
    const job = await this.store.get(jobId);
    if (!job || job.status !== "leased" || job.leaseOwner !== workerId) return false;
    return this.store.compareAndSet(jobId, "leased", { ...job, status: "accepted", error, leaseOwner: null, leaseExpiresAt: null });
  }
}

export interface BenchmarkSample { durationMs: number; samples: number; estimatedCostUsd: number; completed: boolean }
export interface OperationalTargets {
  sourceSampleCount: number; completionRate: number; p95DurationMs: number;
  simulationsPerSecond: number; estimatedCostPerMillionSimulationsUsd: number;
}
export function deriveOperationalTargets(samples: readonly BenchmarkSample[]): OperationalTargets {
  if (samples.length === 0) throw new Error("benchmark samples are required");
  const sorted = [...samples].sort((a, b) => a.durationMs - b.durationMs);
  const p95 = sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)] as BenchmarkSample;
  const totalSimulations = samples.reduce((sum, item) => sum + item.samples, 0);
  const totalDurationSeconds = samples.reduce((sum, item) => sum + item.durationMs, 0) / 1000;
  const totalCost = samples.reduce((sum, item) => sum + item.estimatedCostUsd, 0);
  return {
    sourceSampleCount: samples.length,
    completionRate: samples.filter((item) => item.completed).length / samples.length,
    p95DurationMs: p95.durationMs,
    simulationsPerSecond: totalSimulations / totalDurationSeconds,
    estimatedCostPerMillionSimulationsUsd: (totalCost / totalSimulations) * 1_000_000,
  };
}
