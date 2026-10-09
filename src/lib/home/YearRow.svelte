<script>
  /**
   * v0.46.0 «Startseite neu» (Noah 29a, 22a): the last 12 months in one row: trips, km and the change
   * of the base weight, 12 mini bars of the km per month (this month in the action colour) and the
   * link to the review; beside it the series: weeks in a row with at least one trip or ride.
   * Only once a trip or ride happened in the last 12 months.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { loadReview } from '../review/load.js';
  import { yearReview, tripDone } from '../yearreview.js';
  import { formatWeight } from '../gear.js';
  import { homeTrips, monthBars, streakWeeks } from './heute.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';

  let { today } = $props();

  const dataQ = liveQuery(() => loadReview(db));
  const data = $derived($dataQ ? { ...$dataQ, trips: homeTrips($dataQ.trips) } : null);
  const review = $derived(data ? yearReview({ ...data, today }) : null);
  const bars = $derived(review ? monthBars(review.months, today) : []);
  const streak = $derived(data ? streakWeeks([...data.trips.filter((x) => tripDone(x, data.debriefs, today)).map((x) => x.startDate), ...data.rides.map((r) => r.date)], today) : 0);
  const base = $derived(review?.pack.trend?.diffG ?? null);
  const monthName = (m) => new Date(`${m}-15T12:00:00`).toLocaleDateString(locale(), { month: 'long', year: 'numeric' });
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
      <div class="bars" role="img" aria-label={t('km per month, last 12 months')}>
        {#each bars as b (b.month)}<span class:now={b.now} style:height="{Math.max(b.pct, 3)}%" title="{monthName(b.month)}: {num(b.km)} km"></span>{/each}
      </div>
      <a class="lnk" href="#/debrief">{t('Look back|function')} ›</a>
    </div>
    <div class="streak">
      <span class="k">{t('Series')}</span>
      {#if streak}
        <b class="num">{tn(streak, '{n} week in a row', '{n} weeks in a row')}</b>
        <span class="k">{t('every week at least 1 trip')}</span>
      {:else}
        <b>{t('A new series starts')}</b>
        <span class="k">{t('with your next trip or ride')}</span>
      {/if}
    </div>
  </section>
{/if}

<style>
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
    border: 1px solid var(--line);
    border-radius: 18px;
    background: var(--paper);
  }
  @media (min-width: 720px) {
    .card2 {
      grid-template-columns: auto minmax(0, 1fr) auto;
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
  .bars {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 4px;
    align-items: end;
    height: 56px;
  }
  .bars span {
    border-radius: 2px;
    background: var(--bar);
  }
  .bars span.now {
    background: var(--hi);
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
    border-radius: 18px;
    background: var(--accent-soft);
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
