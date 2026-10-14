<script>
  /**
   * SN2x «Strecke» (mockups SN2j-a oben, SN2k): the route of the trip as one drawing, without a real map
   * (the background is only hinted). The numbers 1–n stand on the map, the profile and the timeline at the
   * same places. A trip of several days: one stroke per day, a tent where a night was; with a day chosen
   * that day is dark and the others pale.
   * line: [[lat, lon], …]; km: the route's km; marks: [{ km, n }] (km from the trip's start);
   * cuts: the km where each day ends (all but the last); day: the chosen day (0-based) or null.
   */
  import { t } from '../i18n.svelte.js';
  import { distKm } from '../route.js';

  let { line = [], km = null, marks = [], cuts = [], day = null } = $props();
  const W = 600;
  const H = 300;
  const PAD = 22;
  const pts = $derived(line.map(([lat, lon]) => ({ lat, lon })));
  const box = $derived({
    s: Math.min(...pts.map((p) => p.lat)),
    n: Math.max(...pts.map((p) => p.lat)),
    w: Math.min(...pts.map((p) => p.lon)),
    e: Math.max(...pts.map((p) => p.lon)),
  });
  const view = $derived.by(() => {
    const b = box;
    const k = Math.cos((((b.s + b.n) / 2) * Math.PI) / 180) || 1;
    const spanX = Math.max(1e-6, (b.e - b.w) * k);
    const spanY = Math.max(1e-6, b.n - b.s);
    const sc = Math.min((W - 2 * PAD) / spanX, (H - 2 * PAD) / spanY);
    const ox = (W - spanX * sc) / 2;
    const oy = (H - spanY * sc) / 2;
    return (p) => [Math.round((ox + (p.lon - b.w) * k * sc) * 10) / 10, Math.round((oy + (b.n - p.lat) * sc) * 10) / 10];
  });
  // the km of every point along the line, scaled to the route's km
  const at = $derived.by(() => {
    const out = [0];
    for (let i = 1; i < pts.length; i++) out.push(out[i - 1] + distKm(pts[i - 1], pts[i]));
    const f = km && out.at(-1) ? km / out.at(-1) : 1;
    return out.map((v) => v * f);
  });
  const xy = (k) => {
    let i = at.findIndex((v) => v >= k);
    if (i < 0) i = pts.length - 1;
    return view(pts[i]);
  };
  // one path per day (the whole trip is one day without cuts)
  const days = $derived.by(() => {
    const ends = [...cuts, Infinity];
    let from = 0;
    return ends.map((to, d) => {
      const p = pts.filter((_, i) => at[i] >= from - 1e-9 && at[i] <= to + 1e-9).map(view);
      from = to;
      return { d, path: p.length > 1 ? `M${p.map((q) => q.join(',')).join(' L')}` : '' };
    });
  });
  const camps = $derived(cuts.map((k) => xy(k)));
</script>

{#if pts.length > 1}
  <div class="tmap" data-tour-map>
    <svg viewBox="0 0 {W} {H}" role="img" aria-label={t('Route of the trip, with {n} numbered points', { n: marks.length })}>
      <g class="bg" aria-hidden="true">
        <ellipse cx={W / 2} cy={H / 2} rx={W * 0.36} ry={H * 0.34} />
        <ellipse cx={W / 2} cy={H / 2} rx={W * 0.24} ry={H * 0.22} />
        <ellipse cx={W / 2} cy={H / 2} rx={W * 0.12} ry={H * 0.11} />
      </g>
      {#each days as x (x.d)}
        {#if x.path}<path d={x.path} class="rt d{x.d % 3}" class:pale={day != null && day !== x.d} class:cur={day === x.d} />{/if}
      {/each}
      {#each camps as c, i (i)}
        <g class="camp" class:pale={day != null && day !== i && day !== i + 1}><rect x={c[0] - 8} y={c[1] - 8} width="16" height="16" rx="3" /><path d="M{c[0] - 5},{c[1] + 4} L{c[0]},{c[1] - 5} L{c[0] + 5},{c[1] + 4} Z" /></g>
      {/each}
      {#each marks as m (m.n)}
        {@const p = xy(m.km)}
        <g class="mk" class:first={m.n === 1}><circle cx={p[0]} cy={p[1]} r="9" /><text x={p[0]} y={p[1] + 3.5}>{m.n}</text></g>
      {/each}
    </svg>
  </div>
  {#if cuts.length}
    <ul class="lg" aria-label={t('Days')}>
      {#each days as x (x.d)}<li><i class="k d{x.d % 3}"></i>{t('Day {n}', { n: x.d + 1 })}</li>{/each}
    </ul>
  {/if}
{/if}

<style>
  .tmap {
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    overflow: hidden;
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
  .bg ellipse {
    fill: none;
    stroke: var(--line);
    stroke-width: 1;
    opacity: 0.6;
  }
  .rt {
    fill: none;
    stroke: var(--ink);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .rt.d1 {
    stroke: var(--ink-2);
  }
  .rt.d2 {
    stroke: var(--ink-3);
    stroke-dasharray: 6 5;
  }
  .rt.pale {
    stroke: var(--line-strong);
  }
  .rt.cur {
    stroke: var(--ink);
    stroke-width: 4;
    stroke-dasharray: none;
  }
  .camp rect {
    fill: var(--paper);
    stroke: var(--ink-2);
  }
  .camp path {
    fill: none;
    stroke: var(--ink-2);
    stroke-width: 1.4;
  }
  .camp.pale {
    opacity: 0.5;
  }
  .mk circle {
    fill: var(--paper);
    stroke: var(--ink);
    stroke-width: 1.5;
  }
  .mk.first circle {
    fill: var(--ink);
  }
  .mk text {
    font: 600 var(--fs-tiny) var(--font-body);
    fill: var(--ink);
    text-anchor: middle;
  }
  .mk.first text {
    fill: var(--paper);
  }
  .lg {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 18px;
    margin: 10px 0 0;
    padding: 0;
    list-style: none;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .lg li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .k {
    display: inline-block;
    width: 18px;
    height: 4px;
    border-radius: 2px;
    background: var(--ink);
  }
  .k.d1 {
    background: var(--ink-2);
  }
  .k.d2 {
    background: repeating-linear-gradient(90deg, var(--ink-3) 0 5px, transparent 5px 8px);
  }
</style>
