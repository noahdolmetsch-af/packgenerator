/**
 * Bike care (4.10.2026, played through with the chain as example).
 *
 * Every bike has a list of parts. Each part keeps its whole history: what was measured,
 * checked, serviced or replaced, when, at which km and by whom. Everything else is worked out
 * from that history and the bike's km (which you type in yourself):
 * - the 1000 km check (brake pads, chain, tyres + sealant, bolts, shifting, fork lockout, bearings),
 * - waxing the chain every 150 km,
 * - the preparation tasks before every trip with a date (from the Excel sheet "Wartung"),
 * - the repairs from the Excel sheet, which you go through once.
 * Pure functions only, so they are easy to test.
 */

/**
 * The parts a bike can have. unit: what you measure. warnAt / limit: when to warn and when to replace.
 * lowIsWorn: brake pads and rotors get thinner, a chain gets longer.
 * everyKm: a service with its own interval (wax the chain every 150 km).
 * everyDays: a service by time (Noah, 4.10.2026: fork and shock once a year, sealant every 3 months).
 *   Due by time or km, whichever comes first (answer 13a). Brakes are bled only when the lever
 *   feels soft (answer 16b), so they have no interval.
 */
import { t as tr } from './i18n.svelte.js';
import { localDay } from './localday.js';

/**
 * v0.30.1 (Noah's phone test, D1): km as typed on a phone, in Swiss or German style:
 * "2'287", "2’287", "2 287", "2.287" and "2,287" are 2287; "2287,4" and "2287.6" are rounded;
 * "2287 km" is fine. Returns a whole number, null for an empty field, or NaN for anything else
 * (negative, above 500 000, letters).
 */
