<script>
  /**
   * «Tour-Auswertung» (Noah 20.10.2026 «3a und b»): on the tour page under «Werte», what the Garmin shows
   * beyond the values above: the stops, NP and the best 1, 2, 5, 10 and 20 minutes of power and heart
   * rate, the resting heart rate from Fitbit on the tour's days, and every ride as a dot (resting heart
   * rate against NP or Ø heart rate) to see a connection. Observation only.
   *
   * When the details of an activity are not here yet (or are of an older kind), they are fetched once per
   * visit from Strava, with the finer route line for the map (at most a few calls).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../../db.js';
  import { t, tn, num } from '../../i18n.svelte.js';
  import { hasDetail } from '../../training.js';
  import { tourValues, restOfTour, restDots, corrOf, corrWord } from '../tourana.js';
  import { longTimeS, n0, dates, DASH } from '../../review/fmt.js';
  import Help from '../../ui/Help.svelte';
  import { niceScale, LABEL_MAX } from '../../charts/axis.js';
  import GridLines from '../../charts/GridLines.svelte';
  import YTicks from '../../charts/YTicks.svelte';
  import Readout from '../../charts/Readout.svelte';
  import DataTable from '../../charts/DataTable.svelte';
  import ChartSheet from '../../charts/ChartSheet.svelte';
  import { stepKey } from '../../charts/pick.js';
  import Seg from '../../ui/Seg.svelte';
  import { tourHref } from '../tour.js';

  /** d: the tour (tourdata.js loadTour). */
  let { d } = $props();

  const vals = $derived(tourValues(d?.acts ?? []));
  const healthQ = liveQuery(() => db.healthDays.toArray().catch(() => []));
  const actsQ = liveQuery(() => db.activities.toArray().catch(() => []));
  const rest = $derived($healthQ ? restOfTour($healthQ, d?.row?.day, d?.row?.endDay ?? d?.row?.day) : null);
  const dotsOf = $derived($healthQ && $actsQ ? restDots($actsQ, $healthQ) : { mode: 'hr', dots: [] });
  const r = $derived(corrOf(dotsOf.dots));
  const word = $derived(corrWord(r));
  const mine = $derived(new Set((d?.acts ?? []).map((a) => String(a.id))));

  // the pauses in words (Noah 27.10.2026 «1a», was dd:hh:mm:ss)
  const secs = longTimeS;
  const stopLine = $derived.by(() => {
    const ti = vals.time;
    if (ti.stops != null) return ti.stops ? `${tn(ti.stops, '{n} stop', '{n} stops')} · ${secs(ti.stopS)}` : t('none|stops');
    return ti.still ? secs(ti.still) : DASH;
  });

  /* ---- the details and the finer line, once per visit ---- */
  let asked = '';
  let fetching = $state(false);
  $effect(() => {
    const acts = d?.acts ?? [];
    const k = acts.map((a) => a.id).join(',');
    if (!k || asked === k) return;
    asked = k;
    const open = acts.filter((a) => !hasDetail(a) && (a.hrAvg != null || a.wDevice || a.km > 0)).slice(0, 4);
    const noLine = acts.filter((a) => !a.lineFine).slice(0, 4);
    if (!open.length && !noLine.length) return;
    (async () => {
      const c = await import('../../strava/client.svelte.js');
      if (!c.strava.key) return;
      fetching = true;
      try {
        for (const a of open) await c.loadDetail(db, a.id).catch(() => null);
        for (const a of noLine) await c.loadLine(db, a.id).catch(() => null);
      } finally {
        fetching = false;
      }
    })();
  });

  /* ---- the dots: resting heart rate (x) against NP or Ø heart rate (y) ---- */
  const W = 420;
  const H = 170;
  const PAD = { l: 10, r: 10, t: 10, b: 28 };
  const plot = $derived.by(() => {
    const ds = dotsOf.dots;
    if (ds.length < 3) return null;
    const xs = ds.map((p) => p.rest);
    const ys = ds.map((p) => p.y);
    // «Genaue Werte» (Noah 27.10.2026): both axes in round steps with grid lines
    // a little room around the dots, so none sits on the edge
    const xs0 = niceScale([Math.min(...xs) - 1, Math.max(...xs) + 1], { count: 3 });
    const ys0 = niceScale([Math.min(...ys) * 0.97, Math.max(...ys) * 1.03], { count: 3 });
    const x0 = xs0.lo;
    const x1 = xs0.hi;
    const y0 = ys0.lo;
    const y1 = ys0.hi;
    const X = (v) => PAD.l + ((v - x0) / (x1 - x0 || 1)) * (W - PAD.l - PAD.r);
    const Y = (v) => H - PAD.b - ((v - y0) / (y1 - y0 || 1)) * (H - PAD.t - PAD.b);
    const xt = xs0.ticks;
    const yt = ys0.ticks;
    return {
      pts: ds.map((p) => ({ ...p, x: X(p.rest), y2: Y(p.y), me: mine.has(p.id) })).sort((a, b) => a.me - b.me),
      xt: xt.map((v) => ({ v, x: X(v) })),
      yt: yt.map((v) => ({ v, y: Y(v) })),
      Y,
    };
  });
  const yName = $derived(dotsOf.mode === 'np' ? t('NP') : t('Ø HR'));

  /* ---- «Diagramme zum Antippen» (Noah 27.10.2026): the exact numbers of a dot, a tap opens its ride ---- */
  const yUnit = $derived(dotsOf.mode === 'np' ? 'W' : t('bpm'));
  // left to right by resting heart rate: the order of the arrow keys and of «‹ ›» in the window
  const order = $derived(plot ? [...plot.pts].sort((a, b) => a.rest - b.rest || b.y - a.y || a.day.localeCompare(b.day)) : []);
  let pick = $state(null);
  let open = $state(null);
  let view = $state('chart');
  let svgEl = $state();
  const fallback = $derived(Math.max(0, order.findIndex((p) => p.me)));
  const cur = $derived(order[pick ?? fallback] ?? null);
  const readout = $derived(
    cur
      ? {
          title: cur.me ? `${dates(cur.day)} · ${t('this tour')}` : dates(cur.day),
          items: [
            { label: t('Resting heart rate'), value: `${n0(cur.rest)} ${t('bpm')}` },
            { label: yName, value: `${n0(cur.y)} ${yUnit}` },
          ],
        }
      : null,
  );
  const table = $derived({
    head: [t('Date'), `${t('Resting heart rate')} (${t('bpm')})`, `${yName} (${yUnit})`],
    rows: [...order].sort((a, b) => b.day.localeCompare(a.day)).map((p) => ({ key: p.id, cells: [dates(p.day), n0(p.rest), n0(p.y)] })),
  });
  /** The dot nearest to the finger or the mouse, in the svg's own units (it scales evenly). */
  function nearest(e) {
    const r = svgEl?.getBoundingClientRect();
    if (!r || !(r.width > 0) || !order.length) return null;
    const k = W / r.width;
    const x = (e.clientX - r.left) * k;
    const y = (e.clientY - r.top) * k;
    let best = null;
    let bd = Infinity;
    order.forEach((p, i) => {
      const dd = (p.x - x) ** 2 + (p.y2 - y) ** 2;
      if (dd < bd) (bd = dd), (best = i);
    });
    return bd <= 40 ** 2 ? best : null;
  }
  function point(e) {
    const i = nearest(e);
    if (i != null) pick = i;
  }
  function tap(e) {
    const i = nearest(e);
    if (i != null) (pick = i), (open = i);
  }
  function key(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      if (cur) open = order.indexOf(cur);
      e.preventDefault();
      return;
    }
    const i = stepKey(e.key, pick ?? fallback, order.length);
    if (i == null) return;
    pick = i;
    e.preventDefault();
  }
  const sheet = $derived(open == null ? null : order[open]);
  const corrText = $derived.by(() => {
    if (!word) return t('From 5 rides with a resting heart rate the app shows whether the two go together.');
    if (word.strength === 'none') return t('So far no connection to see (r = {r}).', { r: r.toFixed(2) });
    const s = word.strength === 'weak' ? t('a weak connection') : t('a clear connection');
    const dir = dotsOf.mode === 'np' ? (word.up ? t('with a higher resting heart rate your NP was higher') : t('with a higher resting heart rate your NP was lower')) : word.up ? t('with a higher resting heart rate your Ø heart rate was higher') : t('with a higher resting heart rate your Ø heart rate was lower');
    return t('So far {s}: {dir} (r = {r}, {n} rides).', { s, dir, r: r.toFixed(2), n: dotsOf.dots.length });
  });
