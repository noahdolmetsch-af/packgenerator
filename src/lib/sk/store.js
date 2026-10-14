/**
 * SK: reading and writing the tile rows and the outside links. All of it lives in the settings table
 * (goes into every backup, stays on this device): `sk.page.<page>` per page (order pins, hidden tiles,
 * added tiles, dated taps, own link tiles), `sk.links` (own links by slot) and `sk.off` (link kinds
 * switched off).
 */
import { db } from '../db.js';
import { skKey, normState, bumpUse } from './tiles.js';
import { LINKS_KEY, OFF_KEY, safeUrl } from './links.js';
import { localDay } from '../localday.js';

/** Change a page's state in one transaction (no tap or change gets lost). fn(state) → new state. */
export async function changePage(page, fn) {
  await db.transaction('rw', db.settings, async () => {
    const cur = normState((await db.settings.get(skKey(page)))?.value);
    await db.settings.put({ key: skKey(page), value: fn(cur) });
  });
}

/** Put a whole state back (Undo). */
export const putPage = (page, state) => db.settings.put({ key: skKey(page), value: normState(state) });

/** A tap on a tile: counted with today's date. Counting never stops the tap itself. */
export async function tapTile(page, id) {
  try {
    await changePage(page, (s) => bumpUse(s, id, localDay()));
  } catch {
    /* the tile still opens */
  }
}

/** Keep an own link (slot → { url, name }); a bad address is refused (returns false). */
export async function setOwnLink(slot, { url, name = '' }) {
  const safe = safeUrl(url);
  if (!safe) return false;
  await db.transaction('rw', db.settings, async () => {
    const cur = (await db.settings.get(LINKS_KEY))?.value ?? {};
    await db.settings.put({ key: LINKS_KEY, value: { ...cur, [slot]: { url: safe, name: String(name).trim().slice(0, 80) } } });
  });
  return true;
}

/** Forget an own link. */
export async function removeOwnLink(slot) {
  await db.transaction('rw', db.settings, async () => {
    const cur = { ...((await db.settings.get(LINKS_KEY))?.value ?? {}) };
    delete cur[slot];
    await db.settings.put({ key: LINKS_KEY, value: cur });
  });
}

/** Switch a kind of link off («Diesen Link nicht mehr zeigen», «Nicht mehr vorschlagen») or on again. */
export async function setLinkOff(kind, off = true) {
  await db.transaction('rw', db.settings, async () => {
    const cur = (await db.settings.get(OFF_KEY))?.value ?? [];
    const next = off ? [...new Set([...cur, kind])] : cur.filter((k) => k !== kind);
    await db.settings.put({ key: OFF_KEY, value: next });
  });
}
