/**
 * Paket K #286 «Ess-Erinnerung» (Noah 19.10.2026 «5a b möglich»): while riding, the app reminds you to
 * eat every 45 minutes (30, 45 or 60, or your own 10–180 minutes). With the app open: a sound, a vibration and a line
 * with «Gegessen» and «In 10 Minuten». With the app closed: a message on the phone (Web-Push, the kind
 * «Eat on the ride» in Erinnerungen aufs Handy, schedule.js). Never mandatory: off by default, one tap
 * stops it.
 *
 * Setting 'eatRemind' (db.settings, backup and sync like the other settings):
 * { on, every (minutes), from (ms, the start), until (ms, the planned end), last (ms, eaten or snoozed),
 *   tripId, sound (Paket X, Noah «2a»: a soft tone, false = no tone), hidden (the card hidden on all tours) }. Pure functions, tested in tests/unterwegs-essen.test.js.
 */
export const EAT_KEY = 'eatRemind';
export const EVERY = [30, 45, 60];
export const EVERY_STD = 45;
export const SNOOZE_MIN = 10;
/** Without a planned end the reminder runs this many hours at most. */
export const MAX_H = 12;
/** Messages handed to the server for a closed app, at most. */
export const MAX_PUSH = 24;

const MIN = 60000;
/** Your own interval (Noah 21.10.2026 «eigene dauer»): whole minutes from EVERY_MIN to EVERY_MAX. */
export const EVERY_MIN = 10;
export const EVERY_MAX = 180;
export const everyOf = (v) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= EVERY_MIN && n <= EVERY_MAX ? n : EVERY_STD;
};

/**
 * The plan of a tour (Noah 21.10.2026 «beim erstellen einer tour … ein und ausgeschaltet»): trip.eat
 * { on, every }. On unless switched off for this tour; the interval the card starts with.
 */
export const tripEat = (trip) => ({ on: trip?.eat?.on !== false, every: everyOf(trip?.eat?.every ?? EVERY_STD), ...(trip?.eat?.mode === 'stops' || trip?.eat?.mode === 'every' ? { mode: trip.eat.mode } : {}) });

/**
 * Idee 57 «Ess-Erinnerung beim Stopp» (Touren b, Noah 26.10.2026 «freigabe», answer a): mode 'stops' reminds at
 * the planned stops of Verpflegung (stops: [{ at, name?, km?, lat?, lon?, gap? }], times in ms); between two
 * stops more than GAP_MIN apart a hint comes every GAP_MIN (gap: true). Without stops it stays 'every'.
 */
export const GAP_MIN = 60;
const stopsOf = (list) =>
  (Array.isArray(list) ? list : [])
    .filter((x) => x && Number.isFinite(x.at))
    .map((x) => ({ at: x.at, ...(x.name ? { name: String(x.name) } : {}), ...(Number.isFinite(x.km) ? { km: x.km } : {}), ...(Number.isFinite(x.lat) && Number.isFinite(x.lon) ? { lat: x.lat, lon: x.lon } : {}), ...(x.gap ? { gap: true } : {}) }))
    .sort((a, b) => a.at - b.at);

/** The stored value made safe; null when off or over. */
export function eatOf(v, now = Date.now()) {
  if (!v || v.on !== true || !Number.isFinite(v.from)) return null;
  const until = Number.isFinite(v.until) && v.until > v.from ? v.until : v.from + MAX_H * 36e5;
  if (now > until) return null;
  const stops = stopsOf(v.stops);
  const mode = v.mode === 'stops' && stops.length ? 'stops' : 'every';
  return { on: true, every: everyOf(v.every), from: v.from, until, last: Number.isFinite(v.last) ? v.last : v.from, tripId: v.tripId ?? null, sound: v.sound !== false, ...(mode === 'stops' ? { mode, stops, ...(Number.isFinite(v.snoozeTo) ? { snoozeTo: v.snoozeTo } : {}) } : {}) };
}

/**
 * The reminders of one ride day from the planned stops (Verpflegung, trip.fuelStops: [{ km, name, day, h, lat?, lon? }],
 * h = hours after the start of that day's riding): the stops of `day` moved to the real start `startMs`, the ones
 * up to `until`, with a hint every GAP_MIN in a longer gap. → [{ at, name, km, lat?, lon?, gap? }]
 */
export function eatStops(fuelStops = [], { day = 0, startMs, until = Infinity, gapMin = GAP_MIN } = {}) {
  if (!Number.isFinite(startMs)) return [];
  const own = (Array.isArray(fuelStops) ? fuelStops : []).filter((x) => x && (x.day ?? 0) === day && Number.isFinite(x.h) && x.h > 0).sort((a, b) => a.h - b.h);
  const out = [];
  let prev = startMs;
  const gap = gapMin * MIN;
  for (const x of own) {
    const at = startMs + x.h * 36e5;
    if (at > until) break;
    for (let g = prev + gap; at - g > gap / 2; g += gap) out.push({ at: g, gap: true });
    out.push({ at, name: x.name ?? '', ...(Number.isFinite(x.km) ? { km: x.km } : {}), ...(Number.isFinite(x.lat) && Number.isFinite(x.lon) ? { lat: x.lat, lon: x.lon } : {}) });
    prev = at;
  }
  return out;
}

