/**
 * Paket VG «Das Velo im Griff» (Noah 20.10.2026 «1a 2a 3a», «4-6 alle», «7-8 beide»). The pure part:
 *   - 1128 Nasse Fahrt: after a ride in the rain, the evening window «Kette trocknen und ölen» (home/windows.js)
 *     and a phone reminder (push kind 'wetchain'). Rain from the ride's start cell (inspect/rain.js wetOf).
 *   - 1129 Verschleiss-Fotos: chain, chainring and tyre with date and km (db.photos, field `wear`),
 *     old next to new; a new photo every X km (switchable).
 *   - 1130 Verkaufsinserat: a text from km, services, parts and photos; the price is the person's own field.
 *   - 1131 Velo verpacken: a checklist for the bike box or bag (own points: add, rename, move, delete),
 *     photos before packing (db.photos, field `pack`).
 *   - 1132 Ersatzteil-Vorrat: what is at home; every own change of that part takes one away (derived,
 *     nothing counted by hand); empty → the shopping list.
 *   - 1133 Was hält am längsten: km per brand for chains, tyres and brake pads (from the own parts before).
 *   - 1134 Frühlings-Service: in February (month changeable, or off) a to-do in Kalender › Merken with
 *     what is due per bike.
 *   - 1135 Ketten-Rotation: several chains per bike, km per chain, «Kette B ist dran» (switchable).
 * No database and no clock here (tests/griff.test.js).
 */
import { pastParts } from './wear.js';

export const PREFS_KEY = 'griff.prefs';
export const PACK_KEY = 'griff.pack';
export const STOCK_KEY = 'griff.stock';
export const SELL_KEY = 'griff.sell';

/** The suggestions: evening reminder on, a new wear photo every 1000 km, the spring service in February. */
export const PREFS_STD = { wetChain: true, shotEveryKm: 1000, springMonth: 2 };

const DAY = 864e5;
const clean = (s, max = 80) => String(s ?? '').trim().slice(0, max);
const okNum = (v) => typeof v === 'number' && Number.isFinite(v);
const addDays = (day, n) => new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);

/** The settings with the suggestions for what is missing (null = off). */
export function prefsOf(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const pick = (k) => (Object.hasOwn(r, k) ? r[k] : PREFS_STD[k]);
  const every = pick('shotEveryKm');
  const month = pick('springMonth');
  return { wetChain: pick('wetChain') !== false, shotEveryKm: okNum(every) && every > 0 ? Math.round(every) : null, springMonth: Number.isInteger(month) && month >= 1 && month <= 12 ? month : null };
}

/* ---------- 1128 Nasse Fahrt ---------- */

/**
 * The wet rides of a day per bike: counted rides of that day whose start was wet (isWet from rain.js wetOf).
 * → [{ bikeId, km }] (km summed per bike), the most km first.
 */
export function wetRides(entries = [], day, isWet) {
  const by = {};
  for (const e of entries) if (e?.kind === 'ride' && e.state === 'counted' && e.date === day && e.bikeId && isWet?.(e)) by[e.bikeId] = (by[e.bikeId] ?? 0) + (Number(e.km) || 0);
  return Object.entries(by).map(([bikeId, km]) => ({ bikeId, km: Math.round(km) })).sort((a, b) => b.km - a.km);
}

/** The history entry when the chain was dried and oiled (a service of the chain, by yourself). */
export const wetChainEntry = (day, km, note) => ({ date: day, km: okNum(km) ? km : null, value: null, action: 'service', result: 'done', by: 'self', model: null, note });

/* ---------- 1129 Verschleiss-Fotos ---------- */

export const SHOT_PARTS = ['chain', 'chainring', 'tyres'];

/** The wear photos of one part of a bike, oldest first. */
export const shotsOf = (photos = [], bikeId, key) => photos.filter((p) => p.bikeId === bikeId && p.wear === key).sort((a, b) => String(a.date ?? '').localeCompare(String(b.date ?? '')) || String(a.id).localeCompare(String(b.id)));

/** Is a new photo of this part due? km since the newest photo ≥ every (no photo yet: due once the part has km). */
export function shotDue(bike, photos, key, every) {
  if (!every || typeof bike?.km !== 'number') return null;
  const last = shotsOf(photos, bike.id, key).at(-1);
  if (!last) return { since: null, due: true };
  if (!okNum(last.km)) return null;
  const since = Math.max(0, bike.km - last.km);
  return { since, due: since >= every };
}

/** Not a setup photo: wear and packing photos stay on their own pages (photo.js bikePhotos leaves them out). */
export const ownShot = (p) => !!(p?.wear || p?.pack);

