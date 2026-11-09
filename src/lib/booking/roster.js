/**
 * Teilnehmerliste (Noah 05.11.2026 «5c», 09.11.2026 «ja»): for one offer, every coming time with people on it: who comes,
 * how many places are free, who waits, and the registration deadline (Anmeldeschluss) Noah wrote for the offer. The
 * deadline is a note for Noah and for the list; it lives in «booking.deadlines» ({ offerId: 'YYYY-MM-DD' }), on this
 * device and in the backup. The booking page does not close by itself (that would need the server). The names come from
 * the server while the page is open and are never stored here. Nothing is ever sent by the app. Pure functions except
 * the two settings helpers.
 */
import { db as appDb } from '../db.js';
import { holdsPlace, isOpenRequest } from './model.js';

export const DEADLINES_KEY = 'booking.deadlines';

const DAY = /^\d{4}-\d{2}-\d{2}$/;
/** { offerId: 'YYYY-MM-DD' }: only valid days, only text keys. */
export function deadlineSetting(value) {
  const out = {};
  if (value && typeof value === 'object' && !Array.isArray(value)) for (const [k, v] of Object.entries(value)) if (typeof v === 'string' && DAY.test(v)) out[k] = v;
  return out;
}
export async function loadDeadlines(db = appDb) {
  return deadlineSetting((await db.settings.get(DEADLINES_KEY))?.value);
}
/** Sets (or, with '', removes) the deadline of one offer; returns the new map. */
export async function saveDeadline(offerId, day, db = appDb) {
  const next = deadlineSetting((await db.settings.get(DEADLINES_KEY))?.value);
  if (DAY.test(day ?? '')) next[offerId] = day;
  else delete next[offerId];
  await db.settings.put({ key: DEADLINES_KEY, value: next });
  return next;
}

/** Whole calendar days from a to b (both 'YYYY-MM-DD'); no clock, no time zone. */
export const daysBetween = (a, b) => Math.round((Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10)) - Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10))) / 864e5);

/** {state: 'open' | 'today' | 'over', days} for a deadline seen from `today`; null without a deadline. */
export function deadlineState(day, today) {
  if (!day || !DAY.test(day)) return null;
  const n = daysBetween(today, day);
  return n > 0 ? { state: 'open', days: n } : n === 0 ? { state: 'today', days: 0 } : { state: 'over', days: -n };
}

/**
 * The rows of the list: every time of the offer that is still ahead (`now` is «YYYY-MM-DDTHH:MM») and has a person on
 * it or on its waiting list, by time. Open requests hold no place; they are only counted (`asking`).
 * → [{ slot, label, places, names, free, waiting, asking }]
 */
export function rosterOf(offer, bookings = [], waitlist = [], now = '') {
  const typeOf = (s) => (offer.types ?? []).find((x) => x.key === s.type) ?? offer.types?.[0] ?? { label: '', places: 1 };
  return (offer.slots ?? [])
    .filter((s) => s.at >= now)
    .map((s) => {
      const ty = typeOf(s);
      const mine = bookings.filter((b) => b.slot === s.id);
      const names = mine.filter(holdsPlace).map((b) => b.name);
      const waiting = waitlist.filter((w) => w.offer === offer.id && w.slot === s.id).map((w) => w.name);
      return { slot: s, label: ty.label, places: ty.places, names, free: Math.max(0, ty.places - names.length), waiting, asking: mine.filter(isOpenRequest).length };
    })
    .filter((r) => r.names.length || r.waiting.length)
    .sort((a, b) => a.slot.at.localeCompare(b.slot.at));
}

/**
 * The list as plain text for a message or a note: names only (no phone numbers or addresses, so it can go to a hall or a
 * second coach). tr: the translator (t); fmt: «Do. 12.11. · 17:00» from a time; fmtDay: the same for a day.
 */
export function rosterText({ title, deadline = '', rows = [] }, tr = (s) => s, fmt = (at) => at, fmtDay = (d) => d) {
  const lines = [tr('Participant list: {title}', { title })];
  if (deadline) lines.push(tr('Register by {day}', { day: fmtDay(deadline) }));
  for (const r of rows) {
    lines.push('', `${fmt(r.slot.at)} · ${tr('{n} of {m}', { n: r.names.length, m: r.places })}${r.free ? ` · ${tr('{n} free', { n: r.free })}` : ''}`);
    r.names.forEach((name, i) => lines.push(`${i + 1}. ${name}`));
    if (r.waiting.length) lines.push(`${tr('Waiting list')}: ${r.waiting.join(', ')}`);
  }
  return lines.join('\n');
}

/** Days of a deadline as words for the page: «3 days left», «today», «over since 2 days». */
export function deadlineWord({ state, days }, tr = (s) => s, trn = (n, one, many) => (n === 1 ? one : many).replace('{n}', n)) {
  if (state === 'today') return tr('Today is the last day');
  return state === 'open' ? trn(days, '{n} day left', '{n} days left') : trn(days, 'Over since {n} day', 'Over since {n} days');
}
