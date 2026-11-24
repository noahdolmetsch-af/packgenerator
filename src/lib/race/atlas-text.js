/**
 * «Rennatlas»: the words and small shapes the three views share (status text, date tile, days, facts).
 * The texts of the file (names, places, ground) are shown as typed; only the app's own words go through t().
 */
import { t, tn, locale, num } from '../i18n.svelte.js';

const KIND_TEXT = {
  mine: () => t('Registered|race'),
  open: () => t('Registration open'),
  soon: () => t('Registration opens'),
  later: () => t('Not open yet'),
  wait: () => t('Waiting list only'),
  shut: () => t('Closed'),
  none: () => t('No formal registration'),
  unk: () => t('Nothing confirmed'),
};
/** The status of a race as words: { text, tone } with tone ok, soon, unk, shut. */
export function statusText(st) {
  if (st.kind === 'unk' && st.text) return { text: st.text, tone: 'unk' };
  const base = KIND_TEXT[st.kind]();
  if (st.kind === 'soon' && st.days != null) return { text: tn(st.days, 'Registration opens · in {n} day', 'Registration opens · in {n} days'), tone: 'soon' };
  const tone = { mine: 'ok', open: 'ok', soon: 'soon', later: 'soon', wait: 'soon', shut: 'shut' }[st.kind] ?? 'unk';
  return { text: base, tone };
}

const dayDate = (d) => new Date(`${d}T12:00:00`);
/** The date tile: { m: 'APR', d: 15 }, a race without a day gets a dash. */
export const tileOf = (d) => (d ? { m: dayDate(d).toLocaleDateString(locale(), { month: 'short' }).replace('.', ''), d: Number(d.slice(8, 10)) } : { m: '', d: '–' });
/** «12.6.» */
export const shortDay = (d) => (d ? `${Number(d.slice(8, 10))}.${Number(d.slice(5, 7))}.` : '');
/** «10.–16.1.» (one month) or «28.5.–2.6.». */
export const spanDay = (a, b) => (a.slice(5, 7) === b.slice(5, 7) ? `${Number(a.slice(8))}.–${shortDay(b)}` : `${shortDay(a)}–${shortDay(b)}`);
export const longDay = (d) => (d ? dayDate(d).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' }) : '');

/** «3–6 days» from the file's own text («2–3», «4 Tage», 3). */
export function daysLabel(r) {
  const x = String(r.daysText ?? '').trim();
  if (/^\d+$/.test(x)) return tn(Number(x), '{n} day', '{n} days');
  if (/^[\d–-]+$/.test(x)) return t('{n} days', { n: x });
  return x;
}
/** The line under the title: «Bra-Bandito, Italien · 3–4 days». */
export const placeLine = (r) => [[r.city, r.land].filter(Boolean).join(', '), daysLabel(r)].filter(Boolean).join(' · ');
export const kmText = (r) => (r.km ? `${num(r.km)} km` : '');
export const hmText = (r) => (r.hm ? `${num(r.hm)} ${t('m up|race')}` : t('Climb unknown|race'));

/** Download a text file (calendar): a link made for the moment. */
export function download(name, text, type = 'text/calendar') {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
