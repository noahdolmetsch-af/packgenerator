<script>
  /**
   * «Weisse Flecken in der Nähe» (Träume und Neuland N1, Noah 27.10.2026 «1-5 a»), on Touren › Träume: the
   * municipalities around your home place on a small map, the ones you have been to filled, the others with a
   * dashed edge, and the nearest «never been» as a list. Radius 10, 25 or 50 km (setting SPOTS_KEY). A tap on
   * a place shows its name and distance. Visits come from Neuland (routes, rides and your own ticks), even
   * when the collection «Municipalities» is switched off there. No home place: one button sets it.
   * The data (2134 municipalities) loads only here, as its own file.
   * N2 «Neuland-Runde»: a picked place offers «Round through it» (SpotRoundSheet.svelte, runde.js).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { readRaw, computeFrom } from './store.js';
  import { whiteSpots, spotsCfg, SPOTS_KEY, SPOT_RADII } from './flecken.js';
  import { pathOf } from './geo.js';
  import Seg from '../ui/Seg.svelte';
  import HomePlaceSheet from '../ich/HomePlaceSheet.svelte';
  import SpotRoundSheet from './SpotRoundSheet.svelte'; // N2 «Neuland-Runde»
  import { t, tn, num } from '../i18n.svelte.js';
  import { MapPin, Route } from '@lucide/svelte';

  const rawQ = liveQuery(() => readRaw(db));
  const cfgQ = liveQuery(() => db.settings.get(SPOTS_KEY));
  const cfg = $derived(spotsCfg($cfgQ?.value));
  let col = $state.raw(null);
  let failed = $state(false);
  $effect(() => {
    const raw = $rawQ;
    if (!raw) return;
    let live = true;
    computeFrom(raw, { only: ['municipalities'] })
      .then((r) => live && ((col = r.collections.find((c) => c.id === 'municipalities') ?? null), (failed = false)))
      .catch((err) => {
        console.error(err);
        if (live) failed = true;
      });
    return () => (live = false);
  });
  const home = $derived($rawQ?.homePlace ?? null);
  const spots = $derived(col && home ? whiteSpots(col.items, col.visited, home, cfg.radius) : null);
  let picked = $state(null);
  const pick = $derived(spots?.near.find((x) => x.id === picked) ?? null);
  let showAll = $state(false);
  let placeOpen = $state(false);
  let roundTo = $state(null); // N2: the place a round goes through
  const LIST = 5;

  // the map: a box around the near places, x = lon · cos(lat)
  const map = $derived.by(() => {
    if (!spots?.near.length) return null;
    const k = Math.cos((Number(home.lat) * Math.PI) / 180);
    let b = [Infinity, Infinity, -Infinity, -Infinity];
    for (const x of spots.near) b = [Math.min(b[0], x.bbox[0]), Math.min(b[1], x.bbox[1]), Math.max(b[2], x.bbox[2]), Math.max(b[3], x.bbox[3])];
    const vb = `${(b[0] * k).toFixed(4)} ${(-b[3]).toFixed(4)} ${((b[2] - b[0]) * k).toFixed(4)} ${(b[3] - b[1]).toFixed(4)}`;
    const r = ((b[2] - b[0]) * k) / 70;
    return { vb, r, home: [Number(home.lon) * k, -Number(home.lat)], areas: spots.near.map((x) => ({ id: x.id, been: x.been, d: pathOf(x.rings, k, 4) })) };
  });
  // a tap on the map: the list below does the same for the keyboard
  function tapMap(e) {
    const id = e.target?.closest?.('[data-ws-area]')?.getAttribute('data-ws-area');
    if (id) picked = id;
  }
  const setRadius = (v) => db.settings.put({ key: SPOTS_KEY, value: { radius: Number(v) } });
  const kmText = (x) => `${num(x.km)} km`;
</script>

<section class="ich-sec" aria-labelledby="ws-h" data-white-spots>
  <div class="ich-h">
    <div>
      <h2 id="ws-h">{t('White spots nearby')}</h2>
      <p class="ich-hs">{t('Municipalities around your home where you have never been. Your routes, rides and own ticks in New ground count.')}</p>
    </div>
  </div>
  {#if $rawQ !== undefined && !home}
    <div class="card ich-body">
      <p class="ich-help">{t('Set your home place, then the map shows the municipalities around it.')}</p>
      <button type="button" class="btn" onclick={() => (placeOpen = true)} data-ws-home><MapPin size={16} aria-hidden="true" />{t('Set your home place')}</button>
    </div>
  {:else if failed}
    <p class="ich-help" role="status">{t('The map could not be loaded. Try again later.')}</p>
  {:else if !spots}
    <p class="ich-help" role="status">{t('Loading the map …')}</p>
  {:else}
    <div class="card ich-body ws">
      <div class="ws-top">
        <p class="ws-sum" data-ws-sum>{tn(spots.open.length, '{n} municipality you have never been to', '{n} municipalities you have never been to')} · {t('{n} of {all} within {km} km visited', { n: spots.been, all: spots.near.length, km: cfg.radius })}</p>
        <Seg small full={false} label={t('Radius|spots')} value={String(cfg.radius)} onchange={setRadius} options={SPOT_RADII.map((r) => ({ key: String(r), name: `${r} km` }))} />
      </div>
      {#if map}
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
        <svg class="ws-map" viewBox={map.vb} role="img" aria-label={t('Map of the municipalities around your home')} onclick={tapMap} data-ws-map>
          {#each map.areas as a (a.id)}
            <path d={a.d} class:been={a.been} class:on={a.id === picked} stroke-width={map.r / 6} data-ws-area={a.id}></path>
          {/each}
          <circle cx={map.home[0]} cy={map.home[1]} r={map.r} class="home" stroke-width={map.r / 2.5}></circle>
        </svg>
        <p class="ws-legend"><span><span class="ws-sw been"></span>{t('Been there')}</span><span><span class="ws-sw open"></span>{t('Never been')}</span><span><span class="ws-sw home"></span>{t('Home|spots')}</span></p>
      {/if}
      {#if pick}
        <div class="ws-pickrow">
          <p class="ws-pick" role="status" data-ws-pick>{pick.name} · {kmText(pick)} · {pick.been ? t('been there') : t('never been')}</p>
          <button type="button" class="btn sm" onclick={() => (roundTo = pick)} data-ws-round><Route size={16} aria-hidden="true" />{t('Round through it')}</button>
        </div>
      {/if}
      {#if spots.open.length}
        <h3 class="ws-lh">{t('Nearest never visited')}</h3>
        <ul class="ws-list">
          {#each showAll ? spots.open : spots.open.slice(0, LIST) as x (x.id)}
            <li><button type="button" class="ws-row" class:on={x.id === picked} onclick={() => (picked = x.id)} data-ws-row={x.id}><span>{x.name}</span><small class="num">{kmText(x)}</small></button></li>
          {/each}
        </ul>
        {#if spots.open.length > LIST}
          <button type="button" class="btn btn-link" onclick={() => (showAll = !showAll)}>{showAll ? t('Show fewer') : t('Show all {n}', { n: spots.open.length })}</button>
        {/if}
      {:else}
        <p class="ich-help">{t('You have been to every municipality within {km} km. Try a bigger radius.', { km: cfg.radius })}</p>
      {/if}
    </div>
  {/if}
</section>
{#if placeOpen}<HomePlaceSheet current={null} onclose={() => (placeOpen = false)} />{/if}
{#if roundTo}<SpotRoundSheet {home} spot={roundTo} onclose={() => (roundTo = null)} />{/if}

<style>
  .ws {
    display: grid;
    gap: var(--sp-3);
  }
  .ws-top {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2) var(--sp-3);
    align-items: center;
    justify-content: space-between;
  }
  .ws-pickrow {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2) var(--sp-3);
    align-items: center;
    justify-content: space-between;
  }
  .ws-pickrow .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .ws-sum {
    margin: 0;
    min-width: 0;
  }
  .ws-map {
    display: block;
    width: 100%;
    max-height: 360px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  .ws-map path {
    fill: var(--paper);
    stroke: var(--hi);
    stroke-dasharray: 0.004 0.003;
    cursor: pointer;
  }
  .ws-map path.been {
    fill: var(--accent);
    fill-opacity: 0.55;
    stroke: var(--paper);
    stroke-dasharray: none;
  }
  .ws-map path.on {
    fill: var(--hi);
    fill-opacity: 0.35;
  }
  .ws-map .home {
    fill: var(--ink);
    stroke: var(--paper);
  }
  .ws-legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-1) var(--sp-3);
    align-items: center;
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .ws-legend > span {
    white-space: nowrap;
  }
  .ws-sw {
    display: inline-block;
    width: 12px;
    height: 12px;
    margin-right: var(--sp-1);
    border-radius: 3px;
    vertical-align: -1px;
  }
  .ws-sw.been {
    background: var(--accent);
    opacity: 0.55;
  }
  .ws-sw.open {
    border: 1px dashed var(--hi);
    background: var(--paper);
  }
  .ws-sw.home {
    border-radius: 50%;
    background: var(--ink);
  }
  .ws-pick {
    margin: 0;
    font-weight: 600;
  }
  .ws-lh {
    margin: 0;
    font-size: var(--fs-body);
  }
  .ws-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .ws-row {
    display: flex;
    gap: var(--sp-2);
    justify-content: space-between;
    width: 100%;
    min-height: 44px;
    padding: var(--sp-2) 0;
    border: 0;
    border-top: 1px solid var(--line);
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .ws-row.on span {
    font-weight: 600;
  }
  .ws-row small {
    color: var(--ink-2);
  }
</style>
