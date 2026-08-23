import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { demoTemplateOrchestrator, isBracket, mechanicById } from "../apps/api/src/demo-template-adapter.ts";
import type { MechanicCandidate, ResolvedCommander } from "../apps/api/src/template-orchestrator.ts";
import { createCardCandidateRetriever } from "../apps/api/src/card-candidate-retriever.ts";
import type { CardCandidateBundle } from "../apps/api/src/card-candidate-retriever.ts";
import type { OptimizedTemplate } from "../apps/api/src/template-orchestrator.ts";
import { planManaBase } from "../apps/api/src/mana-base-planner.ts";
import { createNonbasicLandRetriever, type LandPreferences, type NonbasicLandBundle } from "../apps/api/src/nonbasic-land-retriever.ts";
import { calculateColoredSourceTargets } from "../apps/api/src/colored-source-target.ts";
import { validatePlayerDeck } from "../apps/api/src/player-deck-validator.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "apps", "web");
const routes = new Map([["/", "index.html"], ["/index.html", "index.html"], ["/styles.css", "styles.css"], ["/app.js", "app.js"]]);
const contentTypes: Record<string, string> = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8" };
export interface DemoServerOptions { retrieveCardCandidates?: (template: OptimizedTemplate) => Promise<CardCandidateBundle>; retrieveNonbasicLands?: (commander: ResolvedCommander, preferences?: LandPreferences) => Promise<NonbasicLandBundle> }

export function createDemoServer(options: DemoServerOptions = {}): Server {
  const retrieveCardCandidates = options.retrieveCardCandidates ?? createCardCandidateRetriever();
  const retrieveNonbasicLands = options.retrieveNonbasicLands ?? createNonbasicLandRetriever();
  return createServer((request, response) => { void handleRequest(request, response, retrieveCardCandidates, retrieveNonbasicLands); });
}

