<script>
  /**
   * TR5b «Trittfrequenz verteilt» (Noah 14.10.2026 «TR5–TR7 freigegeben»): the share of the time per
   * 10 rpm of cadence (without coasting), with Ø and the main range. Only with a cadence sensor; also
   * without a power meter. Observation only.
   */
  import AnaCard from '../AnaCard.svelte';
  import { cadenceShares, cadenceMean, cadenceMain } from './power.js';
  import { t } from '../../i18n.svelte.js';

  let { act = null, all = [], today = '' } = $props();

  const rows = $derived(act?.cHist ? cadenceShares(act.cHist) : null);
  const most = $derived(rows ? Math.max(1, ...rows.map((r) => r.pct)) : 1);
  const avg = $derived(rows ? (act.cad ?? cadenceMean(act.cHist)) : null);
  const main = $derived(rows ? cadenceMain(act.cHist) : null);
  const aria = $derived(rows ? rows.map((r) => `${r.bin}: ${r.pct} %`).join(', ') : '');
</script>

{#if rows}
  <AnaCard key="cadence" sub={t('from the cadence sensor')} wide>
    <div class="bars num" role="img" aria-label={t('Cadence (rpm) per share of the time: {list}', { list: aria })} style:grid-template-columns="repeat({rows.length}, minmax(0, 1fr))">
      {#each rows as r (r.bin)}
        <div class="col" data-cad={r.bin}>
          <b>{r.pct} %</b>
          <i style:height="{Math.max(2, (r.pct / most) * 90)}px" style:opacity={0.45 + 0.55 * (r.pct / most)}></i>
          <small>{r.bin}</small>
        </div>
      {/each}
    </div>
    <p class="cap num">
      {t('Share of the time per cadence (rpm), without coasting.')}
      {#if avg != null}{main && main.from !== main.to ? t('Ø {a}, mostly {b}–{c}.', { a: avg, b: main.from, c: main.to }) : t('Ø {a}.', { a: avg })}{/if}
    </p>
  </AnaCard>
{/if}

<style>
  .bars {
    display: grid;
    gap: 6px;
    height: 130px;
    align-items: end;
  }
  .col {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    height: 100%;
    min-width: 0;
  }
  .col b {
    text-align: center;
    font-size: var(--fs-tiny);
    margin-bottom: 4px;
    white-space: nowrap;
  }
  .col i {
    display: block;
    border-radius: 4px 4px 0 0;
    background: var(--hi);
  }
  .col small {
    text-align: center;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    margin-top: 6px;
  }
</style>
