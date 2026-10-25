/**
 * Paket W «Von der Haustür bis zurück» (Noah 20.10.2026 «1a 2a 3a 4a», liste.json 1116–1119).
 *
 *   1116 «Gut angekommen»: per trip the people who want a short message (the emergency contacts of
 *        «Vor der Abfahrt», settings 'notfall'); one tap opens the phone's share sheet with a ready text.
 *        No server, nothing is sent by the app itself.
 *   1117 Plan B for bad weather: per trip a shorter variant (a GPX route and/or a note) or the train home.
 *        When the forecast of a trip day brings heavy rain or a storm, a hint shows on the trip (Planen,
 *        Unterwegs) and in the evening window, never on Heute itself.
 *   1118 Check-in time of the accommodation per night, with a warning when the planned arrival is too
 *        late. The speed you would need comes from the race cut-off calculator (race.js cutoffNeed).
 *   1119 «Velo abgestellt»: photo, place (GPS, read only on the tap) and lock (locks from Material).
 *        Kept only on this device (settings 'veloParked' is a device row: no backup, no sync).
 *
 * Stored on the trip as extra fields (no new table, no schema version; an older trip simply has none):
 *   trip.planB     = { kind: 'short' | 'train', note: '', route: <route like trip.route> | null, on }
 *                    on: plan B is the trip's route now (the original waits in planB.route)
 *   trip.stays     = [{ n, name, until: 'HH:MM', phone }]   n: the day whose evening it is (0 = first night)
 *   trip.arrivedTo = [contact id]
 * Pure functions, tested in tests/haustuer.test.js. Labels are English keys for t().
 */
import { cutoffNeed, msOf } from '../race/race.js';

/** The device-only record of the parked bike (see db.js DEVICE_SETTINGS). */
export const PARKED_KEY = 'veloParked';

/* ---------- 1117 Plan B ---------- */

/** The kinds of plan B (labels for t()). */
export const PLANB_KINDS = [
  { key: 'short', name: 'Shorter variant', sub: 'a GPX route or a note' },
  { key: 'train', name: 'Train home', sub: 'the next trains from where you are' },
];

/** Heavy rain: an hour with 2 mm or more, 8 mm over the day, or 3 hours with a chance of 70 % or more. Storm: gusts from 60 km/h. */
export const RAIN_HOUR_MM = 2;
export const RAIN_DAY_MM = 8;
export const RAIN_SURE_PCT = 70;
export const STORM_KMH = 60;

/** A trip's plan B made safe, or null when none is set. */
export function planBOf(trip) {
  const p = trip?.planB;
  if (!p || typeof p !== 'object') return null;
  const kind = PLANB_KINDS.some((k) => k.key === p.kind) ? p.kind : 'short';
  const note = typeof p.note === 'string' ? p.note : '';
  const route = p.route && typeof p.route === 'object' && Number(p.route.km) > 0 ? p.route : null;
  if (kind === 'short' && !note.trim() && !route) return null;
  return { kind, note, route };
}

/**
 * Bad weather in forecast hours ({ rainMm, rainPct, wind, gust }): → { rain, storm, mm, gust } or null.
 * Ordinary showers (the app's rain limit) are not bad weather here: plan B is for heavy rain or a storm.
 */
export function badWeather(hours = []) {
  const list = Array.isArray(hours) ? hours.filter(Boolean) : [];
  if (!list.length) return null;
  const mm = Math.round(list.reduce((s, h) => s + (Number(h.rainMm) || 0), 0) * 10) / 10;
  const sure = list.filter((h) => Number(h.rainPct) >= RAIN_SURE_PCT).length;
  const rain = list.some((h) => Number(h.rainMm) >= RAIN_HOUR_MM) || mm >= RAIN_DAY_MM || sure >= 3;
  const gusts = list.map((h) => Number(h.gust ?? h.wind)).filter(Number.isFinite);
  const gust = gusts.length ? Math.round(Math.max(...gusts)) : null;
  const storm = gust != null && gust >= STORM_KMH;
  return rain || storm ? { rain, storm, mm, gust } : null;
}