/* ---------- 1130 Verkaufsinserat ---------- */

/**
 * The text of a sale listing. view: the bike with its workshop jobs (withVisits) and km; rows: wearRows of it;
 * visits: its workshop visits; price: the own field (CHF, or ''); extra: own words. T: t() (the language of the text).
 */
export function saleText(view, { rows = [], visits = [], price = '', extra = '', kindName = '', photos = 0, T = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => v?.[k] ?? m), num = String, dateOf = String } = {}) {
  if (!view) return '';
  const lines = [];
  lines.push(view.name + (kindName ? ` · ${kindName}` : ''));
  if (view.bought) lines.push(T('Bought: {date}', { date: dateOf(view.bought) }));
  if (typeof view.km === 'number') lines.push(T('Ridden: {km} km', { km: num(view.km) }));
  const last = view.service?.last?.day ? view.service.last : null;
  if (last) lines.push(T('Last service: {date}', { date: dateOf(last.day) }));
  const mine = visits.filter((v) => v.bikeId === view.id);
  if (mine.length) lines.push(T('Serviced in a bike shop {n} times', { n: mine.length }));
  const parts = (view.parts ?? []).filter((p) => p.model);
  if (parts.length) {
    lines.push('', T('Parts:'));
    for (const p of parts) {
      const r = rows.find((x) => x.key === p.key);
      const fresh = r && r.km != null ? ` · ${T('{km} km on it', { km: num(r.km) })}` : '';
      lines.push(`- ${p.name || p.key}: ${p.model}${fresh}`);
    }
  }
  const newer = rows.filter((r) => r.km != null && r.km < 500 && r.start);
  if (newer.length) lines.push('', T('New recently: {list}', { list: newer.map((r) => r.name).join(', ') }));
  if (clean(extra, 1000)) lines.push('', clean(extra, 1000));
  if (photos) lines.push('', T('{n} photos', { n: photos }));
  if (clean(price, 20)) lines.push('', T('Price: CHF {price}', { price: clean(price, 20) }));
  return lines.join('\n');
}

/* ---------- 1131 Velo verpacken ---------- */

export const PACK_STD = [
  'Take photos of the bike from all sides',
  'Pedals off, keep them in a bag',
  'Handlebar turned or off, protect the frame',
  'Rear derailleur off or protected',
  'Thru axles: put in spacers front and rear',
  'Let some air out of the tyres (flight)',
  'Disc rotors protected, pad spacers in',
  'Tools, torque key and spare hanger in the box',
  'Box closed, name and phone number on it',
];

/** The checklist record: { items: [{ id, text, std }], ticks: { [bikeId]: { day, ids } } } with the standard points on first use. */
export function packOf(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const items = Array.isArray(r.items) ? r.items.filter((x) => x?.id && clean(x.text, 120)) : PACK_STD.map((text, i) => ({ id: `std-${i}`, text, std: true }));
  return { items, ticks: r.ticks && typeof r.ticks === 'object' ? r.ticks : {} };
}
export const addPackItem = (rec, text, id) => (clean(text, 120) ? { ...rec, items: [...rec.items, { id, text: clean(text, 120) }] } : rec);
export const renamePackItem = (rec, id, text) => (clean(text, 120) ? { ...rec, items: rec.items.map((x) => (x.id === id ? { id: x.id, text: clean(text, 120) } : x)) } : rec);
export const removePackItem = (rec, id) => ({ ...rec, items: rec.items.filter((x) => x.id !== id) });
export function movePackItem(rec, from, to) {
  if (from === to || from < 0 || to < 0 || from >= rec.items.length || to >= rec.items.length) return rec;
  const items = [...rec.items];
  const [x] = items.splice(from, 1);
  items.splice(to, 0, x);
  return { ...rec, items };
}
/** Tick a point for a bike (a new day starts empty). */
export function tickPack(rec, bikeId, id, day) {
  const cur = rec.ticks[bikeId]?.day === day ? rec.ticks[bikeId].ids : [];
  const ids = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  return { ...rec, ticks: { ...rec.ticks, [bikeId]: { day, ids } } };
}
export const ticksOf = (rec, bikeId, day) => (rec.ticks[bikeId]?.day === day ? rec.ticks[bikeId].ids : []);
export const clearPack = (rec, bikeId) => {
  const ticks = { ...rec.ticks };
  delete ticks[bikeId];
  return { ...rec, ticks };
};

/* ---------- 1132 Ersatzteil-Vorrat ---------- */

