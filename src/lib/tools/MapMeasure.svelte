<script>
  /**
   * Paket L «Werkzeugkasten» (Strecke auf Karte messen, Noah 19.10.2026): tap points on the map, see how
   * long the line is, save it as GPX. The map library comes with the app (loaded only on this page); the
   * tiles of the app's map ground (Kartenlayer 20.10.2026) load online and are kept by the browser for a
   * while. The line is kept.
   */
  import { Undo2, Trash2, LocateFixed, Download } from '@lucide/svelte';
  import { lineLength, distText, gpxOf } from './geo.js';
  import { RASTER_GROUNDS, rasterGround } from '../map/sources.js';
  import { mapGround, chooseGround } from '../map/groundpref.svelte.js';
  import { loadTool, saveTool } from './toolstore.js';
  import { deliver } from './tools.js';
  import { t } from '../i18n.svelte.js';
  import './tools.css';

  let box = $state();
  let pts = $state([]);
  let failed = $state(false);
  let L = null;
  let map = null;
  let line = null;
  let dots = null;
  let tiles = null;
  // the ground under the map: the app's choice; «Automatic» follows the middle of the map
  function setGround() {
    if (!map) return;
    const c = map.getCenter();
    const g = rasterGround(mapGround.key, c.lat, c.lng);
    if (tiles?.options.gkey === g.key) return;
    tiles?.remove();
    tiles = L.tileLayer(g.url, { maxZoom: g.maxZoom ?? 18, attribution: g.attribution, gkey: g.key }).addTo(map);
  }
  $effect(() => {
    void mapGround.key;
    setGround();
  });
  const len = $derived(lineLength(pts));
  const keep = () => saveTool('map', { pts }).catch(() => {});

  function draw() {
    if (!map) return;
    line.setLatLngs(pts);
    dots.clearLayers();
    pts.forEach((p, i) => L.circleMarker(p, { radius: i === pts.length - 1 ? 7 : 5, weight: 2, color: '#4a7360', fillColor: '#fff', fillOpacity: 1 }).addTo(dots));
  }
  $effect(() => {
    let gone = false;
    (async () => {
      try {
        const [mod, saved] = await Promise.all([import('leaflet'), loadTool('map', null), import('leaflet/dist/leaflet.css')]);
        if (gone) return;
        L = mod.default ?? mod;
        pts = Array.isArray(saved?.pts) ? saved.pts : [];
        map = L.map(box, { zoomControl: false, attributionControl: true });
        // Nacht-Rundgang 20.10.2026: Leaflet's own zoom buttons were titled in English («Zoom in»)
        L.control.zoom({ zoomInTitle: t('Zoom in'), zoomOutTitle: t('Zoom out') }).addTo(map);
        line = L.polyline([], { color: '#4a7360', weight: 4 }).addTo(map);
        dots = L.layerGroup().addTo(map);
        if (pts.length > 1) map.fitBounds(pts, { padding: [24, 24] });
        else map.setView(pts[0] ?? [46.8, 8.2], pts.length ? 14 : 8);
        setGround();
        map.on('moveend', setGround);
        map.on('click', (e) => {
          pts = [...pts, [Math.round(e.latlng.lat * 1e6) / 1e6, Math.round(e.latlng.lng * 1e6) / 1e6]];
          draw();
          keep();
        });
        draw();
      } catch (err) {
        console.error(err);
        failed = true;
      }
    })();
    return () => {
      gone = true;
      map?.remove();
      map = null;
      tiles = null;
    };
  });
  function undo() {
    pts = pts.slice(0, -1);
    draw();
    keep();
  }
  function clear() {
    pts = [];
    draw();
    keep();
  }
  function locate() {
    navigator.geolocation?.getCurrentPosition(
      (p) => map?.setView([p.coords.latitude, p.coords.longitude], 15),
      () => {},
      { timeout: 8000 },
    );
  }
  const saveGpx = () => deliver(new Blob([gpxOf(pts, t('Measured route'))], { type: 'application/gpx+xml' }), 'strecke.gpx');
</script>

<section class="tool-card mapm">
  <p class="tool-big" aria-live="polite" data-m={Math.round(len)}>{distText(len)} <small class="tool-muted">{t('{n} points', { n: pts.length })}</small></p>
  <div class="mm-map" bind:this={box} role="application" aria-label={t('Map: tap to add a point')}></div>
  <label class="mm-ground">
    <span>{t('Map ground')}</span>
    <select class="inp" value={mapGround.key} onchange={(e) => chooseGround(e.currentTarget.value)} data-map-ground>
      {#each RASTER_GROUNDS as x (x.key)}<option value={x.key}>{t(x.name)}</option>{/each}
    </select>
  </label>
  {#if failed}<p class="tool-status err">{t('The map could not start. Reload the page.')}</p>{/if}
  <div class="tool-row">
    <button type="button" class="btn" disabled={!pts.length} onclick={undo}><Undo2 size={16} aria-hidden="true" />{t('Last point back')}</button>
    <button type="button" class="btn" disabled={!pts.length} onclick={clear}><Trash2 size={16} aria-hidden="true" />{t('Start over')}</button>
    <button type="button" class="btn" onclick={locate}><LocateFixed size={16} aria-hidden="true" />{t('Where am I?')}</button>
    <button type="button" class="btn" disabled={pts.length < 2} onclick={saveGpx}><Download size={16} aria-hidden="true" />{t('Save as GPX')}</button>
  </div>
  <p class="tool-help">{t('Tap along the road, point by point. The map needs the internet; the line and its length stay here. The GPX file can go into a trip or onto the Garmin.')}</p>
</section>

<style>
  .mm-map {
    height: min(60vh, 460px);
    border-radius: var(--radius-card);
    overflow: hidden;
    background: var(--paper-2);
    z-index: 0;
  }
  .mm-ground {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
  }
  .mm-ground select {
    flex: 1;
    min-width: 0;
  }
  .tool-big small {
    font-weight: 500;
  }
</style>
