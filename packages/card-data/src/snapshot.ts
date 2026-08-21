import { createHash } from "node:crypto";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";

import { normalizeOracleCards, normalizePrintings } from "./normalize.js";
import {
  CARD_DATASET_SCHEMA_VERSION,
  type CardDatasetManifest,
  type CardDatasetSnapshot,
  type ScryfallBulkDataDescriptor,
  type ScryfallBulkType,
} from "./types.js";

export interface ScryfallSourceContent {
  descriptor: ScryfallBulkDataDescriptor;
  bytes: Uint8Array;
}

export interface BuiltCardDataset {
  snapshot: CardDatasetSnapshot;
  sourceContents: Record<ScryfallBulkType, Uint8Array>;
}

function sha256(bytes: Uint8Array | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function parseArray(bytes: Uint8Array, label: string): unknown[] {
  const text = new TextDecoder().decode(bytes).trim();
  if (text.startsWith("[")) {
    const value: unknown = JSON.parse(text);
    if (!Array.isArray(value)) {
      throw new Error(`${label} bulk file must be an array or JSONL records`);
    }
    return value;
  }
  return text.length === 0
    ? []
    : text.split(/\r?\n/u).map((line, index) => {
        try {
          return JSON.parse(line) as unknown;
        } catch (error) {
          throw new Error(`${label} JSONL record ${index} is invalid`, {
            cause: error,
          });
        }
      });
}

function descriptorByType(
  sources: readonly ScryfallSourceContent[],
  type: ScryfallBulkType,
): ScryfallSourceContent {
  const matches = sources.filter((source) => source.descriptor.type === type);
  if (matches.length !== 1) {
    throw new Error(`expected exactly one ${type} source, received ${matches.length}`);
  }
  const source = matches[0];
  if (source === undefined) throw new Error(`missing ${type} source`);
  return source;
}

function datasetId(
  sources: readonly ScryfallSourceContent[],
  normalizedSha256: string,
): string {
  const updatedAt = [...sources]
    .map((source) => source.descriptor.updatedAt)
    .sort()
    .at(-1);
  if (updatedAt === undefined) throw new Error("dataset has no source timestamps");
  const timestamp = updatedAt.replace(/[^0-9]/g, "").slice(0, 14);
  return `scryfall-${timestamp}-${normalizedSha256.slice(0, 12)}`;
}

export function buildCardDataset(
  sources: readonly ScryfallSourceContent[],
  downloadedAt: string,
): BuiltCardDataset {
  const oracleSource = descriptorByType(sources, "oracle_cards");
  const printingSource = descriptorByType(sources, "default_cards");
  const oracleValues = parseArray(oracleSource.bytes, "oracle_cards");
  const printingValues = parseArray(printingSource.bytes, "default_cards");

  const oracleResult = normalizeOracleCards(oracleValues);
  const knownOracleIds = new Set(
    oracleResult.records.map((card) => card.oracleId),
  );
  const printingResult = normalizePrintings(printingValues, knownOracleIds);
  const issues = [...oracleResult.issues, ...printingResult.issues].sort(
    (left, right) =>
      left.source.localeCompare(right.source) ||
      left.sourceIndex - right.sourceIndex ||
      left.code.localeCompare(right.code),
  );

  const normalizedJson = `${JSON.stringify({
    oracleCards: oracleResult.records,
    printings: printingResult.records,
    issues,
  })}\n`;
  const normalizedSha256 = sha256(normalizedJson);
  const id = datasetId(sources, normalizedSha256);

  const manifest: CardDatasetManifest = {
    schemaVersion: CARD_DATASET_SCHEMA_VERSION,
    datasetId: id,
    provider: "scryfall",
    createdAt: downloadedAt,
    sources: [oracleSource, printingSource]
      .map((source) => ({
        bulkId: source.descriptor.id,
        bulkType: source.descriptor.type,
        providerUpdatedAt: source.descriptor.updatedAt,
        downloadedAt,
        sourceSha256: sha256(source.bytes),
        sizeBytes: source.bytes.byteLength,
        recordCount:
          source.descriptor.type === "oracle_cards"
            ? oracleValues.length
            : printingValues.length,
      }))
      .sort((left, right) => left.bulkType.localeCompare(right.bulkType)),
    normalizedSha256,
    counts: {
      oracleCards: oracleResult.records.length,
      printings: printingResult.records.length,
      rejectedRecords: issues.length,
    },
    files: {
      sourceOracleCards: "source/oracle-cards.json",
      sourceDefaultCards: "source/default-cards.json",
      oracleCards: "normalized/oracle-cards.json",
      printings: "normalized/printings.json",
      issues: "normalized/issues.json",
    },
  };

  return {
    snapshot: {
      manifest,
      oracleCards: oracleResult.records,
      printings: printingResult.records,
      issues,
    },
    sourceContents: {
      oracle_cards: oracleSource.bytes,
      default_cards: printingSource.bytes,
    },
  };
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function loadCardDataset(
  datasetDirectory: string,
): Promise<CardDatasetSnapshot> {
  const manifest = JSON.parse(
    await readFile(join(datasetDirectory, "manifest.json"), "utf8"),
  ) as CardDatasetManifest;
  if (manifest.schemaVersion !== CARD_DATASET_SCHEMA_VERSION) {
    throw new Error("unsupported dataset schema version");
  }

  const [oracleCardsJson, printingsJson, issuesJson, oracleSource, printingSource] =
    await Promise.all([
    readFile(join(datasetDirectory, manifest.files.oracleCards), "utf8"),
    readFile(join(datasetDirectory, manifest.files.printings), "utf8"),
    readFile(join(datasetDirectory, manifest.files.issues), "utf8"),
    readFile(join(datasetDirectory, manifest.files.sourceOracleCards)),
    readFile(join(datasetDirectory, manifest.files.sourceDefaultCards)),
  ]);
  const oracleCards = JSON.parse(
    oracleCardsJson,
  ) as CardDatasetSnapshot["oracleCards"];
  const printings = JSON.parse(
    printingsJson,
  ) as CardDatasetSnapshot["printings"];
  const issues = JSON.parse(issuesJson) as CardDatasetSnapshot["issues"];
  const normalizedSha256 = sha256(
    `${JSON.stringify({ oracleCards, printings, issues })}\n`,
  );
  if (normalizedSha256 !== manifest.normalizedSha256) {
    throw new Error("normalized dataset hash does not match manifest");
  }
  const sourceBytes: Record<ScryfallBulkType, Uint8Array> = {
    oracle_cards: oracleSource,
    default_cards: printingSource,
  };
  for (const source of manifest.sources) {
    if (sha256(sourceBytes[source.bulkType]) !== source.sourceSha256) {
      throw new Error(`${source.bulkType} source hash does not match manifest`);
    }
  }

  return {
    manifest,
    oracleCards,
    printings,
    issues,
  };
}

export async function persistCardDataset(
  outputRoot: string,
  built: BuiltCardDataset,
): Promise<CardDatasetSnapshot> {
  await mkdir(outputRoot, { recursive: true });
  const finalDirectory = join(outputRoot, built.snapshot.manifest.datasetId);
  if (await exists(join(finalDirectory, "manifest.json"))) {
    return loadCardDataset(finalDirectory);
  }

  const stagingDirectory = await mkdtemp(join(outputRoot, ".staging-"));
  try {
    await mkdir(join(stagingDirectory, "source"), { recursive: true });
    await mkdir(join(stagingDirectory, "normalized"), { recursive: true });
    const files = built.snapshot.manifest.files;
    await Promise.all([
      writeFile(
        join(stagingDirectory, files.sourceOracleCards),
        built.sourceContents.oracle_cards,
      ),
      writeFile(
        join(stagingDirectory, files.sourceDefaultCards),
        built.sourceContents.default_cards,
      ),
      writeJson(
        join(stagingDirectory, files.oracleCards),
        built.snapshot.oracleCards,
      ),
      writeJson(join(stagingDirectory, files.printings), built.snapshot.printings),
      writeJson(join(stagingDirectory, files.issues), built.snapshot.issues),
      writeJson(join(stagingDirectory, "manifest.json"), built.snapshot.manifest),
    ]);
    await rename(stagingDirectory, finalDirectory);
  } catch (error) {
    await rm(stagingDirectory, { recursive: true, force: true });
    if (await exists(join(finalDirectory, "manifest.json"))) {
      return loadCardDataset(finalDirectory);
    }
    throw error;
  }

  return built.snapshot;
}

export function datasetFreshnessHours(
  manifest: CardDatasetManifest,
  now: Date,
): number {
  const timestamps = manifest.sources.map((source) =>
    Date.parse(source.providerUpdatedAt),
  );
  if (timestamps.some((timestamp) => Number.isNaN(timestamp))) {
    throw new Error("dataset contains an invalid providerUpdatedAt value");
  }
  const newest = Math.max(...timestamps);
  return Math.max(0, (now.getTime() - newest) / 3_600_000);
}
