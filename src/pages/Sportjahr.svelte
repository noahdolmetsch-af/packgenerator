<script>
  import { readLite } from '../lib/actlite.js';
  /**
   * «Sportjahr» (Noah 21.11.2026 «1 a dann b», Thread «Sportjahr», S3): #/auswerten/sportjahr. Everything you did,
   * all sports together, in hours: Woche, Monat, Jahr, Alles (the switch of Auswerten), the hours per month by sport
   * with the year before as a line, «Wo ging die Zeit hin?» (hours, units, days, km), records and series and the
   * weeks with training. Strava and your ticks are read together (flow/einheiten.js); a time that nobody measured is
   * the usual duration of the sport (Meine Sportarten › Übliche Dauer) and says «ca.». Only looking, nothing is
   * judged or saved. The rules are in flow/sportjahr.js.
   */
  import { liveQuery } from 'dexie';
  import { Dumbbell } from '@lucide/svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import PeriodBar from '../lib/flow/PeriodBar.svelte';
  import BarChart from '../lib/charts/BarChart.svelte';
  import ChartSheet from '../lib/charts/ChartSheet.svelte';
  import Rhythmus from '../lib/flow/auswertung/Rhythmus.svelte';
  import Rituale from '../lib/flow/Rituale.svelte';
  import { rituale } from '../lib/flow/rituale.js';
  import AlleWoche from '../lib/flow/AlleWoche.svelte';
  import { alleRange } from '../lib/flow/alle-woche.js';
  import AnaSheet from '../lib/training/AnaSheet.svelte';
  import { period, enterPage } from '../lib/flow/zeitraum.svelte.js';
  import { rangeOf, labelOf } from '../lib/flow/zeitraum.js';
  import { db } from '../lib/db.js';
  import { einheiten, looseLabel } from '../lib/flow/einheiten.js';
  import { USUAL_KEY, usualMap } from '../lib/flow/usualmin.js';
  import { TICKS_KEY, prefsOf } from '../lib/stravaticks.js';
  import { GOAL_KEY, goalOf } from '../lib/training.js';
  import { training, yearsOf, seasons, goalOfYear, goalLine, perWeek, windowOf, prevWindow, totals, bySport, colourOf, grainOf, buckets, lastYearLine, records, weeksWith } from '../lib/flow/sportjahr.js';
  import { actName } from '../lib/flow/ui.svelte.js';
  import { localDay } from '../lib/localday.js';
  import { t, tn, num, locale } from '../lib/i18n.svelte.js';
  import { hoursMin } from '../lib/charts/exact.js';
  import { sportColour, OTHER } from '../lib/charts/sportcolors.js';
  import { noDataText, firstDayOf } from '../lib/charts/nodata.js';
  import { againstYear, againstMean } from '../lib/charts/compare.js';
  import { sentencesOf } from '../lib/charts/sentence.js';
  import '../lib/ich/ich.css';

  enterPage('sportjahr');
  const today = localDay();
  const q = liveQuery(async () => {
    const [log, activities, acts, usual, ticks, goal] = await Promise.all([db.flowLog.toArray(), readLite(db, (T) => T.toArray()), db.flowActs.toArray(), db.settings.get(USUAL_KEY), db.settings.get(TICKS_KEY), db.settings.get(GOAL_KEY)]);
    return { log, activities, acts, usual: usualMap(usual?.value), map: prefsOf(ticks?.value).map, goal: goalOf(goal?.value) };
  });
  const d = $derived($q);
  const allUnits = $derived(d ? einheiten({ log: d.log, activities: d.activities, acts: d.acts, usual: d.usual, map: d.map }) : []);
  const units = $derived(training(allUnits));
  /* S5: the old address of «Haken ausgewertet» (…?act=<id>) leads here and picks the activity of «Haken und Rhythmus» */
  const act0 = (() => {
    try {
      return new URLSearchParams((location.hash.split('?')[1] ?? '')).get('act') ?? '';
    } catch {
      return '';
    }
  })();

  const mode = $derived(period.mode);
  const win = $derived(windowOf(rangeOf(period, today), units, today));
  /* «Haken und Rhythmus» reads every tick, so «Everything» starts at the first of all (a meditation from before the first ride counts) */
  const rhWin = $derived(windowOf(rangeOf(period, today), allUnits, today));
  const inWin = $derived(units.filter((u) => u.day >= win.from && u.day <= win.to));
  const prevW = $derived(prevWindow(mode, win));
  /* «Erholung und Rituale» (Schritt J): the rings Ruhe and Geist as times per week, not as hours; reads every tick like «Haken und Rhythmus» */
  const rit = $derived(d ? rituale(allUnits, d.acts, rhWin.from, rhWin.to) : []);
  const ritPrevW = $derived(prevWindow(mode, rhWin));
  const ritPrev = $derived(ritPrevW && d ? new Map(rituale(allUnits, d.acts, ritPrevW.from, ritPrevW.to).map((r) => [r.id, r.n])) : null);
  const ritNames = $derived(new Map((d?.acts ?? []).map((a) => [a.id, actName(a)])));
  /* «Alles, was du angelegt hast» (Noah 23.11.2026): every activity of Aktiv in the period, also daily habits and ones with 0 times; the hours above stay as they are */
  const alle = $derived(d ? alleRange({ log: d.log, flowActs: d.acts, acts: d.activities, usual: d.usual, map: d.map }, rhWin.from, rhWin.to) : null);
  const inPrev = $derived(prevW ? units.filter((u) => u.day >= prevW.from && u.day <= prevW.to) : null);
  const tot = $derived(totals(inWin));
  const rows = $derived(bySport(inWin, inPrev));
  const colours = $derived(colourOf(rows));
  const bars = $derived(buckets(units, mode, win));
  const grain = $derived(grainOf(mode, win));
  const yearLine = $derived(mode === 'year' ? lastYearLine(units, win) : null);
  /* «Ziele sichtbar» (S10): the hours goal as a line where one is set; in a year the line is the year before or the goal, you pick */
  const goal = $derived(d ? goalOfYear(d.goal, today) : null);
  const goalMins = $derived(goal && !goal.passed ? goalLine(bars, goal.hours) : null);
  let linePick = $state('last');
  const both = $derived(!!yearLine && !!goalMins);
  const line = $derived(both ? (linePick === 'goal' ? goalMins : yearLine) : (goalMins ?? yearLine));
  const lineIsGoal = $derived(!!line && line === goalMins);
  const avgWeek = $derived(goal?.hours ? perWeek(tot.mins, win, today) : null);
  const rec = $derived(records(inWin));
  const weeks = $derived(mode === 'year' ? weeksWith(units, Number(win.from.slice(0, 4)), today) : []);
  /* «Jahre vergleichen» (S9): only in «Everything», and only with two years or more */
  const years = $derived(mode === 'all' ? yearsOf(inWin) : []);
  const yearTop = $derived(years.reduce((m, y) => Math.max(m, y.mins), 1));
  const season = $derived(mode === 'all' && years.length >= 2 ? seasons(inWin) : null);
  const weeksOk = $derived(weeks.filter((w) => w.ok).length);
  const weeksPast = $derived(weeks.filter((w) => !w.future).length);

  /* names and colours */
  const colour = (sport) => {
    const c = colours.get(sport);
    return c == null || c === 'other' ? OTHER : sportColour(sport);
  };
  const nameOf = (r) => {
    const act = r.actId ? d?.acts.find((a) => a.id === r.actId) : null;
    return act ? actName(act) : t(looseLabel(r.stravaType ?? String(r.sport).replace(/^strava:/, '')));
  };
  const names = $derived(new Map(rows.map((r) => [r.sport, nameOf(r)])));
  const legend = $derived([...rows.filter((r) => colours.get(r.sport) !== 'other').map((r) => ({ key: r.sport, name: names.get(r.sport), color: colour(r.sport) })), ...(rows.some((r) => colours.get(r.sport) === 'other') ? [{ key: 'other', name: t('Others'), color: OTHER }] : [])]);

  /* numbers in words */
  const hrs = (m) => {
    const h = m / 60;
    return h < 10 ? num(Math.round(h * 10) / 10) : num(Math.round(h));
  };
  const loc = $derived(locale());
  const dayTxt = (day, o) => new Date(`${day}T12:00:00Z`).toLocaleDateString(loc, { ...o, timeZone: 'UTC' });
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
  /* one line under the numbers: against the same month a year before, else against the mean of the bars that have come */
  const compareOf = (i) => {
    const b = bars[i];
    if (noneOf(b)) return '';
    if (mode === 'year' && yearLine && yearLine[i] != null) return againstYear(b.mins, yearLine[i]);
    return againstMean(b.mins, bars.filter((x) => !noneOf(x)).map((x) => x.mins));
  };
  const readout = (i) => ({
    title: bucketTitle(bars[i]),
    extra: compareOf(i),
    items: [{ label: t('Hours'), value: hoursMin(bars[i].mins) }, ...rows.filter((r) => bars[i].parts[r.sport] > 0).slice(0, 4).map((r) => ({ label: names.get(r.sport), value: hoursMin(bars[i].parts[r.sport]), color: colour(r.sport) }))],
  });
  const table = $derived({
    head: [t('Period|sj'), t('Hours'), t('Units')],
    rows: [...bars].reverse().map((b) => ({ key: b.key, cells: [bucketTitle(b), noneOf(b) ? '–' : hoursMin(b.mins), noneOf(b) ? '–' : num(b.n)] })),
  });
  const chartLine = $derived(line ? line.map((m) => m / 60) : null);
  const aria = $derived(bars.map((b) => `${bucketTitle(b)}: ${hrs(b.mins)} h`).join(', '));
  const title = $derived(mode === 'all' ? t('All time') : labelOf(period, today, loc));

  /* a tap on a bar opens the sports of that day, month or year (ChartSheet) */
  let open = $state(null);
  const bar = $derived(open == null ? null : bars[open]);
  /* «Die N Einheiten ansehen»: the units of the tapped bar, newest first */
  const barUnits = $derived(bar ? inWin.filter((u) => u.day >= bar.from && u.day <= bar.to).sort((a, b) => b.day.localeCompare(a.day)) : []);
  const unitList = $derived(barUnits.map((u, i) => ({ key: `${u.day}-${i}`, a: dayTxt(u.day, { day: 'numeric', month: 'short' }), b: names.get(u.sport) ?? u.sport, c: u.min > 0 ? `${u.minQuelle === 'ca.' ? 'ca. ' : ''}${hoursMin(Number(u.min))}` : '–' })));
  const barRows = $derived(bar ? bySport(inWin.filter((u) => u.day >= bar.from && u.day <= bar.to)) : []);

  /* «Where did the time go?» */
  let metric = $state('hours');
  const METRICS = $derived([
    { key: 'hours', name: t('Hours') },
    { key: 'units', name: t('Units') },
    { key: 'days', name: t('Days') },
    { key: 'km', name: t('km') },
  ]);
  const val = (r) => (metric === 'hours' ? r.mins : metric === 'units' ? r.n : metric === 'days' ? r.days : r.km);
  const shown = $derived(rows.filter((r) => val(r) > 0).sort((a, b) => val(b) - val(a)));
  const top = $derived(shown.length ? val(shown[0]) : 1);
  const show = (r) => (metric === 'hours' ? `${hrs(r.mins)} h` : metric === 'km' ? `${num(Math.round(r.km))} km` : `${num(val(r))}×`);
  const prevOf = (r) => (!r.prev ? null : metric === 'hours' ? r.prev.mins : metric === 'units' ? r.prev.n : metric === 'days' ? r.prev.days : r.prev.km);
  const against = (r) => {
    const p = prevOf(r);
    if (p == null || p <= 0) return '';
    const pct = Math.round((val(r) / p - 1) * 100);
    return pct === 0 ? '±0 %' : `${pct > 0 ? '+' : '−'}${Math.abs(pct)} %`;
  };
  const roundOf = (r) => (r.ca > 0 && metric === 'hours' ? t('{n} of it «ca.»', { n: `${hrs(r.ca)} h` }) : '');
