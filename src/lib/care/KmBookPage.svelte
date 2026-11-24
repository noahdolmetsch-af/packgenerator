<script>
  /**
   * Sitemap K1 (Noah 24.11.2026 «Fahrtenbuch nach vorne»): Bikes › Care › «Ride ledger» (#/bikes?tab=care&view=km).
   * The ride ledger «Every km counts» of one bike on its own page (it is the same block as in Care › More, KmBook.svelte),
   * so it is one tap from the bikes and needs no fold opened. Loaded only when opened (Bikes.svelte).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { sortBikes } from '../bikes.js';
  import { activeBikes } from '../bikeretire.js';
  import GriffHead from './GriffHead.svelte';
  import KmBook from './KmBook.svelte';

  let { bikeId = null } = $props();
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const bikes = $derived(sortBikes(activeBikes($bikesQ ?? [])));
  const bike = $derived(bikes.find((b) => b.id === bikeId) ?? bikes[0] ?? null);
</script>

<GriffHead {bikes} {bike} view="km" title={t('Ride ledger')} sub={t('Every km counts: each ride with its date, km and source')} />
{#if bike}
  {#key bike.id}<KmBook {bike} {bikes} />{/key}
{/if}
