import { createHash } from "node:crypto";

export const ADVISER_SCHEMA_VERSION = "adviser/1" as const;
export type RevisionOperation =
  | { kind: "lock"; oracleId: string }
  | { kind: "exclude"; oracleId: string }
  | { kind: "relax"; path: string; value: unknown }
  | { kind: "rerun" };

export interface AdviserSpec {
  commanderOracleId: string;
  lockedOracleIds: string[];
  excludedOracleIds: string[];
  values: Record<string, unknown>;
}
export interface EvidenceRef { kind: "card_fact" | "retrieval" | "simulation"; sourceId: string }
export interface Explanation { claim: string; evidence: EvidenceRef[] }
export interface DeckVersion {
  schemaVersion: "deck-version/1";
  versionId: string;
  parentVersionId: string | null;
  spec: AdviserSpec;
  oracleIds: string[];
  metrics: Record<string, number>;
  explanations: Explanation[];
  createdAt: string;
}
export interface AdviserPorts {
  compile(request: string): Promise<{ status: "compiled"; spec: AdviserSpec } | { status: "clarification"; questions: string[] } | { status: "unsupported"; reasons: string[] }>;
  retrieve(spec: AdviserSpec): Promise<{ candidateOracleIds: string[]; evidence: EvidenceRef[] }>;
  build(spec: AdviserSpec, candidates: readonly string[]): Promise<{ status: "built"; oracleIds: string[] } | { status: "failed"; reasons: string[] }>;
  evaluate(spec: AdviserSpec, oracleIds: readonly string[]): Promise<{ metrics: Record<string, number>; evidence: EvidenceRef[] }>;
  explain(spec: AdviserSpec, oracleIds: readonly string[], evidence: readonly EvidenceRef[]): Promise<Explanation[]>;
}
export type AdviserResult =
  | { status: "complete"; version: DeckVersion }
  | { status: "clarification"; questions: string[] }
  | { status: "unsupported"; reasons: string[] }
  | { status: "failed"; reasons: string[] };

export class Adviser {
  private readonly versions = new Map<string, DeckVersion>();
  constructor(private readonly ports: AdviserPorts, private readonly clock: () => string = () => new Date().toISOString()) {}

  async build(request: string): Promise<AdviserResult> {
    const compiled = await this.ports.compile(request);
    if (compiled.status !== "compiled") return compiled;
    return this.execute(compiled.spec, null);
  }

  async revise(versionId: string, operation: RevisionOperation): Promise<AdviserResult> {
    const parent = this.versions.get(versionId);
    if (!parent) return { status: "failed", reasons: [`unknown deck version: ${versionId}`] };
    const spec = applyOperation(parent.spec, operation);
    return this.execute(spec, parent.versionId);
  }

  getVersion(versionId: string): DeckVersion | null {
    return this.versions.get(versionId) ?? null;
  }

  compare(leftId: string, rightId: string): { left: DeckVersion; right: DeckVersion; metricDelta: Record<string, number> } | null {
    const left = this.versions.get(leftId), right = this.versions.get(rightId);
    if (!left || !right) return null;
    const keys = new Set([...Object.keys(left.metrics), ...Object.keys(right.metrics)]);
    return { left, right, metricDelta: Object.fromEntries([...keys].map((key) => [key, (right.metrics[key] ?? 0) - (left.metrics[key] ?? 0)])) };
  }

  private async execute(spec: AdviserSpec, parentVersionId: string | null): Promise<AdviserResult> {
    const retrieval = await this.ports.retrieve(spec);
    const built = await this.ports.build(spec, retrieval.candidateOracleIds);
    if (built.status === "failed") return built;
    const evaluation = await this.ports.evaluate(spec, built.oracleIds);
    const evidence = [...retrieval.evidence, ...evaluation.evidence];
    const explanations = await this.ports.explain(spec, built.oracleIds, evidence);
    const known = new Set(evidence.map((item) => `${item.kind}:${item.sourceId}`));
    if (explanations.some((item) => item.evidence.length === 0 || item.evidence.some((ref) => !known.has(`${ref.kind}:${ref.sourceId}`)))) {
      return { status: "failed", reasons: ["explanation contains an unbound evidence reference"] };
    }
    const payload = JSON.stringify({ parentVersionId, spec, oracleIds: built.oracleIds, metrics: evaluation.metrics });
    const version: DeckVersion = {
      schemaVersion: "deck-version/1", versionId: createHash("sha256").update(payload).digest("hex").slice(0, 24),
      parentVersionId, spec: structuredClone(spec), oracleIds: [...built.oracleIds],
      metrics: { ...evaluation.metrics }, explanations: structuredClone(explanations), createdAt: this.clock(),
    };
    this.versions.set(version.versionId, version);
    return { status: "complete", version };
  }
}

function applyOperation(input: AdviserSpec, operation: RevisionOperation): AdviserSpec {
  const spec = structuredClone(input);
  if (operation.kind === "lock" && !spec.lockedOracleIds.includes(operation.oracleId)) spec.lockedOracleIds.push(operation.oracleId);
  if (operation.kind === "exclude" && !spec.excludedOracleIds.includes(operation.oracleId)) spec.excludedOracleIds.push(operation.oracleId);
  if (operation.kind === "relax") spec.values[operation.path] = operation.value;
  return spec;
}
