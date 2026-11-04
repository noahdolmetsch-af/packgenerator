<script>
  /**
   * «Diagramme zum Antippen» K4 (Noah 27.10.2026 «1-5 a», answer 4a): the Tour-Bereitschaft on «Form und
   * Erholung» as one chart. The resting pulse of the 7 days before a tour and of each tour day, counted from
   * day 1, with your normal as a band; days still to come stay open; your last tours lie over the same days
   * (each can be switched off). A labelled axis (charts/axis.js), the number at each point of this tour.
   * - Pointing shows the day in the line above (Readout), for this tour and the earlier ones; ← → too.
   * - A tap or Enter opens the day: the date, resting pulse against your normal, sleep, and the same day of
   *   the earlier tours; «Day before» / «Next day».
   * - «Als Tabelle»: the days as rows.
   * f: formOf() of the page (tour, past, table); today: «YYYY-MM-DD».
   */
  import { niceScale, fracOf, tickText, minuteText, LABEL_MAX } from '../../charts/axis.js';
  import YTicks from '../../charts/YTicks.svelte';
  import GridLines from '../../charts/GridLines.svelte';
  import Readout from '../../charts/Readout.svelte';
  import DataTable from '../../charts/DataTable.svelte';
  import ChartSheet from '../../charts/ChartSheet.svelte';
  import Seg from '../../ui/Seg.svelte';
  import { indexAt, stepKey } from '../../charts/pick.js';
  import { rhrNormal } from './zeitraum.js';
  import { tourDays, relAxis, atRel, relText } from './tourtage.js';
  import { dm } from '../garmin/words.js';
  import { t, tn, num, locale } from '../../i18n.svelte.js';

  let { f, today } = $props();

  const PAST_COLORS = ['var(--warn)', 'var(--ink-3)', 'var(--bad)'];
  const now = $derived(f.tour ? { key: 'now', name: f.tour.trip.title || t('Tour'), color: 'var(--hi)', days: tourDays(f.tour.trip, f.table, today) } : null);
  const past = $derived(f.past.map((p, i) => ({ key: `p${i}`, name: p.trip.title || t('Tour'), from: p.days[0]?.day, color: PAST_COLORS[i % PAST_COLORS.length], days: tourDays(p.trip, f.table, today) })));
  const lines = $derived([...(now ? [now] : []), ...past]);
  let off = $state({});
  const shown = $derived(lines.filter((l) => !off[l.key]));
  const rels = $derived(relAxis(lines.map((l) => l.days)));
  const n = $derived(rels.length);
  const normal = $derived(rhrNormal(f.table, today));

  let view = $state('chart');
  let sel = $state(null);
  let open = $state(null);

  const vals = $derived(shown.flatMap((l) => l.days.map((d) => d.rhr)).filter(Number.isFinite));
  const sc = $derived(niceScale([...vals, ...(normal ? [normal.lo, normal.hi] : []), ...(vals.length ? [Math.min(...vals) - 2, Math.max(...vals) + 2] : [])], { count: 3 }));
  const y = $derived((v) => 94 - fracOf(v, sc) * 88);
  const W = $derived(Math.max(1, n) * 10);
  const X = (i) => i * 10 + 5;
  const start = $derived(rels.indexOf(1));
  const path = (l) => {
    let d = '';
    let up = true;
    rels.forEach((r, i) => {
      const v = atRel(l.days, r);
      if (!Number.isFinite(v)) return void (up = true);
      d += `${up ? 'M' : 'L'}${X(i)},${y(v).toFixed(2)}`;
      up = false;
    });
    return d;
  };
  const left = (i) => `${((i + 0.5) / n) * 100}%`;
  const relName = (r) => (r > 0 ? t('Day {n}', { n: r }) : tn(-r, '{n} day before', '{n} days before'));
  const dateOf = (l, r) => l.days.find((d) => d.rel === r)?.day ?? null;
  const longDay = (d) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }) : '');
  const bpm = (v) => (v == null ? '–' : `${num(v)} bpm`);
  const futureAt = (r) => !!now?.days.find((d) => d.rel === r)?.future;

  // without a choice the line above shows today on a running tour, else day 1
  const todayIdx = $derived.by(() => {
    const d = now?.days.find((x) => x.day === today);
    return d ? rels.indexOf(d.rel) : Math.max(0, start);
  });
  const shownSel = $derived(sel ?? (n ? todayIdx : null));
  const ro = $derived.by(() => {
    if (shownSel == null) return null;
    const r = rels[shownSel];
    return {
      title: relName(r),
      items: shown.map((l) => ({ label: l.name, value: futureAt(r) && l === now ? t('still to come') : bpm(atRel(l.days, r)), color: l.color })),
    };
  });

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
  function toggle(k) {
    const next = { ...off, [k]: !off[k] };
    if (lines.some((l) => !next[l.key])) off = next; // one line always stays
  }

  const table = $derived({
    head: [t('Day'), ...shown.map((l) => l.name)],
    rows: rels.map((r) => ({ key: String(r), cells: [relName(r), ...shown.map((l) => (futureAt(r) && l === now ? '…' : atRel(l.days, r) != null ? num(atRel(l.days, r)) : '–'))] })),
  });
  const normWord = (v) => {
    if (v == null || !normal) return '';
    const vars = { a: num(normal.lo), b: num(normal.hi) };
    return v > normal.hi ? t('above your normal ({a}–{b})', vars) : v < normal.lo ? t('below your normal ({a}–{b})', vars) : t('in your normal ({a}–{b})', vars);
  };
  const or = $derived(open == null ? null : rels[open]);
