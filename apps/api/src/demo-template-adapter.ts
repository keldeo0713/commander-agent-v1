import { createHash } from "node:crypto";
import {
  TemplateOrchestrator,
  type CommanderBracket,
  type ExampleDeckEntry,
  type FunctionalSlot,
  type MechanicCandidate,
  type OptimizedTemplate,
  type TemplateOrchestrationPorts,
} from "./template-orchestrator.ts";

const MECHANICS: MechanicCandidate[] = [
  mechanic("top-deck", "Top-deck manipulation", ["selection", "library-setup"], "Improves draw quality and planned reveals"),
  mechanic("big-creatures", "Big creature payoffs", ["threat-density", "mana-value-payoff"], "Turns setup and mana into closing threats"),
  mechanic("graveyard", "Graveyard value", ["graveyard-setup", "recursion"], "Reuses cards and creates a resilient resource loop"),
  mechanic("tokens", "Tokens / go-wide", ["token-production", "board-scaling"], "Builds a wide board and rewards creature volume"),
  mechanic("artifacts", "Artifact engine", ["artifact-density", "artifact-payoff"], "Uses artifacts as acceleration and engine pieces"),
  mechanic("spells", "Spellslinger", ["spell-density", "spell-payoff"], "Rewards repeated instant and sorcery casting"),
  mechanic("lands", "Landfall", ["land-development", "landfall-payoff"], "Converts land drops into repeatable value"),
  mechanic("combat", "Combat / Voltron", ["commander-damage", "combat-protection"], "Builds a protected combat-based closing line"),
];

const TEMPLATE_SLOTS: FunctionalSlot[] = [
  { quantity: 1, roleId: "commander", objective: "Define the engine", selectionRule: "Resolved commander" },
  { quantity: 37, roleId: "mana-base", objective: "Cast spells on curve", selectionRule: "Tune sources to color identity" },
  { quantity: 10, roleId: "ramp", objective: "Develop ahead of curve", selectionRule: "Prefer efficient acceleration" },
  { quantity: 15, roleId: "primary-engine", objective: "Execute chosen mechanics", selectionRule: "Direct enablers first" },
  { quantity: 12, roleId: "payoffs-finishers", objective: "Convert engine into wins", selectionRule: "Use multiple closing paths" },
  { quantity: 9, roleId: "card-advantage", objective: "Maintain resources", selectionRule: "Prefer synergy overlap" },
  { quantity: 10, roleId: "interaction", objective: "Contest opposing plans", selectionRule: "Flexible efficient answers" },
  { quantity: 6, roleId: "protection-rebuild", objective: "Recover from disruption", selectionRule: "Protect and rebuild" },
];

export const demoTemplateOrchestrator = new TemplateOrchestrator(createDemoPorts());

export function isBracket(value: unknown): value is CommanderBracket {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 5;
}

export function mechanicById(id: string): MechanicCandidate | null {
  return structuredClone(MECHANICS.find((candidate) => candidate.id === id) ?? null);
}

function createDemoPorts(): TemplateOrchestrationPorts {
  return {
    resolveCommander: (name) => {
      const normalized = name.replace(/\s+/g, " ").trim();
      if (!normalized) return Promise.resolve(null);
      const isKenessos = /^kenessos(?:, priest of thassa)?$/i.test(normalized);
      return Promise.resolve({
        oracleId: isKenessos ? "e7188e71-115c-4f90-a1e1-8656f2f8f40c" : `demo-${createHash("sha256").update(normalized.toLowerCase()).digest("hex").slice(0, 16)}`,
        name: isKenessos ? "Kenessos, Priest of Thassa" : normalized,
        colorIdentity: isKenessos ? ["G", "U"] : [],
      });
    },
    retrieveMechanics: (commander, bracket) => Promise.resolve(MECHANICS.map((candidate) => ({
      ...structuredClone(candidate),
      reason: `${candidate.reason}; available for ${commander.name} at bracket ${bracket}`,
    }))),
    mapCustomMechanic: (input) => Promise.resolve(mapCustom(input)),
    optimize: () => Promise.resolve(structuredClone(TEMPLATE_SLOTS)),
    buildExample: (template) => Promise.resolve(buildKenessosExample(template)),
  };
}

