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
  import { t, tn } from '../../i18n.svelte.js';
  import { hasDetail } from '../../training.js';
  import { tourValues, restOfTour, restDots, corrOf, corrWord } from '../tourana.js';
  import { elapsedS, n0, dates, DASH } from '../../review/fmt.js';
  import Help from '../../ui/Help.svelte';

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

  // the pauses as dd:hh:mm:ss (Noah 21.10.2026)
  const secs = elapsedS;
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
  const PAD = { l: 38, r: 10, t: 10, b: 28 };
  const plot = $derived.by(() => {
    const ds = dotsOf.dots;
    if (ds.length < 3) return null;
    const xs = ds.map((p) => p.rest);
    const ys = ds.map((p) => p.y);
    const x0 = Math.min(...xs) - 2;
    const x1 = Math.max(...xs) + 2;
    const y0 = Math.min(...ys) * 0.95;
    const y1 = Math.max(...ys) * 1.05;
    const X = (v) => PAD.l + ((v - x0) / (x1 - x0 || 1)) * (W - PAD.l - PAD.r);
    const Y = (v) => H - PAD.b - ((v - y0) / (y1 - y0 || 1)) * (H - PAD.t - PAD.b);
    const xt = [Math.ceil(x0), Math.round((x0 + x1) / 2), Math.floor(x1)];
    const yt = [Math.ceil(y0), Math.round((y0 + y1) / 2), Math.floor(y1)];
    return {
      pts: ds.map((p) => ({ ...p, x: X(p.rest), y2: Y(p.y), me: mine.has(p.id) })).sort((a, b) => a.me - b.me),
      xt: xt.map((v) => ({ v, x: X(v) })),
      yt: yt.map((v) => ({ v, y: Y(v) })),
    };
  });
  const yName = $derived(dotsOf.mode === 'np' ? t('NP') : t('Ø HR'));
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
      <svg viewBox="0 0 {W} {H}" role="img" aria-label={t('Resting heart rate against {y} on {n} rides', { y: yName, n: dotsOf.dots.length })}>
        {#each plot.yt as g (g.v)}<line class="grid" x1={PAD.l} x2={W - PAD.r} y1={g.y} y2={g.y} /><text class="tick" x={PAD.l - 4} y={g.y + 3} text-anchor="end">{g.v}</text>{/each}
        {#each plot.xt as g (g.v)}<text class="tick" x={g.x} y={H - PAD.b + 14} text-anchor="middle">{g.v}</text>{/each}
        {#each plot.pts as p (p.id)}<circle cx={p.x} cy={p.y2} r={p.me ? 6 : 3.5} class:me={p.me}><title>{dates(p.day)}: {p.rest} · {Math.round(p.y)}</title></circle>{/each}
      </svg>
      <figcaption class="tp-small">
        <span class="tp-muted">{t('Across: resting heart rate in the morning (bpm). Up: {y}.', { y: dotsOf.mode === 'np' ? t('NP (W)') : t('Ø HR (bpm)') })}{#if [...mine].some((id) => plot.pts.some((p) => p.id === id && p.me))}{' '}{t('The big dot is this tour.')}{/if}</span>
        <span data-ana-corr>{corrText}</span>
      </figcaption>
    </figure>
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
  .dots svg {
    display: block;
    width: 100%;
    max-width: 560px;
    height: auto;
  }
  .grid {
    stroke: var(--line);
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
  figcaption {
    display: grid;
    gap: 2px;
    margin-top: 4px;
  }
</style>
