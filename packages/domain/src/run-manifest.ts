import { z } from "zod";

import { SchemaVersionSchema } from "./schema-version.js";

const VersionRefSchema = z.object({
  id: z.string().min(1),
  schemaVersion: SchemaVersionSchema,
});

export const RunManifestSchema = z.object({
  schemaVersion: z.literal("run-manifest/1"),
  runId: z.string().min(1),
  createdAt: z.iso.datetime(),
  deckSpec: VersionRefSchema,
  deckVersion: z.object({
    id: z.string().min(1),
    version: z.int().nonnegative(),
  }),
  components: z.object({
    cardDataset: z.string().min(1),
    formatSnapshot: z.string().min(1),
    classification: z.string().min(1),
    simulator: z.string().min(1),
    optimizer: z.string().min(1),
    actionPolicy: z.string().min(1),
    goalDefinition: z.string().min(1),
    scenario: z.string().min(1),
  }),
  randomness: z.object({
    seedSetId: z.string().min(1),
    sampleCount: z.int().positive(),
  }),
  execution: z.object({
    codeRevision: z.string().min(1),
  }),
  ai: z
    .object({
      provider: z.string().min(1),
      model: z.string().min(1),
      promptVersion: z.string().min(1),
    })
    .optional(),
});

export type RunManifest = z.infer<typeof RunManifestSchema>;
