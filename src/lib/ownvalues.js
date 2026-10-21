/**
 * «Mehr selbst einstellen» (Noah 15.10.2026, ideas IS 254–256 and 258; content approved 18.10.2026
 * 19:36): the numbers that were fixed in the code and are now yours to change, on Ich › Einstellungen ›
 * Eigene Werte (#/me/werte). One settings record OWN_KEY (it travels in every backup); a missing field
 * is the standard (today's number), so old data and old backups stay valid. Every value can go back.
 *
 *   packDays      the step «Packen» from N days before a trip (Today, the trip, «In Arbeit»)  2     1–7
 *   coldC         «cold» from N °C: the temperature rule the app suggests for clothing       10    0–20
 *   hotC          «hot» from N °C: the morning heat warning on a tour day (push, package B)  30    20–40
 *   eveRemindAt   the evening-before reminder at this time, minutes after midnight (push,   1140  00:00–23:45
 *                 package B; Noah 18.10.2026 19:52 «3a»: the day clock's evening stays 18:00)  (19:00, 15-min steps)
 * hotC and eveRemindAt only exist as settings and getters until phone push is built (Noah «3a 4b»).
 *   checkKm       the km check every N km, for a bike without its own number (care.js)      1000  300–3000
 *   waxKm         wax the chain every N km (part chain)                                       150   50–1000
 *   sealantDays   top up the sealant every N days (part tyres, tubeless)                      90    30–365
 *   forkDays      fork service every N days (part fork)                                       365   90–730
 *   workshopDays  what the workshop still has to do, from N days before a trip               14    3–30
 *   backupDays    the backup reminder after N days                                            14    7–60
 * The care intervals are the standard of every bike; a bike's own number («Pflege für …») still wins.
 *
 * Pure functions only (tested in tests/ownvalues.test.js); the live value for the app is in
 * ownlive.svelte.js.
 */
export const OWN_KEY = 'ownValues';

/**
 * The fields in the order of the page: section, standard, sane range, step, unit, name and the one
 * sentence of what it is for (English keys for t()). part/prop: the care interval it sets (care.js).
 */
export const OWN_FIELDS = [
  { key: 'packDays', area: 'pack', std: 2, min: 1, max: 7, step: 1, unit: 'days', name: 'Packing step from', why: 'Today and the trip switch from «Plan» to «Pack» this many days before the start.' },
  { key: 'coldC', area: 'pack', std: 10, min: 0, max: 20, step: 1, unit: '°C', name: '«Cold» from', why: 'Clothing you did not need on a warm trip gets the rule «only below this temperature».' },
  { key: 'hotC', area: 'pack', std: 30, min: 20, max: 40, step: 1, unit: '°C', name: '«Hot» from', why: 'From this temperature the app warns you on the morning of the tour day.' },
  { key: 'eveRemindAt', area: 'pack', std: 1140, min: 0, max: 1425, step: 15, unit: 'time', name: 'Evening-before reminder at', why: 'At this time the reminder of the evening-before check comes to the phone, as soon as reminders to the phone are switched on.' },
  { key: 'checkKm', area: 'bike', std: 1000, min: 300, max: 3000, step: 100, unit: 'km', name: 'Bike check every', why: 'Brakes, chain, tyres, bolts: looked at again after this many km.' },
  { key: 'waxKm', area: 'bike', std: 150, min: 50, max: 1000, step: 10, unit: 'km', part: 'chain', prop: 'everyKm', name: 'Wax the chain every', why: 'The chain reminder comes after this many km.' },
  { key: 'sealantDays', area: 'bike', std: 90, min: 30, max: 365, step: 1, unit: 'days', part: 'tyres', prop: 'everyDays', name: 'Top up sealant every', why: 'Only for tubeless tyres: the sealant dries out over time.' },
  { key: 'forkDays', area: 'bike', std: 365, min: 90, max: 730, step: 1, unit: 'days', part: 'fork', prop: 'everyDays', name: 'Fork service every', why: 'Suspension forks only: the service reminder by time.' },
  { key: 'workshopDays', area: 'bike', std: 14, min: 3, max: 30, step: 1, unit: 'days', name: 'Workshop lead before a trip', why: 'From this many days before a trip, Bike care lists what the workshop still has to do.' },
  { key: 'backupDays', area: 'data', std: 14, min: 7, max: 60, step: 1, unit: 'days', name: 'Backup reminder every', why: 'Everything is only on this device. The app reminds you when the last backup is older.' },
];
/** eveRemindAt: minutes after midnight (1140 = 19:00, 1425 = 23:45). */
/** The care intervals set here, by part: { chain: { everyKm: 'waxKm' }, … }. */
export const OWN_PARTS = OWN_FIELDS.filter((f) => f.part).reduce((m, f) => ((m[f.part] = { ...(m[f.part] ?? {}), [f.prop]: f.key }), m), {});
/** The standard of a part from the own values: { everyKm: 120 } for the chain; {} for a part not set here. */
export const partStdOf = (vals, key) => Object.fromEntries(Object.entries(OWN_PARTS[key] ?? {}).map(([prop, k]) => [prop, vals[k]]));
export const OWN_FIELD = Object.fromEntries(OWN_FIELDS.map((f) => [f.key, f]));
/** The standard of every field: today's numbers. */
export const OWN_DEFAULTS = Object.freeze(Object.fromEntries(OWN_FIELDS.map((f) => [f.key, f.std])));

