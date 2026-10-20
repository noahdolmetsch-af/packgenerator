<script>
  /**
   * Analyse wie Garmin Connect › «Statistiken» (Noah 20.10.2026): the values in groups, a row per value, empty
   * ones left out (garmin.js statsOf).
   */
  import { t, locale } from '../../i18n.svelte.js';
  import { clock } from './fmt.js';

  let { groups = [] } = $props();
  const num = (v, d = 0) => (Number.isFinite(v) ? Number(v).toLocaleString(locale(), { maximumFractionDigits: d, minimumFractionDigits: d }) : '–');
  const valueOf = (r) => (r.kind === 'clock' ? clock(r.v) : r.kind === 'text' ? r.v : `${num(r.v, r.d)}${r.unit ? ` ${r.unit === 'bpm' ? t('bpm') : r.unit === 'rpm' ? t('rpm') : r.unit}` : ''}`);
</script>

<div class="gs" data-garmin-stats>
  {#each groups as g (g.key)}
    <section class="gs-group" data-gs={g.key}>
      <h4 class="gs-h">{t(g.name)}</h4>
      <dl>
        {#each g.rows as r (r.key)}<div class="gs-row" data-gs-row={r.key}><dt>{t(r.label)}</dt><dd class="num">{valueOf(r)}</dd></div>{/each}
      </dl>
    </section>
  {/each}
  {#if groups.some((g) => g.key === 'im')}<p class="gs-note">{t('Intensity minutes are estimated from your heart rate zones: zones 2–3 moderate, zones 4–5 vigorous and counted twice.')}</p>{/if}
</div>

<style>
  .gs {
    display: grid;
    gap: var(--sp-3);
  }
  .gs-h {
    margin: 0;
    padding: 6px 12px;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  dl {
    margin: 0;
    border-radius: var(--radius-card);
    background: var(--paper-2);
    overflow: hidden;
  }
  .gs-row {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
    gap: 12px;
    padding: 10px 12px;
  }
  .gs-row + .gs-row {
    border-top: 1px solid var(--line);
  }
  dt {
    color: var(--ink-2);
  }
  dd {
    margin: 0;
    color: var(--ink);
    font-weight: 500;
  }
  .gs-note {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
