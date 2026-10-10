/**
 * v0.67.0 «KI-Helfer»: what goes to Claude, per task. Pure functions, no database.
 *
 * Noah's rule (answer 8a, «Was geht an Claude?»): only the question and the names it needs from the
 * list and the gear, plus the notes. NEVER photos, receipts or money (workshop visits, prices),
 * documents, health data (Im Flow / Aktiv), names of people (who did the work, the bike shop) or the
 * Helfer-Code (it travels only in the Authorization header).
 *
 * Every builder copies field by field from the app's records into new objects; FIELDS lists every
 * key a request body may hold (tests/helper.test.js walks real-looking records with photos, prices and
 * shop names through each builder and checks the result against FIELDS).
 */
import { isInventory } from '../gear.js';
import { PART, partInfo, lastReplace } from '../care.js';

/** Every key a helper request body may contain (at any depth). */
export const FIELDS = new Set([
  // common
  'lang', 'today', 'question',
  // lists of things
  'areas', 'bikes', 'blocks', 'items', 'learnings', 'list', 'own', 'unusedBefore', 'notes', 'parts', 'checks', 'rides', 'unused', 'broken', 'missing',
  // fields of a thing
  'key', 'id', 'name', 'category', 'weightG', 'qty', 'tempMin', 'tempMax', 'text', 'times',
  // a trip's conditions
  'trip', 'title', 'area', 'days', 'hours', 'overnight', 'cook', 'rain', 'start',
  // a note on the way
  'day', 'time',
  // a bike and its parts
  'bike', 'type', 'km', 'kmDate', 'model', 'interval', 'everyKm', 'everyDays', 'warnAt', 'limit', 'unit',
  'lastReplace', 'lastService', 'lastMeasure', 'value', 'date', 'kmSinceReplace', 'kmSinceService', 'daysSinceReplace', 'wetKmSinceReplace', 'gainMSinceReplace',
  'count', 'gainM', 'wetKm', 'since', 'status',
]);

const nm = (item, lang) => (lang === 'de' && item?.nameDe ? item.nameDe : item?.name ?? '');
const n = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const clip = (s, len = 300) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, len);
const keep = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && !v.length)));
const learningTexts = (learnings = [], max = 40) =>
  learnings
    .filter((l) => l && !l.archived && (l.rule || l.action))
    .slice(-max)
    .map((l) => ({ text: clip([l.rule, l.action].filter(Boolean).join(' · '), 240) }));

/** One gear item as the helper sees it: id, name, category, weight, temperature range, blocks. */
export const itemOut = (i, lang, { sets = true } = {}) => keep({ id: String(i.id), name: clip(nm(i, lang), 80), category: i.category ?? null, weightG: n(i.weightG), tempMin: n(i.tempMin), tempMax: n(i.tempMax), blocks: sets && Array.isArray(i.sets) ? i.sets.filter((s) => typeof s === 'string').slice(0, 8) : null });

/** A trip's conditions (no route line, no photo, no entries). */
export const tripOut = (trip) =>
  keep({
    title: clip(trip?.title, 80),
    area: trip?.domain ?? 'bikepacking',
    start: typeof trip?.startDate === 'string' ? trip.startDate.slice(0, 10) : null,
    days: Math.max(1, Number(trip?.days) || 1),
    hours: n(trip?.hours),
    overnight: trip?.overnight ?? null,
    cook: trip?.cook === true ? true : null,
    tempMin: n(trip?.wx?.min),
    tempMax: n(trip?.wx?.max),
    rain: trip?.wx?.rain ?? null,
    km: n(trip?.route?.km) == null ? null : Math.round(trip.route.km),
  });

/** 1 «Neue Tour»: the question, the areas, bikes, blocks, the own gear and the learnings. */
export function tripPayload(question, { items = [], bikes = [], sets = [], areas = [], learnings = [], today = '', lang = 'de' } = {}) {
  return {
    lang,
    today,
    question: clip(question, 400),
    areas: areas.map((a) => ({ key: String(a.key), name: clip(a.name, 40) })),
    bikes: bikes.map((b) => ({ id: String(b.id), name: clip(b.name, 60) })),
    blocks: sets.map((s) => ({ key: String(s.key), name: clip(s.label ?? s.name, 60) })),
    items: items.filter(isInventory).map((i) => itemOut(i, lang)),
    learnings: learningTexts(learnings),
  };
}

