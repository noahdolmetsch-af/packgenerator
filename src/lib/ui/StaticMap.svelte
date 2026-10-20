<script>
  /**
   * v0.102.0 Design-Refresh P4 «Touren» (T3, baustein «Karte mit Strecke», approved 12.10.2026): a still
   * map of a route. The OpenStreetMap tiles under it load only online (they tell OpenStreetMap the map
   * section, never a name); offline, or when a tile does not come, the line stands on a calm ground.
   * The tiles follow the app's map ground (Kartenlayer 20.10.2026).
   * line: [[lat, lon], …]; marks: [{ lat, lon, label, kind: 'start' | 'camp' | 'end' }]; label: the map's name.
   */
  import { mapView, linePath } from '../staticmap.js';
  import { rasterGround } from '../map/sources.js';
  import { mapGround } from '../map/groundpref.svelte.js';
  import { t } from '../i18n.svelte.js';

  let { line = [], marks = [], label = '', w = 600, h = 280 } = $props();

  let online = $state(typeof navigator === 'undefined' ? true : navigator.onLine);
  $effect(() => {
    const up = () => (online = navigator.onLine);
    window.addEventListener('online', up);
    window.addEventListener('offline', up);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', up);
    };
  });
  const pts = $derived([...(line ?? []).map(([lat, lon]) => ({ lat, lon })), ...marks]);
  const mid = $derived(pts.length ? { lat: (Math.min(...pts.map((p) => p.lat)) + Math.max(...pts.map((p) => p.lat))) / 2, lon: (Math.min(...pts.map((p) => p.lon)) + Math.max(...pts.map((p) => p.lon))) / 2 } : null);
  const g = $derived(rasterGround(mapGround.key, mid?.lat, mid?.lon));
  const view = $derived(mapView(pts, w, h, { url: g.url, maxZoom: Math.min(15, g.maxZoom ?? 15) }));
  const d = $derived(view ? linePath(line, view.px) : '');
  const at = $derived(view ? marks.map((m) => ({ ...m, ...view.px(m) })) : []);
  let failed = $state(0);
  const tiles = $derived(online && view && failed < 3 ? view.tiles : []);
</script>

{#if view}
  <div class="smap">
    <svg viewBox="0 0 {w} {h}" preserveAspectRatio="xMidYMid slice" role="img" aria-label={label || t('Map of the route')}>
      <rect class="ground" width={w} height={h} />
      {#each tiles as tl (tl.url)}<image class="tile" href={tl.url} x={tl.left} y={tl.top} width="256" height="256" onerror={() => failed++} />{/each}
      <path class="casing" d={d} />
      <path class="rt" d={d} />
      {#each at as m, n (n)}
        <g class="mk {m.kind}">
          <circle cx={m.x} cy={m.y} r={m.kind === 'end' ? 7 : 6} />
          {#if m.label}<text x={m.x + (m.x > w - 120 ? -10 : 10)} y={m.y - 10} text-anchor={m.x > w - 120 ? 'end' : 'start'}>{m.label}</text>{/if}
        </g>
      {/each}
    </svg>
    {#if tiles.length}<span class="osm">{g.attribution}</span>{/if}
  </div>
{/if}

<style>
  .smap {
    position: relative;
    overflow: hidden;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 600 / 280;
  }
  .ground {
    fill: var(--paper-2);
  }
  .tile {
    filter: grayscale(0.7) opacity(0.55);
  }
  .casing {
    fill: none;
    stroke: var(--paper);
    stroke-width: 7;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .rt {
    fill: none;
    stroke: var(--hi);
    stroke-width: 4;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .mk circle {
    fill: var(--paper);
    stroke: var(--hi);
    stroke-width: 3;
  }
  .mk.end circle {
    fill: var(--hi);
  }
  .mk.camp circle {
    fill: var(--warn-soft);
    stroke: var(--warn);
  }
  .mk text {
    fill: var(--ink);
    paint-order: stroke;
    stroke: var(--paper);
    stroke-width: 4;
    font: 600 var(--fs-sub) var(--font-body);
  }
  .osm {
    position: absolute;
    right: 8px;
    bottom: 6px;
    padding: 0 4px;
    border-radius: 4px;
    background: var(--paper);
    color: var(--ink-2);
    font: 400 var(--fs-tiny) / 1.5 var(--font-body);
  }
</style>