/** A typed value made safe: a whole number (or a step of 100 km) inside its range; null when it is not a number. */
export function clampOwn(key, value) {
  const f = OWN_FIELD[key];
  if (!f) return null;
  const hm = f.unit === 'time' && typeof value === 'string' ? /^\s*(\d{1,2})[:.h](\d{2})\s*$/.exec(value) : null;
  if (hm && (Number(hm[1]) > 23 || Number(hm[2]) > 59)) return null;
  const n = hm ? Number(hm[1]) * 60 + Number(hm[2]) : typeof value === 'number' ? value : Number(String(value ?? '').trim().replace(',', '.').replace(/[−–]/, '-'));
  if (value === '' || value == null || !Number.isFinite(n)) return null;
  const r = Math.round(n / f.step) * f.step;
  return Math.min(f.max, Math.max(f.min, r));
}

/** The stored record made whole: every field a safe number, missing or broken ones the standard. */
export function normOwn(raw) {
  const o = raw && typeof raw === 'object' ? raw : {};
  const gone = new Set(Array.isArray(o.gone) ? o.gone : []);
  const out = {};
  for (const f of OWN_FIELDS) out[f.key] = gone.has(f.key) ? f.std : (clampOwn(f.key, o[f.key]) ?? f.std);
  return out;
}

/** The record to store after a change: only the fields that differ from the standard (empty: {}). */
export function setOwn(raw, key, value) {
  const cur = normOwn(raw);
  const v = value == null ? OWN_FIELD[key]?.std : (clampOwn(key, value) ?? cur[key]);
  if (OWN_FIELD[key]) cur[key] = v;
  return withMeta(Object.fromEntries(Object.entries(cur).filter(([k, x]) => x !== OWN_FIELD[k].std)), metaOf(raw));
}

/** Minutes after midnight as «19:00». */
export const timeText = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
/** The time of the evening-before reminder, «19:00» (for the phone push of package B). */
export const eveRemindAt = (raw) => timeText(normOwn(raw).eveRemindAt);
/** The heat limit of the morning warning on a tour day, °C (for the phone push of package B). */
export const hotLimit = (raw) => normOwn(raw).hotC;

/** Is a field changed from its standard? */
export const isOwnChanged = (raw, key) => normOwn(raw)[key] !== OWN_FIELD[key]?.std;

/* ------------------------------------------------------------------------------------------------
 * «Eigene Werte anpassbar» (Noah 21.10.2026 «1 a und b 2 a 3a 4a»): every value of the page can be
 * renamed, deleted (a built-in one is hidden and the app counts with its Standard again; «Deleted
 * values» brings it back) and moved (arrows and drag, per section). New values are own reminders
 * «every N km» or «every N days», for all bikes or one; they show in Bike care with «Done».
 * The same record OWN_KEY carries it, so old records and old backups stay valid:
 *   names  { packDays: 'Packen ab' }          a typed name (never through t())
 *   gone   ['hotC']                          deleted built-in values
 *   order  { pack: ['coldC', 'packDays'], mine: ['o1'] }   the order of a section
 *   mine   [{ id, name, every, unit: 'km' | 'days', bike: null | id, from: { day, km: { bikeId: km } }, done: { bikeId: { day, km } } }]
 * A reminder for all bikes keeps its «done» per bike. from: the start (the day it was made, the km of
 * each bike then); a bike without a start counts from its first «Done».
 * ------------------------------------------------------------------------------------------------ */
