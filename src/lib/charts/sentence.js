import { t } from '../i18n.svelte.js';

/**
 * «Sätze über dem Diagramm» (Noah 21.11.2026 «2b»): up to three short sentences that say what stands out, by plain rules,
 * no guessing. bars: [{ label, v, none }] oldest first (v: a number, none: a text for a bar that is no real zero).
 * Under 6 real bars, or when nothing stands out, it returns nothing. fmt turns a value into text.
 */
export function sentencesOf(bars, fmt = String) {
  const real = bars.filter((b) => !b.none && Number.isFinite(b.v));
  if (real.length < 6) return [];
  const out = [];
  const max = real.reduce((m, b) => (b.v > m.v ? b : m), real[0]);
  if (max.v > 0) out.push(t('Most: {label} with {v}', { label: max.label, v: fmt(max.v) }));
  const last3 = real.slice(-3).map((b) => b.v);
  if (last3[0] < last3[1] && last3[1] < last3[2]) out.push(t('The last three bars are rising'));
  else if (last3[0] > last3[1] && last3[1] > last3[2]) out.push(t('The last three bars are falling'));
  let run = 0;
  let best = 0;
  for (const b of real) {
    run = b.v === 0 ? run + 1 : 0;
    if (run > best) best = run;
  }
  if (best >= 2) out.push(t('Longest break: {n} bars in a row without anything', { n: best }));
  return out.slice(0, 3);
}

/**
 * «Eine Aussage pro Diagramm» (Noah 23.11.2026 «ja»): one neutral sentence over a line chart, by one rule: how the
 * newest value stands against the first real value of the period. points: [{ label, v }] oldest first (v: a number or null),
 * fmt writes a difference (an unsigned number with its unit). Under 4 real points, or a difference that fmt writes as
 * nothing, it returns nothing. Never a rating: «more» and «less», not «better» or «worse».
 */
export function changeSentence(points, fmt = String, { since = '' } = {}) {
  const real = points.filter((p) => Number.isFinite(p.v));
  if (real.length < 4) return [];
  const first = real[0];
  const last = real.at(-1);
  const d = last.v - first.v;
  const text = fmt(Math.abs(d));
  if (!d || !/[1-9]/.test(text)) return [t('Now {v}, the same as at the start', { v: fmt(last.v) })];
  const label = since || first.label;
  return [d > 0 ? t('Now {v}, {d} more than on {label}', { v: fmt(last.v), d: text, label }) : t('Now {v}, {d} less than on {label}', { v: fmt(last.v), d: text, label })];
}

/**
 * «Dein Normalbereich» (Noah 23.11.2026 «ja»): the middle half of your own values shown (25th to 75th percentile) as { from, to },
 * the band behind a line. Needs at least `min` real values and a band that is not a single value; otherwise null. Not a norm of
 * anybody else, not a rating: it only shows where your own values usually lie.
 */
export function usualBand(values, min = 10) {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (v.length < min) return null;
  const at = (p) => {
    const i = (v.length - 1) * p;
    const lo = Math.floor(i);
    return v[lo] + (v[Math.ceil(i)] - v[lo]) * (i - lo);
  };
  const from = at(0.25);
  const to = at(0.75);
  return to > from ? { from, to } : null;
}
