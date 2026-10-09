/**
 * v0.49.0 R1: how the Rückblick pages write their numbers. Unknown is a calm «–», never 0 or NaN.
 */
import { t, num, locale } from '../i18n.svelte.js';
import { hm } from '../gpx.js';
import { formatWeight } from '../gear.js';

export const DASH = '–';
const known = (v) => typeof v === 'number' && Number.isFinite(v);

/** 42 / 1’800 / –. */
export const n0 = (v) => (known(v) ? num(Math.round(v)) : DASH);
/** 14,2 / –. */
export const n1 = (v) => (known(v) ? Number(v).toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : DASH);
/** 2:58 / –. */
export const hours = (v) => (known(v) && v > 0 ? hm(v) : DASH);
/** 4–15° / –. */
export const temps = (a, b) => (known(a) && known(b) ? `${a}–${b}°` : known(a) ? `${a}°` : known(b) ? `${b}°` : DASH);
/** 6,8 kg / –. */
export const kg = (g) => (known(g) && g > 0 ? `${(g / 1000).toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg` : DASH);
export const grams = (g) => (known(g) ? formatWeight(g) : DASH);

const d = (iso, opts) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), opts);
const thisYear = () => String(new Date().getFullYear());

/** «Di 6. Okt.» for one day, «26.–27. Sept.» for several (the year only when it is another one). */
export function dates(start, end = start) {
  if (!start) return DASH;
  const y = start.slice(0, 4) !== thisYear() ? { year: 'numeric' } : {};
  if (end && end !== start) {
    const sameMonth = start.slice(5, 7) === end.slice(5, 7);
    return `${d(start, { day: 'numeric', ...(sameMonth ? {} : { month: 'short' }) })}–${d(end, { day: 'numeric', month: 'short', ...y })}`;
  }
  return d(start, { weekday: 'short', day: 'numeric', month: 'short', ...y });
}
/** «Okt.» of a month key 2026-10. */
export const monthShort = (ym) => d(`${ym}-15`, { month: 'short' });
export const monthLong = (ym) => d(`${ym}-15`, { month: 'long', year: 'numeric' });
/** «10. Okt. 2025». */
export const dayLong = (iso) => (iso ? d(iso, { day: 'numeric', month: 'short', year: 'numeric' }) : DASH);

/** The words of a row's weather: «trocken», «Regen», «Regen Tag 2», «–». */
export function rainText(rain, days = 1) {
  if (!rain || rain.wet == null) return DASH;
  if (!rain.wet) return t('dry|weather');
  if (days > 1 && rain.days?.length === 1) return t('Rain day {n}', { n: rain.days[0] });
  if (days > 1 && rain.days?.length > 1) return t('Rain on {n} days', { n: rain.days.length });
  return t('Rain|weather');
}

/** A signed difference «+3», «−0,4», with a unit. */
export const signedNum = (v, f = n0) => (known(v) ? `${v > 0 ? '+' : v < 0 ? '−' : '±'}${f(Math.abs(v))}` : DASH);
export const signedHours = (v) => (known(v) ? `${v > 0 ? '+' : v < 0 ? '−' : '±'}${hm(Math.abs(v))}` : DASH);
