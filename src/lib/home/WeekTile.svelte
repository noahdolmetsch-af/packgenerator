<script>
  /**
   * v0.101.0 Design-Refresh P2 (H1): «This week» on Today: Monday to Sunday, a dot for each activity
   * ticked in Im Flow and for a ride (with its km), today framed. Reads the rides and the Im Flow log.
   * «Woche planen» WP4 (Noah 15.10.2026 «5a, wenn mit 1a kombinierbar»): the same card in the same
   * place, a little richer: under each day a dot per kind of the plan (lib/woche.js), the block «Today
   * by the plan» and a line for tomorrow, and the link «To the week». Without a plan nothing changes.
   */
  import { Activity, Bike, Mountain, Timer } from '@lucide/svelte';
  import TileHead from './TileHead.svelte';
  import { flowQuery } from '../flow/data.svelte.js';
  import { actName } from '../flow/ui.svelte.js';
  import { weekDays, activeCount, weekTotals } from './bausteine.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { heartBetween, withStravaRides, bikeActs } from '../kmbook.js';
  import HeartLine from '../strava/HeartLine.svelte';
  import { ChevronRight } from '@lucide/svelte';
  import Entry from '../woche/Entry.svelte';
  import { weekQuery } from '../woche/load.js';
  import { buildWeek, dotsOf } from '../woche.js';
  import { titleOf } from '../woche/words.js';
  import { mondayOf, shiftDay } from '../training.js';
  import { azmWeek, addDays } from '../health.js';
  import { health } from '../health/client.svelte.js';

  let { today, rides = [], isnew = false } = $props();
  const q = $derived(flowQuery(today));
  const data = $derived($q);
  const acts = $derived(Object.fromEntries((data?.acts ?? []).map((a) => [a.id, a])));
  // heart rate of this week's Strava rides (observation only, Noah 12.10.2026 «2a»)
  const kmQ = liveQuery(() => db.kmBook.toArray());
  // v0.121.0 (Noah «1a»): the counted Strava rides count too, a ride uploaded as a file once
  const actQ = liveQuery(() => bikeActs(db)); // 0.136.0: Strava rides before a bike's start point
  const days = $derived(weekDays({ today, log: data?.log ?? [], rides: withStravaRides(rides, $kmQ ?? [], $actQ ?? []) }));
  const n = $derived(activeCount(days));
  // «Werte überall» WU1 (Noah 13.10.2026 «1-5a»): km · Hm · minutes in one line, the heart rate next to it
  const tot = $derived(weekTotals(days.filter((d) => !d.future)));
  const heart = $derived(days.length ? heartBetween($kmQ ?? [], days[0].day, today) : null);
  // «Woche planen» WP4: the plan of this week (and Monday of the next one for «tomorrow» on a Sunday)
  const wq = $derived(weekQuery(today));
  const ws = $derived($wq);
  const plan = $derived(ws ? buildWeek({ ...ws, monday: mondayOf(today), today, actName: (id) => actName(acts[id]) || id }) : null);
  const planOf = (day) => plan?.days.find((d) => d.day === day) ?? null;
  const todayPlan = $derived(planOf(today)?.entries ?? []);
  const tomorrow = $derived(shiftDay(today, 1));
  const tomorrowPlan = $derived(planOf(tomorrow)?.entries ?? []);
  const hasPlan = $derived(!!plan?.days.some((d) => d.entries.length));
  // Noah 19.10.2026 «1a»: the active zone minutes of this week from Fitbit (healthDays) in the same line
  const azmQ = $derived(liveQuery(() => db.healthDays.where('date').aboveOrEqual(addDays(today, -7)).toArray()));
  const azm = $derived(azmWeek($azmQ ?? [], today));
  const wd = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', timeZone: 'UTC' }).replace('.', '');
</script>

