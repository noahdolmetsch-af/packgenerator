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
export const tripEat = (trip) => ({ on: trip?.eat?.on !== false, every: everyOf(trip?.eat?.every ?? EVERY_STD) });

/** The stored value made safe; null when off or over. */
export function eatOf(v, now = Date.now()) {
  if (!v || v.on !== true || !Number.isFinite(v.from)) return null;
  const until = Number.isFinite(v.until) && v.until > v.from ? v.until : v.from + MAX_H * 36e5;
  if (now > until) return null;
  return { on: true, every: everyOf(v.every), from: v.from, until, last: Number.isFinite(v.last) ? v.last : v.from, tripId: v.tripId ?? null, sound: v.sound !== false };
}

/** Start: from now, until the planned end of the day's riding (ms) or MAX_H. */
export function startEat({ every = EVERY_STD, now = Date.now(), until = null, tripId = null, sound = true } = {}) {
  const end = Number.isFinite(until) && until > now + MIN ? until : now + MAX_H * 36e5;
  return { on: true, every: everyOf(every), from: now, until: end, last: now, tripId, sound: sound !== false };
}

/** The next time to eat (ms), or null when nothing comes before the end. */
export function nextEat(e) {
  if (!e) return null;
  const at = e.last + e.every * MIN;
  return at <= e.until ? at : null;
}

/** «Gegessen»: the next one is a whole interval away. */
export const eaten = (e, now = Date.now()) => ({ ...e, last: now });
/** «In 10 Minuten»: the next one in SNOOZE_MIN minutes. */
export const snooze = (e, now = Date.now()) => ({ ...e, last: now - (e.every - SNOOZE_MIN) * MIN });

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
  for (let at = e.last + e.every * MIN; at <= e.until && out.length < MAX_PUSH; at += e.every * MIN) if (at > now) out.push({ key: `eat:${e.from}:${at}`, at, title: texts.title, body: texts.body, url: '#/ride' });
  return out;
}
