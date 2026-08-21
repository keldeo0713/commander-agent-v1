import type {
  CommanderCardView,
  CommanderDeck,
  CommanderFormatSnapshot,
  LegalityResult,
  LegalityViolation,
} from "./types.js";

function normalizedName(name: string): string {
  return name.normalize("NFKC").trim().toLocaleLowerCase("en-US");
}

function violation(
  code: LegalityViolation["code"],
  message: string,
  oracleIds: string[] = [],
  details: LegalityViolation["details"] = {},
): LegalityViolation {
  return { code, message, oracleIds: [...oracleIds].sort(), details };
}

function isCommander(card: CommanderCardView): boolean {
  return card.typeLine.includes("Legendary Creature") ||
    (card.oracleText?.toLocaleLowerCase("en-US").includes("can be your commander") ?? false);
}

function hasKeyword(card: CommanderCardView, keyword: string): boolean {
  return card.keywords.some(
    (value) => value.toLocaleLowerCase("en-US") === keyword,
  );
}

function pairIsSupported(cards: CommanderCardView[]): boolean {
  if (cards.length !== 2) return false;
  if (cards.every((card) => hasKeyword(card, "partner"))) return true;
  if (cards.every((card) => hasKeyword(card, "friends forever"))) return true;
  if (
    cards.some((card) => hasKeyword(card, "choose a background")) &&
    cards.some((card) =>
      card.typeLine.includes("Legendary Enchantment — Background"),
    )
  ) {
    return true;
  }
  return (
    cards.some((card) => card.typeLine.includes("Doctor")) &&
    cards.some((card) => hasKeyword(card, "doctor's companion"))
  );
}

function allowedCopies(card: CommanderCardView): number | "unlimited" {
  if (card.typeLine.includes("Basic Land")) return "unlimited";
  return card.copyLimit ?? 1;
}

export function validateCommanderDeck(
  deck: CommanderDeck,
  cards: ReadonlyMap<string, CommanderCardView>,
  format: CommanderFormatSnapshot,
): LegalityResult {
  const violations: LegalityViolation[] = [];
  const entries = new Map<string, number>();
  for (const entry of deck.cards) {
    if (!Number.isInteger(entry.quantity) || entry.quantity <= 0) {
      violations.push(
        violation(
          "invalid_quantity",
          "Card quantities must be positive integers",
          [entry.oracleId],
          { quantity: entry.quantity },
        ),
      );
      continue;
    }
    entries.set(
      entry.oracleId,
      (entries.get(entry.oracleId) ?? 0) + entry.quantity,
    );
  }

  const total = [...entries.values()].reduce(
    (sum, quantity) => sum + quantity,
    0,
  );
  if (total !== format.deckSize) {
    violations.push(
      violation(
        "deck_size",
        `Commander decks must contain exactly ${format.deckSize} cards including commanders`,
        [],
        { actual: total, expected: format.deckSize },
      ),
    );
  }
  if (deck.commanders.length < 1 || deck.commanders.length > 2) {
    violations.push(
      violation(
        "commander_count",
        "A supported Commander deck must declare one or two commanders",
        deck.commanders,
        { actual: deck.commanders.length },
      ),
    );
  }

  const commanderCards: CommanderCardView[] = [];
  for (const oracleId of deck.commanders) {
    const card = cards.get(oracleId);
    if (card === undefined) {
      violations.push(
        violation(
          "unknown_card",
          "Declared commander is not in the selected card dataset",
          [oracleId],
        ),
      );
      continue;
    }
    commanderCards.push(card);
    if ((entries.get(oracleId) ?? 0) !== 1) {
      violations.push(
        violation(
          "commander_missing_from_deck",
          "Each commander must appear exactly once in the 100-card deck",
          [oracleId],
          { quantity: entries.get(oracleId) ?? 0 },
        ),
      );
    }
    if (
      !isCommander(card) &&
      !card.typeLine.includes("Legendary Enchantment — Background")
    ) {
      violations.push(
        violation(
          "commander_not_eligible",
          `${card.name} cannot be a commander`,
          [oracleId],
        ),
      );
    }
  }
  if (commanderCards.length === 2 && !pairIsSupported(commanderCards)) {
    violations.push(
      violation(
        "unsupported_commander_pair",
        "The declared two-commander combination is not a supported construction exception",
        commanderCards.map((card) => card.oracleId),
      ),
    );
  }

  const colorIdentity = [
    ...new Set(commanderCards.flatMap((card) => card.colorIdentity)),
  ].sort();
  const banned = new Set(format.bannedNames.map(normalizedName));
  for (const [oracleId, quantity] of entries) {
    const card = cards.get(oracleId);
    if (card === undefined) {
      violations.push(
        violation(
          "unknown_card",
          "Deck card is not in the selected card dataset",
          [oracleId],
        ),
      );
      continue;
    }
    const extraColors = card.colorIdentity.filter(
      (color) => !colorIdentity.includes(color),
    );
    if (extraColors.length > 0) {
      violations.push(
        violation(
          "color_identity",
          `${card.name} is outside the commander's color identity`,
          [oracleId],
          { extraColors },
        ),
      );
    }
    const limit = allowedCopies(card);
    if (limit !== "unlimited" && quantity > limit) {
      violations.push(
        violation(
          "singleton",
          `${card.name} exceeds its permitted copy count`,
          [oracleId],
          { actual: quantity, limit },
        ),
      );
    }
    if (banned.has(normalizedName(card.name))) {
      violations.push(
        violation(
          "banned_card",
          `${card.name} is banned in this Commander rules snapshot`,
          [oracleId],
        ),
      );
    } else if (card.commanderLegality !== "legal") {
      violations.push(
        violation(
          "format_illegal_card",
          `${card.name} is not legal in Commander in the selected card dataset`,
          [oracleId],
          { legality: card.commanderLegality },
        ),
      );
    }
  }

  if (deck.companionOracleId !== undefined) {
    const companion = cards.get(deck.companionOracleId);
    if (companion === undefined) {
      violations.push(
        violation(
          "unknown_card",
          "Declared companion is not in the selected card dataset",
          [deck.companionOracleId],
        ),
      );
    } else if (
      format.companionBannedNames
        .map(normalizedName)
        .includes(normalizedName(companion.name))
    ) {
      violations.push(
        violation(
          "companion_banned",
          `${companion.name} is banned only as a companion`,
          [companion.oracleId],
        ),
      );
    }
  }

  violations.sort(
    (left, right) =>
      left.code.localeCompare(right.code) ||
      left.oracleIds.join().localeCompare(right.oracleIds.join()),
  );
  return {
    schemaVersion: "commander-legality-result/1",
    legal: violations.length === 0,
    rulesSnapshotId: format.snapshotId,
    commanderColorIdentity: colorIdentity,
    violations,
  };
}
