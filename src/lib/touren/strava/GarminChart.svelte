<script>
  /**
   * Analyse wie Garmin Connect › «Diagramme»: one chart (Noah 20.10.2026). Two big numbers on top (Ø and Max,
   * for the height Minimum and Maximum), the area over distance or time with the mean as a line, the axis
   * labels below, and a tap or move shows the value at that spot. With `hr` and `bounds` (the chart «Höhe &
   * Herzfrequenz-Bereiche») the heart rate runs over the height as a line coloured by its zone, with its own
   * axis on the right.
   * ser: stravaana.js serOf; chart: garmin.js CHARTS row; x: 'km' | 'time'.
   */
  import { t, locale } from '../../i18n.svelte.js';
  import { chartHead, ticksOf, zoneAt } from '../garmin.js';
  import { clock } from './fmt.js';

  let { ser, chart, x = 'km', hr = false, bounds = null, title = '' } = $props();

  const W = 1000;
  const H = 200;
  const num = (v, d = 0) => (Number.isFinite(v) ? Number(v).toLocaleString(locale(), { maximumFractionDigits: d, minimumFractionDigits: d }) : '–');
  const unitOf = (u) => (u === 'bpm' ? t('bpm') : u === 'rpm' ? t('rpm') : u);

  const vals = $derived(ser[chart.key]);
  const head = $derived(chartHead(ser, chart.key));
  const xs = $derived(Array.from({ length: ser.n }, (_, k) => (x === 'km' ? k * ser.step : ser.t[k])));
  const xEnd = $derived(xs.at(-1) || 1);
  const finite = $derived(vals.filter(Number.isFinite));
  const yHi = $derived(Math.max(...finite));
  // height, temperature and heart rate start under their lowest value (a little room below), the rest at 0
  const yLo = $derived(chart.key === 'alt' || chart.key === 'temp' || chart.key === 'hr' ? Math.min(...finite) - Math.max(1, (yHi - Math.min(...finite)) * 0.15) : 0);
  const yt = $derived(ticksOf(yLo, yHi, 5));
  const y0 = $derived(yt[0]);
  const y1 = $derived(yt.at(-1) > y0 ? yt.at(-1) : y0 + 1);
  const X = (v) => (v / xEnd) * W;
  const Y = (v) => H - ((v - y0) / (y1 - y0)) * H;

  const area = $derived.by(() => {
    let d = '';
    let open = false;
    let last = 0;
    for (let k = 0; k < ser.n; k++) {
      const v = vals[k];
      if (!Number.isFinite(v)) {
        if (open) d += `L${X(xs[last]).toFixed(1)},${H} Z `;
        open = false;
        continue;
      }
      if (!open) d += `M${X(xs[k]).toFixed(1)},${H} `;
      d += `L${X(xs[k]).toFixed(1)},${Y(v).toFixed(1)} `;
      open = true;
      last = k;
    }
    if (open) d += `L${X(xs[last]).toFixed(1)},${H} Z`;
    return d;
  });
  const avgY = $derived(chart.key !== 'alt' && Number.isFinite(head?.lo) ? Y(head.lo) : null);

  /* heart rate over the height, coloured by zone */
  const hrv = $derived(hr ? ser.hr : null);
  const hLo = $derived(hrv ? ticksOf(Math.min(...hrv.filter(Number.isFinite)), Math.max(...hrv.filter(Number.isFinite)), 5) : null);
  const HY = (v) => H - ((v - hLo[0]) / (hLo.at(-1) - hLo[0] || 1)) * H;
  const hrSegs = $derived.by(() => {
    if (!hrv) return [];
    const out = [];
    let cur = null;
    for (let k = 0; k < ser.n; k++) {
      const v = hrv[k];
      if (!Number.isFinite(v)) {
        cur = null;
        continue;
      }
      const z = zoneAt(v, bounds) ?? 1;
      const pt = `${X(xs[k]).toFixed(1)},${HY(v).toFixed(1)}`;
      if (!cur || cur.z !== z) {
        const start = cur ? cur.end : null;
        cur = { z, d: start ? `M${start} L${pt}` : `M${pt}`, end: pt };
        out.push(cur);
      } else {
        cur.d += ` L${pt}`;
        cur.end = pt;
      }
    }
    return out;
  });

  /* x labels: 6 like Garmin */
  const xt = $derived(Array.from({ length: 6 }, (_, i) => (xEnd * i) / 5));
  const hm = (sec) => `${Math.floor(sec / 3600)}:${String(Math.floor((sec % 3600) / 60)).padStart(2, '0')}`;
  const xLabel = (v) => (x === 'km' ? num(v, v >= 100 ? 0 : 1) : hm(v));

  /* tap or move: the value at that spot */
  let box = $state();
  let at = $state(null); // index
  function pick(e) {
    const r = box.getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (e.clientX - r.left) / (r.width || 1)));
    const target = f * xEnd;
    let best = 0;
    for (let k = 0; k < ser.n; k++) if (Math.abs(xs[k] - target) < Math.abs(xs[best] - target)) best = k;
    at = best;
  }
  function key(e) {
    if (e.key === 'ArrowRight') (at = Math.min(ser.n - 1, (at ?? -1) + Math.max(1, Math.round(ser.n / 100)))), e.preventDefault();
    else if (e.key === 'ArrowLeft') (at = Math.max(0, (at ?? 0) - Math.max(1, Math.round(ser.n / 100)))), e.preventDefault();
    else if (e.key === 'Escape') at = null;
  }
  const atX = $derived(at == null ? null : (X(xs[at]) / W) * 100);
