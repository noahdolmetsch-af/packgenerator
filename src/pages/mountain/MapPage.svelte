<script>
  /**
   * Paket J #161 (Noah «2a»): the page of the swisstopo map (lazy: this file and Leaflet load only here).
   * #/mountain/map?trip=<id> opens at the trip's start place, else at your last tour or Switzerland.
   */
  import { liveQuery } from 'dexie';
  import { ChevronLeft } from '@lucide/svelte';
  import { db } from '../../lib/db.js';
  import { openTrip } from '../../lib/nav.js';
  import SwissMap from '../../lib/mountain/SwissMap.svelte';
  import { t } from '../../lib/i18n.svelte.js';

  let { tripId = '' } = $props();
  const tripQ = liveQuery(async () => (tripId ? ((await db.trips.get(tripId)) ?? null) : null));
  const trip = $derived($tripQ);
  let online = $state(typeof navigator === 'undefined' ? true : navigator.onLine);
</script>

<div class="sk mp">
  <p class="sk-back">{#if trip}<a href="#/pack" onclick={() => openTrip(trip.id)}><ChevronLeft size={16} aria-hidden="true" />{trip.title}</a>{:else}<a href="#/mountain"><ChevronLeft size={16} aria-hidden="true" />{t('Mountain and emergency')}</a>{/if}</p>
  <h1 class="sk-h1" tabindex="-1" data-page-title>{t('Map with steep slopes')}</h1>
  <p class="sk-sub">{t('The national map of swisstopo. Slopes over 30° are coloured: there avalanches can start. The map shows the slope only, not the danger.')}</p>
  {#if !online}<p class="sk-quiet" role="status">{t('Offline: only the parts of the map you looked at before show.')}</p>{/if}
  {#if tripId === '' || trip !== undefined}
    {#key trip?.id ?? ''}<SwissMap place={trip?.place ?? null} label={trip?.place?.name ?? ''} />{/key}
  {/if}
</div>

<style>
  .mp {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
</style>