</script>

<div class="ft" data-chart="tourdays">
  {#if lines.length > 1}
    <div class="chips" role="group" aria-label={t('Show|layer')}>
      {#each lines as l (l.key)}
        <button type="button" class="chip" aria-pressed={!off[l.key]} onclick={() => toggle(l.key)} data-tour-line={l.key}>
          <i style:background={l.color}></i>{l.name}{#if l.from}<small class="num">{dm(l.from)}</small>{/if}
        </button>
      {/each}
    </div>
  {/if}
  <div class="top">
    <Seg small full={false} label={t('Show as')} value={view} onchange={(v) => (view = v)} options={[{ key: 'chart', name: t('Chart|table') }, { key: 'table', name: t('As table') }]} />
  </div>

  {#if view === 'table'}
    <DataTable head={table.head} rows={table.rows} limit={30} />
  {:else}
    {#if ro}<Readout title={ro.title} items={ro.items} />{/if}
    <p class="rl"><b>{t('Resting pulse (bpm)')}</b>{#if normal}<span>{t('Band = your normal {a}–{b}', { a: num(normal.lo), b: num(normal.hi) })}</span>{/if}</p>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div class="g" role="group" tabindex="0" aria-label={t('Resting pulse before and during the tour, {n} days', { n })} aria-roledescription={t('chart')} aria-keyshortcuts="ArrowLeft ArrowRight Home End Enter" onkeydown={key} data-tour-plot data-n={n}>
      <YTicks ticks={sc.ticks} y={y} h={100} text={(v) => tickText(v, sc.step, num)} width={40} />
      <div class="p" onpointermove={move} onpointerdown={move} onpointerleave={leave} onclick={tap} role="presentation">
        <svg viewBox="0 0 {W} 100" preserveAspectRatio="none" aria-hidden="true">
          {#if start >= 0}<rect class="tz" x={start * 10} width={W - start * 10} y="0" height="100" data-tour-zone />{/if}
          {#if normal}<rect class="band" x="0" width={W} y={y(normal.hi)} height={Math.max(0.5, y(normal.lo) - y(normal.hi))} data-normal />{/if}
          <GridLines ticks={sc.ticks} y={y} x1={0} x2={W} />
          {#if start >= 0}<line class="st" x1={start * 10} x2={start * 10} y1="0" y2="100" />{/if}
          {#if sel != null}<line class="cur" x1={X(sel)} x2={X(sel)} y1="0" y2="100" />{/if}
          {#each shown.toReversed() as l (l.key)}<path d={path(l)} style:stroke={l.color} class:main={l === now} />{/each}
        </svg>
        {#if start >= 0}<span class="sl" style:left="{(start / n) * 100}%">{t('Start|tour')}</span>{/if}
        {#if now && !off.now}
          {#each rels as r, i (r)}
            {@const v = atRel(now.days, r)}
            {#if v != null}
              <i class="dot" class:on={sel === i} style:left={left(i)} style:bottom="{fracOf(v, sc) * 88 + 6}%"></i>
              {#if n <= LABEL_MAX}<span class="lab num" style:left={left(i)} style:bottom="{fracOf(v, sc) * 88 + 6}%" data-point-label>{num(v)}</span>{/if}
            {:else if futureAt(r)}
              <i class="open" style:left={left(i)} data-open-day></i>
            {/if}
          {/each}
        {/if}
      </div>
      <div class="xs num" aria-hidden="true" data-xdates>
        {#each rels as r, i (r)}{#if r === -7 || r === -4 || r === -1 || r > 0}<span style:left={left(i)} class:in={r > 0}>{relText(r)}</span>{/if}{/each}
      </div>
    </div>
    <p class="key">{t('Numbers below: days before the tour (−) and tour days. Point at a day for the numbers, tap it for the whole day.')}</p>
  {/if}
</div>

{#if or != null}
  <ChartSheet kicker={t('Tour readiness')} title={relName(or)} onclose={() => (open = null)} onprev={open > 0 ? () => open-- : null} onnext={open < n - 1 ? () => open++ : null} prevLabel={t('Day before')} nextLabel={t('Next day')}>
    <dl class="vals" data-tour-sheet>
      {#each lines as l (l.key)}
        {@const d = l.days.find((x) => x.rel === or)}
        <div>
          <dt><i style:background={l.color}></i><span>{l.name}<small>{longDay(d?.day ?? dateOf(l, or))}</small></span></dt>
          <dd class="num">
            {#if d?.future}{t('still to come')}{:else}{bpm(d?.rhr)} <small>{normWord(d?.rhr)}</small>{#if d?.sleep != null}<small>{t('Sleep|metric')} {minuteText(d.sleep)}</small>{/if}{/if}
          </dd>
        </div>
      {/each}
    </dl>
  </ChartSheet>
{/if}

<style>
  .ft {
    display: grid;
    gap: 10px;
    min-width: 0;
  }
  .top {
    display: flex;
    justify-content: flex-end;
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
  .chip small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .rl {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 2px 10px;
    margin: 0;
    font-size: var(--fs-small);
  }
  .rl span {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .g {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr);
    row-gap: 6px;
    border-radius: 6px;
    outline-offset: 2px;
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
  path {
    fill: none;
    stroke-width: 1.5;
    stroke-dasharray: 4 3;
    vector-effect: non-scaling-stroke;
    stroke-linejoin: round;
  }
  path.main {
    stroke-width: 2.5;
    stroke-dasharray: none;
  }
  .band {
    fill: var(--paper-2);
  }
  .tz {
    fill: var(--hi-soft, var(--paper-2));
    opacity: 0.5;
  }
  .st {
    stroke: var(--hi);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }
  .sl {
    position: absolute;
    top: 0;
    padding-left: 4px;
    color: var(--hi);
    font-size: var(--fs-tiny);
    pointer-events: none;
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
  .open {
    position: absolute;
    bottom: 6%;
    width: 10px;
    height: 10px;
    border: 2px dashed var(--ink-3);
    border-radius: 50%;
    transform: translateX(-50%);
    pointer-events: none;
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
  .xs span.in {
    color: var(--hi);
    font-weight: 600;
  }
  .key {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .vals {
    display: grid;
    margin: 0;
  }
  .vals div {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    min-height: 52px;
    border-bottom: 1px solid var(--line);
  }
  .vals dt {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ink-2);
  }
  .vals dt span {
    display: grid;
  }
  .vals dt i {
    flex: none;
    width: 14px;
    height: 4px;
    border-radius: 2px;
  }
  .vals small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    font-weight: 400;
  }
  .vals dd {
    margin: 0;
    font-weight: 600;
    text-align: right;
  }
</style>
