import { describe, expect, it, vi } from "vitest";
import { createScryfallCommanderResolver } from "./scryfall-commander-resolver.js";

const kenessos = { oracle_id: "45b3a028-5705-4dc8-bfab-04bb5e01eea6", name: "Kenessos, Priest of Thassa", type_line: "Legendary Creature — Merfolk Cleric", oracle_text: "Scry one additional card. Look at the top card of your library.", color_identity: ["G", "U"], legalities: { commander: "legal" } };

describe("Scryfall commander resolver", () => {
  it("resolves an exact legal commander with authoritative strategy facts", async () => {
    const fetchCard = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(kenessos), { status: 200 }));
    const resolve = createScryfallCommanderResolver({ fetch: fetchCard });
    await expect(resolve("  Kenessos,   Priest of Thassa ")).resolves.toMatchObject({ name: kenessos.name, colorIdentity: ["G", "U"], typeLine: kenessos.type_line, sourceId: "scryfall-named-api/1" });
    const requestUrl = fetchCard.mock.calls[0]?.[0];
    expect(requestUrl).toBeInstanceOf(URL);
    expect((requestUrl as URL).searchParams.get("exact")).toBe("Kenessos, Priest of Thassa");
  });

  it("rejects legal non-commanders and commander-illegal cards", async () => {
    const resolveNonCommander = createScryfallCommanderResolver({ fetch: vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ ...kenessos, type_line: "Sorcery" }), { status: 200 })) });
    const resolveIllegal = createScryfallCommanderResolver({ fetch: vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ ...kenessos, legalities: { commander: "banned" } }), { status: 200 })) });
    await expect(resolveNonCommander("Cultivate")).resolves.toBeNull();
    await expect(resolveIllegal("Banned Commander")).resolves.toBeNull();
  });

  it("caches exact lookups and treats a provider 404 as not found", async () => {
    const fetchCard = vi.fn<typeof fetch>().mockResolvedValue(new Response("{}", { status: 404 }));
    const resolve = createScryfallCommanderResolver({ fetch: fetchCard });
    await expect(resolve("Missing")).resolves.toBeNull();
    await expect(resolve("missing")).resolves.toBeNull();
    expect(fetchCard).toHaveBeenCalledTimes(1);
  });
});
