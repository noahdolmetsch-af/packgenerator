<script>
  /**
   * «Kursblick» Vergleich (Bauplan K11): up to five lines on one chart, all at 100 on the same start day. Colour is never the
   * only mark: every line has its own dash, and the list under the chart names each line with its change. `ergebnis` is
   * the answer of aufHundert() (vergleich.js); `namen`: id → the name shown; `onweg(id)`: take a line out of the comparison.
   * Drawn with the line chart of the app (axis with round steps, grid, the day and the value of every line where the
   * mouse or a finger points, «As table»), Noah 23.11.2026.
   */
  import { X } from '@lucide/svelte';
  import LineChart from '../charts/LineChart.svelte';
  import { t } from '../i18n.svelte.js';
  import { raster } from './vergleich.js';
  import { zahl, vorzeichen, tagKurz, tagText, tagMitte } from './format.js';

  let { ergebnis, namen = {}, onweg = null } = $props();
  const STIL = [
    { farbe: 'var(--accent)', strich: '' },
    { farbe: 'var(--bad)', strich: '8 5' },
    { farbe: 'var(--warn)', strich: '2 5' },
    { farbe: 'var(--ink)', strich: '14 4 2 4' },
    { farbe: 'var(--ink-3)', strich: '4 3' },
  ];
  const nm = (id) => namen[id] ?? id;
  const r = $derived(raster(ergebnis.linien, 240));
  const n = $derived(r.days.length);
  const long = $derived(n > 1 && Date.parse(`${r.days[n - 1]}T00:00:00Z`) - Date.parse(`${r.days[0]}T00:00:00Z`) > 400 * 864e5);
  const cols = $derived(r.days.map((d, i) => ({ key: d, x: i === 0 || i === n - 1 ? tagKurz(d) : n > 8 && i === Math.floor((n - 1) / 2) ? tagMitte(d, long) : '' })));
  const series = $derived(ergebnis.linien.map((l, i) => ({ key: l.id, color: STIL[i % STIL.length].farbe, dash: STIL[i % STIL.length].strich, v: r.v[l.id] })));
  // two titles may carry the same name: the readout keys its rows by the label
  const unik = (id, k) => (ergebnis.linien.some((x, j) => j < k && nm(x.id) === nm(id)) ? `${nm(id)} (${k + 1})` : nm(id));
  const readout = (i) => ({
    title: tagText(r.days[i]),
    items: ergebnis.linien.map((l, k) => ({ label: unik(l.id, k), value: r.v[l.id][i] == null ? '–' : zahl(r.v[l.id][i], 1), color: STIL[k % STIL.length].farbe })),
  });
  const table = $derived({
    head: [t('Day|kurs'), ...ergebnis.linien.map((l) => nm(l.id))],
    rows: r.days.map((d, i) => ({ key: d, cells: [tagText(d), ...ergebnis.linien.map((l) => (r.v[l.id][i] == null ? '–' : zahl(r.v[l.id][i], 1)))] })).reverse(),
  });
</script>

<figure class="linien" data-vergleich>
  <figcaption class="kv-sr">{t('Comparison from {a} to {b}, all lines start at 100', { a: tagKurz(ergebnis.start), b: tagKurz(ergebnis.ende) })}: {ergebnis.linien.map((l) => `${nm(l.id)} ${vorzeichen(l.aenderung, 1)} %`).join(', ')}</figcaption>
  <LineChart id="vergleich" {cols} {series} {readout} {table} label={t('Comparison, all lines start at 100')} height={220} maxTop={0} hint={t('Point at the lines, or touch them and slide, to read the day and the value of each.')} />
  <ul class="legende">
    {#each ergebnis.linien as l, i (l.id)}
      <li data-legende={l.id}>
        <svg class="muster" viewBox="0 0 36 8" aria-hidden="true"><path d="M0 4H36" style:stroke={STIL[i % STIL.length].farbe} stroke-dasharray={STIL[i % STIL.length].strich || null} /></svg>
        <span class="nm">{nm(l.id)}{#if l.kurz} <small class="muted">· {t('since {day}', { day: tagKurz(l.von) })}</small>{/if}</span>
        <b class="num {l.aenderung > 0 ? 'up' : l.aenderung < 0 ? 'down' : ''}">{vorzeichen(l.aenderung, 1)} %</b>
        {#if onweg}<button type="button" class="weg" aria-label={t('Take {name} out of the comparison', { name: nm(l.id) })} onclick={() => onweg(l.id)}><X size={16} aria-hidden="true" /></button>{/if}
      </li>
    {/each}
  </ul>
</figure>

<style>
  .linien {
    margin: 0;
  }
  .legende {
    display: grid;
    gap: var(--sp-1);
    margin: var(--sp-2) 0 0;
    padding: 0;
    list-style: none;
  }
  .legende li {
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr) auto auto;
    align-items: center;
    gap: var(--sp-2);
  }
  .muster {
    width: 36px;
    height: 8px;
  }
  .muster path {
    fill: none;
    stroke-width: 2.5;
  }
  .nm {
    overflow-wrap: break-word;
  }
  .muted {
    color: var(--ink-2);
  }
  .up {
    color: var(--ok);
  }
  .down {
    color: var(--bad);
  }
  .weg {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -8px 0;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .kv-sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
</style>
