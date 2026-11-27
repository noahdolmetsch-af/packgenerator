<script>
  import { readLite } from '../lib/actlite.js';
  /**
   * «Auswerten neu» Teil 2 (Noah 24.11.2026 «1b 2a 3b 4a 5a», Entwurf B «Wochenbericht»): the tab «Woche» of Auswerten (#/auswerten/woche).
   * Content first: one sentence about the period (hours, units, days, against the period before), the numbers, the hours by
   * sport as bars (day by day in a week, week by week in a month, month by month in a year), how you recovered in the period
   * against YOUR OWN usual range, and the longest units. The period is the switch of Auswerten (Woche, Monat, Jahr, Alles, own).
   * 27.11.2026 (Noah «3a»): the card «Haken-Verlauf» (flow/HakenVerlauf.svelte, which activity on which day) stands on top of the page, with its own span, and «Was auffällt» (flow/HakenHinweise.svelte, 4a) under it.
   * The hours are the same as in the Sports year (flow/einheiten.js, flow/sportjahr.js). Only looking, nothing is judged or saved.
   */
  import { liveQuery } from 'dexie';
  import { Dumbbell, ChevronRight } from '@lucide/svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import PeriodBar from '../lib/flow/PeriodBar.svelte';
  import HakenVerlauf from '../lib/flow/HakenVerlauf.svelte';
  import HakenHinweise from '../lib/flow/HakenHinweise.svelte';
  import BarChart from '../lib/charts/BarChart.svelte';
  import NormalBand from '../lib/auswerten/NormalBand.svelte';
  import TipLine from '../lib/pageinfo/TipLine.svelte';
  import PageMore from '../lib/pageinfo/PageMore.svelte';
  import PageTiles from '../lib/sk/PageTiles.svelte';
  import { period, enterPage } from '../lib/flow/zeitraum.svelte.js';
  import { rangeOf, labelOf } from '../lib/flow/zeitraum.js';
  import { db } from '../lib/db.js';
  import { loadTable } from '../lib/messwerte-data.js';
  import { einheiten, looseLabel } from '../lib/flow/einheiten.js';
  import { USUAL_KEY, usualMap } from '../lib/flow/usualmin.js';
  import { TICKS_KEY, prefsOf } from '../lib/stravaticks.js';
  import { training, windowOf, totals, bySport, colourOf, grainOf, buckets } from '../lib/flow/sportjahr.js';
  import { prevRange, changePct, periodRecovery, longest } from '../lib/auswerten/woche.js';
  import { shown } from '../lib/messwerte.js';
  import { PART_NAMES } from '../lib/flow/form/words.js';
  import { actName } from '../lib/flow/ui.svelte.js';
  import { localDay } from '../lib/localday.js';
  import { t, tn, num, locale } from '../lib/i18n.svelte.js';
  import { hoursMin } from '../lib/charts/exact.js';
  import { sportColour, OTHER } from '../lib/charts/sportcolors.js';
  import { noDataText, firstDayOf } from '../lib/charts/nodata.js';
  import { sentencesOf } from '../lib/charts/sentence.js';
  import '../lib/ich/ich.css';

  enterPage('woche');
  const today = localDay();
  const q = liveQuery(async () => {
    const [log, activities, acts, usual, ticks, table] = await Promise.all([db.flowLog.toArray(), readLite(db, (T) => T.toArray()), db.flowActs.toArray(), db.settings.get(USUAL_KEY), db.settings.get(TICKS_KEY), loadTable(db)]);
    return { log, activities, acts, usual: usualMap(usual?.value), map: prefsOf(ticks?.value).map, table };
  });
  const d = $derived($q);
  const units = $derived(d ? training(einheiten({ log: d.log, activities: d.activities, acts: d.acts, usual: d.usual, map: d.map })) : []);

  const mode = $derived(period.mode);
  const win = $derived(windowOf(rangeOf(period, today), units, today));
  const inWin = $derived(units.filter((u) => u.day >= win.from && u.day <= win.to));
  const before = $derived(prevRange(period, today));
  const inBefore = $derived(before ? units.filter((u) => u.day >= before.from && u.day <= before.to) : null);
  const tot = $derived(totals(inWin));
  const totBefore = $derived(inBefore ? totals(inBefore) : null);
  const rows = $derived(bySport(inWin));
  const colours = $derived(colourOf(rows));
  const bars = $derived(buckets(units, mode, win));
  const grain = $derived(grainOf(mode, win));
  const loc = $derived(locale());
  const title = $derived(mode === 'all' ? t('All time') : labelOf(period, today, loc));

  const hrs = (m) => {
    const h = m / 60;
    return h < 10 ? num(Math.round(h * 10) / 10) : num(Math.round(h));
  };
  const dayTxt = (day, o) => new Date(`${day}T12:00:00Z`).toLocaleDateString(loc, { ...o, timeZone: 'UTC' });
  const nameOf = (r) => {
    const act = r.actId ? d?.acts.find((a) => a.id === r.actId) : null;
    return act ? actName(act) : t(looseLabel(r.stravaType ?? String(r.sport).replace(/^strava:/, '')));
  };
  const names = $derived(new Map(rows.map((r) => [r.sport, nameOf(r)])));
  const colour = (sport) => (colours.get(sport) === 'other' ? OTHER : sportColour(sport));
  const legend = $derived([...rows.filter((r) => colours.get(r.sport) !== 'other').map((r) => ({ key: r.sport, name: names.get(r.sport), color: colour(r.sport) })), ...(rows.some((r) => colours.get(r.sport) === 'other') ? [{ key: 'other', name: t('Others'), color: OTHER }] : [])]);

  /* the sentence over the numbers, and the period before in one line */
  const change = $derived(totBefore ? changePct(tot.mins, totBefore.mins) : null);
  const beforeLine = $derived(
    !totBefore || !(totBefore.mins > 0)
      ? ''
      : t('The period before: {h} h in {n} units ({p}).', { h: hrs(totBefore.mins), n: num(totBefore.n), p: change === 0 ? '±0 %' : `${change > 0 ? '+' : '−'}${Math.abs(change)} %` }),
  );

  const bucketTitle = (b) => (grain === 'day' ? dayTxt(b.from, { weekday: 'short', day: 'numeric', month: 'short' }) : grain === 'month' ? dayTxt(b.from, { month: 'long', year: 'numeric' }) : b.key);
  const bucketX = (b, i) => {
    if (grain === 'day') return bars.length <= 7 ? dayTxt(b.from, { weekday: 'short' }) : i % 5 === 0 ? String(Number(b.from.slice(8))) : '';
    if (grain === 'month') return dayTxt(b.from, { month: 'narrow' });
    return b.key;
  };
  const firstDay = $derived(firstDayOf(units));
  const noneOf = (b) => noDataText(b.from, b.to, today, firstDay);
  const cols = $derived(
    bars.map((b, i) => ({
      key: b.key,
      none: noneOf(b),
      x: bucketX(b, i),
      top: b.mins >= 30 ? hrs(b.mins) : '',
      parts: rows.filter((r) => b.parts[r.sport] > 0).map((r) => ({ v: b.parts[r.sport] / 60, color: colour(r.sport) })),
    })),
  );
  const readout = (i) => ({
    title: bucketTitle(bars[i]),
    extra: '',
    items: [{ label: t('Hours'), value: hoursMin(bars[i].mins) }, ...rows.filter((r) => bars[i].parts[r.sport] > 0).slice(0, 4).map((r) => ({ label: names.get(r.sport), value: hoursMin(bars[i].parts[r.sport]), color: colour(r.sport) }))],
  });
  const table = $derived({
    head: [t('Period|sj'), t('Hours'), t('Units')],
    rows: [...bars].reverse().map((b) => ({ key: b.key, cells: [bucketTitle(b), noneOf(b) ? '–' : hoursMin(b.mins), noneOf(b) ? '–' : num(b.n)] })),
  });
  const aria = $derived(bars.map((b) => `${bucketTitle(b)}: ${hrs(b.mins)} h`).join(', '));

  /* recovery of the period against the own usual range */
  const recovery = $derived(d ? periodRecovery(d.table, win, today) : []);
  const UNIT = { hrv: 'ms', rhr: 'bpm', sleep: '' };
  const val = (key, v) => `${shown(key, v, num)}${UNIT[key] ? ` ${UNIT[key]}` : ''}`;
  const PLACE = { below: 'Lower than usual for you', usual: 'Usual for you', above: 'Higher than usual for you' };

  const top = $derived(longest(inWin, 3));
