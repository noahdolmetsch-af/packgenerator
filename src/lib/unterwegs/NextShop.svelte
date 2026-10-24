<script>
  /**
   * «Alles fertig» (Versteckte Funktionen, idea «Nächster Laden»): the small line of the «Live map» button on
   * Unterwegs names the next shop ahead, from the stops the live map or the stops page already loaded for this
   * trip (no new request, no GPS). km: where the plan says you are now, counted from the start of the route.
   * Without loaded stops the usual text stays.
   */
  import { cacheQuery } from '../race/store.js';
  import { POI_CACHE } from '../race/outside.js';
  import { t, num } from '../i18n.svelte.js';
  import { nextShopOf } from './nextshop.js';

  let { tripId, km = null } = $props();
  // svelte-ignore state_referenced_locally
  const q = cacheQuery(POI_CACHE + tripId);
  const shop = $derived(nextShopOf($q?.data ?? [], km));
</script>

<small data-next-shop={shop ? 'on' : 'off'}>{#if shop}{shop.name ? t('Next shop: {name}, in about {n} km', { name: shop.name, n: num(shop.dist) }) : t('Next shop in about {n} km', { n: num(shop.dist) })}{:else}{t('where you are, next shop, arrival')}{/if}</small>