</script>

<div class="ana" data-tour-analysis>
  <h3 class="h3">{t('Like on the Garmin')}<Help label={t('Like on the Garmin')} text={t('The values your Garmin records, from Strava. The best minutes are the highest average over that time in the ride.')} /></h3>
  <dl class="vals">
    <div class="vc" data-ana="stops"><dt>{t('Stops')}</dt><dd class="num">{stopLine}</dd></div>
    {#if vals.power}<div class="vc" data-ana="np"><dt>{t('NP')}<Help label={t('NP')} text={t('Normalized Power: the power your body felt, with the hard bits weighing more than the easy ones.')} /></dt><dd class="num">{n0(vals.power.np)}{#if vals.power.np != null}{' '}<small>W</small>{/if}</dd></div>{/if}
  </dl>

  {#if vals.power || vals.hr}
    <table class="best" data-ana-best>
      <caption>{t('Best minutes')}</caption>
      <thead><tr><th scope="col"></th>{#each vals.power?.best ?? vals.hr.best as b (b.s)}<th scope="col" class="num">{t('{n} min', { n: b.min })}</th>{/each}</tr></thead>
      <tbody>
        {#if vals.power}<tr data-best="power"><th scope="row">{t('Power')} <small>W</small></th>{#each vals.power.best as b (b.s)}<td class="num">{n0(b.v)}</td>{/each}</tr>{/if}
        {#if vals.hr}<tr data-best="hr"><th scope="row">{t('Heart rate')} <small>{t('bpm')}</small></th>{#each vals.hr.best as b (b.s)}<td class="num">{n0(b.v)}</td>{/each}</tr>{/if}
      </tbody>
    </table>
    {#if vals.missing.length}<p class="tp-muted tp-small" data-ana-missing>{fetching ? t('Fetching the details from Strava …') : t('Some best minutes come with the next fetch from Strava.')}</p>{/if}
  {:else}
    <p class="tp-muted tp-small">{t('No power and no heart rate on this tour.')}</p>
  {/if}

  <h3 class="h3">{t('Resting heart rate (Fitbit)')}</h3>
  {#if rest}
    <ul class="rest" data-ana-rest>
      {#each rest.days.filter((x) => x.v != null) as x (x.day)}<li><span>{dates(x.day)}</span><b class="num">{n0(x.v)} <small>{t('bpm')}</small></b></li>{/each}
    </ul>
    {#if rest.normal != null}<p class="tp-small" data-ana-normal>{rest.diff === 0 ? t('As your normal ({n} bpm).', { n: rest.normal }) : rest.diff > 0 ? t('{d} bpm above your normal ({n}).', { d: rest.diff, n: rest.normal }) : t('{d} bpm below your normal ({n}).', { d: -rest.diff, n: rest.normal })}</p>{/if}
  {:else}
    <p class="tp-muted tp-small" data-ana-norest>{t('No resting heart rate for these days. It comes from Fitbit: Ich › Verbindungen.')}</p>
  {/if}

  {#if plot}
    <figure class="dots" data-ana-dots={dotsOf.mode}>
      <div class="vw"><Seg small full={false} label={t('Show as')} value={view} onchange={(v) => (view = v)} options={[{ key: 'chart', name: t('Chart|table') }, { key: 'table', name: t('As table') }]} /></div>
      {#if view === 'table'}
      <DataTable head={table.head} rows={table.rows} />
      {:else}
      {#if readout}<Readout title={readout.title} items={readout.items} />{/if}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions, a11y_click_events_have_key_events -->
      <div class="plotrow">
      <YTicks ticks={plot.yt.map((g) => g.v)} y={plot.Y} h={H} text={(v) => num(v)} unit={yUnit} />
      <svg bind:this={svgEl} viewBox="0 0 {W} {H}" role="img" tabindex="0" aria-label={t('Resting heart rate against {y} on {n} rides', { y: yName, n: dotsOf.dots.length })} onpointermove={point} onpointerdown={point} onclick={tap} onkeydown={key}>
        <GridLines ticks={plot.yt.map((g) => g.v)} y={plot.Y} x1={PAD.l} x2={W - PAD.r} />
        {#each plot.xt as g (g.v)}<text class="tick" x={g.x} y={H - PAD.b + 14} text-anchor="middle" data-ana-xt>{num(g.v)}</text>{/each}
        {#each plot.pts as p (p.id)}<circle cx={p.x} cy={p.y2} r={p.me ? 6 : 3.5} class:me={p.me} class:on={cur?.id === p.id} data-ana-dot={p.id}></circle>{#if plot.pts.length <= LABEL_MAX}<text class="lab" x={p.x} y={p.y2 - 9} text-anchor="middle" data-ana-lab>{n0(p.y)}</text>{/if}{/each}
      </svg>
      </div>
      <p class="tp-muted tp-small">{t('Point at a dot for its numbers, tap it for the ride.')}</p>
      {/if}
      <figcaption class="tp-small">
        <span class="tp-muted">{t('Across: resting heart rate in the morning (bpm). Up: {y}.', { y: dotsOf.mode === 'np' ? t('NP (W)') : t('Ø HR (bpm)') })}{#if [...mine].some((id) => plot.pts.some((p) => p.id === id && p.me))}{' '}{t('The big dot is this tour.')}{/if}</span>
        <span data-ana-corr>{corrText}</span>
      </figcaption>
    </figure>
  {/if}
  {#if sheet}
    <ChartSheet kicker={t('Ride|dots')} title={dates(sheet.day)} onclose={() => (open = null)} onprev={open > 0 ? () => (open--, (pick = open)) : null} onnext={open < order.length - 1 ? () => (open++, (pick = open)) : null} prevLabel={t('Dot to the left')} nextLabel={t('Dot to the right')}>
      <dl class="vals" data-ana-sheet>
        <div class="vc"><dt>{t('Resting heart rate')}</dt><dd class="num">{n0(sheet.rest)} <small>{t('bpm')}</small></dd></div>
        <div class="vc"><dt>{yName}</dt><dd class="num">{n0(sheet.y)} <small>{yUnit}</small></dd></div>
      </dl>
      {#if sheet.me}<p class="tp-small">{t('This is the tour you are looking at.')}</p>{:else}<p><a class="btn" href={tourHref(`a:${sheet.id}`)} onclick={() => (open = null)} data-ana-open>{t('Open this ride')}</a></p>{/if}
    </ChartSheet>
  {/if}
</div>

<style>
  .ana {
    display: grid;
    gap: var(--sp-2);
    margin-top: var(--sp-3);
    padding-top: var(--sp-3);
    border-top: 1px solid var(--line);
  }
  .h3 {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 0;
  }
  .vals {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 10px 16px;
    margin: 0;
  }
  .vc dt {
    display: flex;
    align-items: center;
    gap: 2px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .vc dd {
    margin: 2px 0 0;
    font-weight: 600;
  }
  .best {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-small);
  }
  .best caption {
    margin-bottom: 4px;
    color: var(--ink-2);
    text-align: left;
  }
  .best th,
  .best td {
    padding: 6px 3px;
    white-space: nowrap;
    border-bottom: 1px solid var(--line);
    text-align: right;
  }
  .best th[scope='row'] {
    text-align: left;
    font-weight: 500;
  }
  .best td {
    font-weight: 600;
  }
  .rest {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .rest li {
    display: flex;
    gap: 8px;
    align-items: baseline;
  }
  .rest span {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .dots {
    margin: 0;
  }
  .plotrow {
    display: flex;
    max-width: 600px;
  }
  .dots svg {
    display: block;
    flex: 1;
    min-width: 0;
    height: auto;
  }
  .tick {
    fill: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  circle {
    fill: var(--ink-3);
    opacity: 0.75;
  }
  circle.me {
    fill: var(--accent);
    opacity: 1;
    stroke: var(--paper);
    stroke-width: 2;
  }
  circle.on {
    stroke: var(--ink);
    stroke-width: 2;
    opacity: 1;
  }
  .lab {
    fill: var(--ink-2);
    font-size: var(--fs-tiny);
    pointer-events: none;
  }
  .dots svg {
    cursor: pointer;
    touch-action: pan-y;
  }
  .dots svg:focus:not(:focus-visible) {
    outline: none;
  }
  .vw {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 6px;
  }
  figcaption {
    display: grid;
    gap: 2px;
    margin-top: 4px;
  }
</style>
