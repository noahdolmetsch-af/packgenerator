/**
 * TrainingPeaks-Plan (Noah 19.11.2026 «1a 2b 3a 4a 5b», Thread «Bauen: TrainingPeaks-Plan und Zwift»): the
 * workouts planned in TrainingPeaks, read from its private calendar link (an ICS feed, Premium) and written into
 * the week plan (`training.plan`) as planned sessions with src 'tp'. Read-only: nothing goes back to TrainingPeaks.
 *
 * The link holds a private key. It lives only in the settings record TP_KEY, which is a DEVICE_SETTING (db.js):
 * it never goes into a backup and never into the automatic sync. Tests use made-up links. The browser cannot read
 * TrainingPeaks itself, so api/linkcheck.js (POST ?a=trainingpeaks) asks for the app. Pure functions here;
 * refresh() is the one that touches the net and the database.
 *
 * What a fetch does with the plan (the feed shows about 5 days back and 14 ahead, and changes up to 24 hours late):
 *  - sessions with src 'tp' inside that window are taken from the feed; a session the user changed, ticked or took
 *    out by hand is left as the user has it (TP_KEY remembers what the feed said last time, per session);
 *  - an entry without a duration is left out, never guessed; the card says how many. The exception is a free day
 *    («Recovery Day», Ruhetag …): it has no duration by nature, so it is not a session but a day the weekly plan
 *    keeps free (`rest` in the plan record, Noah 22.11.2026 «Recovery Day ja»).
 */
import { parseIcs } from './icsparse.js';
import { addDays } from './flow.js';
import { cleanSession, prunePlan, PLAN_KEY } from './training.js';

export const TP_KEY = 'trainingpeaks';
export const TP_SRC = 'tp';
export const TP_API = 'https://packgen-three.vercel.app/api/linkcheck?a=trainingpeaks'; // api/linkcheck.js (the free Vercel plan allows only 12 functions)
/** Opening the app fetches again after this many minutes at the earliest (the feed itself lags up to 24 hours). */
export const STALE_MIN = 60;
export const BACK_DAYS = 5;
export const AHEAD_DAYS = 14;
const MAX_SEEN = 120;

/**
 * The link as it must look: https://(www.)trainingpeaks.com/ical/<key>.ics (the same rule as the server) → text or ''.
 * TrainingPeaks shows it as webcal://…: that is the same address, read as https:// (the server only gets https).
 */
export function cleanLink(raw) {
  let u;
  try {
    u = new URL(String(raw ?? '').trim().replace(/^webcal:\/\//i, 'https://'));
  } catch {
    return '';
  }
  if (u.protocol !== 'https:' || u.username || u.password || u.port) return '';
  if (!/^(www\.)?trainingpeaks\.com$/i.test(u.hostname)) return '';
  if (!/^\/ical\/[\w-]{3,128}\.ics$/i.test(u.pathname)) return '';
  if (u.search.length > 200) return '';
  return u.href;
}

/** The link for the screen: the key hidden, so a screenshot or a look over the shoulder shows nothing. */
export const maskLink = (url) => (cleanLink(url) ? 'https://www.trainingpeaks.com/ical/••••••••.ics' : '');

const isDay = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

/** The record in settings → { url, on, fetchedAt, error, found, skipped, rest, seen } ; url '' when there is no valid link. */
export function prefsOf(v) {
  const o = v && typeof v === 'object' ? v : {};
  const seen = {};
  if (o.seen && typeof o.seen === 'object') for (const [k, sig] of Object.entries(o.seen).slice(0, MAX_SEEN)) if (/^tp-[\w]{1,12}$/.test(k) && typeof sig === 'string') seen[k] = sig.slice(0, 200);
  const n = (x) => (Number.isInteger(x) && x >= 0 && x < 10_000 ? x : 0);
  return { url: cleanLink(o.url), on: o.on !== false, fetchedAt: typeof o.fetchedAt === 'string' ? o.fetchedAt : null, error: typeof o.error === 'string' ? o.error : '', found: n(o.found), skipped: n(o.skipped), rest: n(o.rest), seen };
}

/* ----- one entry of the feed → one planned session ----- */

const has = (title, words) => new RegExp(`(^|[^a-zäöüß])(${words})`, 'i').test(title);
/** The kind from the title: bike, run, hike, else other (swim, strength …: the name says what it is). */
export function kindOf(title) {
  const s = String(title ?? '');
  if (has(s, 'bike|biking|ride|cycl|velo|rad($|[^a-zäöüß])|rennrad|radfahren|zwift|spin|mtb|gravel|trainer')) return 'bike';
  if (has(s, 'run|jog|lauf|läuf')) return 'run';
  if (has(s, 'hik|wander|walk|spazier')) return 'hike';
  return 'other';
}

/** A zone only when the text names exactly one clearly («Z2», «Zone 3»); else null. */
export function zoneOf(...texts) {
  const found = new Set();
  for (const m of texts.join(' \n ').matchAll(/(?:^|[^a-z0-9])(?:zone|zona|z)\s?([1-5])(?![0-9])(?!\s?[-–]\s?[1-5])/gi)) found.add(Number(m[1]));
  return found.size === 1 ? [...found][0] : null;
}

const dayDiff = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 864e5);
const hm = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));

