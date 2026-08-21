import type {
  CardPrinting,
  IngestionIssue,
  OracleCard,
  ScryfallBulkType,
  ScryfallCardRecord,
} from "./types.js";
import { parseScryfallCard } from "./validation.js";

export interface NormalizeResult<T> {
  records: T[];
  issues: IngestionIssue[];
}

function normalizeOracle(card: ScryfallCardRecord): OracleCard {
  if (card.oracleId === null) throw new Error("oracle card has no oracle_id");
  return {
    schemaVersion: "oracle-card/1",
    oracleId: card.oracleId,
    name: card.name,
    faceNames: card.cardFaces.map((face) => face.name),
    layout: card.layout,
    manaCost: card.manaCost,
    manaValue: card.manaValue,
    typeLine: card.typeLine,
    oracleText: card.oracleText,
    colors: [...card.colors].sort(),
    colorIdentity: [...card.colorIdentity].sort(),
    keywords: [...card.keywords].sort(),
    legalities: Object.fromEntries(
      Object.entries(card.legalities).sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    ),
  };
}

function normalizePrinting(card: ScryfallCardRecord): CardPrinting {
  if (card.oracleId === null) throw new Error("printing has no oracle_id");
  return {
    schemaVersion: "card-printing/1",
    scryfallId: card.id,
    oracleId: card.oracleId,
    name: card.name,
    language: card.lang,
    releasedAt: card.releasedAt,
    setId: card.setId,
    setCode: card.setCode.toLowerCase(),
    setName: card.setName,
    collectorNumber: card.collectorNumber,
    rarity: card.rarity,
    digital: card.digital,
    finishes: [...card.finishes].sort(),
    imageUris:
      card.imageUris === null
        ? null
        : Object.fromEntries(
            Object.entries(card.imageUris).sort(([left], [right]) =>
              left.localeCompare(right),
            ),
          ),
  };
}

function issue(
  source: ScryfallBulkType,
  sourceIndex: number,
  scryfallId: string | null,
  code: IngestionIssue["code"],
  message: string,
): IngestionIssue {
  return { source, sourceIndex, scryfallId, code, message };
}

function candidateId(value: unknown): string | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const id = (value as Record<string, unknown>).id;
  return typeof id === "string" ? id : null;
}

export function normalizeOracleCards(
  values: readonly unknown[],
): NormalizeResult<OracleCard> {
  const records: OracleCard[] = [];
  const issues: IngestionIssue[] = [];
  const seen = new Set<string>();

  values.forEach((value, sourceIndex) => {
    let card: ScryfallCardRecord;
    try {
      card = parseScryfallCard(value);
    } catch (error) {
      issues.push(
        issue(
          "oracle_cards",
          sourceIndex,
          candidateId(value),
          "invalid_record",
          error instanceof Error ? error.message : "invalid card record",
        ),
      );
      return;
    }

    if (card.oracleId === null) {
      issues.push(
        issue(
          "oracle_cards",
          sourceIndex,
          card.id,
          "missing_oracle_id",
          "record has no oracle_id",
        ),
      );
      return;
    }
    if (seen.has(card.oracleId)) {
      issues.push(
        issue(
          "oracle_cards",
          sourceIndex,
          card.id,
          "duplicate_oracle_id",
          `duplicate oracle_id ${card.oracleId}`,
        ),
      );
      return;
    }

    seen.add(card.oracleId);
    records.push(normalizeOracle(card));
  });

  records.sort((left, right) => left.oracleId.localeCompare(right.oracleId));
  return { records, issues };
}

export function normalizePrintings(
  values: readonly unknown[],
  knownOracleIds: ReadonlySet<string>,
): NormalizeResult<CardPrinting> {
  const records: CardPrinting[] = [];
  const issues: IngestionIssue[] = [];
  const seen = new Set<string>();

  values.forEach((value, sourceIndex) => {
    let card: ScryfallCardRecord;
    try {
      card = parseScryfallCard(value);
    } catch (error) {
      issues.push(
        issue(
          "default_cards",
          sourceIndex,
          candidateId(value),
          "invalid_record",
          error instanceof Error ? error.message : "invalid card record",
        ),
      );
      return;
    }

    if (card.oracleId === null) {
      issues.push(
        issue(
          "default_cards",
          sourceIndex,
          card.id,
          "missing_oracle_id",
          "record has no oracle_id",
        ),
      );
      return;
    }
    if (!knownOracleIds.has(card.oracleId)) {
      issues.push(
        issue(
          "default_cards",
          sourceIndex,
          card.id,
          "unknown_oracle_id",
          `oracle_id ${card.oracleId} is absent from oracle_cards`,
        ),
      );
      return;
    }
    if (seen.has(card.id)) {
      issues.push(
        issue(
          "default_cards",
          sourceIndex,
          card.id,
          "duplicate_scryfall_id",
          `duplicate Scryfall id ${card.id}`,
        ),
      );
      return;
    }

    seen.add(card.id);
    records.push(normalizePrinting(card));
  });

  records.sort((left, right) => left.scryfallId.localeCompare(right.scryfallId));
  return { records, issues };
}
