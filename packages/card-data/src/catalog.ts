import type {
  CardDatasetSnapshot,
  CardPrinting,
  OracleCard,
} from "./types.js";

function normalizedName(name: string): string {
  return name.normalize("NFKC").trim().toLocaleLowerCase("en-US");
}

function printingKey(setCode: string, collectorNumber: string): string {
  return `${setCode.toLowerCase()}:${collectorNumber.toLowerCase()}`;
}

export class CardCatalog {
  readonly datasetId: string;

  readonly #oracleById = new Map<string, OracleCard>();
  readonly #oracleIdsByName = new Map<string, Set<string>>();
  readonly #printingByScryfallId = new Map<string, CardPrinting>();
  readonly #printingByCollector = new Map<string, CardPrinting>();
  readonly #printingsByOracleId = new Map<string, CardPrinting[]>();

  constructor(snapshot: CardDatasetSnapshot) {
    this.datasetId = snapshot.manifest.datasetId;

    for (const card of snapshot.oracleCards) {
      this.#oracleById.set(card.oracleId, card);
      for (const name of [card.name, ...card.faceNames]) {
        const key = normalizedName(name);
        const ids = this.#oracleIdsByName.get(key) ?? new Set<string>();
        ids.add(card.oracleId);
        this.#oracleIdsByName.set(key, ids);
      }
    }

    for (const printing of snapshot.printings) {
      this.#printingByScryfallId.set(printing.scryfallId, printing);
      this.#printingByCollector.set(
        printingKey(printing.setCode, printing.collectorNumber),
        printing,
      );
      const printings = this.#printingsByOracleId.get(printing.oracleId) ?? [];
      printings.push(printing);
      this.#printingsByOracleId.set(printing.oracleId, printings);
    }
  }

  findOracleById(oracleId: string): OracleCard | null {
    return this.#oracleById.get(oracleId) ?? null;
  }

  findOracleByName(name: string): OracleCard[] {
    const ids = this.#oracleIdsByName.get(normalizedName(name));
    if (ids === undefined) return [];
    return [...ids]
      .map((id) => this.#oracleById.get(id))
      .filter((card): card is OracleCard => card !== undefined)
      .sort((left, right) => left.oracleId.localeCompare(right.oracleId));
  }

  findPrintingByScryfallId(scryfallId: string): CardPrinting | null {
    return this.#printingByScryfallId.get(scryfallId) ?? null;
  }

  findPrintingByCollector(
    setCode: string,
    collectorNumber: string,
  ): CardPrinting | null {
    return (
      this.#printingByCollector.get(printingKey(setCode, collectorNumber)) ?? null
    );
  }

  printingsForOracle(oracleId: string): CardPrinting[] {
    return [...(this.#printingsByOracleId.get(oracleId) ?? [])].sort(
      (left, right) =>
        left.releasedAt.localeCompare(right.releasedAt) ||
        left.scryfallId.localeCompare(right.scryfallId),
    );
  }
}