</script>

<div class="wo" data-page="auswerten-woche">
  <header class="ph">
    <h1 class="title">{t('Analysis|place')}</h1>
    <p class="sub">{t('What you did and how you recovered. Only to look at, nothing is graded.')}</p>
  </header>

  {#if d}
    <HakenVerlauf acts={d.acts} log={d.log} {today} />
    <HakenHinweise acts={d.acts} log={d.log} {today} />
  {/if}

  <section class="card blk" aria-label={t('Period')}>
    <PeriodBar {today} hint={false} />
  </section>

  {#if !d}
    <p class="hint" aria-live="polite">{t('Loading…')}</p>
  {:else if !inWin.length}
    <Empty icon={Dumbbell} title={t('Nothing in this period')} text={t('No unit of movement in this period. Tick a sport on Active or connect Strava, and your report fills itself.')} action={{ label: t('To Active'), href: '#/flow' }} />
  {:else}
    <section class="card blk" aria-labelledby="wo-h" data-woche-report>
      <h2 id="wo-h" class="lead">{title ? `${title}: ` : ''}{t('{h} h in {n} units on {d} days', { h: hrs(tot.mins), n: num(tot.n), d: num(tot.days) })}</h2>
      {#if beforeLine}<p class="det" data-woche-before>{beforeLine}</p>{/if}
      <ul class="kpis">
        <li><b class="num" data-woche-hours>{hrs(tot.mins)} h</b><small>{t('Time in motion')}</small></li>
        <li><b class="num">{num(tot.n)}</b><small>{t('Units')}</small></li>
        <li><b class="num">{num(tot.days)}</b><small>{t('Days with training')}</small></li>
        <li><b class="num">{num(tot.sports)}</b><small>{t('Sports')}</small></li>
      </ul>
      {#if tot.nCa > 0}<p class="det">{tn(tot.nCa, 'For {n} unit the time is estimated (about {h} h, «ca.») with the usual duration of the sport.', 'For {n} units the time is estimated (about {h} h, «ca.») with the usual duration of the sport.', { h: hrs(tot.ca) })}</p>{/if}
    </section>

    <section class="card blk" aria-labelledby="wo-chart-h" data-woche-chart>
      <h2 id="wo-chart-h" class="h2">{grain === 'month' ? t('Hours per month') : grain === 'year' ? t('Hours per year') : t('Hours per day')}</h2>
      <p class="det">{t('by sport')}</p>
      <BarChart sentences={sentencesOf(bars.map((b) => ({ label: bucketTitle(b), v: b.mins, none: noneOf(b) })), hoursMin)} id="woche" {cols} {readout} {table} unit="h" label={t('Hours by sport: {list}', { list: aria })} hint={t('Point at a bar for its numbers.')} />
      <ul class="lg" data-woche-legend>
        {#each legend as l (l.key)}<li><i style:background={l.color}></i>{l.name}</li>{/each}
      </ul>
    </section>

    {#if recovery.length}
      <section class="card blk" aria-labelledby="wo-rec-h" data-woche-recovery>
        <h2 id="wo-rec-h" class="h2">{t('How you recovered')}</h2>
        <p class="det">{t('The middle of the period against your own last 12 months. Observation, not a cause.')}</p>
        <ul class="vals">
          {#each recovery as r (r.key)}
            <li data-value={r.key}>
              <div class="tp"><b>{t(PART_NAMES[r.key])}</b><span class="v num">{val(r.key, r.median)}</span></div>
              {#if r.normal}
                <NormalBand normal={r.normal} value={r.median} label="{t(PART_NAMES[r.key])}: {r.place ? t(PLACE[r.place]) : ''}" />
                <p class="det"><b data-place={r.place}>{r.place ? t(PLACE[r.place]) : ''}</b> · {t('Usual: {lo} to {hi}', { lo: shown(r.key, r.normal.q1, num), hi: shown(r.key, r.normal.q3, num) })} · {tn(r.n, '{n} day with a value', '{n} days with a value')}</p>
              {/if}
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    {#if top.length}
      <section class="card blk" aria-labelledby="wo-top-h" data-woche-longest>
        <h2 id="wo-top-h" class="h2">{t('The longest units')}</h2>
        <ul class="top">
          {#each top as u, i (`${u.day}-${i}`)}
            <li><span>{dayTxt(u.day, { weekday: 'short', day: 'numeric', month: 'short' })}</span><b>{names.get(u.sport) ?? u.sport}</b><span class="num">{u.minQuelle === 'ca.' ? 'ca. ' : ''}{hoursMin(Number(u.min))}</span></li>
          {/each}
        </ul>
      </section>
    {/if}
  {/if}

  <p class="old"><a href="#/auswerten/sportjahr" data-sportjahr-link>{t('Sports year')} <ChevronRight size={14} aria-hidden="true" /></a><a href="#/trips/rides">{t('Rides')} <ChevronRight size={14} aria-hidden="true" /></a><a href="#/flow">{t('Tick off today')} <ChevronRight size={14} aria-hidden="true" /></a></p>

  <TipLine page="aktiv" name={t('Analysis|place')} />
  <PageMore page="aktiv" name={t('Analysis|place')} />
  <PageTiles page="flow" />
</div>

<style>
  .wo {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    max-width: 880px;
    margin: 0 auto;
    min-width: 0;
  }
  .ph .sub {
    margin: var(--sp-1) 0 0;
    color: var(--ink-3);
    font: 400 var(--fs-body) / 1.45 var(--font-body);
  }
  .blk {
    padding: var(--sp-4);
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
  }
  .lead {
    margin: 0;
    font: 600 var(--fs-h3, 1.15rem) / 1.3 var(--font-body);
    color: var(--ink);
  }
  .h2 {
    margin: 0;
    font: 600 var(--fs-h3, 1.1rem) / 1.25 var(--font-body);
    color: var(--ink);
  }
  .det {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
  .det b {
    color: var(--ink-2);
    font-weight: 600;
  }
  .kpis {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin: var(--sp-1) 0 0;
    padding: 0;
    list-style: none;
  }
  @media (min-width: 700px) {
    .kpis {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
  .kpis li {
    display: grid;
    gap: 2px;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--paper-2);
  }
  .kpis b {
    font-size: var(--fs-section);
    line-height: 1.1;
  }
  .kpis small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .lg {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .lg li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .lg i {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex: none;
  }
  .vals {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    margin: var(--sp-2) 0 0;
    padding: 0;
    list-style: none;
  }
  .tp {
    display: flex;
    align-items: baseline;
    gap: var(--sp-2);
    margin-bottom: var(--sp-1);
  }
  .tp .v {
    margin-left: auto;
    font: 600 var(--fs-body) / 1 var(--font-body);
  }
  .top {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .top li {
    display: grid;
    grid-template-columns: 6.5em minmax(0, 1fr) auto;
    gap: var(--sp-2);
    padding: 8px 0;
    border-top: 1px solid var(--line);
    font-size: var(--fs-small);
  }
  .top li:first-child {
    border-top: 0;
  }
  .old {
    display: flex;
    flex-wrap: wrap;
    gap: 0 var(--sp-4);
    margin: 0;
    font-size: var(--fs-small);
  }
  .old a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
  }
</style>
