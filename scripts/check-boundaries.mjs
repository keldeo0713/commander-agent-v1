import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = join(root, "packages");
const boundaryFile = join(root, "architecture-boundaries.json");
const packagePrefix = "@commander-agent/";

const boundaries = JSON.parse(await readFile(boundaryFile, "utf8"));

function isAllowedDependency(sourcePackage, targetPackage) {
  if (sourcePackage === targetPackage) return true;
  return boundaries[sourcePackage]?.includes(targetPackage) ?? false;
}

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return sourceFiles(path);
      return entry.isFile() && /\.[cm]?tsx?$/.test(entry.name) ? [path] : [];
    }),
  );
  return nested.flat();
}

const importPattern = /(?:from\s+|import\s*\()(["'])(@commander-agent\/[^"']+)\1/g;
const violations = [];

for (const sourcePackage of Object.keys(boundaries)) {
  const directory = join(packageRoot, sourcePackage, "src");
  for (const file of await sourceFiles(directory)) {
    const source = await readFile(file, "utf8");
    for (const match of source.matchAll(importPattern)) {
      const specifier = match[2];
      if (specifier === undefined) continue;
      const targetPackage = specifier.slice(packagePrefix.length).split("/")[0];
      if (!isAllowedDependency(sourcePackage, targetPackage)) {
        violations.push(
          `${relative(root, file)}: ${sourcePackage} may not import ${targetPackage}`,
        );
      }
    }
  }
}

assert.equal(
  isAllowedDependency("domain", "integrations-archidekt"),
  false,
  "domain must not depend on integrations",
);
assert.equal(
  isAllowedDependency("optimizer", "simulator"),
  true,
  "optimizer is allowed to use the simulator port",
);

if (violations.length > 0) {
  console.error("Architecture boundary violations:\n" + violations.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Architecture boundaries valid for ${Object.keys(boundaries).length} packages.`,
  );
}
