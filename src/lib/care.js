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

/**
 * v0.48.0 (Noah, «Teile pro Velo»): ONE part list for every bike. It is the standard spec template
 * (areas Frame, Drivetrain, Brakes, Wheels, Cockpit, Accessories) and the care list at the same time:
 * a part keeps its spec fields (model, weightG, material, attrs, notes) and its care history together
 * on bike.parts. spec: the part is a row of the spec template (the comparison table, the bikeSpecs
 * import). attrs: the typed attributes of this part ({ key, name, unit?, num? }), all optional.
 * Parts without spec are care only (chainring, pads, rear linkage) or check points (bolts, bearings).
 */
const A = (key, name, unit = '', num = !!unit) => ({ key, name, unit, num });
const AXLE = A('axle', 'Axle standard');
const BLEED = 'Bleed when the lever feels soft';
const ROTOR = { unit: 'mm', warnAt: 1.6, limit: 1.5, lowIsWorn: true, hint: 'Thickness in mm (check the minimum printed on the rotor)', attrs: [A('dia', 'Diameter', 'mm')] };
const WHEEL = { hint: 'True, spoke tension, freehub', attrs: [AXLE, A('mount', 'Brake mount'), A('inner', 'Inner rim width', 'mm'), A('size', 'Wheel size')] };
/*
 * v0.48.0 (Noah's refinement): front and rear are separate parts for brakes, rotors and wheels;
 * the tyres stay one part with front and rear values (as tube or tubeless per wheel, tyreSetup).
 * more: the part sits under «More» (frame, suspension details, clamp, battery, axles, saddle,
 * cockpit, charger, own parts); the others show by default.
 * legacy: the parts before v0.48.0 that are now split (brakes, wheels); they show only with a history.
 */
