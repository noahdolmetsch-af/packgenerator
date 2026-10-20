/**
 * «Tagebuch»: reading and writing the diary (rows of the table «frei», kind 'diary', see journal.js) and
 * its settings record, the things of a day that can be added to an entry («From the app», Noah «1b und
 * kann aber mit inhalten aus app ergänzt werden»), and the weather of the moment for a new entry.
 * Every write returns what Undo needs.
 */
import { liveQuery } from 'dexie';
import { db as appDb } from '../db.js';
import { HOME_PLACE } from '../know.js';
import { localDay } from '../localday.js';
import { JOURNAL_KEY, KIND, newEntry, retag } from './journal.js';

const plain = (x) => JSON.parse(JSON.stringify(x ?? null));

/** All diary entries, live. */
export const entriesQuery = (db = appDb) => liveQuery(() => db.frei.where('kind').equals(KIND).toArray());
/** The settings record, live ({} when none). */
export const cfgQuery = (db = appDb) => liveQuery(async () => (await db.settings.get(JOURNAL_KEY))?.value ?? {});

export async function loadCfg(db = appDb) {
  return (await db.settings.get(JOURNAL_KEY))?.value ?? {};
}
/** Change the settings with fn(cfg) → cfg; returns the old record (Undo). */
export async function changeCfg(fn, db = appDb) {
  return db.transaction('rw', db.settings, async () => {
    const before = await loadCfg(db);
    await db.settings.put({ key: JOURNAL_KEY, value: plain(fn(plain(before)) ?? before) });
    return before;
  });
}

/** Save an entry (new or changed); returns the saved row. */
export async function saveEntry(e, db = appDb) {
  const rec = plain(newEntry(e, { today: localDay() }));
  await db.frei.put(rec);
  return rec;
}
/** Delete an entry; returns it for Undo. */
export async function deleteEntry(id, db = appDb) {
  const rec = await db.frei.get(id);
  await db.frei.delete(id);
  return rec;
}
export const restoreEntry = (rec, db = appDb) => (rec ? db.frei.put(rec) : null);

/** Rename, merge or remove a tag in every entry; returns the old rows (Undo). */
export async function changeTag(from, to, db = appDb) {
  return db.transaction('rw', db.frei, async () => {
    const all = await db.frei.where('kind').equals(KIND).toArray();
    const next = retag(all, from, to);
    const old = all.filter((e) => next.some((n) => n.id === e.id));
    await db.frei.bulkPut(plain(next));
    return old;
  });
}
export const restoreRows = (rows, db = appDb) => db.frei.bulkPut(rows ?? []);

