<script>
  /**
   * «Diagramme zum Antippen» + «Genaue Werte» (Noah 27.10.2026 «1-5 a»): the one line chart of the app, the
   * sister of BarChart.svelte (same rules, same blocks).
   * - A value axis with round, labelled steps and fine grid lines (axis.js, YTicks, GridLines); the axis may
   *   start above 0 (a line has no base), `scale` gives fixed steps.
   * - A day without a value is a gap in the line, never a fall to 0.
   * - With few points (up to 12) the number at each point of the first line.
   * - Pointing (mouse, or a finger moving sideways) shows the exact numbers of that day in the line above the
   *   chart (Readout); ← → Home End do the same. A tap, a click or Enter opens what is behind it (onopen(i)).
   * - «Als Tabelle» shows the same numbers as rows (table: { head, rows }).
   * cols: [{ key, x }] (x: the label under it or ''), series: [{ key, color, dashed, v: [number|null] }],
   * readout(i) → { title, items }, label: what the chart shows (for screen readers), unit: of the axis.
   */
  import { niceScale, fracOf, tickText } from './axis.js';
  import YTicks from './YTicks.svelte';
  import GridLines from './GridLines.svelte';
  import Readout from './Readout.svelte';
  import DataTable from './DataTable.svelte';
  import Seg from '../ui/Seg.svelte';
  import { indexAt, stepKey } from './pick.js';
  import { t, num } from '../i18n.svelte.js';

  let { cols = [], series = [], scale: fixed = null, tick = null, readout, onopen = null, label = '', unit = '', height = 150, table = null, hint = '', maxTop = 12, topText = null, id = 'lc' } = $props();

  const scale = $derived(fixed ?? niceScale(series.flatMap((s) => s.v), { count: 4 }));
  const n = $derived(cols.length);
  const W = $derived(Math.max(1, n) * 10);
  // the svg is 10 units per column wide and 100 high; 8 units stay free above and below for the dots
  const y = (v) => 96 - fracOf(v, scale) * 88;
  const px = (i) => i * 10 + 5;
  // a gap (null) starts a new piece of the line
  const pathOf = (vs) => {
    let out = '';
    let on = false;
    vs.forEach((v, i) => {
      if (v == null || !Number.isFinite(v)) {
        on = false;
        return;
      }
      out += `${on ? 'L' : 'M'}${px(i)},${y(v).toFixed(2)} `;
      on = true;
    });
    return out.trim();
  };
  const paths = $derived(series.map((s) => pathOf(s.v)));
  const few = $derived(n <= maxTop);

  let sel = $state(null);
  let view = $state('chart');
  let plot = $state();
  // without a choice the newest day with a value shows
  const newest = $derived.by(() => {
    for (let i = n - 1; i >= 0; i--) if (series.some((s) => s.v[i] != null)) return i;
    return n ? n - 1 : null;
  });
  const shown = $derived(sel ?? newest);
  const ro = $derived(shown == null ? null : readout?.(shown));

  const at = (e) => indexAt(e.clientX, plot?.getBoundingClientRect(), n);
  function move(e) {
    if (e.pointerType === 'mouse' || e.buttons) sel = at(e) ?? sel;
  }
  function leave(e) {
    if (e.pointerType === 'mouse') sel = null;
  }
  function tap(e) {
    const i = at(e);
    if (i == null) return;
    sel = i;
    onopen?.(i);
  }
  function key(e) {
    if ((e.key === 'Enter' || e.key === ' ') && onopen && shown != null) {
      e.preventDefault();
      onopen(shown);
      return;
    }
    const i = stepKey(e.key, sel, n);
    if (i == null) return;
    e.preventDefault();
    sel = i;
  }
  const tx = (v) => (tick ? tick(v) : tickText(v, scale.step, num));
</script>

