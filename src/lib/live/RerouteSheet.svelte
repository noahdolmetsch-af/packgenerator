<script>
  /**
   * Paket X «Umweg neu planen» (Noah 20.10.2026 «unbedingt umsetzen»): the window «Neu planen zu …» of
   * the live map. Choose a place (the nearest shops, beds, stations, fountains … from the stops the map
   * already has, your own points, a place you search, or the point you pressed on the map); the app asks
   * the free bike router BRouter for the way there and back onto the route (reroute.js) and hands the
   * detour to the live map (onplan). Nothing is planned without a tap.
   */
  import { Route, Search, X, Navigation, MapPin } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import KindIcon from '../map/KindIcon.svelte';
  import { POI_KIND } from '../race/outside.js';
  import { searchPlace } from '../weather.js';
  import { targetsOf, planDetour, PROFILES, PROFILE_STD } from '../reroute.js';
  import { navLinks } from './live-lib.js';
  import { t, num } from '../i18n.svelte.js';

  let { here = null, pts = [], km = null, pois = [], own = [], picked = null, onplan, onclose } = $props();
  let dialog = $state();
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });

  let profile = $state(PROFILE_STD);
  // «Nur hin» first (Noah 27.10.2026 «2a»): only the way there, the app asks at the place how you go back
  let oneWay = $state(true);
  const withRoute = $derived(pts.length > 1);
  let busy = $state('');
  let err = $state('');
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
      const d = await planDetour({ here, target, pts, fromKm: pts.length > 1 ? km : null, profile, oneWay: withRoute && oneWay });
      onplan?.(d);
      dialog.close();
    } catch (e) {
      failed = target;
      err =
        e?.message === 'busy'
          ? t('The bike router is busy right now. Try again in a minute, or use a navigation app.')
          : e?.message === 'noroute'
            ? t('The bike router found no way there. Choose another place, or use a navigation app.')
            : navigator.onLine === false
              ? t('Offline: a new way needs the internet. A navigation app with offline maps still works.')
              : t('The bike router did not answer. Try again, or use a navigation app.');
    } finally {
      busy = '';
    }
  }

  async function search(e) {
    e?.preventDefault();
    if (q.trim().length < 2) return;
    searching = true;
    err = '';
    try {
      found = (await searchPlace(q)).map((p, i) => ({ ...p, id: `s${i}`, kind: 'target' }));
      if (!found.length) err = t('No place found with this name.');
    } catch {
      found = [];
      err = t('The place search did not answer. Check the internet and try again.');
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

  <div class="rr-chips" role="group" aria-label={t('Kind of way')}>
    {#each PROFILES as p (p.key)}
      <button type="button" class="rr-chip" aria-pressed={profile === p.key} onclick={() => (profile = p.key)} data-reroute-profile={p.key}>{t(p.name)}</button>
    {/each}
  </div>

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
  .rr-search {
    display: flex;
    gap: 8px;
  }
  .rr-search .inp {
    flex: 1;
    min-width: 0;
  }
</style>
