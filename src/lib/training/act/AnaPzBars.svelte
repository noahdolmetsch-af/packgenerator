<script>
  /**
   * TR5b «Leistungsbereiche als Balken» (Noah 14.10.2026 «TR5–TR7 freigegeben»): the minutes in the
   * 7 power zones (from the FTP estimate) as standing bars, with a legend and the shares. Only with the
   * watts per second and an FTP. Observation only.
   */
  import AnaCard from '../AnaCard.svelte';
  import { ftpEstimate, powerZoneSecs } from '../../training.js';
  import { hasMeter, pzShares, POWER_ZONE_NAMES } from './power.js';
  import { t } from '../../i18n.svelte.js';

  let { act = null, all = [], today = '' } = $props();

  const ftp = $derived(hasMeter(act) ? ftpEstimate(all, today) : null);
  const mins = $derived.by(() => {
    const s = act?.pHist && ftp ? powerZoneSecs(act.pHist, ftp) : null;
    return s && s.some((x) => x > 0) ? s.map((x) => Math.round(x / 60)) : null;
  });
  const sh = $derived(mins ? pzShares(mins) : null);
  const most = $derived(mins ? Math.max(1, ...mins) : 1);
  const aria = $derived(mins ? mins.map((m, i) => `Z${i + 1} ${t('{n} min', { n: m })}`).join(', ') : '');
</script>

{#if mins}
  <AnaCard key="pzbars" sub={t('Minutes')}>
    <div class="bars num" role="img" aria-label={aria}>
      {#each mins as m, i (i)}
        <div class="col" data-pz={i + 1}>
          <b>{m}</b>
          <i style:height="{Math.max(2, (m / most) * 106)}px" style:background="var(--pz{i + 1})"></i>
          <small>Z{i + 1}</small>
        </div>
      {/each}
    </div>
    <ul class="leg">
      {#each POWER_ZONE_NAMES as n, i (i)}<li><i style:background="var(--pz{i + 1})"></i>Z{i + 1} {t(n)}</li>{/each}
    </ul>
    <p class="cap num">
      {t('Minutes per power zone from FTP {n} W.', { n: ftp })}
      {#if sh}{t('Base (Z1–Z2) {a} % · over threshold (Z5–Z7) {b} %.', { a: sh.base, b: sh.over })}{/if}
    </p>
  </AnaCard>
{/if}

<style>
  .bars {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 8px;
    height: 150px;
    align-items: end;
  }
  .col {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-end;
    height: 100%;
    min-width: 0;
  }
  .col b {
    text-align: center;
    font-size: var(--fs-small);
    margin-bottom: 4px;
  }
  .col i {
    display: block;
    border-radius: 4px 4px 0 0;
  }
  .col small {
    text-align: center;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    margin-top: 6px;
  }
  .leg {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .leg li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .leg i {
    display: inline-block;
    width: 12px;
    height: 3px;
    border-radius: 2px;
  }
</style>
