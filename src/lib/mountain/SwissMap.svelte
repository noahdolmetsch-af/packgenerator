<script>
  /**
   * Paket J #161 (Noah «2a»): the swisstopo map with the layers «Slopes over 30°», «Ski touring routes»
   * and «Hiking trails» (maplayers.js). Leaflet is loaded only when this map opens, so the app's start
   * stays small. The layer choice is kept on this device (localStorage, a convenience only).
   * Offline the map shows the tiles the browser still has; the page says so.
   */
  import { onMount } from 'svelte';
  import { Check } from '@lucide/svelte';
  import { BASES, OVERLAYS, ATTRIBUTION, tileUrl, layersOn, baseFor, startView, CH_BOUNDS } from './maplayers.js';
  import { t } from '../i18n.svelte.js';

  let { point = null, place = null, label = '' } = $props();

  const KEY = 'mountain.map';
  const saved = (() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? 'null') ?? {};
    } catch {
      return {};
    }
  })();
  let base = $state(baseFor(new Date().getMonth() + 1, saved.base));
  let on = $state(layersOn(saved.on));
  let failed = $state(false);
  let el;
  let map = null;
  let L = null;
  const tiles = {};

  const remember = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ base, on }));
    } catch {
      /* private window: the choice is only for now */
    }
  };

  function draw() {
    if (!map || !L) return;
    for (const b of BASES) {
      const want = b.key === base;
      if (want && !tiles[b.key]) tiles[b.key] = L.tileLayer(tileUrl(b), { maxZoom: 18, minZoom: 7, attribution: ATTRIBUTION, zIndex: 1 });
      if (tiles[b.key]) want ? tiles[b.key].addTo(map) : tiles[b.key].remove();
    }
    for (const o of OVERLAYS) {
      const want = on.includes(o.key);
      if (want && !tiles[o.key]) tiles[o.key] = L.tileLayer(tileUrl(o), { maxZoom: 18, minZoom: 7, opacity: o.opacity, zIndex: 10 + OVERLAYS.indexOf(o) });
      if (tiles[o.key]) want ? tiles[o.key].addTo(map) : tiles[o.key].remove();
    }
  }

  onMount(() => {
    let gone = false;
    (async () => {
      try {
        const mod = await import('leaflet');
        await import('leaflet/dist/leaflet.css');
        if (gone) return;
        L = mod.default ?? mod;
        const view = startView(point, place);
        map = L.map(el, { center: view.center, zoom: view.zoom, maxBounds: L.latLngBounds(CH_BOUNDS).pad(0.3), zoomControl: false, attributionControl: true });
        // Nacht-Rundgang 20.10.2026: Leaflet's own zoom buttons were titled in English («Zoom in»)
        L.control.zoom({ zoomInTitle: t('Zoom in'), zoomOutTitle: t('Zoom out') }).addTo(map);
        map.attributionControl.setPrefix(false);
        const p = [point, place].find((x) => x && Number.isFinite(x.lat) && Number.isFinite(x.lon));
        if (p) L.circleMarker([p.lat, p.lon], { radius: 8, color: '#1d3b30', weight: 3, fillColor: '#4a7360', fillOpacity: 0.9 }).addTo(map).bindTooltip(label || t('Start place'));
        draw();
      } catch {
        failed = true;
      }
    })();
    return () => {
      gone = true;
      map?.remove();
      map = null;
    };
  });

  function pickBase(key) {
    base = key;
    remember();
    draw();
  }
  function toggle(key) {
    on = on.includes(key) ? on.filter((k) => k !== key) : [...on, key];
    remember();
    draw();
  }
</script>

<div class="sm">
  <div class="sm-map" bind:this={el} role="region" aria-label={t('swisstopo map')} data-swiss-map></div>
  {#if failed}<p class="sk-quiet" role="alert">{t('The map could not be loaded. Try again with the internet.')}</p>{/if}
  <fieldset class="sm-pick">
    <legend>{t('Map')}</legend>
    <div class="sk-chips">
      {#each BASES as b (b.key)}<button type="button" class="sk-chip" aria-pressed={base === b.key} onclick={() => pickBase(b.key)} data-base={b.key}>{t(b.name)}</button>{/each}
    </div>
  </fieldset>
  <fieldset class="sm-pick">
    <legend>{t('Layers')}</legend>
    <ul class="sk-list">
      {#each OVERLAYS as o (o.key)}
        <li>
          <button type="button" class="sk-tick" role="switch" aria-checked={on.includes(o.key)} onclick={() => toggle(o.key)} data-layer={o.key}>
            <span class="sk-box" aria-hidden="true">{#if on.includes(o.key)}<Check size={18} strokeWidth={3} />{/if}</span>
            <span class="sk-tt"><b>{t(o.name)}</b><small>{t(o.sub)}</small></span>
          </button>
        </li>
      {/each}
    </ul>
  </fieldset>
</div>

<style>
  .sm {
    display: grid;
    gap: 12px;
  }
  .sm-map {
    height: min(62vh, 560px);
    min-height: 300px;
    border-radius: var(--radius, 12px);
    overflow: hidden;
    background: var(--paper-2);
    border: 1px solid var(--line);
    z-index: 0;
  }
  .sm-pick {
    margin: 0;
    padding: 0;
    border: 0;
    display: grid;
    gap: 6px;
  }
  .sm-pick legend {
    padding: 0 0 6px;
    font: 600 var(--fs-body)/1.3 var(--font-body);
  }
</style>
