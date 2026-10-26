<script>
  /**
   * Gruppen-Live-Karte, für Events (Noah 26.10.2026 «1-5 alle»): on the friends' page the stops along the
   * group's route (water, food, shops, petrol stations, WC …), ahead of where you are, with distance and the
   * way there. Free data from OpenStreetMap through the live map's loader (live/stops.js loadAlong), kept in
   * this browser per group. onpoints(list): the stops as dots for the map.
   */
  import { RefreshCw } from '@lucide/svelte';
  import { t, num } from '../i18n.svelte.js';
  import { loadAlong } from './stops.js';
  import { stopsAhead, navLinks } from './live-lib.js';
  import { POI_KIND } from '../race/outside.js';
  import { lineKm, snap } from '../race/race.js';
  import { STOP_GLYPH } from './group.js';

  let { gid = '', route = null, here = null, onpoints = null } = $props();
  const pts = $derived(lineKm(route));
  const km = $derived.by(() => {
    if (!here || pts.length < 2) return 0;
    const s = snap(pts, here);
    return Number.isFinite(s.offKm) && s.offKm <= 3 ? s.km : 0;
  });
  let pois = $state([]);
  let busy = $state(false);
  let msg = $state('');
  const rows = $derived(stopsAhead({ pois, pts, here, km, n: 6 }));
  $effect(() => onpoints?.(rows.map((s) => ({ id: `stop-${s.id}`, kind: 'friend', cls: 'stop', pos: [Number(s.lat), Number(s.lon)], n: STOP_GLYPH[s.kind] ?? '•', text: `${s.name || kindName(s.kind)}, ${t('{d} km', { d: num(s.distKm) })}` }))));
  const kindName = (k) => t(POI_KIND[k]?.name ?? 'Other stop');

  async function load() {
    busy = true;
    msg = '';
    try {
      pois = await loadAlong(`grp-${gid}`, pts, { fromKm: km });
      if (!pois.length) msg = t('No stops ahead on the route yet.');
    } catch (e) {
      msg = e?.message === 'busy' ? t('OpenStreetMap is busy. Try again in a minute.') : t('The stops could not load. Try again later.');
    }
    busy = false;
  }
</script>

<section class="card gs-box" aria-labelledby="gs-h" data-group-stops>
  <h2 id="gs-h">{t('Stops along the route')}</h2>
  {#if rows.length}
    <ul class="gs-list">
      {#each rows as s (s.id)}
        {@const l = navLinks({ lat: Number(s.lat), lon: Number(s.lon) })}
        <li data-group-stop-row={s.kind}>
          <span class="gs-ic" aria-hidden="true">{STOP_GLYPH[s.kind] ?? '•'}</span>
          <span class="gs-txt"><b>{s.name || kindName(s.kind)}</b><small>{kindName(s.kind)} · {t('{d} km', { d: num(s.distKm) })}</small></span>
          <a class="btn sm" href={l.google} target="_blank" rel="noopener noreferrer">{t('Google Maps')}</a>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="tp-small tp-muted">{t('Water, food, shops, petrol stations and WC along the route of the group, ahead of you. Free data from OpenStreetMap.')}</p>
  {/if}
  <div><button type="button" class="btn sm" onclick={load} disabled={busy} data-group-stops-load><RefreshCw size={16} aria-hidden="true" />{busy ? t('Loading…') : t('Load stops along the route')}</button></div>
  {#if msg}<p class="tp-small" role="status">{msg}</p>{/if}
</section>

<style>
  .gs-box {
    display: grid;
    gap: var(--sp-3);
  }
  .gs-box h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .gs-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--sp-2);
  }
  .gs-list li {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
  }
  .gs-ic {
    flex: none;
    width: 34px;
    text-align: center;
    font-size: var(--fs-sub);
  }
  .gs-txt {
    flex: 1;
    display: grid;
    min-width: 0;
  }
  .gs-txt small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
