/**
 * The words of the observations (sentence, chart labels, values), shared by the cards on the week review and
 * the detail page of one observation. Observation only: what was, never what is good.
 */
import { t, num, locale } from '../i18n.svelte.js';

const REF_MON = '2026-10-12';
export const wd = (i, weekday = 'short') => {
  const d = new Date(`${REF_MON}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + i);
  return d.toLocaleDateString(locale(), { timeZone: 'UTC', weekday });
};
export const hm = (min) => `${Math.floor(min / 60)}:${String(Math.round(min % 60)).padStart(2, '0')} h`;
const PART = { morning: 'Most of your rides start in the morning: {p} % of {n}.', midday: 'Most of your rides start around midday: {p} % of {n}.', afternoon: 'Most of your rides start in the afternoon: {p} % of {n}.', evening: 'Most of your rides start in the evening: {p} % of {n}.' };
export function sentence(o) {
  const v = o.vars ?? {};
  const a = num(v.a);
  const b = num(v.b);
  switch (o.key) {
    case 'week-hours-more': return t('This week {a} h on the move, {p} % more than your usual {b} h.', { a, b, p: v.p });
    case 'week-hours-less': return t('This week {a} h on the move, {p} % less than your usual {b} h.', { a, b, p: v.p });
    case 'week-km-more': return t('This week {a} km, {p} % more than your usual {b} km.', { a, b, p: v.p });
    case 'week-km-less': return t('This week {a} km, {p} % less than your usual {b} km.', { a, b, p: v.p });
    case 'week-days-more': return t('This week active on {a} days, usually on {b}.', { a, b });
    case 'week-days-less': return t('This week active on {a} days, usually on {b}.', { a, b });
    case 'sleep-min-more': return t('After a day on the bike you slept {d} min longer: {a} against {b} on the other nights.', { d: num(Math.round(v.diff)), a: hm(v.a), b: hm(v.b) });
    case 'sleep-min-less': return t('After a day on the bike you slept {d} min less: {a} against {b} on the other nights.', { d: num(Math.round(v.diff)), a: hm(v.a), b: hm(v.b) });
    case 'sleep-felt-more':
    case 'sleep-felt-less': return t('After a day on the bike you rated your sleep {a}, on the other nights {b} (1–10).', { a, b });
    case 'after-rhr-more':
    case 'after-rhr-less': return t('In the 1–3 days after a long tour your resting heart rate was {a}, on normal days {b} bpm ({n} long tours).', { a: num(Math.round(v.a)), b: num(Math.round(v.b)), n: v.n });
    case 'after-sleep-more':
    case 'after-sleep-less': return t('In the 1–3 days after a long tour you slept {a}, on normal days {b} ({n} long tours).', { a: hm(v.a), b: hm(v.b), n: v.n });
    case 'after-mood-more':
    case 'after-mood-less': return t('In the 1–3 days after a long tour your mood was {a}, on normal days {b} (1–10, {n} long tours).', { a, b, n: v.n });
    case 'time-day': return t('You ride most on {day}: {p} % of {n} rides.', { day: wd(v.i, 'long'), p: v.p, n: v.n });
    case 'time-part': return t(PART[v.part] ?? PART.morning, { p: v.p, n: v.n });
    case 'streak-run': return t('{n} active days in a row.', { n: v.n });
    case 'streak-gap': return t('{n} days in a row without activity; usually you are active on {u} days a week.', { n: v.n, u: num(v.u) });
    case 'mind-more':
    case 'mind-less': return t('On days with meditation your mood was {a}, without {b} (1–10).', { a, b });
    case 'body-rhr-more':
    case 'body-rhr-less': return t('Your resting heart rate this week was {a} bpm, usually {b} (the same days of the four weeks before).', { a, b });
    case 'body-hrv-more':
    case 'body-hrv-less': return t('Your HRV this week was {a} ms, usually {b} (the same days of the four weeks before).', { a, b });
    case 'body-steps-more':
    case 'body-steps-less': return t('You took {a} steps a day this week, usually {b} (the same days of the four weeks before).', { a: num(Math.round(v.a)), b: num(Math.round(v.b)) });
    case 'weather-dry':
    case 'weather-wet': return t('On dry days you were active on {a} % of the days, on rainy days on {b} % (12 weeks).', { a, b });
    default: return '';
  }
}
export const label = (l) => (l?.day != null ? wd(l.day) : l?.kw != null ? t('Wk {n}', { n: l.kw }) : l?.en ? t(l.en, l.vars) : '');
export function value(v, unit) {
  if (v == null) return '–';
  if (unit === 'min') return hm(v);
  if (unit === 'hours') return `${num(v)} h`;
  if (unit === 'km') return `${num(v)} km`;
  if (unit === 'bpm') return `${num(Math.round(v))}`;
  if (unit === 'ms') return `${num(Math.round(v))} ms`;
  if (unit === 'steps') return num(Math.round(v));
  if (unit === 'pct') return `${num(v)} %`;
  if (unit === 'minutes') return v > 1 ? `${num(v)} min` : v ? '✓' : '–';
  return num(v);
}
export const chartText = (c) => (c.type === 'two' ? [c.a, c.b] : c.bars).map((x) => `${label(x.l)}: ${value(x.v, c.unit)}`).join(', ');

