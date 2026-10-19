/**
 * v0.124.0 «Neue Tour Teil 2», B4 «Bausteine beim Packen» (mockup B4, Noah 12.10.2026 «b2 b4 b5 ok»):
 * the building blocks of a trip as big option buttons in Packen. «Dabei» (on the trip, green with ✓):
 * what the trip's context brings or what was switched on; «Dazunehmen» (white with +): the other blocks
 * with items. A suggestion gets a dashed frame and a small label: an own rain block when the weather is
 * wet, and a Repair that is not slim yet (its tap opens «Reparatur unterwegs», B5).
 * One tap switches the whole block (trips.js toggleSet, the same as the old switches); nothing is forced.
 * SN3+ «Bausteine je nach Lage» (answer 5a): the seven blocks of situation.js come the same way, dashed
 * with their reason; the rain suggestion is now the rule of the block Regen (an own block named like
 * rain follows the same rule, so nothing changes for it).
 * Pure functions only, tested in tests/packblocks.test.js and tests/situation.test.js.
 */
import { allSets, setView } from './sets.js';
import { NIGHT_SETS } from './trips.js';
import { activeBlocks, OFFER_ONLY } from './context.js';
import { tempKits, rainChance } from './wardrobe.js';
import { needsSlim, repairItems, REPAIR } from './repairslim.js';
import { SITUATION_BLOCKS, situationHits, ownHits } from './situation.js';
import { RAIN_LIMIT, rainLimit } from './rainlimit.svelte.js';

/** The built-in blocks shown in Packen, in this order: the ride's (first aid, light, repair, charging, race, cook), food, hygiene. */
export const PACK_BLOCKS = [...NIGHT_SETS.map((s) => s.key), 'food', 'hygiene', ...SITUATION_BLOCKS];
/** An own block for rain, by its name. */
export const RAIN_WORDS = /rain|regen|nass|wet/i;
/** From this rain chance (%) an own rain block is suggested (SN3+: the standard of the rule Regen; v0.144.0 RE: the one rain limit). */
export const RAIN_PCT = RAIN_LIMIT;

/** Is the trip's weather wet? → the rain chance in % (null when only «showers/rain» is known) or false. */
export function wetTrip(trip, limit = rainLimit()) {
  const pct = rainChance(trip);
  if (pct != null && pct >= limit) return pct;
  return trip?.wx?.rain === 'rain' || trip?.wx?.rain === 'showers' ? null : false;
}

/**
 * The buttons of one trip: { on: [row], add: [row] }. row: { key, name, n, g, missing, ids, on,
 * suggest: null | { kind: 'rain', pct } | { kind: 'slim', n } | a reason of situation.js ruleHit }. Only blocks with owned items; the
 * temperature kits (the onion's) and Comfort (offered item by item) are left out.
 */
export function blockRows(trip, items, setsValue) {
  if (!trip) return { on: [], add: [] };
  const active = new Set(activeBlocks(trip));
  const sets = allSets(setsValue);
  const kits = new Set(tempKits(setsValue).map((k) => k.key));
  const builtIn = PACK_BLOCKS.map((k) => sets.find((s) => s.key === k)).filter(Boolean);
  const own = sets.filter((s) => !s.builtIn && !kits.has(s.key) && !OFFER_ONLY.includes(s.key));
  // SN3+: the blocks «je nach Lage» that fit this trip ({ cold: { kind, c }, rain: { kind, pct }, … })
  const hits = situationHits(trip, setsValue);
  // Paket H #260: own blocks with their own rule («Kommt mit, wenn …»)
  const mine = ownHits(trip, setsValue);
  const slim = needsSlim(items);
  const rows = [...builtIn, ...own]
    .map((s) => {
      const v = setView(s, items);
      const on = active.has(s.key);
      let suggest = null;
      if (!on && s.key === REPAIR && slim) suggest = { kind: 'slim', n: repairItems(items).length };
      else if (!on && hits[s.key]) suggest = { ...hits[s.key] };
      else if (!on && mine[s.key]) suggest = { ...mine[s.key] };
      else if (!on && !s.builtIn && hits.rain && RAIN_WORDS.test(s.name)) suggest = { kind: 'rain', pct: hits.rain.pct };
      return { key: s.key, name: s.builtIn ? s.name.replace(/^(Night|Nacht): /, '') : s.name, builtIn: s.builtIn, ...(s.rule && !s.builtIn ? { rule: s.rule } : {}), n: v.inventory.length, g: v.g, missing: v.missing, ids: v.inventory.map((i) => i.id), on, suggest };
    })
    .filter((r) => r.n > 0);
  const add = rows.filter((r) => !r.on);
  return { on: rows.filter((r) => r.on), add: [...add.filter((r) => r.suggest), ...add.filter((r) => !r.suggest)] };
}
