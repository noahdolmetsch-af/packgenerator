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
  import { t, num } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { PREFS_KEY, prefsOf, wetRides, chainCaredOn } from '../griff.js';
  import { wetChainDone } from '../griffdb.js';
  import { wetOf } from '../inspect/rain.js';
  import { INSPECT_RAIN } from '../inspect/inspect.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import WetLater from '../stand/WetLater.svelte'; // Paket A part 2: only wiped, or not today
  import { WET_LATER_KEY, wetRests } from '../stand/stand.js';

  let { bike } = $props();
  const today = localDay();
  const wetQ = liveQuery(async () => {
    const [prefs, rides, rain] = await Promise.all([db.settings.get(PREFS_KEY), db.kmBook.where('date').equals(today).toArray().catch(() => []), db.meta.get(INSPECT_RAIN)]);
    if (!prefsOf(prefs?.value).wetChain) return [];
    return wetRides(rides, today, wetOf(rain));
  });
  const laterQ = liveQuery(() => db.settings.get(WET_LATER_KEY));
  const wet = $derived(bike && !chainCaredOn(bike, today) && !wetRests($laterQ?.value, bike.id, today) ? (($wetQ ?? []).find((w) => w.bikeId === bike.id) ?? null) : null);

  async function done() {
    const undo = await wetChainDone(bike.id, today);
    if (undo) offerDone(t('Chain dried and oiled: saved in Bike care.'), () => db.bikes.update(undo.bikeId, { parts: undo.parts }));
  }
</script>

{#if wet}
  <section class="wetc" role="status" data-wet-chain>
    <Droplets size={20} aria-hidden="true" />
    <div class="grow">
      <b>{t('Dry and oil the chain')}</b>
      <p>{t('{bike} was out in the rain today ({km} km). A dry, oiled chain lasts longer.', { bike: bike.name, km: num(wet.km) })}</p>
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
