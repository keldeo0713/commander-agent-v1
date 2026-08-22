export const TEMPLATE_ORCHESTRATION_VERSION = "template-orchestration/1" as const;

export type CommanderBracket = 1 | 2 | 3 | 4 | 5;
export interface ResolvedCommander { oracleId: string; name: string; colorIdentity: string[]; oracleText?: string; typeLine?: string; sourceId?: string }
export interface MechanicCandidate { id: string; name: string; componentIds: string[]; reason: string; provenanceId: string }
export interface FunctionalSlot { quantity: number; roleId: string; objective: string; selectionRule: string }
export interface OptimizedTemplate {
  schemaVersion: "functional-template/1";
  commander: ResolvedCommander;
  bracket: CommanderBracket;
  mechanics: MechanicCandidate[];
  slots: FunctionalSlot[];
}
export interface ExampleDeckEntry { oracleId: string; name: string; quantity: number; roleId: string; commander: boolean }

export interface TemplateOrchestrationPorts {
  resolveCommander(name: string): Promise<ResolvedCommander | null>;
  retrieveMechanics(commander: ResolvedCommander, bracket: CommanderBracket): Promise<MechanicCandidate[]>;
  mapCustomMechanic(input: string, commander: ResolvedCommander): Promise<MechanicCandidate | null>;
  optimize(input: { commander: ResolvedCommander; bracket: CommanderBracket; mechanics: MechanicCandidate[] }): Promise<FunctionalSlot[]>;
  buildExample(template: OptimizedTemplate): Promise<ExampleDeckEntry[]>;
}

export type TemplateSessionResult =
  | { status: "ready"; commander: ResolvedCommander; mechanics: MechanicCandidate[] }
  | { status: "commander_not_found"; query: string };

export class TemplateOrchestrator {
  private readonly ports: TemplateOrchestrationPorts;

  constructor(ports: TemplateOrchestrationPorts) {
    this.ports = ports;
  }

  async start(commanderName: string, bracket: CommanderBracket): Promise<TemplateSessionResult> {
    const query = commanderName.trim();
    const commander = query ? await this.ports.resolveCommander(query) : null;
    if (!commander) return { status: "commander_not_found", query };
    const mechanics = deduplicate(await this.ports.retrieveMechanics(commander, bracket));
    return { status: "ready", commander, mechanics };
  }

  async mapCustom(input: string, commander: ResolvedCommander): Promise<MechanicCandidate | null> {
    const mapped = await this.ports.mapCustomMechanic(input.trim(), commander);
    return mapped?.componentIds.length ? mapped : null;
  }

  async optimize(commander: ResolvedCommander, bracket: CommanderBracket, mechanics: MechanicCandidate[]): Promise<OptimizedTemplate> {
    const selected = deduplicate(mechanics);
    if (selected.length === 0) throw new Error("at least one mapped mechanic is required");
    const slots = await this.ports.optimize({ commander, bracket, mechanics: selected });
    assertTemplate(slots);
    return { schemaVersion: "functional-template/1", commander: structuredClone(commander), bracket, mechanics: structuredClone(selected), slots: structuredClone(slots) };
  }

  async example(template: OptimizedTemplate): Promise<ExampleDeckEntry[]> {
    const entries = await this.ports.buildExample(template);
    const total = entries.reduce((sum, entry) => sum + entry.quantity, 0);
    if (total !== 100) throw new Error(`example deck requires exactly 100 cards; received ${total}`);
    if (entries.filter((entry) => entry.commander).reduce((sum, entry) => sum + entry.quantity, 0) < 1) throw new Error("example deck requires a commander");
    const expected = new Map(template.slots.map((slot) => [slot.roleId, slot.quantity]));
    const actual = new Map<string, number>();
    for (const entry of entries) actual.set(entry.roleId, (actual.get(entry.roleId) ?? 0) + entry.quantity);
    for (const [roleId, quantity] of expected) if ((actual.get(roleId) ?? 0) !== quantity) throw new Error(`example role mismatch for ${roleId}`);
    return structuredClone(entries);
  }
}

function deduplicate(mechanics: MechanicCandidate[]): MechanicCandidate[] {
  return [...new Map(mechanics.map((mechanic) => [mechanic.id, mechanic])).values()];
}
function assertTemplate(slots: FunctionalSlot[]): void {
  const total = slots.reduce((sum, slot) => sum + slot.quantity, 0);
  if (total !== 100) throw new Error(`template requires exactly 100 cards; received ${total}`);
  if (slots.some((slot) => slot.quantity < 1 || !slot.roleId || !slot.objective || !slot.selectionRule)) throw new Error("template slots must be complete and positive");
}
