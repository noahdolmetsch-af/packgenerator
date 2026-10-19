<script>
  /**
   * Paket U «Rennen»: one race (#/race/<tripId>/<part>). Builds what every part needs once (the race with
   * its suggestions, the route, the plan, the stops) and shows the five parts as tabs; each part loads on
   * its first visit. Parts get `ctx` = { trip, race, stored, save, route, pts, plan, pois, own, osm,
   * items, bikes, bike, trips, races, today, fromRides, as, sims, sim, way, acts, rides }.
   */
  import { liveQuery } from 'dexie';
  import Crumb from '../flow/kit/Crumb.svelte';
  import LazyPage from '../nav/LazyPage.svelte';
  import { db } from '../db.js';
  import { racesQuery, saveRace, cacheQuery } from './store.js';
  import { raceOf, schedule, lineKm, countdown } from './race.js';
  import { POI_CACHE } from './outside.js';
  import { mergePois } from './more.js';
  import { paceFromRides, loadedBy, assumptionsOf, compareWays, simPlan } from './strategy.js';
  import { PARTS, raceHref } from './parts.js';
  import { localDay } from '../localday.js';
  import SampleBar from './SampleBar.svelte';
  import { setBox } from './view.js';
  import { t, tn } from '../i18n.svelte.js';
  import './race.css';

  let { id, part = 'plan', box = '' } = $props();
  // «Try it» from Plan › All 40 functions: show the box (on again if it was off) and scroll to it
  $effect(() => {
    if (!box) return;
    setBox(box, 'shown');
    let n = 0;
    const timer = setInterval(() => {
      const el = document.querySelector(`[data-race-box="${box}"]`);
      if (el || ++n > 40) clearInterval(timer);
      if (el) {
        el.scrollIntoView({ block: 'start', behavior: 'smooth' });
        el.classList.add('rc-flash');
        setTimeout(() => el.classList.remove('rc-flash'), 2400);
      }
    }, 100);
    return () => clearInterval(timer);
  });
  const LOAD = {
    plan: () => import('./Plan.svelte'),
    strategy: () => import('./Strategie.svelte'),
    prepare: () => import('./Prepare.svelte'),
    route: () => import('./AlongRoute.svelte'),
    ride: () => import('./RaceMode.svelte'),
    after: () => import('./After.svelte'),
    brief: () => import('./Briefing.svelte'),
  };
  const tripQ = liveQuery(() => db.trips.get(id));
  const tripsQ = liveQuery(() => db.trips.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const racesQ = racesQuery();
  const actsQ = liveQuery(() => db.activities.toArray());
  const ridesQ = liveQuery(() => db.rides.toArray());
  const osmQ = cacheQuery(POI_CACHE + id);
  const today = localDay();

  const trip = $derived($tripQ);
  const stored = $derived(($racesQ ?? {})[id] ?? {});
  const race = $derived(trip ? raceOf(stored, trip) : null);
  const route = $derived(stored.route ?? trip?.route ?? null);
  const pts = $derived(lineKm(route));
  const own = $derived(Array.isArray(stored.pois) ? stored.pois : []);
  const osm = $derived($osmQ?.data ?? []);
  const pois = $derived(mergePois(own, osm));
  // Strategie: your pace (loaded apart from light), the assumptions and the three ways played through
  const fromRides = $derived(paceFromRides($actsQ ?? [], $ridesQ ?? [], loadedBy($tripsQ ?? [], stored.loadedIds ?? [])));
  const as = $derived(assumptionsOf(stored, fromRides));
  const sims = $derived(race?.start && route?.km ? compareWays({ km: route.km, profile: route.profile, pois, start: race.start, as, own: stored.ownAssume ?? [], fixed: stored.fixedNights ?? {} }) : []);
  const way = $derived(stored.way ?? 'mixed');
  const sim = $derived(sims.find((x) => x?.way === way) ?? null);
  // the time plan of all parts: the stages of your way (they end at the beds), else an even plan
  const plan = $derived(sim?.done ? simPlan(sim, route.km, route.profile) : race && route?.km ? schedule(race, route.km, route.profile) : null);
  const save = (patch) => saveRace(id, patch);
  const ctx = $derived(
    trip && race
      ? { trip, race, stored, save, route, pts, plan, pois, own, osm, osmAt: $osmQ?.at ?? null, items: $itemsQ ?? [], bikes: $bikesQ ?? [], bike: ($bikesQ ?? []).find((b) => b.id === trip.bikeId) ?? null, trips: $tripsQ ?? [], races: $racesQ ?? {}, today, fromRides, as, sims, sim, way, acts: $actsQ ?? [], rides: $ridesQ ?? [] }
      : null,
  );
  const cd = $derived(trip?.startDate ? countdown(trip.startDate, today) : null);
</script>

{#if $tripQ === undefined}
  <p class="rc-note">{t('Loading…')}</p>
{:else if !trip}
  <div class="rc" data-page="race-missing">
    <Crumb path={[{ href: '#/race', label: t('Races') }]} here={t('Race')} />
    <h1 class="rc-h1" tabindex="-1" data-page-title>{t('This race is not here')}</h1>
    <p class="rc-text">{t('Its trip was deleted or is on another device.')}</p>
    <a class="btn" href="#/race">{t('To the races')}</a>
  </div>
{:else if part === 'brief'}
  {#if ctx}<LazyPage load={LOAD.brief} {ctx} />{/if}
{:else}
  <div class="rc" class:rc-is-sample={!!stored.sample} style:--rc-edit={`"✎ ${t('You can change this')}"`} data-page="race-{part}">
    <Crumb path={[{ href: '#/trips', label: t('Trips|place') }, { href: '#/race', label: t('Races') }]} here={trip.title} />
    <h1 class="rc-h1" tabindex="-1" data-page-title>{trip.title}</h1>
    <p class="rc-intro">
      {#if route?.km}{t('{km} km · {up} m up', { km: Math.round(route.km), up: Math.round(route.gainM ?? 0).toLocaleString() })}{:else}{t('No route yet: load it under «Prepare».')}{/if}
      {#if cd && cd.days >= 0} · {tn(cd.days, 'starts in {n} day', 'starts in {n} days')}{/if}
    </p>
    {#if stored.sample}<SampleBar {stored} />{/if}
    <nav class="rc-tabs" aria-label={t('Parts of the race')}>
      {#each PARTS as p (p.key)}
        <a class="rc-tab" href={raceHref(id, p.key)} aria-current={p.key === part ? 'page' : undefined} data-race-tab={p.key}>{t(p.title)}</a>
      {/each}
    </nav>
    {#if ctx}
      {#key part}<LazyPage load={LOAD[part]} {ctx} />{/key}
    {/if}
  </div>
{/if}
