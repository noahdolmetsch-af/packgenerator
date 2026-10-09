<script>
  /**
   * v0.49.0 R1: the height profile of a ride as a calm band on top of a card (drei «A», Rückblick hub).
   * points: [[km, m]]. No axis; the highest point is written beside it by the card.
   */
  import { t } from '../i18n.svelte.js';
  let { points = [] } = $props();
  const W = 600;
  const H = 110;
  const end = $derived(points.at(-1)?.[0] || 1);
  const eles = $derived(points.map((p) => p[1]).filter((v) => v != null));
  const lo = $derived(Math.min(...eles));
  const hi = $derived(Math.max(lo + 50, ...eles));
  const x = (km) => 6 + (km / end) * (W - 12);
  const y = (m) => 22 + (1 - (m - lo) / (hi - lo)) * (H - 40);
  const line = $derived(points.filter((p) => p[1] != null).map(([km, m], i) => `${i ? 'L' : 'M'}${x(km).toFixed(1)},${y(m).toFixed(1)}`).join(' '));
  const area = $derived(line ? `${line} L${x(end).toFixed(1)},${H} L${x(0)},${H} Z` : '');
  const last = $derived(points.filter((p) => p[1] != null).at(-1));
</script>

{#if eles.length > 1}
  <svg class="band" viewBox="0 0 {W} {H}" preserveAspectRatio="none" role="img" aria-label={t('Height profile: {lo} to {hi} m over {km} km', { lo: Math.round(lo), hi: Math.round(hi), km: Math.round(end) })}>
    <path class="fill" d={area} />
    <path class="ln" d={line} vector-effect="non-scaling-stroke" />
    {#if last}<circle class="dot" cx={x(last[0])} cy={y(last[1])} r="4" />{/if}
  </svg>
{/if}

<style>
  .band {
    display: block;
    width: 100%;
    height: 110px;
    background: var(--accent-soft);
  }
  .fill {
    fill: var(--paper);
    opacity: 0.45;
  }
  .ln {
    fill: none;
    stroke: var(--accent);
    stroke-width: 2;
  }
  .dot {
    fill: var(--accent);
  }
</style>
