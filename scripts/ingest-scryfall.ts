import { resolve } from "node:path";

import {
  datasetFreshnessHours,
  ingestScryfallSnapshot,
} from "../packages/card-data/src/index.js";

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
const issueCounts = snapshot.issues.reduce<Record<string, number>>(
  (counts, issue) => {
    const key = `${issue.source}:${issue.code}`;
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  },
  {},
);

console.log(
  JSON.stringify(
    {
      datasetId: snapshot.manifest.datasetId,
      oracleCards: snapshot.manifest.counts.oracleCards,
      printings: snapshot.manifest.counts.printings,
      rejectedRecords: snapshot.manifest.counts.rejectedRecords,
      issueCounts,
      sources: snapshot.manifest.sources,
      freshnessHours: datasetFreshnessHours(snapshot.manifest, new Date()),
      normalizedSha256: snapshot.manifest.normalizedSha256,
    },
    null,
    2,
  ),
);