/* ---------- «From the app»: what happened on a day ---------- */
const hm = (s) => {
  const m = Math.round((s ?? 0) / 60);
  return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min` : `${m} min`;
};
const r1 = (n) => Math.round(n * 10) / 10;

/**
 * The things of `day` in the app → [{ key, group, text }]: rides and workouts (Strava), the Fitbit day,
 * tours on that day, notes written that day, ticks in Aktiv, calendar appointments, the weather at home.
 * t: the translator (the texts are inserted in the language of the app). Quiet: a missing table or a
 * failing read just leaves its part out.
 */
export async function dayThings(day, t = (s) => s, db = appDb) {
  const out = [];
  const safe = async (fn) => {
    try {
      await fn();
    } catch {
      /* this part stays out */
    }
  };
  await safe(async () => {
    for (const a of await db.activities.where('day').equals(day).toArray()) {
      const bits = [a.name || t('Activity')];
      if (a.km > 0) bits.push(`${r1(a.km)} km`);
      if (a.movingS > 0) bits.push(hm(a.movingS));
      if (a.hm > 0) bits.push(`${Math.round(a.hm)} hm`);
      if (a.hrAvg > 0) bits.push(`${t('heart rate')} ${Math.round(a.hrAvg)}`);
      out.push({ key: `act:${a.id}`, group: 'Activities', text: bits.join(' · ') });
    }
  });
  await safe(async () => {
    const h = await db.healthDays.get(day);
    if (!h) return;
    const bits = [];
    if (Number.isFinite(h.sleep?.asleepMin)) bits.push(`${t('Sleep')} ${hm(h.sleep.asleepMin * 60)}`);
    if (Number.isFinite(h.restingHr)) bits.push(`${t('resting pulse')} ${h.restingHr}`);
    if (Number.isFinite(h.steps)) bits.push(`${h.steps} ${t('steps')}`);
    if (bits.length) out.push({ key: `health:${day}`, group: 'Body', text: bits.join(' · ') });
  });
  await safe(async () => {
    for (const tr of await db.trips.toArray()) {
      if (!tr.startDate || !tr.title) continue;
      const n = Math.max(1, Number(tr.days) || 1);
      const end = new Date(`${tr.startDate}T12:00:00Z`);
      end.setUTCDate(end.getUTCDate() + n - 1);
      if (day >= tr.startDate && day <= end.toISOString().slice(0, 10)) out.push({ key: `trip:${tr.id}`, group: 'Tours', text: `${t('On tour')}: ${tr.title}` });
    }
  });
  await safe(async () => {
    const from = new Date(`${day}T00:00:00`);
    const to = new Date(from);
    to.setDate(to.getDate() + 1);
    const notes = await db.notes.where('at').between(from.toISOString(), to.toISOString()).toArray();
    for (const n of notes) if (n.text?.trim()) out.push({ key: `note:${n.id}`, group: 'Notes', text: n.text.trim().slice(0, 280) });
  });
  await safe(async () => {
    const log = await db.flowLog.where('day').equals(day).toArray();
    if (!log.length) return;
    const acts = Object.fromEntries((await db.flowActs.toArray()).map((a) => [a.id, a]));
    const count = new Map();
    for (const e of log) {
      const a = acts[e.actId];
      if (!a) continue;
      const name = t(a.name);
      count.set(name, (count.get(name) ?? 0) + (e.minutes > 0 ? 0 : 1));
    }
    if (count.size) out.push({ key: `flow:${day}`, group: 'Active', text: `${t('Ticked off')}: ${[...count.keys()].join(', ')}` });
  });
  await safe(async () => {
    for (const ev of await db.gEvents.where('day').equals(day).toArray()) {
      if (!ev.title) continue;
      out.push({ key: `cal:${ev.id}`, group: 'Calendar', text: `${ev.allDay ? '' : `${String(ev.start ?? '').slice(11, 16)} `}${ev.title}`.trim() });
    }
  });
  await safe(async () => {
    const w = (await db.meta.get('dayWeather'))?.days?.[day];
    if (w && Number.isFinite(w.tmax)) out.push({ key: `wx:${day}`, group: 'Weather', text: `${t('Up to')} ${Math.round(w.tmax)} °C${w.rainMm > 0 ? ` · ${r1(w.rainMm)} mm ${t('rain')}` : ''}${w.sunH > 0 ? ` · ${r1(w.sunH)} h ${t('sun')}` : ''}` });
  });
  return out;
}

/* ---------- the weather now, for a new entry ---------- */
/** The place for the weather: the given position, else the home place. null when neither is known. */
export async function weatherPlace(pos, db = appDb) {
  if (Number.isFinite(pos?.lat)) return pos;
  const home = (await db.settings.get(HOME_PLACE))?.value;
  return Number.isFinite(home?.lat) ? home : null;
}
export const nowUrl = (p) => `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&current=temperature_2m,weather_code&timezone=auto`;
/** Temperature and weather code now (Open-Meteo, free, no key) → { temp, code } or null (offline, no place). */
export async function weatherNow(place, fetcher = fetch) {
  if (!place) return null;
  try {
    const res = await fetcher(nowUrl(place));
    if (!res.ok) return null;
    const c = (await res.json())?.current;
    return Number.isFinite(c?.temperature_2m) ? { temp: Math.round(c.temperature_2m), code: Number.isFinite(c.weather_code) ? c.weather_code : null } : null;
  } catch {
    return null;
  }
}

/**
 * What the mood is compared with in «Rückblick» (Noah «2a»): the days with a ride or workout (activities)
 * and the minutes asleep of each day (Fitbit, healthDays). Quiet when a table is empty or missing.
 */
export async function moodContext(db = appDb) {
  const rideDays = new Set();
  const sleep = {};
  try {
    for (const a of await db.activities.toArray()) if (a.day) rideDays.add(a.day);
  } catch {
    /* no rides */
  }
  try {
    for (const h of await db.healthDays.toArray()) if (h.date && Number.isFinite(h.sleep?.asleepMin)) sleep[h.date] = h.sleep.asleepMin;
  } catch {
    /* no sleep */
  }
  return { rideDays, sleep };
}
