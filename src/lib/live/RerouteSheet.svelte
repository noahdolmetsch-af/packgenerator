<script>
  /**
   * Paket X «Umweg neu planen» (Noah 20.10.2026 «unbedingt umsetzen»): the window «Neu planen zu …» of
   * the live map. Choose a place (the nearest shops, beds, stations, fountains … from the stops the map
   * already has, your own points, a place you search, or the point you pressed on the map); the app asks
   * the free bike router BRouter for the way there and back onto the route (reroute.js) and hands the
   * detour to the live map (onplan). Nothing is planned without a tap.
   */
  import { Route, Search, X, Navigation, MapPin, ChevronLeft } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { backClose } from '../ui/backclose.js';
  import { bikeFor, LIVE_BIKE_KEY } from './saveride.js';
  import { suggestProfile } from './wiefaehrst.js';
  import KindIcon from '../map/KindIcon.svelte';
  import { POI_KIND } from '../race/outside.js';
  import { searchPlace } from '../weather.js';
  import { targetsOf, planAlternatives, routerMsg, PROFILES, PROFILE_STD } from '../reroute.js';
  import { navLinks } from './live-lib.js';
  import RouterNote from './RouterNote.svelte';
  import { t, num } from '../i18n.svelte.js';

  let { here = null, pts = [], km = null, pois = [], own = [], picked = null, tripBikeId = null, onplan, onclose } = $props();
  let dialog = $state();
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });

  // «Wie fährst du?» (Noah 05.11.2026 «3a»): the way of riding starts with the one that fits your bike; a tap changes it
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const lastBikeQ = liveQuery(() => db.settings.get(LIVE_BIKE_KEY));
  const bike = $derived(bikeFor(tripBikeId ? { bikeId: tripBikeId } : null, $bikesQ ?? [], $lastBikeQ?.value ?? null));
  const suggested = $derived(suggestProfile(bike));
  let chosen = $state(null);
  const profile = $derived(chosen ?? suggested ?? PROFILE_STD);
  // «Nur hin» first (Noah 27.10.2026 «2a»): only the way there, the app asks at the place how you go back
  let oneWay = $state(true);
  const withRoute = $derived(pts.length > 1);
  let busy = $state('');
  let err = $state('');
  let choices = $state(null); // Schritt 5: { target, ways: [detour] } when the router knows more than one way
  let failed = $state(null); // the place the router could not answer for (offer the navigation apps)
  let q = $state('');
  let found = $state([]);
  let searching = $state(false);
  const list = $derived(targetsOf({ pois, own, here }));
  const kindName = (k) => (k === 'own' ? t('Own point') : k === 'pick' ? t('Point on the map') : t(POI_KIND[k]?.name ?? 'Other stop'));
  const fmtKm = (v) => num(v < 10 ? Math.round(v * 10) / 10 : Math.round(v));

  async function go(target) {
    if (!here || busy) return;
    busy = String(target.id ?? `${target.lat},${target.lon}`);
    err = '';
    failed = null;
    try {
      const ways = await planAlternatives({ here, target, pts, fromKm: pts.length > 1 ? km : null, profile, oneWay: withRoute && oneWay });
      if (ways.length > 1) {
        choices = { target, ways };
        return;
      }
      onplan?.(ways[0]);
      dialog.close();
    } catch (e) {
      failed = target;
      err = t(routerMsg(e));
    } finally {
      busy = '';
    }
  }

  const take = (d) => {
    onplan?.(d);
    dialog.close();
  };
  const TAGS = { shortest: 'Shortest', fastest: 'Fastest', flattest: 'Flattest' };
  const hm = (min) => (min >= 60 ? `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}` : `${min} min`);
  // the ways share one frame so their shapes can be compared
  const frame = $derived.by(() => {
    const all = (choices?.ways ?? []).flatMap((w) => w.line);
    if (!all.length) return null;
    const lat = all.map((p) => p[0]);
    const lon = all.map((p) => p[1]);
    const [la0, la1, lo0, lo1] = [Math.min(...lat), Math.max(...lat), Math.min(...lon), Math.max(...lon)];
    const k = Math.cos(((la0 + la1) / 2) * (Math.PI / 180));
    const w = Math.max((lo1 - lo0) * k, 1e-6);
    const h = Math.max(la1 - la0, 1e-6);
    const sc = Math.min(96 / w, 56 / h);
    return { la1, lo0, k, sc, ox: (100 - w * sc) / 2, oy: (60 - h * sc) / 2 };
  });
  const shape = (line) => (frame ? line.filter((_, i) => i % Math.max(1, Math.floor(line.length / 60)) === 0 || i === line.length - 1).map((p) => `${(frame.ox + (p[1] - frame.lo0) * frame.k * frame.sc).toFixed(1)},${(frame.oy + (frame.la1 - p[0]) * frame.sc).toFixed(1)}`).join(' ') : '');
  const WAYCOL = ['var(--l3, #3a7ac0)', '#c2410c', '#6d28d9'];

  async function search(e) {
    e?.preventDefault();
    if (q.trim().length < 2) return;
    searching = true;
    err = '';
    try {
      found = (await searchPlace(q)).map((p, i) => ({ ...p, id: `s${i}`, kind: 'target' }));
      if (!found.length) err = t('No place found with this name.');
    } catch (e) {
      found = [];
      err = e?.outage ? e.message : t('The place search did not answer. Check the internet and try again.');
    } finally {
      searching = false;
    }
  }
