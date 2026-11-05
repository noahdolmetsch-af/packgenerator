<script>
  /**
   * TR5 «Belastung» and «Leistungskurve» (Noah 14.10.2026 «TR5–TR7 freigegeben»): the load two ways
   * (Strava's Relative Effort from the heart rate, the load from the power) and this ride's best Ø power
   * per duration against the best of the 90 days up to it (grey). Observation only.
   */
  import Sec from '../../flow/kit/Sec.svelte';
  import LineChart from '../../charts/LineChart.svelte';
  import ChartSheet from '../../charts/ChartSheet.svelte';
  import { ftpEstimate, powerLoad, hmm } from '../../training.js';
  import { fixed, hasMeter, bestCurve, CURVE_SPANS } from './power.js';
  import { t, locale } from '../../i18n.svelte.js';

  let { act = null, all = [], today = '' } = $props();

  const ftp = $derived(hasMeter(act) ? ftpEstimate(all, today) : null);
  const load = $derived(act && ftp ? powerLoad(act, ftp) : null);
  const effort = $derived(act?.effort != null ? act.effort : null);
  const spanLabel = (n, unit) => (unit === 's' ? t('{n} s|span', { n }) : t('{n} min', { n }));

  // the curve: one column per duration, the watts on the axis
  const mine = $derived(Array.isArray(act?.pCurve) ? new Map(act.pCurve.filter((p) => p?.[1] > 0)) : null);
  const best = $derived(act && mine?.size ? bestCurve(all, act.day) : null);
  const bestOf = $derived(new Map((best ?? []).filter((b) => b[1] > 0)));
  const cols = $derived(CURVE_SPANS.map(([s, n, unit]) => ({ key: String(s), x: spanLabel(n, unit) })));
  const series = $derived([
    { key: 'own', color: 'var(--hi)', v: CURVE_SPANS.map(([s]) => mine?.get(s) ?? null) },
    ...(bestOf.size > 1 ? [{ key: 'best', color: 'var(--ink-3)', dashed: true, v: CURVE_SPANS.map(([s]) => bestOf.get(s) ?? null) }] : []),
  ]);
  const w = (v) => (v == null ? '–' : `${v} W`);
  const readout = (i) => {
    const [s, n, unit] = CURVE_SPANS[i];
    return { title: spanLabel(n, unit), items: [{ label: t('This ride'), value: w(mine.get(s)), color: 'var(--hi)' }, ...(bestOf.size ? [{ label: t('Best of 90 days'), value: w(bestOf.get(s)) }] : [])] };
  };
  const table = $derived(mine?.size ? { head: [t('Duration'), t('This ride'), t('Best of 90 days')], rows: CURVE_SPANS.map(([s, n, unit]) => ({ key: String(s), cells: [spanLabel(n, unit), w(mine.get(s)), w(bestOf.get(s))] })) } : null);
  const aria = $derived(
    mine?.size
      ? t('Power curve: {list}', { list: CURVE_SPANS.filter(([s]) => mine.get(s) > 0).map(([s, n, unit]) => `${spanLabel(n, unit)} ${mine.get(s)} W`).join(', ') })
      : '',
  );
  let open = $state(null);
</script>

{#if effort != null || load}
  <Sec id="load-h" title={t('Load|card')} sub={t('two views, just to look at')}>
    <div class="card ld vals num" data-section="load">
      {#if effort != null}<span data-load="effort"><b>{effort}</b><small>{t('Relative Effort (Strava, from the heart rate)')}</small></span>{/if}
      {#if load}<span data-load="power"><b>{load.load}</b><small>{t('TSS from power (IF {f} · {h} h)', { f: fixed(load.intensity, 2, locale()), h: hmm(act.movingS) })}</small></span>{/if}
    </div>
  </Sec>
{/if}

{#if mine?.size}
  <Sec id="pcurve-h" title={t('Power curve|act')} sub={t('best Ø power per duration · grey = best of the last 90 days')}>
    <div class="card pc" data-section="power-curve">
      <LineChart id="pcurve-act" {cols} {series} {readout} {table} unit="W" label={aria} onopen={(i) => (open = i)} hint={t('Point at a duration for its watts, tap it for the numbers.')} />
    </div>
  </Sec>
{/if}

{#if open != null && CURVE_SPANS[open] && mine}
  {@const sp = CURVE_SPANS[open]}
  <ChartSheet kicker={t('Power curve|act')} title={spanLabel(sp[1], sp[2])} onclose={() => (open = null)} onprev={open > 0 ? () => open-- : null} onnext={open < CURVE_SPANS.length - 1 ? () => open++ : null} prevLabel={t('Shorter')} nextLabel={t('Longer')}>
    <ul class="shl" data-pcurve-act-sheet>
      <li><span>{t('This ride')}</span><b class="num">{w(mine.get(sp[0]))}</b></li>
      {#if bestOf.size}<li><span>{t('Best of 90 days')}</span><b class="num">{w(bestOf.get(sp[0]))}</b></li>{/if}
    </ul>
    {#if mine.get(sp[0]) == null}<p class="cap">{t('No value for this duration in this ride.')}</p>{/if}
  </ChartSheet>
{/if}

<style>
  .ld {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px;
    padding: 16px;
  }
  .ld span {
    display: flex;
    flex-direction: column;
    padding: 10px 12px;
    border-radius: var(--radius);
    background: var(--paper-2);
  }
  .ld b {
    font: 700 var(--fs-sub) / 1.25 var(--font-body);
  }
  .ld small {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .pc {
    padding: 14px 16px;
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
  .shl span {
    color: var(--ink-2);
  }
</style>
