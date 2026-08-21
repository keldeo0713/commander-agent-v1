import { z } from "zod";

export const SchemaVersionSchema = z
  .string()
  .regex(/^[a-z][a-z0-9-]*\/[1-9][0-9]*$/, {
    message: "Expected a version such as run-manifest/1",
  });

export type SchemaVersion = z.infer<typeof SchemaVersionSchema>;
