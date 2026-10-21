<script>
  import { askDelete, deleteWithUndo } from '../ui/ask.js'; // «Rückmeldungen» 19.10.2026: the app's own question, then 4 s «Undo»
  import { localDay } from '../localday.js';
  /**
   * Route and weather of a trip (Noah, 4.10.2026, answers 4a, 5a, 12b):
   * - a GPX route gives distance, climbing, a guess of the riding hours and the start place;
   * - the start place is typed in by hand (or taken from the route);
   * - the forecast comes from Open-Meteo when online; offline the last saved one shows.
   * Nothing changes the packing weather until you press "Use".
   *
   * onchange(fn): fn gets a plain copy of the trip and returns the fields to store.
   */
  import { ridingHours, SPEED_KMH, CLIMB_MH } from '../route.js';
  import { readRouteFile, routeFromGpx } from '../route/fromgpx.js'; // «Neue Quellen» 20.10.2026: with the GPX waypoints
  import RwgpsLink from '../sources/RwgpsLink.svelte';
  import { withRainPct, pctOf } from '../wardrobe.js';
  import { searchPlace, fetchForecast, forecastForTrip, toWx, forecastFrom, ageText, tripDays } from '../weather.js';
  import { RAIN } from '../trips.js';
  import Profile from '../ui/Profile.svelte';
  import { stageCount } from '../ride.js';
  import { liveQuery } from 'dexie';
  import { paceOf, PACE_KEY } from '../pace.js';
  import { loadWerte } from '../review/actdata.js';
  import { paceFor, usualSurface, surfaceName } from '../review/werte.js';
  import { db } from '../db.js';
  import { t, num, locale, lang } from '../i18n.svelte.js';
  import Woanders from '../sk/Woanders.svelte'; // SK X3, X6, X10, X12 (SKX2, SKX4)
  import { swisstopoUrl, meteoUrl, sbbUrl, schweizMobilUrl, slfUrl } from '../sk/links.js';
  import { domainOf, hasBike } from '../domains.js';
  import SnowBox from '../mountain/SnowBox.svelte'; // Paket J #160: freezing level and fresh snow
  import { isMountain } from '../mountain/snow.js';
  import { Map as MapIcon, Siren } from '@lucide/svelte';
  import EatEvery from '../unterwegs/EatEvery.svelte';
  import { tripEat } from '../unterwegs/essen.js';
  import TravelLinks from '../sk/TravelLinks.svelte'; // «Reise-Links» (Noah 19.10.2026 «1b 2b 3a 4a 5b»)

  let { trip, onchange } = $props();

  let online = $state(navigator.onLine);
  $effect(() => {
    const up = () => (online = navigator.onLine);
    window.addEventListener('online', up);
    window.addEventListener('offline', up);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', up);
    };
  });

  /* ---------- route ---------- */
  let routeMsg = $state('');
  // A nonstop trip has one stage, so the hours are for the whole ride (v0.18.1).
  const stages = $derived(stageCount(trip));
  // v0.19.0: your pace from your rides when learned (Debrief → Your pace).
  const paceQ = liveQuery(() => db.settings.get(PACE_KEY));
  // SN2+ SN2h (answer 4b): the bike's own pace on its surface from 5 rides, else the rule
  const werteQ = liveQuery(() => loadWerte(db));
  const tripBike = $derived(($werteQ?.bikes ?? []).find((b) => b.id === trip.bikeId) ?? null);
  const pace = $derived(paceFor(paceOf($paceQ?.value), $werteQ?.grid ?? [], trip.bikeId ?? null, tripBike ? usualSurface(tripBike, $werteQ?.rides ?? []) : null));
  const hours = $derived(ridingHours(trip.route, stages, pace));
  async function pickGpx(event) {
    const file = event.currentTarget.files[0];
    event.currentTarget.value = '';
    if (!file) return;
    try {
      // v0.27.0 (Noah 1a, AP22): size and empty file checked before reading; on error nothing is stored.
      const route = await readRouteFile(file);
      routeMsg = '';
      useRoute(route);
    } catch (err) {
      routeMsg = err?.message || t('This file could not be read.');
    }
  }
  // The route start becomes the weather place when there is none yet.
  const useRoute = (route) => onchange((tr) => ({ route, ...(tr.place ? {} : { place: { name: route.name ? t('Start of {name}', { name: route.name }) : t('Route start'), ...route.start } }) }));
  // «Neue Quellen» 20.10.2026: the GPX of a Ride with GPS link, read like a file (RwgpsLink shows a thrown message)
  const fromLink = (text, file) => ((routeMsg = ''), useRoute(routeFromGpx(text, file)));
  // «Rückmeldungen» 19.10.2026: the app's own question, then 4 s «Undo»
  async function dropRoute() {
    if ((await askDelete({ title: t('Remove the route from this trip?'), text: t('You can bring it back for 4 seconds afterwards.'), label: t('Remove') })) !== 'delete') return;
    const route = $state.snapshot(trip.route);
    const name = route?.name || t('Route');
    await deleteWithUndo({ run: () => onchange(() => ({ route: null })), undo: () => onchange(() => ({ route })), text: t('"{name}" removed.', { name }), name });
  }

  /* ---------- place ---------- */
  let q = $state('');
  let found = $state([]);
  let searching = $state(false);
  let placeMsg = $state('');
  let editPlace = $state(false);
  async function search(event) {
    event.preventDefault();
    searching = true;
    placeMsg = '';
    try {
      found = await searchPlace(q);
      if (!found.length) placeMsg = t('No place found. Try another spelling.');
    } catch {
      // v0.27.0 (Noah 1a, AP22): offline and "service down" are told apart.
      placeMsg = navigator.onLine ? t('The place search is not answering. Try again later.') : t('No connection. Place search needs the internet.');
    } finally {
      searching = false;
    }
  }
  async function choose(p) {
    found = [];
    q = '';
    editPlace = false;
    const place = { name: p.detail ? `${p.name}, ${p.detail}` : p.name, lat: p.lat, lon: p.lon };
    await onchange(() => ({ place, forecast: null }));
    if (reachable && online) load(place);
  }

  /* ---------- forecast ---------- */
  let loading = $state(false);
  let wxMsg = $state('');
  const today = localDay();
  const days = $derived(forecastForTrip(trip));
  const from = $derived(forecastFrom(trip));
  const reachable = $derived(!!trip.startDate && from <= today && tripDays(trip).at(-1) >= today);
  const suggested = $derived(toWx(days));
  const same = $derived(suggested && trip.wx?.min === suggested.min && trip.wx?.max === suggested.max && (trip.wx?.rain ?? 'none') === suggested.rain);
  async function load(place = trip.place) {
    if (!place) return;
    loading = true;
    wxMsg = '';
    try {
      const forecast = await fetchForecast(place);
      // v0.42.0 (Noah 12): the rain chance over the riding hours is stored on the forecast.
      onchange((tr) => ({ forecast: withRainPct(forecast, tr) }));
    } catch {
      wxMsg = online ? t('The forecast could not be loaded. Try again later.') : t('Offline: showing the last saved forecast.');
    } finally {
      loading = false;
    }
  }
  // Fresh forecast once when Pack opens: online, the trip is in reach and the saved one is older than 3 hours.
  let tried = false;
  $effect(() => {
    if (tried || !online || !trip.place || !reachable) return;
    tried = true;
    const age = trip.forecast?.fetchedAt ? Date.now() - new Date(trip.forecast.fetchedAt) : Infinity;
    if (age > 3 * 36e5) load();
  });
  const useWx = () => onchange((tr) => ({ wx: { ...(tr.wx ?? {}), ...suggested, ...pctOf(tr) } }));

  const day = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric' });
  const longDay = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
