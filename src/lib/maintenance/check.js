/**
 * BF7 «Wartungs-Check» (Noah 13.10.2026): once a month (on opening the app when the last check is 30
 * days or more ago, or «Check now» under Ich › App maintenance) the app looks at
 *   (a) the Strava connection (the status call of the Strava page),
 *   (b) the keys that end on a date (settings.js; due from KEY_DAYS days before),
 *   (c) the outside addresses (links.js, through api/linkcheck.js).
 * The result lives on this device (db.meta CHECK_KEY, never exported). Offline or without an answer a
 * part says «not checked», never an error. What needs attention (and a Strava limit from 80 %, rate.js)
 * (never the keys: those show only in Ich › App maintenance, Noah 20.10.2026)
 * becomes one calm line on Today, until closed (HINT_CLOSED_KEY remembers what was closed).
 */
import { rateHot } from './rate.js';

export const CHECK_KEY = 'maint.check';
export const HINT_CLOSED_KEY = 'maint.hintClosed';
export const EVERY_DAYS = 30;
export const KEY_DAYS = 30;

/** Whole calendar days from a to b (YYYY-MM-DD), counted on the dates (never «now + n × 24 h»). */
export function daysBetween(a, b) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 864e5);
}

/** The monthly check is due: never done, or EVERY_DAYS days or more ago. */
export function checkDue(lastDay, today) {
  return !lastDay || daysBetween(lastDay, today) >= EVERY_DAYS;
}

/** The keys with the days left; due from KEY_DAYS days before the end (and after it). */
export function keyRows(keys = [], today) {
  return keys.map((k) => {
    const days = daysBetween(today, k.until);
    return { ...k, days, due: days <= KEY_DAYS };
  });
}

/** The links of a check: { checked, ok, broken: [names] } (checked 0: not checked). */
export function linkSummary(links = []) {
  const done = links.filter((l) => l.ok != null);
  return { checked: done.length, all: links.length, ok: done.filter((l) => l.ok).length, broken: done.filter((l) => !l.ok).map((l) => l.name) };
}

/**
 * What needs attention now: [{ kind: 'rate' | 'links' | 'strava', … }].
 * check: the stored check (null: none ran yet), rate: the stored Strava numbers.
 * Keys with an end date are not in it (Noah 20.10.2026 «nie im Front-End, höchstens unter Ich»): they
 * show only in Ich › App maintenance (MaintenanceCard), never on Today or in «Waiting for you».
 */
export function attention({ check = null, rate = null, now = new Date() }) {
  const out = [];
  const hot = rateHot(rate, now);
  if (hot) out.push({ kind: 'rate', pct: hot.pct, window: hot.key });
  if (check?.links) {
    const l = linkSummary(check.links);
    if (l.broken.length) out.push({ kind: 'links', names: l.broken });
  }
  if (check?.strava === 'attention') out.push({ kind: 'strava' });
  return out;
}

/** A short mark of what the line says, so a closed line comes back only when something new is due. */
export function signature(list = [], today = '') {
  return list.map((a) => (a.kind === 'rate' ? `rate:${today}` : a.kind === 'links' ? `links:${a.names.join('|')}` : a.kind)).join(';');
}

/**
 * One check. status(): 'ok' | 'off' (no Strava on this device) | 'attention' | null (not checked);
 * probe(url): { ok } or null (not checked). Never throws.
 */
export async function runCheck({ links, today, status, probe }) {
  let strava = null;
  try {
    strava = await status();
  } catch {
    strava = null;
  }
  const rows = await Promise.all(
    links.map(async (l) => {
      let r = null;
      try {
        r = await probe(l.url);
      } catch {
        r = null;
      }
      return { id: l.id, name: l.name, ok: r && typeof r.ok === 'boolean' ? r.ok : null };
    }),
  );
  return { day: today, strava, links: rows };
}

/** The one line on Today: each thing in a few words, joined by « · ». tr: { t, tn } of i18n. */
export function hintLine(list = [], { t, tn }) {
  const parts = list.map((a) => {
    if (a.kind === 'rate') return t('Strava requests: {pct} % of the free limit used', { pct: a.pct });
    if (a.kind === 'links') return tn(a.names.length, '{n} link does not answer', '{n} links do not answer');
    return t('Strava needs a new login');
  });
  return parts.join(' · ');
}