/** All hours of a saved forecast (fetchHourly: { places: [{ hours }] }) for one day. */
export function hoursOfDay(saved, date) {
  const out = [];
  for (const p of saved?.places ?? []) for (const h of p?.hours ?? []) if (!date || String(h?.t ?? '').startsWith(date)) out.push(h);
  return out;
}

/** The words for bad weather: «Heavy rain (12 mm)», «Storm (gusts 70 km/h)», or both. t: the translator. */
export function badText(bad, t) {
  if (!bad) return '';
  const parts = [];
  if (bad.rain) parts.push(t('heavy rain ({n} mm)', { n: Math.round(bad.mm) }));
  if (bad.storm) parts.push(t('storm (gusts up to {n} km/h)', { n: bad.gust }));
  return parts.join(' · ');
}

/** Swap the route of the trip with the route of plan B (and back): the fields to save. */
export function swapPlanB(trip) {
  const p = planBOf(trip);
  if (!p?.route) return null;
  return { route: p.route, planB: { ...trip.planB, route: trip.route ?? null, on: !trip.planB.on } };
}

/* ---------- 1118 check-in ---------- */

const HM = /^([01]\d|2[0-3]):[0-5]\d$/;
export const isHM = (v) => typeof v === 'string' && HM.test(v);

/** The stays of a trip made safe: [{ n, name, until, phone }], only the ones with a night index. */
export function staysOf(trip) {
  const list = Array.isArray(trip?.stays) ? trip.stays : [];
  return list
    .filter((s) => s && Number.isInteger(s.n) && s.n >= 0)
    .map((s) => ({ n: s.n, name: String(s.name ?? ''), until: isHM(s.until) ? s.until : '', phone: String(s.phone ?? ''), ...(isHM(s.callBy) ? { callBy: s.callBy } : {}) })); // callBy: Paket B, UC-035-I2
}

/** The list after setting the stay of night n (an empty stay is removed). */
export function setStay(list, n, fields) {
  const rest = (list ?? []).filter((s) => s.n !== n);
  const s = { n, name: String(fields?.name ?? '').trim(), until: isHM(fields?.until) ? fields.until : '', phone: String(fields?.phone ?? '').trim(), callBy: isHM(fields?.callBy) ? fields.callBy : '' };
  if (!s.callBy) delete s.callBy;
  return s.name || s.until || s.phone || s.callBy ? [...rest, s].sort((a, b) => a.n - b.n) : rest;
}

/**
 * The check-in of one night against the planned arrival of that day.
 * st: the stage of the day (ride.js stage: { date, km, hours, startAt, endAt, arrive }).
 * → { until, arrive, lateMin (+ = too late), needKmh (to make it by the check-in), planKmh } or null.
 */
export function checkinOf(stay, st) {
  if (!stay?.until || !st?.date || !st.endAt) return null;
  const cutMs = msOf(`${st.date}T${stay.until}`);
  const endMs = msOf(st.endAt);
  if (!Number.isFinite(cutMs) || !Number.isFinite(endMs)) return null;
  const lateMin = Math.round((endMs - cutMs) / 6e4);
  const planKmh = st.km && st.hours ? Math.round((st.km / st.hours) * 10) / 10 : null;
  // the race cut-off calculator (Paket U, 25): the speed from the start to the check-in
  const need = st.km && st.startAt ? cutoffNeed({ fromKm: 0, now: msOf(st.startAt), toKm: st.km, cutMs }) : null;
  const needKmh = need && Number.isFinite(need.kmh) ? Math.round(need.kmh * 10) / 10 : need ? Infinity : null;
  return { until: stay.until, arrive: st.arrive ?? st.endAt.slice(11, 16), lateMin, late: lateMin > 0, needKmh, planKmh };
}