</script>

<div class="rw">
  <div class="part">
    <span class="lbl">{t('Route')}</span>
    {#if trip.route}
      <p class="facts"><b>{trip.route.name || t('Route')}</b> <span class="num">{num(trip.route.km)} km · ↑ {num(trip.route.gainM)} m</span></p>
      {#if trip.route.profile?.length > 1}<Profile points={trip.route.profile} />{/if}
      <p class="acts">
        {#if hours != null}
          {#if trip.hours === hours}<span class="ok">{stages > 1 ? t('Riding hours: about {h} h a day', { h: hours }) : t('Riding hours: about {h} h', { h: hours })}</span>
          {:else}<button type="button" class="btn sm" onclick={() => onchange(() => ({ hours }))}>{stages > 1 ? t('Use about {h} h a day as riding hours', { h: hours }) : t('Use about {h} h as riding hours', { h: hours })}</button>{/if}
        {/if}
        <label class="link">{t('Other GPX')}<input type="file" accept=".gpx,application/gpx+xml" onchange={pickGpx} hidden /></label>
        <button type="button" class="link" onclick={dropRoute}>{t('Remove')}</button>
      </p>
      <RwgpsLink onload={fromLink} label={t('Other route from Ride with GPS')} />
      {#if hours != null}<p class="hint">{#if pace.cell}{t('Your pace on {bike}, {surface}, from {n} rides: {kmh} km/h plus 1 h per {m} m climbing.', { bike: tripBike?.name ?? '', surface: t(surfaceName(pace.cell.surface)), n: pace.cell.n, kmh: pace.kmh, m: pace.climbMh })} <a href="#/debrief/pace">{t('Change')}</a>{:else if pace.mine}{t('Your pace from {n} rides: {kmh} km/h plus 1 h per {m} m climbing.', { n: pace.n, kmh: pace.kmh, m: pace.climbMh })} <a href="#/debrief/pace">{t('Change')}</a>{:else}{t('Guess with luggage: {kmh} km/h plus 1 h per {m} m climbing.', { kmh: SPEED_KMH, m: CLIMB_MH })} <a href="#/debrief/pace">{pace.standard && !pace.need ? t('Your pace') : t('Learn your pace')}</a>{/if}</p>{/if}
    {:else}
      <label class="btn sm">{t('Add GPX route')}<input type="file" accept=".gpx,application/gpx+xml" onchange={pickGpx} hidden /></label>
      <RwgpsLink onload={fromLink} />
      <p class="hint">{t('From Komoot, Garmin or Strava: distance, climbing and a guess of the riding hours.')}</p>
      <!-- GPX-Weg 5a: a route is planned; a ride you rode has its own place -->
      <p class="hint">{t('This is for a planned route. A ride you rode goes to')} <a href="#/debrief/ride">{t('Look back › Upload ride')}</a>.</p>
    {/if}
    {#if routeMsg}<p class="warn" role="alert">{routeMsg}</p>{/if}
    <!-- SK X10 (the route on the national map), X12 (an idea from SchweizMobil, bike trips), X6 (ski tours only) -->
    <Woanders context={trip.title ?? ''} links={[
      ...(trip.route || trip.place ? [{ kind: 'x10', href: swisstopoUrl(trip.place), icon: 'map', sub: t('The route on the national map') }] : []),
      ...(hasBike(trip) && !trip.route ? [{ kind: 'x12', href: schweizMobilUrl(lang.v), icon: 'signpost', sub: t('Official cycling routes of Switzerland') }] : []),
      ...(domainOf(trip) === 'ski' ? [{ kind: 'x6', href: slfUrl(lang.v), icon: 'mountain', sub: t('SLF · the evening before and on the day') }] : []),
    ]} />
  </div>

  <div class="part">
    <span class="lbl">{t('Forecast')}</span>
    {#if trip.place && !editPlace}
      <p class="facts"><b>{trip.place.name}</b> <button type="button" class="link" onclick={() => (editPlace = true)}>{t('Change place')}</button></p>
    {:else}
      <form class="find" onsubmit={search}>
        <input class="inp" bind:value={q} placeholder={t('Start place, e.g. Delémont')} aria-label={t('Start place of the trip')} />
        <button type="submit" class="btn sm" disabled={searching || q.trim().length < 2}>{t('Find')}</button>
        {#if editPlace}<button type="button" class="link" onclick={() => ((editPlace = false), (found = []))}>{t('Cancel')}</button>{/if}
      </form>
      {#if found.length}
        <ul class="found">
          {#each found as p (`${p.lat},${p.lon}`)}<li><button type="button" class="link" onclick={() => choose(p)}>{p.name}</button> <small>{p.detail}</small></li>{/each}
        </ul>
      {/if}
      {#if placeMsg}<p class="warn" role="alert">{placeMsg}</p>{/if}
    {/if}

    {#if trip.place && !editPlace}
      {#if days.length}
        <ul class="days">
          {#each days as d (d.date)}
            <li><span>{day(d.date)}</span><b class="num">{Math.round(d.min)}–{Math.round(d.max)} °C</b><span class="num rain">{d.rainMm ? `${d.rainMm} mm` : t('dry')}{d.rainPct != null ? ` · ${d.rainPct} %` : ''}</span></li>
          {/each}
        </ul>
        <p class="acts">
          {#if same}<span class="ok">{t('Packing for this forecast')}</span>
          {:else}<button type="button" class="btn sm hi" onclick={useWx}>{t('Pack for {min}–{max} °C, {rain}', { min: suggested.min, max: suggested.max, rain: t(RAIN[suggested.rain]) })}</button>{/if}
          <button type="button" class="link" disabled={loading || !online} onclick={() => load()}>{loading ? t('Loading…') : t('Update')}</button>
        </p>
        <p class="hint">{online ? t('From Open-Meteo, {age}.', { age: ageText(trip.forecast.fetchedAt) }) : t('From Open-Meteo, {age} (offline).', { age: ageText(trip.forecast.fetchedAt) })}</p>
      {:else if !trip.startDate}
        <p class="hint">{t('Set a start date for the trip to get its forecast.')}</p>
      {:else if !reachable}
        <p class="hint">{from > today ? t('The forecast reaches this trip from {date} (16 days ahead).', { date: longDay(from) }) : t('This trip is over.')}</p>
      {:else}
        <p class="acts"><button type="button" class="btn sm" disabled={loading || !online} onclick={() => load()}>{loading ? t('Loading…') : t('Get forecast')}</button>{#if !online}<span class="hint">{t('Needs the internet.')}</span>{/if}</p>
      {/if}
      {#if wxMsg}<p class="warn" role="alert">{wxMsg}</p>{/if}
      <!-- SK X3 (SKX2): the forecast map and the train to the start on the trip's day; only the place and the day go out -->
      <Woanders context={trip.place.name} links={[{ kind: 'x3m', href: meteoUrl(lang.v), icon: 'cloudsun', sub: t('Forecast map') }, { kind: 'x3s', href: sbbUrl(trip.place, trip.startDate, lang.v), icon: 'train', sub: [t('to {place}', { place: trip.place.name }), trip.startDate ? longDay(trip.startDate) : ''].filter(Boolean).join(' · ') }]} />
    {/if}
  </div>

  {#if hasBike(trip)}
    <!-- Noah 21.10.2026 «beim erstellen einer tour kann die einstellung ess-erinnerung ein und ausgeschaltet
         werden und eigene dauer»: this tour's eat reminder (trip.eat), the card on Unterwegs starts with it -->
    {@const eat = tripEat(trip)}
    <div class="part" data-plan-eat>
      <span class="lbl">{t('Eat reminder')}</span>
      <label class="tp-small"><input type="checkbox" role="switch" checked={eat.on} onchange={(ev) => { const on = ev.currentTarget.checked; onchange(() => ({ eat: { ...eat, on } })); }} data-plan-eat-on /> {t('Show the eat reminder on the way')}</label>
      {#if eat.on}<EatEvery value={eat.every} onpick={(n) => onchange(() => ({ eat: { ...eat, every: n } }))} />{/if}
      <p class="hint">{t('It only starts when you tap «Start eat reminder» on the way.')}</p>
    </div>
  {/if}
  {#if isMountain(trip)}
    <!-- Paket J (Noah 19.10.2026 «1a und b», «2a», «3a»): every ski tour and mountain tour -->
    <div class="part" data-mountain>
      <SnowBox {trip} save={(f) => db.trips.update(trip.id, f)} />
      <p class="acts">
        <a class="btn sm" href="#/mountain/map?trip={encodeURIComponent(trip.id)}" data-to="map"><MapIcon size={16} aria-hidden="true" />{t('Map with steep slopes')}</a>
        <a class="btn sm" href="#/mountain/sos" data-to="sos"><Siren size={16} aria-hidden="true" />{t('Emergency')}</a>
      </p>
    </div>
  {/if}
  <div class="part">
    <span class="lbl">{t('Getting there and staying')}</span>
    <TravelLinks {trip} {onchange} />
    {#if !trip.place}<p class="hint">{t('With a start place, links for staying and getting there show here.')}</p>{/if}
  </div>
</div>

<style>
  .rw {
    display: grid;
    gap: 12px;
    margin: 0 0 12px;
  }
  .part {
    display: grid;
    gap: 6px;
    justify-items: start;
  }
  .facts,
  .acts,
  .hint,
  .warn {
    margin: 0;
  }
  .facts {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
    align-items: baseline;
  }
  .facts .num {
    color: var(--ink-2);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 12px;
    align-items: center;
  }
  .hint {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .warn {
    font-size: var(--fs-small);
    color: var(--ink);
  }
  .ok {
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .find {
    display: flex;
    gap: 6px;
    align-items: center;
    width: 100%;
  }
  .find .inp {
    flex: 1;
    min-width: 0;
  }
  .found {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 4px;
  }
  .found small {
    color: var(--ink-3);
  }
  .days {
    list-style: none;
    margin: 0;
    padding: 0;
    width: 100%;
  }
  .days li {
    display: grid;
    grid-template-columns: 64px auto 1fr;
    gap: 10px;
    padding: 3px 0;
    border-bottom: 1px solid var(--paper-2);
    font-size: var(--fs-small);
  }
  .days .rain {
    justify-self: end;
    color: var(--ink-3);
  }
  .link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    text-decoration: underline;
    cursor: pointer;
  }
  .link:disabled {
    color: var(--ink-3);
    cursor: default;
  }
  .acts .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
</style>
