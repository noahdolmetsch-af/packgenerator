<script>
  /**
   * «Diagramme zum Antippen» K1 + «Genaue Werte» (Noah 27.10.2026 «1-5 a»): the chart «Verlauf» on the page
   * «Form und Erholung». Fitness and fatigue as lines, form as bars around 0, the resting pulse with its own
   * axis and your normal as a band. Every part has a labelled axis with round steps (charts/axis.js).
   * - A span switch (4 wk to 1 yr) and chips that show or hide each part (Q3 «a»: at the chart).
   * - Pointing shows the exact numbers of that day in the line above (Readout), a cursor goes through all
   *   parts; ← → Home End on the keyboard do the same.
   * - A tap or Enter opens the day: all values, the load and its activities, «Tag davor» / «Nächster Tag».
   * - «Als Tabelle»: the same days as rows, newest first.
   * f: formOf() of the page (series, table, opts); today: «YYYY-MM-DD».
   */
  import { niceScale, fracOf, tickText } from '../../charts/axis.js';
  import YTicks from '../../charts/YTicks.svelte';
  import GridLines from '../../charts/GridLines.svelte';
  import Readout from '../../charts/Readout.svelte';
  import DataTable from '../../charts/DataTable.svelte';
  import ChartSheet from '../../charts/ChartSheet.svelte';
  import Seg from '../../ui/Seg.svelte';
  import { indexAt, stepKey } from '../../charts/pick.js';
  import { dayLoads, formSeries, shownForm } from '../../form.js';
  import { addDays } from '../../health.js';
  import { SPANS, SPAN_DEFAULT, rhrNormal, dateMarks, peakOf } from './zeitraum.js';
  import { dm } from '../garmin/words.js';
  import { t, num, locale } from '../../i18n.svelte.js';

  let { f, today } = $props();

  const LAYERS = [
    { key: 'fit', name: 'Fitness|form', color: 'var(--hi)' },
    { key: 'fat', name: 'Fatigue|form', color: 'var(--warn)' },
    { key: 'form', name: 'Form|form', color: 'var(--ok)' },
    { key: 'rhr', name: 'Resting pulse', color: 'var(--bad)' },
  ];
  let span = $state(SPAN_DEFAULT);
  let on = $state({ fit: true, fat: true, form: true, rhr: true });
  let view = $state('chart');
  let sel = $state(null);
  let open = $state(null);

  const days = $derived(SPANS.find((s) => s.key === span)?.days ?? 84);
  // the page's own series is 84 days; another span counts again from the same loads (form.js)
  const series = $derived.by(() => {
    if (days === f.series.length) return f.series;
    const acts = [...f.table.values()].flatMap((r) => r.acts ?? []);
    return formSeries(dayLoads(acts, f.opts), addDays(today, -(days - 1)), today);
  });
  const pts = $derived(series.map((x) => ({ day: x.day, load: x.load, ...shownForm(x), rhr: f.table.get(x.day)?.rhr ?? null })));
  const n = $derived(pts.length);
  const has = $derived(series.some((x) => x.load > 0));
  const normal = $derived(rhrNormal(f.table, today));

  // the axes: lines from 0, form around 0, the resting pulse hugs its values (and the normal band)
  const scA = $derived(niceScale(pts.flatMap((p) => [on.fit ? p.fit : null, on.fat ? p.fat : null]).filter(Number.isFinite).concat(0), { zero: true, count: 4 }));
  const scF = $derived(niceScale([...pts.map((p) => p.form), 0], { count: 3 }));
  const rv = $derived(pts.map((p) => p.rhr).filter(Number.isFinite));
  const scR = $derived(rv.length ? niceScale([...rv, ...(normal ? [normal.lo, normal.hi] : []), Math.min(...rv) - 2, Math.max(...rv) + 2], { count: 3 }) : null);
  const y = (sc) => (v) => 96 - fracOf(v, sc) * 92;
  const yA = $derived(y(scA));
  const yF = $derived(y(scF));
  const yR = $derived(scR ? y(scR) : () => 0);
  const W = $derived(Math.max(1, n) * 10);
  const X = (i) => i * 10 + 5;
  const line = (k, yy) => {
    let d = '';
    let up = true;
    pts.forEach((p, i) => {
      if (!Number.isFinite(p[k])) return void (up = true);
      d += `${up ? 'M' : 'L'}${X(i)},${yy(p[k]).toFixed(2)}`;
      up = false;
    });
    return d;
  };
  const peak = $derived(on.fat ? peakOf(pts.map((p) => p.fat)) : on.fit ? peakOf(pts.map((p) => p.fit)) : null);
  const peakKey = $derived(on.fat ? 'fat' : 'fit');
  const marks = $derived(dateMarks(n, 4));
  const ends = $derived(n ? pts[n - 1] : null);
  const lastR = $derived.by(() => {
    for (let i = n - 1; i >= 0; i--) if (Number.isFinite(pts[i].rhr)) return { i, v: pts[i].rhr };
    return null;
  });

  const signed = (v) => (v > 0 ? `+${num(v)}` : v < 0 ? `−${num(-v)}` : num(0));
  const longDay = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  const shownSel = $derived(sel ?? (n ? n - 1 : null));
  const ro = $derived.by(() => {
    if (shownSel == null || !pts[shownSel]) return null;
    const p = pts[shownSel];
    const items = [];
    if (on.fit) items.push({ label: t('Fitness|form'), value: num(p.fit), color: 'var(--hi)' });
    if (on.fat) items.push({ label: t('Fatigue|form'), value: num(p.fat), color: 'var(--warn)' });
    if (on.form) items.push({ label: t('Form|form'), value: signed(p.form), color: p.form < 0 ? 'var(--bad)' : 'var(--ok)' });
    if (on.rhr) items.push({ label: t('Resting pulse'), value: p.rhr != null ? `${num(p.rhr)} bpm` : '–', color: 'var(--bad)' });
    return { title: p.day === today ? `${t('today')} · ${longDay(p.day)}` : longDay(p.day), items };
  });

  function toggle(k) {
    const next = { ...on, [k]: !on[k] };
    if (Object.values(next).some(Boolean)) on = next; // one part always stays
  }
  // one pointer logic for every part of the chart (they share the days)
  const at = (e) => indexAt(e.clientX, e.currentTarget.getBoundingClientRect(), n);
  const move = (e) => {
    if (e.pointerType === 'mouse' || e.buttons) sel = at(e) ?? sel;
  };
  const leave = (e) => {
    if (e.pointerType === 'mouse') sel = null;
  };
  const tap = (e) => {
    const i = at(e);
    if (i == null) return;
    sel = i;
    open = i;
  };
  function key(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open = shownSel;
      return;
    }
    const i = stepKey(e.key, sel, n);
    if (i == null) return;
    e.preventDefault();
    sel = i;
  }

  const table = $derived({
    head: [t('Day'), t('Fitness|form'), t('Fatigue|form'), t('Form|form'), t('Resting pulse'), t('Load|day')],
    rows: [...pts].reverse().map((p) => ({ key: p.day, cells: [longDay(p.day), num(p.fit), num(p.fat), signed(p.form), p.rhr != null ? num(p.rhr) : '–', num(Math.round(p.load ?? 0))] })),
  });

  const od = $derived(open == null ? null : pts[open]);
  const acts = $derived(od ? (f.table.get(od.day)?.acts ?? []) : []);
  const rhrWord = (v) => {
    if (v == null || !normal) return '';
    const vars = { a: num(normal.lo), b: num(normal.hi) };
    return v > normal.hi ? t('above your normal ({a}–{b})', vars) : v < normal.lo ? t('below your normal ({a}–{b})', vars) : t('in your normal ({a}–{b})', vars);
  };
