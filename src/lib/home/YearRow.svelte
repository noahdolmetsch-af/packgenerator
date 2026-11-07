<script>
  /**
   * v0.46.0 «Startseite neu» (Noah 29a, 22a): the last 12 months in one row: trips, km and the change
   * of the base weight, 12 mini bars of the km per month (this month in the action colour) and the
   * link to the review; beside it the series: weeks in a row with at least one trip or ride.
   * Only once a trip or ride happened in the last 12 months.
   * v0.94.0 «Kachel-Wand» (Noah 4a): the series here is the ONE series over everything (series.js),
   * the same number as the tile «Series and milestones», so two series never disagree.
   * «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»): the 12 months are the shared bar chart: an axis in km,
   * the km of a month when pointing, a tap opens the month, «As table» lists the months.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { loadReview } from '../review/load.js';
  import { yearReview } from '../yearreview.js';
  import { formatWeight } from '../gear.js';
  import BarChart from '../charts/BarChart.svelte';
  import ChartSheet from '../charts/ChartSheet.svelte';
  import { homeTrips } from './heute.js';
  import { readSeries } from './series-data.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';

  let { today } = $props();

  const dataQ = liveQuery(() => loadReview(db));
  const data = $derived($dataQ ? { ...$dataQ, trips: homeTrips($dataQ.trips) } : null);
  const review = $derived(data ? yearReview({ ...data, today }) : null);
  const months = $derived(review ? review.months.slice(-12) : []);
  const nowMonth = $derived(today.slice(0, 7));
  // UI-Test T4: the one series (series-data.js); null while it loads, so «A new series starts» never
  // shows for a moment beside the tile that says «9 weeks in a row»
  const seriesQ = $derived(liveQuery(() => readSeries(db, today)));
  const streak = $derived($seriesQ ? $seriesQ.s.n : null);
  const base = $derived(review?.pack.trend?.diffG ?? null);
  const monthName = (m) => new Date(`${m}-15T12:00:00`).toLocaleDateString(locale(), { month: 'long', year: 'numeric' });
  const monthShort = (m) => new Date(`${m}-15T12:00:00`).toLocaleDateString(locale(), { month: 'short' });
  const cols = $derived(months.map((m, i) => ({ key: m.month, x: i % 2 === (months.length - 1) % 2 ? monthShort(m.month) : '', top: '', parts: [{ v: m.km, color: m.month === nowMonth ? 'var(--hi)' : 'var(--bar)' }] })));
  const read = (i) => ({ title: monthName(months[i].month), items: [{ label: 'km', value: num(months[i].km), color: months[i].month === nowMonth ? 'var(--hi)' : 'var(--bar)' }] });
  const table = $derived({ head: [t('Month'), 'km'], rows: months.map((m) => ({ key: m.month, cells: [monthName(m.month), num(m.km)] })) });
  let sel = $state(null);
</script>

{#if review && !review.empty}
  <section class="year" aria-labelledby="yr-h" data-year-row>
    <div class="nums card2">
      <h2 id="yr-h" class="sr">{t('Last 12 months')}</h2>
      <dl>
        <div><dt>{tn(review.ride.trips, 'trip|count', 'trips|count')}</dt><dd class="num">{num(review.ride.trips)}</dd></div>
        <div><dt>km</dt><dd class="num">{num(review.ride.km)}</dd></div>
        {#if base}<div><dt>{t('base weight')}</dt><dd class="num" class:down={base < 0}>{base < 0 ? '−' : '+'}{formatWeight(Math.abs(base))}</dd></div>{/if}
      </dl>
      <a class="lnk" href="#/debrief">{t('Look back|function')} ›</a>
      <div class="chart"><BarChart id="year" {cols} readout={read} {table} unit="km" height={110} label={t('km per month, last 12 months')} onopen={(i) => (sel = i)} hint={t('Point at a month for its km, tap it for the month.')} /></div>
    </div>
    {#if streak != null}<div class="streak" data-year-series={streak}>
      <span class="k">{t('Series')}</span>
      {#if streak}
        <b class="num">{tn(streak, '{n} week in a row', '{n} weeks in a row')}</b>
        <span class="k">{t('Everything counts: a ride, a trip, meditation, yoga, tennis, gym …')}</span>
      {:else}
        <b>{t('A new series starts')}</b>
        <span class="k">{t('with your next ride, trip or activity')}</span>
      {/if}
    </div>{/if}
  </section>
{/if}

{#if sel != null && months[sel]}
  {@const m = months[sel]}
  <ChartSheet kicker={t('Last 12 months')} title={monthName(m.month)} onclose={() => (sel = null)} onprev={sel > 0 ? () => sel-- : null} onnext={sel < months.length - 1 ? () => sel++ : null} prevLabel={t('Month before')} nextLabel={t('Next month')}>
    <ul class="shl" data-year-sheet>
      <li><span>km</span><b class="num">{num(m.km)}</b></li>
    </ul>
    {#if !m.km}<p class="k">{t('No ride or trip in this month.')}</p>{/if}
    <a class="lnk" href="#/debrief">{t('Look back|function')} ›</a>
  </ChartSheet>
{/if}

<style>
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
  .chart {
    grid-column: 1 / -1;
    min-width: 0;
  }
  .year {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }
  @media (min-width: 900px) {
    .year {
      grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
      gap: 24px;
    }
  }
  .card2 {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 12px 24px;
    align-items: center;
    padding: 16px 20px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  @media (min-width: 720px) {
    .card2 {
      grid-template-columns: minmax(0, 1fr) auto;
    }
  }
  dl {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 22px;
    margin: 0;
  }
  dl div {
    display: flex;
    flex-direction: column-reverse;
  }
  dt {
    font-size: 14px;
    color: var(--ink-2);
  }
  dd {
    margin: 0;
    font: 600 26px/1.1 var(--font-body);
    white-space: nowrap;
  }
  dd.down {
    color: var(--accent);
  }
  .lnk {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    font-weight: 500;
    white-space: nowrap;
  }
  .streak {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    padding: 16px 20px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
    color: var(--ink);
  }
  .streak b {
    font: 600 24px/1.2 var(--font-body);
  }
  .k {
    font-size: 14px;
    color: var(--ink-2);
  }
</style>
