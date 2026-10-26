<script>
  /**
   * Paket VG 1128 «Nasse Fahrt», Noah 21.10.2026 «1b»: the reminder after a ride in the rain stands only here,
   * on the page «Verschleiss», and as the phone reminder (push kind 'wetchain'), not as a window on Heute.
   * Shown on the day of a wet ride of this bike (start cell, inspect/rain.js) until the chain is cared for;
   * the switch «Reminders» turns it off with the push (griff.prefs.wetChain).
   */
  import { liveQuery } from 'dexie';
  import { Droplets } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, num, locale } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { addDays } from '../play.js';
  import { PREFS_KEY, prefsOf, wetSince, wetTaskShows, chainCaredOn, WET_LOOK_DAYS } from '../griff.js';
  import { wetChainDone } from '../griffdb.js';
  import { wetOf } from '../inspect/rain.js';
  import { INSPECT_RAIN } from '../inspect/inspect.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import WetLater from '../stand/WetLater.svelte'; // Paket A part 2: only wiped, or not today
  import { WET_LATER_KEY, wetRests } from '../stand/stand.js';

  let { bike } = $props();
  const today = localDay();
  const wetQ = liveQuery(async () => {
    const [prefs, rides, rain] = await Promise.all([db.settings.get(PREFS_KEY), db.kmBook.where('date').aboveOrEqual(addDays(today, -(WET_LOOK_DAYS - 1))).toArray().catch(() => []), db.meta.get(INSPECT_RAIN)]);
    if (!prefsOf(prefs?.value).wetChain) return null;
    return { rides, isWet: wetOf(rain) };
  });
  const laterQ = liveQuery(() => db.settings.get(WET_LATER_KEY));
  // Einzelidee Heute 5: the wet days since the last chain care make one task (wetSince)
  const run = $derived(bike && $wetQ ? wetSince($wetQ.rides, bike, today, $wetQ.isWet) : null);
  const wet = $derived(bike && !chainCaredOn(bike, today) && !wetRests($laterQ?.value, bike.id, today) && wetTaskShows(run) ? run : null);
  const dayName = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'numeric' });

  async function done() {
    const undo = await wetChainDone(bike.id, today);
    if (undo) offerDone(t('Chain dried and oiled: saved in Bike care.'), () => db.bikes.update(undo.bikeId, { parts: undo.parts }));
  }
</script>

{#if wet}
  <section class="wetc" role="status" data-wet-chain>
    <Droplets size={20} aria-hidden="true" />
    <div class="grow">
      <b>{wet.n >= 2 ? t('Care for the chain') : t('Dry and oil the chain')}</b>
      {#if wet.n >= 2}
        <p data-wet-chain-series>{t('{bike} was out in the wet {n} times since the chain was last cared for ({km} km: {days}). One care is enough for all of them.', { bike: bike.name, n: wet.n, km: num(wet.km), days: wet.days.map((d) => dayName(d.day)).join(', ') })}</p>
      {:else}
        <p>{t('{bike} was out in the rain today ({km} km). A dry, oiled chain lasts longer.', { bike: bike.name, km: num(wet.km) })}</p>
      {/if}
      <p class="quiet">{t('Wipe it with a cloth, a drop of oil on every link, wipe off what is too much.')}</p>
    </div>
    <button type="button" class="btn hi sm" onclick={done} data-wet-chain-done>{t('Done: chain oiled')}</button>
    <WetLater {bike} {today} />
  </section>
{/if}

<style>
  .wetc {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: flex-start;
    padding: 12px 14px;
    margin: 0 0 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-card);
    background: var(--warn-soft);
  }
  .wetc p {
    margin: 4px 0 0;
  }
  .grow {
    flex: 1 1 14rem;
    min-width: 0;
  }
</style>
