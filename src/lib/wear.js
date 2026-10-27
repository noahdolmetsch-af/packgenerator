/**
 * «Verschleiss» (Noah 20.10.2026, answers «1 pro Teil, 2a+b, 3a, 4a+b, 5a»): how worn each part of a
 * bike is, what the parts before it lasted, and when the next change is due.
 *
 * Nothing new is counted twice: the km on a part come from its history (with the workshop visits merged
 * in, workshop.js withVisits): a part replaced in a visit starts again at 0 km, a serviced part starts
 * «since service» at 0, the bike's total km always stay (km book).
 *
 * How long a part lasts (answer 3a): a start value (LIFE_STD) that learns from the own changes: the
 * start value counts as one change, each part that was used up counts as one more (the mean of all).
 * A value typed by the person (bike.life[key]) wins; null or no value = back to the suggestion.
 *
 * The forecast (answer 4a+b): «X km left» and, from the km of the last 8 weeks, «about in March».
 * Pure functions only, tested in tests/wear.test.js.
 */
import { PART, partInfo, partName, wear as measured, needsWork } from './care.js';
import { partStart, partKm, counts } from './kmbook.js';
import { localDay } from './localday.js';
import { withVisits } from './workshop.js';

/** Start values in km: a suggestion only, changeable per bike and part. */
export const LIFE_STD = { chain: 3000, cassette: 9000, chainring: 15000, padsF: 1500, padsR: 1500, rotorF: 15000, rotorR: 15000, tyres: 4000, bb: 10000, grips: 10000 };
/** The parts the page shows by default (the wear parts); other parts show when they have a life of their own. */
export const WEAR_KEYS = Object.keys(LIFE_STD);
/** From this share of the life on, a part is «soon». */
export const SOON = 0.8;
/** The weeks the forecast looks back. */
export const WEEKS = 8;

const ok = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;
const DAY = 864e5;
const addDays = (day, n) => new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);

/** The replacements of a part with known km, oldest first (a «needed» entry is a note, not a change). */
const changes = (part) => (part?.history ?? []).filter((h) => h.action === 'replace' && h.result !== 'needed' && h.date && typeof h.km === 'number');

/**
 * The parts before this one with the km they lasted, newest first:
 * [{ from, to, km, model }]. A change without km in between breaks the chain (that part is left out).
 */
export function pastParts(part) {
  const list = changes(part);
  const out = [];
  for (let i = 1; i < list.length; i++) {
    const a = list[i - 1];
    const b = list[i];
    const km = b.km - a.km + (typeof a.carried === 'number' ? a.carried : 0);
    if (km > 0) out.push({ from: a.date, to: b.date, km: Math.round(km), model: a.model || null });
  }
  return out.reverse();
}

/**
 * How long the part lasts on this bike: { km, source: 'own' | 'learned' | 'std' | null, n }.
 * n: the used-up parts it learned from.
 */
export function lifeOf(bike, part) {
  const key = part?.key;
  const own = bike?.life?.[key];
  if (ok(own)) return { km: own, source: 'own', n: 0, std: LIFE_STD[key] ?? null };
  const std = LIFE_STD[key] ?? null;
  const past = pastParts(part);
  if (!std && !past.length) return { km: null, source: null, n: 0, std: null };
  if (!past.length) return { km: std, source: 'std', n: 0, std };
  const sum = past.reduce((s, p) => s + p.km, 0) + (std ?? 0);
  const n = past.length + (std ? 1 : 0);
  return { km: Math.round(sum / n / 50) * 50 || Math.round(sum / n), source: 'learned', n: past.length, std };
}

/** The km per week of the last WEEKS weeks from the km book (counted rides of the bike), or null. */
export function weeklyKm(entries = [], bikeId, today = localDay()) {
  const from = addDays(today, -WEEKS * 7);
  const km = entries.filter((e) => e.bikeId === bikeId && e.kind === 'ride' && counts(e) && e.date > from && e.date <= today).reduce((s, e) => s + (Number(e.km) || 0), 0);
  return km > 0 ? Math.round(km / WEEKS) : null;
}

/** The day a part reaches its life at this pace, or null. */
export function dueDay(left, perWeek, today = localDay()) {
  if (!ok(perWeek) || typeof left !== 'number') return null;
  if (left <= 0) return today;
  return addDays(today, Math.ceil((left / perWeek) * 7));
}

/** The last service or change of a part with known km (for «since service»), or null. */
const lastService = (part) => [...(part?.history ?? [])].reverse().find((h) => (h.action === 'service' || h.action === 'replace') && h.result !== 'needed' && typeof h.km === 'number') ?? null;