/** Parts a stock row can follow (one own change of that part takes one away). */
export const STOCK_PARTS = ['chain', 'tyres', 'padsF', 'padsR', 'cassette', 'rotorF', 'rotorR'];
export const STOCK_IDEAS = [
  { name: 'Inner tube', part: null },
  { name: 'Brake pads', part: 'padsF' },
  { name: 'Chain', part: 'chain' },
  { name: 'Tyre', part: 'tyres' },
];

/** The stock rows: [{ id, name, part, qty, since }] (since: the day the number was set). */
export const stockOf = (raw) => (Array.isArray(raw) ? raw.filter((x) => x?.id && clean(x.name, 60)) : []);

/** How many own changes of that part (not by the bike shop) happened on any bike since `since`. */
export function usedSince(bikes = [], part, since) {
  if (!part || !since) return 0;
  const keys = part === 'padsF' || part === 'padsR' ? ['padsF', 'padsR'] : [part];
  let n = 0;
  for (const b of bikes) for (const p of b.parts ?? []) if (keys.includes(p.key)) for (const h of p.history ?? []) if (h.action === 'replace' && h.result !== 'needed' && h.by !== 'shop' && !h.start && h.date && h.date >= since) n++;
  return n;
}
/** A row with what is left: { ...row, used, left, empty }. */
export function stockRow(row, bikes) {
  const used = usedSince(bikes, row.part, row.since);
  const left = Math.max(0, (Number(row.qty) || 0) - used);
  return { ...row, used, left, empty: left === 0 };
}
export const addStock = (list, { name, part = null, qty = 1 }, id, day) => (clean(name, 60) ? [...list, { id, name: clean(name, 60), part: STOCK_PARTS.includes(part) ? part : null, qty: Math.max(0, Math.round(Number(qty) || 0)), since: day }] : list);
/** A new count (or name, or part): the count starts again from today. */
export function changeStock(list, id, patch, day) {
  return list.map((x) => {
    if (x.id !== id) return x;
    const next = { ...x };
    if ('name' in patch && clean(patch.name, 60)) next.name = clean(patch.name, 60);
    if ('part' in patch) next.part = STOCK_PARTS.includes(patch.part) ? patch.part : null;
    if ('qty' in patch) {
      next.qty = Math.max(0, Math.round(Number(patch.qty) || 0));
      next.since = day;
    }
    return next;
  });
}
export const removeStock = (list, id) => list.filter((x) => x.id !== id);

/* ---------- 1133 Was hält am längsten ---------- */

export const BRAND_PARTS = { chain: ['chain'], tyres: ['tyres'], pads: ['padsF', 'padsR'] };
/** The brand of a model: its first word («Shimano Ultegra» → «Shimano»). */
export const brandOf = (model) => clean(model, 80).split(/\s+/)[0] || '';

/**
 * km per brand from the own used-up parts of all bikes (wear.js pastParts, the model of the part that went).
 * → { chain: [{ brand, km, n }], tyres: […], pads: […] }, the longest-lasting first.
 */
export function brandStats(bikes = []) {
  const out = {};
  for (const [group, keys] of Object.entries(BRAND_PARTS)) {
    const by = {};
    for (const b of bikes)
      for (const p of b.parts ?? [])
        if (keys.includes(p.key))
          for (const past of pastParts(p)) {
            const brand = brandOf(past.model);
            if (!brand) continue;
            const k = brand.toLowerCase();
            by[k] = by[k] ?? { brand, sum: 0, n: 0 };
            by[k].sum += past.km;
            by[k].n++;
          }
    out[group] = Object.values(by).map((x) => ({ brand: x.brand, km: Math.round(x.sum / x.n), n: x.n })).sort((a, b) => b.km - a.km || a.brand.localeCompare(b.brand));
  }
  return out;
}
/** The best brand for a part key, or null. */
export function bestFor(stats, key) {
  const group = Object.entries(BRAND_PARTS).find(([, keys]) => keys.includes(key))?.[0];
  return group ? (stats[group]?.[0] ?? null) : null;
}

/* ---------- 1134 Frühlings-Service ---------- */

export const SPRING_SRC = 'griff-spring';

/** The day of the to-do: the 1st of the chosen month, this year while that month has not passed, else next year. */
export function springDay(month, today) {
  if (!month) return null;
  const y = Number(today.slice(0, 4));
  const mm = String(month).padStart(2, '0');
  const end = addDays(`${month === 12 ? y + 1 : y}-${month === 12 ? '01' : String(month + 1).padStart(2, '0')}-01`, -1);
  return today <= end ? `${y}-${mm}-01` : `${y + 1}-${mm}-01`;
}

