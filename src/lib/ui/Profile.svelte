<script>
  /**
   * Elevation profile of a route (v0.18.0, answer 4b). points: [[km, metres], …].
   * from/to (km): the part to stand out, e.g. today's stage; the rest stays pale.
   * SN2x: marks [{ km, n }]: numbered points (the same numbers as the map and the timeline);
   * cuts [{ km, label }]: a thin dashed line where a day ends.
   * v0.151.0 (HP1–HP5, Noah «1a 2a 3a»): plan = the planned route, drawn as an orange dashed line over
   * the ridden profile, with a small legend; small = a mini profile without axes (Touren, Past trips).
   */
  import { t } from '../i18n.svelte.js';

  let { points, from = null, to = null, label = 'Elevation profile', marks = [], cuts = [], plan = null, small = false } = $props();

  const W = 400;
  const H = $derived(small ? 56 : 120);
  const PAD = $derived(small ? { l: 2, r: 2, t: 4, b: 4 } : { l: 34, r: 6, t: 8, b: 18 });
  const planPts = $derived(plan?.length > 1 ? plan : null);
  const end = $derived(Math.max(points.at(-1)?.[0] || 0, planPts?.at(-1)?.[0] || 0) || 1);
  const eles = $derived([...points, ...(planPts ?? [])].map((p) => p[1]));
  const lo = $derived(Math.floor(Math.min(...eles) / 50) * 50);
  const hi = $derived(Math.max(lo + 100, Math.ceil(Math.max(...eles) / 50) * 50));
  const x = (km) => PAD.l + (km / end) * (W - PAD.l - PAD.r);
  const y = (m) => PAD.t + (1 - (m - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
  const area = (pts) => (pts.length < 2 ? '' : `M${x(pts[0][0])},${y(lo)} ` + pts.map(([km, m]) => `L${x(km).toFixed(1)},${y(m).toFixed(1)}`).join(' ') + ` L${x(pts.at(-1)[0])},${y(lo)} Z`);
  const all = $derived(area(points));
  const planLine = $derived(planPts ? 'M' + planPts.map(([km, m]) => `${x(km).toFixed(1)},${y(m).toFixed(1)}`).join(' L') : '');
  const part = $derived(from == null ? '' : area(points.filter(([km]) => km >= from - 1e-9 && km <= to + 1e-9)));
  const top = $derived(Math.max(...points.map((p) => p[1])));
  // SN2x: the height at a km (the nearest profile point)
  const eleAt = (km) => points.reduce((b, p) => (Math.abs(p[0] - km) < Math.abs(b[0] - km) ? p : b), points[0])[1];
  const ticks = $derived.by(() => {
    const step = end > 200 ? 50 : end > 80 ? 20 : end > 30 ? 10 : 5;
    const out = [];
    for (let k = 0; k <= end; k += step) out.push(k);
    return out;
  });
</script>

<svg class="prof" class:small viewBox="0 0 {W} {H}" role="img" aria-label={t('{label}: {lo} to {top} m over {km} km', { label: t(label), lo, top, km: Math.round(points.at(-1)?.[0] || 0) })}>
  <path d={all} class:pale={from != null} class="a" />
  {#if part}<path d={part} class="a cur" />{/if}
  {#if planLine}<path d={planLine} class="plan" />{/if}
  {#if !small}
    <line x1={PAD.l} x2={W - PAD.r} y1={y(lo)} y2={y(lo)} class="ax" />
    <text x={PAD.l - 4} y={y(hi) + 4} class="t r">{hi}</text>
    <text x={PAD.l - 4} y={y(lo)} class="t r">{lo}</text>
    {#each ticks as k (k)}<text x={x(k)} y={H - 4} class="t c">{k}</text>{/each}
    {#each cuts as c (c.km)}<line x1={x(c.km)} x2={x(c.km)} y1={PAD.t} y2={y(lo)} class="cut" />{#if c.label}<text x={x(c.km) + 3} y={PAD.t + 8} class="t cl">{c.label}</text>{/if}{/each}
    {#each marks as m (m.n)}<g class="mk"><circle cx={x(m.km)} cy={y(eleAt(m.km))} r="8" /><text x={x(m.km)} y={y(eleAt(m.km)) + 4} class="mn">{m.n}</text></g>{/each}
  {/if}
</svg>
{#if planLine && !small}
  <p class="leg"><span><i class="lsw ride" aria-hidden="true"></i>{t('ridden (GPX)')}</span><span><i class="lsw planl" aria-hidden="true"></i>{t('planned')}</span></p>
{/if}

<style>
  .prof {
    display: block;
    width: 100%;
    height: auto;
  }
  .a {
    fill: var(--ink-2);
  }
  .a.pale {
    fill: var(--line);
  }
  .a.cur {
    fill: var(--ink);
  }
  .ax {
    stroke: var(--ink-3);
    stroke-width: 1;
  }
  .plan {
    fill: none;
    stroke: var(--hi-bright);
    stroke-width: 2;
    stroke-dasharray: 5 4;
  }
  .leg {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin: 6px 0 0;
    font: var(--fs-small) var(--font-body);
    color: var(--ink-3);
  }
  .leg span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .lsw {
    display: inline-block;
    width: 16px;
  }
  .lsw.ride {
    height: 10px;
    border-radius: 2px;
    background: var(--ink-2);
  }
  .lsw.planl {
    height: 0;
    border-top: 2px dashed var(--hi-bright);
  }
  .t {
    font: 11px var(--font-body);
    fill: var(--ink-3);
  }
  .t.r {
    text-anchor: end;
  }
  .t.c {
    text-anchor: middle;
  }
  /* SN2x: day lines and numbered points */
  .cut {
    stroke: var(--ink-3);
    stroke-width: 1;
    stroke-dasharray: 3 3;
  }
  .t.cl {
    font-size: var(--fs-tiny);
  }
  .mk circle {
    fill: var(--paper);
    stroke: var(--ink);
    stroke-width: 1.2;
  }
  .mn {
    font: 600 var(--fs-tiny) var(--font-body);
    fill: var(--ink);
    text-anchor: middle;
  }
</style>
