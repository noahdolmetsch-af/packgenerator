<script>
  /**
   * «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»): the bar charts of «In Zahlen» (km and climbing per month,
   * the trips per weekday, the time in heart rate zones per month, the pace per month) on the shared BarChart:
   * an axis from 0, the number on the bars, pointing shows the exact numbers of a column, a tap opens a window
   * that walks on to the earlier and the later one, «Als Tabelle».
   * cols: [{ key, title, x, top, parts: [{ v, color }], items: [{ label, value, color }] }] (title: the month or day
   * in words; x: the label under it; items: the numbers in the line, the window and the table, the same labels in
   * every column); mark: the key drawn in the action colour (the newest month); first: the head of the first table
   * column; label: what the chart shows; unit: of the axis; steps: the allowed axis steps (counts); id: for tests.
   */
  import BarChart from '../charts/BarChart.svelte';
  import ChartSheet from '../charts/ChartSheet.svelte';
  import { t } from '../i18n.svelte.js';

  let { cols = [], mark = null, first = '', label = '', unit = '', steps = null, height = 110, id = 'zahlen' } = $props();
  const bars = $derived(cols.map((c) => ({ key: c.key, x: c.x, top: c.top, parts: c.parts.map((p) => ({ ...p, color: p.color ?? (c.key === mark ? 'var(--hi)' : 'var(--bar)') })) })));
  const read = (i) => ({ title: cols[i].title, items: cols[i].items });
  const table = $derived({
    head: [first, ...(cols[0]?.items ?? []).map((it) => it.label)],
    // newest first, as everywhere
    rows: cols.map((c) => ({ key: c.key, cells: [c.title, ...c.items.map((it) => it.value)] })).reverse(),
  });
  let sel = $state(null);
  const cur = $derived(sel != null ? cols[sel] : null);
</script>

<BarChart {id} cols={bars} readout={read} {table} {unit} {height} {label} {steps} maxTop={12} onopen={(i) => (sel = i)} />

{#if cur}
  <ChartSheet kicker={label} title={cur.title} onclose={() => (sel = null)} onprev={sel > 0 ? () => sel-- : null} onnext={sel < cols.length - 1 ? () => sel++ : null} prevLabel={t('Earlier one')} nextLabel={t('Later one')}>
    <ul class="shl" data-zahlen-sheet>
      {#each cur.items as it (it.label)}<li><span>{#if it.color}<i style:background={it.color}></i>{/if}{it.label}</span><b class="num">{it.value}</b></li>{/each}
    </ul>
  </ChartSheet>
{/if}

<style>
  .shl {
    display: grid;
    gap: 6px;
    margin: 0 0 10px;
    padding: 0;
    list-style: none;
  }
  .shl li {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }
  .shl i {
    display: inline-block;
    width: 10px;
    height: 10px;
    margin-right: 6px;
    border-radius: 2px;
  }
</style>