async function handleRequest(request: IncomingMessage, response: ServerResponse, retrieveCardCandidates: (template: OptimizedTemplate) => Promise<CardCandidateBundle>, retrieveNonbasicLands: (commander: ResolvedCommander, preferences?: LandPreferences) => Promise<NonbasicLandBundle>): Promise<void> {
    const url = new URL(request.url ?? "/", "http://localhost");
    if (url.pathname === "/health") {
      response.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      response.end(JSON.stringify({ status: "ok", application: "commander-agent-demo", version: "cp-14" }));
      return;
    }
    if (url.pathname.startsWith("/api/")) { await handleApi(request, url.pathname, response, retrieveCardCandidates, retrieveNonbasicLands); return; }
    const file = routes.get(url.pathname);
    if (!file) { response.writeHead(404, { "content-type": "text/plain; charset=utf-8" }); response.end("Not found"); return; }
    try {
      const body = await readFile(join(root, file));
      response.writeHead(200, { "content-type": contentTypes[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" });
      response.end(body);
    } catch {
      response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      response.end("Demo asset unavailable");
    }
}

async function handleApi(request: IncomingMessage, path: string, response: ServerResponse, retrieveCardCandidates: (template: OptimizedTemplate) => Promise<CardCandidateBundle>, retrieveNonbasicLands: (commander: ResolvedCommander, preferences?: LandPreferences) => Promise<NonbasicLandBundle>): Promise<void> {
  if (request.method !== "POST") { json(response, 405, { error: "method_not_allowed" }); return; }
  try {
    const body = await readJson(request);
    if (path === "/api/session") {
      if (typeof body["commander"] !== "string" || !isBracket(body["bracket"])) { json(response, 400, { error: "invalid_session_request" }); return; }
      json(response, 200, await demoTemplateOrchestrator.start(body["commander"], body["bracket"]));
      return;
    }
    if (path === "/api/map-mechanic") {
      const commander = parseCommander(body["commander"]);
      if (!commander || typeof body["input"] !== "string") { json(response, 400, { error: "invalid_mapping_request" }); return; }
      const mechanic = await demoTemplateOrchestrator.mapCustom(body["input"], commander);
      json(response, mechanic ? 200 : 422, mechanic ? { status: "mapped", mechanic } : { status: "unmapped" });
      return;
    }
    if (path === "/api/template") {
      const commander = parseCommander(body["commander"]);
      if (!commander || !isBracket(body["bracket"]) || !Array.isArray(body["mechanicIds"])) { json(response, 400, { error: "invalid_template_request" }); return; }
      const mechanics = body["mechanicIds"].filter((id): id is string => typeof id === "string").map(mechanicById).filter((item): item is MechanicCandidate => item !== null);
      json(response, 200, await demoTemplateOrchestrator.optimize(commander, body["bracket"], mechanics));
      return;
    }
    if (path === "/api/example") {
      const template = body["template"];
      if (!template || typeof template !== "object") { json(response, 400, { error: "invalid_example_request" }); return; }
      json(response, 200, { entries: await demoTemplateOrchestrator.example(template as Parameters<typeof demoTemplateOrchestrator.example>[0]) });
      return;
    }
    if (path === "/api/candidates") {
      const template = body["template"];
      if (!template || typeof template !== "object") { json(response, 400, { error: "invalid_candidate_request" }); return; }
      json(response, 200, await retrieveCardCandidates(template as Parameters<typeof retrieveCardCandidates>[0]));
      return;
    }
    if (path === "/api/mana-base") {
      const template = body["template"];
      if (!template || typeof template !== "object") { json(response, 400, { error: "invalid_mana_base_request" }); return; }
      const selectedCards = Array.isArray(body["selectedCards"]) ? body["selectedCards"].filter((card): card is { manaCost: string } => Boolean(card) && typeof card === "object" && typeof (card as Record<string, unknown>)["manaCost"] === "string") : [];
      json(response, 200, planManaBase(template as OptimizedTemplate, selectedCards));
      return;
    }
    if (path === "/api/land-candidates") {
      const commander = parseCommander(body["commander"]);
      if (!commander) { json(response, 400, { error: "invalid_land_candidate_request" }); return; }
      const maxPriceUsd = typeof body["maxPriceUsd"] === "number" ? body["maxPriceUsd"] : undefined;
      const preferences = maxPriceUsd === undefined ? {} : { maxPriceUsd };
      json(response, 200, await retrieveNonbasicLands(commander, preferences));
      return;
    }
    if (path === "/api/source-targets") {
      const cards = Array.isArray(body["cards"]) ? body["cards"].filter((card): card is { name: string; manaCost: string; manaValue: number } => Boolean(card) && typeof card === "object" && typeof (card as Record<string, unknown>)["name"] === "string" && typeof (card as Record<string, unknown>)["manaCost"] === "string" && typeof (card as Record<string, unknown>)["manaValue"] === "number") : [];
      const colors = Array.isArray(body["colorIdentity"]) ? body["colorIdentity"].filter((color): color is string => typeof color === "string") : [];
      const sources = body["availableSources"] && typeof body["availableSources"] === "object" ? body["availableSources"] as Record<string, number> : {};
      json(response, 200, calculateColoredSourceTargets(cards, colors, sources));
      return;
    }
    if (path === "/api/deck-validation") {
      try { json(response, 200, validatePlayerDeck(body as never)); }
      catch { json(response, 400, { error: "invalid_deck_validation_request" }); }
      return;
    }
    json(response, 404, { error: "not_found" });
  } catch (error) {
    json(response, error instanceof SyntaxError ? 400 : 422, { error: error instanceof Error ? error.message : "request_failed" });
  }
}

async function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.from(chunk as Uint8Array);
    size += buffer.length;
    if (size > 64 * 1024) throw new Error("request_too_large");
    chunks.push(buffer);
  }
  const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new SyntaxError("JSON object required");
  return parsed as Record<string, unknown>;
}

function parseCommander(value: unknown): ResolvedCommander | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate["oracleId"] !== "string" || typeof candidate["name"] !== "string" || !Array.isArray(candidate["colorIdentity"]) || !candidate["colorIdentity"].every((color) => typeof color === "string")) return null;
  const commander: ResolvedCommander = { oracleId: candidate["oracleId"], name: candidate["name"], colorIdentity: candidate["colorIdentity"] };
  if (typeof candidate["oracleText"] === "string") commander.oracleText = candidate["oracleText"];
  if (typeof candidate["typeLine"] === "string") commander.typeLine = candidate["typeLine"];
  if (typeof candidate["sourceId"] === "string") commander.sourceId = candidate["sourceId"];
  return commander;
}

function json(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(body));
}

export async function runSelfCheck(): Promise<void> {
  const server = createDemoServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("demo server did not bind a TCP port");
  try {
    const base = `http://127.0.0.1:${address.port}`;
    const [health, page, script, session] = await Promise.all([
      fetch(`${base}/health`), fetch(base), fetch(`${base}/app.js`),
      fetch(`${base}/api/session`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ commander: "Kenessos", bracket: 3 }) }),
    ]);
    if (!health.ok || (await health.json() as { status?: string }).status !== "ok") throw new Error("health check failed");
    if (!page.ok || !(await page.text()).includes("TEMPLATE_ENGINE")) throw new Error("terminal page check failed");
    if (!script.ok || !(await script.text()).includes("EXPORT_EXAMPLE_DECK")) throw new Error("demo script check failed");
    const sessionBody = await session.json() as { status?: string; mechanics?: unknown[] };
    if (!session.ok || sessionBody.status !== "ready" || !sessionBody.mechanics?.length) throw new Error("demo API session check failed");
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

async function main(): Promise<void> {
  if (process.argv.includes("--check")) { await runSelfCheck(); console.log("Local demo self-check passed."); return; }
  const parsed = Number(process.env["COMMANDER_AGENT_PORT"] ?? "4173");
  const port = Number.isInteger(parsed) && parsed > 0 && parsed <= 65_535 ? parsed : 4173;
  const server = createDemoServer();
  server.listen(port, "127.0.0.1", () => console.log(`Commander Agent demo ready at http://127.0.0.1:${port}`));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) void main();
