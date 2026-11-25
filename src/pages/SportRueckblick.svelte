<script>
  import { readLite } from '../lib/actlite.js';
  /**
   * «Rückblick pro Sportart» (Noah 21.11.2026 «ich möchte alle entwürfe 1-3 umsetzen», S4, Entwurf 2):
   * #/auswerten/sportjahr/<sport>. One sport of the Sportjahr alone: time, units, average duration and distance
   * (only where there is one) against the year before, the hours per month, where the units come from and the best
   * values. Same period switch as the Sportjahr; a time nobody measured is the usual duration and says «ca.».
   * Only looking, nothing is judged or saved. The rules are in flow/rueckblick.js and flow/sportjahr.js.
   */
  import { liveQuery } from 'dexie';
  import { Dumbbell } from '@lucide/svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import PeriodBar from '../lib/flow/PeriodBar.svelte';
  import BarChart from '../lib/charts/BarChart.svelte';
  import ChartSheet from '../lib/charts/ChartSheet.svelte';
  import { period, enterPage } from '../lib/flow/zeitraum.svelte.js';
  import { rangeOf, labelOf } from '../lib/flow/zeitraum.js';
  import { db } from '../lib/db.js';
  import { einheiten, looseLabel } from '../lib/flow/einheiten.js';
  import { USUAL_KEY, usualMap } from '../lib/flow/usualmin.js';
  import { TICKS_KEY, prefsOf } from '../lib/stravaticks.js';
  import { training, windowOf, prevWindow, buckets, grainOf, lastYearLine } from '../lib/flow/sportjahr.js';
  import { rueckblick, quellen, bestwerte } from '../lib/flow/rueckblick.js';
  import { actName } from '../lib/flow/ui.svelte.js';
  import { localDay } from '../lib/localday.js';
  import { t, tn, num, locale } from '../lib/i18n.svelte.js';
  import { hoursMin } from '../lib/charts/exact.js';
  import { sportColour } from '../lib/charts/sportcolors.js';
  import { noDataText, firstDayOf } from '../lib/charts/nodata.js';
  import { againstMean } from '../lib/charts/compare.js';
  import { sentencesOf } from '../lib/charts/sentence.js';
  import '../lib/ich/ich.css';

  enterPage('sportrueckblick');
  const today = localDay();
  const sport = (() => {
    try {
      return decodeURIComponent(location.hash.split('?')[0].split('/')[3] ?? '');
    } catch {
      return '';
    }
  })();
  const q = liveQuery(async () => {
    const [log, activities, acts, usual, ticks] = await Promise.all([db.flowLog.toArray(), readLite(db, (T) => T.toArray()), db.flowActs.toArray(), db.settings.get(USUAL_KEY), db.settings.get(TICKS_KEY)]);
    return { log, activities, acts, usual: usualMap(usual?.value), map: prefsOf(ticks?.value).map };
  });
  const d = $derived($q);
  const units = $derived(d ? training(einheiten({ log: d.log, activities: d.activities, acts: d.acts, usual: d.usual, map: d.map })) : []);
  const mine = $derived(units.filter((u) => u.sport === sport));

  const mode = $derived(period.mode);
  // «Everything» starts at the first unit of this sport, not of all sports
  const win = $derived(windowOf(rangeOf(period, today), mine, today));
  const prevW = $derived(prevWindow(mode, win));
  const rb = $derived(rueckblick(mine, sport, win, prevW));
  const from = $derived(quellen(rb.units));
  const best = $derived(bestwerte(rb.units));

  const name = $derived.by(() => {
    const act = d?.acts.find((a) => a.id === sport);
    return act ? actName(act) : t(looseLabel(String(sport).replace(/^strava:/, '')));
  });
  const loc = $derived(locale());
  const dayTxt = (day, o) => new Date(`${day}T12:00:00Z`).toLocaleDateString(loc, { ...o, timeZone: 'UTC' });
  const hrs = (m) => {
    const h = m / 60;
    return h < 10 ? num(Math.round(h * 10) / 10) : num(Math.round(h));
  };
  const hm = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')} h`;
  const km = (v) => `${num(Math.round(v * 10) / 10)} km`;
  const title = $derived(mode === 'all' ? t('All time') : labelOf(period, today, loc));
  const against = (text) => (rb.prev ? `${t('Year before')}: ${text}` : '');

  /* the hours per month (year), per day (short windows), per year (everything), the year before as a line */
  const bars = $derived(buckets(mine, mode, win));
  const grain = $derived(grainOf(mode, win));
  const line = $derived(mode === 'year' ? lastYearLine(mine, win) : null);
  const bucketTitle = (b) => (grain === 'day' ? dayTxt(b.from, { weekday: 'short', day: 'numeric', month: 'short' }) : grain === 'month' ? dayTxt(b.from, { month: 'long', year: 'numeric' }) : b.key);
  const bucketX = (b, i) => {
    if (grain === 'day') return bars.length <= 7 ? dayTxt(b.from, { weekday: 'short' }) : i % 5 === 0 ? String(Number(b.from.slice(8))) : '';
    if (grain === 'month') return dayTxt(b.from, { month: 'narrow' });
    return b.key;
  };
  const firstDay = $derived(firstDayOf(mine));
  const noneOf = (b) => noDataText(b.from, b.to, today, firstDay);
  const cols = $derived(bars.map((b, i) => ({ key: b.key, none: noneOf(b), x: bucketX(b, i), top: b.mins >= 30 ? hrs(b.mins) : '', parts: b.mins > 0 ? [{ v: b.mins / 60, color: sportColour(sport) }] : [] })));
  const readout = (i) => ({ title: bucketTitle(bars[i]), extra: noneOf(bars[i]) ? '' : againstMean(bars[i].mins, bars.filter((x) => !noneOf(x)).map((x) => x.mins)), items: [{ label: t('Hours'), value: hoursMin(bars[i].mins) }, { label: t('Units'), value: num(bars[i].n) }] });
  const table = $derived({ head: [t('Period|sj'), t('Hours'), t('Units')], rows: [...bars].reverse().map((b) => ({ key: b.key, cells: [bucketTitle(b), noneOf(b) ? '–' : hoursMin(b.mins), noneOf(b) ? '–' : num(b.n)] })) });
  const chartLine = $derived(line ? line.map((m) => m / 60) : null);
  const aria = $derived(bars.map((b) => `${bucketTitle(b)}: ${hrs(b.mins)} h`).join(', '));
  /* a tap on a bar opens its hours and units (ChartSheet) */
  let open = $state(null);
  const bar = $derived(open == null ? null : bars[open]);
  const unitList = $derived(bar ? mine.filter((u) => u.day >= bar.from && u.day <= bar.to).sort((a, b) => b.day.localeCompare(a.day)).map((u, i) => ({ key: `${u.day}-${i}`, a: dayTxt(u.day, { day: 'numeric', month: 'short' }), b: Number(u.km) > 0 ? km(Number(u.km)) : '', c: u.min > 0 ? `${u.minQuelle === 'ca.' ? 'ca. ' : ''}${hoursMin(Number(u.min))}` : '–' })) : []);
  const showKm = $derived(rb.now.km > 0 || (rb.prev?.km ?? 0) > 0);
