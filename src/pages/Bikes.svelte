<script>
  /**
   * Bikes (v0.21.0, Noah's answers 6a and 5): one page with a tab per view, Setup and Care.
   * The tab and the chosen bike live in the address (#/bikes?tab=care&bike=<id>), so a link,
   * the back button and a reload come back to the same place. The old #/care lands on Care.
   * v0.78.0 «Fünf Orte» 2: the tabs are the place's tabs on top (nav/PlaceTabs), with Masse.
   */
  import PinnedLists from '../lib/merken/PinnedLists.svelte';
  import { parseBikesHash, bikesHash } from '../lib/bikes.js';
  import SetupTab from '../lib/bikes/SetupTab.svelte';
  import CareTab from '../lib/care/CareTab.svelte';
  import Compare from '../lib/bikes/Compare.svelte';
  import Equipment from '../lib/bikes/Equipment.svelte';
  import ValuesPage from '../lib/bikes/ValuesPage.svelte';
  import ShopTab from '../lib/bikes/ShopTab.svelte';
  import KmImport from '../lib/care/KmImport.svelte';
  import StravaPage from '../lib/strava/StravaPage.svelte';
  import StravaCheck from '../lib/strava/StravaCheck.svelte';
  import SheetView from '../lib/bikes/SheetView.svelte';
  import PageTiles from '../lib/sk/PageTiles.svelte'; // SK: the tile row at the page end
  import RigTab from '../lib/bikes/RigTab.svelte';
  import GarminPages from '../lib/bikes/GarminPages.svelte';
  import GarminPage from '../lib/bikes/GarminPage.svelte';
  import { t } from '../lib/i18n.svelte.js';
  import { lastBikeChoice, chooseBike } from '../lib/lastchoice.js';

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
    const want = bikesHash({ tab: route.tab, bike: route.bike, open: route.open, trip: route.trip, visit: route.visit, view: route.view, sheet: route.sheet, from: route.from, edit: route.edit, back: route.back, page: route.page });
    if (location.hash !== want && !route.open) history.replaceState(null, '', want);
  });

  /** Another bike chosen (a bike tab in Setup, a bike opened in Care): kept for the other tab. */
  function pickBike(id) {
    route = { ...route, bike: id, open: false };
  }
  // P3b 4a: the bike chosen last stays chosen on every Velos tab (an address with a bike names it)
  let lastBike = $state(lastBikeChoice());
  $effect(() => {
    if (route.bike) {
      chooseBike(route.bike);
      lastBike = route.bike;
    }
  });
  const shownBike = $derived(route.bike ?? lastBike);
  const opened = () => (route = { ...route, open: false });
  // «Garmin-Seiten»: the Edge chosen on the pages list stays while you open a page and come back
  let garminDevice = $state('1040');
</script>

<div class="bikes">
  <!-- Design-Refresh P7: «Velos» heads the bike page only; every sub-page (folder, care, import, workshop,
       equipment, compare) has its own path back and title (VeloHead). -->
  {#if !(route.sheet && route.bike) && !['care', 'shop', 'compare', 'garmin'].includes(route.tab) && !(route.tab === 'rig' && route.view)}
    <header class="head">
      <h1 class="title">{t('Bikes')}</h1>
    </header>
  {/if}
  {#if route.sheet && route.bike}
    <!-- v0.69.0 «Velo-Blätter»: one sheet of the bike's folder (or the whole folder) -->
    <SheetView bikeId={route.bike} sheet={route.sheet} from={route.from ?? null} />
  {:else if route.tab === 'compare' && route.view === 'all'}
    <!-- Bugfix Dateneingabe: «enter» on a sheet opens one value of its bike here, then goes back -->
    <Compare bikeId={route.bike} target={route.edit ?? null} back={route.back ?? null} from={route.from ?? null} />
  {:else if route.tab === 'compare' && route.view === 'enter'}
    <!-- «Bugfix Dateneingabe» D2–D4: every value of one bike on one page, «Next» goes to the next field -->
    <ValuesPage bikeId={shownBike} onbike={pickBike} />
  {:else if route.tab === 'compare'}
    <!-- v0.83.0 «Ausstattung» (A1–A5 a): every part of one bike in groups, «Compare bikes» one tap away -->
    <Equipment bikeId={shownBike} onbike={pickBike} />
  {:else if route.tab === 'rig'}
    <!-- UC3 (Noah 14.10.2026 «UC3-1-UC3-3 freigeben»): Setup per bike; &view=bags the bag plan, &view=log the setup log;
         Taschen-Setups TS2–TS4: &view=setup one setup, &view=compare two side by side, &view=table all -->
    <RigTab bikeId={shownBike} view={route.view ?? null} setupId={route.setup ?? null} a={route.a ?? null} b={route.b ?? null} onbike={pickBike} />
  {:else if route.tab === 'garmin' && route.page}
    <!-- «Garmin-Seiten» GA-A3 (Noah 14.10.2026): one model page in detail -->
    {#key route.page}<GarminPage bikeId={shownBike} profileId={route.view ?? null} pageId={route.page} />{/key}
  {:else if route.tab === 'garmin'}
    <!-- «Garmin-Seiten» GA-A2 (Noah 14.10.2026): the model pages of one Garmin profile of a bike -->
    <GarminPages bikeId={shownBike} profileId={route.view ?? null} bind:device={garminDevice} />
  {:else if route.tab === 'shop'}
    <ShopTab bikeId={shownBike} visitId={route.visit ?? null} onbike={pickBike} />
  {:else if route.tab === 'care' && route.view === 'strava'}
    <!-- v0.116.0 «Strava-Verbindung» (S1–S3): connect, the first fetch, the settings -->
    <StravaPage bikeId={route.bike} />
  {:else if route.tab === 'care' && route.view === 'strava-check'}
    <!-- v0.116.0 (S5): the rides from Strava that wait for a bike -->
    <StravaCheck bikeId={route.bike} />
  {:else if route.tab === 'care' && route.view === 'import'}
    <!-- v0.68.0 «Q1 Jeder km zählt» (Q1.3 a): import rides, «Check» first, then per bike -->
    <KmImport bikeId={route.bike} />
  {:else if route.tab === 'care'}
    <CareTab bikeId={route.bike} open={route.open} tripId={route.trip ?? null} onbike={pickBike} onopened={opened} />
  {:else}
    <SetupTab bikeId={shownBike} more={route.open} onbike={pickBike} onopened={opened} />
    <PinnedLists place="bikes" />
    <PageTiles page="bikes" extrasHint />
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
