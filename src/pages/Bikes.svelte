<script>
  /**
   * Bikes (v0.21.0, Noah's answers 6a and 5): one page with a tab per view, Setup and Care.
   * The tab and the chosen bike live in the address (#/bikes?tab=care&bike=<id>), so a link,
   * the back button and a reload come back to the same place. The old #/care lands on Care.
   */
  import { parseBikesHash, bikesHash } from '../lib/bikes.js';
  import BikesNav from '../lib/care/BikesNav.svelte';
  import SetupTab from '../lib/bikes/SetupTab.svelte';
  import CareTab from '../lib/care/CareTab.svelte';
  import Compare from '../lib/bikes/Compare.svelte';
  import ShopTab from '../lib/bikes/ShopTab.svelte';
  import KmImport from '../lib/care/KmImport.svelte';
  import { t } from '../lib/i18n.svelte.js';

  let route = $state(parseBikesHash(location.hash));
  $effect(() => {
    const read = () => {
      if (location.hash.startsWith('#/bikes') || location.hash.startsWith('#/care')) route = parseBikesHash(location.hash);
    };
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  });
  // Old links (#/care) and "open this bike" are written back as the plain address of the tab.
  $effect(() => {
    const want = bikesHash({ tab: route.tab, bike: route.bike, open: route.open, trip: route.trip, visit: route.visit, view: route.view });
    if (location.hash !== want && !route.open) history.replaceState(null, '', want);
  });

  /** Another bike chosen (a bike tab in Setup, a bike opened in Care): kept for the other tab. */
  function pickBike(id) {
    route = { ...route, bike: id, open: false };
  }
  const opened = () => (route = { ...route, open: false });
</script>

<div class="bikes">
  <header class="head">
    <h1 class="title">{t('Bikes')}</h1>
    <BikesNav current={route.tab} bike={route.bike} />
  </header>
  {#if route.tab === 'compare'}
    <Compare />
  {:else if route.tab === 'shop'}
    <ShopTab bikeId={route.bike} visitId={route.visit ?? null} onbike={pickBike} />
  {:else if route.tab === 'care' && route.view === 'import'}
    <!-- v0.68.0 «Q1 Jeder km zählt» (Q1.3 a): import rides, «Check» first, then per bike -->
    <KmImport bikeId={route.bike} />
  {:else if route.tab === 'care'}
    <CareTab bikeId={route.bike} open={route.open} tripId={route.trip ?? null} onbike={pickBike} onopened={opened} />
  {:else}
    <SetupTab bikeId={route.bike} onbike={pickBike} />
  {/if}
</div>

<style>
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 20px;
    margin-bottom: 14px;
  }
  .head .title {
    font-size: var(--fs-page);
    line-height: var(--lh-title);
    margin: 0;
  }
</style>
