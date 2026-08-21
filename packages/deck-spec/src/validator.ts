import type { DeckSpec, DeckSpecIssue } from "./types.js";

export const SUPPORTED_GOAL_DEFINITIONS = new Set([
  "commander-cheat-eligible-creature-by-turn/1",
]);

function issue(
  code: DeckSpecIssue["code"],
  path: string,
  message: string,
): DeckSpecIssue {
  return { code, path, message };
}

export function validateDeckSpec(spec: DeckSpec): DeckSpecIssue[] {
  const issues: DeckSpecIssue[] = [];
  if (spec.schemaVersion !== "deck-spec/1") {
    issues.push(issue("schema_version", "/schemaVersion", "Unsupported DeckSpec schema version"));
  }
  if (spec.commander.oracleId.length === 0 || spec.commander.name.length === 0) {
    issues.push(issue("commander_missing", "/commander", "A resolved commander Oracle identity and name are required"));
  }
  if (spec.format.snapshotId.length === 0) {
    issues.push(issue("format_snapshot_missing", "/format/snapshotId", "A versioned format snapshot is required"));
  }
  const gameChangerPolicy = spec.format.gameChangerPolicy;
  if (
    gameChangerPolicy.mode === "max-count" &&
    (!Number.isInteger(gameChangerPolicy.value) || gameChangerPolicy.value < 0)
  ) {
    issues.push(issue("invalid_constraint", "/format/gameChangerPolicy/value", "Game Changer maximum must be a non-negative integer"));
  }
  if (spec.hardConstraints.budgetUsd !== null && spec.hardConstraints.budgetUsd < 0) {
    issues.push(issue("invalid_constraint", "/hardConstraints/budgetUsd", "Budget cannot be negative"));
  }
  const locked = new Set(spec.hardConstraints.lockedOracleIds);
  const conflicts = spec.hardConstraints.excludedOracleIds.filter((id) => locked.has(id));
  if (conflicts.length > 0) {
    issues.push(issue("constraint_conflict", "/hardConstraints", `Cards cannot be both locked and excluded: ${conflicts.sort().join(", ")}`));
  }
  if (!Number.isInteger(spec.guardrails.minLands) || spec.guardrails.minLands < 0 || spec.guardrails.minLands > 100) {
    issues.push(issue("invalid_constraint", "/guardrails/minLands", "Minimum lands must be an integer from 0 through 100"));
  }
  if (!Number.isInteger(spec.guardrails.minInteraction) || spec.guardrails.minInteraction < 0) {
    issues.push(issue("invalid_constraint", "/guardrails/minInteraction", "Minimum interaction must be a non-negative integer"));
  }
  if (spec.guardrails.minThemeScore < 0 || spec.guardrails.minThemeScore > 1) {
    issues.push(issue("invalid_constraint", "/guardrails/minThemeScore", "Theme score must be between 0 and 1"));
  }
  for (const [index, objective] of spec.objectives.entries()) {
    if (!SUPPORTED_GOAL_DEFINITIONS.has(objective.definitionId)) {
      issues.push(issue("unsupported_goal", `/objectives/${index}/definitionId`, `Unsupported executable goal: ${objective.definitionId}`));
    }
    if (!Number.isFinite(objective.weight) || objective.weight <= 0) {
      issues.push(issue("invalid_goal", `/objectives/${index}/weight`, "Objective weight must be positive"));
    }
  }
  if (spec.objectives.length === 0) {
    issues.push(issue("invalid_goal", "/objectives", "At least one registered objective is required"));
  }
  if (spec.continuation.minimumDeclaredWinPaths < 1) {
    issues.push(issue("continuation_missing", "/continuation/minimumDeclaredWinPaths", "At least one continuation or win path must be required"));
  }
  if (!spec.scenario.opponentInteraction.commanderRemoval.enabled) {
    issues.push(issue("scenario_missing", "/scenario/opponentInteraction/commanderRemoval", "The approved default scenario must include commander removal"));
  }
  for (const [index, inference] of spec.inferences.entries()) {
    if (!inference.path.startsWith("/") || inference.reason.length === 0) {
      issues.push(issue("inference_missing", `/inferences/${index}`, "Each inference needs a JSON-pointer path and visible reason"));
    }
  }
  return issues.sort((left, right) => left.path.localeCompare(right.path) || left.code.localeCompare(right.code));
}
