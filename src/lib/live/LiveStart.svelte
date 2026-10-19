<script>
  /**
   * Paket U3 «Live-Karte» (Noah 19.10.2026 «5a»: «Aktiv „Ausfahrt starten"» and on every tour): one small
   * line «Start the ride ›». trip: that trip's live map; without trip: the trip of today, else a free ride.
   */
  import { liveQuery } from 'dexie';
  import { Navigation, ChevronRight } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { todayTrip, liveHref } from './start.js';

  let { trip = undefined, sub = '' } = $props();
  // svelte-ignore state_referenced_locally
  const tripsQ = trip === undefined ? liveQuery(() => db.trips.toArray()) : null;
  const target = $derived(trip !== undefined ? trip : todayTrip(($tripsQ ?? []), localDay()));
</script>

<a class="lvs" href={liveHref(target)} data-live-start>
  <Navigation size={16} aria-hidden="true" /><span>{t('Start the ride')}{#if sub}<small> · {sub}</small>{/if}</span><ChevronRight size={16} aria-hidden="true" />
</a>

<style>
  .lvs {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    color: var(--accent);
    font-size: var(--fs-small);
    font-weight: 600;
    text-decoration: none;
  }
  .lvs small {
    color: var(--ink-2);
    font-weight: 400;
  }
</style>