<div class="lc" data-chart={id}>
  {#if table}
    <div class="vw"><Seg small full={false} label={t('Show as')} value={view} onchange={(v) => (view = v)} options={[{ key: 'chart', name: t('Chart|table') }, { key: 'table', name: t('As table') }]} /></div>
  {/if}
  {#if view === 'table' && table}
    <DataTable head={table.head} rows={table.rows} />
  {:else}
    {#if ro}<Readout title={ro.title} items={ro.items} />{/if}
    <div class="g" style:--h="{height}px">
      <YTicks ticks={scale.ticks} {y} h={100} text={tx} {unit} />
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <div class="plot" bind:this={plot} role="group" tabindex="0" aria-label={label} aria-roledescription={t('chart')} aria-keyshortcuts="ArrowLeft ArrowRight Home End Enter" onpointermove={move} onpointerdown={move} onpointerleave={leave} onclick={tap} onkeydown={key} data-plot data-n={n}>
        <svg viewBox="0 0 {W} 100" preserveAspectRatio="none" aria-hidden="true">
          <GridLines ticks={scale.ticks} {y} x1={0} x2={W} />
          {#if sel != null}<rect class="cur" x={sel * 10} y="0" width="10" height="100" />{/if}
          {#each series as s, k (s.key)}{#if paths[k]}<path d={paths[k]} class="ln" class:dash={s.dashed} style:stroke={s.color} data-line={s.key} />{/if}{/each}
        </svg>
        {#each series as s (s.key)}
          {#each s.v as v, i (i)}
            {#if v != null && (few || i === sel)}<i class="dot" class:on={i === sel} style:left="{((i + 0.5) / n) * 100}%" style:bottom="{100 - y(v)}%" style:background={s.color} data-point></i>{/if}
          {/each}
        {/each}
        {#if few && series[0]}
          {#each series[0].v as v, i (i)}{#if v != null}<b class="top num" style:left="{((i + 0.5) / n) * 100}%" style:bottom="calc({100 - y(v)}% + 8px)" data-point-label>{topText ? topText(v) : tx(v)}</b>{/if}{/each}
        {/if}
      </div>
      <div class="xs num" aria-hidden="true">
        {#each cols as c, i (c.key)}{#if c.x}<span style:left="{((i + 0.5) / n) * 100}%" class:first={i === 0} class:last={i === n - 1}>{c.x}</span>{/if}{/each}
      </div>
    </div>
    {#if hint}<p class="hint">{hint}</p>{/if}
  {/if}
</div>

<style>
  .lc {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .vw {
    display: flex;
    justify-content: flex-end;
  }
  .g {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-rows: var(--h) auto;
  }
  .g > :global([data-yticks]) {
    grid-row: 1;
    grid-column: 1;
  }
  .plot {
    position: relative;
    grid-row: 1;
    grid-column: 2;
    touch-action: pan-y;
    cursor: pointer;
    border-radius: 6px;
    outline-offset: 2px;
  }
  .plot:focus-visible {
    outline: var(--focus-ring);
  }
  svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .cur {
    fill: var(--paper-2);
  }
  .ln {
    fill: none;
    stroke-width: 2.5;
    vector-effect: non-scaling-stroke;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .ln.dash {
    stroke-dasharray: 5 4;
  }
  .dot {
    position: absolute;
    width: 8px;
    height: 8px;
    border: 2px solid var(--paper);
    border-radius: 50%;
    transform: translate(-50%, 50%);
    pointer-events: none;
  }
  .dot.on {
    width: 11px;
    height: 11px;
  }
  .top {
    position: absolute;
    transform: translateX(-50%);
    font-size: var(--fs-tiny);
    line-height: 1;
    white-space: nowrap;
    pointer-events: none;
  }
  .xs {
    position: relative;
    grid-row: 2;
    grid-column: 2;
    height: 1.6em;
    margin-top: 6px;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .xs span {
    position: absolute;
    transform: translateX(-50%);
    white-space: nowrap;
  }
  .xs span.first {
    transform: none;
    left: 0 !important;
  }
  .xs span.last {
    transform: none;
    left: auto !important;
    right: 0;
  }
  .hint {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
</style>
