export const ARCHIDEKT_EXPORT_VERSION = "archidekt-text/1" as const;

export interface PortableDeckEntry { oracleId: string; name: string; quantity: number }
export interface PortableDeck {
  name: string;
  commanders: PortableDeckEntry[];
  cards: PortableDeckEntry[];
}
export interface ParsedDeckList {
  name: string | null;
  commanderNames: string[];
  entries: Array<{ name: string; quantity: number; category: "commander" | "deck" }>;
  issues: Array<{ line: number; message: string }>;
}

export function exportArchidektText(deck: PortableDeck): string {
  validatePortableDeck(deck);
  const lines = [`// ${deck.name}`, "// COMMANDER"];
  for (const entry of sorted(deck.commanders)) lines.push(`${entry.quantity} ${entry.name}`);
  lines.push("", "// DECK");
  for (const entry of sorted(deck.cards)) lines.push(`${entry.quantity} ${entry.name}`);
  return `${lines.join("\n")}\n`;
}

export function parseDeckList(input: string): ParsedDeckList {
  let category: "commander" | "deck" = "deck";
  let name: string | null = null;
  const commanderNames: string[] = [];
  const entries: ParsedDeckList["entries"] = [];
  const issues: ParsedDeckList["issues"] = [];
  for (const [index, raw] of input.split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("//")) {
      const heading = line.slice(2).trim();
      if (/^commander$/i.test(heading)) category = "commander";
      else if (/^deck$/i.test(heading)) category = "deck";
      else if (!name) name = heading;
      continue;
    }
    const match = line.match(/^(\d+)\s+(.+?)(?:\s+\([A-Z0-9]+\)\s+\S+)?$/);
    if (!match) { issues.push({ line: index + 1, message: "expected quantity followed by card name" }); continue; }
    const quantity = Number(match[1]);
    const cardName = match[2]?.trim() ?? "";
    if (quantity < 1 || !cardName) { issues.push({ line: index + 1, message: "quantity and card name must be non-empty" }); continue; }
    entries.push({ name: cardName, quantity, category });
    if (category === "commander") commanderNames.push(cardName);
  }
  return { name, commanderNames, entries, issues };
}

export function validatePortableDeck(deck: PortableDeck): void {
  const total = [...deck.commanders, ...deck.cards].reduce((sum, entry) => sum + entry.quantity, 0);
  if (total !== 100) throw new Error(`Commander export requires exactly 100 cards; received ${total}`);
  if (deck.commanders.length < 1 || deck.commanders.length > 2) throw new Error("Commander export requires one or two commanders");
  const ids = new Set<string>();
  for (const entry of [...deck.commanders, ...deck.cards]) {
    if (!entry.oracleId || !entry.name || entry.quantity < 1) throw new Error("every export entry requires identity, name, and positive quantity");
    if (ids.has(entry.oracleId)) throw new Error(`duplicate Oracle identity across export sections: ${entry.oracleId}`);
    ids.add(entry.oracleId);
  }
}
function sorted(entries: readonly PortableDeckEntry[]): PortableDeckEntry[] {
  return [...entries].sort((a, b) => a.name.localeCompare(b.name));
}
