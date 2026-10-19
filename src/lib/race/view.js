/**
 * Paket U «Rennen» (Noah 19.10.2026 17:39 «alle 40 … prominent vorgeschlagen … jederzeit unsichtbar
 * oder ausschalten»): which functions of the race pages you hid (folded to one line) or switched off
 * (gone until you switch them on again in Plan › All 40 functions). One settings record for all races,
 * in the backup: { hidden: [boxId], off: [boxId] }.
 */
import { liveQuery } from 'dexie';
import { db } from '../db.js';

export const VIEW_KEY = 'race-view';
const clean = (v) => ({ hidden: Array.isArray(v?.hidden) ? v.hidden : [], off: Array.isArray(v?.off) ? v.off : [] });

/** Live: { hidden, off } (one query for every box on the page). */
export const viewQ = liveQuery(async () => clean((await db.settings.get(VIEW_KEY))?.value));

/** state: 'shown' | 'hidden' | 'off' for one box (or all boxes with id '*' and 'shown'). */
export async function setBox(id, state) {
  await db.transaction('rw', db.settings, async () => {
    const v = clean((await db.settings.get(VIEW_KEY))?.value);
    if (id === '*') return db.settings.put({ key: VIEW_KEY, value: { hidden: [], off: [] } });
    const hidden = v.hidden.filter((x) => x !== id);
    const off = v.off.filter((x) => x !== id);
    if (state === 'hidden') hidden.push(id);
    if (state === 'off') off.push(id);
    await db.settings.put({ key: VIEW_KEY, value: { hidden, off } });
  });
}
export const stateOf = (view, id) => (view?.off?.includes(id) ? 'off' : view?.hidden?.includes(id) ? 'hidden' : 'shown');