</script>

<div class="sj" data-sportjahr>
  <VeloHead crumbs={[{ label: t('Analysis|place'), href: '#/auswerten' }]} here={t('Sports year')} title={t('Sports year')} sub={t('Everything you did, all sports together. Only to look at, nothing is graded.')} />

  <section class="card sj-sec" aria-label={t('Period')}>
    <PeriodBar {today} hint={false} />
    <p class="hint" data-sj-source>{t('Strava and your ticks are read together. Where no time was measured, the usual duration of the sport counts and says «ca.».')}</p>
  </section>

  {#if !d}
    <p class="hint" aria-live="polite">{t('Loading…')}</p>
  {:else if !inWin.length}
    <Empty icon={Dumbbell} title={t('Nothing in this period')} text={t('No unit of movement in this period. Tick a sport on Active or connect Strava, and your sports year fills itself.')} action={{ label: t('To Active'), href: '#/flow' }} />
  {:else}
    <section class="card sj-sec" aria-label={t('The period in numbers')} data-sj-totals>
      <ul class="kpis">
        <li><b class="num" data-sj-hours>{hrs(tot.mins)} h</b><small>{t('Time in motion')}</small></li>
        <li><b class="num" data-sj-units>{num(tot.n)}</b><small>{t('Units')}</small></li>
        <li><b class="num" data-sj-days>{num(tot.days)}</b><small>{t('Days with training')}</small></li>
        <li><b class="num" data-sj-sports>{num(tot.sports)}</b><small>{t('Sports')}</small></li>
      </ul>
      {#if tot.nCa > 0}
        <p class="note" data-sj-ca>
          {tn(tot.nCa, 'For {n} unit the time is estimated (about {h} h, «ca.») with the usual duration of the sport.', 'For {n} units the time is estimated (about {h} h, «ca.») with the usual duration of the sport.', { h: hrs(tot.ca) })}
          <a href="#/flow/sports">{t('Change the usual duration')}</a>
        </p>
      {/if}
      {#if goal}
        <p class="note" data-sj-goal>
          {#if goal.passed}
            {goal.name ? t('The goal day of «{name}» has passed.', { name: goal.name }) : t('Your goal day has passed.')}
            <a href="#/flow/training" data-sj-goal-new>{t('Set a new goal')}</a> {t('or leave it out.')}
          {:else}
            {t('Your goal: {h} h per week.', { h: num(goal.hours) })}
            {#if avgWeek != null}{t('In this period you had {h} h per week.', { h: hrs(avgWeek) })}{/if}
            <a href="#/flow/training" data-sj-goal-edit>{t('Change the goal')}</a>
          {/if}
        </p>
      {/if}
    </section>

    <section class="card sj-sec" aria-labelledby="sj-chart-h" data-sj-chart>
      <h2 id="sj-chart-h">{grain === 'month' && mode === 'year' ? t('Hours per month') : grain === 'year' ? t('Hours per year') : t('Hours per day')}</h2>
      <p class="hs">{title ? `${title} · ` : ''}{t('by sport')}{line ? ` · ${lineIsGoal ? t('line: your goal of {h} h per week', { h: num(goal.hours) }) : t('dashed: the year before')}` : ''}</p>
      {#if both}<Seg full={false} small label={t('Line')} value={linePick} onchange={(k) => (linePick = k)} options={[{ key: 'last', name: t('Year before') }, { key: 'goal', name: t('Goal|sj') }]} />{/if}
      <BarChart sentences={sentencesOf(bars.map((b) => ({ label: bucketTitle(b), v: b.mins, none: noneOf(b) })), hoursMin)} id="sportjahr" {cols} {readout} {table} line={chartLine} onopen={(i) => (open = i)} unit="h" label={t('Hours by sport: {list}', { list: aria })} hint={t('Point at a bar for its numbers, tap it for its sports.')} />
      <ul class="lg" data-sj-legend>
        {#each legend as l (l.key)}<li><i style:background={l.color}></i>{l.name}</li>{/each}
        {#if line}<li><i class="dash"></i>{lineIsGoal ? t('Goal|sj') : t('Year before')}</li>{/if}
      </ul>
    </section>

    <section class="card sj-sec" aria-labelledby="sj-where-h" data-sj-where>
      <h2 id="sj-where-h">{t('Where did the time go?')}</h2>
      <Seg full={false} small label={t('Show')} value={metric} onchange={(k) => (metric = k)} options={METRICS} />
      <ul class="rows">
        {#each shown as r (r.sport)}
          <li data-sj-sport={r.sport}>
            <a class="nm" href="#/auswerten/sportjahr/{encodeURIComponent(r.sport)}" data-sj-open={r.sport}><i style:background={colour(r.sport)}></i>{names.get(r.sport)}</a>
            <span class="bar" aria-hidden="true"><b style:width="{Math.max(3, Math.round((val(r) / top) * 100))}%" style:background={colour(r.sport)}></b></span>
            <span class="v num">{show(r)}</span>
            <span class="vs num">{#if metric !== 'units'}{num(r.n)}×{/if}</span>
            <span class="ag num">{against(r)}</span>
            {#if roundOf(r)}<small class="ca">{roundOf(r)}</small>{/if}
          </li>
        {/each}
      </ul>
      <p class="hint">{t('Tap a sport for its year.')} {t('«km» shows only sports with a distance.')}{prevW ? ` ${t('The year before counts up to the same day.')}` : ''}</p>
    </section>

    {#if years.length >= 2}
      <section class="card sj-sec" aria-labelledby="sj-years-h" data-sj-years>
        <h2 id="sj-years-h">{t('Years side by side')}</h2>
        <p class="hs">{t('Hours per year, with the best week and the best month of each.')}</p>
        <ul class="yrs">
          {#each years as y (y.year)}
            <li data-sj-year={y.year}>
              <b class="yr num">{y.year}</b>
              <span class="bar" aria-hidden="true"><b style:width="{Math.max(3, Math.round((y.mins / yearTop) * 100))}%"></b></span>
              <span class="v num">{hrs(y.mins)} h</span>
              <small class="num">{tn(y.n, '{n} unit|sy', '{n} units|sy')} · {t('best week {w} h · best month {m} h', { w: hrs(y.bestWeek.mins), m: hrs(y.bestMonth.mins) })}</small>
            </li>
          {/each}
        </ul>
      </section>
    {/if}
    {#if season}
      <section class="card sj-sec" aria-labelledby="sj-season-h" data-sj-season>
        <h2 id="sj-season-h">{t('Summer and winter')}</h2>
        <p class="hs">{t('Summer is April to October, winter the rest. The biggest sports of each season over all years.')}</p>
        <div class="two">
          {#each [['summer', t('Summer|sj')], ['winter', t('Winter|sj')]] as [k, label] (k)}
            <div data-sj-season-of={k}>
              <h3>{label}</h3>
              <ul class="recs">
                {#each season[k].slice(0, 3) as r (r.sport)}
                  <li><span class="nm"><i style:background={colour(r.sport)}></i>{names.get(r.sport)}</span><b class="num">{hrs(r.mins)} h</b></li>
                {:else}
                  <li><span>{t('Nothing in this season')}</span></li>
                {/each}
              </ul>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <div class="two">
      <section class="card sj-sec" aria-labelledby="sj-rec-h" data-sj-records>
        <h2 id="sj-rec-h">{t('Records and streaks')}</h2>
        <ul class="recs">
          {#if rec.longestWeek}<li><span>{t('Longest week')}</span><b class="num">{hrs(rec.longestWeek.mins)} h</b><small class="num">{dayTxt(rec.longestWeek.mon, { day: 'numeric', month: 'short' })}</small></li>{/if}
          {#if rec.mostPerDay}<li><span>{t('Most units in one day')}</span><b class="num">{num(rec.mostPerDay.n)}</b><small class="num">{dayTxt(rec.mostPerDay.day, { day: 'numeric', month: 'short' })}</small></li>{/if}
          {#if rec.longestStreak}<li><span>{t('Longest streak')}</span><b class="num">{tn(rec.longestStreak.days, '{n} day', '{n} days')}</b><small class="num">{dayTxt(rec.longestStreak.end, { day: 'numeric', month: 'short' })}</small></li>{/if}
        </ul>
      </section>
      {#if mode === 'year'}
        <section class="card sj-sec" aria-labelledby="sj-weeks-h" data-sj-weeks>
          <h2 id="sj-weeks-h">{t('Weeks with training')}</h2>
          <p class="hs">{t('How regular, over the year')}</p>
          <div class="wk" role="img" aria-label={t('{n} of {m} weeks with at least 2 units', { n: weeksOk, m: weeksPast })}>
            {#each weeks as w (w.mon)}<i class:ok={w.ok} class:fut={w.future}></i>{/each}
          </div>
          <p class="hint num">{t('{n} of {m} weeks with at least 2 units', { n: weeksOk, m: weeksPast })}</p>
        </section>
      {/if}
    </div>
  {/if}
  {#if d}
    <Rituale rows={rit} names={ritNames} mode="period" prev={ritPrev} />
    {#if alle && (alle.move.shown.length || alle.move.quiet.length || alle.rest.quiet.length || alle.loose.length)}
      <details class="card sj-alle" data-alle-fold>
        <summary>{t('Everything you created')}</summary>
        <AlleWoche week={alle} names={ritNames} period bare />
      </details>
    {/if}
    <Rhythmus units={allUnits} log={d.log} acts={d.acts} from={rhWin.from} to={rhWin.to} {today} {act0} />
  {/if}
</div>
<AnaSheet />

{#if bar}
  <ChartSheet list={unitList} kicker={t('Sports year')} title={bucketTitle(bar)} onclose={() => (open = null)} onprev={open > 0 ? () => open-- : null} onnext={open < bars.length - 1 ? () => open++ : null} prevLabel={t('Before|sj')} nextLabel={t('Next|sj')}>
    {#if barRows.length}
      <ul class="sheetrows" data-sj-sheet>
        {#each barRows as r (r.sport)}
          <li data-sj-sheet-sport={r.sport}><span class="nm"><i style:background={colour(r.sport)}></i>{names.get(r.sport) ?? nameOf(r)}</span><b class="num">{hoursMin(r.mins)}</b><small class="num">{r.n}×{#if r.ca > 0}{' · '}{t('{n} of it «ca.»', { n: hoursMin(r.ca) })}{/if}</small></li>
        {/each}
      </ul>
    {:else}
      <p class="hint">{t('Nothing in this period')}</p>
    {/if}
  </ChartSheet>
{/if}

<style>
  .sj-alle {
    padding: var(--sp-3) var(--sp-4);
  }
  .sj-alle summary {
    cursor: pointer;
    min-height: 32px;
    font-size: var(--fs-body);
    color: var(--ink-2);
  }
  .sj-alle :global(.al) {
    margin-top: var(--sp-3);
  }
  .sj {
    display: grid;
    gap: 16px;
    min-width: 0;
  }
  .sj-sec {
    display: grid;
    gap: 10px;
    min-width: 0;
    padding: 16px 18px;
  }
  .sj-sec h2 {
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
  }
  .kpis b {
    font-size: var(--fs-section);
    line-height: 1.1;
  }
  .kpis small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .note {
    margin: 0;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--l2-soft);
    color: var(--ink);
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
  .lg li,
  .nm {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .lg i,
  .nm i {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex: none;
  }
  .lg i.dash {
    width: 16px;
    height: 0;
    border-radius: 0;
    border-top: 2px dashed var(--ink);
  }
  .rows {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .rows li {
    display: grid;
    grid-template-columns: minmax(6rem, 9rem) minmax(0, 1fr) auto;
    grid-template-areas: 'nm bar v' 'ca ca ca';
    align-items: center;
    gap: 2px 10px;
    min-height: 44px;
    border-top: 1px solid var(--line);
  }
  .rows .nm {
    grid-area: nm;
    min-width: 0;
    overflow-wrap: break-word;
    color: inherit;
    text-decoration: none;
  }
  .rows a.nm:hover {
    text-decoration: underline;
  }
  .rows .bar {
    grid-area: bar;
    height: 10px;
    border-radius: 999px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .rows .bar b {
    display: block;
    height: 100%;
    border-radius: 999px;
  }
  .rows .v {
    grid-area: v;
    font-weight: 700;
    text-align: right;
  }
  .rows .vs,
  .rows .ag {
    display: none;
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-align: right;
  }
  .rows .ca {
    grid-area: ca;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    padding-left: 16px;
  }
  @media (min-width: 900px) {
    .rows li {
      grid-template-columns: minmax(8rem, 11rem) minmax(0, 1fr) 5rem 4rem 4rem;
      grid-template-areas: 'nm bar v vs ag' 'ca ca ca ca ca';
    }
    .rows .vs {
      display: block;
      grid-area: vs;
    }
    .rows .ag {
      display: block;
      grid-area: ag;
    }
  }
  .yrs {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .yrs li {
    display: grid;
    grid-template-columns: 3.2rem minmax(0, 1fr) auto;
    grid-template-areas: 'yr bar v' '. s s';
    align-items: center;
    gap: 2px 10px;
    min-height: 44px;
    padding: 4px 0;
    border-top: 1px solid var(--line);
  }
  .yrs .yr {
    grid-area: yr;
  }
  .yrs .bar {
    grid-area: bar;
    height: 10px;
    border-radius: 999px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .yrs .bar b {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: var(--l1);
  }
  .yrs .v {
    grid-area: v;
    font-weight: 700;
    text-align: right;
  }
  .yrs small {
    grid-area: s;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .sj-sec h3 {
    margin: 0 0 4px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .two {
    display: grid;
    gap: 16px;
    min-width: 0;
  }
  @media (min-width: 900px) {
    .two {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .recs {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .recs li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto 4.5rem;
    align-items: baseline;
    gap: 8px;
    min-height: 44px;
    border-top: 1px solid var(--line);
  }
  .recs small {
    color: var(--ink-3);
    text-align: right;
  }
  .sheetrows {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .sheetrows li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0 10px;
    align-items: baseline;
    min-height: 44px;
    padding: 6px 0;
    border-top: 1px solid var(--line);
  }
  .sheetrows small {
    grid-column: 1 / -1;
    color: var(--ink-3);
  }
  .wk {
    display: grid;
    grid-template-columns: repeat(26, minmax(0, 1fr));
    gap: 4px;
  }
  .wk i {
    height: 16px;
    border-radius: 4px;
    background: var(--paper-2);
    border: 1px solid var(--line);
  }
  .wk i.ok {
    background: var(--accent);
    border-color: var(--accent);
  }
  .wk i.fut {
    opacity: 0.35;
  }
</style>