/**
 * What a part cost per 1000 km: everything paid for it (jobs with a price) from the first priced job on,
 * over the km since then; only after 1000 km. → { chf, km } or null.
 */
export function partCost(bike, part) {
  const priced = (part?.history ?? []).filter((h) => typeof h.chf === 'number' && typeof h.km === 'number' && h.date).sort((a, b) => a.date.localeCompare(b.date));
  if (!priced.length || typeof bike?.km !== 'number') return null;
  const km = bike.km - priced[0].km;
  if (km < 1000) return null;
  const chf = priced.reduce((s, h) => s + h.chf, 0);
  return { chf: Math.round((chf / km) * 1000 * 10) / 10, km };
}

/**
 * Noah 26.10.2026 «1a»: the chain checker corrects the forecast. From the values measured on the chain since it
 * was mounted (with km): the growth per km from the first to the last value (one value: from 0 % at mounting),
 * then the km until the limit, minus the km ridden since the last measurement (50 km steps).
 * → { value, km, date, limit, left } or null (no value with km, or no growth).
 */
export function measuredLeft(bike, part) {
  if (part?.key !== 'chain') return null;
  const start = partStart(part);
  if (!start) return null;
  const limit = ok(part.limit) ? part.limit : PART.chain?.limit;
  const vals = (part.history ?? [])
    .filter((h) => h.action === 'check' && typeof h.value === 'number' && typeof h.km === 'number' && h.date && h.date >= start.date && h.km >= start.km)
    .sort((a, b) => a.km - b.km || a.date.localeCompare(b.date));
  const last = vals.at(-1);
  if (!last || !ok(limit)) return null;
  const first = vals.length > 1 ? vals[0] : { km: start.km - start.carried, value: 0 };
  const rate = last.km > first.km ? (last.value - first.value) / (last.km - first.km) : 0;
  const since = typeof bike?.km === 'number' ? Math.max(0, bike.km - last.km) : 0;
  const left = last.value >= limit ? -since : rate > 0 ? Math.round(((limit - last.value) / rate - since) / 50) * 50 : null;
  if (left == null) return null;
  return { value: last.value, km: Math.max(0, last.km - start.km) + start.carried, date: last.date, limit, left };
}

/**
 * One row per wear part of a bike (bike: withVisits view with km), most worn first.
 * → [{ key, name, model, km, life, left, frac, state: 'ok'|'soon'|'due'|'unknown', why, since, past,
 *      cost, due }]
 * why: 'km' (by km), 'measured' (a measured value says so), 'work' (work needed), null.
 */
export function wearRows(bike, { entries = [], today = localDay(), keys = null } = {}) {
  const perWeek = weeklyKm(entries, bike?.id, today);
  const parts = (bike?.parts ?? []).filter((p) => !isHidden(bike, p.key) && (keys ? keys.includes(p.key) : WEAR_KEYS.includes(p.key) || ok(bike?.life?.[p.key])));
  const rows = parts.map((p) => {
    const life = lifeOf(bike, p);
    const start = partStart(p);
    const km = start ? partKm(bike, p) : null;
    let left = km != null && life.km ? Math.round(life.km - km) : null;
    let frac = km != null && life.km ? km / life.km : null;
    // the chain checker: when the measured growth says less than the km, the measurement counts
    const meas = km != null ? measuredLeft(bike, p) : null;
    const byMeas = !!meas && (left == null || meas.left < left);
    if (byMeas) {
      left = meas.left;
      frac = km + left > 0 ? Math.min(1.5, km / (km + left)) : 1;
    }
    const m = measured(p);
    let state = frac == null ? 'unknown' : frac >= 1 ? 'due' : frac >= SOON ? 'soon' : 'ok';
    let why = frac == null ? null : state === 'ok' ? null : byMeas ? 'measured' : 'km';
    if (needsWork(p)) [state, why] = ['due', 'work'];
    else if (m === 'worn') [state, why] = ['due', 'measured'];
    else if (m === 'warn' && state !== 'due') [state, why] = ['soon', 'measured'];
    const ls = lastService(p);
    const since = ls && typeof bike?.km === 'number' && ls.action === 'service' ? { km: Math.max(0, bike.km - ls.km), date: ls.date } : null;
    return {
      key: p.key,
      name: partName(p),
      model: p.model || '',
      km,
      life,
      left,
      frac,
      state,
      why,
      since,
      past: pastParts(p),
      cost: partCost(bike, p),
      due: left != null ? dueDay(left, perWeek, today) : null,
      start: start ? start.date : null,
      unit: partInfo(p).unit,
      meas,
      byMeas,
    };
  });
  const rank = { due: 0, soon: 1, ok: 2, unknown: 3 };
  return rows.sort((a, b) => rank[a.state] - rank[b.state] || (b.frac ?? -1) - (a.frac ?? -1) || a.name.localeCompare(b.name));
}

