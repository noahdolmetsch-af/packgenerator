<script>
  /**
   * Ride day (v0.18.0, answers 1a-8a): the screen for the day on the bike. Big text, readable in
   * the sun. What is in which bag (answer 2b: the list of all bags, no search), the day's stage with
   * its elevation profile (4a and 4b), the weather hour by hour at the start and the finish,
   * and notes that go into the debrief. Works offline with what was saved last.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { nextTrip } from '../lib/debrief.js';
  import { tripStats } from '../lib/trips.js';
  import { ageText, FORECAST_DAYS } from '../lib/weather.js';
  import Profile from '../lib/ui/Profile.svelte';
  import { paceOf, PACE_KEY } from '../lib/pace.js';
  import { blockPlan, DRINK_L_PER_H, HOT_C, HOT_EXTRA_L } from '../lib/blockplan.js';
  import { dayIndex, addTime, planHours, stage, stageCount, isNonstop, blocks, blockHours, dayProfile, placeName, fetchHourly, rideHours, wxSummary, addRideNote, DEFAULT_START } from '../lib/ride.js';

  const tripsQ = liveQuery(() => db.trips.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const bagsQ = liveQuery(() => db.containers.toArray());
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const debriefsQ = liveQuery(() => db.debriefs.toArray());
  // v0.19.0: your pace from your rides (Debrief → Your pace), else the standard guess.
  const paceQ = liveQuery(() => db.settings.get(PACE_KEY));
  const pace = $derived(paceOf($paceQ?.value));

  const today = new Date().toISOString().slice(0, 10);
  const trips = $derived($tripsQ ?? []);
  // The trip open in Pack on this device, else the next one.
  const chosen = (() => {
    try {
      return localStorage.getItem('pack.currentTrip');
    } catch {
      return null;
    }
  })();
  const trip = $derived(trips.find((t) => t.id === chosen && t.startDate) ?? nextTrip(trips, today) ?? trips.find((t) => t.id === chosen) ?? null);
  const items = $derived($itemsQ ?? []);
  const itemsById = $derived(Object.fromEntries(items.map((i) => [i.id, i])));
  const bike = $derived(trip ? ($bikesQ ?? []).find((b) => b.id === trip.bikeId) ?? null : null);
  const stats = $derived(trip ? tripStats(trip, items, $bagsQ ?? [], bike, 0) : null);
  const days = $derived(stageCount(trip));
  const nonstop = $derived(isNonstop(trip));

  let day = $state(null); // null: the day of today
  const cur = $derived(Math.min(days - 1, day ?? (trip ? dayIndex(trip, today) : 0)));
  const st = $derived(trip ? stage(trip, cur, pace) : null);
  const dayLabel = (n) => {
    if (!trip?.startDate) return `Day ${n + 1}`;
    const d = new Date(`${trip.startDate}T00:00:00`);
    d.setDate(d.getDate() + n);
    return `Day ${n + 1} · ${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'numeric' })}`;
  };

  async function change(fields) {
    await db.trips.update(trip.id, fields);
  }
  function setStart(value) {
    const rideStart = { ...($state.snapshot(trip.rideStart) ?? {}), [cur]: value || DEFAULT_START };
    change({ rideStart });
  }

  /* ---------- what is where (answer 2b) ---------- */
  const phoneSize = typeof matchMedia === 'function' && matchMedia('(max-width: 639px)').matches;
  const bags = $derived(stats ? stats.zones.filter((z) => z.entries.length) : []);

  /* ---------- weather ---------- */
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
  const prof = $derived(trip ? dayProfile(trip.route, cur, days) : null);
  const saved = $derived(st?.date ? trip?.rideWx?.[st.date] ?? null : null);
  const tooEarly = $derived(st?.date ? (new Date(`${st.date}T00:00:00`) - new Date(`${today}T00:00:00`)) / 864e5 >= FORECAST_DAYS : false);
  const wxPlaces = $derived.by(() => {
    if (!st) return [];
    const out = [];
    const from = st.from ?? trip.place;
    if (from) out.push({ name: cur === 0 && trip.place?.name ? trip.place.name : 'Start of the day', lat: from.lat, lon: from.lon });
    if (st.to) out.push({ name: cur === days - 1 ? 'Finish' : 'End of the day', lat: st.to.lat, lon: st.to.lon });
    return out;
  });
  let wxBusy = $state(false);
  let wxMsg = $state('');
  async function loadWx() {
    wxBusy = true;
    wxMsg = '';
    try {
      const wx = await fetchHourly(wxPlaces, st.date, fetch, new Date(), st.endAt ? st.endAt.slice(0, 10) : st.date);
      const rideWx = { ...($state.snapshot(trip.rideWx) ?? {}), [st.date]: wx };
      await change({ rideWx });
    } catch {
      wxMsg = online ? 'The forecast could not be loaded. Try again later.' : 'No connection. The weather needs the internet; the last saved one stays.';
    }
    wxBusy = false;
  }
  // Answer 5a: fetch once when the page opens online and nothing (or something old) is saved.
  let autoFor = null;
  $effect(() => {
    if (!st?.date || !wxPlaces.length || !online || tooEarly || wxBusy) return;
    const key = `${trip.id}:${st.date}`;
    if (autoFor === key) return;
    const old = !saved || Date.now() - new Date(saved.fetchedAt) > 3 * 36e5;
    if (!old) return;
    autoFor = key;
    loadWx();
  });
  // v0.19.5 (answer 4b): blocks on every ride, not only nonstop. The time plan from the logbook
  // only counts for a nonstop ride; a day stage gets blocks of 3 hours.
  const plan = $derived(st?.km && st.hours ? blocks(nonstop ? trip : { ...trip, plan: null }, st) : []);
  // The weather of a block: from the start place in the first half, from the finish after.
  const blockHrs = (b) => {
    const places = saved?.places ?? [];
    const p = places.length > 1 && (b.kmFrom + b.kmTo) / 2 > st.km / 2 ? places[1] : places[0];
    return p ? blockHours(p.hours, b) : [];
  };
  // Per block: clothing, food and drink, light (answer 4b).
  const onTrip = $derived(stats ? stats.zones.flatMap((z) => z.entries.filter((e) => itemsById[e.itemId]).map((e) => ({ item: itemsById[e.itemId], qty: e.qty || 1, place: placeName(trip, z) }))) : []);
  const bp = $derived(plan.length ? blockPlan(plan, onTrip, { wxOf: blockHrs, place: st.from ?? trip.place ?? null, tripWx: trip.wx ?? null }) : null);
  const names = (list) => list.map((w) => `${w.name} (${w.place})`).join(', ');
  const setNonstop = (on) => change({ nonstop: on, rideStart: {} });
  const dayName = (t) => new Date(`${t.slice(0, 10)}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short' });
  const dir = (pct) => (pct == null ? '' : `${Math.round(pct)} %`);

  /* ---------- notes for the debrief ---------- */
  const debrief = $derived(trip ? ($debriefsQ ?? []).find((d) => d.tripId === trip.id) ?? null : null);
  const notes = $derived(debrief?.rideNotes ?? []);
  let note = $state('');
  let noteMsg = $state('');
  async function saveNote(ev) {
    ev.preventDefault();
    if (!note.trim()) return;
    await db.debriefs.put(addRideNote(debrief ? $state.snapshot(debrief) : null, $state.snapshot(trip), note, cur));
    note = '';
    noteMsg = 'Saved. It shows in the debrief.';
    setTimeout(() => (noteMsg = ''), 4000);
  }
  async function dropNote(n) {
    const d = $state.snapshot(debrief);
    d.rideNotes = d.rideNotes.filter((_, i) => i !== n);
    await db.debriefs.put(d);
  }
  const time = (iso) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  // Keep the screen on while the page is open (where the browser allows it).
  $effect(() => {
    let lock = null;
    const get = async () => {
      try {
        lock = await navigator.wakeLock?.request('screen');
      } catch {
        /* not allowed: the screen may go dark, nothing is lost */
      }
    };
    get();
    const again = () => document.visibilityState === 'visible' && get();
    document.addEventListener('visibilitychange', again);
    return () => {
      lock?.release?.();
      document.removeEventListener('visibilitychange', again);
    };
  });
</script>

<div class="ride">
  {#if !trip}
    {#if $tripsQ}<p class="card">No trip yet. Create one in <a href="#/pack">Pack</a>.</p>{/if}
  {:else}
    <header class="head">
      <span class="lbl">Ride day</span>
      <h1 class="title">{trip.title}</h1>
      {#if days > 1}
        <nav class="days" aria-label="Days">
          {#each Array.from({ length: days }, (_, n) => n) as n (n)}
            <button type="button" class:cur={n === cur} aria-current={n === cur ? 'true' : undefined} onclick={() => (day = n)}>{dayLabel(n)}</button>
          {/each}
        </nav>
      {:else if trip.startDate}
        <p class="sub">{dayLabel(0).replace('Day 1 · ', '')}</p>
      {/if}
    </header>

    <!-- Answer 4a: the day's stage. -->
    <section class="box" aria-labelledby="stage-h">
      <h2 id="stage-h" class="h">{nonstop ? 'Nonstop' : days > 1 ? `Stage ${cur + 1}` : 'Stage'}</h2>
      {#if st.km}
        <label class="ns"><input type="checkbox" checked={nonstop} onchange={(e) => setNonstop(e.currentTarget.checked)} /> Nonstop: one stage through the night</label>
      {/if}
      {#if st.km}
        <div class="nums">
          <div><b class="num">{st.km}</b><span>km</span></div>
          <div><b class="num">{st.gainM ?? '–'}</b><span>m up</span></div>
          <div><b class="num">{st.hours}</b><span>h riding</span></div>
        </div>
        <div class="times">
          <label>Start <input class="inp" type="time" value={st.start} onchange={(e) => setStart(e.currentTarget.value)} /></label>
          <p>Arrive about <b class="num">{st.arrive}</b> <small>without breaks{pace.mine ? ', at your pace' : ''}</small></p>
          {#if pace.stops && st.hours}<p>With your usual stops <b class="num">{addTime(st.start, st.hours * pace.stops)}</b></p>{/if}
        </div>
        {#if prof}<div class="prof"><Profile points={prof.points} from={days > 1 ? prof.from : null} to={prof.to} label={days > 1 ? `Elevation, stage ${cur + 1} dark` : 'Elevation'} /></div>
        {:else}<p class="muted small">Load the GPX again in Pack to see the elevation profile.</p>{/if}
        {#if days > 1 && !nonstop}<p class="muted small">The route is shared out evenly over {days} days{prof ? ' (dark: this stage)' : ''}.</p>{/if}
      {:else}
        <p class="muted">No route yet. Load the GPX in <a href="#/pack">Pack</a> under "Ride and weather".</p>
      {/if}
    </section>

    <!-- v0.19.5 (answer 4b): every block with clothing, food and drink, light, all at once. -->
    {#if bp}
      <section class="box" aria-labelledby="blocks-h">
        <h2 id="blocks-h" class="h">Block by block</h2>
        <ol class="blocks">
          {#each bp.rows as b, n (b.startAt)}
            <li class:rest={b.rest}>
              <span class="bt num">{dayName(b.startAt)} {b.from}–{b.to}</span>
              <b>{b.name}</b>
              <span class="bk num">{b.rest ? `stop at km ${b.kmTo}` : `km ${b.kmFrom}–${b.kmTo}`}</span>
              {#if b.temp}<small class="bw">{b.temp.lo === b.temp.hi ? `${b.temp.lo} °C` : `${b.temp.lo}–${b.temp.hi} °C`} · {b.wet ? 'rain likely' : 'dry'}{b.wxFrom === 'trip' ? ' (trip weather, no hourly forecast yet)' : ''}</small>{/if}
              {#if b.note}<small class="bn">{b.note}</small>{/if}
              {#if !b.rest}
                <dl class="bp">
                  <dt>Wear</dt>
                  <dd>
                    {#if n === 0 || b.on.length || b.off.length}
                      {#if n === 0}{b.wear.length ? `Start with ${names(b.wear)}` : 'Every-ride clothes'}{:else}
                        {#if b.on.length}<span class="on">On: {names(b.on)}</span>{/if}
                        {#if b.off.length}<span class="off">Off: {names(b.off)}</span>{/if}
                      {/if}
                    {:else}<span class="muted">No change</span>{/if}
                  </dd>
                  <dt>Eat, drink</dt>
                  <dd>
                    {[...b.food.map((f) => `${f.n} × ${f.name}`), `about ${b.drinkL} L to drink`].join(' · ')}
                    {#if b.refillKm.length}<span class="on">Refill at km {b.refillKm.join(', ')}</span>{/if}
                    {#if b.food.some((f) => f.short)}<span class="warn">Not enough on the bike: from here on, buy {b.food.filter((f) => f.short).map((f) => `${f.short} × ${f.name}`).join(', ')} on the way</span>{/if}
                  </dd>
                  {#if b.light}
                    <dt>Light</dt>
                    <dd class:warn={!bp.lights.length}>
                      {b.light.kind === 'on' ? `On from about ${b.light.at} (km ${b.light.km})` : b.light.kind === 'off' ? `On until about ${b.light.at} (km ${b.light.km})` : 'Dark the whole block'}{!bp.lights.length ? ' · no light on this trip' : n === 0 || b.light.kind === 'on' ? ` · ${names(bp.lights)}` : ''}
                    </dd>
                  {/if}
                </dl>
              {/if}
            </li>
          {/each}
        </ol>
        <p class="muted small">{nonstop && trip.plan?.schedule?.length ? 'Your time plan from the logbook.' : 'Blocks of 3 hours.'} km at {Math.round((st.km / st.hours) * 10) / 10} km/h, the same guess as the riding time{pace.mine ? ` (your pace from ${pace.n} rides)` : ''}. Drinking {DRINK_L_PER_H} L per hour ({DRINK_L_PER_H + HOT_EXTRA_L} L from {HOT_C} °C) is a guess{bp.capL ? `; your bottles hold ${Math.round(bp.capL * 10) / 10} L` : '; no bottle on this trip'}. Sunset and sunrise are computed for the start of the day.{saved ? '' : ' Load the forecast below for the weather per block.'}</p>
        {#if nonstop && planHours(trip) > st.hours + 1}<p class="small warn">Your time plan has {Math.round(planHours(trip))} h of riding, the route about {st.hours} h. The plan ends where the route ends; is the GPX the whole route?</p>{/if}
      </section>
    {/if}

    <!-- Answer 3a: the weather hour by hour, start and finish. Answer 5a: saved for offline. -->
    <section class="box" aria-labelledby="wx-h">
      <h2 id="wx-h" class="h">Weather</h2>
      {#if !wxPlaces.length}
        <p class="muted">No place yet. Add the start place or the GPX in <a href="#/pack">Pack</a>.</p>
      {:else if tooEarly && !saved}
        <p class="muted">The hourly forecast comes 16 days before the day.</p>
      {:else}
        {#if saved}
          <div class="wx">
            {#each saved.places as p (p.name)}
              {@const hrs = rideHours(p.hours, st.startAt, st.endAt)}
              <div class="wxp">
                <h3>{p.name}</h3>
                <p class="sum">{wxSummary(hrs)}</p>
                <details class="hrs" open={!phoneSize}>
                  <summary>Hour by hour</summary>
                <table>
                  <thead><tr><th>h</th><th>°C</th><th>Rain</th><th>Wind</th></tr></thead>
                  <tbody>
                    {#each hrs as x (x.h)}
                      <tr class:wet={(x.rainMm ?? 0) >= 0.5 || (x.rainPct ?? 0) >= 50} class:newday={x.h === 0}><td class="num">{x.h === 0 || x === hrs[0] ? `${dayName(x.t)} ` : ''}{x.h}</td><td class="num">{x.temp != null ? Math.round(x.temp) : '–'}</td><td class="num">{x.rainMm ? `${x.rainMm} mm` : ''} <small>{dir(x.rainPct)}</small></td><td class="num">{x.wind != null ? Math.round(x.wind) : '–'}{#if x.gust != null && x.gust >= 30}<small> ({Math.round(x.gust)})</small>{/if}</td></tr>
                    {/each}
                  </tbody>
                </table>
                </details>
              </div>
            {/each}
          </div>
        {/if}
        <p class="wxbar">
          {#if saved}<span class="muted">Loaded {ageText(saved.fetchedAt)}{online ? '' : ' · offline'}</span>{/if}
          <button type="button" class="btn sm" disabled={wxBusy || !online} onclick={loadWx}>{wxBusy ? 'Loading …' : saved ? 'Update' : 'Load the forecast'}</button>
        </p>
        {#if wxMsg}<p class="warn" role="status">{wxMsg}</p>{/if}
      {/if}
    </section>

    <!-- Answer 7a: a note for the debrief. -->
    <section class="box" aria-labelledby="note-h">
      <h2 id="note-h" class="h">Note for the debrief</h2>
      <form class="noteform" onsubmit={saveNote}>
        <textarea class="inp big" rows="2" bind:value={note} placeholder="e.g. Puncture at km 80, the rain gloves were too thin"></textarea>
        <button type="submit" class="btn hi" disabled={!note.trim()}>Save note</button>
      </form>
      {#if noteMsg}<p class="ok" role="status">{noteMsg}</p>{/if}
      {#if notes.length}
        <ul class="notes">
          {#each notes as n, i (n.at)}
            <li><small class="num">{days > 1 ? `Day ${n.day + 1} · ` : ''}{time(n.at)}</small><span>{n.text}</span><button type="button" class="link" onclick={() => dropNote(i)} aria-label="Remove this note">Remove</button></li>
          {/each}
        </ul>
      {/if}
    </section>

    <!-- Answer 2b: every bag with what is in it. On a phone each bag folds (tap to open). -->
    <section class="box" aria-labelledby="where-h">
      <h2 id="where-h" class="h">What is where</h2>
      <div class="bags">
        {#each bags as z (z.key)}
          <details class="bag" open={!phoneSize}>
            <summary><b>{placeName(trip, z)}</b><span class="num">{z.entries.length}</span></summary>
            <ul>{#each z.entries as e (e.itemId)}<li>{itemsById[e.itemId]?.name ?? e.itemId}{#if (e.qty || 1) > 1}<small> × {e.qty}</small>{/if}</li>{/each}</ul>
          </details>
        {/each}
      </div>
    </section>

    <p class="back"><a class="btn" href="#/pack">Back to Pack</a></p>
  {/if}
</div>

<style>
  .ride {
    display: grid;
    gap: 14px;
    max-width: 760px;
    margin: 0 auto;
    font-size: 18px;
  }
  .head .lbl {
    font: 700 13px var(--font-body);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  .head h1 {
    margin: 2px 0 8px;
    font-size: clamp(34px, 10vw, 56px);
    line-height: 1;
    overflow-wrap: anywhere;
  }
  .sub {
    margin: 0;
    color: var(--ink-2);
  }
  .days {
    display: flex;
    gap: 6px;
    overflow-x: auto;
  }
  .days button {
    flex: none;
    min-height: 44px;
    padding: 6px 12px;
    border: 1.5px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink-2);
    font: 600 15px var(--font-body);
    cursor: pointer;
  }
  .days button.cur {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .box {
    padding: 14px 16px;
    border: 1.5px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    min-width: 0;
  }
  .h {
    margin: 0 0 10px;
    font: 800 26px var(--font-title);
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }
  .inp.big {
    width: 100%;
    min-height: 52px;
    font-size: 19px;
  }
  .bags {
    display: grid;
    gap: 10px;
  }
  @media (min-width: 640px) {
    .bags {
      grid-template-columns: 1fr 1fr;
    }
  }
  .bag {
    padding: 8px 12px;
    border-radius: 8px;
    background: var(--paper-2);
    min-width: 0;
  }
  .bag summary {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    min-height: 40px;
    align-items: center;
    cursor: pointer;
    font: 800 22px var(--font-title);
    text-transform: uppercase;
  }
  .bag summary .num {
    color: var(--ink-3);
  }
  .bag ul {
    margin: 0 0 6px;
    padding-left: 20px;
    font-size: 17px;
    overflow-wrap: anywhere;
  }
  .prof {
    margin-top: 12px;
  }
  .nums {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .nums div {
    display: flex;
    flex-direction: column;
  }
  .nums b {
    font: 900 40px/1 var(--font-title);
  }
  .nums span {
    color: var(--ink-3);
    font-size: 15px;
  }
  .times {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 20px;
    margin-top: 12px;
  }
  .times label {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .times input {
    min-height: 44px;
    font-size: 18px;
  }
  .times p {
    margin: 0;
  }
  .times small,
  .small {
    color: var(--ink-3);
    font-size: 14px;
  }
  .wx {
    display: grid;
    gap: 14px;
  }
  @media (min-width: 640px) {
    .wx {
      grid-template-columns: 1fr 1fr;
    }
  }
  .wxp {
    min-width: 0;
  }
  .wxp h3 {
    margin: 0;
    font-size: 18px;
  }
  .sum {
    margin: 2px 0 6px;
    font-weight: 600;
  }
  .hrs summary {
    min-height: 40px;
    display: flex;
    align-items: center;
    color: var(--ink-2);
    cursor: pointer;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 16px;
  }
  th {
    text-align: left;
    font-size: 13px;
    color: var(--ink-3);
    font-weight: 600;
  }
  td,
  th {
    padding: 3px 4px;
    border-bottom: 1px solid var(--paper-2);
  }
  tr.wet td {
    background: #e3eef8;
  }
  td small {
    color: var(--ink-3);
  }
  .wxbar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    align-items: center;
    justify-content: space-between;
    margin: 10px 0 0;
  }
  .ns {
    display: flex;
    gap: 8px;
    align-items: center;
    min-height: 44px;
    margin-bottom: 6px;
  }
  .ns input {
    width: 22px;
    height: 22px;
  }
  .blocks {
    list-style: none;
    padding: 0;
    margin: 14px 0 6px;
    display: grid;
    gap: 6px;
  }
  .blocks li {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 12px;
    align-items: baseline;
    padding: 8px 10px;
    border-radius: 8px;
    background: var(--paper-2);
  }
  .blocks li.rest {
    background: transparent;
    border: 1.5px dashed var(--line);
  }
  .blocks .bt {
    flex: 0 0 auto;
    color: var(--ink-2);
    font-size: 15px;
  }
  .blocks .bk {
    margin-left: auto;
    font-weight: 600;
  }
  .bp {
    flex-basis: 100%;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 2px 10px;
    margin: 4px 0 0;
    font-size: 16px;
  }
  .bp dt {
    color: var(--ink-3);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding-top: 2px;
  }
  .bp dd {
    margin: 0;
    overflow-wrap: anywhere;
  }
  .bp .on,
  .bp .off,
  .bp .warn {
    display: block;
  }
  .bp .off {
    color: var(--ink-2);
  }
  .blocks .bw,
  .blocks .bn {
    flex-basis: 100%;
    color: var(--ink-3);
    font-size: 14px;
  }
  tr.newday td {
    border-top: 2px solid var(--ink-3);
  }
  .noteform {
    display: grid;
    gap: 8px;
  }
  .noteform .btn {
    min-height: 48px;
    justify-self: start;
  }
  .notes {
    list-style: none;
    padding: 0;
    margin: 10px 0 0;
    display: grid;
    gap: 6px;
  }
  .notes li {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 10px;
    align-items: baseline;
    font-size: 17px;
  }
  .notes li span {
    flex: 1 1 60%;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .notes small {
    color: var(--ink-3);
  }
  .muted {
    color: var(--ink-3);
  }
  .warn {
    color: #a03a00;
  }
  .ok {
    color: var(--ink-2);
    font-weight: 600;
  }
  .back {
    margin: 0 0 24px;
  }
</style>
