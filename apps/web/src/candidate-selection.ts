export const CANDIDATE_SELECTION_VERSION = "candidate-selection/1" as const;
export type CandidateDecision = "included" | "excluded";
export interface CandidateRef { roleId: string; oracleId: string }
export interface CandidateSelectionState { schemaVersion: typeof CANDIDATE_SELECTION_VERSION; decisions: Array<CandidateRef & { decision: CandidateDecision }> }
export interface CandidateRoleView { roleId: string; requiredQuantity: number; candidates: Array<{ oracleId: string; name: string }> }
export interface CandidateBundleView { commanderOracleId: string; roles: CandidateRoleView[] }
export interface RoleCoverage { roleId: string; requiredQuantity: number; includedQuantity: number; remainingQuantity: number; excludedQuantity: number; status: "empty" | "partial" | "covered" }
export interface FullTemplateCoverage { templateQuantity: 100; commanderQuantity: 1; manaBaseQuantity: number; includedNonlandQuantity: number; structurallyCoveredQuantity: number; namedCardQuantity: number; remainingNonlandQuantity: number; unresolvedManaQuantity: number; status: "partial" | "structurally-covered" | "card-named" }

export function createCandidateSelection(): CandidateSelectionState {
  return { schemaVersion: CANDIDATE_SELECTION_VERSION, decisions: [] };
}

export function decideCandidate(state: CandidateSelectionState, bundle: CandidateBundleView, ref: CandidateRef, decision: CandidateDecision | null): CandidateSelectionState {
  const role = bundle.roles.find(({ roleId }) => roleId === ref.roleId);
  if (!role?.candidates.some(({ oracleId }) => oracleId === ref.oracleId)) throw new Error("candidate is not present in the inspected role pool");
  const without = state.decisions.filter((entry) => entry.roleId !== ref.roleId || entry.oracleId !== ref.oracleId);
  if (decision === null) return { schemaVersion: CANDIDATE_SELECTION_VERSION, decisions: without };
  if (decision === "included" && without.filter((entry) => entry.roleId === ref.roleId && entry.decision === "included").length >= role.requiredQuantity) throw new Error(`role ${ref.roleId} is already covered`);
  if (decision === "included" && without.some((entry) => entry.oracleId === ref.oracleId && entry.decision === "included")) throw new Error("candidate is already included in another role");
  return { schemaVersion: CANDIDATE_SELECTION_VERSION, decisions: [...without, { ...ref, decision }].sort(compareDecision) };
}

export function exportCandidateSelection(state: CandidateSelectionState, bundle: CandidateBundleView, commanderName: string): string {
  if (!commanderName.trim()) throw new Error("commander name is required for selection export");
  const included = state.decisions.filter(({ decision }) => decision === "included").map((entry) => {
    const candidate = bundle.roles.find(({ roleId }) => roleId === entry.roleId)?.candidates.find(({ oracleId }) => oracleId === entry.oracleId);
    if (!candidate) throw new Error("included candidate is no longer available");
    return candidate;
  });
  if (new Set(included.map(({ oracleId }) => oracleId)).size !== included.length) throw new Error("selection export cannot contain singleton duplicates");
  return [`1 ${commanderName.trim()}`, ...included.sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0).map(({ name }) => `1 ${name}`)].join("\n");
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

export function summarizeFullTemplateCoverage(state: CandidateSelectionState, manaBase: { totalLands: number; namedCardQuantity: number }, selectedNonbasicQuantity = 0): FullTemplateCoverage {
  const includedNonlandQuantity = state.decisions.filter(({ decision }) => decision === "included").length;
  const structurallyCoveredQuantity = Math.min(100, 1 + manaBase.totalLands + includedNonlandQuantity);
  const namedCardQuantity = Math.min(100, 1 + manaBase.namedCardQuantity + selectedNonbasicQuantity + includedNonlandQuantity);
  const remainingNonlandQuantity = Math.max(0, 100 - 1 - manaBase.totalLands - includedNonlandQuantity);
  const unresolvedManaQuantity = Math.max(0, manaBase.totalLands - manaBase.namedCardQuantity - selectedNonbasicQuantity);
  const status = namedCardQuantity === 100 ? "card-named" : structurallyCoveredQuantity === 100 ? "structurally-covered" : "partial";
  return { templateQuantity: 100, commanderQuantity: 1, manaBaseQuantity: manaBase.totalLands, includedNonlandQuantity, structurallyCoveredQuantity, namedCardQuantity, remainingNonlandQuantity, unresolvedManaQuantity, status };
}

function key(ref: CandidateRef): string { return `${ref.roleId}\u0000${ref.oracleId}`; }
function compareDecision(left: CandidateRef, right: CandidateRef): number { return key(left) < key(right) ? -1 : key(left) > key(right) ? 1 : 0; }
