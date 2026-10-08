/**
 * AP29 (Noah, "Entwurf speichern" everywhere + "In Bearbeitung"): what is still unfinished and the
 * exact next step for each, and the quiet "Saved 2 min ago" line. Pure functions, not wired into
 * any page yet (tests/drafts.test.js).
 *
 * Everything in the app is already saved on every change (trips, debrief drafts, templates). What
 * is NOT saved today are the dialogs (New trip, Edit item): closed half-filled, the input is gone.
 * keepDialog / freshDialogs are the rules for keeping such a half-filled dialog as a draft.
 *
 * The states reuse the existing rules: isOver / toDebrief / nextTrip (debrief.js), packStatus
 * (readiness.js), Today's steps and their addresses (today.js STEP), hasBike (domains.js).
 * Labels are English keys for t(); a row's numbers come separately (state.done/total, state.day).
 */
import { isOver, tripEnd } from './debrief.js';
import { packStatus } from './readiness.js';
import { STEP, daysFrom, endedOn, FRESH_DAYS } from './today.js';
import { hasBike } from './domains.js';
import { localDay } from './localday.js';

/** A trip starting within this many days is urgent (Today's packing-day rule). */
export const PACK_DAYS = 2;
/** A template counts as "being edited" for this many hours after its last change. */
export const TEMPLATE_HOURS = 24;
/** A half-filled dialog is kept this many days, then forgotten. */
export const DIALOG_DAYS = 7;

/** The order of the list: lower comes first. */
const RANK = { ride: 0, soon: 1, freshDebrief: 2, dialog: 3, upcoming: 4, template: 5, oldDebrief: 6 };

const STATE = {
  plan: 'Planning',
  empty: 'Nothing on the list yet',
  packing: 'Packing {done}/{total}',
  ready: 'Ready check {done}/{total}',
  packed: 'Packed',
  ride: 'On the way · day {day}',
  debrief: 'Debrief open',
  debriefDraft: 'Debrief started',
  template: 'Template changed',
  dialog: 'New trip, not created yet',
};

const stamp = (...xs) => xs.find((x) => typeof x === 'string' && x) ?? null;
const ms = (iso) => (iso ? Date.parse(iso) : NaN);

/** The next step of a trip as { step, label, href, tripId } (the caller opens the trip first: nav.js openTrip). */
const nextOf = (step, trip) => ({ step, label: STEP[step].label, href: STEP[step].href(trip), tripId: trip.id });

/**
 * One trip's row, or null when nothing is open (skipped, debrief saved, or ended without a list).
 * debrief: the trip's debrief record or null.
 */
export function tripRow(trip, debrief = null, today = localDay()) {
  if (!trip || trip.skipped) return null;
  const base = { id: trip.id, title: trip.title ?? '', tripId: trip.id, bike: hasBike(trip) };
  if (isOver(trip, today)) {
    // toDebrief's rule (answer 1a): only trips packed in the app want a debrief.
    if (debrief?.status === 'done' || !trip.entries?.length) return null;
    const ended = endedOn(trip);
    const age = ended ? daysFrom(ended, today) : 0;
    const key = debrief?.status === 'draft' ? 'debriefDraft' : 'debrief';
    return {
      ...base,
      kind: 'debrief',
      state: { key, label: STATE[key] },
      next: nextOf('debrief', trip),
      updatedAt: stamp(debrief?.updatedAt, trip.updatedAt, trip.createdAt),
      date: ended,
      rank: age <= FRESH_DAYS ? RANK.freshDebrief : RANK.oldDebrief,
    };
  }
  const updatedAt = stamp(trip.updatedAt, trip.createdAt);
  const start = trip.startDate ?? null;
  // Under way: between the first and the last day.
  if (start && start <= today && tripEnd(trip) >= today) {
    const day = daysFrom(start, today) + 1;
    return { ...base, kind: 'trip', state: { key: 'ride', label: STATE.ride, day }, next: nextOf(base.bike ? 'ride' : 'trip', trip), updatedAt, date: start, rank: RANK.ride };
  }
  const days = start ? daysFrom(today, start) : null;
  const soon = days != null && days <= PACK_DAYS;
  const s = packStatus(trip);
  let state;
  let step;
  if (s.status === 'empty') (state = { key: 'empty', label: STATE.empty }), (step = 'plan');
  else if (s.status === 'done') (state = { key: 'packed', label: STATE.packed }), (step = base.bike ? 'ride' : 'trip');
  else if (s.packed < s.count) {
    // Nothing ticked yet and more than two days away: still planning (Today's rule).
    state = s.packed || soon ? { key: 'packing', label: STATE.packing, done: s.packed, total: s.count } : { key: 'plan', label: STATE.plan };
    step = soon || s.packed ? 'pack' : 'plan';
  } else (state = { key: 'ready', label: STATE.ready, done: s.ready, total: s.readyTotal }), (step = 'pack');
  return { ...base, kind: 'trip', state, next: nextOf(step, trip), updatedAt, date: start, days, rank: soon ? RANK.soon : RANK.upcoming };
}

