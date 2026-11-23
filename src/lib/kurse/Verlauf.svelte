<script>
  /**
   * «Kursblick» (Noah 22.11.2026): the line of a series. points: [[day, close], …]; the lowest and highest value and the
   * first and last day stand as text beside it (so the numbers can be read, not guessed). A table of the same values
   * is one tap away for screen readers (the figure carries its own sentence). The line is drawn from at most 240 points.
   */
  import { t } from '../i18n.svelte.js';
  import { duenn } from './rechnen.js';
  import { zahl, tagKurz } from './format.js';

  let { points = [], label = '', dec = 0, unit = '' } = $props();
  const W = 600;
  const H = 200;
  const draw = $derived(duenn(points, 240));
  const lo = $derived(draw.length ? Math.min(...draw.map((p) => p[1])) : 0);
  const hi = $derived(draw.length ? Math.max(...draw.map((p) => p[1])) : 0);
  const path = $derived.by(() => {
    if (draw.length < 2) return '';
    const t0 = Date.parse(`${draw[0][0]}T00:00:00Z`);
    const t1 = Date.parse(`${draw[draw.length - 1][0]}T00:00:00Z`);
    const span = t1 - t0 || 1;
    const rng = hi - lo || 1;
    return draw.map((p, i) => `${i ? 'L' : 'M'}${(((Date.parse(`${p[0]}T00:00:00Z`) - t0) / span) * W).toFixed(1)} ${(H - 8 - ((p[1] - lo) / rng) * (H - 16)).toFixed(1)}`).join(' ');
  });
  const up = $derived(points.length > 1 && points[points.length - 1][1] >= points[0][1]);
</script>

{#if draw.length >= 2}
  <figure class="verlauf" data-verlauf>
    <figcaption class="kv-sr">{t('{label}: from {a} {from} to {b} {to}, lowest {lo}, highest {hi}', { label, a: tagKurz(draw[0][0]), from: zahl(draw[0][1], dec), b: tagKurz(draw[draw.length - 1][0]), to: zahl(draw[draw.length - 1][1], dec), lo: zahl(lo, dec), hi: zahl(hi, dec) })}</figcaption>
    <div class="box">
      <svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" aria-hidden="true" class:up class:down={!up}>
        <path class="grid" d="M0 8H{W}M0 {H - 8}H{W}" />
        <path class="line" d={path} />
      </svg>
      <span class="y hi">{zahl(hi, dec)}{unit}</span>
      <span class="y lo">{zahl(lo, dec)}{unit}</span>
    </div>
    <div class="x"><span>{tagKurz(draw[0][0])}</span><span>{tagKurz(draw[draw.length - 1][0])}</span></div>
  </figure>
{/if}

<style>
  .verlauf {
    margin: 0;
  }
  .box {
    position: relative;
    height: 200px;
    border-radius: var(--r-ctl);
    background: var(--accent-soft);
    overflow: hidden;
  }
  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  .grid {
    stroke: var(--line);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
    fill: none;
  }
  .line {
    fill: none;
    stroke: var(--accent);
    stroke-width: 2.5;
    vector-effect: non-scaling-stroke;
    stroke-linejoin: round;
  }
  .down .line {
    stroke: var(--bad);
  }
  .y {
    position: absolute;
    left: var(--sp-2);
    font-size: var(--fs-tiny);
    color: var(--ink-2);
    background: color-mix(in srgb, var(--accent-soft) 80%, transparent);
    padding: 0 4px;
    border-radius: 4px;
  }
  .hi {
    top: 10px;
  }
  .lo {
    bottom: 10px;
  }
  .x {
    display: flex;
    justify-content: space-between;
    margin-top: var(--sp-1);
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .kv-sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
</style>
