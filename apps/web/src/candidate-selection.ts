export const CANDIDATE_SELECTION_VERSION = "candidate-selection/1" as const;
export type CandidateDecision = "included" | "excluded";
export interface CandidateRef { roleId: string; oracleId: string }
export interface CandidateSelectionState { schemaVersion: typeof CANDIDATE_SELECTION_VERSION; decisions: Array<CandidateRef & { decision: CandidateDecision }> }
export interface CandidateRoleView { roleId: string; requiredQuantity: number; candidates: Array<{ oracleId: string }> }
export interface CandidateBundleView { commanderOracleId: string; roles: CandidateRoleView[] }
export interface RoleCoverage { roleId: string; requiredQuantity: number; includedQuantity: number; remainingQuantity: number; excludedQuantity: number; status: "empty" | "partial" | "covered" }

export function createCandidateSelection(): CandidateSelectionState {
  return { schemaVersion: CANDIDATE_SELECTION_VERSION, decisions: [] };
}

export function decideCandidate(state: CandidateSelectionState, bundle: CandidateBundleView, ref: CandidateRef, decision: CandidateDecision | null): CandidateSelectionState {
  const role = bundle.roles.find(({ roleId }) => roleId === ref.roleId);
  if (!role?.candidates.some(({ oracleId }) => oracleId === ref.oracleId)) throw new Error("candidate is not present in the inspected role pool");
  const without = state.decisions.filter((entry) => entry.roleId !== ref.roleId || entry.oracleId !== ref.oracleId);
  if (decision === null) return { schemaVersion: CANDIDATE_SELECTION_VERSION, decisions: without };
  if (decision === "included" && without.filter((entry) => entry.roleId === ref.roleId && entry.decision === "included").length >= role.requiredQuantity) throw new Error(`role ${ref.roleId} is already covered`);
  return { schemaVersion: CANDIDATE_SELECTION_VERSION, decisions: [...without, { ...ref, decision }].sort(compareDecision) };
}

export function reconcileCandidateSelection(state: CandidateSelectionState, bundle: CandidateBundleView): CandidateSelectionState {
  const available = new Set(bundle.roles.flatMap((role) => role.candidates.map((candidate) => key({ roleId: role.roleId, oracleId: candidate.oracleId }))));
  return { schemaVersion: CANDIDATE_SELECTION_VERSION, decisions: state.decisions.filter((entry) => available.has(key(entry))).sort(compareDecision) };
}

export function summarizeRoleCoverage(state: CandidateSelectionState, bundle: CandidateBundleView): RoleCoverage[] {
  return bundle.roles.map((role) => {
    const includedQuantity = state.decisions.filter((entry) => entry.roleId === role.roleId && entry.decision === "included").length;
    const excludedQuantity = state.decisions.filter((entry) => entry.roleId === role.roleId && entry.decision === "excluded").length;
    const remainingQuantity = Math.max(0, role.requiredQuantity - includedQuantity);
    return { roleId: role.roleId, requiredQuantity: role.requiredQuantity, includedQuantity, remainingQuantity, excludedQuantity, status: remainingQuantity === 0 ? "covered" : includedQuantity === 0 ? "empty" : "partial" };
  });
}

function key(ref: CandidateRef): string { return `${ref.roleId}\u0000${ref.oracleId}`; }
function compareDecision(left: CandidateRef, right: CandidateRef): number { return key(left) < key(right) ? -1 : key(left) > key(right) ? 1 : 0; }
