/**
 * Paket M «Aus Touren lernen»: «Tour-Tagebuch von selbst» (Noah 19.10.2026 «1a», Frage 1 «1b»).
 * When the debrief of a trip is opened, a draft of a diary is written from what the app already knows:
 * the Strava rides of those days, uploaded rides, the weather, the notes on the way and what was new.
 * The draft is a suggestion: it can be changed, written again or left away.
 *
 * Stored in the debrief record (in backup and sync): d.diary = { text, at, edited }.
 * The photos of the trip stay on the device (lernen/fotos.js).
 */
import { t, tn, num, locale } from '../i18n.svelte.js';
import { tripEnd } from '../tripstate.js';
import { addDays } from '../phase.js';

/** settings record: { on } (the whole diary can be switched off). */
export const DIARY_KEY = 'tagebuch';

/** The days of a trip, first to last (YYYY-MM-DD). */
export function tripDays(trip) {
  if (!trip?.startDate) return [];
  const end = tripEnd(trip) ?? trip.startDate;
  const out = [];
  for (let d = trip.startDate; d <= end && out.length < 60; d = addDays(d, 1)) out.push(d);
  return out;
}

const KM = (n) => `${num(Math.round(n * 10) / 10)} km`;
const HM = (n) => `${num(Math.round(n))} m`;
function hoursText(s) {
  if (!Number.isFinite(s) || s <= 0) return '';
  const all = Math.round(s / 60);
  const h = Math.floor(all / 60);
  const m = all % 60;
  return h ? t('{h} h {m} min', { h, m: String(m).padStart(2, '0') }) : t('{m} min', { m });
}
const dayName = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' });

/**
 * What the app knows about each day of a trip.
 * activities: db.activities (Strava; { day, name, km, hm, movingS, kind }), rides: db.rides of this trip
 * ({ date, km, gainM, movingH? }), notes: tripNotes(...) ({ day (0-based), text, at }).
 */
export function diaryFacts({ trip, activities = [], rides = [], notes = [], evening = {} }) {
  const days = tripDays(trip);
  const fc = trip?.forecast?.days ?? [];
  return days.map((date, i) => {
    const acts = activities.filter((a) => a.day === date && (a.km > 0 || a.movingS > 0));
    const own = rides.filter((r) => r.date === date && !acts.length);
    const weather = fc.find((f) => f.date === date) ?? null;
    return {
      date,
      n: i + 1,
      acts: acts.map((a) => ({ name: a.name || '', km: a.km || 0, hm: a.hm ?? null, s: a.movingS || 0 })),
      rides: own.map((r) => ({ name: r.name || '', km: r.km || 0, hm: r.gainM ?? null, s: Number.isFinite(r.movingH) ? r.movingH * 3600 : 0 })),
      weather: weather ? { min: weather.min, max: weather.max, rainMm: weather.rainMm ?? 0 } : null,
      notes: notes.filter((n) => (n.day ?? 0) === i).map((n) => n.text).filter(Boolean),
      score: Number.isFinite(evening?.[date]) ? evening[date] : null, // #223: rated in the evening review
    };
  });
}

/** One line per ride: «84 km, 1'240 m up in 4 h 10 min (Strava «Morning ride»)». */
function rideLine(r, src) {
  const parts = [r.km ? KM(r.km) : '', r.hm ? t('{m} up', { m: HM(r.hm) }) : ''].filter(Boolean).join(', ');
  const time = hoursText(r.s);
  const what = [parts, time ? t('in {time}', { time }) : ''].filter(Boolean).join(' ');
  return r.name ? t('{what} ({src} «{name}»)', { what, src, name: r.name }) : what;
}

function weatherLine(w) {
  if (!w) return '';
  const temp = Number.isFinite(w.min) && Number.isFinite(w.max) ? t('{min} to {max} °C', { min: Math.round(w.min), max: Math.round(w.max) }) : '';
  const rain = w.rainMm >= 1 ? t('rain {mm} mm', { mm: num(Math.round(w.rainMm)) }) : t('dry|weather');
  return [temp, rain].filter(Boolean).join(', ');
}

/**
 * The draft text. facts: diaryFacts(...); neu: short lines of «Was war neu?» (strings, already in the
 * user's language); title: the trip's name; photos: how many photos are with the diary.
 */
export function diaryDraft({ trip, facts = [], neu = [], photos = 0 }) {
  const lines = [];
  const name = trip?.title || t('This trip');
  const total = facts.reduce((s, f) => s + [...f.acts, ...f.rides].reduce((a, r) => a + (r.km || 0), 0), 0);
  const up = facts.reduce((s, f) => s + [...f.acts, ...f.rides].reduce((a, r) => a + (r.hm || 0), 0), 0);
  const head = facts.length > 1 ? tn(facts.length, '{name}: {n} day', '{name}: {n} days', { name }) : name;
  lines.push(total > 0 ? `${head} · ${[KM(total), up > 0 ? t('{m} up', { m: HM(up) }) : ''].filter(Boolean).join(' · ')}` : head);
  for (const f of facts) {
    const body = [];
    for (const r of f.acts) body.push(rideLine(r, 'Strava'));
    for (const r of f.rides) body.push(rideLine(r, t('ride|upload')));
    const w = weatherLine(f.weather);
    if (w) body.push(t('Weather: {w}', { w }));
    for (const n of f.notes) body.push(t('Note: «{text}»', { text: n }));
    if (f.score != null) body.push(t('Rated in the evening: {n} of 10', { n: f.score }));
    if (!body.length) continue;
    const label = facts.length > 1 ? t('Day {n} · {date}', { n: f.n, date: dayName(f.date) }) : dayName(f.date);
    lines.push('', label, ...body.map((b) => `– ${b}`));
  }
  if (neu.length) lines.push('', t('New for you: {list}', { list: neu.join(', ') }));
  if (photos) lines.push('', tn(photos, '{n} photo is with it.', '{n} photos are with it.'));
  lines.push('', t('What stays with me:'), '');
  return lines.join('\n');
}

/** Whether the draft has anything beyond the title (else the page offers an empty diary). */
export const hasFacts = (facts) => facts.some((f) => f.acts.length || f.rides.length || f.weather || f.notes.length || f.score != null);

/** The diary to keep in the debrief: a new draft is only written when there is none yet. */
export function withDiary(debrief, text, now = new Date()) {
  if (debrief?.diary?.text) return debrief;
  return { ...debrief, diary: { text, at: now.toISOString(), edited: false } };
}