export const PARTS = [
  // Frame
  { key: 'frame', name: 'Frame', area: 'frame', spec: true, more: true, unit: '', attrs: [AXLE, A('clearance', 'Tyre clearance')] },
  { key: 'fork', name: 'Fork', area: 'frame', spec: true, more: true, unit: '', suspension: 'fork', everyDays: 365, due: 'Fork service', hint: 'Lockout, sag, service once a year', attrs: [A('travel', 'Travel', 'mm'), AXLE, A('stanchion', 'Stanchions', 'mm'), A('steerer', 'Steerer'), A('offset', 'Offset', 'mm')] },
  { key: 'shock', name: 'Rear shock', area: 'frame', spec: true, more: true, unit: '', suspension: 'full', everyDays: 365, due: 'Shock service', hint: 'Lockout, sag, service once a year', attrs: [A('travel', 'Travel', 'mm'), A('eye', 'Eye-to-eye length')] },
  { key: 'linkage', name: 'Rear linkage', area: 'frame', unit: '', suspension: 'full', hint: 'Pivot bolts: clean, grease, check for play' },
  { key: 'seatclamp', name: 'Seatpost clamp', area: 'frame', spec: true, more: true, unit: '' },
  // Drivetrain
  { key: 'cassette', name: 'Cassette', area: 'drive', spec: true, unit: '', attrs: [A('cogs', 'Cogs'), A('range', 'Gear range')] },
  { key: 'shifting', name: 'Rear derailleur', area: 'drive', spec: true, unit: '', hint: 'Cable, housing, indexing', attrs: [A('cage', 'Cage length')] },
  { key: 'shifter', name: 'Shifter', area: 'drive', spec: true, unit: '' },
  { key: 'crank', name: 'Crankset', area: 'drive', spec: true, unit: '', attrs: [A('rings', 'Chainrings'), A('ring', 'Chainring size'), A('length', 'Crank length', 'mm')] },
  { key: 'chainring', name: 'Chainring', area: 'drive', unit: '' },
  { key: 'bb', name: 'Bottom bracket', area: 'drive', spec: true, unit: '', attrs: [A('standard', 'Standard')] },
  { key: 'chain', name: 'Chain', area: 'drive', spec: true, unit: '%', warnAt: 0.4, limit: 0.5, everyKm: 150, service: 'Waxed', hint: 'Chain checker: 0.4 % warning, 0.5 % replace' },
  { key: 'battery', name: 'Battery', area: 'drive', spec: true, more: true, unit: '', hint: 'Electronic shifting or e-bike: charge before a trip' },
  // Brakes
  { key: 'brakeF', name: 'Disc brake front', area: 'brakes', spec: true, unit: '', hint: BLEED, attrs: [A('pistons', 'Pistons')] },
  { key: 'brakeR', name: 'Disc brake rear', area: 'brakes', spec: true, unit: '', hint: BLEED, attrs: [A('pistons', 'Pistons')] },
  { key: 'rotorF', name: 'Brake rotor front', area: 'brakes', spec: true, ...ROTOR },
  { key: 'rotorR', name: 'Brake rotor rear', area: 'brakes', spec: true, ...ROTOR },
  { key: 'padsF', name: 'Brake pads front', area: 'brakes', unit: '%', warnAt: 60, limit: 50, lowIsWorn: true, hint: 'Pad left in %: below 50 % replace' },
  { key: 'padsR', name: 'Brake pads rear', area: 'brakes', unit: '%', warnAt: 60, limit: 50, lowIsWorn: true, hint: 'Pad left in %: below 50 % replace' },
  { key: 'brakes', name: 'Brakes (bleed, hoses)', area: 'brakes', legacy: true, unit: '', hint: 'Bleed when the lever feels soft' },
  // Wheels
  { key: 'wheelF', name: 'Front wheel', area: 'wheels', spec: true, unit: '', ...WHEEL },
  { key: 'wheelR', name: 'Rear wheel', area: 'wheels', spec: true, unit: '', ...WHEEL },
  { key: 'tyres', name: 'Tyres + sealant', area: 'wheels', spec: true, unit: '', extra: ['pressureF', 'pressureR', 'sealantMl'], everyDays: 90, due: 'Top up sealant', tubeless: true, hint: 'Tread, pressure, sealant every 3 months (tubeless only)', attrs: [A('widthF', 'Width front'), A('widthR', 'Width rear'), A('modelR', 'Rear tyre, when different')] },
  { key: 'axles', name: 'Thru axles', area: 'wheels', spec: true, more: true, unit: '', attrs: [AXLE] },
  { key: 'wheels', name: 'Wheels', area: 'wheels', legacy: true, unit: '', hint: 'True, spoke tension, freehub' },
  // Cockpit
  { key: 'grips', name: 'Grips', area: 'cockpit', spec: true, unit: '' },
  { key: 'seatpost', name: 'Seatpost', area: 'cockpit', spec: true, unit: '', attrs: [A('travel', 'Drop', 'mm'), A('dia', 'Clamp diameter', 'mm'), A('length', 'Length', 'mm'), A('insertMin', 'Insertion min', 'mm'), A('insertMax', 'Insertion max', 'mm')] },
  { key: 'cockpit', name: 'Cockpit', area: 'cockpit', spec: true, more: true, unit: '', hint: 'Bar and stem; grips or bar tape, lever covers', attrs: [A('dims', 'Sizes')] },
  { key: 'saddle', name: 'Saddle', area: 'cockpit', spec: true, more: true, unit: 'mm', hint: 'Saddle height: centre of the bottom bracket to the top of the saddle' },
  // Accessories
  { key: 'charger', name: 'Charger', area: 'extras', spec: true, more: true, unit: '' },
  // Check points (the 1000 km check), no spec
  { key: 'bolts', name: 'Bolts (torque)', area: 'checks', more: true, unit: '', hint: 'Saddle, thru axles, levers, cages, mounts' },
  { key: 'bearings', name: 'Bearings', area: 'checks', more: true, unit: '', hint: 'Headset, hubs, bottom bracket: check for play' },
];
export const PART = Object.fromEntries(PARTS.map((p) => [p.key, p]));

/** v0.48.0: the areas of the part list, in this order (the spec template plus the check points). */
export const AREAS = [
  { key: 'frame', name: 'Frame' },
  { key: 'drive', name: 'Drivetrain' },
  { key: 'brakes', name: 'Brakes' },
  { key: 'wheels', name: 'Wheels' },
  { key: 'cockpit', name: 'Cockpit' },
  { key: 'extras', name: 'Accessories' },
  { key: 'checks', name: 'Check points' },
];
/** The area of a part (own parts carry their own area). */
export const areaOf = (part) => PART[part?.key]?.area ?? part?.area ?? 'extras';
/** The name of a part in the current language: the template name, or the name an own part was given. */
export const partName = (part) => (PART[part?.key] ? tr(PART[part.key].name) : part?.name || part?.key || '');
/** Is this part under «More» (own parts too)? */
export const isMore = (part) => (PART[part?.key] ? !!PART[part.key].more : true);
/** The typed attributes of a part (own parts have none). */
export const attrsOf = (key) => PART[key]?.attrs ?? [];

