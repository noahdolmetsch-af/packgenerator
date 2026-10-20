<script>
  /**
   * Analyse wie Garmin Connect › «Diagramme» (Noah 20.10.2026): «Zeit» or «Distanz» on top, then one chart per
   * sensor (Höhe, Geschwindigkeit, Leistung, Herzfrequenz, Trittfrequenz, Temperatur) and «Höhe &
   * Herzfrequenz-Bereiche». Only charts with data.
   */
  import { t } from '../../i18n.svelte.js';
  import Seg from '../../ui/Seg.svelte';
  import GarminChart from './GarminChart.svelte';
  import { CHARTS } from '../garmin.js';

  let { ser, bounds = null } = $props();
  let x = $state('km');
  const charts = $derived(CHARTS.filter((c) => ser[c.key]?.some((v) => Number.isFinite(v))));
  const both = $derived(!!(ser.alt && ser.hr && bounds));
  const OPTS = $derived([
    { key: 'time', name: t('Time|gc') },
    { key: 'km', name: t('Distance|gc') },
  ]);
</script>

<div class="gcs" data-garmin-charts>
  <Seg label={t('Charts over')} value={x} options={OPTS} onchange={(v) => (x = v)} />
  {#each charts as c (c.key)}<GarminChart {ser} chart={c} {x} />{/each}
  {#if both}<GarminChart {ser} chart={CHARTS[0]} {x} hr {bounds} title={t('Height & heart rate zones')} />{/if}
</div>

<style>
  .gcs {
    display: grid;
    gap: var(--sp-2);
  }
</style>
