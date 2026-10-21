<script>
  /**
   * «Datenseiten» (Noah 20.10.2026): one small chart of a data page, inline SVG, no chart library.
   * kind: power | hr | speed (a curve over the ride), hrZones | powerZones (time in each zone as bars),
   * profile (the elevation profile ahead). series: { hr, power, speed: [[sec, value]] }; profileAhead:
   * [[km, m]]; hrZ / pwZ: the zone rows from datapages.js (null: no max heart rate / FTP entered).
   * Health data is observation only: the chart shows, it does not judge.
   */
  import { t } from '../i18n.svelte.js';
  import { CHART, downsample, pathOf, curveStats, timeInZones, zoneBars, profileStats, mmss } from './datapages.js';

  let { kind, series = {}, profileAhead = [], hrZ = null, pwZ = null } = $props();

  const meta = $derived(CHART[kind]);
  const curve = $derived(kind === 'power' || kind === 'hr' || kind === 'speed');
  const pts = $derived(curve ? downsample(series?.[kind] ?? [], 120) : []);
  const stats = $derived(curve ? curveStats(pts) : null);
  const d = $derived(curve ? pathOf(pts, { w: 300, h: 100, floor: kind === 'hr' ? null : 0 }) : '');

  const zones = $derived(kind === 'hrZones' ? hrZ : kind === 'powerZones' ? pwZ : null);
  const zSeries = $derived(kind === 'hrZones' ? series?.hr : series?.power);
  const bars = $derived(zones ? zoneBars(timeInZones(zSeries ?? [], zones)) : []);
  const anyZone = $derived(bars.some((b) => b.s > 0));

  const prof = $derived(kind === 'profile' ? downsample(profileAhead ?? [], 160) : []);
  const pStats = $derived(kind === 'profile' ? profileStats(prof) : null);
  const pD = $derived(kind === 'profile' ? pathOf(prof, { w: 300, h: 100, area: true }) : '');
</script>

<figure class="dpc" data-dp-chart={kind}>
  <figcaption class="dpc-head">
    <span class="dpc-name">{t(meta?.label ?? '')}</span>
    {#if stats}
      <span class="dpc-stats">{t('now {now} · avg {avg} · max {max}', stats)} {meta.unit}</span>
    {:else if pStats}
      <span class="dpc-stats">{t('{up} m up in {km} km', pStats)}</span>
    {/if}
  </figcaption>

  {#if curve}
    {#if d}
      <svg class="dpc-svg" viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden="true">
        <path class="dpc-line dpc-{kind}" d={d} vector-effect="non-scaling-stroke" />
      </svg>
    {:else}
      <p class="dpc-empty">{t('No values yet. They come with the sensor or the GPS.')}</p>
    {/if}
  {:else if kind === 'profile'}
    {#if pD}
      <svg class="dpc-svg" viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden="true">
        <path class="dpc-area" d={pD} vector-effect="non-scaling-stroke" />
      </svg>
    {:else}
      <p class="dpc-empty">{t('No profile ahead: it needs a route with heights.')}</p>
    {/if}
  {:else if !zones}
    <p class="dpc-empty">{kind === 'hrZones' ? t('Enter your max heart rate in the data pages editor, then the zones show here.') : t('Enter your FTP in the data pages editor, then the zones show here.')}</p>
  {:else}
    <ol class="dpc-bars" class:dpc-none={!anyZone} aria-label={t(meta.label)}>
      {#each bars as b, i (i)}
        <li>
          <span class="dpc-col"><span class="dpc-bar {kind === 'hrZones' ? `hz${i + 1}` : `pz${i + 1}`}" style:height="{Math.max(2, Math.round(b.h * 100))}%"></span></span>
          <b>Z{i + 1}</b>
          <small>{mmss(b.s)}</small>
        </li>
      {/each}
    </ol>
  {/if}
</figure>

<style>
  .dpc {
    display: flex;
    flex-direction: column;
    gap: 4px;
    height: 100%;
    margin: 0;
    padding: 6px 10px 8px;
    min-width: 0;
  }
  .dpc-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 2px 10px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .dpc-name {
    font-weight: 600;
    color: var(--ink);
  }
  .dpc-stats {
    font-variant-numeric: tabular-nums;
  }
  .dpc-svg {
    flex: 1;
    width: 100%;
    min-height: 0;
  }
  .dpc-line {
    fill: none;
    stroke: var(--ink);
    stroke-width: 2.5;
    stroke-linejoin: round;
  }
  .dpc-power {
    stroke: var(--hi);
  }
  .dpc-hr {
    stroke: var(--z5);
  }
  .dpc-speed {
    stroke: var(--l3);
  }
  .dpc-area {
    fill: var(--paper-2);
    stroke: var(--ink-2);
    stroke-width: 2;
  }
  .dpc-empty {
    flex: 1;
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .dpc-bars {
    flex: 1;
    display: flex;
    gap: 6px;
    min-height: 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .dpc-bars li {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 0;
    font-variant-numeric: tabular-nums;
  }
  .dpc-col {
    flex: 1;
    display: flex;
    align-items: flex-end;
    width: 100%;
    min-height: 0;
  }
  .dpc-bar {
    display: block;
    width: 100%;
    border-radius: 3px 3px 0 0;
    background: var(--ink-3);
  }
  .dpc-none .dpc-bar {
    opacity: 0.35;
  }
  .dpc-bars b {
    font-size: var(--fs-small);
    color: var(--ink);
  }
  .dpc-bars small {
    font-size: var(--fs-tiny);
    color: var(--ink-2);
  }
  .hz1,
  .pz1 {
    background: var(--z1);
  }
  .hz2,
  .pz3 {
    background: var(--z2);
  }
  .hz3,
  .pz4 {
    background: var(--z3);
  }
  .hz4,
  .pz5 {
    background: var(--z4);
  }
  .hz5,
  .pz6 {
    background: var(--z5);
  }
  .pz2 {
    background: var(--l3);
  }
  .pz7 {
    background: var(--l4);
  }
</style>
