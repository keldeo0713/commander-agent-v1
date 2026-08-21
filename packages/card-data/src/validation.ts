import type {
  ScryfallBulkDataDescriptor,
  ScryfallBulkType,
  ScryfallCardRecord,
  ScryfallLegality,
} from "./types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, path: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`${path} must be an object`);
  return value;
}

function requireString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${path} must be a non-empty string`);
  }
  return value;
}

function optionalString(value: unknown, path: string): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") throw new Error(`${path} must be a string`);
  return value;
}

function requireNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${path} must be a finite number`);
  }
  return value;
}

function requireBoolean(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${path} must be a boolean`);
  return value;
}

function stringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${path} must be an array of strings`);
  }
  return value.filter((item): item is string => typeof item === "string");
}

function stringRecord(value: unknown, path: string): Record<string, string> {
  const record = requireRecord(value, path);
  const entries = Object.entries(record);
  if (entries.some(([, entry]) => typeof entry !== "string")) {
    throw new Error(`${path} must contain only string values`);
  }
  return Object.fromEntries(entries) as Record<string, string>;
}

function legalitiesRecord(
  value: unknown,
  path: string,
): Record<string, ScryfallLegality> {
  const allowed = new Set<ScryfallLegality>([
    "legal",
    "not_legal",
    "restricted",
    "banned",
  ]);
  const record = stringRecord(value, path);
  for (const [format, legality] of Object.entries(record)) {
    if (!allowed.has(legality as ScryfallLegality)) {
      throw new Error(`${path}.${format} has unsupported legality ${legality}`);
    }
  }
  return record as Record<string, ScryfallLegality>;
}

export function parseBulkDataList(value: unknown): ScryfallBulkDataDescriptor[] {
  const root = requireRecord(value, "bulk data response");
  if (root.object !== "list" || !Array.isArray(root.data)) {
    throw new Error("bulk data response must be a Scryfall list");
  }

  return root.data.flatMap((item, index) => {
    const record = requireRecord(item, `data[${index}]`);
    const type = requireString(record.type, `data[${index}].type`);
    if (type !== "oracle_cards" && type !== "default_cards") {
      return [];
    }
    return [parseBulkDataDescriptor(record, type, `data[${index}]`)];
  });
}

export function parseBulkDataDescriptor(
  value: unknown,
  expectedType: ScryfallBulkType,
  path = "bulk data descriptor",
): ScryfallBulkDataDescriptor {
  const record = requireRecord(value, path);
  const type = requireString(record.type, `${path}.type`);
  if (record.object !== "bulk_data" || type !== expectedType) {
    throw new Error(`${path} must be a Scryfall ${expectedType} bulk descriptor`);
  }
  return {
      object: "bulk_data",
      id: requireString(record.id, `${path}.id`),
      type,
      updatedAt: requireString(record.updated_at, `${path}.updated_at`),
      downloadUri: requireString(
        typeof record.download_uri === "string" && record.download_uri.length > 0
          ? record.download_uri
          : record.jsonl_download_uri,
        `${path}.download_uri or ${path}.jsonl_download_uri`,
      ),
      contentType: requireString(
        record.content_type,
        `${path}.content_type`,
      ),
      contentEncoding: requireString(
        record.content_encoding,
        `${path}.content_encoding`,
      ),
      size: requireNumber(
        typeof record.size === "number" ? record.size : record.compressed_size,
        `${path}.size or ${path}.compressed_size`,
      ),
    } satisfies ScryfallBulkDataDescriptor;
}

export function parseScryfallCard(value: unknown): ScryfallCardRecord {
  const card = requireRecord(value, "card");
  const faces = card.card_faces ?? [];
  if (!Array.isArray(faces)) throw new Error("card.card_faces must be an array");

  return {
    id: requireString(card.id, "card.id"),
    oracleId: optionalString(card.oracle_id, "card.oracle_id"),
    name: requireString(card.name, "card.name"),
    lang: requireString(card.lang, "card.lang"),
    releasedAt: requireString(card.released_at, "card.released_at"),
    layout: requireString(card.layout, "card.layout"),
    manaCost: optionalString(card.mana_cost, "card.mana_cost"),
    manaValue: requireNumber(card.cmc, "card.cmc"),
    typeLine: requireString(card.type_line, "card.type_line"),
    oracleText: optionalString(card.oracle_text, "card.oracle_text"),
    colors: stringArray(card.colors ?? [], "card.colors"),
    colorIdentity: stringArray(card.color_identity, "card.color_identity"),
    keywords: stringArray(card.keywords ?? [], "card.keywords"),
    legalities: legalitiesRecord(card.legalities, "card.legalities"),
    cardFaces: faces.map((face, index) => {
      const record = requireRecord(face, `card.card_faces[${index}]`);
      return {
        name: requireString(record.name, `card.card_faces[${index}].name`),
        manaCost: optionalString(
          record.mana_cost,
          `card.card_faces[${index}].mana_cost`,
        ),
        typeLine: optionalString(
          record.type_line,
          `card.card_faces[${index}].type_line`,
        ),
        oracleText: optionalString(
          record.oracle_text,
          `card.card_faces[${index}].oracle_text`,
        ),
      };
    }),
    setId: requireString(card.set_id, "card.set_id"),
    setCode: requireString(card.set, "card.set"),
    setName: requireString(card.set_name, "card.set_name"),
    collectorNumber: requireString(
      card.collector_number,
      "card.collector_number",
    ),
    rarity: requireString(card.rarity, "card.rarity"),
    digital: requireBoolean(card.digital, "card.digital"),
    finishes: stringArray(card.finishes ?? [], "card.finishes"),
    imageUris:
      card.image_uris === undefined || card.image_uris === null
        ? null
        : stringRecord(card.image_uris, "card.image_uris"),
  };
}

export function isBulkType(value: string): value is ScryfallBulkType {
  return value === "oracle_cards" || value === "default_cards";
}
