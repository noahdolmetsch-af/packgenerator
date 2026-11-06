/**
 * Spielerplus-Kalender (Noah 06.11.2026 «1a 2a 3a 4a 5a», Thread «Planen: Kalender abonnieren und Training
 * anmelden»): the dates of the team app Spielerplus, read from its private calendar link (an ICS feed), shown in
 * «Woche planen», on Heute («Heute fällig») and on the page of the sport (Eishockey). Read-only: nothing goes
 * back to Spielerplus; «Anmelden» only opens the page of Spielerplus.
 *
 * The link holds a private key. It lives only in the settings record SP_KEY, which is a DEVICE_SETTING
 * (db.js): it never goes into a backup and never into the automatic sync (5a). Tests use made-up links.
 * The browser cannot read Spielerplus itself (other sites do not allow it), so api/linkcheck.js (POST ?a=spielerplus) asks for the
 * app (POST, only this kind of address). Pure functions here; refresh() is the one that touches the net.
 */
import { parseIcs } from './icsparse.js';
import { addDays } from './flow.js';

export const SP_KEY = 'spielerplus';
export const SP_API = 'https://packgen-three.vercel.app/api/linkcheck?a=spielerplus'; // api/linkcheck.js (the free Vercel plan allows only 12 functions)
/** The sport page (act id) the dates show on; changeable on the card. */
export const DEFAULT_ACT = 'hockey';
/** Opening the app fetches again after this many minutes at the earliest. */
export const STALE_MIN = 30;
export const AHEAD_DAYS = 90;
export const MAX_EVENTS = 200;

const KEY = /^[\w-]{3,64}$/;

/** The link as it must look: https://(www.)spielerplus.de/events/ics?t=…&u=… (the same rule as the server) → text or ''. */
export function cleanLink(raw) {
  let u;
  try {
    u = new URL(String(raw ?? '').trim());
  } catch {
    return '';
  }
  if (u.protocol !== 'https:' || u.username || u.password || u.port) return '';
  if (!/^(www\.)?spielerplus\.de$/i.test(u.hostname)) return '';
  if (u.pathname.replace(/\/+$/, '') !== '/events/ics') return '';
  if (!KEY.test(u.searchParams.get('t') ?? '') || !KEY.test(u.searchParams.get('u') ?? '')) return '';
  return u.href;
}

/** The link for the screen: the keys hidden, so a screenshot or a look over the shoulder shows nothing. */
export const maskLink = (url) => (cleanLink(url) ? 'https://www.spielerplus.de/events/ics?t=••••••&u=••••••' : '');

const isDay = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const isTime = (s) => typeof s === 'string' && /^\d{2}:\d{2}$/.test(s);

/** One date as the app keeps it. */
function cleanEvent(x) {
  if (!x || !isDay(x.day)) return null;
  const lastDay = isDay(x.lastDay) && x.lastDay >= x.day ? x.lastDay : x.day;
  const title = String(x.title ?? '').trim().slice(0, 120) || '…';
  return {
    id: String(x.id ?? `${x.day}|${title}`).slice(0, 120),
    title,
    day: x.day,
    lastDay,
    allDay: !!x.allDay || !isTime(x.from),
    from: isTime(x.from) ? x.from : null,
    to: isTime(x.to) ? x.to : null,
    where: String(x.where ?? '').trim().slice(0, 160),
    link: signupOk(x.link) ? String(x.link) : '',
  };
}

/** One calendar (one team): { id, name, url, on, act, events, fetchedAt, error }. The name is typed by the user (never through t()). */
export function cleanCal(c, i = 0) {
  const o = c && typeof c === 'object' ? c : {};
  const url = cleanLink(o.url);
  if (!url) return null;
  const id = String(o.id ?? `c${i + 1}`).replace(/[^\w-]/g, '').slice(0, 24) || `c${i + 1}`;
  return {
    id,
    name: String(o.name ?? '').trim().slice(0, 40),
    url,
    on: o.on !== false,
    act: typeof o.act === 'string' && o.act ? o.act : DEFAULT_ACT,
    events: (Array.isArray(o.events) ? o.events : []).map(cleanEvent).filter(Boolean).slice(0, MAX_EVENTS),
    fetchedAt: typeof o.fetchedAt === 'string' ? o.fetchedAt : null,
    error: typeof o.error === 'string' ? o.error : '',
  };
}

/** The record in settings → { cals: [calendar, …] } (at most 8; a calendar without a valid link is dropped). */
export function prefsOf(v) {
  const list = Array.isArray(v?.cals) ? v.cals : [];
  const seen = new Set();
  const cals = [];
  list.forEach((c, i) => {
    const x = cleanCal(c, i);
    if (x && !seen.has(x.id)) {
      seen.add(x.id);
      cals.push(x);
    }
  });
  return { cals: cals.slice(0, 8) };
}

/** A new id for a calendar that is added. */
export const newCalId = (cals) => {
  let n = cals.length + 1;
  while (cals.some((c) => c.id === `c${n}`)) n++;
  return `c${n}`;
};

/** The dates of all calendars that are on, each with its calendar: [{ …event, id: '<cal>:<id>', cal, calName, act }], in order. */
export function allEvents(prefs, { act = null } = {}) {
  const out = [];
  for (const c of prefs?.cals ?? []) {
    if (!c.on || (act && c.act !== act)) continue;
    for (const e of c.events) out.push({ ...e, id: `${c.id}:${e.id}`, cal: c.id, calName: c.name, act: c.act });
  }
  return out.sort((a, b) => a.day.localeCompare(b.day) || (a.from ?? '').localeCompare(b.from ?? ''));
}

