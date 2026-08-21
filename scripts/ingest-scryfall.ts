import { resolve } from "node:path";

import { ingestScryfallSnapshot } from "../packages/card-data/src/index.js";

function outputRoot(args: readonly string[]): string {
  const outputIndex = args.indexOf("--output");
  const value = outputIndex === -1 ? undefined : args[outputIndex + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error("Usage: pnpm ingest:scryfall --output <dataset-directory>");
  }
  return resolve(value);
}

const snapshot = await ingestScryfallSnapshot({
  outputRoot: outputRoot(process.argv.slice(2)),
});

console.log(
  JSON.stringify(
    {
      datasetId: snapshot.manifest.datasetId,
      oracleCards: snapshot.manifest.counts.oracleCards,
      printings: snapshot.manifest.counts.printings,
      rejectedRecords: snapshot.manifest.counts.rejectedRecords,
      normalizedSha256: snapshot.manifest.normalizedSha256,
    },
    null,
    2,
  ),
);
