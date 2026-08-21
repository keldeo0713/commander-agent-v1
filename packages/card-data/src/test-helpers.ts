import { readFile } from "node:fs/promises";

import type { ScryfallBulkDataDescriptor } from "./types.js";

export async function fixtureBytes(
  name: "oracle-cards.json" | "default-cards.json",
): Promise<Uint8Array> {
  return readFile(new URL(`../test/fixtures/${name}`, import.meta.url));
}

export function fixtureDescriptor(
  type: "oracle_cards" | "default_cards",
): ScryfallBulkDataDescriptor {
  return {
    object: "bulk_data",
    id: `bulk-${type}`,
    type,
    updatedAt: "2026-08-21T00:00:00.000Z",
    downloadUri: `https://data.scryfall.io/${type}.json`,
    contentType: "application/json",
    contentEncoding: "gzip",
    size: 1,
  };
}
