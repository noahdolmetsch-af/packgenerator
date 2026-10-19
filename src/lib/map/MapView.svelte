<script>
  /**
   * Paket U2 «Karte»: one map for every page that needs one (the race map now, the live map later).
   * maplibre-gl loads here on mount only (never at the top level): a page without a map pays nothing.
   * Without WebGL (old phone, some test browsers) it says so in one sentence and the rest of the page
   * keeps working (data-map-fallback); with it the canvas carries data-map-ready.
   *
   * Props (all optional):
   * - ground (bindable): a key of GROUNDS (sources.js); 'auto' picks from the middle of the map.
   * - line: [[lat, lon]] the route; segments: [{ line, i, name }] or a FeatureCollection (coloured sectors).
   * - stretches: [{ line, tone: 'night' | 'snow' | 'lies' }] wide bands under the route.
   * - points: [{ id, lat, lon, kind, name, minZoom? }] circles coloured per kind, names from zoom 13.
   * - cursor: { lat, lon } the marker of the profile; me: { lat, lon, acc } your position (live map).
   * - arrows: [{ lat, lon, deg, label }] wind arrows; overlays: [{ id, url, maxzoom, opacity, attribution }].
   * - toggles: [{ key, label }] layer switches shown under the map, shown (bindable) { key: bool }.
   * - prefsKey: keeps ground and switches on this device (localStorage); adding: «Add point» mode.
   * - onpick(point) a tap on a point; onmapclick({ lat, lon, zoom }) a tap elsewhere;
   *   onlongpress({ lat, lon }) a long press or right click.
   * Methods (bind:this): fitRoute(), show(lat, lon, zoom).
   */
  import { onMount, untrack } from 'svelte';
  import { Maximize2, Layers } from '@lucide/svelte';
  import { GROUNDS, groundOf, pickGround } from './sources.js';
  import { styleOf, tokenColours, sectorColour, kindColourExpr, segmentsGeo, lineFeature, pointsGeo, pointFeature, zoomSteps, boundsOf, middleOf, loadPrefs, savePrefs, hasWebGL, FONT, LABEL_ZOOM, SECTOR_TOKENS } from './maplib.js';
  import { t } from '../i18n.svelte.js';

  let {
    ground = $bindable('auto'),
    line = [],
    segments = null,
    stretches = [],
    points = [],
    cursor = null,
    me = null,
    arrows = [],
    overlays = [],
    toggles = [],
    shown = $bindable({}),
    prefsKey = '',
    adding = false,
    label = '',
    onpick = null,
    onmapclick = null,
    onlongpress = null,
  } = $props();

  let el = $state();
  let root = $state();
  let phase = $state('loading'); // loading | ready | nogl | failed
  let styleVer = $state(0); // +1 each time a ground's style is loaded (our layers are added anew)
  let active = $state(''); // the ground key drawn now
  let map = null;
  let ml = null;
  let colours = {};
  let markers = [];
  let fitted = false;

  // the choices of this place on this device
  if (untrack(() => prefsKey)) {
    const p = untrack(() => loadPrefs(prefsKey, { ground, shown }));
    ground = groundOf(p.ground).key;
    shown = p.shown;
  }
  $effect(() => {
    const v = { ground, shown: { ...shown } };
    if (prefsKey) savePrefs(prefsKey, v);
  });

  const routeBounds = () => boundsOf(line, line.length ? [] : points, me ? [me] : []);
  const groundAt = () => {
    const c = map?.getCenter?.();
    const mid = c ? { lat: c.lat, lon: c.lng } : middleOf(routeBounds());
    return pickGround(ground, mid?.lat, mid?.lon);
  };

  export function fitRoute() {
    const b = routeBounds();
    if (map && b) map.fitBounds(b, { padding: 32, maxZoom: 14, duration: 0 });
  }
  export function show(lat, lon, zoom = 13) {
    if (map && Number.isFinite(lat) && Number.isFinite(lon)) map.easeTo({ center: [lon, lat], zoom: Math.max(map.getZoom(), zoom) });
  }

  /* ---------- our sources and layers (again after every change of ground) ---------- */
  const SRC = ['ov', 'stretch', 'route', 'seg', 'pts', 'cursor', 'me'];
  function src(id, data) {
    const s = map.getSource(id);
    if (s) s.setData(data);
    else map.addSource(id, { type: 'geojson', data });
  }
  function layer(spec) {
    if (!map.getLayer(spec.id)) map.addLayer(spec);
  }
  function drop(prefix) {
    for (const l of map.getStyle()?.layers ?? []) if (l.id.startsWith(prefix)) map.removeLayer(l.id);
  }
  const empty = { type: 'FeatureCollection', features: [] };

  function addOwn() {
    if (!map) return;
    colours = tokenColours(root ? getComputedStyle(root) : null);
    syncOverlays();
    src('stretch', empty);
    layer({ id: 'stretch-night', type: 'line', source: 'stretch', filter: ['==', ['get', 'tone'], 'night'], paint: { 'line-color': colours['--ink'], 'line-width': 12, 'line-opacity': 0.28 }, layout: { 'line-cap': 'round' } });
    layer({ id: 'stretch-lies', type: 'line', source: 'stretch', filter: ['==', ['get', 'tone'], 'lies'], paint: { 'line-color': colours['--l3'], 'line-width': 14, 'line-opacity': 0.5 }, layout: { 'line-cap': 'round' } });
    layer({ id: 'stretch-snow', type: 'line', source: 'stretch', filter: ['==', ['get', 'tone'], 'snow'], paint: { 'line-color': colours['--l3'], 'line-width': 12, 'line-opacity': 0.45, 'line-dasharray': [1, 1] } });
    src('route', empty);
    layer({ id: 'route-casing', type: 'line', source: 'route', paint: { 'line-color': colours['--paper'], 'line-width': 7 }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
    layer({ id: 'route-line', type: 'line', source: 'route', paint: { 'line-color': colours['--ink'], 'line-width': 4 }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
    src('seg', empty);
    const seg = ['match', ['%', ['get', 'i'], SECTOR_TOKENS.length], ...SECTOR_TOKENS.flatMap((_, i) => [i, sectorColour(colours, i)]), colours['--ink']];
    layer({ id: 'seg-line', type: 'line', source: 'seg', paint: { 'line-color': seg, 'line-width': 4 }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
    src('pts', empty);
    src('cursor', empty);
    src('me', empty);
    styleVer++;
  }

  function syncOverlays() {
    if (!map?.getStyle?.()) return;
    const want = new Set(overlays.map((o) => `ov-${o.id}`));
    for (const l of map.getStyle()?.layers ?? []) if (l.id.startsWith('ov-') && !want.has(l.id)) map.removeLayer(l.id);
    for (const id of Object.keys(map.getStyle()?.sources ?? {})) if (id.startsWith('ov-') && !want.has(id)) map.removeSource(id);
    const before = map.getLayer('stretch-night') ? 'stretch-night' : undefined;
    for (const o of overlays) {
      const id = `ov-${o.id}`;
      const s = map.getSource(id);
      if (s && s.tiles?.[0] !== o.url) {
        if (map.getLayer(id)) map.removeLayer(id);
        map.removeSource(id);
      }
      if (!map.getSource(id)) map.addSource(id, { type: 'raster', tiles: [o.url], tileSize: 256, maxzoom: o.maxzoom ?? 7, attribution: o.attribution ?? '' });
      if (!map.getLayer(id)) map.addLayer({ id, type: 'raster', source: id, paint: { 'raster-opacity': o.opacity ?? 0.6 } }, before);
    }
  }

  function syncPoints() {
    const steps = zoomSteps(points);
    const want = new Set([...steps.map((z) => `pts-z${z}`), 'pts-label']);
    for (const l of map.getStyle()?.layers ?? []) if (l.id.startsWith('pts-') && !want.has(l.id)) map.removeLayer(l.id);
    src('pts', pointsGeo(points));
    const colour = kindColourExpr(colours);
    for (const z of steps) {
      layer({
        id: `pts-z${z}`,
        type: 'circle',
        source: 'pts',
        minzoom: z,
        filter: ['==', ['get', 'minZoom'], z],
        paint: {
          'circle-color': colour,
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, z === 0 ? 5 : 3.5, 13, z === 0 ? 8 : 6.5],
          'circle-stroke-color': colours['--paper'],
          'circle-stroke-width': 1.5,
        },
      });
    }
    layer({
      id: 'pts-label',
      type: 'symbol',
      source: 'pts',
      minzoom: LABEL_ZOOM,
      layout: { 'text-field': ['get', 'name'], 'text-font': FONT, 'text-size': 12, 'text-offset': [0, 1.1], 'text-anchor': 'top', 'text-optional': true, 'text-max-width': 10 },
      paint: { 'text-color': colours['--ink'], 'text-halo-color': colours['--paper'], 'text-halo-width': 1.5 },
    });
    // the cursor and your position stay on top
    for (const id of ['cursor-dot', 'me-acc', 'me-dot']) if (map.getLayer(id)) map.moveLayer(id);
  }

  function syncArrows() {
    for (const m of markers) m.remove();
    markers = [];
    if (!ml || !map) return;
    for (const a of arrows) {
      const d = document.createElement('div');
      d.className = 'mv-arrow';
      d.setAttribute('aria-hidden', 'true');
      d.innerHTML = `<span class="mv-arrow-a" style="transform: rotate(${Math.round(a.deg)}deg)">↑</span><span class="mv-arrow-l">${String(a.label ?? '').replace(/[^0-9 .,]/g, '')}</span>`;
      markers.push(new ml.Marker({ element: d }).setLngLat([a.lon, a.lat]).addTo(map));
    }
  }

  /* ---------- data → map (each runs again after a change of ground) ---------- */
  $effect(() => {
    const v = styleVer;
    const data = lineFeature(line);
    const segs = segmentsGeo(segments);
    if (!v || !map) return;
    untrack(() => {
      src('route', data ? { type: 'FeatureCollection', features: [data] } : empty);
      src('seg', segs);
      if (!fitted && (data || points.length)) {
        fitted = true;
        fitRoute();
      }
    });
  });
  $effect(() => {
    const v = styleVer;
    const data = segmentsGeo(stretches);
    if (v && map) untrack(() => src('stretch', data));
  });
  $effect(() => {
    const v = styleVer;
    void points;
    if (v && map) untrack(syncPoints);
  });
  $effect(() => {
    const v = styleVer;
    void overlays;
    if (v && map) untrack(syncOverlays);
  });
  $effect(() => {
    const v = styleVer;
    const f = pointFeature(cursor);
    if (!v || !map) return;
    untrack(() => {
      src('cursor', f ? { type: 'FeatureCollection', features: [f] } : empty);
      layer({ id: 'cursor-dot', type: 'circle', source: 'cursor', paint: { 'circle-color': colours['--hi'], 'circle-radius': 8, 'circle-stroke-color': colours['--paper'], 'circle-stroke-width': 3 } });
    });
  });
  $effect(() => {
    const v = styleVer;
    const f = pointFeature(me, { acc: Number(me?.acc) || 0 });
    if (!v || !map) return;
    untrack(() => {
      src('me', f ? { type: 'FeatureCollection', features: [f] } : empty);
      const c = Math.cos(((Number(me?.lat) || 46) * Math.PI) / 180) * 78271.517;
      const acc = Math.max(1, Number(me?.acc) || 0);
      drop('me-acc');
      map.addLayer({ id: 'me-acc', type: 'circle', source: 'me', paint: { 'circle-color': colours['--l3'], 'circle-opacity': 0.15, 'circle-radius': ['interpolate', ['exponential', 2], ['zoom'], 0, acc / c, 22, (acc * 2 ** 22) / c] } });
      layer({ id: 'me-dot', type: 'circle', source: 'me', paint: { 'circle-color': colours['--l3'], 'circle-radius': 7, 'circle-stroke-color': colours['--paper'], 'circle-stroke-width': 3 } });
      map.moveLayer('me-dot');
    });
  });
  $effect(() => {
    const v = styleVer;
    void arrows;
    if (v && map) untrack(syncArrows);
  });
  // a new ground: a new style (our layers follow on style.load)
  $effect(() => {
    void ground;
    if (!map || phase !== 'ready') return;
    untrack(() => {
      const g = groundAt();
      if (g.key !== active) {
        active = g.key;
        map.setStyle(styleOf(g), { diff: false });
      }
    });
  });

  onMount(() => {
    let alive = true;
    let press = null;
    (async () => {
      if (!hasWebGL()) {
        phase = 'nogl';
        return;
      }
      try {
        const [lib, worker] = await Promise.all([import('maplibre-gl'), import('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'), import('maplibre-gl/dist/maplibre-gl.css')]);
        if (!alive) return;
        ml = lib;
        ml.setWorkerUrl(worker.default);
        const b = routeBounds();
        const mid = middleOf(b);
        const g = pickGround(ground, mid?.lat, mid?.lon);
        active = g.key;
        map = new ml.Map({
          container: el,
          style: styleOf(g),
          ...(b ? { bounds: b, fitBoundsOptions: { padding: 32, maxZoom: 14 } } : { center: [8.2, 46.8], zoom: 7 }),
          maxZoom: 18,
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
          cooperativeGestures: true,
          attributionControl: { compact: false },
          locale: {
            'NavigationControl.ZoomIn': t('Zoom in'),
            'NavigationControl.ZoomOut': t('Zoom out'),
            'AttributionControl.ToggleAttribution': t('Sources of the map'),
            'Map.Title': t('Map|race'),
            'CooperativeGesturesHandler.MobileHelpText': t('Use two fingers to move the map'),
            'CooperativeGesturesHandler.WindowsHelpText': t('Use Ctrl + scroll to zoom the map'),
            'CooperativeGesturesHandler.MacHelpText': t('Use ⌘ + scroll to zoom the map'),
          },
        });
        map.touchZoomRotate.disableRotation();
        map.addControl(new ml.NavigationControl({ showCompass: false }), 'top-right');
        map.on('style.load', addOwn);
        map.on('error', (e) => console.warn('map', e?.error?.message ?? e));
        map.on('moveend', () => {
          if (ground !== 'auto') return;
          const g2 = groundAt();
          if (g2.key !== active) {
            active = g2.key;
            map.setStyle(styleOf(g2), { diff: false });
          }
        });
        map.on('click', (e) => {
          const ids = (map.getStyle()?.layers ?? []).filter((l) => l.id.startsWith('pts-z')).map((l) => l.id);
          const r = 10;
          const hit = !adding && ids.length ? map.queryRenderedFeatures([[e.point.x - r, e.point.y - r], [e.point.x + r, e.point.y + r]], { layers: ids })[0] : null;
          if (hit) {
            const p = points.find((x) => String(x.id) === hit.properties.id);
            if (p) return onpick?.(p);
          }
          onmapclick?.({ lat: e.lngLat.lat, lon: e.lngLat.lng, zoom: map.getZoom() });
        });
        map.on('contextmenu', (e) => onlongpress?.({ lat: e.lngLat.lat, lon: e.lngLat.lng }));
        const stop = () => {
          clearTimeout(press);
          press = null;
        };
        map.on('touchstart', (e) => {
          stop();
          if (e.originalEvent?.touches?.length !== 1) return;
          const at = e.lngLat;
          press = setTimeout(() => onlongpress?.({ lat: at.lat, lon: at.lng }), 650);
        });
        for (const ev of ['touchend', 'touchcancel', 'touchmove', 'movestart']) map.on(ev, stop);
        phase = 'ready';
      } catch (err) {
        console.warn('map', err);
        phase = 'failed';
      }
    })();
    return () => {
      alive = false;
      clearTimeout(press);
      for (const m of markers) m.remove();
      map?.remove();
      map = null;
    };
  });

  const toggle = (key) => (shown = { ...shown, [key]: !shown[key] });
  const g = $derived(groundOf(ground));
</script>

<div class="mv" bind:this={root} data-map>
  {#if phase === 'nogl' || phase === 'failed'}
    <p class="mv-fallback" role="note" data-map-fallback>
      {phase === 'nogl' ? t('This device or browser cannot draw the map (WebGL is missing). Everything below still works: the profile, the points and the lists.') : t('The map could not start. Everything below still works: the profile, the points and the lists.')}
    </p>
  {:else}
    <div class="mv-frame" class:mv-adding={adding}>
      <div class="mv-map" bind:this={el} role="region" aria-label={label || t('Map|race')} data-map-ready={phase === 'ready' ? '' : undefined}></div>
      {#if phase === 'loading'}<p class="mv-loading">{t('Loading the map…')}</p>{/if}
      {#if adding}<p class="mv-hint" role="status" data-map-adding>{t('Tap the map where the point should go.')}</p>{/if}
      <button type="button" class="mv-fit" onclick={fitRoute} disabled={phase !== 'ready'} data-map-fit><Maximize2 size={16} aria-hidden="true" />{t('Whole route')}</button>
    </div>
  {/if}
  <div class="mv-bar">
    <label class="mv-ground">
      <span class="mv-lab"><Layers size={16} aria-hidden="true" />{t('Map ground')}</span>
      <select class="inp" bind:value={ground} data-map-ground>
        {#each GROUNDS as x (x.key)}<option value={x.key}>{t(x.name)}</option>{/each}
      </select>
    </label>
    <p class="mv-sub">{t(g.sub)}{#if ground === 'auto' && active}{' · '}{t(groundOf(active).name)}{/if}</p>
    {#if toggles.length}
      <div class="mv-chips" role="group" aria-label={t('Layers on the map')}>
        {#each toggles as x (x.key)}
          <button type="button" class="mv-chip" aria-pressed={!!shown[x.key]} onclick={() => toggle(x.key)} data-map-layer={x.key}>{x.label}</button>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .mv {
    --mv-h: min(62vh, 520px);
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }
  .mv-frame {
    position: relative;
    min-width: 0;
    border: 1px solid var(--line);
    border-radius: 10px;
    overflow: hidden;
    background: var(--paper-2);
  }
  .mv-map {
    width: 100%;
    height: var(--mv-h);
    min-height: 280px;
  }
  .mv-adding .mv-map {
    cursor: crosshair;
  }
  .mv-adding {
    outline: 3px solid var(--hi);
    outline-offset: -3px;
  }
  .mv-loading,
  .mv-hint {
    position: absolute;
    top: 8px;
    left: 8px;
    right: 56px;
    margin: 0;
    padding: 6px 10px;
    border-radius: 8px;
    background: var(--paper);
    color: var(--ink);
    font-size: var(--fs-small);
    box-shadow: 0 1px 4px var(--shadow);
  }
  .mv-fit {
    position: absolute;
    left: 8px;
    bottom: 36px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
    box-shadow: 0 1px 4px var(--shadow);
  }
  .mv-fallback {
    margin: 0;
    padding: 14px;
    border: 1px dashed var(--line-strong);
    border-radius: 10px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .mv-bar {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .mv-ground {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .mv-ground select {
    flex: 1 1 180px;
    min-width: 0;
    max-width: 100%;
    min-height: 44px;
  }
  .mv-lab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .mv-sub {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .mv-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .mv-chip {
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .mv-chip[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  /* the maplibre parts: readable attribution, wind arrows */
  .mv :global(.maplibregl-ctrl-attrib) {
    font-size: var(--fs-tiny);
  }
  .mv :global(.maplibregl-ctrl-group button) {
    width: 40px;
    height: 40px;
  }
  .mv :global(.mv-arrow) {
    display: flex;
    flex-direction: column;
    align-items: center;
    pointer-events: none;
    color: var(--ink);
  }
  .mv :global(.mv-arrow-a) {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--paper);
    font-weight: 700;
    font-size: var(--fs-body);
    box-shadow: 0 1px 3px var(--shadow);
  }
  .mv :global(.mv-arrow-l) {
    margin-top: 2px;
    padding: 0 4px;
    border-radius: 4px;
    background: var(--paper);
    font-size: var(--fs-tiny);
    font-variant-numeric: tabular-nums;
  }
</style>
