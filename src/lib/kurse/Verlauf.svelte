<script>
  /**
   * «Kursblick» (Noah 22.11.2026; Noah 23.11.2026 «das Diagramm muss besser werden, mit Mouseover für Werte entlang der
   * Kurve»): the line of a series, drawn with the one line chart of the app (charts/LineChart.svelte): a value axis with
   * round steps and grid lines, three dates under it, and the exact day and price where the mouse or a finger points
   * (tap and slide on the phone), «As table» for the same numbers. points: [[day, close], …]; the line is drawn from at
   * most 240 points (duenn() keeps the lowest and the highest of every stretch). The period shown is the period chosen.
   */
  import LineChart from '../charts/LineChart.svelte';
  import { t } from '../i18n.svelte.js';
  import { duenn } from './rechnen.js';
  import { zahl, tagKurz, tagText, tagMitte, vorzeichen } from './format.js';

  let { points = [], label = '', dec = 0, unit = '' } = $props();
  const draw = $derived(duenn(points, 240));
  const n = $derived(draw.length);
  const days = $derived(draw.map((p) => p[0]));
  const lo = $derived(n ? Math.min(...draw.map((p) => p[1])) : 0);
  const hi = $derived(n ? Math.max(...draw.map((p) => p[1])) : 0);
  const up = $derived(n > 1 && draw[n - 1][1] >= draw[0][1]);
  // the first, the middle and the last day stand under the line; a stretch over a year says month and year in the middle
  const long = $derived(n > 1 && Date.parse(`${days[n - 1]}T00:00:00Z`) - Date.parse(`${days[0]}T00:00:00Z`) > 400 * 864e5);
  const cols = $derived(
    draw.map((p, i) => ({
      key: p[0] + i,
      x: i === 0 ? tagKurz(p[0]) : i === n - 1 ? tagKurz(p[0]) : n > 8 && i === Math.floor((n - 1) / 2) ? tagMitte(p[0], long) : '',
    })),
  );
  const series = $derived([{ key: 'k', color: up ? 'var(--accent)' : 'var(--bad)', v: draw.map((p) => p[1]) }]);
  const text = (v) => `${zahl(v, dec)}${unit}`;
  const readout = (i) => {
    const p = draw[i];
    const pct = draw[0][1] ? ((p[1] / draw[0][1]) - 1) * 100 : 0;
    const items = [{ label: label || t('Price|kurs'), value: text(p[1]) }];
    if (i > 0) items.push({ label: t('Since {day}', { day: tagKurz(draw[0][0]) }), value: `${vorzeichen(pct, 1)} %` });
    return { title: tagText(p[0]), items };
  };
  const table = $derived({
    head: [t('Day|kurs'), label || t('Price|kurs')],
    rows: draw.map((p, i) => ({ key: p[0] + i, cells: [tagText(p[0]), text(p[1])] })).reverse(),
  });
</script>

{#if n >= 2}
  <figure class="verlauf" data-verlauf>
    <figcaption class="kv-sr">{t('{label}: from {a} {from} to {b} {to}, lowest {lo}, highest {hi}', { label, a: tagKurz(days[0]), from: zahl(draw[0][1], dec), b: tagKurz(days[n - 1]), to: zahl(draw[n - 1][1], dec), lo: zahl(lo, dec), hi: zahl(hi, dec) })}</figcaption>
    <LineChart id="kurs" {cols} {series} {readout} {table} {label} height={200} topText={(v) => zahl(v, dec)} hint={t('Point at the line, or touch it and slide, to read the day and the price.')} />
  </figure>
{/if}

<style>
  .verlauf {
    margin: 0;
  }
  .kv-sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
</style>
