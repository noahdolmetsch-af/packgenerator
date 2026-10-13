<script>
  /**
   * v0.101.0 Design-Refresh P2 (H1): «This week» on Today: Monday to Sunday, a dot for each activity
   * ticked in Im Flow and for a ride (with its km), today framed. Reads the rides and the Im Flow log.
   */
  import { Activity } from '@lucide/svelte';
  import TileHead from './TileHead.svelte';
  import { flowQuery } from '../flow/data.svelte.js';
  import { actName } from '../flow/ui.svelte.js';
  import { weekDays, activeCount } from './bausteine.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { heartBetween, withStravaRides } from '../kmbook.js';
  import HeartLine from '../strava/HeartLine.svelte';

  let { today, rides = [], isnew = false } = $props();
  const q = $derived(flowQuery(today));
  const data = $derived($q);
  const acts = $derived(Object.fromEntries((data?.acts ?? []).map((a) => [a.id, a])));
  // heart rate of this week's Strava rides (observation only, Noah 12.10.2026 «2a»)
  const kmQ = liveQuery(() => db.kmBook.toArray());
  // v0.119.0 (Noah «1a»): the counted Strava rides count too, a ride uploaded as a file once
  const days = $derived(weekDays({ today, log: data?.log ?? [], rides: withStravaRides(rides, $kmQ ?? []) }));
  const n = $derived(activeCount(days));
  const heart = $derived(days.length ? heartBetween($kmQ ?? [], days[0].day, today) : null);
  const wd = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', timeZone: 'UTC' }).replace('.', '');
</script>

<section class="wk surf" aria-labelledby="wk-h" data-section="week">
  <TileHead icon={Activity} id="wk-h" title={t('This week')} {isnew} />
  <p class="sub">{tn(n, '{n} day active', '{n} days active')}{#if heart} · <HeartLine {heart} size={12} />{/if}</p>
  <ol class="days">
    {#each days as d (d.day)}
      <li class:now={d.day === today} class:future={d.future} data-day={d.day}>
        <b>{wd(d.day)}</b>
        <span class="dots" aria-hidden="true">
          {#if d.ride}<i class="ride"></i>{/if}
          {#each d.acts.slice(0, 3) as a (a)}<i class={acts[a]?.ring ?? 'move'}></i>{/each}
        </span>
        <small>{[d.ride ? (d.km ? t('Bike {km} km', { km: num(d.km) }) : t('Bike|ride')) : '', ...d.acts.slice(0, 2).map((a) => actName(acts[a]))].filter(Boolean).join(', ')}</small>
      </li>
    {/each}
  </ol>
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
    background: var(--accent);
  }
  .dots i.rest {
    background: var(--l3);
  }
  small {
    max-width: 100%;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    line-height: 1.2;
    overflow-wrap: break-word;
  }
  @media (max-width: 719px) {
    .days {
      gap: 2px;
      padding: 4px;
    }
  }
</style>
