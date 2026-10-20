<script>
  /**
   * A small curve of a sensor over the ride (Noah 20.10.2026 «3a»: after the ride the pulse and the power as
   * a curve). samples: [[sec, value]]; a plain SVG line, its average as a dashed line. Only shown, no judging.
   */
  import { t, num } from '../i18n.svelte.js';

  let { samples = [], label = '', unit = '', avg = null, max = null } = $props();
  const W = 300;
  const H = 70;
  const pts = $derived.by(() => {
    const s = (samples ?? []).filter((x) => Number.isFinite(x?.[0]) && Number.isFinite(x?.[1]));
    if (s.length < 2) return null;
    // at most 300 points: the average of each bucket
    const n = Math.min(300, s.length);
    const per = s.length / n;
    const out = [];
    for (let i = 0; i < n; i++) {
      const part = s.slice(Math.floor(i * per), Math.max(Math.floor((i + 1) * per), Math.floor(i * per) + 1));
      out.push([part[0][0], part.reduce((a, b) => a + b[1], 0) / part.length]);
    }
    const t0 = out[0][0];
    const t1 = out.at(-1)[0] || t0 + 1;
    const vs = out.map((x) => x[1]);
    const lo = Math.min(...vs);
    const hi = Math.max(...vs, lo + 1);
    const x = (sec) => ((sec - t0) / Math.max(1, t1 - t0)) * W;
    const y = (v) => H - 4 - ((v - lo) / (hi - lo)) * (H - 8);
    return { line: out.map((p) => `${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join(' '), avgY: avg != null ? y(avg) : null };
  });
</script>

{#if pts}
  <figure class="sc" data-after-curve>
    <figcaption><b>{label}</b>{#if avg != null}<span>{t('Ø {v} {unit}', { v: num(avg), unit })}</span>{/if}{#if max != null}<span>{t('max {v} {unit}', { v: num(max), unit })}</span>{/if}</figcaption>
    <svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" role="img" aria-label={label}>
      {#if pts.avgY != null}<line x1="0" x2={W} y1={pts.avgY} y2={pts.avgY} class="sc-avg" />{/if}
      <polyline points={pts.line} class="sc-line" />
    </svg>
  </figure>
{/if}

<style>
  .sc {
    margin: 0;
    display: grid;
    gap: 4px;
  }
  figcaption {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  figcaption b {
    color: var(--ink);
  }
  svg {
    width: 100%;
    height: 70px;
    background: var(--paper-2);
    border-radius: 8px;
  }
  .sc-line {
    fill: none;
    stroke: var(--hi);
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
  }
  .sc-avg {
    stroke: var(--ink-3);
    stroke-width: 1;
    stroke-dasharray: 4 4;
    vector-effect: non-scaling-stroke;
  }
</style>
