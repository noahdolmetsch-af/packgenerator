/**
 * Durchklick Etappe 2, Frage 1a (Noah 05.11.2026): on a phone the two cards «Belongs to …» and «All here» start as ONE line
 * on the pages where the page itself should come first (Packing, Trips, Material, Bikes), like «What you can do here» already
 * does (FOLDED_FIRST in seiteninhalt.js). A tap on the line opens the card; «Fold the card» closes it again. The choice is
 * kept per card in the settings (so in the backup). Computer and tablets keep the open cards. Pure; CardFold.svelte uses it.
 */

/** The setting that keeps the choices: { [card id]: true opened | false folded }. */
export const CARDS_KEY = 'karten.offen';

/** The cards that start as one line on a phone: 'gd:<page>' is «Belongs to …» of a page, 'ah:<area>' is «All here» of an area. */
export const START_FOLDED = ['gd:pack', 'gd:trips', 'gd:bikes', 'gd:gear', 'ah:trips', 'ah:gear', 'ah:bikes'];

/** The stored choices, anything but true/false left out. */
export const openMapOf = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).filter(([, x]) => typeof x === 'boolean')) : {});

/** Whether a card shows as one line: the stored choice, else folded on a phone for the cards of START_FOLDED. */
export function cardFolded(map, id, phone, first = START_FOLDED) {
  const m = openMapOf(map);
  return id in m ? !m[id] : !!phone && first.includes(id);
}