<section class="wk surf" aria-labelledby="wk-h" data-section="week">
  <TileHead icon={Activity} id="wk-h" title={t('This week')} {isnew} info="tile.week" />
  <!-- UI-Test T4: «0 Tage aktiv» beside measured Fitbit minutes read like a contradiction: an empty week
       says nothing is entered yet, and what Fitbit measured -->
  <p class="sub" data-week-sub>{n ? tn(n, '{n} day active', '{n} days active') : t('Nothing entered yet')}{#if !n && azm.any}{' · '}{t('Fitbit measured {n} active zone min', { n: num(azm.sum) })}{/if}</p>
  <ol class="days">
    {#each days as d (d.day)}
      {@const parts = [d.ride ? (d.km ? t('Bike {km} km', { km: num(d.km) }) : t('Bike|ride')) : '', ...d.acts.slice(0, 2).map((a) => actName(acts[a]))].filter(Boolean)}
      <li class:now={d.day === today} class:future={d.future} data-day={d.day}>
        <b>{wd(d.day)}</b>
        <span class="dots" aria-hidden="true">
          {#if d.ride}<i class="ride"></i>{/if}
          {#each d.acts.slice(0, 3) as a (a)}<i class={acts[a]?.ring ?? 'move'}></i>{/each}
        </span>
        {#if hasPlan && planOf(d.day)}<span class="pdots" aria-hidden="true" data-plan-dots>{#each dotsOf(planOf(d.day)) as k (k)}<i class="k-{k}"></i>{/each}</span>{/if}
        <!-- 0.136.0: one line per thing, a long word ends in «…» instead of breaking inside («Liegestütz/e») -->
        <small title={parts.join(', ')}>{#each parts as p, i (i)}<span class="it">{p}</span>{' '}{/each}</small>
      </li>
    {/each}
  </ol>
  {#if hasPlan}
    <div class="plan" data-today-plan>
      <b>{t('Today by the plan')}</b>
      {#if todayPlan.length}
        <div class="ens">{#each todayPlan.slice(0, 4) as e (e.id)}<Entry {e} />{/each}</div>
        {#if todayPlan.length > 4}<small>{t('and {n} more', { n: todayPlan.length - 4 })}</small>{/if}
      {:else}<small>{t('Nothing planned today.')}</small>{/if}
    </div>
    {#if tomorrowPlan.length}<p class="tmr" data-tomorrow>{t('Tomorrow: {list}', { list: tomorrowPlan.slice(0, 3).map((e) => `${titleOf(e)}${e.time ? ` ${e.time}` : ''}`).join(' · ') })}</p>{/if}
  {/if}
  <a class="towk" href="#/week" data-to-week>{hasPlan ? t('To the week') : t('Plan the week')}<ChevronRight size={16} aria-hidden="true" /></a>
  <p class="vals" data-week-values>
    <span><Bike size={14} aria-hidden="true" /><b class="num">{num(tot.km)} km</b></span>
    {#if tot.hm}<span><Mountain size={14} aria-hidden="true" /><b class="num">{t('{n} m climbed', { n: num(tot.hm) })}</b></span>{/if}
    {#if azm.any}<span data-week-azm><Timer size={14} aria-hidden="true" /><b class="num">{t('{n} active zone min', { n: num(azm.sum) })}</b></span>
    {:else if !health.prefs.connected}<span class="soon"><Timer size={14} aria-hidden="true" />{t('Minutes come with Fitbit')}</span>{/if}
    {#if heart}<span><HeartLine {heart} size={14} /></span>{/if}
  </p>
</section>

<style>
  .wk {
    display: flex;
    flex-direction: column;
    gap: 8px;
    height: 100%;
    padding: 14px 18px;
    box-sizing: border-box;
  }
  .sub {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .pdots {
    display: flex;
    gap: 2px;
    min-height: 6px;
  }
  .pdots i {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--wk-sport);
  }
  .pdots i.k-date {
    background: var(--wk-date);
  }
  .pdots i.k-todo {
    background: var(--wk-todo);
  }
  .pdots i.k-away {
    background: var(--wk-away);
  }
  .pdots i.k-bike {
    background: var(--wk-bike);
  }
  .plan {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
    border-radius: var(--r-ctl);
    background: var(--hi-soft);
  }
  .plan small,
  .tmr {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ens {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .towk {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    gap: 2px;
    min-height: 44px;
    color: var(--ink);
    font-weight: 500;
    font-size: var(--fs-small);
  }
  .vals {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .vals span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .vals .soon {
    color: var(--ink-3);
  }
  .days {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 4px;
    margin: 0;
    padding: 6px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    list-style: none;
  }
  .days li {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-width: 0;
    padding: 6px 2px;
    border: 2px solid transparent;
    border-radius: 8px;
    background: var(--paper);
    text-align: center;
  }
  .days li.now {
    border-color: var(--hi);
  }
  .days li.future {
    background: transparent;
    border: 1px dashed var(--line-strong);
  }
  b {
    font-size: var(--fs-tiny);
    font-weight: 600;
  }
  .dots {
    display: flex;
    gap: 3px;
    min-height: 8px;
  }
  .dots i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--hi);
  }
  .dots i.mind {
    background: var(--l4);
  }
  .dots i.rest {
    background: var(--l3);
  }
  small {
    max-width: 100%;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    line-height: 1.2;
  }
  small .it {
    display: block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  @media (max-width: 719px) {
    .days {
      gap: 2px;
      padding: 4px;
    }
  }
</style>
