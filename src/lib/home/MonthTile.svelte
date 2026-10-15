<script>
  /**
   * v0.101.0 Design-Refresh P2 (H1): «Bike in October» on Today: the km of this month from the rides,
   * and the change against the same days of last month. A tap opens the rides.
   */
  import { Bike, Mountain } from '@lucide/svelte';
  import TileHead from './TileHead.svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { monthKm } from './bausteine.js';
  import { withStravaRides, waitingThisMonth, bikeActs } from '../kmbook.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';

  let { today, rides = [], isnew = false } = $props();
  // v0.121.0 (Noah «1a»): the counted Strava rides count too, a ride uploaded as a file once
  const kmQ = liveQuery(() => db.kmBook.toArray());
  const actQ = liveQuery(() => bikeActs(db));
  const m = $derived(monthKm(withStravaRides(rides, $kmQ ?? [], $actQ ?? []), today));
  // 0.136.0: Strava rides without a bike count after «Passt»; the tile says how many still wait
  const waiting = $derived(waitingThisMonth($kmQ ?? [], today));
  const month = $derived(new Date(`${today}T12:00:00Z`).toLocaleDateString(locale(), { month: 'long', timeZone: 'UTC' }));
</script>

<a class="mo surf" href="#/debrief/ride" aria-labelledby="mo-h" data-section="month">
  <TileHead icon={Bike} id="mo-h" title={t('Bike in {month}', { month })} {isnew} />
  <p class="big num"><b>{num(m.km)}</b> km{#if m.pct != null}<span class="ch" class:down={m.pct < 0}>{m.pct >= 0 ? '▲' : '▼'} {num(Math.abs(m.pct))} %</span>{/if}</p>
  <!-- «Werte überall» WU1: the metres climbed this month -->
  {#if m.hm}<p class="hm num" data-month-hm><Mountain size={14} aria-hidden="true" /><b>{t('{n} m climbed', { n: num(m.hm) })}</b></p>{/if}
  {#if waiting}<p class="wait" data-km-waiting>{tn(waiting, '+ {n} Strava ride to check', '+ {n} Strava rides to check')}</p>{/if}
</a>

<style>
  .mo {
    display: flex;
    flex-direction: column;
    gap: 8px;
    height: 100%;
    padding: 14px 18px;
    box-sizing: border-box;
    color: var(--ink);
    text-decoration: none;
  }
  .mo:hover {
    background: var(--paper-2);
  }
  .big {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px;
    margin: 0;
    font-size: var(--fs-body);
  }
  .big b {
    font: 700 var(--fs-title)/1.1 var(--font-body);
  }
  .hm {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ch {
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--ok-soft);
    color: var(--ok);
    font: 600 var(--fs-tiny)/1.6 var(--font-body);
  }
  .ch.down {
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .wait {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
