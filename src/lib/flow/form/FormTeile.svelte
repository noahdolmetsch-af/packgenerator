<script>
  /**
   * «Diagramme zum Antippen» K3 (Noah 27.10.2026 «1-5 a»): «Was heute zählt» on the page «Form und Erholung».
   * Every row (resting pulse, HRV, sleep, felt sleep and energy, the form) keeps its sentence and its points
   * and gets the last 7 days as a small line. A tap on a row opens its days:
   * - 7 or 30 days with a labelled axis (charts/axis.js), your normal as a dashed line, with 7 days the
   *   number at every point;
   * - pointing shows the exact day in the line above (Readout); ← → Home End on the keyboard do the same;
   * - why it gives points (the rule in one sentence) and what the normal is;
   * - one second value to compare, with its own axis on the right (Q3 «a»: at the chart);
   * - «Als Tabelle»: value, normal and points per day; «‹ earlier part» / «next part ›» walk the rows.
   * f: formOf() of the page; rows: the parts of today (Form.svelte); today: «YYYY-MM-DD».
   */
  import { niceScale, fracOf, tickText, minuteText, MINUTE_STEPS, LABEL_MAX } from '../../charts/axis.js';
  import YTicks from '../../charts/YTicks.svelte';
  import GridLines from '../../charts/GridLines.svelte';
  import Readout from '../../charts/Readout.svelte';
  import DataTable from '../../charts/DataTable.svelte';
  import ChartSheet from '../../charts/ChartSheet.svelte';
  import Seg from '../../ui/Seg.svelte';
  import { ChevronRight } from '@lucide/svelte';
  import { indexAt, stepKey } from '../../charts/pick.js';
  import { PARTS, partDays, partsWithData } from './teile.js';
  import { partText, PART_NAMES } from './words.js';
  import { dm } from '../garmin/words.js';
  import { t, num, locale } from '../../i18n.svelte.js';

  let { f, rows = [], today } = $props();

  const src = $derived({ table: f.table, felt: f.feltBy ?? new Map(), series: f.series });
  const minis = $derived(new Map(rows.map((p) => [p.key, partDays(p.key, src, today, 7)])));

  let open = $state(null); // the key of the open part
  let n = $state(7);
  let view = $state('chart');
  let sel = $state(null);
  let second = $state(null);

  const idx = $derived(rows.findIndex((p) => p.key === open));
  const days = $derived(open ? partDays(open, src, today, n) : []);
  const others = $derived(open ? partsWithData(src, today, n).filter((k) => k !== open) : []);
  const sec = $derived(second && others.includes(second) ? partDays(second, src, today, n) : null);

  function show(k) {
    open = k;
    sel = null;
    second = null;
  }

  // a number of a part as text: sleep in hours, form with its sign
  const signed = (v) => (v > 0 ? `+${num(v)}` : v < 0 ? `−${num(-v)}` : num(0));
  const fmt = (k, v) => (v == null ? '–' : k === 'sleep' ? minuteText(v) : k === 'form' ? signed(v) : num(Math.round(v * 10) / 10));
  const withUnit = (k, v) => (v == null ? '–' : k === 'rhr' ? `${fmt(k, v)} bpm` : k === 'hrv' ? `${fmt(k, v)} ms` : k === 'feltSleep' || k === 'energy' ? `${fmt(k, v)}/10` : fmt(k, v));
  const ptsText = (p) => (p == null ? '–' : signed(Math.round(p)));
  const unitOf = (k) => (k === 'rhr' ? 'bpm' : k === 'hrv' ? 'ms' : k === 'feltSleep' || k === 'energy' ? t('of 10') : '');

  const scaleOf = (k, list) => {
    const v = list.flatMap((d) => [d.v, d.normal]).filter(Number.isFinite);
    if (k === 'sleep') return niceScale(v, { count: 3, steps: MINUTE_STEPS });
    if (k === 'feltSleep' || k === 'energy') return niceScale([...v, 0, 10], { count: 5 });
    if (k === 'form') return niceScale([...v, 0], { count: 3 });
    return niceScale([...v, Math.min(...v) - 2, Math.max(...v) + 2], { count: 3 });
  };
  const sc = $derived(open ? scaleOf(open, days) : null);
  const sc2 = $derived(sec ? scaleOf(second, sec) : null);
  const yOf = (s) => (v) => 94 - fracOf(v, s) * 88;
  const y = $derived(sc ? yOf(sc) : () => 0);
  const y2 = $derived(sc2 ? yOf(sc2) : () => 0);
  const tick = (k, s) => (v) => (k === 'sleep' ? minuteText(v) : (k === 'form' && v > 0 ? '+' : '') + tickText(v, s.step, num));
  const W = $derived(Math.max(1, n) * 10);
  const X = (i) => i * 10 + 5;
  const path = (list, k, yy) => {
    let d = '';
    let up = true;
    list.forEach((p, i) => {
      if (!Number.isFinite(p[k])) return void (up = true);
      d += `${up ? 'M' : 'L'}${X(i)},${yy(p[k]).toFixed(2)}`;
      up = false;
    });
    return d;
  };
  const left = (i, len) => `${((i + 0.5) / len) * 100}%`;

  const longDay = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  const shownSel = $derived(sel ?? (days.length ? days.length - 1 : null));
  const ro = $derived.by(() => {
    const d = shownSel == null ? null : days[shownSel];
    if (!d) return null;
    const items = [
      { label: t(PART_NAMES[open]), value: withUnit(open, d.v), color: 'var(--hi)' },
      { label: t('Normal|part'), value: withUnit(open, d.normal) },
      { label: t('Points'), value: ptsText(d.points) },
    ];
    if (sec) items.push({ label: t(PART_NAMES[second]), value: withUnit(second, sec[shownSel]?.v), color: 'var(--warn)' });
    return { title: d.day === today ? `${t('today')} · ${longDay(d.day)}` : longDay(d.day), items };
  });

  const at = (e) => indexAt(e.clientX, e.currentTarget.getBoundingClientRect(), days.length);
  const move = (e) => {
    if (e.pointerType === 'mouse' || e.buttons) sel = at(e) ?? sel;
  };
  const leave = (e) => {
    if (e.pointerType === 'mouse') sel = null;
  };
  const tap = (e) => {
    sel = at(e) ?? sel;
  };
  function key(e) {
    const i = stepKey(e.key, sel, days.length);
    if (i == null) return;
    e.preventDefault();
    sel = i;
  }

  const table = $derived({
    head: [t('Day'), t(PART_NAMES[open] ?? 'Value'), t('Normal|part'), t('Points'), ...(sec ? [t(PART_NAMES[second])] : [])],
    rows: days
      .map((d, i) => ({ key: d.day, cells: [longDay(d.day), withUnit(open, d.v), withUnit(open, d.normal), ptsText(d.points), ...(sec ? [withUnit(second, sec[i]?.v)] : [])] }))
      .reverse(),
  });
  const today1 = $derived(days.at(-1));
  const nameOf = (i) => (rows[i] ? t(PART_NAMES[rows[i].key]) : '');