/** What the 1000 km check covers (Noah, 4.10.2026). */
export const CHECK_KM = 1000;
export const CHECK_PARTS = ['padsF', 'padsR', 'chain', 'tyres', 'bolts', 'shifting', 'fork', 'shock', 'bearings'];

/** Does this bike have suspension of this kind (full: shock and linkage, fork: suspension fork)? */
export function fits(bike, p) {
  const type = `${bike.type ?? ''} ${bike.id ?? ''}`.toLowerCase();
  const full = /full|fully/.test(type);
  const fork = full || type.includes('hardtail');
  return !p.suspension || (p.suspension === 'fork' && fork) || (p.suspension === 'full' && full);
}

/**
 * v0.48.0 (Noah: every bike gets the full template): every spec part on every bike, missing values
 * stay empty. Care-only parts (rear linkage) only where they fit; the old brakes and wheels only with a history.
 */
const onBike = (bike, p) => !p.legacy && (p.spec || fits(bike, p));
const blank = (key) => ({ key, model: '', history: [] });

/** The parts of a new bike. */
export const defaultParts = (bike) => PARTS.filter((p) => onBike(bike, p)).map((p) => blank(p.key));

/** The stored parts plus the template parts added since, in the template order (own parts at the end of their area). */
export function ensureParts(bike) {
  const stored = (bike.parts ?? []).filter((p) => !(PART[p.key]?.legacy && !p.history?.length && !p.model));
  if (!stored.length) return defaultParts(bike);
  const have = new Set(stored.map((p) => p.key));
  const added = PARTS.filter((p) => !have.has(p.key) && onBike(bike, p)).map((p) => blank(p.key));
  if (!added.length && stored.length === (bike.parts ?? []).length) return stored;
  const areaRank = (p) => AREAS.findIndex((a) => a.key === areaOf(p));
  const order = (p) => (PART[p.key] ? PARTS.indexOf(PART[p.key]) : PARTS.length);
  return [...stored, ...added].map((p, n) => [p, n]).sort(([a, i], [b, j]) => areaRank(a) - areaRank(b) || order(a) - order(b) || i - j).map(([p]) => p);
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
    .filter((p) => CHECK_PARTS.includes(p.key) && fits(bike, PART[p.key]))
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
  const parts = (bike.parts ?? []).flatMap((p) => (p.history ?? []).map((h) => ({ ...h, what: partName(p), unit: PART[p.key]?.unit ?? '' })));
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
 * v0.42.0 (Noah 8): the imported "Vorbereitungsliste" (tasks with list 'prep-list', importstep2.js)
 * shows for events AND for bikepacking trips of more than 4 nights. The older Excel tasks stay
 * for events only.
 */
export const PREP_LIST = 'prep-list';
export const nightsOf = (trip) => (trip?.overnight === 'none' ? 0 : Math.max(0, (Number(trip?.days) || 1) - 1));
export const isLongTour = (trip) => !!trip && !Array.isArray(trip.packs) && (!trip.domain || trip.domain === 'bikepacking') && nightsOf(trip) > 4;
export const prepShows = (task, trip) => (task.list === PREP_LIST ? isEvent(trip) || isLongTour(trip) : isEvent(trip));

/**
 * The preparation tasks of one trip: due date = start date minus the lead time in weeks.
 * Results are stored on the trip (trip.prep[taskId]), so every trip has its own list.
 */
export function prepFor(trip, tasks, today = localDay()) {
  if (!trip.startDate || !(isEvent(trip) || isLongTour(trip))) return [];
  const start = new Date(`${trip.startDate}T00:00:00Z`).getTime();
  return tasks
    .filter((t) => isPrep(t) && !isRule(t) && prepShows(t, trip))
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
  if (!trip.startDate || !(isEvent(trip) || isLongTour(trip))) return [];
  const start = new Date(`${trip.startDate}T00:00:00Z`).getTime();
  return tasks
    .filter((t) => isPrep(t) && isRule(t) && prepShows(t, trip))
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

