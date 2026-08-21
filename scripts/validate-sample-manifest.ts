import sampleManifest from "../examples/run-manifest.sample.json" with {
  type: "json",
};
import { RunManifestSchema } from "../packages/domain/src/run-manifest.js";

const manifest = RunManifestSchema.parse(sampleManifest);

console.log(
  `Validated ${manifest.schemaVersion} sample ${manifest.runId} (${manifest.randomness.sampleCount} sample).`,
);
