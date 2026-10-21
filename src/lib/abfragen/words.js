/**
 * AB «Deine Abfragen»: the words of a question for the pages (its text, area, interval, answer kind,
 * source and an answer as text). The texts of the list go through t(); an own question keeps its own words.
 */
import { t, tn, locale, lang } from '../i18n.svelte.js';
import { AREA, OWN_AREA, QUESTION, everyOf, timesOf, dayOf, areaLabel } from '../abfragen.js';
import { stravaName } from '../stravanames.js';

/** The text of a question (an own one and a changed one as written). */
export const qText = (q) => (q?.own || q?.edited ? q.text : q ? t(q.text) : '');
/** A history row's question text: the question, the old pool question of the daily check, or its key. */
export function rowText(row, own = []) {
  if (row.kind === 'ride') return stravaName(row.ride?.name) || t('Ride from Strava');
  // own: the questions as the person has them (allQuestions: changed texts, own ones), else the list
  const q = own.find((x) => x.id === row.qid) ?? QUESTION[row.qid];
  if (q) return qText(q);
  if (row.label) return lang.v === 'de' && row.label.textDe ? row.label.textDe : row.label.text;
  return row.qid;
}
/** A group's name; with the settings (cfg) also a renamed or own group. */
export const areaName = (key, cfg = null) => (cfg ? areaLabel(cfg, key, t) : key === OWN_AREA ? t('Own|questions') : AREA[key] ? t(AREA[key].name) : '');

/** '08:00' → '8:00'. */
export const hm = (s) => String(s ?? '').replace(/^0(\d):/, '$1:');
/** The weekday's short name in the language of the app (0 = Sunday). */
export const dayName = (dow) => new Date(Date.UTC(2026, 9, 4 + dow)).toLocaleDateString(locale(), { weekday: 'short', timeZone: 'UTC' });

/** «3× täglich · 8:00, 13:00, 20:00», «täglich · 7:00», «wöchentlich · So. 19:00», «monatlich · 1. · 19:00», «aus». */
export function everyText(every) {
  const e = everyOf(every);
  if (e.kind === 'times') return `${t('{n}× daily', { n: e.times.length })} · ${e.times.map(hm).join(', ')}`;
  if (e.kind === 'daily') return `${t('daily')} · ${hm(e.time)}`;
  if (e.kind === 'weekly') return `${t('weekly')} · ${dayName(e.dow)} ${hm(e.time)}`;
  if (e.kind === 'monthly') return `${t('monthly · on the 1st')} · ${hm(e.time)}`;
  return t('off|question');
}
/** Short: «3× täglich», «täglich», «wöchentlich» (the card on Heute). */
export function everyShort(every) {
  const e = everyOf(every);
  if (e.kind === 'off') return t('off|question');
  return e.kind === 'times' ? t('{n}× daily', { n: timesOf(e).length }) : t(e.kind === 'daily' ? 'daily' : e.kind === 'weekly' ? 'weekly' : 'monthly');
}

/** The small tag of the answer kind (AB5): 1–10, Chips, ja / nein, Zahl, Satz. */
export function kindLabel(form) {
  if (form.kind === 'scale') return '1–10';
  if (form.kind === 'chips') return t('Chips');
  if (form.kind === 'yesno') return t('yes / no');
  if (form.kind === 'number') return t('Number');
  return t('Sentence');
}
/** The unit as a word (cups → Tassen); an own unit as written. */
export const unitText = (u) => (!u ? '' : ['cups', 'bpm', 'min', 'h', 'km', 'kg'].includes(u) ? t(`${u}|unit`) : u);
/** The quiet extra next to the kind: «als Batterie», the unit, the chips, «+ 1 Satz». */
export function kindExtra(form) {
  const bits = [];
  if (form.style === 'battery') bits.push(t('as a battery'));
  if (form.kind === 'number' && form.unit) bits.push(unitText(form.unit));
  if ((form.kind === 'chips' || form.kind === 'yesno') && form.style !== 'emoji') bits.push(form.options.map((o) => optText(o)).join(' · '));
  if (form.style === 'emoji') bits.push(form.options.map((o) => o.label).join(' '));
  if (form.note) bits.push(t('+ 1 sentence'));
  return bits.join(' · ');
}
/** A chip's word (numbers and emoji stay as they are). */
export const optText = (o) => (/^[\d–\s]+$/.test(o.label) || /\p{Extended_Pictographic}/u.test(o.label) ? o.label : t(o.label));

const SRC = { hand: 'by hand', later: 'Fitbit · later', open: 'not checked yet · by hand until then', only: 'only by hand possible', app: 'App', fitbit: 'Fitbit', strava: 'Strava' };
export const srcText = (k) => t(SRC[k] ?? k);

/** An answer as text (AB4): «7», «72.0 kg», «Sonne · Wind», «ja», a sentence. */
export function valueText(row, q) {
  if (row.kind === 'ride') return row.value != null ? `${Number(row.value).toFixed(0)} km` : '–';
  const v = row.value;
  if (v == null) return row.note ? '' : '–';
  const form = q?.form ?? { kind: row.kind };
  if (form.kind === 'number') return `${String(v)}${row.unit || form.unit ? ` ${unitText(row.unit || form.unit)}` : ''}`;
  if (form.kind === 'chips' || form.kind === 'yesno') {
    const keys = Array.isArray(v) ? v : [v];
    return keys.map((k) => form.options?.find((o) => o.key === k)).filter(Boolean).map(optText).join(' · ') || String(v);
  }
  return String(v);
}

/** «Freitag, 9. Okt.» of a day. */
export const dayLong = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' });
/** «Fr., 2. Okt.» of a day. */
export const dayShort = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
/** The time of a stamp, '' without one. */
export const timeText = (stamp) => (stamp ? hm(String(stamp).slice(11, 16)) : '');
export const isToday = (stamp, today) => dayOf(stamp) === today;
export { tn };
