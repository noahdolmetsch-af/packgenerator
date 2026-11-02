<script>
  /**
   * «Neue Kilometer» (Träume und Neuland N4, Noah 27.10.2026 «1-5 a»), on Touren › Rückblick › Neuland:
   * per year how many km ran on roads you rode for the first time (a bar for the share), and the last rides
   * that brought new km. The lines are the heatmap's (Strava lines, GPX, own recordings), bike rides only.
   * The rules are in neuekm.js (pure, tests/neuekm.test.js). Nothing to set; nothing leaves the device.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { heatLines } from '../heat/heat.js';
  import { newKmOf, newKmSummary, NEAR_M } from './neuekm.js';
  import { dayLong } from '../review/fmt.js';
  import { t, num } from '../i18n.svelte.js';
  import { Flame, Info } from '@lucide/svelte';

  let { today } = $props();
  const dataQ = liveQuery(async () => {
    const [activities, rides, tracks] = await Promise.all([
      db.activities ? db.activities.toArray() : [],
      db.rides.toArray(),
      db.tracks ? db.tracks.where('kind').equals('rec').toArray() : [],
    ]);
    return { activities, rides, tracks };
  });
  const lines = $derived($dataQ ? heatLines({ ...$dataQ, today }).filter((l) => l.kind === 'bike') : null);
  const sum = $derived(lines ? newKmSummary(lines, newKmOf(lines)) : null);
  const pct = (s) => `${Math.round(s * 100)} %`;
</script>

{#if sum}
  <section class="rv-sec nk" aria-labelledby="nk-h" data-new-km>
    <div class="rv-h">
      <div>
        <h2 id="nk-h">{t('New kilometres')}</h2>
        <p class="rv-sub">{t('How many km ran on roads you rode for the first time.')}</p>
      </div>
      <a class="btn sm" href="#/heatmap"><Flame size={16} aria-hidden="true" />{t('Heatmap')}</a>
    </div>
    <div class="card nk-body">
      {#if !sum.years.length}
        <p class="nk-help">{t('No ride with a line yet. Connect Strava or upload a ride, then the app counts your new km.')}</p>
      {:else}
        <ul class="nk-years">
          {#each sum.years as y (y.year)}
            <li data-nk-year={y.year}>
              <div class="nk-yl"><b class="num">{y.year}</b><span><b class="num">{t('{km} km new', { km: num(y.newKm) })}</b> · {t('of {km} km', { km: num(y.km) })} · <span class="num">{pct(y.share)}</span></span></div>
              <div class="nk-bar" aria-hidden="true"><span style:width={`${Math.round(Math.min(1, y.share) * 100)}%`}></span></div>
            </li>
          {/each}
        </ul>
        {#if sum.rides.length}
          <h3 class="nk-lh">{t('Latest rides with new km')}</h3>
          <ul class="nk-rides">
            {#each sum.rides as r (r.id)}
              <li data-nk-ride><span class="nk-rn">{r.name || t('Ride')}</span><small>{dayLong(r.day)}</small><b class="num">{t('{km} of {all} km new', { km: num(Math.round(r.newKm)), all: num(Math.round(r.km)) })}</b></li>
            {/each}
          </ul>
        {/if}
        <p class="nk-note"><Info size={15} aria-hidden="true" /><span>{t('A stretch counts as new when none of your earlier rides passed within {m} m. Rides from Strava, GPX files and your own recordings count.', { m: NEAR_M })}</span></p>
      {/if}
    </div>
  </section>
{/if}

<style>
  .nk {
    margin-top: var(--sp-5, 24px);
  }
  .nk-body {
    display: grid;
    gap: var(--sp-3);
  }
  .nk-years,
  .nk-rides {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 10px;
  }
  .nk-yl {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 12px;
    align-items: baseline;
  }
  .nk-bar {
    height: 8px;
    margin-top: 4px;
    border-radius: 4px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .nk-bar span {
    display: block;
    height: 100%;
    border-radius: 4px;
    background: var(--accent);
  }
  .nk-lh {
    margin: 0;
    font: 600 var(--fs-small) / 1.3 var(--font-body);
    color: var(--ink-2);
  }
  .nk-rides li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0 12px;
    align-items: baseline;
  }
  .nk-rn {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .nk-rides small {
    grid-row: 2;
    color: var(--ink-3);
  }
  .nk-rides b {
    grid-row: 1 / span 2;
    grid-column: 2;
    align-self: center;
    font-weight: 600;
  }
  .nk-help,
  .nk-note {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .nk-note {
    display: flex;
    gap: 6px;
    align-items: flex-start;
  }
  .nk-note :global(svg) {
    flex: none;
    margin-top: 2px;
  }
</style>
