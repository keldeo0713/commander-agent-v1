import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  buildCardDataset,
  datasetFreshnessHours,
  persistCardDataset,
} from "./snapshot.js";
import { fixtureBytes, fixtureDescriptor } from "./test-helpers.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

async function built(downloadedAt: string) {
  return buildCardDataset(
    [
      {
        descriptor: fixtureDescriptor("oracle_cards"),
        bytes: await fixtureBytes("oracle-cards.json"),
      },
      {
        descriptor: fixtureDescriptor("default_cards"),
        bytes: await fixtureBytes("default-cards.json"),
      },
    ],
    downloadedAt,
  );
}

describe("versioned card datasets", () => {
  it("is content-addressed and idempotent on reimport", async () => {
    const outputRoot = await mkdtemp(join(tmpdir(), "commander-card-data-"));
    temporaryDirectories.push(outputRoot);
    const first = await persistCardDataset(
      outputRoot,
      await built("2026-08-21T01:00:00.000Z"),
    );
    const second = await persistCardDataset(
      outputRoot,
      await built("2026-08-21T02:00:00.000Z"),
    );

    expect(second).toEqual(first);
    expect(first.manifest.counts).toEqual({
      oracleCards: 1,
      printings: 1,
      rejectedRecords: 0,
    });
    expect(first.manifest.sources).toHaveLength(2);
    expect(first.manifest.normalizedSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("reports freshness from the newest provider snapshot", async () => {
    const snapshot = (await built("2026-08-21T01:00:00.000Z")).snapshot;
    expect(
      datasetFreshnessHours(
        snapshot.manifest,
        new Date("2026-08-21T06:00:00.000Z"),
      ),
    ).toBe(6);
  });
});
