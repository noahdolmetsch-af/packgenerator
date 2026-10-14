<script>
  /**
   * TR6b: a calm line chart that keeps its text sharp at any width (the width is measured, nothing is
   * stretched). dots: [{ x: 0–1, y }] (quiet points), line: [{ x: 0–1, y }], ticks: y values with a
   * dashed line, labels: [{ x: 0–1, text }] under the chart, fmt: how a y value is written.
   * color: a CSS colour for the line (the dots are a lighter tone of it).
   */
  let { dots = [], line = [], ticks = [], labels = [], fmt = (v) => String(v), color = 'var(--hi)', label = '', height = 190 } = $props();
  let w = $state(600);
  const L = 40;
  const R = 12;
  const T = 10;
  const B = 28;
  const ys = $derived([...dots, ...line].map((p) => p.y).concat(ticks));
  const lo = $derived(Math.min(...ys));
  const hi = $derived(Math.max(...ys));
  const span = $derived(hi - lo || 1);
  const px = (x) => L + x * Math.max(10, w - L - R);
  const py = (y) => T + (1 - (y - lo) / span) * (height - T - B);
  const d = $derived(line.map((p, i) => `${i ? 'L' : 'M'}${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`).join(' '));
</script>

<div class="lc" bind:clientWidth={w}>
  <svg width={w} {height} viewBox="0 0 {w} {height}" role="img" aria-label={label}>
    {#each ticks as v (v)}
      <line class="tk" x1={L} x2={w - R} y1={py(v)} y2={py(v)} />
      <text class="yl" x={L - 8} y={py(v) + 4} text-anchor="end">{fmt(v)}</text>
    {/each}
    {#each dots as p, i (i)}<circle class="dt" cx={px(p.x)} cy={py(p.y)} r="3.2" style:fill={color} />{/each}
    {#if line.length > 1}<path {d} class="ln" style:stroke={color} />{/if}
    {#each labels as l, i (i)}<text class="xl" x={px(l.x)} y={height - 6} text-anchor={l.x < 0.05 ? 'start' : l.x > 0.95 ? 'end' : 'middle'}>{l.text}</text>{/each}
  </svg>
</div>

<style>
  .lc {
    width: 100%;
    min-width: 0;
  }
  svg {
    display: block;
    overflow: visible;
  }
  .tk {
    stroke: var(--line);
    stroke-dasharray: 3 4;
  }
  .yl,
  .xl {
    fill: var(--ink-3);
    font: 400 12px var(--font-body);
  }
  .dt {
    opacity: 0.45;
  }
  .ln {
    fill: none;
    stroke-width: 2.4;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
</style>
