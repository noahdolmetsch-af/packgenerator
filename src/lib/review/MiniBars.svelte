<script>
  /**
   * v0.49.0 R1 (Noah 6a), «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»): the small bar chart of the Rückblick
   * (Relative Effort, load, the trip comparison, the pace) on the shared BarChart: an axis from 0 with exact steps,
   * the number on each bar, pointing shows the exact value of a trip or ride, a tap opens it, «Als Tabelle».
   * values: [{ id, v, name }] oldest first (v null: unknown, no bar; name: the trip or ride for the readout);
   * mark: the id drawn in the action colour (the newest trip); avg: a dashed line;
   * label: what the chart shows (for screen readers and the window); unit: of the numbers; id: for tests.
   */
  import BarChart from '../charts/BarChart.svelte';
  import ChartSheet from '../charts/ChartSheet.svelte';
  import { t, num } from '../i18n.svelte.js';

  let { values = [], mark = null, avg = null, label = '', unit = '', height = 70, id = 'mini' } = $props();
  const n1 = (v) => num(Math.round(v * 10) / 10);
  const text = (v) => (v == null ? '–' : unit ? `${n1(v)} ${unit}` : n1(v));
  const nameOf = (x, i) => x.name || t('Entry {n}', { n: i + 1 });
  const cols = $derived(values.map((x, i) => ({ key: String(x.id), x: '', top: x.v == null ? '' : n1(x.v), parts: x.v == null ? [] : [{ v: x.v, color: x.id === mark ? 'var(--hi)' : 'var(--bar)' }] })));
  const line = $derived(avg != null && avg > 0 ? values.map(() => avg) : null);
  const read = (i) => ({ title: nameOf(values[i], i), items: [{ label, value: text(values[i].v), color: values[i].id === mark ? 'var(--hi)' : 'var(--bar)' }] });
  // newest first, as everywhere
  const table = $derived({
    head: [t('Trip'), label],
    rows: values.map((x, i) => ({ key: String(x.id), cells: [nameOf(x, i), text(x.v)] })).reverse(),
  });
  let sel = $state(null);
  const cur = $derived(sel != null ? values[sel] : null);
</script>

<BarChart {id} {cols} {line} lineColor="var(--ink-3)" readout={read} {table} {unit} {height} {label} maxTop={6} onopen={(i) => (sel = i)} />

{#if cur}
  <ChartSheet kicker={label} title={nameOf(cur, sel)} onclose={() => (sel = null)} onprev={sel > 0 ? () => sel-- : null} onnext={sel < values.length - 1 ? () => sel++ : null} prevLabel={t('Earlier one')} nextLabel={t('Later one')}>
    <ul class="shl" data-mini-sheet>
      <li><span>{label}</span><b class="num">{text(cur.v)}</b></li>
      {#if avg != null && avg > 0}<li><span>{t('Average of the bars')}</span><b class="num">{text(avg)}</b></li>{/if}
    </ul>
    {#if cur.v == null}<p class="shn">{t('Not known for this trip.')}</p>{/if}
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
  .shn {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
