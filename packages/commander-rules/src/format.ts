import {
  COMMANDER_RULES_SCHEMA_VERSION,
  type CommanderFormatSnapshot,
} from "./types.js";

export const COMMANDER_FORMAT_2026_02_09: CommanderFormatSnapshot = {
  schemaVersion: COMMANDER_RULES_SCHEMA_VERSION,
  snapshotId: "commander-2026-02-09",
  effectiveDate: "2026-02-09",
  deckSize: 100,
  sourceUrls: [
    "https://magic.wizards.com/en/banned-restricted-list",
    "https://mtgcommander.net/index.php/rules/",
    "https://magic.wizards.com/en/news/announcements/commander-banned-and-restricted-february-9-2026",
  ],
  bannedNames: [
    "Ancestral Recall", "Balance", "Black Lotus", "Chaos Orb", "Channel",
    "Dockside Extortionist", "Emrakul, the Aeons Torn", "Erayo, Soratami Ascendant",
    "Falling Star", "Fastbond", "Flash", "Golos, Tireless Pilgrim", "Griselbrand",
    "Hullbreacher", "Iona, Shield of Emeria", "Karakas", "Jeweled Lotus",
    "Leovold, Emissary of Trest", "Library of Alexandria", "Limited Resources",
    "Mana Crypt", "Mox Emerald", "Mox Jet", "Mox Pearl", "Mox Ruby", "Mox Sapphire",
    "Nadu, Winged Wisdom", "Paradox Engine", "Primeval Titan", "Prophet of Kruphix",
    "Recurring Nightmare", "Rofellos, Llanowar Emissary", "Shahrazad", "Sundering Titan",
    "Sylvan Primordial", "Time Vault", "Time Walk", "Tinker", "Tolarian Academy",
    "Trade Secrets", "Upheaval", "Yawgmoth's Bargain",
  ],
  companionBannedNames: ["Lutri, the Spellchaser"],
  supportedCommanderPairs: [
    "partner", "friends_forever", "choose_background", "doctors_companion",
  ],
};
