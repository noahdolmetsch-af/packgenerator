<script>
  /**
   * The small map at the bottom of a data page (Noah 20.10.2026 «zusätzlich 1 kleine Karte unten auf jeder
   * Datenseite kann hinzugefügt werden»): your place and the route, it follows you; no buttons.
   */
  import MapView from '../map/MapView.svelte';
  import { t } from '../i18n.svelte.js';

  let { me = null, line = [], done = [] } = $props();
  let view = $state();
  let at = 0;
  $effect(() => {
    const m = me;
    if (!m || !view) return;
    // at most every 5 s (less drawing, less battery)
    if (Date.now() - at < 5000) return;
    at = Date.now();
    view.centerOn?.(m.lat, m.lon, 15, 0);
  });
</script>

<div class="lsm" data-live-small-map>
  <MapView bind:this={view} prefsKey="live-small" {line} points={[]} {me} {done} fill bar={false} fitButton={false} label={t('Small map')} />
</div>

<style>
  .lsm {
    position: relative;
    height: 100%;
    min-height: 120px;
    border-radius: 10px;
    overflow: hidden;
  }
</style>