</script>

<section class="gc" data-garmin-chart={hr ? 'althr' : chart.key}>
  <h4 class="gc-h">{title || t(chart.name)}</h4>
  {#if !hr && head}
    <dl class="gc-head">
      <div><dd class="num">{num(head.lo, chart.d)}<small>{unitOf(chart.unit)}</small></dd><dt>{t(chart.lo)}</dt></div>
      <div><dd class="num">{num(head.hi, chart.d)}<small>{unitOf(chart.unit)}</small></dd><dt>{t(chart.hi)}</dt></div>
    </dl>
  {/if}
  <div class="gc-plot" class:two={hr}>
    <div class="gc-y" aria-hidden="true">{#each yt as v (v)}<span style:top="{(Y(v) / H) * 100}%">{num(v)}</span>{/each}</div>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div class="gc-box" bind:this={box} role="img" tabindex="0" aria-label={title || t(chart.name)} onpointerdown={pick} onpointermove={(e) => (e.pointerType === 'mouse' || e.buttons) && pick(e)} onpointerleave={(e) => e.pointerType === 'mouse' && (at = null)} onkeydown={key}>
      <svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" class="gc-svg">
        {#each yt as v (v)}<line class="grid" x1="0" x2={W} y1={Y(v)} y2={Y(v)} />{/each}
        <path class="area k-{chart.key}" class:soft={hr} d={area} />
        {#if avgY != null}<line class="avg" x1="0" x2={W} y1={avgY} y2={avgY} />{/if}
        {#each hrSegs as s, i (i)}<path class="hrz z{s.z}" d={s.d} />{/each}
      </svg>
      {#if at != null}
        <span class="gc-cur" style:left="{atX}%"></span>
        <div class="gc-tip" class:right={atX > 60} style:left="{atX}%" data-garmin-tip>
          <small>{x === 'km' ? `${num(at * ser.step, 2)} km` : clock(ser.t[at])}</small>
          {#if Number.isFinite(vals[at])}<b>{num(vals[at], chart.d)} {unitOf(chart.unit)}</b>{/if}
          {#if hr && Number.isFinite(ser.hr[at])}<b>{num(ser.hr[at])} {t('bpm')} · Z{zoneAt(ser.hr[at], bounds)}</b>{/if}
        </div>
      {/if}
    </div>
    {#if hr && hLo}<div class="gc-y r" aria-hidden="true">{#each hLo as v (v)}<span style:top="{(HY(v) / H) * 100}%">{num(v)}</span>{/each}</div>{/if}
    <div class="gc-x" aria-hidden="true">{#each xt as v, i (i)}<span class:first={i === 0} class:last={i === xt.length - 1} style:left="{(X(v) / W) * 100}%">{xLabel(v)}</span>{/each}</div>
  </div>
  <p class="gc-unit">{x === 'km' ? t('Distance (km)') : t('Time (h:mm)')}</p>
</section>

<style>
  .gc {
    display: grid;
    gap: 8px;
    padding: var(--sp-3) 0;
    border-top: 1px solid var(--line);
  }
  .gc-h {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .gc-head {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin: 0;
  }
  .gc-head div {
    display: flex;
    flex-direction: column-reverse;
    padding-top: 8px;
    border-top: 2px solid var(--line-strong);
  }
  .gc-head dd {
    margin: 0;
    font-size: var(--fs-page);
  }
  .gc-head dd small {
    margin-left: 4px;
    font-size: var(--fs-small);
  }
  .gc-head dt {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .gc-plot {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr);
    grid-template-rows: 180px 22px;
    gap: 0 6px;
  }
  .gc-plot.two {
    grid-template-columns: 40px minmax(0, 1fr) 36px;
  }
  .gc-y,
  .gc-box,
  .gc-x {
    position: relative;
  }
  .gc-y span,
  .gc-x span {
    position: absolute;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    line-height: 1;
    white-space: nowrap;
  }
  .gc-y span {
    right: 0;
    transform: translateY(-50%);
  }
  .gc-y.r span {
    right: auto;
    left: 0;
    color: var(--bad);
  }
  .gc-x {
    grid-column: 2;
  }
  .gc-x span {
    top: 6px;
    transform: translateX(-50%);
  }
  .gc-x span.first {
    transform: none;
  }
  .gc-x span.last {
    transform: translateX(-100%);
  }
  .gc-box {
    touch-action: pan-y;
    cursor: crosshair;
  }
  .gc-box:focus:not(:focus-visible) {
    outline: none;
  }
  .gc-svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .grid {
    vector-effect: non-scaling-stroke;
    stroke: var(--line);
  }
  .area {
    fill: var(--l1);
    opacity: 0.8;
  }
  .k-alt {
    fill: var(--accent);
    opacity: 0.55;
  }
  .k-spd {
    fill: var(--l3);
  }
  .k-w {
    fill: var(--l4);
  }
  .k-hr {
    fill: var(--bad);
    opacity: 0.7;
  }
  .k-cad {
    fill: var(--l1);
  }
  .k-temp {
    fill: var(--l2);
  }
  .area.soft {
    opacity: 0.3;
  }
  .avg {
    vector-effect: non-scaling-stroke;
    stroke: var(--ink);
    stroke-width: 1.5;
  }
  .hrz {
    vector-effect: non-scaling-stroke;
    fill: none;
    stroke-width: 1.8;
  }
  .hrz.z1 {
    stroke: var(--z1);
  }
  .hrz.z2 {
    stroke: var(--z2);
  }
  .hrz.z3 {
    stroke: var(--z3);
  }
  .hrz.z4 {
    stroke: var(--z4);
  }
  .hrz.z5 {
    stroke: var(--z5);
  }
  .gc-cur {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    margin-left: -1px;
    background: var(--ink);
    pointer-events: none;
  }
  .gc-tip {
    position: absolute;
    top: 4px;
    display: grid;
    gap: 2px;
    margin-left: 8px;
    padding: 6px 10px;
    border-radius: 8px;
    background: var(--ink);
    color: var(--paper);
    font-size: var(--fs-small);
    white-space: nowrap;
    pointer-events: none;
  }
  .gc-tip.right {
    transform: translateX(calc(-100% - 16px));
  }
  .gc-tip small {
    opacity: 0.8;
  }
  .gc-unit {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-align: center;
  }
</style>
