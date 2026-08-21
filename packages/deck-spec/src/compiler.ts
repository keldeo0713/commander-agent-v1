import type {
  DeckSpec,
  DeckSpecCompileResult,
  DeckSpecIssue,
} from "./types.js";
import { SUPPORTED_GOAL_DEFINITIONS, validateDeckSpec } from "./validator.js";

export interface CompileDeckRequest {
  request: string;
  resolvedCommander: { oracleId: string; name: string } | null;
  formatSnapshotId: string;
}

export interface DeckSpecDraftGenerator {
  readonly generatorId: string;
  generate(input: {
    request: string;
    resolvedCommander: CompileDeckRequest["resolvedCommander"];
    formatSnapshotId: string;
    supportedGoalDefinitionIds: string[];
    approvedDefaults: Record<string, unknown>;
  }): Promise<DeckSpec | { clarificationQuestions: string[] }>;
}

function compilerIssue(
  code: DeckSpecIssue["code"],
  path: string,
  message: string,
): DeckSpecIssue {
  return { code, path, message };
}

export async function compileDeckRequest(
  input: CompileDeckRequest,
  generator: DeckSpecDraftGenerator,
): Promise<DeckSpecCompileResult> {
  if (input.resolvedCommander === null) {
    return {
      status: "clarification_required",
      questions: ["Which commander should lead this deck?"],
      issues: [compilerIssue("commander_missing", "/commander", "Commander resolution is required before compilation")],
    };
  }
  const draft = await generator.generate({
    request: input.request,
    resolvedCommander: input.resolvedCommander,
    formatSnapshotId: input.formatSnapshotId,
    supportedGoalDefinitionIds: [...SUPPORTED_GOAL_DEFINITIONS].sort(),
    approvedDefaults: {
      maximumGameChangers: 3,
      minimumEligibleManaValue: 6,
      commanderRemovalScenario: true,
      minimumDeclaredWinPaths: 1,
    },
  });
  if ("clarificationQuestions" in draft) {
    return {
      status: "clarification_required",
      questions: draft.clarificationQuestions,
      issues: [],
    };
  }
  const issues = validateDeckSpec(draft);
  if (issues.some((item) => item.code === "unsupported_goal")) {
    return { status: "unsupported", issues };
  }
  if (issues.length > 0) {
    return {
      status: "clarification_required",
      questions: ["Please review the highlighted assumptions and constraints."],
      issues,
    };
  }
  return { status: "compiled", spec: draft, issues: [] };
}