/** The dates of a calendar file, from yesterday to AHEAD_DAYS ahead (older and far dates are left out). */
export function eventsFrom(ics, today) {
  const from = addDays(today, -1);
  const to = addDays(today, AHEAD_DAYS);
  return parseIcs(ics)
    .filter((e) => e.lastDay >= from && e.day <= to)
    .map((e) => cleanEvent({ ...e, id: e.uid || `${e.day}|${e.title}` }))
    .filter(Boolean)
    .sort((a, b) => a.day.localeCompare(b.day) || (a.from ?? '').localeCompare(b.from ?? ''))
    .slice(0, MAX_EVENTS);
}

/** An address of a date that is safe to open: https on spielerplus.de. */
export function signupOk(href) {
  try {
    const u = new URL(String(href ?? ''));
    return u.protocol === 'https:' && /^(www\.)?spielerplus\.de$/i.test(u.hostname) && !u.username && !u.password;
  } catch {
    return false;
  }
}

/** «Anmelden»: the page of the date when the file names one, else the calendar of that day. Never the private key link. */
export function signupHref(ev) {
  if (ev?.link && signupOk(ev.link) && !/\/events\/ics\b/.test(ev.link)) return ev.link;
  return `https://www.spielerplus.de/events/calendar?date=${isDay(ev?.day) ? ev.day : ''}`;
}

/** The dates that touch the days from..to (inclusive), in order. */
export const eventsBetween = (events, from, to) => (events ?? []).filter((e) => e.lastDay >= from && e.day <= to);

/** What lies ahead: dates from today on (today's only while they have not ended: a timed date until its start + 3 h is kept), at most n. */
export function upcoming(events, today, n = 5, nowHM = '00:00') {
  return (events ?? [])
    .filter((e) => e.lastDay > today || (e.lastDay === today && (e.allDay || !e.from || endsAfter(e, nowHM))))
    .slice(0, n);
}
const endsAfter = (e, hm) => (e.to ?? plusHours(e.from, 3)) >= hm;
function plusHours(hm, h) {
  const [a, b] = hm.split(':').map(Number);
  return `${String(Math.min(23, a + h)).padStart(2, '0')}:${String(b).padStart(2, '0')}`;
}

/** For «Heute fällig»: the dates of today → [{ key, kind: 'sp', name, time, href }]. */
export function dueToday(prefs, today) {
  return eventsBetween(allEvents(prefs), today, today).map((e) => ({ key: `sp:${e.id}`, kind: 'sp', name: e.title, time: e.day === today && e.from ? e.from : '', href: `#/flow/sport/act%3A${encodeURIComponent(e.act)}` }));
}

/** For «Woche planen»: the dates of the week of a Monday in the shape of the week's dates (src 'spielerplus'). */
export function spielerWeek(prefs, monday) {
  const all = allEvents(prefs);
  const out = [];
  for (let i = 0; i < 7; i++) {
    const day = addDays(monday, i);
    for (const e of eventsBetween(all, day, day)) out.push({ id: `${e.id}|${day}`, title: e.title, day, time: day === e.day && e.from ? e.from : '', src: 'spielerplus', name: e.calName, href: signupHref(e) });
  }
  return out;
}

/** Fetch again? Never when off, at most every STALE_MIN minutes unless forced. */
export function isStale(cal, now = Date.now(), force = false) {
  if (!cal?.on || !cal.url) return false;
  if (force || !cal.fetchedAt) return true;
  return now - Date.parse(cal.fetchedAt) >= STALE_MIN * 60_000;
}

/** Ask the server for one link and read its dates. → { ok, events? , code? } (nothing is saved). */
export async function fetchLink(url, { doFetch = (...a) => fetch(...a), today } = {}) {
  const link = cleanLink(url);
  if (!link) return { ok: false, code: 'no_link' };
  let res;
  try {
    res = await doFetch(SP_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: link }) });
  } catch {
    return { ok: false, code: 'network' };
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok || typeof body.ics !== 'string') return { ok: false, code: body?.code || 'server_error' };
  return { ok: true, events: eventsFrom(body.ics, today) };
}

/**
 * Fetch every calendar that is on and due (or all, forced) and keep the dates. The old dates stay when one
 * fails; the reason is kept on that calendar for the card. → { n: calendars fetched, failed: [id] }.
 * db: the Dexie database (settings table). The record is read again just before it is written.
 */
export async function refreshAll(db, { doFetch, now = Date.now(), force = false, today, only = null } = {}) {
  const prefs = prefsOf((await db.settings.get(SP_KEY))?.value);
  const due = prefs.cals.filter((c) => (!only || c.id === only) && isStale(c, now, force));
  const done = await Promise.all(due.map(async (c) => ({ id: c.id, r: await fetchLink(c.url, { doFetch, today }) })));
  if (!done.length) return { n: 0, failed: [] };
  const fresh = prefsOf((await db.settings.get(SP_KEY))?.value);
  const cals = fresh.cals.map((c) => {
    const d = done.find((x) => x.id === c.id);
    if (!d) return c;
    return d.r.ok ? { ...c, events: d.r.events, fetchedAt: new Date(now).toISOString(), error: '' } : { ...c, error: d.r.code };
  });
  await db.settings.put({ key: SP_KEY, value: JSON.parse(JSON.stringify({ cals })) });
  return { n: done.length, failed: done.filter((x) => !x.r.ok).map((x) => x.id) };
}