/** Minutes from start and end of a timed entry, else from the description («Duration: 1:30», «90 min», «1h 30m»); null when neither says. */
export function minutesOf(e) {
  if (!e.allDay && e.from && e.to) {
    const m = dayDiff(e.day, e.lastDay) * 1440 + hm(e.to) - hm(e.from);
    if (m > 0 && m <= 1440) return m;
  }
  const note = String(e.note ?? '');
  let m = note.match(/(?:duration|dauer|planned (?:time|duration)|total time(?: planned)?|geplante (?:zeit|dauer))\D{0,20}(\d{1,2}):(\d{2})(?::\d{2})?/i);
  if (m) return Number(m[1]) * 60 + Number(m[2]) || null;
  m = note.match(/(\d{1,2})\s*h(?:ours?|rs?|r)?\s*(?:(\d{1,2})\s*m(?:in(?:ute)?s?)?)?(?![a-z])/i);
  if (m) return Number(m[1]) * 60 + Number(m[2] ?? 0) || null;
  m = note.match(/(\d{1,3})\s*(?:min|minutes|minuten)\b/i);
  if (m) return Number(m[1]) || null;
  return null;
}

/** A short stable id from what TrainingPeaks calls the entry (its id, else day and title). */
export function idOf(e) {
  let h = 5381;
  for (const c of String(e.uid || `${e.day}|${e.title}`)) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0;
  return `tp-${h.toString(36)}`;
}

/** What identifies a session's content for «did the user change it?». */
export const sigOf = (s) => `${s.day}|${s.kind}|${s.name}|${s.mins}|${s.zone ?? ''}`;

/** A free day in the feed: «Recovery Day», «Rest day», «Ruhetag», «Erholungstag», «Day off». Only counts without a duration. */
export const REST_RE = /(^|[^a-zäöüß])(recovery day|rest day|day off|off day|ruhetag|erholungstag|regenerationstag|freier tag)($|[^a-zäöüß])/i;

/** The feed → { sessions, rest, skipped, from, to } (sessions as the plan keeps them; rest = days TrainingPeaks keeps free; skipped = entries without a duration that are no free day). */
export function sessionsFrom(ics, today) {
  const entries = parseIcs(ics);
  const sessions = [];
  let skipped = 0;
  const seen = new Set();
  const rest = new Set();
  for (const e of entries) {
    const mins = minutesOf(e);
    if (!mins && REST_RE.test(String(e.title ?? '')) && /^\d{4}-\d{2}-\d{2}$/.test(e.day ?? '')) {
      rest.add(e.day);
      continue;
    }
    const zone = zoneOf(e.title, e.note);
    const s = mins ? cleanSession({ id: idOf(e), day: e.day, kind: kindOf(e.title), name: e.title, mins, zone, src: TP_SRC, time: e.allDay ? '' : e.from }) : null;
    if (!s) {
      skipped++;
      continue;
    }
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    sessions.push(s);
  }
  const days = entries.map((e) => e.day).sort();
  const from = days.length && days[0] < addDays(today, -BACK_DAYS) ? days[0] : addDays(today, -BACK_DAYS);
  const to = days.length && days[days.length - 1] > addDays(today, AHEAD_DAYS) ? days[days.length - 1] : addDays(today, AHEAD_DAYS);
  return { sessions: sessions.sort((a, b) => a.day.localeCompare(b.day)), rest: [...rest].sort(), skipped, from, to };
}

/**
 * The plan with the feed written in. → { plan, seen, added, changed, removed }.
 * plan: the sessions now; feed: sessionsFrom(); seen: { id: sig } of the last fetch (prefs.seen).
 */