/** 2 Suche: the question and the own gear (name, category, weight). */
export function searchPayload(question, { items = [], learnings = [], lang = 'de' } = {}) {
  return { lang, question: clip(question, 400), items: items.filter(isInventory).map((i) => itemOut(i, lang, { sets: false })), learnings: learningTexts(learnings, 20) };
}

/**
 * 3 Rückblick: the trip's conditions, its notes on the way (key, day, time, text), what was not used,
 * broke or was missing (names), and the learnings there are already.
 */
export function debriefPayload(trip, { notes = [], debrief = null, items = [], learnings = [], lang = 'de' } = {}) {
  const byId = new Map(items.map((i) => [i.id, i]));
  const state = (s) => Object.entries(debrief?.items ?? {}).filter(([, v]) => v === s).map(([id]) => clip(nm(byId.get(id), lang), 80)).filter(Boolean);
  return {
    lang,
    trip: tripOut(trip),
    notes: notes.filter((x) => x?.text?.trim()).slice(0, 40).map((x) => keep({ key: String(x.key), day: Number.isFinite(x.day) ? x.day + 1 : null, time: typeof x.at === 'string' ? x.at.slice(11, 16) : null, text: clip(x.text, 400) })),
    unused: state('unused'),
    broken: state('broken'),
    missing: (debrief?.missing ?? []).map((m) => clip(m.name, 80)).filter(Boolean),
    learnings: learningTexts(learnings),
  };
}

/**
 * 4 Liste prüfen: the trip, its list (with amounts), the own gear that is not on it (same area),
 * items that were not used on earlier trips (unusedBefore: { id: times }) and the learnings.
 */
export function checklistPayload(trip, { items = [], learnings = [], unusedBefore = {}, lang = 'de' } = {}) {
  const byId = new Map(items.map((i) => [i.id, i]));
  const on = new Set((trip?.entries ?? []).map((e) => e.itemId));
  const area = trip?.domain ?? 'bikepacking';
  const inArea = (i) => !Array.isArray(i.domains) || !i.domains.length || i.domains.includes(area);
  return {
    lang,
    trip: tripOut(trip),
    list: (trip?.entries ?? []).filter((e) => byId.has(e.itemId)).map((e) => ({ ...itemOut(byId.get(e.itemId), lang), qty: Math.max(1, Number(e.qty) || 1) })),
    own: items.filter((i) => isInventory(i) && !on.has(i.id) && inArea(i)).map((i) => itemOut(i, lang)),
    unusedBefore: Object.entries(unusedBefore).filter(([id, t]) => on.has(id) && t > 0).map(([id, t]) => ({ id, times: t })),
    learnings: learningTexts(learnings),
  };
}

const daysBetween = (a, b) => (a && b ? Math.round((Date.parse(`${b.slice(0, 10)}T00:00:00Z`) - Date.parse(`${a.slice(0, 10)}T00:00:00Z`)) / 864e5) : null);
const wetTrip = (trip) => trip?.wx?.rain === 'rain' || trip?.wx?.rain === 'showers';
const lastOf = (part, test) => [...(part.history ?? [])].reverse().find(test) ?? null;

/**
 * The rides of one bike: [{ date, km, gainM, wet }] from its trips (route or uploaded rides) and its
 * uploaded rides without a trip. Only numbers, no track.
 */
