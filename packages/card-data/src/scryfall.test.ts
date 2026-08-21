import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { ingestScryfallSnapshot, type FetchLike } from "./scryfall.js";
import { fixtureBytes, fixtureDescriptor } from "./test-helpers.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("Scryfall ingestion", () => {
  it("downloads the two required snapshots with identifiable requests", async () => {
    const outputRoot = await mkdtemp(join(tmpdir(), "commander-scryfall-"));
    temporaryDirectories.push(outputRoot);
    const oracleDescriptor = fixtureDescriptor("oracle_cards");
    const printingDescriptor = fixtureDescriptor("default_cards");
    const fetcher = vi.fn<FetchLike>(async (url) => {
      if (url === "https://api.scryfall.com/bulk-data") {
        return Response.json({
          object: "list",
          data: [
            {
              object: "bulk_data",
              id: oracleDescriptor.id,
              type: oracleDescriptor.type,
              updated_at: oracleDescriptor.updatedAt,
              download_uri: oracleDescriptor.downloadUri,
              content_type: oracleDescriptor.contentType,
              content_encoding: oracleDescriptor.contentEncoding,
              size: oracleDescriptor.size,
            },
            {
              object: "bulk_data",
              id: "unused-rulings",
              type: "rulings",
              updated_at: "2026-08-21T00:00:00.000Z",
              download_uri: "https://data.scryfall.io/rulings.json",
              content_type: "application/json",
              content_encoding: "gzip",
              size: 1,
            },
            {
              object: "bulk_data",
              id: printingDescriptor.id,
              type: printingDescriptor.type,
              updated_at: printingDescriptor.updatedAt,
              download_uri: printingDescriptor.downloadUri,
              content_type: printingDescriptor.contentType,
              content_encoding: printingDescriptor.contentEncoding,
              size: printingDescriptor.size,
            },
          ],
        });
      }
      if (url === oracleDescriptor.downloadUri) {
        return new Response(
          new TextDecoder().decode(await fixtureBytes("oracle-cards.json")),
        );
      }
      if (url === printingDescriptor.downloadUri) {
        return new Response(
          new TextDecoder().decode(await fixtureBytes("default-cards.json")),
        );
      }
      return new Response("not found", { status: 404 });
    });

    const snapshot = await ingestScryfallSnapshot({
      outputRoot,
      fetch: fetcher,
      now: () => new Date("2026-08-21T01:00:00.000Z"),
      userAgent: "commander-agent-test/1",
    });

    expect(snapshot.manifest.counts.oracleCards).toBe(1);
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({
      headers: {
        Accept: "application/json",
        "User-Agent": "commander-agent-test/1",
      },
    });
  });

  it("rejects download URLs outside Scryfall", async () => {
    const outputRoot = await mkdtemp(join(tmpdir(), "commander-scryfall-"));
    temporaryDirectories.push(outputRoot);
    const fetcher: FetchLike = (url) => {
      if (url !== "https://api.scryfall.com/bulk-data") {
        throw new Error("unexpected network request");
      }
      return Promise.resolve(Response.json({
        object: "list",
        data: [
          {
            object: "bulk_data",
            id: "oracle",
            type: "oracle_cards",
            updated_at: "2026-08-21T00:00:00.000Z",
            download_uri: "https://example.com/oracle.json",
            content_type: "application/json",
            content_encoding: "gzip",
            size: 1,
          },
          {
            object: "bulk_data",
            id: "printing",
            type: "default_cards",
            updated_at: "2026-08-21T00:00:00.000Z",
            download_uri: "https://data.scryfall.io/default.json",
            content_type: "application/json",
            content_encoding: "gzip",
            size: 1,
          },
        ],
      }));
    };

    await expect(
      ingestScryfallSnapshot({ outputRoot, fetch: fetcher }),
    ).rejects.toThrow("refusing non-Scryfall URL");
  });
});
