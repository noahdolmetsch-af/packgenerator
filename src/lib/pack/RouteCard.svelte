<script>
  /**
   * v0.102.0 Design-Refresh P4 «Touren» (T3 «Strecke», approved 12.10.2026 «Touren T1–T6 freigegeben»):
   * the route of a trip on Plan: the map with the start, the places of the nights and the finish, the
   * height profile, and one line «184 km · 2 Nächte · Biel → Chasseral → Delémont». «GPX ersetzen» or,
   * without a route, «GPX-Strecke hinzufügen» reads a file on the device (route.js), as in the trip
   * conditions; nothing is sent anywhere. onchange(fn): the trip change of Pack (with Undo).
   * Under the map: «Brunnen und Velo-Werkstätten an der Strecke» (route/RoutePois.svelte), only on a tap.
   * «Tour planen mit GPX» (20.10.2026): the simple profile became the fine, zoomable one with every climb
   * (route/RouteClimbs.svelte).
   */
  import { readRouteFile, routeFromGpx } from '../route/fromgpx.js'; // «Neue Quellen» 20.10.2026: with the GPX waypoints
  import RwgpsLink from '../sources/RwgpsLink.svelte';
  import { stagePlan, hasStages } from '../stages.js';
  import StaticMap from '../ui/StaticMap.svelte';
  import RoutePois from '../route/RoutePois.svelte';
  import { t, tn, num } from '../i18n.svelte.js';
  import { ChevronRight, Upload } from '@lucide/svelte';

  let { trip, onchange } = $props();

  const route = $derived(trip.route ?? null);
  const plan = $derived(hasStages(trip) ? stagePlan(trip) : []);
  const nights = $derived(plan.filter((s) => s.night).length);
  const names = $derived([plan[0]?.from, ...plan.map((s) => s.to)].filter(Boolean));
  const marks = $derived.by(() => {
    if (!route) return [];
    const out = [];
    if (route.start) out.push({ ...route.start, kind: 'start', label: plan[0]?.from ?? '' });
    for (const s of plan) if (s.night && s.end) out.push({ ...s.end, kind: 'camp', label: s.to });
    if (route.end) out.push({ ...route.end, kind: 'end', label: plan.at(-1)?.to ?? '' });
    return out;
  });
  const sub = $derived(route ? [`${num(Math.round(route.km))} km`, route.gainM ? `${num(Math.round(route.gainM))} Hm` : '', nights ? tn(nights, '{n} night stop', '{n} night stops') : ''].filter(Boolean).join(' · ') : t('No route yet'));
  const foot = $derived(route ? [`${num(Math.round(route.km))} km`, nights ? tn(nights, '{n} night', '{n} nights') : '', names.join(' → ')].filter(Boolean).join(' · ') : '');

  let msg = $state('');
  async function pick(event) {
    const file = event.currentTarget.files[0];
    event.currentTarget.value = '';
    if (!file) return;
    try {
      const r = await readRouteFile(file);
      msg = '';
      useRoute(r);
    } catch (err) {
      msg = err?.message || t('This file could not be read.');
    }
  }
  // as in the trip conditions: the start of the route becomes the weather place when there is none
  const useRoute = (r) => onchange((tr) => ({ route: r, ...(tr.place ? {} : { place: { name: r.name ? t('Start of {name}', { name: r.name }) : t('Route start'), ...r.start } }) }));
  // «Neue Quellen» 20.10.2026: the GPX of a Ride with GPS link, read like a file
  const fromLink = (text, file) => ((msg = ''), useRoute(routeFromGpx(text, file)));
</script>

<!-- «Tour planen mit GPX» (Noah 20.10.2026 «3a und b»): the fine profile coloured by gradient and every
     climb, loaded on first use (the race code: map/ProfileStrip.svelte, race/climbs-lib.js) -->
{#snippet climbs()}
  {#if route.profile?.length > 1 || route.profileFine}
    {#await import('../route/RouteClimbs.svelte') then m}<m.default {trip} />{:catch}<p class="foot">{t('The profile could not be loaded. Online again, open the trip once more.')}</p>{/await}
  {/if}
{/snippet}

<section class="rc" aria-labelledby="rc-h">
  <div class="hd">
    <div>
      <h2 id="rc-h">{t('Route|map')}</h2>
      <p class="sub num">{sub}</p>
    </div>
    {#if onchange}<label class="lk">{route ? t('Replace GPX') : t('Add GPX route')}<ChevronRight size={16} aria-hidden="true" /><input type="file" accept=".gpx,application/gpx+xml" onchange={pick} class="sr" /></label>{/if}
  </div>
  <div class="card body">
    {#if route?.line?.length > 1}
      <StaticMap line={route.line} {marks} label={t('Map of {name}', { name: route.name || trip.title })} />
      {#if foot}<p class="foot">{foot}</p>{/if}
      {@render climbs()}
      <RoutePois {trip} />
      <!-- Verpflegung (Noah 19.10.2026 «1a»): the food and water plan of this trip -->
      <a class="fuel-lk" href={`#/trips/fuel?trip=${encodeURIComponent(trip.id)}`} data-fuel-link>{t('Food and water plan')}<ChevronRight size={16} aria-hidden="true" /></a>
    {:else if route}
      <p class="foot">{foot}</p>
      {@render climbs()}
    {:else}
      <p class="none"><Upload size={18} aria-hidden="true" /><span>{t('From Komoot, Garmin or Strava: distance, climbing and a guess of the riding hours.')}</span></p>
    {/if}
    {#if onchange}<RwgpsLink onload={fromLink} label={route ? t('Other route from Ride with GPS') : ''} />{/if}
    {#if msg}<p class="warn" role="alert">{msg}</p>{/if}
  </div>
</section>

<style>
  .fuel-lk {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    justify-self: start;
    color: var(--accent);
    font-weight: 600;
  }
  .rc {
    min-width: 0;
  }
  .hd {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 4px 12px;
    flex-wrap: wrap;
    margin: 0 0 8px;
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .sub {
    margin: 2px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .lk {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .lk:focus-within {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
  .body {
    display: grid;
    gap: 10px;
  }
  .foot {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    overflow-wrap: break-word;
  }
  .none {
    display: flex;
    gap: 10px;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .none :global(svg) {
    flex: none;
  }
  .warn {
    margin: 0;
    color: var(--bad);
    font-size: var(--fs-small);
  }
</style>