</script>

{#snippet row(p, sub)}
  <li class="rc-row rr-row">
    {#if p.kind === 'target' || p.kind === 'pick'}<span class="rr-ic" aria-hidden="true"><MapPin size={18} /></span>{:else}<KindIcon kind={p.kind} size={18} />{/if}
    <span class="rc-row-main"><b>{p.name || kindName(p.kind)}</b><small>{sub}</small></span>
    <button type="button" class="btn sm" onclick={() => go(p)} disabled={!!busy || !here} data-reroute-go={p.kind}>
      <Route size={16} aria-hidden="true" />{busy === String(p.id ?? `${p.lat},${p.lon}`) ? t('Planning…') : t('Plan')}
    </button>
  </li>
{/snippet}

<dialog class="sheet from-below rr" bind:this={dialog} use:backClose={() => dialog.close()} onclose={() => onclose?.()} aria-labelledby="rr-h" data-reroute-sheet>
  <div class="rr-head">
    <h2 id="rr-h">{t('Plan a new way to …')}</h2>
    <button type="button" class="rc-icon" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <p class="rc-note">{withRoute ? (oneWay ? t('Choose a place: the app plans a bike way there. At the place it asks how you go back onto your route.') : t('Choose a place: the app plans a bike way there and back onto your route a little after it. Your route stays as it is.')) : t('Choose a place: the app plans a bike way there from where you are.')}</p>
  {#if withRoute}
    <div class="rr-chips" role="group" aria-label={t('Which way')}>
      <button type="button" class="rr-chip" aria-pressed={oneWay} onclick={() => (oneWay = true)} data-reroute-oneway>{t('Only there')}</button>
      <button type="button" class="rr-chip" aria-pressed={!oneWay} onclick={() => (oneWay = false)} data-reroute-roundtrip>{t('There and back onto the route')}</button>
    </div>
  {/if}
  {#if !here}<p class="rc-warn" role="status">{t('Waiting for the GPS …')}</p>{/if}
  <RouterNote />

  <p class="rr-q" id="rr-q">{t('How do you ride?')}</p>
  <div class="rr-chips" role="group" aria-labelledby="rr-q">
    {#each PROFILES as p (p.key)}
      <button type="button" class="rr-chip" aria-pressed={profile === p.key} onclick={() => (chosen = p.key)} data-reroute-profile={p.key}>{t(p.name)}</button>
    {/each}
  </div>
  {#if bike && suggested && profile === suggested && chosen == null}
    <p class="rc-note" data-reroute-suggest>{t('Suggested for {bike}. Tap another way if you ride differently today.', { bike: bike.name })}</p>
  {/if}

  {#if err}
    <p class="rc-warn" role="alert" data-reroute-error>{err}</p>
    {#if failed}
      {@const l = navLinks({ lat: Number(failed.lat), lon: Number(failed.lon) })}
      <div class="rc-acts">
        <a class="btn sm" href={l.google} target="_blank" rel="noopener noreferrer"><Navigation size={16} aria-hidden="true" />{t('Google Maps')}</a>
        <a class="btn sm" href={l.osmand} target="_blank" rel="noopener noreferrer"><Navigation size={16} aria-hidden="true" />{t('OsmAnd')}</a>
      </div>
    {/if}
  {/if}

  {#if choices}
    <div data-reroute-alts>
      <button type="button" class="btn sm" onclick={() => (choices = null)} data-reroute-alts-back><ChevronLeft size={16} aria-hidden="true" />{t('Other place')}</button>
      <h3 class="rr-h3">{t('Choose a way to {name}', { name: choices.target.name || t('the point') })}</h3>
      <ul class="rc-list">
        {#each choices.ways as w, i (i)}
          <li class="rc-row rr-way" data-reroute-alt={i}>
            <svg viewBox="0 0 100 60" class="rr-shape" aria-hidden="true"><polyline points={shape(w.line)} fill="none" stroke={WAYCOL[i % 3]} stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg>
            <span class="rc-row-main">
              <b>{t('Way {n}', { n: i + 1 })}</b>
              <small>{fmtKm(w.km)} km{w.min != null ? ` · ${hm(w.min)}` : ''}{w.gainM != null ? ` · ${num(w.gainM)} m ↑` : ''}</small>
              {#if w.tags?.length}<span class="rr-tags">{#each w.tags as g (g)}<em>{t(TAGS[g])}</em>{/each}</span>{/if}
            </span>
            <button type="button" class="btn sm" onclick={() => take(w)} data-reroute-take={i}><Navigation size={16} aria-hidden="true" />{t('Take this way')}</button>
          </li>
        {/each}
      </ul>
      <p class="rc-src">{t('The router suggests these ways. Pick one; you can plan again any time.')}</p>
    </div>
  {:else}
  {#if picked}
    <h3 class="rr-h3">{t('Point on the map')}</h3>
    <ul class="rc-list">{@render row({ ...picked, id: 'pick', kind: 'pick' }, `${num(Math.round(picked.lat * 1e4) / 1e4)}, ${num(Math.round(picked.lon * 1e4) / 1e4)}`)}</ul>
  {/if}

  <h3 class="rr-h3">{t('Nearby')}</h3>
  {#if list.length}
    <ul class="rc-list" data-reroute-list>
      {#each list as p (`${p.kind}-${p.id}`)}{@render row(p, `${kindName(p.kind)} · ${t('{d} km as the crow flies', { d: fmtKm(p.distKm) })}`)}{/each}
    </ul>
  {:else}
    <p class="rc-empty">{t('No stops loaded yet. Load the stops in the panel, search a place below, or press long on the map.')}</p>
  {/if}

  <h3 class="rr-h3">{t('Search a place')}</h3>
  <form class="rr-search" onsubmit={search}>
    <input class="inp" type="search" bind:value={q} placeholder={t('Village, town or station')} aria-label={t('Search a place')} data-reroute-q />
    <button type="submit" class="btn sm" disabled={searching}><Search size={16} aria-hidden="true" />{searching ? t('Loading…') : t('Search')}</button>
  </form>
  {#if found.length}
    <ul class="rc-list" data-reroute-found>
      {#each found as p (p.id)}{@render row(p, p.detail)}{/each}
    </ul>
  {/if}
  <p class="rc-src">{t('Ways from BRouter (free, open source, map data © OpenStreetMap). Long press on the map to plan to any point.')}</p>
  {/if}
</dialog>

<style>
  .rr-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .rr-head h2 {
    margin: 0;
  }
  .rr-h3 {
    margin: 14px 0 6px;
    font-size: var(--fs-sub);
  }
  .rr-q {
    margin: 8px 0 2px;
    font-weight: 600;
  }
  .rr-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 10px 0;
  }
  .rr-chip {
    min-height: 44px;
    padding: 8px 13px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-body) var(--font-body);
    cursor: pointer;
  }
  .rr-chip[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .rr-row .rc-row-main {
    min-width: 0;
  }
  .rr-ic {
    display: inline-grid;
    place-items: center;
    width: 18px;
    color: var(--ink-2);
  }
  .rr-way {
    align-items: center;
  }
  .rr-shape {
    width: 76px;
    height: 46px;
    flex: none;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--paper);
  }
  .rr-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 2px;
  }
  .rr-tags em {
    font: 600 var(--fs-small, 12px) var(--font-body);
    font-style: normal;
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--ink);
    color: var(--paper);
  }
  .rr-search {
    display: flex;
    gap: 8px;
  }
  .rr-search .inp {
    flex: 1;
    min-width: 0;
  }
</style>