/** A template changed within TEMPLATE_HOURS (TemplateEdit saves every change), or null. */
export function templateRow(tpl, now = Date.now()) {
  const at = ms(tpl?.updatedAt);
  if (!tpl || Number.isNaN(at) || now - at > TEMPLATE_HOURS * 36e5) return null;
  return {
    id: tpl.id,
    kind: 'template',
    title: tpl.name ?? '',
    tripId: null,
    state: { key: 'template', label: STATE.template },
    next: { step: 'template', label: 'Edit', href: `#/pack/templates/${encodeURIComponent(tpl.id)}`, tripId: null },
    updatedAt: tpl.updatedAt,
    date: null,
    rank: RANK.template,
  };
}

/** A kept half-filled "New trip" dialog (see keepDialog), or null. */
export function dialogRow(d) {
  if (!d || d.kind !== 'newTrip') return null;
  return {
    id: d.id,
    kind: 'dialog',
    title: d.data?.title?.trim() ?? '',
    tripId: null,
    state: { key: 'dialog', label: STATE.dialog },
    next: { step: 'dialog', label: 'Continue', href: '#/pack', tripId: null, resume: d.id },
    updatedAt: d.savedAt ?? null,
    date: d.data?.startDate || null,
    rank: RANK.dialog,
  };
}

/**
 * Everything unfinished, most urgent first:
 * 1. a trip under way, 2. a trip within two days not ready, 3. a fresh debrief (ended ≤ 7 days),
 * 4. a half-filled New trip dialog, 5. the other upcoming trips (soonest first),
 * 6. templates changed in the last 24 h, 7. older open debriefs (newest first).
 * Inside a group: by date (soonest trip / newest debrief), then the latest change first.
 * Each row: { kind: 'trip'|'debrief'|'template'|'dialog', id, title, tripId, state: { key, label, done?, total?, day? },
 *   next: { step, label, href, tripId }, updatedAt, date, rank }.
 */
export function inProgress(trips = [], debriefs = [], templates = [], today = localDay(), { now = Date.now(), dialogs = [] } = {}) {
  const byTrip = Object.fromEntries(debriefs.map((d) => [d.tripId, d]));
  const rows = [
    ...trips.map((t) => tripRow(t, byTrip[t.id] ?? null, today)),
    ...templates.map((tp) => templateRow(tp, now)),
    ...freshDialogs(dialogs, now).map(dialogRow),
  ].filter(Boolean);
  const newerFirst = (a, b) => (ms(b.updatedAt) || 0) - (ms(a.updatedAt) || 0);
  return rows.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    if (a.date && b.date && a.date !== b.date) {
      // Trips: the soonest first; debriefs: the newest end first.
      const later = a.kind === 'debrief' ? -1 : 1;
      return a.date < b.date ? -later : later;
    }
    return newerFirst(a, b) || (a.title ?? '').localeCompare(b.title ?? '');
  });
}

/**
 * The quiet line "Saved just now" / "Saved 2 min ago" / "Saved 3 h ago" / "Saved on {date}".
 * Returns { label, n?, date? } (label: an English key for t(), with its values), or null without a time.
 * A time a little in the future (another device's clock) counts as just now.
 */
export function savedLabel(updatedAt, now = Date.now()) {
  const at = ms(updatedAt);
  if (Number.isNaN(at)) return null;
  const s = Math.max(0, (now - at) / 1000);
  if (s < 60) return { label: 'Saved just now' };
  if (s < 3600) return { label: 'Saved {n} min ago', n: Math.floor(s / 60) };
  if (s < 24 * 3600) return { label: 'Saved {n} h ago', n: Math.floor(s / 3600) };
  return { label: 'Saved on {date}', date: localDay(new Date(at)) };
}

/**
 * A half-filled dialog worth keeping: { id, kind, data, savedAt }, or null when nothing was typed
 * (the data equals what the dialog started with) so an untouched dialog leaves nothing behind.
 * kind: 'newTrip' (TripDialog), 'newItem' (ItemDialog) …; data: plain fields only.
 */
export function keepDialog(kind, data, start = {}, now = new Date().toISOString()) {
  if (!data || sameData(data, start)) return null;
  return { id: `draft-${kind}`, kind, data: structuredClone(data), savedAt: now };
}

/** The kept dialogs younger than DIALOG_DAYS, newest first. */
export function freshDialogs(list = [], now = Date.now()) {
  return list
    .filter((d) => d && !Number.isNaN(ms(d.savedAt)) && now - ms(d.savedAt) <= DIALOG_DAYS * 864e5)
    .sort((a, b) => ms(b.savedAt) - ms(a.savedAt));
}

const norm = (v) => (typeof v === 'string' ? v.trim() : v ?? '');
/** Same fields typed in? Strings compare trimmed; missing and empty count as the same. */
function sameData(a, b) {
  const keys = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]);
  for (const k of keys) {
    const x = norm(a?.[k]);
    const y = norm(b?.[k]);
    if (typeof x === 'object' || typeof y === 'object' ? JSON.stringify(x) !== JSON.stringify(y) : String(x) !== String(y)) return false;
  }
  return true;
}