</script>

{#if has}
  <div class="fv" data-chart="formweeks">
    <div class="top">
      <Seg small full={false} label={t('Span|chart')} value={span} onchange={(v) => ((span = v), (sel = null))} options={SPANS.map((s) => ({ key: s.key, name: t(s.name) }))} />
      <Seg small full={false} label={t('Show as')} value={view} onchange={(v) => (view = v)} options={[{ key: 'chart', name: t('Chart|table') }, { key: 'table', name: t('As table') }]} />
    </div>
    <div class="chips" role="group" aria-label={t('Show|layer')}>
      {#each LAYERS as l (l.key)}
        {@const v = l.key === 'rhr' ? lastR?.v : ends?.[l.key]}
        <button type="button" class="chip" aria-pressed={on[l.key]} onclick={() => toggle(l.key)} data-layer={l.key}>
          <i style:background={l.color}></i>{t(l.name)}{#if v != null}<b class="num">{l.key === 'form' ? signed(v) : num(v)}</b>{/if}
        </button>
      {/each}
    </div>

    {#if view === 'table'}
      <DataTable head={table.head} rows={table.rows} />
    {:else}
      {#if ro}<Readout title={ro.title} items={ro.items} />{/if}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <div class="g" role="group" tabindex="0" aria-label={t('Form and recovery per day, {n} days', { n })} aria-roledescription={t('chart')} aria-keyshortcuts="ArrowLeft ArrowRight Home End Enter" onkeydown={key} data-plot data-n={n}>
        {#if on.fit || on.fat}
          <YTicks ticks={scA.ticks} y={yA} h={100} text={(v) => tickText(v, scA.step, num)} width={40} />
          <div class="p pa" onpointermove={move} onpointerdown={move} onpointerleave={leave} onclick={tap} role="presentation">
            <svg viewBox="0 0 {W} 100" preserveAspectRatio="none" class="lines" aria-hidden="true">
              <GridLines ticks={scA.ticks} y={yA} x1={0} x2={W} />
              {#if sel != null}<line class="cur" x1={X(sel)} x2={X(sel)} y1="0" y2="100" />{/if}
              {#if on.fit}<path d={line('fit', yA)} class="fit" />{/if}
              {#if on.fat}<path d={line('fat', yA)} class="fat" />{/if}
            </svg>
            {#if peak && peak.v > 0}<span class="pk num" style:left="{((peak.i + 0.5) / n) * 100}%" style:bottom="{fracOf(peak.v, scA) * 92 + 4}%" data-peak>{t('highest {n}', { n: num(peak.v) })}</span>{/if}
            {#if sel != null}
              {#if on.fit}<i class="dot" style:left="{((sel + 0.5) / n) * 100}%" style:bottom="{fracOf(pts[sel].fit, scA) * 92 + 4}%" style:background="var(--hi)"></i>{/if}
              {#if on.fat}<i class="dot" style:left="{((sel + 0.5) / n) * 100}%" style:bottom="{fracOf(pts[sel].fat, scA) * 92 + 4}%" style:background="var(--warn)"></i>{/if}
            {/if}
          </div>
          <div class="end" aria-hidden="true">
            {#if on.fit}<b class="num" style:bottom="{fracOf(ends.fit, scA) * 92 + 4}%" style:color="var(--hi)">{num(ends.fit)}</b>{/if}
            {#if on.fat}<b class="num" style:bottom="{fracOf(ends.fat, scA) * 92 + 4}%" style:color="var(--warn)">{num(ends.fat)}</b>{/if}
          </div>
        {/if}
        {#if on.form}
          <YTicks ticks={scF.ticks} y={yF} h={100} text={(v) => (v > 0 ? '+' : '') + tickText(v, scF.step, num)} width={40} />
          <div class="p pf" onpointermove={move} onpointerdown={move} onpointerleave={leave} onclick={tap} role="presentation">
            <svg viewBox="0 0 {W} 100" preserveAspectRatio="none" class="bars" aria-hidden="true">
              <GridLines ticks={scF.ticks} y={yF} x1={0} x2={W} />
              {#if sel != null}<line class="cur" x1={X(sel)} x2={X(sel)} y1="0" y2="100" />{/if}
              {#each pts as p, i (p.day)}
                <rect x={i * 10 + 1.5} width="7" y={Math.min(yF(0), yF(p.form))} height={Math.max(0.6, Math.abs(yF(p.form) - yF(0)))} class:neg={p.form < 0} />
              {/each}
            </svg>
          </div>
          <div class="end" aria-hidden="true"><b class="num" style:bottom="{fracOf(ends.form, scF) * 92 + 4}%" style:color={ends.form < 0 ? 'var(--bad)' : 'var(--ok)'}>{signed(ends.form)}</b></div>
        {/if}
        {#if on.rhr && scR}
          <p class="rl"><b>{t('Resting pulse (bpm)')}</b>{#if normal}<span>{t('Band = your normal {a}–{b}', { a: num(normal.lo), b: num(normal.hi) })}</span>{/if}</p>
          <YTicks ticks={scR.ticks} y={yR} h={100} text={(v) => tickText(v, scR.step, num)} width={40} />
          <div class="p pr" onpointermove={move} onpointerdown={move} onpointerleave={leave} onclick={tap} role="presentation">
            <svg viewBox="0 0 {W} 100" preserveAspectRatio="none" class="rhr" aria-hidden="true">
              {#if normal}<rect class="band" x="0" width={W} y={yR(normal.hi)} height={Math.max(0.5, yR(normal.lo) - yR(normal.hi))} data-normal />{/if}
              <GridLines ticks={scR.ticks} y={yR} x1={0} x2={W} />
              {#if sel != null}<line class="cur" x1={X(sel)} x2={X(sel)} y1="0" y2="100" />{/if}
              <path d={line('rhr', yR)} />
            </svg>
            {#if sel != null && pts[sel].rhr != null}<i class="dot" style:left="{((sel + 0.5) / n) * 100}%" style:bottom="{fracOf(pts[sel].rhr, scR) * 92 + 4}%" style:background="var(--bad)"></i>{/if}
          </div>
          <div class="end" aria-hidden="true">{#if lastR}<b class="num" style:bottom="{fracOf(lastR.v, scR) * 92 + 4}%" style:color="var(--bad)">{num(lastR.v)}</b>{/if}</div>
        {/if}
        <div class="xs num" aria-hidden="true" data-xdates>
          {#each marks as i (i)}<span style:left="{((i + 0.5) / n) * 100}%" class:first={i === 0} class:last={i === n - 1}>{i === n - 1 ? t('today') : dm(pts[i].day)}</span>{/each}
        </div>
      </div>
      <p class="hint">{t('Point at a day for its numbers, tap it for the whole day.')}</p>
    {/if}
  </div>
{/if}

{#if od}
  <ChartSheet kicker={t('Form and recovery')} title={longDay(od.day)} onclose={() => (open = null)} onprev={open > 0 ? () => open-- : null} onnext={open < n - 1 ? () => open++ : null} prevLabel={t('Day before')} nextLabel={t('Next day')}>
    <dl class="vals" data-sheet-vals>
      <div><dt><i style:background="var(--hi)"></i>{t('Fitness|form')}</dt><dd class="num">{num(od.fit)}</dd></div>
      <div><dt><i style:background="var(--warn)"></i>{t('Fatigue|form')}</dt><dd class="num">{num(od.fat)}</dd></div>
      <div><dt><i style:background={od.form < 0 ? 'var(--bad)' : 'var(--ok)'}></i>{t('Form|form')}</dt><dd class="num">{signed(od.form)} <small>{od.form < 0 ? t('rather tired') : t('rather fresh')}</small></dd></div>
      <div><dt><i style:background="var(--bad)"></i>{t('Resting pulse')}</dt><dd class="num">{od.rhr != null ? `${num(od.rhr)} bpm` : '–'} <small>{rhrWord(od.rhr)}</small></dd></div>
      <div><dt>{t('Load|day')}</dt><dd class="num">{num(Math.round(od.load ?? 0))}</dd></div>
    </dl>
    <p class="sh">{t('Activities|day')}</p>
    {#if acts.length}
      <ul class="acts" data-sheet-acts>
        {#each acts as a, i (a.id ?? i)}<li><span>{a.name || a.type || t('Activity')}</span>{#if Number.isFinite(a.movingS)}<small class="num">{num(Math.round(a.movingS / 60))} min</small>{/if}</li>{/each}
      </ul>
    {:else}
      <p class="none">{t('No activity on this day.')}</p>
    {/if}
  </ChartSheet>
{/if}

<style>
  .fv {
    display: grid;
    gap: 10px;
    min-width: 0;
  }
  .top {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 8px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 40px;
    padding: 0 12px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink-3);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    border-color: var(--hi);
    background: var(--hi-soft, var(--paper-2));
    color: var(--ink);
  }
  .chip i {
    width: 14px;
    height: 4px;
    border-radius: 2px;
  }
  .chip[aria-pressed='false'] i {
    opacity: 0.35;
  }
  .g {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) 34px;
    row-gap: 16px;
    border-radius: 6px;
    outline-offset: 2px;
  }
  .g:focus-visible {
    outline: var(--focus-ring);
  }
  .g > :global([data-yticks]) {
    grid-column: 1;
  }
  .p {
    position: relative;
    grid-column: 2;
    touch-action: pan-y;
    cursor: pointer;
  }
  .pa {
    height: 150px;
  }
  .pf {
    height: 70px;
  }
  .pr {
    height: 64px;
  }
  .end {
    position: relative;
    grid-column: 3;
    font-size: var(--fs-tiny);
  }
  .end b {
    position: absolute;
    left: 6px;
    transform: translateY(50%);
    line-height: 1;
  }
  svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  path {
    fill: none;
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
    stroke-linejoin: round;
  }
  .fit {
    stroke: var(--hi);
  }
  .fat {
    stroke: var(--warn);
  }
  .rhr path {
    stroke: var(--bad);
  }
  .bars rect {
    fill: var(--ok);
  }
  .bars rect.neg {
    fill: var(--bad);
  }
  .band {
    fill: var(--paper-2);
  }
  .cur {
    stroke: var(--ink-2);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
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
  .pk {
    position: absolute;
    transform: translate(-50%, -4px);
    color: var(--warn);
    font-size: var(--fs-tiny);
    white-space: nowrap;
    pointer-events: none;
  }
  .rl {
    margin-bottom: -8px !important;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 2px 10px;
    grid-column: 1 / -1;
    margin: 6px 0 0;
    font-size: var(--fs-small);
  }
  .rl span {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .xs {
    margin-top: -8px;
    position: relative;
    grid-column: 2;
    height: 1.6em;
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
  .vals {
    display: grid;
    gap: 0;
    margin: 0;
  }
  .vals div {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    min-height: 44px;
    align-items: center;
    border-bottom: 1px solid var(--line);
  }
  .vals dt {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ink-2);
  }
  .vals dt i {
    width: 14px;
    height: 4px;
    border-radius: 2px;
  }
  .vals dd {
    margin: 0;
    font-weight: 600;
    text-align: right;
  }
  .vals small {
    color: var(--ink-3);
    font-weight: 400;
  }
  .sh {
    margin: 4px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .acts {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .acts li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    min-height: 44px;
    align-items: center;
    border-bottom: 1px solid var(--line);
  }
  .acts small {
    color: var(--ink-3);
  }
  .none {
    margin: 0;
    color: var(--ink-3);
  }
</style>
