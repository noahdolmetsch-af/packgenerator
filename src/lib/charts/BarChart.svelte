<script>
  /**
   * «Diagramme zum Antippen» + «Genaue Werte» (Noah 27.10.2026 «1-5 a»): the one bar chart of the app.
   * - A value axis with round, labelled steps and fine grid lines (axis.js, YTicks, GridLines), bars from 0.
   * - The number on each bar when there are few (top), the line of a mean over the bars (line).
   * - Pointing (mouse, or a finger moving sideways) shows the exact numbers of that column in the line
   *   above the chart (Readout); ← → Home End on the keyboard do the same.
   * - A tap, a click or Enter opens what is behind the column (onopen(i)): the sheet of the week or day.
   * - «Als Tabelle» shows the same numbers as rows (table: { head, rows }).
   * cols: [{ key, x, top, parts: [{ v, color }] }] (x: the label under it or ''), line: [number] or null,
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

  let { cols = [], line = null, lineColor = 'var(--ch-w)', readout, onopen = null, label = '', unit = '', height = 150, table = null, hint = '', maxTop = 26, id = 'bc' } = $props();

  const totals = $derived(cols.map((c) => c.parts.reduce((s, p) => s + (p.v || 0), 0)));
  const scale = $derived(niceScale([...totals, ...(line ?? [])], { zero: true, count: 4 }));
  const n = $derived(cols.length);
  // each bar as pieces from a to b, stacked from the bottom
  const stacks = $derived(
    cols.map((c) => {
      let b = 0;
      return c.parts.filter((p) => p.v > 0).map((p) => ({ a: b, b: (b += p.v), color: p.color }));
    }),
  );
  // the svg is 10 units per column wide and 100 high; the top 14 stay free for the numbers on the bars
  const y = (v) => 100 - fracOf(v, scale) * 86;
  const W = $derived(Math.max(1, n) * 10);
  const bw = $derived(n > 26 ? 8.4 : 7.2);
  const linePath = $derived(line ? line.map((v, i) => `${i ? 'L' : 'M'}${i * 10 + 5},${y(v)}`).join(' ') : '');

  let sel = $state(null);
  let view = $state('chart');
  let plot = $state();
  const shown = $derived(sel ?? (n ? n - 1 : null));
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
    if ((e.key === 'Enter' || e.key === ' ') && onopen) {
      e.preventDefault();
      onopen(shown);
      return;
    }
    const i = stepKey(e.key, sel, n);
    if (i == null) return;
    e.preventDefault();
    sel = i;
  }
</script>

<div class="bc" data-chart={id}>
  {#if table}
    <div class="vw"><Seg small full={false} label={t('Show as')} value={view} onchange={(v) => (view = v)} options={[{ key: 'chart', name: t('Chart|table') }, { key: 'table', name: t('As table') }]} /></div>
  {/if}
  {#if view === 'table' && table}
    <DataTable head={table.head} rows={table.rows} />
  {:else}
    {#if ro}<Readout title={ro.title} items={ro.items} />{/if}
    <div class="g" style:--h="{height}px">
      <YTicks ticks={scale.ticks} {y} h={100} text={(v) => tickText(v, scale.step, num)} {unit} />
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <div class="plot" bind:this={plot} role="group" tabindex="0" aria-label={label} aria-roledescription={t('chart')} aria-keyshortcuts="ArrowLeft ArrowRight Home End Enter" onpointermove={move} onpointerdown={move} onpointerleave={leave} onclick={tap} onkeydown={key} data-plot data-n={n}>
        <svg viewBox="0 0 {W} 100" preserveAspectRatio="none" aria-hidden="true">
          <GridLines ticks={scale.ticks} {y} x1={0} x2={W} />
          {#if sel != null}<rect class="cur" x={sel * 10} y="0" width="10" height="100" />{/if}
          {#each stacks as st, i (cols[i].key)}
            {#each st as p, k (k)}<rect x={i * 10 + (10 - bw) / 2} y={y(p.b)} width={bw} height={Math.max(0.6, y(p.a) - y(p.b))} fill={p.color} />{/each}
          {/each}
          {#if line}<path d={linePath} class="ln" style:stroke={lineColor} />{/if}
        </svg>
        {#if n <= maxTop}
          {#each cols as c, i (c.key)}{#if c.top}<b class="top num" style:left="{((i + 0.5) / n) * 100}%" style:bottom="{fracOf(totals[i], scale) * 86}%">{c.top}</b>{/if}{/each}
        {/if}
        {#if line && sel != null}<i class="dot" style:left="{((sel + 0.5) / n) * 100}%" style:bottom="{fracOf(line[sel], scale) * 86}%" style:background={lineColor}></i>{/if}
      </div>
      <div class="xs num" aria-hidden="true">
        {#each cols as c, i (c.key)}{#if c.x}<span style:left="{((i + 0.5) / n) * 100}%" class:first={i === 0} class:last={i === n - 1}>{c.x}</span>{/if}{/each}
      </div>
    </div>
    {#if hint}<p class="hint">{hint}</p>{/if}
  {/if}
</div>

<style>
  .bc {
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
  }
  .top {
    position: absolute;
    transform: translate(-50%, -4px);
    font-size: var(--fs-tiny);
    line-height: 1;
    white-space: nowrap;
    pointer-events: none;
  }
  .dot {
    position: absolute;
    width: 10px;
    height: 10px;
    border: 2px solid var(--paper);
    border-radius: 50%;
    transform: translate(-50%, 50%);
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
