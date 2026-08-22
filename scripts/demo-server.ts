import { createServer, type Server, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "apps", "web");
const routes = new Map([["/", "index.html"], ["/index.html", "index.html"], ["/styles.css", "styles.css"], ["/app.js", "app.js"]]);
const contentTypes: Record<string, string> = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8" };

export function createDemoServer(): Server {
  return createServer((request, response) => { void handleRequest(request.url, response); });
}

async function handleRequest(requestUrl: string | undefined, response: ServerResponse): Promise<void> {
    const url = new URL(requestUrl ?? "/", "http://localhost");
    if (url.pathname === "/health") {
      response.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      response.end(JSON.stringify({ status: "ok", application: "commander-agent-demo", version: "cp-13" }));
      return;
    }
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

export async function runSelfCheck(): Promise<void> {
  const server = createDemoServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("demo server did not bind a TCP port");
  try {
    const base = `http://127.0.0.1:${address.port}`;
    const [health, page, script] = await Promise.all([fetch(`${base}/health`), fetch(base), fetch(`${base}/app.js`)]);
    if (!health.ok || (await health.json() as { status?: string }).status !== "ok") throw new Error("health check failed");
    if (!page.ok || !(await page.text()).includes("TEMPLATE_ENGINE")) throw new Error("terminal page check failed");
    if (!script.ok || !(await script.text()).includes("EXPORT_EXAMPLE_DECK")) throw new Error("demo script check failed");
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
