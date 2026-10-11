<script>
  /**
   * v0.94.0 «Kachel-Wand» (mockup D, Noah 4a: «Meilensteine aller Bereiche auf einer Seite»): on top
   * of the milestones page, the series over everything (series.js) with its next milestone and the
   * rest week, and the milestones of trips and bikes (heute.js: 10, 25, 50 … trips, every 1000 km
   * of a bike, the first night out). The milestones of the activities follow below (flowms.js).
   */
  import { liveQuery } from 'dexie';
  import { Flame, Pause, Backpack, Bike, Moon } from '@lucide/svelte';
  import { db } from '../db.js';
  import { activeDays, seriesOf, toggleRest, restOf, REST_KEY, SERIES_STEPS } from './series.js';
  import { homeTrips, TRIP_STEPS } from './heute.js';
  import { tripDone } from '../yearreview.js';
  import { localDay } from '../localday.js';
  import { t, tn, num } from '../i18n.svelte.js';

  const today = localDay();
  const q = liveQuery(async () => {
    const [log, rides, trips, debriefs, bikes, rest] = await Promise.all([db.flowLog.toArray(), db.rides.toArray(), db.trips.toArray(), db.debriefs.toArray(), db.bikes.toArray(), db.settings.get(REST_KEY)]);
    const home = homeTrips(trips);
    const done = home.filter((x) => tripDone(x, debriefs, today));
    return {
      s: seriesOf(activeDays({ log, rides, trips: home, debriefs, today }), restOf(rest?.value), today),
      trips: done.length,
      night: done.some((x) => Number(x.days) > 1 && x.overnight !== 'lodging' && x.overnight !== 'none'),
      bikes: bikes.filter((b) => typeof b.km === 'number' && b.km > 0).map((b) => ({ id: b.id, name: b.name, km: b.km })),
    };
  });
  const d = $derived($q);
  const nextTrips = $derived(d ? (TRIP_STEPS.find((x) => x > d.trips) ?? null) : null);
  async function rest() {
    const cur = (await db.settings.get(REST_KEY))?.value ?? [];
    await db.settings.put({ key: REST_KEY, value: toggleRest(cur, today) });
  }
</script>

{#if d}
  <div class="msh">
    <section class="surf msc" data-ms-series aria-labelledby="msh-s">
      <h2 id="msh-s" class="ht"><Flame size={18} aria-hidden="true" />{t('Series over everything')}</h2>
      <p class="big" data-n={d.s.n}><b class="num">{d.s.n}</b> {tn(d.s.n, 'week in a row active', 'weeks in a row active')}</p>
      <ol class="wk" aria-label={t('The last {n} weeks', { n: d.s.weeks.length })}>
        {#each d.s.weeks as w (w.week)}<li class:on={w.on} class:rest={w.rest && !w.on} class:now={w.now}><span class="sr">{w.on ? t('active') : w.rest ? t('rest week') : t('nothing')}</span></li>{/each}
      </ol>
      <ul class="steps" aria-label={t('Milestones of the series')}>
        {#each SERIES_STEPS as x (x)}<li class:got={d.s.record >= x}>{tn(x, '{n} week', '{n} weeks')}</li>{/each}
      </ul>
      <p class="hint">{[d.s.next ? t('Next: {n} weeks (still {k})', { n: d.s.next, k: d.s.left }) : '', t('Record {n}', { n: d.s.record })].filter(Boolean).join(' · ')}</p>
      <p class="hint">{t('Everything counts: a ride, a trip, meditation, yoga, tennis, gym …')} {t('A rest week keeps the series.')}</p>
      <button type="button" class="btn sm rw" aria-pressed={d.s.rest} onclick={rest}><Pause size={16} aria-hidden="true" />{d.s.rest ? t('Rest week ✓') : t('This week: rest week')}</button>
    </section>
    <section class="surf msc" data-ms-trips aria-labelledby="msh-t">
      <h2 id="msh-t" class="ht"><Backpack size={18} aria-hidden="true" />{t('Trips and bikes')}</h2>
      <ul class="rows">
        <li><Backpack size={18} aria-hidden="true" /><span><b>{tn(d.trips, '{n} trip with the app', '{n} trips with the app')}</b>{#if nextTrips}<small>{t('Next milestone: {n} trips', { n: nextTrips })}</small>{/if}</span></li>
        {#each d.bikes as b (b.id)}<li><Bike size={18} aria-hidden="true" /><span><b>{b.name}: {num(Math.round(b.km))} km</b><small>{t('Next milestone: {km} km', { km: num((Math.floor(b.km / 1000) + 1) * 1000) })}</small></span></li>{/each}
        <li class:off={!d.night}><Moon size={18} aria-hidden="true" /><span><b>{d.night ? t('First night out ✓') : t('First night out')}</b></span></li>
      </ul>
    </section>
  </div>
{/if}

<style>
  .msh {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  @media (max-width: 719px) {
    .msh {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .msc {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px 18px;
  }
  .ht {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font: 600 var(--fs-sub) / 1.2 var(--font-body);
  }
  .ht :global(svg) {
    color: var(--hi);
  }
  .big {
    margin: 0;
    font-weight: 600;
  }
  .big b {
    font: 800 var(--fs-page)/1 var(--font-brand);
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
    max-width: 36px;
    height: 10px;
    border-radius: 5px;
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
  .steps {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .steps li {
    padding: 2px 10px;
    border: 1px solid var(--line);
    border-radius: 999px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .steps li.got {
    border-color: var(--hi);
    background: var(--hi-soft);
    color: var(--ink);
    font-weight: 600;
  }
  .hint {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .rw {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .rows {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .rows li {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    border-top: 1px solid var(--line);
  }
  .rows li:first-child {
    border-top: 0;
  }
  .rows li :global(svg) {
    flex: none;
    color: var(--ink-2);
  }
  .rows span {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .rows small {
    color: var(--ink-3);
  }
  .rows li.off {
    color: var(--ink-3);
  }
</style>
