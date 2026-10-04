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
 */
export const PARTS = [
  { key: 'chain', name: 'Chain', unit: '%', warnAt: 0.4, limit: 0.5, everyKm: 150, service: 'Waxed', hint: 'Chain checker: 0.4 % warning, 0.5 % replace' },
  { key: 'chainring', name: 'Chainring', unit: '' },
  { key: 'cassette', name: 'Cassette', unit: '' },
  { key: 'padsF', name: 'Brake pads front', unit: '%', warnAt: 60, limit: 50, lowIsWorn: true, hint: 'Pad left in %: below 50 % replace' },
  { key: 'padsR', name: 'Brake pads rear', unit: '%', warnAt: 60, limit: 50, lowIsWorn: true, hint: 'Pad left in %: below 50 % replace' },
  { key: 'rotorF', name: 'Brake rotor front', unit: 'mm', warnAt: 1.6, limit: 1.5, lowIsWorn: true, hint: 'Thickness in mm (check the minimum printed on the rotor)' },
  { key: 'rotorR', name: 'Brake rotor rear', unit: 'mm', warnAt: 1.6, limit: 1.5, lowIsWorn: true, hint: 'Thickness in mm (check the minimum printed on the rotor)' },
  { key: 'fork', name: 'Fork', unit: '', suspension: 'fork', hint: 'Lockout, sag, service' },
  { key: 'shock', name: 'Rear shock', unit: '', suspension: 'full', hint: 'Lockout, sag, service' },
  { key: 'saddle', name: 'Saddle height', unit: 'mm', hint: 'Centre of the bottom bracket to the top of the saddle' },
  { key: 'shifting', name: 'Shifting', unit: '', hint: 'Cable, housing, indexing' },
  { key: 'tyres', name: 'Tyres + sealant', unit: '', hint: 'Tread, pressure, top up sealant' },
  { key: 'bolts', name: 'Bolts (torque)', unit: '', hint: 'Saddle, thru axles, levers, cages, mounts' },
  { key: 'bearings', name: 'Bearings', unit: '', hint: 'Headset, hubs, bottom bracket: check for play' },
];
export const PART = Object.fromEntries(PARTS.map((p) => [p.key, p]));

/** What the 1000 km check covers (Noah, 4.10.2026). */
export const CHECK_KM = 1000;
export const CHECK_PARTS = ['padsF', 'padsR', 'chain', 'tyres', 'bolts', 'shifting', 'fork', 'shock', 'bearings'];

/** The parts of a new bike: suspension parts only where the bike has suspension. */
export function defaultParts(bike) {
  const type = (bike.type ?? '').toLowerCase();
  const fork = type.includes('hardtail') || type.includes('full');
  const full = type.includes('full');
  return PARTS.filter((p) => !p.suspension || (p.suspension === 'fork' && fork) || (p.suspension === 'full' && full)).map((p) => ({ key: p.key, model: '', history: [] }));
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
      return { key: p.key, name: p.key === 'fork' || p.key === 'shock' ? `${PART[p.key].name} lockout` : PART[p.key].name, since, due: since != null && since >= CHECK_KM, unknown: since == null };
    });
  return { rows, due: rows.filter((r) => r.due).length, unknown: rows.filter((r) => r.unknown).length };
}

/** Services with their own interval (wax the chain every 150 km) that are due. */
export function serviceDue(bike) {
  return (bike.parts ?? [])
    .map(partInfo)
    .filter((p) => p.everyKm)
    .map((p) => ({ key: p.key, name: `${p.service} ${p.name.toLowerCase()}`, since: kmSince(bike, lastOf(p, (h) => h.action === 'service' || h.action === 'replace')), every: p.everyKm }))
    .filter((s) => s.since != null && s.since >= s.every);
}

/**
 * Add a history entry to a part. result: 'ok' (checked, fine), 'needed' (replace or work needed),
 * 'done' (replaced or done). action: 'check' | 'service' | 'replace'.
 * Returns the new parts list; nothing else changes.
 */
export function logPart(parts, key, entry) {
  return parts.map((p) => (p.key === key ? { ...p, ...(entry.model ? { model: entry.model } : {}), history: [...(p.history ?? []), entry] } : p));
}

/** When a chain is replaced after more than 0.75 %, cassette and chainring should be checked too. */
export function replaceHint(part) {
  const v = lastValue(part)?.value;
  return part.key === 'chain' && v != null && v > 0.75 ? 'The old chain was over 0.75 %: check the cassette and chainring too.' : '';
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
 * The preparation tasks of one trip: due date = start date minus the lead time in weeks.
 * Results are stored on the trip (trip.prep[taskId]), so every trip has its own list.
 */
export function prepFor(trip, tasks, today = iso(new Date())) {
  if (!trip.startDate) return [];
  const start = new Date(`${trip.startDate}T00:00:00Z`).getTime();
  return tasks
    .filter(isPrep)
    .map((t) => {
      const due = iso(new Date(start - Math.round((t.leadWeeks ?? 0) * 7) * DAY));
      const state = trip.prep?.[t.id] ?? null;
      const finished = state?.result === 'ok' || state?.result === 'done';
      return { task: t, due, state, finished, overdue: !finished && due < today, needed: state?.result === 'needed' };
    })
    .sort((a, b) => a.due.localeCompare(b.due) || a.task.id - b.task.id);
}

/** Trips that get preparation tasks: a date, not over yet. */
export const upcomingTrips = (trips, today = iso(new Date())) =>
  trips.filter((t) => t.startDate && t.startDate >= today).sort((a, b) => a.startDate.localeCompare(b.startDate));

/** A wishlist item for a part that has to be replaced, unless one is already there. */
export function wishFor(part, bike, items, id) {
  const p = partInfo(part);
  const name = `${p.name} (${bike.name})`;
  if (items.some((i) => i.name === name && i.ownership !== 'gone' && i.ownership !== 'owned')) return null;
  return {
    id, name, brand: '', model: p.model ?? '', category: 'bike', weightG: null, qty: 1, weightStatus: 'missing', carry: 'bike',
    defaultBag: 'tool', ownership: 'wishlist', role: null, sets: [], kits: [], domains: ['bikepacking'],
    note: `From Bike care: ${p.name} on the ${bike.name} needs replacing.`, updatedAt: new Date().toISOString(),
  };
}