</script>

<div class="rb" data-rueckblick={sport}>
  <VeloHead crumbs={[{ label: t('Analysis|place'), href: '#/auswerten' }, { label: t('Sports year'), href: '#/auswerten/sportjahr' }]} here={name} title={name} sub={t('Your year in this sport. Only to look at, nothing is graded.')} />

  <section class="card rb-sec" aria-label={t('Period')}>
    <PeriodBar {today} hint={false} />
  </section>

  {#if !d}
    <p class="hint" aria-live="polite">{t('Loading…')}</p>
  {:else if !rb.now.n}
    <Empty icon={Dumbbell} title={t('Nothing in this period')} text={t('No unit of this sport in this period. Pick a longer period or look at all sports.')} action={{ label: t('To the sports year'), href: '#/auswerten/sportjahr' }} />
  {:else}
    <section class="card rb-sec" aria-label={t('The period in numbers')} data-sr-totals>
      <ul class="kpis">
        <li><b class="num" data-sr-hours>{hrs(rb.now.mins)} h</b><small>{t('Time in motion')}{rb.prev ? ` · ${against(`${hrs(rb.prev.mins)} h`)}` : ''}</small></li>
        <li><b class="num" data-sr-units>{num(rb.now.n)}</b><small>{t('Units')}{rb.prev ? ` · ${against(num(rb.prev.n))}` : ''}</small></li>
        <li><b class="num" data-sr-avg>{rb.avgMin ? hm(rb.avgMin) : '–'}</b><small>{t('Average duration')}{rb.prevAvgMin ? ` · ${against(hm(rb.prevAvgMin))}` : ''}</small></li>
        {#if showKm}<li><b class="num" data-sr-km>{km(rb.now.km)}</b><small>{t('Distance')}{rb.prev && rb.prev.km > 0 ? ` · ${against(km(rb.prev.km))}` : ''}</small></li>{/if}
      </ul>
      {#if rb.now.nCa > 0}
        <p class="note" data-sr-ca>
          {tn(rb.now.nCa, 'For {n} unit the time is estimated (about {h} h, «ca.») with the usual duration of the sport.', 'For {n} units the time is estimated (about {h} h, «ca.») with the usual duration of the sport.', { h: hrs(rb.now.ca) })}
          <a href="#/flow/sports">{t('Change the usual duration')}</a>
        </p>
      {/if}
    </section>

    <section class="card rb-sec" aria-labelledby="sr-chart-h" data-sr-chart>
      <h2 id="sr-chart-h">{grain === 'month' && mode === 'year' ? t('Hours per month') : grain === 'year' ? t('Hours per year') : t('Hours per day')}</h2>
      <p class="hs">{title ? `${title}` : ''}{line ? ` · ${t('dashed: the year before')}` : ''}</p>
      <BarChart sentences={sentencesOf(bars.map((b) => ({ label: bucketTitle(b), v: b.mins, none: noneOf(b) })), hoursMin)} id="sportrueckblick" {cols} {readout} {table} line={chartLine} onopen={(i) => (open = i)} unit="h" label={t('Hours of this sport: {list}', { list: aria })} hint={t('Point at a bar for its numbers, tap it for the details.')} />
    </section>

    <section class="card rb-sec" aria-labelledby="sr-from-h" data-sr-from>
      <h2 id="sr-from-h">{t('Where does it come from?')}</h2>
      <ul class="rows">
        <li><span class="nm"><i class="dot st"></i>{t('Strava')}</span><b class="num">{tn(from.strava, '{n} unit|sr', '{n} units|sr')}</b></li>
        <li><span class="nm"><i class="dot hd"></i>{t('By hand|sr')}</span><b class="num">{tn(from.hand, '{n} unit|sr', '{n} units|sr')}</b></li>
      </ul>
      <p class="hint">{t('A unit by hand can be changed: day, duration, place.')}</p>
    </section>

    <section class="card rb-sec" aria-labelledby="sr-best-h" data-sr-best>
      <h2 id="sr-best-h">{t('Best values')}</h2>
      <ul class="rows">
        {#if best.longest}<li><span>{t('Longest unit')}</span><b class="num">{hm(best.longest.min)}</b><small class="num">{dayTxt(best.longest.day, { day: 'numeric', month: 'short' })}</small></li>{/if}
        {#if best.farthest}<li><span>{t('Farthest distance')}</span><b class="num">{km(best.farthest.km)}</b><small class="num">{dayTxt(best.farthest.day, { day: 'numeric', month: 'short' })}</small></li>{/if}
        {#if best.busiest}<li><span>{t('Most units in a month')}</span><b class="num">{num(best.busiest.n)}</b><small class="num">{dayTxt(`${best.busiest.month}-01`, { month: 'long' })}</small></li>{/if}
      </ul>
    </section>
  {/if}
</div>

{#if bar}
  <ChartSheet list={unitList} kicker={name} title={bucketTitle(bar)} onclose={() => (open = null)} onprev={open > 0 ? () => open-- : null} onnext={open < bars.length - 1 ? () => open++ : null} prevLabel={t('Before|sj')} nextLabel={t('Next|sj')}>
    <ul class="rows" data-sr-sheet>
      <li><span>{t('Hours')}</span><b class="num">{hoursMin(bar.mins)}</b></li>
      <li><span>{t('Units')}</span><b class="num">{num(bar.n)}</b></li>
    </ul>
  </ChartSheet>
{/if}

<style>
  .rb {
    display: grid;
    gap: 16px;
    min-width: 0;
  }
  .rb-sec {
    display: grid;
    gap: 10px;
    min-width: 0;
    padding: 16px 18px;
  }
  .rb-sec h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .hs {
    margin: -6px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .kpis {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  @media (min-width: 900px) {
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
    min-width: 0;
  }
  .kpis b {
    font-size: var(--fs-section);
    line-height: 1.1;
  }
  .kpis small {
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .note {
    margin: 0;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--l2-soft);
    color: var(--ink);
    font-size: var(--fs-small);
  }
  .rows {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .rows li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto 5.5rem;
    align-items: baseline;
    gap: 8px;
    min-height: 44px;
    border-top: 1px solid var(--line);
  }
  .rows small {
    color: var(--ink-3);
    text-align: right;
  }
  .nm {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex: none;
  }
  .dot.st {
    background: var(--l2);
  }
  .dot.hd {
    background: var(--l1);
  }
</style>
