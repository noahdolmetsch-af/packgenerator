<script>
  /**
   * SN2+ SN2e «Puls und Leistung» (mockup approved 13.10.2026, answer 1a: a card right under «Fertig. Gute
   * Tour!»): the time in the heart rate zones as one bar with time and share per zone, Ø and highest heart
   * rate, Ø and max power and the best 20 min, and quietly where it comes from. Without a power meter the
   * power is marked «geschätzt» and the best 20 min give way to one line. Nothing known: one quiet line.
   * Observation only: a calm grey-blue ramp, no colour and no word for good or bad.
   * values: werte.js tripValues() or null; zones: 'own' | 'standard' | null; bike: the bike's name.
   */
  import { t, num } from '../i18n.svelte.js';
  import { hm } from '../gpx.js';
  import { RefreshCw, Info, Activity } from '@lucide/svelte';
  import './zones.css';

  let { values = null, zones = null, bike = '' } = $props();
  const p = $derived(values?.power ?? null);
  const source = $derived(
    [
      t('Strava'),
      p ? (p.measured ? (bike ? t('power meter on {bike}', { bike }) : t('power meter')) : t('without power meter')) : '',
      values?.zones ? (zones === 'own' ? t('your zones') : t('standard zones')) : '',
    ].filter(Boolean),
  );
</script>

{#if values}
  <section class="rv-sec hp" aria-labelledby="hp-h" data-heart-power>
    <div class="rv-h"><div><h2 id="hp-h">{t('Heart rate and power')}</h2><p class="rv-sub">{t('from Strava · to look at, without rating')}</p></div></div>
    <div class="rv-box pad">
      {#if values.zones}
        <div class="zh"><h3>{t('Time in heart rate zones')}</h3><span class="num">{t('{h} h with heart rate', { h: hm(values.zoneS / 3600) })}</span></div>
        <div class="zbar" aria-hidden="true">{#each values.zones as z (z.z)}{#if z.s}<i class="zc-{z.z}" style:flex-grow={z.s}></i>{/if}{/each}</div>
        <ul class="zl">
          {#each values.zones as z (z.z)}
            <li><span class="zn"><i class="zc-{z.z}" aria-hidden="true"></i>Z{z.z}</span><b class="num">{hm(z.s / 3600)}</b><small class="num">{z.pct} %</small></li>
          {/each}
        </ul>
      {/if}
      {#if values.hrAvg != null}
        <dl class="rv-tiles hpt two">
          <div class="rv-tile"><dd><b class="num">{num(values.hrAvg)}</b> <span class="u">{t('bpm')}</span></dd><dt><small>{t('Ø heart rate')}</small></dt></div>
          <div class="rv-tile"><dd><b class="num">{values.hrMax ? num(values.hrMax) : '–'}</b> <span class="u">{t('bpm')}</span></dd><dt><small>{t('Highest heart rate')}</small></dt></div>
        </dl>
      {/if}
      {#if p}
        <dl class="rv-tiles hpt" class:two={!p.measured}>
          <div class="rv-tile"><dd><b class="num">{num(p.avg)}</b> <span class="u">W</span></dd><dt><small>{t('Ø power')}{#if !p.measured}<span class="est">{t('estimated')}</span>{/if}</small></dt></div>
          <div class="rv-tile"><dd><b class="num">{p.max ? num(p.max) : '–'}</b> <span class="u">W</span></dd><dt><small>{t('Max. power')}{#if !p.measured}<span class="est">{t('estimated')}</span>{/if}</small></dt></div>
          {#if p.measured}<div class="rv-tile"><dd><b class="num">{p.w20 ? num(p.w20) : '–'}</b> <span class="u">W</span></dd><dt><small>{t('Best 20 min')}</small></dt></div>{/if}
        </dl>
        {#if !p.measured}<p class="rv-note pm"><Info size={16} aria-hidden="true" /><span>{t('Best 20 min only with a power meter. Without one Strava estimates the power.')}</span></p>{/if}
      {/if}
      <p class="src"><RefreshCw size={14} aria-hidden="true" />{source.join(' · ')}</p>
    </div>
  </section>
{:else}
  <p class="hp-none" data-heart-power="none"><Activity size={16} aria-hidden="true" />{t('Heart rate and power · with Strava')}</p>
{/if}

<style>
  .zh {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 4px 12px;
  }
  .zh h3 {
    margin: 0;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .zh span {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .zbar {
    display: flex;
    gap: 2px;
    height: 14px;
    margin: 10px 0 8px;
    border-radius: 7px;
    overflow: hidden;
  }
  .zbar i {
    display: block;
    flex: 1 1 0;
    min-width: 3px;
  }
  .zl {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 8px;
    list-style: none;
    margin: 0 0 12px;
    padding: 0;
  }
  .zl li {
    display: grid;
    gap: 1px;
    min-width: 0;
  }
  .zn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .zn i {
    width: 9px;
    height: 9px;
    border-radius: 2px;
  }
  .zl b {
    font: 600 var(--fs-body) / 1.2 var(--font-body);
  }
  .zl small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .hpt {
    padding: 0;
    margin-top: 8px;
  }
  .hpt.two {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .hpt dd,
  .hpt dt {
    margin: 0;
  }
  .hpt .rv-tile {
    display: flex;
    flex-direction: column;
  }
  .u {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .est {
    display: inline-block;
    margin-left: 6px;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .pm {
    margin-top: 10px;
    padding: 0;
  }
  .src {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 12px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .src :global(svg) {
    flex: none;
  }
  .hp-none {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    padding: 0 4px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  @media (max-width: 559px) {
    .zl {
      gap: 4px;
    }
    .hpt:not(.two) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
