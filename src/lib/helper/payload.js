/**
 * v0.77.0 «KI-Helfer»: what goes to Claude, per task. Pure functions, no database.
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

/** Every key a helper request body may contain (at any depth). */
export const FIELDS = new Set([
  // common
  'lang', 'today', 'question', 'tomorrow',
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

/**
 * Paket 4 «Bereit für morgen?»: the evening before a tour. The trip's conditions, the names not packed
 * yet, the names of parts due and the learnings; no ids, no health data, no places.
 */
export function eveningPayload(trip, { open = [], due = [], learnings = [], today = '', tomorrow = '', lang = 'de' } = {}) {
  return keep({
    lang,
    today,
    tomorrow,
    trip: tripOut(trip),
    list: open.slice(0, 30).map((name) => ({ name: clip(name, 80) })),
    parts: due.slice(0, 10).map((name) => ({ name: clip(name, 80) })),
    learnings: learningTexts(learnings, 20),
  });
}
