<script>
  /**
   * «Karte aller Träume» (Träume und Neuland N14, Noah 27.10.2026 «1-5 a»), on Touren › Träume: every dream with
   * a map on one map, numbered at the point furthest from the start, and a list with what each would bring for the first time (municipalities,
   * passes, lakes from Neuland), most new first. A tap on a row (or its number) opens the dream.
   * The OpenStreetMap tiles load only online, as on every map of the app. Rules in kartealle.js.
   * dreams: all dreams; onopen(id).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { readRaw, computeFrom } from '../neuland/store.js';
  import { dreamNews, rankDreams, routedDreams, NEW_KINDS } from './kartealle.js';
  import { mapView, linePath } from '../staticmap.js';
  import { rasterGround } from '../map/sources.js';
  import { mapGround } from '../map/groundpref.svelte.js';
  import { t, tn, num } from '../i18n.svelte.js';
  import { ChevronRight } from '@lucide/svelte';

  let { dreams = [], onopen } = $props();
  const W = 600;
  const H = 320;
  const routed = $derived(routedDreams(dreams));

  const rawQ = liveQuery(() => readRaw(db));
  let cols = $state.raw(null);
  $effect(() => {
    const raw = $rawQ;
    if (!raw || !routed.length) return;
    let live = true;
    computeFrom(raw, { only: NEW_KINDS })
      .then((r) => live && (cols = r.collections))
      .catch((err) => console.error(err));
    return () => (live = false);
  });
  const ranked = $derived(rankDreams(routed, cols ? dreamNews(routed, cols) : new Map()));

  let online = $state(typeof navigator === 'undefined' ? true : navigator.onLine);
  let failed = $state(0);
  const pts = $derived(routed.flatMap((d) => d.route.line.map(([lat, lon]) => ({ lat, lon }))));
  const mid = $derived(pts.length ? { lat: (Math.min(...pts.map((p) => p.lat)) + Math.max(...pts.map((p) => p.lat))) / 2, lon: (Math.min(...pts.map((p) => p.lon)) + Math.max(...pts.map((p) => p.lon))) / 2 } : null);
  const g = $derived(rasterGround(mapGround.key, mid?.lat, mid?.lon));
  const view = $derived(pts.length ? mapView(pts, W, H, { url: g.url, maxZoom: Math.min(13, g.maxZoom ?? 13) }) : null);
  const tiles = $derived(online && view && failed < 3 ? view.tiles : []);
  const drawn = $derived(view ? ranked.map((x) => ({ ...x, d: linePath(x.dream.route.line, view.px), at: view.px(far(x.dream.route.line)) })) : []);
  // the number sits at the point furthest from the start (many dreams start at home)
  function far(line) {
    const [a0, b0] = line[0];
    let best = line[0];
    let d = -1;
    for (const p of line) {
      const e = (p[0] - a0) ** 2 + ((p[1] - b0) * 0.68) ** 2;
      if (e > d) (d = e), (best = p);
    }
    return { lat: best[0], lon: best[1] };
  }
  let hover = $state(null);

  const newsText = (n) => {
    if (!n) return t('Counting …');
    if (!n.total) return t('Nothing new on the way');
    const parts = [];
    if (n.municipalities) parts.push(tn(n.municipalities, '{n} new municipality', '{n} new municipalities'));
    if (n.passes) parts.push(tn(n.passes, '{n} new pass', '{n} new passes'));
    if (n.lakes) parts.push(tn(n.lakes, '{n} new lake', '{n} new lakes'));
    return parts.join(' · ');
  };
</script>

{#if routed.length}
  <section class="ich-sec" aria-labelledby="dm-h" data-dreams-map>
    <div class="ich-h">
      <div>
        <h2 id="dm-h">{t('All dreams on one map')}</h2>
        <p class="ich-hs">{t('What each dream would bring for the first time. Dreams with a map count.')}</p>
      </div>
    </div>
    <div class="card ich-body dm">
      {#if view}
        <div class="smap">
          <svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label={t('Map of all dreams')}>
            <rect class="ground" width={W} height={H} />
            {#each tiles as tl (tl.url)}<image class="tile" href={tl.url} x={tl.left} y={tl.top} width="256" height="256" onerror={() => failed++} />{/each}
            {#each drawn as x (x.dream.id)}<path class="casing" d={x.d} />{/each}
            {#each drawn as x (x.dream.id)}<path class="rt" class:on={hover === x.dream.id} d={x.d} />{/each}
            {#each [...drawn].reverse() as x (x.dream.id)}
              <g class="mk" class:on={hover === x.dream.id}>
                <circle cx={x.at.x} cy={x.at.y} r="11" />
                <text x={x.at.x} y={x.at.y + 4} text-anchor="middle">{x.no}</text>
              </g>
            {/each}
          </svg>
          {#if tiles.length}<span class="osm">{g.attribution}</span>{/if}
        </div>
      {/if}
      <ul class="dm-list">
        {#each ranked as x (x.dream.id)}
          <li>
            <button type="button" class="dm-row" onclick={() => onopen?.(x.dream.id)} onpointerenter={() => (hover = x.dream.id)} onpointerleave={() => (hover = null)} onfocus={() => (hover = x.dream.id)} onblur={() => (hover = null)} data-dm-row={x.dream.id}>
              <span class="no num" aria-hidden="true">{x.no}</span>
              <span class="dm-m"><b>{x.dream.title}</b><small data-dm-news>{newsText(x.news)}{#if x.dream.route.km}{' · '}{num(Math.round(x.dream.route.km))} km{/if}</small></span>
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </li>
        {/each}
      </ul>
    </div>
  </section>
{/if}

<style>
  .dm {
    display: grid;
    gap: var(--sp-3);
  }
  .smap {
    position: relative;
    max-width: 640px;
    overflow: hidden;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 600 / 320;
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
    opacity: 0.8;
  }
  .rt.on {
    stroke-width: 6;
    opacity: 1;
  }
  .mk circle {
    fill: var(--paper);
    stroke: var(--hi);
    stroke-width: 3;
  }
  .mk.on circle {
    fill: var(--hi);
  }
  .mk text {
    fill: var(--ink);
    font: 700 var(--fs-small) var(--font-body);
  }
  .mk.on text {
    fill: var(--paper);
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
  .dm-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 4px;
  }
  .dm-row {
    display: flex;
    gap: var(--sp-2) var(--sp-3);
    align-items: center;
    width: 100%;
    min-height: 44px;
    padding: 6px 4px;
    border: 0;
    border-radius: var(--r-ctl);
    background: none;
    color: var(--ink);
    text-align: left;
    font: inherit;
    cursor: pointer;
  }
  .dm-row:hover {
    background: var(--paper-2);
  }
  .no {
    flex: none;
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 2px solid var(--hi);
    font-weight: 700;
    font-size: var(--fs-small);
  }
  .dm-m {
    flex: 1;
    min-width: 0;
    display: grid;
    overflow-wrap: break-word;
  }
  .dm-m small {
    color: var(--ink-3);
  }
</style>