export function mergeFeed(plan, feed, seen = {}) {
  const sig = (s) => sigOf(s);
  const inWindow = (s) => s.day >= feed.from && s.day <= feed.to;
  const byId = new Map(plan.map((s) => [s.id, s]));
  const userOwn = (s) => s.done === true || !seen[s.id] || seen[s.id] !== sig(s); // ticked, unknown or changed by hand: stays
  const out = [];
  let added = 0;
  let changed = 0;
  let removed = 0;
  const fed = new Map(feed.sessions.map((s) => [s.id, s]));
  for (const s of plan) {
    if (s.src !== TP_SRC || !inWindow(s)) {
      out.push(s);
      continue;
    }
    const f = fed.get(s.id);
    if (userOwn(s)) out.push(s);
    else if (!f) removed++;
    else {
      if (sig(f) !== sig(s)) changed++;
      out.push({ ...f });
    }
  }
  for (const f of feed.sessions) {
    if (byId.has(f.id)) continue;
    if (seen[f.id]) continue; // the user took it out by hand: it stays out
    out.push(f);
    added++;
  }
  const nextSeen = {};
  for (const f of feed.sessions) nextSeen[f.id] = sig(f);
  return { plan: out, seen: nextSeen, added, changed, removed };
}

/** Fetch again? Never when off or without a link, at most every STALE_MIN minutes unless forced. */
export function isStale(rec, now = Date.now(), force = false) {
  if (!rec?.on || !rec.url) return false;
  if (force || !rec.fetchedAt) return true;
  return now - Date.parse(rec.fetchedAt) >= STALE_MIN * 60_000;
}

/** Ask the server for the link and read its entries. → { ok, feed?, code? } (nothing is saved). */
export async function fetchFeed(url, { doFetch = (...a) => fetch(...a), today } = {}) {
  const link = cleanLink(url);
  if (!link) return { ok: false, code: 'no_link' };
  let res;
  try {
    res = await doFetch(TP_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: link }) });
  } catch {
    return { ok: false, code: 'network' };
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok || typeof body.ics !== 'string') return { ok: false, code: body?.code || 'server_error', status: Number.isInteger(body?.status) ? body.status : null };
  return { ok: true, feed: sessionsFrom(body.ics, today) };
}

/**
 * Fetch the feed when due (or forced) and write it into the plan. The old sessions stay when it fails; the reason
 * is kept for the card. The record and the plan are read again just before they are written.
 * db: the Dexie database (settings table). → { ok, code?, added, changed, removed, skipped, found } or { skipped: true } when not due.
 */
export async function refresh(db, { doFetch, now = Date.now(), force = false, today, url = null } = {}) {
  const rec = prefsOf((await db.settings.get(TP_KEY))?.value);
  const link = url ?? rec.url;
  if (!url && !isStale(rec, now, force)) return { ok: true, notDue: true };
  const r = await fetchFeed(link, { doFetch, today });
  const cur = prefsOf((await db.settings.get(TP_KEY))?.value);
  if (!r.ok) {
    if (cur.url) await db.settings.put({ key: TP_KEY, value: JSON.parse(JSON.stringify({ ...cur, error: r.code })) });
    return { ok: false, code: r.code, status: r.status ?? null };
  }
  return applyFeed(db, r.feed, { cur, link, now, today });
}

/** The feed written into the plan and the record (the old sessions stay as they are changed by hand). */
async function applyFeed(db, feed, { cur, link, now, today }) {
  const plan = (await db.settings.get(PLAN_KEY))?.value?.sessions ?? [];
  const m = mergeFeed(plan.map(cleanSession).filter(Boolean), feed, cur.seen);
  await db.settings.put({ key: PLAN_KEY, value: { sessions: prunePlan(m.plan, today), ...(feed.rest?.length ? { rest: feed.rest } : {}) } });
  await db.settings.put({ key: TP_KEY, value: JSON.parse(JSON.stringify({ ...cur, url: link, on: cur.on, fetchedAt: new Date(now).toISOString(), error: '', found: feed.sessions.length, skipped: feed.skipped, rest: feed.rest?.length ?? 0, seen: m.seen })) });
  return { ok: true, added: m.added, changed: m.changed, removed: m.removed, skipped: feed.skipped, found: feed.sessions.length, rest: feed.rest?.length ?? 0 };
}

/**
 * The way out when the server cannot read the link (Noah 21.11.2026): the calendar file (.ics) loaded by hand in
 * TrainingPeaks and read here. The same rules as the link, once; nothing is fetched again. → like refresh(), or
 * { ok: false, code: 'not_calendar' } when the text is no calendar.
 */
export async function importIcs(db, ics, { now = Date.now(), today } = {}) {
  const text = String(ics ?? '');
  if (!/BEGIN:VCALENDAR/i.test(text)) return { ok: false, code: 'not_calendar' };
  const cur = prefsOf((await db.settings.get(TP_KEY))?.value);
  return applyFeed(db, sessionsFrom(text, today), { cur, link: cur.url, now, today });
}

/** The link taken out: its not yet done sessions from today on go too. → { plan }. */
export const withoutFeed = (plan, today) => plan.filter((s) => !(s.src === TP_SRC && s.day >= today && s.done !== true));
