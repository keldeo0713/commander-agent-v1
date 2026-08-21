import type {
  CardDatasetSnapshot,
  ScryfallBulkDataDescriptor,
  ScryfallBulkType,
} from "./types.js";
import {
  buildCardDataset,
  persistCardDataset,
  type ScryfallSourceContent,
} from "./snapshot.js";
import { parseBulkDataList } from "./validation.js";

const BULK_DATA_URL = "https://api.scryfall.com/bulk-data";
const REQUIRED_BULK_TYPES: ScryfallBulkType[] = [
  "oracle_cards",
  "default_cards",
];

export type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

export interface IngestScryfallOptions {
  outputRoot: string;
  fetch?: FetchLike;
  now?: () => Date;
  userAgent?: string;
}

function requestHeaders(userAgent: string): HeadersInit {
  return {
    Accept: "application/json",
    "User-Agent": userAgent,
  };
}

function assertScryfallUrl(value: string): void {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    (url.hostname !== "api.scryfall.com" &&
      !url.hostname.endsWith(".scryfall.io"))
  ) {
    throw new Error(`refusing non-Scryfall URL: ${url.origin}`);
  }
}

async function fetchBytes(
  fetcher: FetchLike,
  url: string,
  userAgent: string,
): Promise<Uint8Array> {
  assertScryfallUrl(url);
  const response = await fetcher(url, { headers: requestHeaders(userAgent) });
  if (!response.ok) {
    throw new Error(`Scryfall request failed with ${response.status} for ${url}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

export async function fetchScryfallBulkDescriptors(
  fetcher: FetchLike,
  userAgent: string,
): Promise<ScryfallBulkDataDescriptor[]> {
  const bytes = await fetchBytes(fetcher, BULK_DATA_URL, userAgent);
  const value: unknown = JSON.parse(new TextDecoder().decode(bytes));
  const descriptors = parseBulkDataList(value);
  return REQUIRED_BULK_TYPES.map((type) => {
    const descriptor = descriptors.find((candidate) => candidate.type === type);
    if (descriptor === undefined) {
      throw new Error(`Scryfall bulk-data response is missing ${type}`);
    }
    return descriptor;
  });
}

export async function ingestScryfallSnapshot(
  options: IngestScryfallOptions,
): Promise<CardDatasetSnapshot> {
  const fetcher = options.fetch ?? globalThis.fetch;
  const now = options.now ?? (() => new Date());
  const userAgent =
    options.userAgent ?? "commander-agent-v1/0.1 (+https://github.com/keldeo0713/commander-agent-v1)";
  const descriptors = await fetchScryfallBulkDescriptors(fetcher, userAgent);
  const sources: ScryfallSourceContent[] = await Promise.all(
    descriptors.map(async (descriptor) => ({
      descriptor,
      bytes: await fetchBytes(fetcher, descriptor.downloadUri, userAgent),
    })),
  );
  const built = buildCardDataset(sources, now().toISOString());
  return persistCardDataset(options.outputRoot, built);
}
