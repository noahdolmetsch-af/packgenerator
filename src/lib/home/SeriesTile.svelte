<script>
  /**
   * v0.94.0 «Kachel-Wand» (mockups A, D, Noah 4a, idea 6): the tile «Series and milestones». ONE
   * series over everything (series.js): weeks in a row with a ride, a trip or any activity of Im Flow.
   * The last 8 weeks as dots, the next milestone, and «Rest week» so a planned break keeps the series.
   * A tap on the title opens all milestones of all areas (#/flow/milestones). size: 'w' or 'l'.
   */
  import { liveQuery } from 'dexie';
  import { Flame, Pause, PartyPopper } from '@lucide/svelte';
  import { db } from '../db.js';
  import { activeDays, seriesOf, toggleRest, restOf, REST_KEY } from './series.js';
  import { t, tn } from '../i18n.svelte.js';

  let { today, size = 'w', party = false } = $props();
  const q = $derived(
    liveQuery(async () => {
      const [log, rides, trips, debriefs, rest] = await Promise.all([db.flowLog.toArray(), db.rides.toArray(), db.trips.toArray(), db.debriefs.toArray(), db.settings.get(REST_KEY)]);
      return { days: activeDays({ log, rides, trips: trips.filter((x) => !x.archivedAt), debriefs, today }), rest: restOf(rest?.value) };
    }),
  );
  const s = $derived($q ? seriesOf($q.days, $q.rest, today) : null);
  const big = $derived(size === 'l');
  async function rest() {
    const cur = (await db.settings.get(REST_KEY))?.value ?? [];
    await db.settings.put({ key: REST_KEY, value: toggleRest(cur, today) });
  }
</script>

<section class="ser surf" class:big class:party aria-labelledby="ser-h" data-series={s?.n ?? 0}>
  <a class="hd" href="#/flow/milestones">
    <span class="fi"><Flame size={18} aria-hidden="true" /></span>
    <h2 id="ser-h">{t('Series and milestones')}</h2>
  </a>
  {#if s}
    <p class="n"><b class="num">{s.n}</b> <span>{tn(s.n, 'week in a row active', 'weeks in a row active')}</span>{#if party}<PartyPopper size={18} aria-hidden="true" />{/if}</p>
    <ol class="wk" aria-label={t('The last {n} weeks', { n: s.weeks.length })}>
      {#each s.weeks as w (w.week)}
        <li class:on={w.on} class:rest={w.rest && !w.on} class:now={w.now} title={w.week}><span class="sr">{w.on ? t('active') : w.rest ? t('rest week') : t('nothing')}</span></li>
      {/each}
    </ol>
    {#if big || s.next}
      <p class="nx">{[s.next ? t('Next: {n} weeks (still {k})', { n: s.next, k: s.left }) : '', big && s.record > s.n ? t('Record {n}', { n: s.record }) : ''].filter(Boolean).join(' · ')}</p>
    {/if}
    {#if big}
      <p class="all">{t('Everything counts: a ride, a trip, meditation, yoga, tennis, gym …')}</p>
      <button type="button" class="btn sm rw" aria-pressed={s.rest} onclick={rest}><Pause size={16} aria-hidden="true" />{s.rest ? t('Rest week ✓') : t('This week: rest week')}</button>
    {/if}
  {/if}
</section>

<style>
  .ser {
    display: flex;
    flex-direction: column;
    gap: 6px;
    height: 100%;
    padding: 12px 14px;
    border: 1px solid var(--card-line, var(--line));
    border-radius: 14px;
    background: var(--paper);
  }
  .ser.party {
    border-color: var(--hi);
  }
  .hd {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    color: var(--ink);
    text-decoration: none;
  }
  .hd:hover h2 {
    text-decoration: underline;
  }
  .fi {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: var(--hi-soft);
    color: var(--hi);
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-small)/1.2 var(--font-body);
  }
  .n {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin: 0;
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .n b {
    font: 800 var(--fs-title)/1 var(--font-brand);
  }
  .wk {
    display: flex;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .wk li {
    flex: 1;
    height: 8px;
    max-width: 28px;
    border-radius: 4px;
    background: var(--line);
  }
  .wk li.on {
    background: var(--hi);
  }
  .wk li.rest {
    background: repeating-linear-gradient(45deg, var(--line-strong) 0 3px, transparent 3px 6px);
  }
  .wk li.now:not(.on) {
    outline: 1.5px solid var(--hi);
    outline-offset: -1.5px;
  }
  .nx,
  .all {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.35;
  }
  .all {
    color: var(--ink-3);
  }
  .rw {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: auto;
  }
</style>