export function parseKm(text) {
  let s = String(text ?? '').trim().replace(/\s*km$/i, '').replace(/[\s'’ʼ`´]/g, '');
  if (s === '') return null;
  const dots = (s.match(/\./g) ?? []).length;
  const commas = (s.match(/,/g) ?? []).length;
  if (dots && commas) {
    // Both: the last one is the decimal mark, the other groups thousands.
    const dec = s.lastIndexOf('.') > s.lastIndexOf(',') ? '.' : ',';
    s = s.replaceAll(dec === '.' ? ',' : '.', '').replace(dec, '.');
  } else if (dots + commas > 1 || /^\d{1,3}[.,]\d{3}$/.test(s)) {
    // "2.287", "2,287" or "1.234.567": thousands.
    s = s.replace(/[.,]/g, '');
  } else s = s.replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(s)) return NaN;
  const n = Math.round(Number(s));
  return n <= 500000 ? n : NaN;
}

export const PARTS = [
  { key: 'chain', name: 'Chain', unit: '%', warnAt: 0.4, limit: 0.5, everyKm: 150, service: 'Waxed', hint: 'Chain checker: 0.4 % warning, 0.5 % replace' },
  { key: 'chainring', name: 'Chainring', unit: '' },
  { key: 'cassette', name: 'Cassette', unit: '' },
  { key: 'padsF', name: 'Brake pads front', unit: '%', warnAt: 60, limit: 50, lowIsWorn: true, hint: 'Pad left in %: below 50 % replace' },
  { key: 'padsR', name: 'Brake pads rear', unit: '%', warnAt: 60, limit: 50, lowIsWorn: true, hint: 'Pad left in %: below 50 % replace' },
  { key: 'rotorF', name: 'Brake rotor front', unit: 'mm', warnAt: 1.6, limit: 1.5, lowIsWorn: true, hint: 'Thickness in mm (check the minimum printed on the rotor)' },
  { key: 'rotorR', name: 'Brake rotor rear', unit: 'mm', warnAt: 1.6, limit: 1.5, lowIsWorn: true, hint: 'Thickness in mm (check the minimum printed on the rotor)' },
  { key: 'fork', name: 'Fork', unit: '', suspension: 'fork', everyDays: 365, due: 'Fork service', hint: 'Lockout, sag, service once a year' },
  { key: 'shock', name: 'Rear shock', unit: '', suspension: 'full', everyDays: 365, due: 'Shock service', hint: 'Lockout, sag, service once a year' },
  { key: 'linkage', name: 'Rear linkage', unit: '', suspension: 'full', hint: 'Pivot bolts: clean, grease, check for play' },
  { key: 'saddle', name: 'Saddle height', unit: 'mm', hint: 'Centre of the bottom bracket to the top of the saddle' },
  { key: 'shifting', name: 'Shifting', unit: '', hint: 'Cable, housing, indexing' },
  { key: 'tyres', name: 'Tyres + sealant', unit: '', extra: ['pressureF', 'pressureR', 'sealantMl'], everyDays: 90, due: 'Top up sealant', tubeless: true, hint: 'Tread, pressure, sealant every 3 months (tubeless only)' },
  { key: 'brakes', name: 'Brakes (bleed, hoses)', unit: '', hint: 'Bleed when the lever feels soft' },
  { key: 'wheels', name: 'Wheels', unit: '', hint: 'True, spoke tension, freehub' },
  { key: 'cockpit', name: 'Cockpit', unit: '', hint: 'Grips or bar tape, lever covers' },
  { key: 'bolts', name: 'Bolts (torque)', unit: '', hint: 'Saddle, thru axles, levers, cages, mounts' },
  { key: 'bearings', name: 'Bearings', unit: '', hint: 'Headset, hubs, bottom bracket: check for play' },
];
export const PART = Object.fromEntries(PARTS.map((p) => [p.key, p]));

/** What the 1000 km check covers (Noah, 4.10.2026). */
export const CHECK_KM = 1000;
export const CHECK_PARTS = ['padsF', 'padsR', 'chain', 'tyres', 'bolts', 'shifting', 'fork', 'shock', 'bearings'];

/** Does this bike have this kind of part? Suspension parts only where the bike has suspension. */
function fits(bike, p) {
  const type = `${bike.type ?? ''} ${bike.id ?? ''}`.toLowerCase();
  const full = /full|fully/.test(type);
  const fork = full || type.includes('hardtail');
  return !p.suspension || (p.suspension === 'fork' && fork) || (p.suspension === 'full' && full);
}

/** The parts of a new bike. */
export const defaultParts = (bike) => PARTS.filter((p) => fits(bike, p)).map((p) => ({ key: p.key, model: '', history: [] }));

/** The stored parts plus the parts added since (brakes, wheels, rear linkage, cockpit), in the list order. */
export function ensureParts(bike) {
  const stored = bike.parts ?? [];
  if (!stored.length) return defaultParts(bike);
  const have = new Set(stored.map((p) => p.key));
  const added = PARTS.filter((p) => !have.has(p.key) && fits(bike, p)).map((p) => ({ key: p.key, model: '', history: [] }));
  if (!added.length) return stored;
  const order = (k) => PARTS.findIndex((p) => p.key === k);
  return [...stored, ...added].sort((a, b) => order(a.key) - order(b.key));
}

/** The part's definition merged with what the bike stores (model, history). */
export const partInfo = (stored) => ({ ...PART[stored.key], ...stored });

const lastOf = (part, test) => [...(part.history ?? [])].reverse().find(test) ?? null;
/** The last time it was replaced (or first recorded). */
export const lastReplace = (part) => lastOf(part, (h) => h.action === 'replace');
/** The last time someone looked at it: checked, serviced or replaced, with a good result. */
export const lastLook = (part) => lastOf(part, (h) => h.result !== 'needed');
/** The last measured value. */
export const lastValue = (part) => lastOf(part, (h) => typeof h.value === 'number');

/** km since an entry, or null when the km are unknown. */
export const kmSince = (bike, entry) => (typeof bike.km === 'number' && typeof entry?.km === 'number' ? bike.km - entry.km : null);

/** 'ok', 'warn' or 'worn' from the last measured value; null when nothing was measured. */
export function wear(part) {
  const p = partInfo(part);
  const v = lastValue(part)?.value;
  if (v == null || p.limit == null) return null;
  const worse = (a, b) => (p.lowIsWorn ? a <= b : a >= b);
  if (worse(v, p.limit)) return 'worn';
  if (p.warnAt != null && worse(v, p.warnAt)) return 'warn';
  return 'ok';
}

/** Open "work needed": the last entry says something has to be done. */
export const needsWork = (part) => part.history?.at(-1)?.result === 'needed';

/** 1000 km check: per part, km since it was last looked at; due when 1000 or more (km must be known). */
export function checkState(bike) {
  const rows = (bike.parts ?? [])
    .filter((p) => CHECK_PARTS.includes(p.key))
    .map((p) => {
      const since = kmSince(bike, lastLook(p));
      return { key: p.key, name: p.key === 'fork' || p.key === 'shock' ? tr('{part} lockout', { part: tr(PART[p.key].name) }) : tr(PART[p.key].name), since, due: since != null && since >= CHECK_KM, unknown: since == null };
    });
  return { rows, due: rows.filter((r) => r.due).length, unknown: rows.filter((r) => r.unknown).length };
}

/** Services with their own interval (wax the chain every 150 km) that are due. */
export function serviceDue(bike) {
  return (bike.parts ?? [])
    .map(partInfo)
    .filter((p) => p.everyKm)
    .map((p) => ({ key: p.key, name: serviceName(p), since: kmSince(bike, lastOf(p, (h) => h.action === 'service' || h.action === 'replace')), every: p.everyKm }))
    .filter((s) => s.since != null && s.since >= s.every);
}

/** The name of a service by km, e.g. "Waxed chain" (in the current language). */
export const serviceName = (p) => tr(`${p.service} ${p.name.toLowerCase()}`);

/**
 * Add a history entry to a part. result: 'ok' (checked, fine), 'needed' (replace or work needed),
 * 'done' (replaced or done). action: 'check' | 'service' | 'replace'.
 * Returns the new parts list; nothing else changes.
 */
export function logPart(parts, key, entry) {
  const { limit, ...rest } = entry;
  if (!parts.some((p) => p.key === key)) parts = [...parts, { key, model: '', history: [] }];
  return parts.map((p) =>
    p.key === key ? { ...p, ...(rest.model ? { model: rest.model } : {}), ...(typeof limit === 'number' ? { limit } : {}), history: [...(p.history ?? []), rest] } : p,
  );
}

/** Extra values some parts record (tyres: pressure front and rear in bar, sealant in ml). */
export const EXTRA = { pressureF: { name: 'Pressure front', unit: 'bar' }, pressureR: { name: 'Pressure rear', unit: 'bar' }, sealantMl: { name: 'Sealant added', unit: 'ml' } };

/**
 * Everything done on one bike, newest first (Noah, 4.10.2026: "what was done when"):
 * all part entries plus the repairs finished in the app.
 */
export function bikeLog(bike, tasks = []) {
  const parts = (bike.parts ?? []).flatMap((p) => (p.history ?? []).map((h) => ({ ...h, what: PART[p.key] ? tr(PART[p.key].name) : p.key, unit: PART[p.key]?.unit ?? '' })));
  const repairs = tasks
    .filter((t) => taskBike(t) === bike.id && t.status === 'done' && t.statusDate)
    .map((t) => ({ date: t.statusDate, km: null, action: 'repair', result: 'done', by: t.by ?? null, what: t.task, note: '' }));
  // v0.38.0 (Noah 8a): "Bike washed" from Today, the bike's own list (no part has it).
  const washes = (bike.washes ?? []).map((w) => ({ date: w.date, km: w.km ?? null, action: 'wash', result: 'done', by: w.by ?? 'self', what: tr('Bike washed'), unit: '', note: '' }));
  return [...parts, ...repairs, ...washes].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || (b.km ?? 0) - (a.km ?? 0));
}