export const MINE = 'mine';
export const MINE_UNITS = ['km', 'days'];
export const MINE_RANGE = { km: [10, 100000], days: [1, 3650] };
const META = ['names', 'gone', 'order', 'mine'];
const str = (v, max = 80) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const dayOk = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
const kmOk = (n) => typeof n === 'number' && Number.isFinite(n) && n >= 0;

/** A reminder made safe; null when it has no name or no number. */
export function cleanMine(x) {
  if (!x || typeof x !== 'object' || typeof x.id !== 'string') return null;
  const name = str(x.name);
  const unit = MINE_UNITS.includes(x.unit) ? x.unit : 'days';
  const [lo, hi] = MINE_RANGE[unit];
  const n = Math.round(Number(x.every));
  if (!name || !Number.isFinite(n)) return null;
  const km = {};
  for (const [b, v] of Object.entries(x.from?.km ?? {})) if (kmOk(v)) km[b] = v;
  const done = {};
  for (const [b, v] of Object.entries(x.done ?? {})) if (v && (dayOk(v.day) || kmOk(v.km))) done[b] = { day: dayOk(v.day) ? v.day : null, km: kmOk(v.km) ? v.km : null };
  return { id: x.id, name, every: Math.min(hi, Math.max(lo, n)), unit, bike: typeof x.bike === 'string' && x.bike ? x.bike : null, from: { day: dayOk(x.from?.day) ? x.from.day : null, km }, done };
}

/** The extra parts of the record, always whole. */
export function metaOf(raw) {
  const o = raw && typeof raw === 'object' ? raw : {};
  const names = {};
  for (const [k, v] of Object.entries(o.names ?? {})) if (OWN_FIELD[k] && str(v)) names[k] = str(v);
  const gone = [...new Set((Array.isArray(o.gone) ? o.gone : []).filter((k) => OWN_FIELD[k]))];
  const order = {};
  for (const [a, ids] of Object.entries(o.order ?? {})) if (Array.isArray(ids)) order[a] = ids.filter((x) => typeof x === 'string');
  const mine = (Array.isArray(o.mine) ? o.mine : []).map(cleanMine).filter(Boolean);
  return { names, gone, order, mine };
}

/** Numbers plus the extra parts, without empty ones (nothing changed: {}). */
function withMeta(nums, meta) {
  const out = { ...nums };
  if (Object.keys(meta.names).length) out.names = meta.names;
  if (meta.gone.length) out.gone = meta.gone;
  if (Object.keys(meta.order).length) out.order = meta.order;
  if (meta.mine.length) out.mine = meta.mine;
  return out;
}
const numsOf = (raw) => Object.fromEntries(Object.entries(normOwn(raw)).filter(([k, x]) => x !== OWN_FIELD[k].std));
const change = (raw, fn) => {
  const meta = metaOf(raw);
  fn(meta);
  return withMeta(numsOf({ ...(raw ?? {}), gone: meta.gone }), meta);
};

/** The name shown for a built-in value: the typed one, or the English source through tr. */
export const ownName = (raw, f, tr = (x) => x) => metaOf(raw).names[f.key] || tr(f.name);
/** Rename a built-in value; an empty name brings the Standard name back. */
export const renameOwn = (raw, key, name) =>
  change(raw, (m) => {
    if (!OWN_FIELD[key]) return;
    if (str(name)) m.names[key] = str(name);
    else delete m.names[key];
  });
/** Delete a built-in value: hidden, and the app counts with its Standard. */
export const removeOwn = (raw, key) => change(raw, (m) => OWN_FIELD[key] && !m.gone.includes(key) && m.gone.push(key));
/** Bring a deleted built-in value back (with its Standard number). */
export const restoreOwn = (raw, key) => change(raw, (m) => (m.gone = m.gone.filter((k) => k !== key)));
/** The deleted built-in values. */
export const goneFields = (raw) => metaOf(raw).gone.map((k) => OWN_FIELD[k]);