/** The words of the to-do: per bike what is due (names), joined. lines: [{ bike, due: [names] }]. */
export function springText(lines = [], T = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => v?.[k] ?? m)) {
  const parts = lines.filter((l) => l.due.length).map((l) => `${l.bike}: ${l.due.join(', ')}`);
  return parts.length ? T('Book the spring service early. Due: {list}', { list: parts.join(' · ') }) : T('Book the spring service early.');
}

/**
 * The Merken to-dos after bringing the spring to-do in line: one to-do (src SPRING_SRC) on its day, 09:00;
 * month off → it goes. A ticked one stays ticked while its day is the same. → { todos, changed }
 */
export function syncSpring(todos = [], { day, text, now = new Date().toISOString() }) {
  const mine = todos.find((x) => x.src === SPRING_SRC) ?? null;
  const rest = todos.filter((x) => x.src !== SPRING_SRC);
  if (!day) return { todos: rest, changed: !!mine };
  if (mine && mine.due === day && mine.text === text) return { todos, changed: false };
  const next = mine ? { ...mine, text, due: day, doneAt: mine.due === day ? mine.doneAt : null } : { id: `gr-${SPRING_SRC}`, text, due: day, remind: { at: '09:00', before: 0 }, repeat: null, list: null, created: now, doneAt: null, area: 'bike', src: SPRING_SRC };
  return { todos: [...rest, next], changed: true };
}

/* ---------- 1135 Ketten-Rotation ---------- */

/** EVERY: km after which the next chain is due (a suggestion). */
export const ROTATE_STD = 500;

/**
 * The rotation of a bike: bike.chains = { on, every, list: [{ id, name }], swaps: [{ day, km, to }] }.
 * → { on, every, list: [{ id, name, km, current }], current, since, next, due }
 * km per chain: the km it was on the bike (between its swap and the next one, the last until now).
 */
export function rotationOf(bike) {
  const c = bike?.chains ?? {};
  const list = Array.isArray(c.list) ? c.list.filter((x) => x?.id && clean(x.name, 40)) : [];
  const swaps = (Array.isArray(c.swaps) ? c.swaps : []).filter((s) => s?.day && okNum(s.km) && list.some((x) => x.id === s.to)).sort((a, b) => a.day.localeCompare(b.day) || a.km - b.km);
  const every = okNum(c.every) && c.every > 0 ? c.every : ROTATE_STD;
  const kmNow = okNum(bike?.km) ? bike.km : null;
  const km = Object.fromEntries(list.map((x) => [x.id, 0]));
  swaps.forEach((s, i) => {
    const end = swaps[i + 1]?.km ?? kmNow;
    if (okNum(end)) km[s.to] += Math.max(0, end - s.km);
  });
  const current = swaps.at(-1)?.to ?? null;
  const since = current && okNum(kmNow) ? Math.max(0, kmNow - swaps.at(-1).km) : null;
  // the next one: the chain with the fewest km that is not on the bike
  const next = list.filter((x) => x.id !== current).sort((a, b) => km[a.id] - km[b.id] || list.indexOf(a) - list.indexOf(b))[0] ?? null;
  return {
    on: c.on !== false && list.length > 1,
    every,
    list: list.map((x) => ({ ...x, km: Math.round(km[x.id]), current: x.id === current })),
    current,
    since,
    next,
    due: c.on !== false && list.length > 1 && since != null && since >= every && !!next,
  };
}
const chainsOf = (bike) => ({ on: true, every: ROTATE_STD, list: [], swaps: [], ...(bike?.chains ?? {}) });
export const addChain = (bike, name, id) => (clean(name, 40) ? { chains: { ...chainsOf(bike), list: [...chainsOf(bike).list, { id, name: clean(name, 40) }] } } : null);
export const renameChain = (bike, id, name) => (clean(name, 40) ? { chains: { ...chainsOf(bike), list: chainsOf(bike).list.map((x) => (x.id === id ? { ...x, name: clean(name, 40) } : x)) } } : null);
/** A chain removed: its swaps go too (its km with it). */
export const removeChain = (bike, id) => ({ chains: { ...chainsOf(bike), list: chainsOf(bike).list.filter((x) => x.id !== id), swaps: chainsOf(bike).swaps.filter((s) => s.to !== id) } });
/** A chain put on the bike today at the bike's km. */
export const swapChain = (bike, to, day) => ({ chains: { ...chainsOf(bike), swaps: [...chainsOf(bike).swaps, { day, km: okNum(bike?.km) ? bike.km : 0, to }] } });
export const rotationSet = (bike, patch) => ({ chains: { ...chainsOf(bike), ...patch } });