/** When a chain is replaced after more than 0.75 %, cassette and chainring should be checked too. */
export function replaceHint(part) {
  const v = lastValue(part)?.value;
  return part.key === 'chain' && v != null && v > 0.75 ? tr('The old chain was over 0.75 %: check the cassette and chainring too.') : '';
}

/* ---------- tasks from the Excel sheet "Wartung" ---------- */

const SUBJECT_BIKE = { Hardtail: 'scott-hardtail', 'Full suspension': 'fully', Fully: 'fully', Factor: 'factor-ls' };
/** Which bike a repair from the Excel belongs to (null: not a bike, e.g. shoes). */
export const taskBike = (task) => task.bikeId ?? SUBJECT_BIKE[task.subject] ?? null;
export const isPrep = (task) => task.area === 'Preparation' || task.area === 'Vorbereitung';

/** Repairs that still need something: open, work needed, or not looked at since the Excel (June). */
export const openRepairs = (tasks) => tasks.filter((t) => !isPrep(t) && ['check', 'open', 'needed'].includes(t.status));
/** The June walk-through: repairs never looked at in the app. */
export const toReview = (tasks) => tasks.filter((t) => !isPrep(t) && t.status === 'check');

/** Preparation tasks that also count as a check of these parts (for the 1000 km check). */
export function prepParts(task) {
  const t = task.task.toLowerCase();
  const keys = [];
  if (t.includes('chain wear')) keys.push('chain');
  if (t.includes('sealant') || t.includes('tubeless')) keys.push('tyres');
  if (t.includes('check shifting')) keys.push('shifting');
  if (t.includes('brake pads')) keys.push('padsF', 'padsR');
  if (t.includes('torque')) keys.push('bolts');
  if (t.includes('wheel play')) keys.push('bearings');
  return keys;
}
/** A preparation task that is a chain service (wax / lube). */
export const prepService = (task) => (/wax the chain|lube the chain/i.test(task.task) ? 'chain' : null);

