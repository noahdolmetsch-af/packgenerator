<script>
  /**
   * Route and weather of a trip (Noah, 4.10.2026, answers 4a, 5a, 12b):
   * - a GPX route gives distance, climbing, a guess of the riding hours and the start place;
   * - the start place is typed in by hand (or taken from the route);
   * - the forecast comes from Open-Meteo when online; offline the last saved one shows.
   * Nothing changes the packing weather until you press "Use".
   *
   * onchange(fn): fn gets a plain copy of the trip and returns the fields to store.
   */
  import { parseGpx, routeStats, ridingHours, SPEED_KMH, CLIMB_MH } from '../route.js';
  import { searchPlace, fetchForecast, forecastForTrip, toWx, forecastFrom, ageText, tripDays } from '../weather.js';
  import { RAIN } from '../trips.js';

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
  const hours = $derived(ridingHours(trip.route, trip.days));
  async function pickGpx(event) {
    const file = event.currentTarget.files[0];
    event.currentTarget.value = '';
    if (!file) return;
    try {
      const route = routeStats(parseGpx(await file.text()), file.name);
      routeMsg = '';
      // The route start becomes the weather place when there is none yet.
      onchange((t) => ({ route, ...(t.place ? {} : { place: { name: route.name ? `Start of ${route.name}` : 'Route start', ...route.start } }) }));
    } catch (err) {
      routeMsg = err.message || 'This file could not be read.';
    }
  }
  const dropRoute = () => confirm('Remove the route from this trip?') && onchange(() => ({ route: null }));

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
      if (!found.length) placeMsg = 'No place found. Try another spelling.';
    } catch {
      placeMsg = 'No connection. Place search needs the internet.';
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
  const today = new Date().toISOString().slice(0, 10);
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
      onchange(() => ({ forecast }));
    } catch {
      wxMsg = online ? 'The forecast could not be loaded. Try again later.' : 'Offline: showing the last saved forecast.';
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
  const useWx = () => onchange((t) => ({ wx: { ...(t.wx ?? {}), ...suggested } }));

  const day = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
  const longDay = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
</script>

<div class="rw">
  <div class="part">
    <span class="lbl">Route</span>
    {#if trip.route}
      <p class="facts"><b>{trip.route.name || 'Route'}</b> <span class="num">{trip.route.km.toLocaleString('en')} km · ↑ {trip.route.gainM.toLocaleString('en')} m</span></p>
      <p class="acts">
        {#if hours != null}
          {#if trip.hours === hours}<span class="ok">Riding hours: about {hours} h{trip.days > 1 ? ' a day' : ''}</span>
          {:else}<button type="button" class="btn sm" onclick={() => onchange(() => ({ hours }))}>Use about {hours} h{trip.days > 1 ? ' a day' : ''} as riding hours</button>{/if}
        {/if}
        <label class="link">Other GPX<input type="file" accept=".gpx,application/gpx+xml" onchange={pickGpx} hidden /></label>
        <button type="button" class="link" onclick={dropRoute}>Remove</button>
      </p>
      {#if hours != null}<p class="hint">Guess with luggage: {SPEED_KMH} km/h plus 1 h per {CLIMB_MH} m climbing.</p>{/if}
    {:else}
      <label class="btn sm">Add GPX route<input type="file" accept=".gpx,application/gpx+xml" onchange={pickGpx} hidden /></label>
      <p class="hint">From Komoot, Garmin or Strava: distance, climbing and a guess of the riding hours.</p>
    {/if}
    {#if routeMsg}<p class="warn" role="alert">{routeMsg}</p>{/if}
  </div>

  <div class="part">
    <span class="lbl">Forecast</span>
    {#if trip.place && !editPlace}
      <p class="facts"><b>{trip.place.name}</b> <button type="button" class="link" onclick={() => (editPlace = true)}>Change place</button></p>
    {:else}
      <form class="find" onsubmit={search}>
        <input class="inp" bind:value={q} placeholder="Start place, e.g. Delémont" aria-label="Start place of the trip" />
        <button type="submit" class="btn sm" disabled={searching || q.trim().length < 2}>Find</button>
        {#if editPlace}<button type="button" class="link" onclick={() => ((editPlace = false), (found = []))}>Cancel</button>{/if}
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
            <li><span>{day(d.date)}</span><b class="num">{Math.round(d.min)}–{Math.round(d.max)} °C</b><span class="num rain">{d.rainMm ? `${d.rainMm} mm` : 'dry'}{d.rainPct != null ? ` · ${d.rainPct} %` : ''}</span></li>
          {/each}
        </ul>
        <p class="acts">
          {#if same}<span class="ok">Packing for this forecast</span>
          {:else}<button type="button" class="btn sm hi" onclick={useWx}>Pack for {suggested.min}–{suggested.max} °C, {RAIN[suggested.rain]}</button>{/if}
          <button type="button" class="link" disabled={loading || !online} onclick={() => load()}>{loading ? 'Loading…' : 'Update'}</button>
        </p>
        <p class="hint">From Open-Meteo, {ageText(trip.forecast.fetchedAt)}{online ? '' : ' (offline)'}.</p>
      {:else if !trip.startDate}
        <p class="hint">Set a start date for the trip to get its forecast.</p>
      {:else if !reachable}
        <p class="hint">{from > today ? `The forecast reaches this trip from ${longDay(from)} (16 days ahead).` : 'This trip is over.'}</p>
      {:else}
        <p class="acts"><button type="button" class="btn sm" disabled={loading || !online} onclick={() => load()}>{loading ? 'Loading…' : 'Get forecast'}</button>{#if !online}<span class="hint">Needs the internet.</span>{/if}</p>
      {/if}
      {#if wxMsg}<p class="warn" role="alert">{wxMsg}</p>{/if}
    {/if}
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
    font-size: 13px;
    color: var(--ink-3);
  }
  .warn {
    font-size: 13px;
    color: var(--ink);
  }
  .ok {
    font-size: 14px;
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
    border-bottom: 1px solid var(--paper-2, #e6ebe3);
    font-size: 14px;
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
    font-size: 14px;
    text-decoration: underline;
    cursor: pointer;
  }
  .link:disabled {
    color: var(--ink-3);
    cursor: default;
  }
</style>
