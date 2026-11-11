<script>
  /**
   * A curve of a sensor over the ride (Noah 20.10.2026 «3a»: after the ride the pulse and the power as a curve;
   * «Diagramme zum Antippen», Noah 27.10.2026 «1-5 a»): on the shared LineChart, an axis with its unit, the average as a dashed
   * line, pointing shows the time and the value, a tap opens the moment, «Als Tabelle». Only shown, no judging.
   * samples: [[sec, value]]; id: for tests.
   */
  import LineChart from '../charts/LineChart.svelte';
  import ChartSheet from '../charts/ChartSheet.svelte';
  import { t, num } from '../i18n.svelte.js';

  let { samples = [], label = '', unit = '', avg = null, max = null, id = 'sensor' } = $props();
  const clock = (sec) => {
    const m = Math.round(sec / 60);
    return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
  };
  // at most 120 points: the average of each bucket; the time counts from the first sample
  const pts = $derived.by(() => {
    const s = (samples ?? []).filter((x) => Number.isFinite(x?.[0]) && Number.isFinite(x?.[1]));
    if (s.length < 2) return null;
    const n = Math.min(120, s.length);
    const per = s.length / n;
    const t0 = s[0][0];
    const out = [];
    for (let i = 0; i < n; i++) {
      const part = s.slice(Math.floor(i * per), Math.max(Math.floor((i + 1) * per), Math.floor(i * per) + 1));
      out.push({ sec: part[0][0] - t0, v: part.reduce((a, b) => a + b[1], 0) / part.length });
    }
    return out;
  });
  const val = (v) => `${num(Math.round(v))} ${unit}`;
  const chart = $derived.by(() => {
    if (!pts) return null;
    const stride = Math.max(1, Math.ceil((pts.length - 1) / 4));
    return {
      cols: pts.map((p, i) => ({ key: String(i), x: i % stride === 0 ? clock(p.sec) : '' })),
      series: [
        { key: 'v', color: 'var(--hi)', dots: false, v: pts.map((p) => p.v) },
        ...(avg != null ? [{ key: 'avg', color: 'var(--ink-3)', dashed: true, dots: false, v: pts.map(() => avg) }] : []),
      ],
      read: (i) => ({ title: `${clock(pts[i].sec)} h`, items: [{ label, value: val(pts[i].v), color: 'var(--hi)' }, ...(avg != null ? [{ label: t('Average'), value: val(avg), color: 'var(--ink-3)' }] : [])] }),
      table: { head: [t('Time'), label], rows: pts.map((p, i) => ({ key: String(i), cells: [`${clock(p.sec)} h`, val(p.v)] })) },
    };
  });
  let sel = $state(null);
</script>

{#if chart}
  <figure class="sc" data-after-curve>
    <figcaption><b>{label}</b>{#if avg != null}<span>{t('Ø {v} {unit}', { v: num(avg), unit })}</span>{/if}{#if max != null}<span>{t('max {v} {unit}', { v: num(max), unit })}</span>{/if}</figcaption>
    <LineChart {id} cols={chart.cols} series={chart.series} readout={chart.read} table={chart.table} {unit} height={100} {label} onopen={(i) => (sel = i)} />
  </figure>
  {#if sel != null && pts[sel]}
    <ChartSheet kicker={label} title={`${clock(pts[sel].sec)} h`} onclose={() => (sel = null)} onprev={sel > 0 ? () => sel-- : null} onnext={sel < pts.length - 1 ? () => sel++ : null} prevLabel={t('Earlier one')} nextLabel={t('Later one')}>
      <ul class="shl" data-sensor-sheet>
        <li><span>{label}</span><b class="num">{val(pts[sel].v)}</b></li>
        {#if avg != null}<li><span>{t('Average')}</span><b class="num">{val(avg)}</b></li>{/if}
        {#if max != null}<li><span>{t('Highest')}</span><b class="num">{val(max)}</b></li>{/if}
      </ul>
    </ChartSheet>
  {/if}
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
</style>
