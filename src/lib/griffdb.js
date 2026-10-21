/**
 * Paket VG «Das Velo im Griff»: the writes. Everything in db.settings (griff.*) or on the bike (bike.chains),
 * the photos in db.photos (fields `wear` / `pack`, the photo storage of the bike pages), so no Dexie version.
 * Every write returns what Undo needs.
 */
import { db as appDb } from './db.js';
import { PREFS_KEY, prefsOf, springDay, springText, syncSpring, wetChainEntry } from './griff.js';
import { MERKEN_KEY, loadTodos } from './merkendb.js';
import { withVisits } from './workshop.js';
import { wearRows } from './wear.js';
import { serviceState } from './bikeservice.js';
import { logPart } from './care.js';
import { localDay } from './localday.js';
import { t } from './i18n.svelte.js';

const plain = (x) => JSON.parse(JSON.stringify(x ?? null));
export const getSetting = async (key, fallback, db = appDb) => (await db.settings.get(key))?.value ?? fallback;

/** Change one settings record with fn(value) → value; returns the old value (Undo). */
export async function changeSetting(key, fallback, fn, db = appDb) {
  return db.transaction('rw', db.settings, async () => {
    const old = (await db.settings.get(key))?.value ?? fallback;
    await db.settings.put({ key, value: plain(fn(plain(old))) });
    return old;
  });
}
export const putSetting = (key, value, db = appDb) => db.settings.put({ key, value: plain(value) });

/** 1128: the chain dried and oiled today → a service entry on the chain (Undo: the parts before). */
export async function wetChainDone(bikeId, day = localDay(), db = appDb) {
  return db.transaction('rw', db.bikes, async () => {
    const bike = await db.bikes.get(bikeId);
    if (!bike) return null;
    const before = plain(bike.parts ?? []);
    await db.bikes.update(bikeId, { parts: logPart(bike.parts ?? [], 'chain', wetChainEntry(day, bike.km ?? null, t('Dried and oiled after a wet ride'))) });
    return { bikeId, parts: before };
  });
}

/** 1134: brings the spring to-do in Kalender › Merken in line (on its day, with what is due per bike now). */
export async function syncSpringTodo(db = appDb, today = localDay()) {
  const [prefsRaw, bikes, visits] = await Promise.all([getSetting(PREFS_KEY, {}, db), db.bikes.toArray(), db.visits.toArray()]);
  const prefs = prefsOf(prefsRaw);
  const day = springDay(prefs.springMonth, today);
  const lines = bikes
    .filter((b) => b.status !== 'sold' && !b.archived)
    .map((b) => {
      const view = withVisits(b, visits);
      const due = wearRows(view, { today })
        .filter((r) => r.state === 'due' || r.state === 'soon')
        .map((r) => r.name);
      const sv = serviceState(b, null, today);
      if (sv.on && (sv.due || sv.never)) due.unshift(t('Bike service'));
      return { bike: b.name, due };
    });
  const text = springText(lines, t);
  await db.transaction('rw', db.settings, async () => {
    const r = syncSpring(await loadTodos(db), { day, text });
    if (r.changed) await db.settings.put({ key: MERKEN_KEY, value: plain(r.todos) });
  });
}