/** How many nights a trip has where a check-in can be set (every day but the last). */
export const nightsOf = (days) => Math.max(0, (Number(days) || 1) - 1);

/* ---------- 1116 «Gut angekommen» ---------- */

/** The contacts chosen for this trip (in the order of the contact list). */
export function arrivedPeople(trip, contacts = []) {
  const ids = new Set(Array.isArray(trip?.arrivedTo) ? trip.arrivedTo : []);
  return contacts.filter((c) => ids.has(c.id));
}

/** Toggle one contact for the trip: the new list of ids. */
export function toggleArrived(trip, id) {
  const ids = Array.isArray(trip?.arrivedTo) ? trip.arrivedTo : [];
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

/** First names joined: «Anna», «Anna and Ben», «Anna, Ben and Cem». and: the word for «and». */
export function joinNames(names = [], and = 'and') {
  const list = names.map((n) => String(n ?? '').trim().split(/\s+/)[0]).filter(Boolean);
  if (list.length < 2) return list[0] ?? '';
  return `${list.slice(0, -1).join(', ')} ${and} ${list.at(-1)}`;
}

/** A Google Maps link to a point. */
export const mapsAt = (p) => `https://www.google.com/maps/search/?api=1&query=${Number(p.lat).toFixed(5)},${Number(p.lon).toFixed(5)}`;

/**
 * The ready text. t: the translator; names: [name]; place: where you are (a name, or ''); time: 'HH:MM';
 * here: { lat, lon } when the place goes along, else null.
 */
export function arrivedText({ t, names = [], place = '', time = '', here = null }) {
  const who = joinNames(names, t('and|names'));
  const where = place ? t('I arrived safely in {place} at {time}.', { place, time }) : t('I arrived safely at {time}.', { time });
  const lines = [who ? `${t('Hi {names},', { names: who })} ${where}` : where];
  if (here) lines.push(t('Where I am: {url}', { url: mapsAt(here) }));
  return lines.join('\n');
}

/* ---------- 1145 «Gute Nacht» (Noah 24.10.2026 «3a») ---------- */

/** The good-night text: where you sleep, when you ride on and whom to call if nothing comes by `late` (hh:mm). */
export function nightText({ t, names = [], place = '', late = '10:00', here = null }) {
  const who = joinNames(names, t('and|names'));
  const where = place ? t('I am sleeping in {place} tonight. Good night!', { place }) : t('I am stopping for the night. Good night!');
  const lines = [who ? `${t('Hi {names},', { names: who })} ${where}` : where];
  lines.push(t('If you hear nothing from me by {time} tomorrow, please call me.', { time: late }));
  if (here) lines.push(t('Where I am: {url}', { url: mapsAt(here) }));
  return lines.join('\n');
}

/** The morning text after a good-night message: riding on. */
export function morningText({ t, names = [] }) {
  const who = joinNames(names, t('and|names'));
  const ride = t('Good morning, I am riding on now.');
  return who ? `${t('Hi {names},', { names: who })} ${ride}` : ride;
}

/**
 * The morning reminder (Noah «3a»): a good-night message went out yesterday and today has no start yet.
 * trip.nightSent = 'YYYY-MM-DD' (the evening it was shared); dayIdx: today's day of the trip.
 */
export function morningDue(trip, today, dayIdx, yesterday) {
  if (!trip || trip.finished || !trip.nightSent || trip.nightSent !== yesterday) return false;
  return !trip.rideStart?.[dayIdx] && trip.morningSent !== today;
}

/** An SMS link to the phone numbers of the chosen people with the text («sms:+41…,+41…?body=…»). */
export function smsHref(phones = [], text = '') {
  const nrs = phones.map((p) => String(p ?? '').replace(/[^\d+]/g, '')).filter(Boolean);
  return `sms:${nrs.join(',')}?body=${encodeURIComponent(text)}`;
}

/** Where the day ends: the name of the night stop of this day, the place of the trip, or ''. */
export function arrivePlace(trip, day) {
  const own = trip?.stages?.days?.[day]?.name;
  return own ? String(own).trim() : '';
}

/* ---------- 1119 «Velo abgestellt» ---------- */

/** A lock in the gear: «lock» or «Schloss» in the name, brand or model (not archived). */
const LOCK = /(^|[^a-zäöü])(lock|locks|schloss|schlösser|faltschloss|bügelschloss|kettenschloss|kabelschloss)([^a-zäöü]|$)|schloss$/i;
export function lockItems(items = []) {
  return items.filter((i) => i && !i.archived && LOCK.test([i.name, i.nameDe, i.model].filter(Boolean).join(' '))).sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

/** The parked record made safe, or null. */
export function parkedOf(value) {
  const v = value && typeof value === 'object' ? value : null;
  if (!v || !v.at) return null;
  const here = Number.isFinite(v.lat) && Number.isFinite(v.lon) ? { lat: v.lat, lon: v.lon, acc: Number.isFinite(v.acc) ? v.acc : null } : null;
  const off = Array.isArray(v.off) ? [...new Set(v.off.map((x) => String(x ?? '').trim().slice(0, 40)).filter(Boolean))].slice(0, 12) : [];
  return { at: String(v.at), here, lock: String(v.lock ?? ''), lockName: String(v.lockName ?? ''), note: String(v.note ?? ''), photo: typeof v.photo === 'string' && v.photo.startsWith('data:image/') ? v.photo : '', key: String(v.key ?? '').trim().slice(0, 60), off };
}
/** Paket B, UC-101-I2: what usually comes off the parked bike and goes along (English keys for t(); own ones as typed). */
export const PARKED_OFF = ['Lights', 'Bike computer', 'Bottles', 'Handlebar bag', 'Pump'];

/** How long ago: minutes → { n, unit } ('min' | 'h' | 'd'). */
export function agoOf(at, now = Date.now()) {
  const min = Math.max(0, Math.round((now - new Date(at).getTime()) / 6e4));
  if (!Number.isFinite(min)) return null;
  if (min < 60) return { n: min, unit: 'min' };
  if (min < 48 * 60) return { n: Math.round(min / 60), unit: 'h' };
  return { n: Math.round(min / 1440), unit: 'd' };
}

/* ---------- the evening window ---------- */

const addDay = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/**
 * From 17:00: a trip with a plan B that rides tomorrow (its first day or a later one).
 * now: 'YYYY-MM-DDTHH:MM' local. → { trip, day (index), date } or null.
 */
export function planBTomorrow(trips = [], now, from = '17:00') {
  if (String(now).slice(11, 16) < from) return null;
  const tomorrow = addDay(String(now).slice(0, 10), 1);
  for (const trip of trips) {
    if (!trip?.startDate || trip.finished || trip.skipped || !planBOf(trip)) continue;
    const days = Math.max(1, Number(trip.days) || 1);
    const last = addDay(trip.startDate, days - 1);
    if (tomorrow < trip.startDate || tomorrow > last) continue;
    const day = Math.round((new Date(`${tomorrow}T12:00:00Z`) - new Date(`${trip.startDate}T12:00:00Z`)) / 864e5);
    return { trip, day, date: tomorrow };
  }
  return null;
}

/** Paket B, UC-035-I2 «Kontakt vor dem Funkloch»: '' (no time or long before), 'soon' (30 min or less before) or 'past' at the time «call by» of a stay. */
export function callState(stay, hm) {
  if (!stay?.callBy || !isHM(hm)) return '';
  const m = (x) => Number(x.slice(0, 2)) * 60 + Number(x.slice(3, 5));
  const left = m(stay.callBy) - m(hm);
  return left < 0 ? 'past' : left <= 30 ? 'soon' : '';
}
