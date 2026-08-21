import type { BuildCandidate, BuildConstraints, BuildFailure, BuildResult, BuiltDeck } from "./types.js";

export function buildBaseline(candidates: readonly BuildCandidate[], constraints: BuildConstraints): BuildResult {
  const eligible = candidates.filter((card) => card.legal && !constraints.excludedOracleIds.includes(card.oracleId));
  const byId = new Map(eligible.map((card) => [card.oracleId, card]));
  const failures: BuildFailure[] = [];
  const missingLocked = constraints.lockedOracleIds.filter((id) => !byId.has(id));
  if (missingLocked.length > 0) failures.push({ code: "locked_card_unavailable", oracleIds: missingLocked });
  if (constraints.declaredWinPathIds.length < constraints.minimumWinPaths) {
    failures.push({ code: "continuation_missing", required: constraints.minimumWinPaths, available: constraints.declaredWinPathIds.length });
  }

  const selected = new Map<string, BuildCandidate>();
  for (const id of constraints.lockedOracleIds) {
    const card = byId.get(id);
    if (card) selected.set(id, card);
  }
  for (const [role, required] of Object.entries(constraints.minimumByRole).sort(([a], [b]) => a.localeCompare(b))) {
    const available = eligible.filter((card) => card.roles.includes(role));
    if (available.length < required) failures.push({ code: "role_minimum_unreachable", role, required, available: available.length });
    for (const card of rank(available)) {
      if (countRole(selected.values(), role) >= required) break;
      selected.set(card.oracleId, card);
    }
  }

  for (const card of rank(eligible)) {
    if (selected.size >= constraints.deckSize - constraints.commanderOracleIds.length) break;
    selected.set(card.oracleId, card);
  }
  const gameChangerCount = [...selected.values()].filter((card) => card.gameChanger).length;
  if (gameChangerCount > constraints.maximumGameChangers) failures.push({ code: "game_changer_limit", count: gameChangerCount, maximum: constraints.maximumGameChangers });
  const requiredLibrarySize = constraints.deckSize - constraints.commanderOracleIds.length;
  if (selected.size < requiredLibrarySize) failures.push({ code: "deck_size_unreachable", required: requiredLibrarySize, available: selected.size });
  if (failures.length > 0) return { status: "failed", failures };

  const cards = [...selected.values()].slice(0, requiredLibrarySize);
  const deck: BuiltDeck = {
    schemaVersion: "deck-builder/1",
    commanderOracleIds: [...constraints.commanderOracleIds],
    oracleIds: cards.map((card) => card.oracleId),
    roleCounts: Object.fromEntries(Object.keys(constraints.minimumByRole).map((role) => [role, countRole(cards, role)])),
    gameChangerCount: cards.filter((card) => card.gameChanger).length,
    declaredWinPathIds: [...constraints.declaredWinPathIds],
  };
  return { status: "built", deck };
}

function rank(cards: readonly BuildCandidate[]): BuildCandidate[] {
  return [...cards].sort((a, b) => b.score - a.score || a.oracleId.localeCompare(b.oracleId));
}
function countRole(cards: Iterable<BuildCandidate>, role: string): number {
  return [...cards].filter((card) => card.roles.includes(role)).length;
}