/** The ids of a section in their order: the stored order first, then the rest as in the code. */
function orderIds(meta, area) {
  const all = area === MINE ? meta.mine.map((x) => x.id) : OWN_FIELDS.filter((f) => f.area === area && !meta.gone.includes(f.key)).map((f) => f.key);
  const want = (meta.order[area] ?? []).filter((id) => all.includes(id));
  return [...want, ...all.filter((id) => !want.includes(id))];
}
/** The built-in values of a section, in their order, without the deleted ones. */
export const fieldsIn = (raw, area) => orderIds(metaOf(raw), area).map((k) => OWN_FIELD[k]);
/** The own reminders, in their order. */
export const mineOf = (raw) => {
  const m = metaOf(raw);
  const by = Object.fromEntries(m.mine.map((x) => [x.id, x]));
  return orderIds(m, MINE).map((id) => by[id]);
};
/** Move an entry of a section to place `to` (drag) … */
export const moveOwnTo = (raw, area, id, to) =>
  change(raw, (m) => {
    const ids = orderIds(m, area).filter((x) => x !== id);
    ids.splice(Math.max(0, Math.min(ids.length, to)), 0, id);
    m.order[area] = ids;
  });
/** … or one place up (-1) or down (+1) (arrows). */
export const moveOwn = (raw, area, id, dir) => moveOwnTo(raw, area, id, orderIds(metaOf(raw), area).indexOf(id) + dir);

/** A new own reminder. bikes: [{ id, km }] (its start km); → { record, id }. */
export function addMine(raw, { name, every, unit, bike = null }, bikes = [], today = '') {
  const meta = metaOf(raw);
  let n = meta.mine.length + 1;
  while (meta.mine.some((x) => x.id === `o${n}`)) n++;
  const id = `o${n}`;
  const km = Object.fromEntries(bikes.filter((b) => kmOk(b.km)).map((b) => [b.id, b.km]));
  const x = cleanMine({ id, name, every, unit, bike, from: { day: today, km }, done: {} });
  if (!x) return { record: withMeta(numsOf(raw), meta), id: null };
  return { record: change(raw, (m) => m.mine.push(x)), id };
}
/** Change name, number, unit or bike of a reminder. */
export const updateMine = (raw, id, patch) => change(raw, (m) => (m.mine = m.mine.map((x) => (x.id === id ? (cleanMine({ ...x, ...patch, id }) ?? x) : x))));
/** Delete a reminder (Undo puts the old record back). */
export const deleteMine = (raw, id) =>
  change(raw, (m) => {
    m.mine = m.mine.filter((x) => x.id !== id);
    if (m.order[MINE]) m.order[MINE] = m.order[MINE].filter((x) => x !== id);
  });
/** «Done» for one bike: today and its km now. */
export const doneMine = (raw, id, bike, today) => change(raw, (m) => (m.mine = m.mine.map((x) => (x.id === id ? { ...x, done: { ...x.done, [bike.id]: { day: today, km: kmOk(bike.km) ? bike.km : null } } } : x))));

const daysBetween = (a, b) => Math.round((Date.UTC(...b.split('-').map((v, i) => Number(v) - (i === 1 ? 1 : 0))) - Date.UTC(...a.split('-').map((v, i) => Number(v) - (i === 1 ? 1 : 0)))) / 864e5);

/**
 * The own reminders of one bike with their state: { x, since, left, due, never }.
 * since: km or days since the last «Done» (or the start); null when unknown (never: no start, no «Done»).
 */
export function mineFor(raw, bike, today) {
  return mineOf(raw)
    .filter((x) => !x.bike || x.bike === bike?.id)
    .map((x) => {
      const last = x.done[bike.id];
      let since = null;
      if (x.unit === 'km') {
        const base = last?.km ?? x.from.km[bike.id] ?? null;
        since = kmOk(bike.km) && base != null ? Math.max(0, bike.km - base) : null;
      } else {
        const base = last?.day ?? x.from.day;
        since = base && dayOk(today) ? Math.max(0, daysBetween(base, today)) : null;
      }
      return { x, since, left: since == null ? null : x.every - since, due: since != null && since >= x.every, never: since == null };
    });
}
