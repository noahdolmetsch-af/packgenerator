/**
 * Hobby pages, package 1: the words of the tiles and milestones in the current language (names,
 * stages, numbers, days). The numbers come from flowms.js and flowtiles.js.
 */
import { t, tn, num, locale, lang } from '../../i18n.svelte.js';
import { actName } from '../ui.svelte.js';
import { STAGES } from '../../flowms.js';
import { dayShort } from '../words.js';
import { PLACES, MOODS, HELPED } from '../../flowmed.js';
import { clock } from '../../flowtimer.js';

/** The tile name: the playful name (a suggestion, renamable), else the activity's name. */
export const tileName = (a) => (a ? (lang.v === 'de' && a.nickDe ? a.nickDe : a.nick) || actName(a) : '');
/** A milestone's name. */
export const msName = (m) => t(m.name, m.vars);
/** «4th star · Depth» */
export const stageName = (k) => t(STAGES[Math.max(0, Math.min(6, k - 1))]);
export const starLine = (k) => t('Star {k} · {stage}', { k, stage: stageName(k) });
/** A value with its unit: «212 h», «45 min», «4'610». */
export function val(v, unit = '') {
  const n = Number(v) || 0;
  const s = Number.isInteger(n) ? num(n) : n.toLocaleString(locale(), { maximumFractionDigits: 1 });
  return unit === 'days' ? tn(n, '{n} day', '{n} days') : unit ? `${s} ${unit}` : s;
}
/** «today», «28 Sept». */
export const dayWord = (day, today) => (!day ? '' : day === today ? t('today') : dayShort(day));
/** «Sept.» for a day. */
export const monthWord = (day, month = 'short') => new Date(`${day}T00:00:00Z`).toLocaleDateString(locale(), { month, timeZone: 'UTC' });
/** Hobby pages 2: «Fr 9.10. · 07:10» for a saved time (Zurich on the device). */
export const whenShort = (at) => {
  if (!at) return '';
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return '';
  const day = d.toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'numeric' });
  const time = d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  return `${day} · ${time}`;
};
/** «07:02» */
export const timeShort = (ms) => new Date(ms).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
/** A template's name in the current language (the suggestions have a German name too). */
export const tplName = (x) => (x ? (lang.v === 'de' && x.nameDe ? x.nameDe : x.name) || t('Template') : '');
/** A kind of meditation: the built-in ones through t(), own ones as written. */
export const artName = (a) => (!a ? '' : a.own ? a.name : t(a.name));

/* ---------- hobby pages 3 «Nach dem Gong» (B3–B6) ---------- */
/** A session's place: the suggestions through t(), own ones as written. */
export const placeLabel = (id) => (!id ? '' : id.startsWith('own:') ? id.slice(4) : t(PLACES.find((p) => p.id === id)?.name ?? id));
export const moodLabel = (id) => (id.startsWith('own:') ? id.slice(4) : t(MOODS.find((m) => m.id === id)?.name ?? id));
export const helpedLabel = (id) => (id.startsWith('own:') ? id.slice(4) : t(HELPED.find((m) => m.id === id)?.name ?? id));
/** «Sa 10.10. · 06:52 bis 07:37» */
export function sessionWhen(s) {
  if (!s?.at) return s?.day ? dayShort(s.day) : '';
  const head = whenShort(s.at);
  return s.endAt ? t('{from} to {to}', { from: head, to: timeShort(Date.parse(s.endAt)) }) : head;
}
/** «3:00 · 10:00 · 18:30» for the marks of a session. */
export const marksLine = (marks = []) => marks.map((m) => clock(m.sec)).join(' · ');
