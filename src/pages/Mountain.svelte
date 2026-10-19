<script>
  /**
   * Paket J «Berg, Schnee und Notfall» (Noah 19.10.2026 «1a und b … 2a 3a 4a, 5 nicht»): Touren › Berg und Notfall.
   *   #/mountain              the page: emergency on top, the map, the emergency QR, signposts and scales, Swiss sources
   *   #/mountain/sos          Notfall (#325, #217): your position big, Rega 1414 and 112
   *   #/mountain/qr           Notfall-QR (#311, #1001): your emergency card and a lock-screen image
   *   #/mountain/map[?trip=]  the swisstopo map with slopes over 30° and the ski routes (#161)
   *   #/mountain/scales       signpost colours and the SAC scales (#220)
   * The pure parts are in lib/mountain/; the map (Leaflet) loads only on its page.
   */
  import '../lib/ski/ski.css';
  import MountainHome from './mountain/MountainHome.svelte';
  import Sos from './mountain/Sos.svelte';
  import SosQr from './mountain/SosQr.svelte';
  import Scales from './mountain/Scales.svelte';

  let { sub = '' } = $props();
  const parts = $derived(sub.split('?')[0].split('/').filter(Boolean));
  const query = $derived(new URLSearchParams(sub.split('?')[1] ?? ''));
</script>

{#if parts[0] === 'sos'}
  <Sos />
{:else if parts[0] === 'qr'}
  <SosQr />
{:else if parts[0] === 'scales'}
  <Scales />
{:else if parts[0] === 'map'}
  {#await import('./mountain/MapPage.svelte') then m}
    <m.default tripId={query.get('trip') ?? ''} />
  {/await}
{:else}
  <MountainHome />
{/if}