/** The short line for the bike page and the care card: { state, top, n } (n: soon or due parts). */
export function wearSummary(rows = []) {
  const hot = rows.filter((r) => r.state === 'due' || r.state === 'soon');
  const known = rows.filter((r) => r.state !== 'unknown');
  return { state: hot.some((r) => r.state === 'due') ? 'due' : hot.length ? 'soon' : known.length ? 'ok' : 'unknown', top: hot[0] ?? known[0] ?? null, n: hot.length, unknown: rows.length - known.length };
}

/**
 * The parts that run out before or on a trip (answer 5a, Tour-Vorbereitung): due now, or the route's km
 * (else the pace of the last weeks until the last day) take them over their life.
 * trip: { startDate, days, route: { km } }. → [{ key, name, when: 'now'|'during', left, why }]
 */
export function wearForTrip(rows = [], trip, today = localDay()) {
  if (!trip?.startDate) return [];
  const end = addDays(trip.startDate, Math.max(1, Number(trip.days) || 1) - 1);
  const routeKm = typeof trip.route?.km === 'number' ? trip.route.km : null;
  const out = [];
  for (const r of rows) {
    // a measured «worn» or «work needed» already stands in the bike's rows (workshop.js bikeDue): only the km here
    if (r.state === 'due') {
      if (r.why === 'km') out.push({ key: r.key, name: r.name, when: 'now', left: r.left, why: r.why });
    }
    else if (r.left != null && routeKm != null && r.left <= routeKm) out.push({ key: r.key, name: r.name, when: 'during', left: r.left, why: 'km' });
    else if (r.due && r.due <= end && routeKm == null) out.push({ key: r.key, name: r.name, when: r.due < trip.startDate ? 'now' : 'during', left: r.left, why: 'km' });
  }
  return out;
}

/* ---------- the life per part (bike.life), changeable and back to the suggestion ---------- */

/** A part taken off the page by the person (bike.life[key] === null); its history stays. */
export const isHidden = (bike, key) => !!bike?.life && Object.hasOwn(bike.life, key) && bike.life[key] === null;

/**
 * A new life for one part: km (a number > 0) sets it, 'off' takes the part off the page (null),
 * anything else goes back to the suggestion (the key is removed). → { life }.
 */
export function lifeChange(bike, key, km) {
  const next = { ...(bike?.life ?? {}) };
  if (ok(km)) next[key] = Math.round(km);
  else if (km === 'off') next[key] = null;
  else delete next[key];
  return { life: next };
}

/** The parts of the bike that could go on the page: not shown yet (hidden, or no wear part and no own life). */
export function addableParts(bike) {
  return (bike?.parts ?? []).filter((p) => isHidden(bike, p.key) || (!WEAR_KEYS.includes(p.key) && !ok(bike?.life?.[p.key])));
}

/* ---------- the whole-bike counter (answer 1): every service stays, the newest is «last» ---------- */

/**
 * A whole-bike service on a day (by a workshop visit or by hand): it becomes the last one when it is the
 * newest; the one before moves to service.past. An older one (a receipt typed later) goes into past.
 * point: { day, km, hours, visitId }. → { service }.
 */
export function serviceAt(bike, point) {
  const s = { ...(bike?.service ?? {}) };
  const past = [...(s.past ?? [])];
  const p = { day: point.day, km: typeof point.km === 'number' ? point.km : null, hours: typeof point.hours === 'number' ? point.hours : null, ...(point.visitId ? { visitId: point.visitId } : {}) };
  if (!s.last?.day || p.day >= s.last.day) {
    if (s.last?.day) past.push(s.last);
    s.last = p;
  } else past.push(p);
  s.past = past.sort((a, b) => a.day.localeCompare(b.day));
  return { service: s };
}

/** A workshop visit removed: its service point goes too (the one before becomes the last again). → { service } or null. */
export const serviceWithout = (bike, visitId) => (visitId ? serviceDrop(bike, (p) => p.visitId === visitId) : null);

/** One service point removed by hand (its day), when no visit stands behind it. → { service } or null. */
export const serviceDropDay = (bike, day) => serviceDrop(bike, (p) => p.day === day && !p.visitId);

