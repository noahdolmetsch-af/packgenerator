<script>
  /** Garmin-Übersicht: the small shape of an activity's route (Strava's line), drawn grey, north up. */
  import { decodePolyline } from '../../spur/polyline.js';

  let { line = null, size = 56 } = $props();
  const d = $derived.by(() => {
    const pts = decodePolyline(line ?? '');
    if (pts.length < 2) return '';
    const mid = (pts.reduce((s, p) => s + p[0], 0) / pts.length) * (Math.PI / 180);
    const xy = pts.map(([la, lo]) => [lo * Math.cos(mid), -la]);
    const xs = xy.map((p) => p[0]);
    const ys = xy.map((p) => p[1]);
    const [x0, y0] = [Math.min(...xs), Math.min(...ys)];
    const span = Math.max(Math.max(...xs) - x0, Math.max(...ys) - y0) || 1;
    const k = (size - 8) / span;
    const step = Math.max(1, Math.floor(xy.length / 200));
    return xy
      .filter((_, i) => i % step === 0 || i === xy.length - 1)
      .map((p, i) => `${i ? 'L' : 'M'}${(4 + (p[0] - x0) * k).toFixed(1)} ${(4 + (p[1] - y0) * k).toFixed(1)}`)
      .join('');
  });
</script>

{#if d}
  <svg class="rs" width={size} height={size} viewBox="0 0 {size} {size}" aria-hidden="true"><path {d} /></svg>
{/if}

<style>
  .rs {
    flex: none;
  }
  .rs path {
    fill: none;
    stroke: var(--ink-3);
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
