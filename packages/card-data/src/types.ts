export const CARD_DATASET_SCHEMA_VERSION = "card-dataset/1" as const;

export type ScryfallBulkType = "oracle_cards" | "default_cards";

export type ScryfallLegality =
  | "legal"
  | "not_legal"
  | "restricted"
  | "banned";

export interface ScryfallBulkDataDescriptor {
  object: "bulk_data";
  id: string;
  type: ScryfallBulkType;
  updatedAt: string;
  downloadUri: string;
  contentType: string;
  contentEncoding: string;
  size: number;
}

export interface ScryfallCardRecord {
  id: string;
  oracleId: string | null;
  name: string;
  lang: string;
  releasedAt: string;
  layout: string;
  manaCost: string | null;
  manaValue: number;
  typeLine: string;
  oracleText: string | null;
  colors: string[];
  colorIdentity: string[];
  keywords: string[];
  legalities: Record<string, ScryfallLegality>;
  cardFaces: Array<{
    name: string;
    manaCost: string | null;
    typeLine: string | null;
    oracleText: string | null;
  }>;
  setId: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  rarity: string;
  digital: boolean;
  finishes: string[];
  imageUris: Record<string, string> | null;
}

export interface OracleCard {
  schemaVersion: "oracle-card/1";
  oracleId: string;
  name: string;
  faceNames: string[];
  layout: string;
  manaCost: string | null;
  manaValue: number;
  typeLine: string;
  oracleText: string | null;
  colors: string[];
  colorIdentity: string[];
  keywords: string[];
  legalities: Record<string, ScryfallLegality>;
}

export interface CardPrinting {
  schemaVersion: "card-printing/1";
  scryfallId: string;
  oracleId: string;
  name: string;
  language: string;
  releasedAt: string;
  setId: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  rarity: string;
  digital: boolean;
  finishes: string[];
  imageUris: Record<string, string> | null;
}

export type IngestionIssueCode =
  | "invalid_record"
  | "missing_oracle_id"
  | "duplicate_oracle_id"
  | "duplicate_scryfall_id"
  | "unknown_oracle_id";

export interface IngestionIssue {
  source: ScryfallBulkType;
  sourceIndex: number;
  scryfallId: string | null;
  code: IngestionIssueCode;
  message: string;
}

export interface SourceFileManifest {
  bulkId: string;
  bulkType: ScryfallBulkType;
  providerUpdatedAt: string;
  downloadedAt: string;
  sourceSha256: string;
  sizeBytes: number;
  recordCount: number;
}

export interface CardDatasetManifest {
  schemaVersion: typeof CARD_DATASET_SCHEMA_VERSION;
  datasetId: string;
  provider: "scryfall";
  createdAt: string;
  sources: SourceFileManifest[];
  normalizedSha256: string;
  counts: {
    oracleCards: number;
    printings: number;
    rejectedRecords: number;
  };
  files: {
    sourceOracleCards: string;
    sourceDefaultCards: string;
    oracleCards: string;
    printings: string;
    issues: string;
  };
}

export interface CardDatasetSnapshot {
  manifest: CardDatasetManifest;
  oracleCards: OracleCard[];
  printings: CardPrinting[];
  issues: IngestionIssue[];
}