const DAY = 86400000;
const iso = (d) => d.toISOString().slice(0, 10);

/**
 * v0.22.0 (Noah 4b, 2026-10-07): the Excel preparation is for events only (race, organised ride).
 * trip.event is set in Pack; older trips without the flag count as an event when they already
 * have a preparation result, so nothing ticked before gets hidden.
 */
export const isEvent = (trip) => trip?.event ?? Object.keys(trip?.prep ?? {}).length > 0;

/**
 * The preparation tasks of one trip: due date = start date minus the lead time in weeks.
 * Results are stored on the trip (trip.prep[taskId]), so every trip has its own list.
 */
export function prepFor(trip, tasks, today = localDay()) {
  if (!trip.startDate || !isEvent(trip)) return [];
  const start = new Date(`${trip.startDate}T00:00:00Z`).getTime();
  return tasks
    .filter((t) => isPrep(t) && !isRule(t))
    .map((t) => {
      const due = iso(new Date(start - Math.round((t.leadWeeks ?? 0) * 7) * DAY));
      const state = trip.prep?.[t.id] ?? null;
      const finished = state?.result === 'ok' || state?.result === 'done';
      return { task: t, due, state, finished, overdue: !finished && due < today, needed: state?.result === 'needed' };
    })
    .sort((a, b) => a.due.localeCompare(b.due) || a.task.id - b.task.id);
}

/**
 * v0.21.0 (Noah 2b: the Excel tasks stay on every trip): Bike care shows them as one row
 * "Preparation: n open (m overdue)". rows: from prepFor. Returns { open, overdue, needed, done, total }.
 */
export function prepSummary(rows = []) {
  const left = rows.filter((r) => !r.finished);
  return { open: left.length, overdue: left.filter((r) => r.overdue).length, needed: left.filter((r) => r.needed).length, done: rows.length - left.length, total: rows.length };
}

/**
 * Rules instead of tasks (design audit C3): "Do not change saddle height … any more" has nothing
 * to tick off. They show as a hint from their date on, without buttons.
 */
export const isRule = (task) => /^(do not|don't|never)\b|nothing new|no more questions/i.test(task.task);
export function prepRules(trip, tasks) {
  if (!trip.startDate || !isEvent(trip)) return [];
  const start = new Date(`${trip.startDate}T00:00:00Z`).getTime();
  return tasks
    .filter((t) => isPrep(t) && isRule(t))
    .map((t) => ({ task: t, from: iso(new Date(start - Math.round((t.leadWeeks ?? 0) * 7) * DAY)) }))
    .sort((a, b) => a.from.localeCompare(b.from));
}

/** Trips that get preparation tasks: a date, not over yet. */
export const upcomingTrips = (trips, today = localDay()) =>
  trips.filter((t) => !t.skipped && !t.finished && t.startDate && t.startDate >= today).sort((a, b) => a.startDate.localeCompare(b.startDate));

/**
 * A wishlist item for a part that has to be replaced, unless one is already there.
 * price: the last price paid (from a workshop receipt, answer 19a), or null.
 */
export function wishFor(part, bike, items, id, price = null) {
  const p = partInfo(part);
  const name = `${p.name} (${bike.name})`;
  if (items.some((i) => i.name === name && i.ownership !== 'gone' && i.ownership !== 'owned')) return null;
  return {
    id, name, brand: '', model: p.model || price?.model || '', category: 'bike', weightG: null, qty: 1, weightStatus: 'missing', carry: 'bike',
    defaultBag: 'tool', ownership: 'wishlist', role: null, sets: [], kits: [], domains: ['bikepacking'],
    priceChf: price?.chf ?? null,
    note: tr('From Bike care: {part} on the {bike} needs replacing.', { part: tr(p.name), bike: bike.name }) + (price ? ` ${tr('Last time CHF {chf} ({shop}, {date}).', { chf: price.chf.toFixed(2), shop: price.shop, date: price.date })}` : ''),
    updatedAt: new Date().toISOString(),
  };
}