export function bikeRides(bike, { trips = [], rides = [] } = {}) {
  const mine = trips.filter((t) => t.bikeId === bike.id && t.startDate);
  const out = [];
  const ridden = new Set();
  for (const t of mine) {
    const own = rides.filter((r) => r.tripId === t.id);
    own.forEach((r) => ridden.add(r.id));
    const km = own.length ? own.reduce((s, r) => s + (n(r.km) ?? 0), 0) : n(t.route?.km) ?? n(t.km) ?? null;
    if (!km) continue;
    const gainM = own.length ? own.reduce((s, r) => s + (n(r.gainM) ?? 0), 0) : n(t.route?.gainM);
    out.push({ date: t.startDate.slice(0, 10), km: Math.round(km), gainM: gainM == null ? null : Math.round(gainM), wet: wetTrip(t) });
  }
  for (const r of rides) if (!ridden.has(r.id) && r.bikeId === bike.id && n(r.km)) out.push({ date: String(r.date ?? '').slice(0, 10), km: Math.round(r.km), gainM: n(r.gainM) == null ? null : Math.round(r.gainM), wet: false });
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 5 Wartung (Noah's most important part): per part km and days since the last replacement and
 * service, the last measured value, the interval data of the app, wet km and metres climbed since
 * the replacement; the bike's open problems and notes; the checks done from earlier suggestions.
 * No money, no shop names, no «by whom», no receipt photos.
 */
export function maintenancePayload(bike, { tasks = [], notes = [], trips = [], rides = [], checks = [], today = '', lang = 'de' } = {}) {
  const ridesOf = bikeRides(bike, { trips, rides });
  const since = (date) => ridesOf.filter((r) => !date || r.date >= date);
  const sum = (rows, k) => rows.reduce((s, r) => s + (r[k] ?? 0), 0);
  const parts = (bike.parts ?? [])
    .filter((p) => PART[p.key] || p.name)
    .map((stored) => {
      const p = partInfo(stored);
      const rep = lastReplace(stored);
      const svc = lastOf(stored, (h) => h.action === 'service');
      const val = lastOf(stored, (h) => typeof h.value === 'number');
      const interval = keep({ everyKm: n(p.everyKm), everyDays: n(p.everyDays), warnAt: n(p.warnAt), limit: n(p.limit), unit: p.unit || null });
      const after = rep?.date ? since(rep.date) : null;
      const row = keep({
        key: String(stored.key),
        name: clip(PART[stored.key]?.name ?? stored.name, 60),
        model: clip(stored.model, 80),
        interval: Object.keys(interval).length ? interval : null,
        lastReplace: rep ? keep({ date: rep.date ?? null, km: n(rep.km) }) : null,
        lastService: svc ? keep({ date: svc.date ?? null, km: n(svc.km) }) : null,
        lastMeasure: val ? keep({ date: val.date ?? null, km: n(val.km), value: val.value }) : null,
        kmSinceReplace: n(bike.km) != null && n(rep?.km) != null ? bike.km - rep.km : null,
        kmSinceService: n(bike.km) != null && n(svc?.km) != null ? bike.km - svc.km : null,
        daysSinceReplace: rep?.date && today ? daysBetween(rep.date, today) : null,
        wetKmSinceReplace: after ? sum(after.filter((r) => r.wet), 'km') : null,
        gainMSinceReplace: after ? sum(after, 'gainM') : null,
      });
      return row;
    })
    // only parts the helper can say something about: a history, a model or an interval
    .filter((p) => p.lastReplace || p.lastService || p.lastMeasure || p.model || p.interval);
  const open = tasks.filter((t) => (t.bikeId ?? null) === bike.id && !['done', 'dropped'].includes(t.status) && t.task).map((t) => ({ date: t.logDate ?? null, text: clip(t.task, 300) }));
  const bikeNotes = notes.filter((x) => x.bikeId === bike.id && x.text?.trim()).slice(-20).map((x) => ({ date: String(x.at ?? '').slice(0, 10) || null, text: clip(x.text, 300) }));
  const year = today ? `${Number(today.slice(0, 4)) - 1}${today.slice(4, 10)}` : '';
  const last12 = ridesOf.filter((r) => !year || r.date >= year);
  return {
    lang,
    today,
    bike: keep({ name: clip(bike.name, 60), type: clip(bike.type, 40), km: n(bike.km), kmDate: bike.kmDate ?? null }),
    parts,
    rides: { since: year || null, count: last12.length, km: sum(last12, 'km'), gainM: sum(last12, 'gainM'), wetKm: sum(last12.filter((r) => r.wet), 'km') },
    notes: [...open, ...bikeNotes].map(keep).slice(0, 30),
    checks: checks.filter((c) => c.bikeId === bike.id).slice(-20).map((c) => keep({ key: c.key, date: c.date ?? null, km: n(c.km), status: c.status ?? null })),
  };
}

/** Every key used anywhere in a value (for the allowlist test). */
export function keysOf(value, out = new Set()) {
  if (Array.isArray(value)) value.forEach((v) => keysOf(v, out));
  else if (value && typeof value === 'object')
    for (const [k, v] of Object.entries(value)) {
      out.add(k);
      keysOf(v, out);
    }
  return out;
}