</script>

<ul class="card parts" data-form-parts>
  {#each rows as p (p.key)}
    {@const pts = p.points}
    {@const m = minis.get(p.key) ?? []}
    {@const ms = m.some((d) => d.v != null) ? scaleOf(p.key, m) : null}
    <li data-part={p.key}>
      <button type="button" class="row" onclick={() => show(p.key)} aria-haspopup="dialog" aria-label={t('{name}: the last days', { name: t(PART_NAMES[p.key]) })} data-part-open>
        <b>{t(PART_NAMES[p.key])}</b>
        <span class="tx">{partText(p)}</span>
        {#if ms}
          <svg class="mini" viewBox="0 0 70 100" preserveAspectRatio="none" aria-hidden="true" data-mini>
            <path d={path(m, 'v', yOf(ms))} />
          </svg>
        {/if}
        {#if pts != null}<small class="pt num" class:up={pts > 0} class:down={pts < 0}>{pts > 0 ? '+' : pts < 0 ? '−' : '±'}{num(Math.abs(Math.round(pts)))}</small>{/if}
        <ChevronRight class="cv" size={16} aria-hidden="true" />
      </button>
    </li>
  {/each}
</ul>
<p class="hint">{t('The line shows the last 7 days. Tap a row for its days and why it counts.')}</p>

{#if open && idx >= 0}
  <ChartSheet
    kicker={t('What counts today')}
    title={t(PART_NAMES[open])}
    onclose={() => (open = null)}
    onprev={idx > 0 ? () => show(rows[idx - 1].key) : null}
    onnext={idx < rows.length - 1 ? () => show(rows[idx + 1].key) : null}
    prevLabel={nameOf(idx - 1)}
    nextLabel={nameOf(idx + 1)}
  >
    <div class="sum" data-part-sum>
      <span><small>{t('today')}</small><b class="num">{withUnit(open, today1?.v)}</b></span>
      <span><small>{t('Normal|part')}</small><b class="num">{withUnit(open, today1?.normal)}</b></span>
      <span><small>{t('Points')}</small><b class="num" class:up={today1?.points > 0} class:down={today1?.points < 0}>{ptsText(today1?.points)}</b></span>
    </div>
    <p class="why" data-part-why>{t(PARTS[open].rule)} {t(PARTS[open].normal)}</p>

    <div class="top">
      <Seg small full={false} label={t('Span|chart')} value={String(n)} onchange={(v) => ((n = Number(v)), (sel = null))} options={[{ key: '7', name: t('7 days') }, { key: '30', name: t('30 days') }]} />
      <Seg small full={false} label={t('Show as')} value={view} onchange={(v) => (view = v)} options={[{ key: 'chart', name: t('Chart|table') }, { key: 'table', name: t('As table') }]} />
    </div>
    {#if others.length}
      <div class="chips" role="group" aria-label={t('Compare with')} data-second>
        <small>{t('Compare with')}</small>
        {#each others as k (k)}
          <button type="button" class="chip" aria-pressed={second === k} onclick={() => (second = second === k ? null : k)} data-second-key={k}><i></i>{t(PART_NAMES[k])}</button>
        {/each}
      </div>
    {/if}

    {#if view === 'table'}
      <DataTable head={table.head} rows={table.rows} limit={30} />
    {:else if sc}
      {#if ro}<Readout title={ro.title} items={ro.items} />{/if}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <div class="g" class:with2={!!sec} role="group" tabindex="0" aria-label={t('{name} per day, {n} days', { name: t(PART_NAMES[open]), n })} aria-roledescription={t('chart')} aria-keyshortcuts="ArrowLeft ArrowRight Home End" onkeydown={key} data-part-plot data-n={days.length}>
        <YTicks ticks={sc.ticks} y={y} h={100} text={tick(open, sc)} unit={unitOf(open)} />
        <div class="p" onpointermove={move} onpointerdown={move} onpointerleave={leave} onclick={tap} role="presentation">
          <svg viewBox="0 0 {W} 100" preserveAspectRatio="none" aria-hidden="true">
            <GridLines ticks={sc.ticks} y={y} x1={0} x2={W} />
            {#if sel != null}<line class="cur" x1={X(sel)} x2={X(sel)} y1="0" y2="100" />{/if}
            <path class="nrm" d={path(days, 'normal', y)} data-normal-line />
            {#if sec && sc2}<path class="l2" d={path(sec, 'v', y2)} />{/if}
            <path class="one" d={path(days, 'v', y)} />
          </svg>
          {#each days as d, i (d.day)}
            {#if d.v != null}
              <i class="dot" class:on={sel === i} style:left={left(i, days.length)} style:bottom="{fracOf(d.v, sc) * 88 + 6}%"></i>
              {#if days.length <= LABEL_MAX}<span class="lab num" style:left={left(i, days.length)} style:bottom="{fracOf(d.v, sc) * 88 + 6}%" data-point-label>{fmt(open, d.v)}</span>{/if}
            {/if}
          {/each}
        </div>
        {#if sec && sc2}<YTicks ticks={sc2.ticks} y={y2} h={100} text={tick(second, sc2)} unit={unitOf(second)} side="right" color="var(--warn)" />{/if}
        <div class="xs num" aria-hidden="true" data-xdates>
          {#each n === 7 ? days.map((_, i) => i) : [0, 10, 20, 29] as i (i)}<span style:left={left(i, days.length)} class:first={n !== 7 && i === 0} class:last={n !== 7 && i === days.length - 1}>{i === days.length - 1 ? t('today') : dm(days[i].day)}</span>{/each}
        </div>
      </div>
      <p class="key"><span><i class="l1"></i>{t(PART_NAMES[open])}</span><span><i class="l0"></i>{t('Normal|part')}</span>{#if sec}<span><i class="l2"></i>{t(PART_NAMES[second])}</span>{/if}</p>
    {/if}
  </ChartSheet>
{/if}

<style>
  .parts {
    margin: 0;
    padding: 0 8px;
    list-style: none;
  }
  .parts li {
    border-top: 1px solid var(--line);
  }
  .parts li:first-child {
    border-top: 0;
  }
  .row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 70px auto 16px;
    align-items: center;
    gap: 2px 10px;
    width: 100%;
    min-height: 56px;
    padding: 10px 8px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .row:hover {
    background: var(--paper-2);
  }
  .row b {
    grid-column: 1;
  }
  .row .tx {
    grid-column: 1;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .mini {
    grid-area: 1 / 2 / 3 / 3;
    width: 70px;
    height: 26px;
    overflow: visible;
  }
  .mini path {
    fill: none;
    stroke: var(--ink-3);
    stroke-width: 1.5;
    vector-effect: non-scaling-stroke;
    stroke-linejoin: round;
  }
  .pt {
    grid-area: 1 / 3 / 3 / 4;
    min-width: 2.4em;
    text-align: right;
    font-weight: 700;
  }
  .up {
    color: var(--ok);
  }
  .down {
    color: var(--bad);
  }
  .row :global(.cv) {
    grid-area: 1 / 4 / 3 / 5;
    color: var(--ink-3);
  }
  .hint {
    margin: 6px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .sum {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .sum span {
    display: grid;
    gap: 2px;
    padding: 8px 10px;
    border-radius: 10px;
    background: var(--paper-2);
  }
  .sum small {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .sum b {
    font-size: var(--fs-sub);
  }
  .why {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
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
    align-items: center;
    gap: 6px;
  }
  .chips small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
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
    border-color: var(--warn);
    color: var(--ink);
  }
  .chip i {
    width: 14px;
    height: 0;
    border-top: 2px dashed var(--warn);
  }
  .g {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    row-gap: 6px;
    border-radius: 6px;
    outline-offset: 2px;
  }
  .g.with2 {
    grid-template-columns: auto minmax(0, 1fr) auto;
  }
  .g:focus-visible {
    outline: var(--focus-ring);
  }
  .p {
    position: relative;
    height: 150px;
    touch-action: pan-y;
    cursor: pointer;
  }
  svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .p path {
    fill: none;
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
    stroke-linejoin: round;
  }
  .one {
    stroke: var(--hi);
  }
  .nrm {
    stroke: var(--ink-3) !important;
    stroke-width: 1.5 !important;
    stroke-dasharray: 5 4;
  }
  .p .l2 {
    stroke: var(--warn);
    stroke-dasharray: 4 3;
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
    background: var(--hi);
    transform: translate(-50%, 50%);
    pointer-events: none;
  }
  .dot.on {
    width: 14px;
    height: 14px;
  }
  .lab {
    position: absolute;
    transform: translate(-50%, -10px);
    color: var(--ink);
    font-size: var(--fs-tiny);
    font-weight: 600;
    white-space: nowrap;
    pointer-events: none;
  }
  .xs {
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
  .key {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .key span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .key i {
    width: 16px;
    height: 0;
    border-top: 2px solid var(--hi);
  }
  .key i.l0 {
    border-top: 2px dashed var(--ink-3);
  }
  .key i.l2 {
    border-top: 2px dashed var(--warn);
  }
</style>