/** The planned stop (or hint) that comes next, or null (mode 'stops' only). */
export function nextStop(e) {
  if (e?.mode !== 'stops') return null;
  return e.stops.find((x) => x.at > e.last && x.at <= e.until) ?? null;
}

/** Start: from now, until the planned end of the day's riding (ms) or MAX_H. stops: eatStops() for mode 'stops'. */
export function startEat({ every = EVERY_STD, now = Date.now(), until = null, tripId = null, sound = true, mode = 'every', stops = null } = {}) {
  const end = Number.isFinite(until) && until > now + MIN ? until : now + MAX_H * 36e5;
  const list = stopsOf(stops);
  return { on: true, every: everyOf(every), from: now, until: end, last: now, tripId, sound: sound !== false, ...(mode === 'stops' && list.length ? { mode: 'stops', stops: list } : {}) };
}

/** The next time to eat (ms), or null when nothing comes before the end. */
export function nextEat(e) {
  if (!e) return null;
  if (e.mode === 'stops') {
    const s = nextStop(e)?.at ?? null;
    const z = Number.isFinite(e.snoozeTo) && e.snoozeTo > e.last ? e.snoozeTo : null;
    const at = s != null && z != null ? Math.min(s, z) : (s ?? z);
    return at != null && at <= e.until ? at : null;
  }
  const at = e.last + e.every * MIN;
  return at <= e.until ? at : null;
}

/** «Gegessen»: the next one is a whole interval away (mode 'stops': the next stop). */
export const eaten = (e, now = Date.now(), stop = null) => {
  const { snoozeTo: _, ...rest } = e;
  // at a stop reached early (live map, 500 m before), that stop counts as done too
  return { ...rest, last: Number.isFinite(stop?.at) ? Math.max(now, stop.at) : now };
};
/** «In 10 Minuten»: the next one in SNOOZE_MIN minutes. */
export const snooze = (e, now = Date.now()) => (e.mode === 'stops' ? { ...e, last: now, snoozeTo: now + SNOOZE_MIN * MIN } : { ...e, last: now - (e.every - SNOOZE_MIN) * MIN });

/** Is a reminder due now? */
export const isDue = (e, now = Date.now()) => {
  const n = nextEat(e);
  return n != null && now >= n;
};

/** Minutes until the next one (0 when due), or null. */
export function minutesLeft(e, now = Date.now()) {
  const n = nextEat(e);
  return n == null ? null : Math.max(0, Math.ceil((n - now) / MIN));
}

/**
 * The messages for a closed app (push/schedule.js): one every interval from the next one to the end.
 * texts: { title, body } (already in the app's language). → [{ key, at, title, body, url }]
 */
export function eatPushItems(v, texts, now = Date.now()) {
  const e = eatOf(v, now);
  if (!e) return [];
  const out = [];
  if (e.mode === 'stops') {
    for (const x of e.stops) if (x.at > now && x.at > e.last && x.at <= e.until && out.length < MAX_PUSH) out.push({ key: `eat:${e.from}:${x.at}`, at: x.at, title: texts.title, body: x.name && texts.stop ? texts.stop.replace('{name}', x.name) : texts.body, url: '#/ride' });
    return out;
  }
  for (let at = e.last + e.every * MIN; at <= e.until && out.length < MAX_PUSH; at += e.every * MIN) if (at > now) out.push({ key: `eat:${e.from}:${at}`, at, title: texts.title, body: texts.body, url: '#/ride' });
  return out;
}

/**
 * Idee 57: the planned stops of a Verpflegung plan, kept on the trip (trip.fuelStops) for the eat reminder:
 * every section's end that is a place, with its ride day and the hours after that day's start.
 * plan: fuel.js fuelPlan(); startMs: the start day at 00:00; startHour: the start time. → [{ km, name, day, h, lat?, lon? }]
 */
export function fuelStopsFor(plan, { startMs, startHour = 8 } = {}) {
  if (!plan?.sections?.length || !Number.isFinite(startMs)) return [];
  const out = [];
  for (const s of plan.sections) {
    const p = s.to;
    if (!p || !Number.isFinite(s.arriveMs)) continue;
    const day = Math.max(0, Math.floor((s.arriveMs - startMs) / 864e5));
    const h = Math.round(((s.arriveMs - (startMs + day * 864e5 + startHour * 36e5)) / 36e5) * 100) / 100;
    if (!(h > 0)) continue;
    out.push({ km: s.toKm, name: String(p.name ?? '').slice(0, 80), day, h, ...(Number.isFinite(p.lat) && Number.isFinite(p.lon) ? { lat: p.lat, lon: p.lon } : {}) });
  }
  return out;
}

/** Within this many metres of the next planned stop the reminder comes (live map with your place). */
export const NEAR_M = 500;
/** The next planned stop when `me` ({ lat, lon }) is within NEAR_M of it, else null. */
export function nearStop(e, me) {
  const s = nextStop(e);
  if (!s || s.gap || !Number.isFinite(s.lat) || !Number.isFinite(me?.lat) || !Number.isFinite(me?.lon)) return null;
  const dLat = (s.lat - me.lat) * 111320;
  const dLon = (s.lon - me.lon) * 111320 * Math.cos((me.lat * Math.PI) / 180);
  return Math.hypot(dLat, dLon) <= NEAR_M ? s : null;
}
