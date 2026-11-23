<script>
  /**
   * «Mit OsmAnd fahren» (Noah 23.11.2026 «1a»): the route as one GPX file for OsmAnd, one tap. OsmAnd navigates
   * with the screen off, offline and in the background, which a web page cannot. On a phone the share list
   * opens (pick OsmAnd), else the file is saved and the line below says what to do with it. The shops, food,
   * water and petrol stations along the route go in as waypoints (gpxstops.js, like the Garmin file).
   * Nothing is sent anywhere. Used by the card «Ready for the ride?».
   *
   * Props: route ({ line, name }), points ([{ lat, lon, name, kind }] the places of the page), name.
   */
  import { Smartphone } from '@lucide/svelte';
  import { routeGpx, STOP_KINDS_STD } from '../gpxstops.js';
  import { saveGpx } from '../gpxout.js';
  import { POI_KIND } from '../race/outside.js';
  import { t } from '../i18n.svelte.js';

  let { route = null, points = [], name = '' } = $props();
  let msg = $state('');
  async function go() {
    const text = routeGpx(route, points, { name: name || route?.name, kinds: STOP_KINDS_STD, nameOf: (s) => t(POI_KIND[s.kind]?.name ?? 'Other stop') });
    const r = await saveGpx(text, name || route?.name || 'route');
    if (r === 'cancelled') return;
    msg = r === 'shared' ? t('Pick OsmAnd in the list, then tap «Navigation» there.') : t('Saved. Open the file with OsmAnd (tap it in your downloads), then tap «Navigation».');
  }
</script>

{#if route?.line?.length > 1}
  <li class="lv-ready-row" data-live-osmand>
    <Smartphone size={18} aria-hidden="true" />
    <span class="lv-ready-main"><b>{t('Ride with OsmAnd instead?')}</b>
      <small>{t('OsmAnd leads you with the screen off and without internet. The storm warning and the stops of this page stay here.')}</small>
      {#if msg}<small role="status" data-live-osmand-say>{msg}</small>{/if}</span>
    <button type="button" class="btn sm" onclick={go} data-live-osmand-go>{t('Ride with OsmAnd')}</button>
  </li>
{/if}

<style>
  /* the same row as the others on the card «Ready for the ride?» (their styles are scoped to ReadyCard) */
  .lv-ready-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }
  .lv-ready-main {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .lv-ready-main small {
    color: var(--ink-2);
  }
</style>
