export const LAND_SELECTION_VERSION = "land-selection/1" as const;
export const COLORED_SOURCE_CHECK_VERSION = "colored-source-check/1" as const;
export interface LandOption { oracleId: string; name: string; producedMana: string[]; category: "fixing" | "utility" }
export interface LandOptionBundle { candidates: LandOption[] }
export interface LandSelectionState { schemaVersion: typeof LAND_SELECTION_VERSION; selectedOracleIds: string[] }
export interface ManaPlanView { colorIdentity: string[]; colorDemand: Record<string, number>; entries: Array<{ quantity: number; category: "basic" | "fixing" | "utility"; cardName?: string }> }
export interface ColoredSourceResult { schemaVersion: typeof COLORED_SOURCE_CHECK_VERSION; colors: Array<{ color: string; demandPips: number; namedSources: number; status: "not-demanded" | "present" | "missing" }>; limitation: string }

export function createLandSelection(): LandSelectionState { return { schemaVersion: LAND_SELECTION_VERSION, selectedOracleIds: [] }; }

export function toggleLandSelection(state: LandSelectionState, bundle: LandOptionBundle, plan: ManaPlanView, oracleId: string): LandSelectionState {
  const option = bundle.candidates.find((candidate) => candidate.oracleId === oracleId);
  if (!option) throw new Error("land is not present in the inspected option pool");
  if (state.selectedOracleIds.includes(oracleId)) return { schemaVersion: LAND_SELECTION_VERSION, selectedOracleIds: state.selectedOracleIds.filter((id) => id !== oracleId) };
  const selected = state.selectedOracleIds.map((id) => bundle.candidates.find((candidate) => candidate.oracleId === id)).filter((candidate): candidate is LandOption => candidate !== undefined);
  const capacity = plan.entries.find(({ category }) => category === option.category)?.quantity ?? 0;
  if (selected.filter(({ category }) => category === option.category).length >= capacity) throw new Error(`${option.category} land slots are already covered`);
  return { schemaVersion: LAND_SELECTION_VERSION, selectedOracleIds: [...state.selectedOracleIds, oracleId].sort() };
}

export function validateColoredSources(state: LandSelectionState, bundle: LandOptionBundle, plan: ManaPlanView): ColoredSourceResult {
  const basics = new Map<string, number>();
  for (const entry of plan.entries) {
    const color = ({ Plains: "W", Island: "U", Swamp: "B", Mountain: "R", Forest: "G" } as Record<string, string>)[entry.cardName ?? ""];
    if (color) basics.set(color, (basics.get(color) ?? 0) + entry.quantity);
  }
  const selected = state.selectedOracleIds.map((id) => bundle.candidates.find((candidate) => candidate.oracleId === id)).filter((candidate): candidate is LandOption => candidate !== undefined);
  const colors = plan.colorIdentity.map((color) => {
    const demandPips = plan.colorDemand[color] ?? 0;
    const namedSources = (basics.get(color) ?? 0) + selected.filter(({ producedMana }) => producedMana.includes(color)).length;
    return { color, demandPips, namedSources, status: demandPips === 0 ? "not-demanded" as const : namedSources > 0 ? "present" as const : "missing" as const };
  });
  return { schemaVersion: COLORED_SOURCE_CHECK_VERSION, colors, limitation: "Presence validation only; cast-on-curve source targets require card turn requirements and tapped-land modeling." };
}

export function selectedLandNames(state: LandSelectionState, bundle: LandOptionBundle): string[] {
  return state.selectedOracleIds.map((id) => bundle.candidates.find((candidate) => candidate.oracleId === id)).filter((candidate): candidate is LandOption => candidate !== undefined).map(({ name }) => name).sort();
}
