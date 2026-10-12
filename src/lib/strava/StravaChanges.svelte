<script>
  /**
   * v0.112.0 «Strava-Verbindung» (decision 4b, mockups S4 and S5): «Velo in Strava geändert». A ride
   * the app already took got another bike in Strava: the app asks, clearly visible, on top of Today and
   * on the bike's care page, until you choose: «Übernehmen» (the km move to the bike Strava names now)
   * or «Behalten». bikeId: only the questions about this bike (from or to it); none: all of them.
   * wide: the buttons beside the text (Today on a computer); otherwise below it.
   */
  import { liveQuery } from 'dexie';
  import { ArrowLeftRight } from '@lucide/svelte';
  import { db } from '../db.js';
  import { strava, answerChange } from './client.svelte.js';
  import { t, num, dateOf } from '../i18n.svelte.js';

  let { bikeId = null, wide = false } = $props();

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const nameOf = (id) => ($bikesQ ?? []).find((b) => b.id === id)?.name ?? '–';
  const list = $derived(strava.changes.filter((c) => !bikeId || c.fromBike === bikeId || c.toBike === bikeId));
  let busy = $state(false);
  async function answer(c, take) {
    busy = true;
    try {
      await answerChange(db, $state.snapshot(c), take);
    } finally {
      busy = false;
    }
  }
</script>

{#each list as c (c.entryId)}
  <section class="sc" class:wide aria-labelledby="sc-h-{c.entryId}" data-strava-change={c.id}>
    {#if wide}<span class="ic" aria-hidden="true"><ArrowLeftRight size={20} /></span>{/if}
    <div class="tx">
      <h2 id="sc-h-{c.entryId}">{t('Bike changed in Strava')}</h2>
      <p class="what">
        {t('Ride {date}, {km} km, now', { date: dateOf(c.date), km: num(c.km) })}
        <b>‹{c.toBike ? nameOf(c.toBike) : t('does not count')}›</b>
        {t('instead of')} <s>‹{nameOf(c.fromBike)}›</s>
      </p>
      <p class="why">
        {#if c.toBike}{t('{km} km then go from {from} to {to} · chain and brakes count along', { km: num(c.km), from: nameOf(c.fromBike), to: nameOf(c.toBike) })}{:else}{t('The ride then no longer counts for {from}.', { from: nameOf(c.fromBike) })}{/if}
      </p>
    </div>
    <div class="acts">
      <button type="button" class="btn hi" disabled={busy} onclick={() => answer(c, true)}>{t('Take over|strava')}</button>
      <button type="button" class="btn" disabled={busy} onclick={() => answer(c, false)}>{t('Keep|strava')}</button>
    </div>
  </section>
{/each}

<style>
  .sc {
    display: grid;
    gap: 12px;
    margin: 0 0 16px;
    padding: 16px 18px;
    border: 1px solid var(--warn);
    border-radius: var(--radius-card);
    background: var(--warn-soft);
    color: var(--ink);
  }
  .sc.wide {
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px 16px;
  }
  .ic {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: var(--radius);
    background: var(--paper);
    color: var(--warn);
  }
  .tx {
    min-width: 0;
  }
  h2 {
    margin: 0 0 2px;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .what {
    margin: 0;
    overflow-wrap: break-word;
  }
  .what s {
    color: var(--ink-2);
  }
  .why {
    margin: 4px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .acts {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
  .sc.wide .acts {
    display: flex;
  }
  @media (max-width: 720px) {
    .sc.wide {
      grid-template-columns: minmax(0, 1fr);
    }
    .sc.wide .ic {
      display: none;
    }
    .sc.wide .acts {
      display: grid;
    }
  }
</style>
