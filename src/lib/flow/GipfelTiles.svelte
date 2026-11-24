<script>
  /**
   * The real map under the Gipfel-Karte (Noah 24.11.2026 «bilder mit echter karte»): the surroundings of your home place on the
   * app's map ground (swisstopo in Switzerland, the same ground as the tour maps), with your places filled, the open ones near
   * you as rings and their names beside them. The tiles load only online (they tell the map service the section, never a name);
   * when they do not come, `onfail` is called and the page draws the drawn map of the app instead.
   * center {lat, lon}, span (half height in degrees), ratio (width / height), points [{ id, lat, lon, st: 'year' | 'old' | '', name }].
   */
  import { mapView } from '../staticmap.js';
  import { rasterGround } from '../map/sources.js';
  import { mapGround } from '../map/groundpref.svelte.js';
  import { placeLabels } from '../dotlabels.js';
  import { t } from '../i18n.svelte.js';

  let { center, span = 0.3, ratio = 1, points = [], selId = null, onpick = null, onfail = null, title = '' } = $props();

  const H = 400;
  const W = $derived(Math.round(H * ratio));
  const k = $derived(Math.cos((center.lat * Math.PI) / 180));
  const g = $derived(rasterGround(mapGround.key, center.lat, center.lon));
  const corners = $derived([
    { lat: center.lat - span, lon: center.lon - (span * ratio) / k },
    { lat: center.lat + span, lon: center.lon + (span * ratio) / k },
  ]);
  const view = $derived(mapView(corners, W, H, { pad: 0, url: g.url, maxZoom: Math.min(15, g.maxZoom ?? 15) }));
  let failed = $state(0);
  $effect(() => {
    if (failed >= 3) onfail?.();
  });
  const R = { year: 11, old: 10, '': 5 };
  const dots = $derived(view ? points.map((p) => ({ ...p, ...view.px(p), r: R[p.st ?? ''] })).filter((d) => d.x > -20 && d.x < W + 20 && d.y > -20 && d.y < H + 20) : []);
  const names = $derived(placeLabels(dots.map((d) => ({ id: d.id, x: d.x, y: d.y, r: d.r, name: d.st ? d.name : '' })), 14, { x0: 0, y0: 0, x1: W, y1: H }));
  const order = { '': 0, old: 1, year: 2 };
  function pick(e) {
    const id = e.target?.closest?.('[data-id]')?.dataset.id;
    if (id) onpick?.(id);
  }
</script>

{#if view}
  <div class="tm" data-gk-tiles>
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
    <svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label={title || t('Map')} onclick={pick}>
      <rect class="ground" width={W} height={H} />
      {#each view.tiles as tl (tl.url)}<image class="tile" href={tl.url} crossorigin="anonymous" x={tl.left} y={tl.top} width="256" height="256" onerror={() => failed++} />{/each}
      {#each names as l (l.id)}<text class="dn" x={l.x} y={l.y} text-anchor={l.anchor} dominant-baseline="central" data-id={l.id}>{l.name}</text>{/each}
      {#each [...dots].sort((a, b) => order[a.st ?? ''] - order[b.st ?? '']) as d (d.id)}
        <circle class="dot {d.st || 'no'}" class:sel={selId === d.id} data-id={d.id} cx={d.x} cy={d.y} r={d.r} />
      {/each}
    </svg>
    <span class="att">{g.attribution}</span>
  </div>
{/if}

<style>
  .tm {
    position: relative;
    overflow: hidden;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
    max-height: 62vh;
    touch-action: manipulation;
  }
  .ground {
    fill: var(--paper-2);
  }
  .tile {
    filter: grayscale(0.7) opacity(0.55);
  }
  .dot {
    stroke: var(--paper);
    stroke-width: 2;
    cursor: pointer;
  }
  .dot.no {
    fill: var(--ink-3);
    fill-opacity: 0.55;
    stroke: none;
  }
  .dot.year {
    fill: var(--accent);
  }
  .dot.old {
    fill: var(--paper);
    stroke: var(--accent);
    stroke-width: 3;
  }
  .dot.sel {
    stroke: var(--ink);
    stroke-width: 3.5;
  }
  .dn {
    fill: var(--ink);
    font: 600 var(--fs-label) var(--font-body);
    paint-order: stroke;
    stroke: var(--paper);
    stroke-width: 4px;
    stroke-linejoin: round;
    cursor: pointer;
  }
  .att {
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
