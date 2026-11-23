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