function serviceDrop(bike, test) {
  const s = bike?.service;
  if (!s) return null;
  const all = [...(s.past ?? []), ...(s.last ? [s.last] : [])].filter((p) => !test(p));
  if (all.length === (s.past ?? []).length + (s.last ? 1 : 0)) return null;
  all.sort((a, b) => a.day.localeCompare(b.day));
  const rest = { ...s };
  delete rest.last;
  return { service: { ...rest, ...(all.length ? { last: all.at(-1) } : {}), past: all.slice(0, -1) } };
}

/**
 * The service periods of a bike, newest first: [{ from, to, km, days, visitId, now }]. The newest runs
 * from the last service until today (now: true) with the km on the counter.
 */
export function servicePeriods(bike, today = localDay()) {
  const s = bike?.service ?? {};
  const all = [...(s.past ?? []), ...(s.last ? [s.last] : [])].filter((p) => p?.day).sort((a, b) => a.day.localeCompare(b.day));
  const days = (a, b) => Math.max(0, Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY));
  const out = [];
  for (let i = 0; i < all.length; i++) {
    const a = all[i];
    const b = all[i + 1] ?? null;
    const endKm = b ? b.km : typeof bike?.km === 'number' ? bike.km : null;
    out.push({ from: a.day, to: b ? b.day : today, km: typeof a.km === 'number' && typeof endKm === 'number' ? Math.max(0, endKm - a.km) : null, days: days(a.day, b ? b.day : today), visitId: a.visitId ?? null, now: !b });
  }
  return out.reverse();
}

/** The name of a part key (for parts not in the bike's list yet). */
export const keyName = (key) => (PART[key] ? partName({ key }) : key);

/**
 * «Verschleiss immer im Griff» (Noah 20.10.2026: «Kette nach 1000 km ersetzen … als Reminder»): the reminders
 * on the phone (push/schedule.js, kind 'wear'). One per part that has reached its km (day: today) or reaches it
 * in the next 14 days at the pace of the last weeks (day: that day). The key holds the mounting day, so a
 * new part gets a new reminder. → [{ key, day, bike, part, life, left, url }]
 */
export function wearPush(bikes = [], { visits = [], entries = [], today = localDay() } = {}) {
  const until = addDays(today, 14);
  const out = [];
  for (const b of bikes) {
    if (b.status === 'sold' || b.archived) continue;
    for (const r of wearRows(withVisits(b, visits), { entries, today })) {
      if (r.km == null || !r.life.km || r.left == null) continue;
      const day = r.left <= 0 ? today : r.due && r.due <= until ? r.due : null;
      if (!day) continue;
      out.push({ key: `wear:${b.id}:${r.key}:${r.start}:${r.life.km}`, day, bike: b.name, part: r.name, life: r.life.km, left: Math.max(0, r.left), url: `#/bikes?tab=care&view=wear&bike=${encodeURIComponent(b.id)}` });
    }
  }
  return out;
}

/**
 * Noah 26.10.2026 «7a»: the coming changes as all-day items for the calendar «Packgenerator» (googleown.js).
 * list: [{ bike, rows }] (rows: wearRows of that bike). A part with a forecast day within a year; a due part
 * today. The reminder: the evening before at 18:00. T: t() (the language of the calendar).
 * → [{ key, title, day, allDay, note, remind }]
 */
export function wearItems(list = [], today = localDay(), T = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => v?.[k] ?? m)) {
  const out = [];
  const until = addDays(today, 366);
  for (const { bike, rows } of list) {
    if (!bike?.id || bike.status === 'sold' || bike.archived) continue;
    for (const r of rows ?? []) {
      const day = r.state === 'due' ? today : r.due && r.state !== 'unknown' ? r.due : null;
      if (!day || day > until) continue;
      out.push({
        key: `wear:${String(bike.id).replace(/[^\w:.-]/g, '-').slice(0, 60)}:${String(r.key).replace(/[^\w.-]/g, '-').slice(0, 30)}`,
        title: T('{bike}: replace {part}', { bike: String(bike.name ?? '').slice(0, 80), part: r.name }),
        day,
        allDay: true,
        note: r.state === 'due' ? T('From the Pack Generator: due now.') : T('From the Pack Generator: about {km} km left at your pace. The day moves with your km.', { km: Math.max(0, r.left ?? 0) }),
        remind: [6 * 60],
      });
    }
  }
  return out.sort((a, b) => a.day.localeCompare(b.day) || a.key.localeCompare(b.key));
}