function mechanic(id: string, name: string, componentIds: string[], reason: string): MechanicCandidate {
  return { id, name, componentIds, reason, provenanceId: "demo-mechanic-taxonomy/1" };
}

function mapCustom(input: string): MechanicCandidate | null {
  const text = input.toLowerCase();
  const match = [
    { pattern: /grave|recur|discard|mill/, id: "graveyard" },
    { pattern: /token|go wide|creature army/, id: "tokens" },
    { pattern: /artifact|treasure|clue|food/, id: "artifacts" },
    { pattern: /instant|sorcery|spell|copy/, id: "spells" },
    { pattern: /land|ramp/, id: "lands" },
    { pattern: /combat|voltron|equipment|aura/, id: "combat" },
    { pattern: /top|scry|surveil|library|draw/, id: "top-deck" },
    { pattern: /big|sea|kraken|leviathan|serpent|octopus/, id: "big-creatures" },
  ].find(({ pattern }) => pattern.test(text));
  if (!match) return null;
  const candidate = MECHANICS.find(({ id }) => id === match.id);
  return candidate ? { ...structuredClone(candidate), reason: `Mapped from custom input “${input}” to registered components` } : null;
}

function buildKenessosExample(template: OptimizedTemplate): ExampleDeckEntry[] {
  if (template.commander.name !== "Kenessos, Priest of Thassa") throw new Error("example deck is available only for the Kenessos demonstration fixture");
  const names = [
    "Rejuvenating Springs", "Reliquary Tower", "Yavimaya Coast", "Command Tower", "Exotic Orchard", "Temple of Mystery", "Thornwood Falls", "Myriad Landscape", "Bonders' Enclave", "Vineglimmer Snarl",
    "Arcane Signet", "Cultivate", "Farseek", "Kodama's Reach", "Nature's Lore", "Rampant Growth", "Simic Signet", "Sol Ring", "Talisman of Curiosity", "Three Visits",
    "Brainstorm", "Crystal Ball", "Halimar Depths", "Mystic Speculation", "Otherworldly Gaze", "Preordain", "Scroll Rack", "Sensei's Divining Top", "Serum Visions", "Soothsaying", "Sylvan Library", "Worldly Tutor", "Aesi, Tyrant of Gyre Strait", "Arixmethes, Slumbering Isle", "Breaching Leviathan",
    "Brinelin, the Moon Kraken", "Deep-Sea Kraken", "Hullbreaker Horror", "Inkwell Leviathan", "Koma, Cosmos Serpent", "Lorthos, the Tidemaker", "Nezahal, Primal Tide", "Octavia, Living Thesis", "Scourge of Fleets", "Serpent of Yawning Depths", "Spawning Kraken", "Stormtide Leviathan",
    "Waker of Waves", "Beast Whisperer", "Garruk's Uprising", "Guardian Project", "Return of the Wildspeaker", "Rishkar's Expertise", "Tribute to the World Tree", "Up the Beanstalk", "Wavebreak Hippocamp",
    "Beast Within", "Counterspell", "Negate", "Pongify", "Rapid Hybridization", "Reality Shift", "Resculpt", "Swan Song", "Krosan Grip", "Aetherize",
    "Heroic Intervention", "Tamiyo's Safekeeping", "Tyvar's Stand", "Slip Out the Back", "Eternal Witness", "Bala Ged Recovery",
  ];
  const ranges: Array<[number, number, string]> = [[0, 10, "mana-base"], [10, 20, "ramp"], [20, 35, "primary-engine"], [35, 47, "payoffs-finishers"], [47, 56, "card-advantage"], [56, 66, "interaction"], [66, 72, "protection-rebuild"]];
  const entries: ExampleDeckEntry[] = [
    { oracleId: template.commander.oracleId, name: template.commander.name, quantity: 1, roleId: "commander", commander: true },
    { oracleId: "basic-island", name: "Island", quantity: 14, roleId: "mana-base", commander: false },
    { oracleId: "basic-forest", name: "Forest", quantity: 13, roleId: "mana-base", commander: false },
  ];
  for (const [start, end, roleId] of ranges) for (const name of names.slice(start, end)) entries.push({ oracleId: `demo-${slug(name)}`, name, quantity: 1, roleId, commander: false });
  return entries;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
