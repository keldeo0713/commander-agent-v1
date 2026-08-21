import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return filesUnder(path);
      return entry.isFile() ? [path] : [];
    }),
  );
  return nested.flat();
}

const sourceRoots = ["apps", "packages", "scripts"];
const sourceFiles = (
  await Promise.all(sourceRoots.map((path) => filesUnder(join(root, path))))
)
  .flat()
  .filter((path) => [".ts", ".js", ".mjs"].includes(extname(path)));

for (const file of sourceFiles) {
  const result = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--check", file],
    { encoding: "utf8" },
  );
  assert.equal(
    result.status,
    0,
    `${relative(root, file)} failed syntax validation:\n${result.stderr}`,
  );
}

const jsonFiles = (await filesUnder(root)).filter(
  (path) =>
    extname(path) === ".json" && !path.includes(`${join(root, "node_modules")}/`),
);
for (const file of jsonFiles) {
  JSON.parse(await readFile(file, "utf8"));
}

const sample = JSON.parse(
  await readFile(join(root, "examples/run-manifest.sample.json"), "utf8"),
);
assert.equal(sample.schemaVersion, "run-manifest/1");
assert.equal(typeof sample.runId, "string");
assert.ok(sample.runId.length > 0);
assert.ok(Number.isInteger(sample.randomness?.sampleCount));
assert.ok(sample.randomness.sampleCount > 0);

await import("./check-boundaries.mjs");

console.log(
  `Offline checks passed: ${sourceFiles.length} source files and ${jsonFiles.length} JSON files.`,
);
