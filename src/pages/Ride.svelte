<script>
  /**
   * Ride day (v0.18.0, answers 1a-8a): the screen for the day on the bike. Big text, readable in
   * the sun. What is in which bag (answer 2b: the list of all bags, no search), the day's stage with
   * its elevation profile (4a and 4b), the weather hour by hour at the start and the finish,
   * and notes that go into the debrief. Works offline with what was saved last.
   */
  import { liveQuery } from 'dexie';
  import { t, tn, num, locale, nameOf } from '../lib/i18n.svelte.js';
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
    if (!trip?.startDate) return t('Day {n}', { n: n + 1 });
    return t('Day {n} · {date}', { n: n + 1, date: dateOf(n) });
  };
  const dateOf = (n) => {
    const d = new Date(`${trip.startDate}T00:00:00`);
    d.setDate(d.getDate() + n);
    return d.toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'numeric' });
  };

  async function change(fields) {
    await db.trips.update(trip.id, fields);
  }
  // v0.20.1: end the trip now (also before its last day) and go straight to its debrief.
  async function finish() {
    await change({ finished: new Date().toISOString().slice(0, 10) });
    location.hash = `#/debrief/${encodeURIComponent(trip.id)}`;
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
      wxMsg = online ? t('The forecast could not be loaded. Try again later.') : t('No connection. The weather needs the internet; the last saved one stays.');
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
  const dayName = (t) => new Date(`${t.slice(0, 10)}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short' });
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
    noteMsg = t('Saved. It shows in the debrief.');
    setTimeout(() => (noteMsg = ''), 4000);
  }
  async function dropNote(n) {
    const d = $state.snapshot(debrief);
    d.rideNotes = d.rideNotes.filter((_, i) => i !== n);
    await db.debriefs.put(d);
  }
  const time = (iso) => new Date(iso).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });

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
    {#if $tripsQ}<p class="card">{t('No trip yet. Create one in')} <a href="#/pack">{t('Pack')}</a>.</p>{/if}
  {:else}
    <header class="head">
      <span class="lbl">{t('Ride day')}</span>
      <h1 class="title">{trip.title}</h1>
      {#if days > 1}
        <nav class="days" aria-label={t('Days')}>
          {#each Array.from({ length: days }, (_, n) => n) as n (n)}
            <button type="button" class:cur={n === cur} aria-current={n === cur ? 'true' : undefined} onclick={() => (day = n)}>{dayLabel(n)}</button>
          {/each}
        </nav>
      {:else if trip.startDate}
        <p class="sub">{dateOf(0)}</p>
      {/if}
    </header>

    <!-- v0.20.2: the next step, big, on the last day of the trip. -->
    {#if cur === days - 1}
      <button type="button" class="btn hi go" onclick={finish}><b>{trip.finished ? t('Open the debrief') : t('Next: end trip and debrief')}</b><small>{t('When you are back home.')}</small></button>
    {/if}

    <!-- Answer 4a: the day's stage. -->
    <section class="box" aria-labelledby="stage-h">
      <h2 id="stage-h" class="h">{nonstop ? t('Nonstop') : days > 1 ? t('Stage {n}', { n: cur + 1 }) : t('Stage')}</h2>
      {#if st.km}
        <label class="ns"><input type="checkbox" checked={nonstop} onchange={(e) => setNonstop(e.currentTarget.checked)} /> {t('Nonstop: one stage through the night')}</label>
      {/if}
      {#if st.km}
        <div class="nums">
          <div><b class="num">{num(st.km)}</b><span>km</span></div>
          <div><b class="num">{st.gainM ?? '–'}</b><span>{t('m up')}</span></div>
          <div><b class="num">{st.hours}</b><span>{t('h riding')}</span></div>
        </div>
        <div class="times">
          <label>{t('Start')} <input class="inp" type="time" value={st.start} onchange={(e) => setStart(e.currentTarget.value)} /></label>
          <p>{t('Arrive about')} <b class="num">{st.arrive}</b> <small>{pace.mine ? t('without breaks, at your pace') : t('without breaks')}</small></p>
          {#if pace.stops && st.hours}<p>{t('With your usual stops')} <b class="num">{addTime(st.start, st.hours * pace.stops)}</b></p>{/if}
        </div>
        {#if prof}<div class="prof"><Profile points={prof.points} from={days > 1 ? prof.from : null} to={prof.to} label={days > 1 ? t('Elevation, stage {n} dark', { n: cur + 1 }) : t('Elevation')} /></div>
        {:else}<p class="muted small">{t('Load the GPX again in Pack to see the elevation profile.')}</p>{/if}
        {#if days > 1 && !nonstop}<p class="muted small">{prof ? t('The route is shared out evenly over {n} days (dark: this stage).', { n: days }) : t('The route is shared out evenly over {n} days.', { n: days })}</p>{/if}
      {:else}
        <p class="muted">{t('No route yet. Load the GPX in')} <a href="#/pack">{t('Pack')}</a> {t('under "Ride and weather".')}</p>
      {/if}
    </section>

    <!-- v0.19.5 (answer 4b): every block with clothing, food and drink, light, all at once. -->
    {#if bp}
      <section class="box" aria-labelledby="blocks-h">
        <h2 id="blocks-h" class="h">{t('Block by block')}</h2>
        <ol class="blocks">
          {#each bp.rows as b, n (b.startAt)}
            <li class:rest={b.rest}>
              <span class="bt num">{dayName(b.startAt)} {b.from}–{b.to}</span>
              <b>{b.name}</b>
              <span class="bk num">{b.rest ? t('stop at km {km}', { km: b.kmTo }) : `km ${b.kmFrom}–${b.kmTo}`}</span>
              {#if b.temp}<small class="bw">{b.temp.lo === b.temp.hi ? `${b.temp.lo} °C` : `${b.temp.lo}–${b.temp.hi} °C`} · {b.wet ? t('rain likely') : t('dry')}{b.wxFrom === 'trip' ? ` ${t('(trip weather, no hourly forecast yet)')}` : ''}</small>{/if}
              {#if b.note}<small class="bn">{b.note}</small>{/if}
              {#if !b.rest}
                <dl class="bp">
                  <dt>{t('Wear')}</dt>
                  <dd>
                    {#if n === 0 || b.on.length || b.off.length}
                      {#if n === 0}{b.wear.length ? t('Start with {list}', { list: names(b.wear) }) : t('Every-ride clothes')}{:else}
                        {#if b.on.length}<span class="on">{t('On: {list}', { list: names(b.on) })}</span>{/if}
                        {#if b.off.length}<span class="off">{t('Off: {list}', { list: names(b.off) })}</span>{/if}
                      {/if}
                    {:else}<span class="muted">{t('No change')}</span>{/if}
                  </dd>
                  <dt>{t('Eat, drink')}</dt>
                  <dd>
                    {[...b.food.map((f) => `${f.n} × ${f.name}`), t('about {n} L to drink', { n: b.drinkL })].join(' · ')}
                    {#if b.refillKm.length}<span class="on">{t('Refill at km {list}', { list: b.refillKm.join(', ') })}</span>{/if}
                    {#if b.food.some((f) => f.short)}<span class="warn">{t('Not enough on the bike: from here on, buy {list} on the way', { list: b.food.filter((f) => f.short).map((f) => `${f.short} × ${f.name}`).join(', ') })}</span>{/if}
                  </dd>
                  {#if b.light}
                    <dt>{t('Light')}</dt>
                    <dd class:warn={!bp.lights.length}>
                      {b.light.kind === 'on' ? t('On from about {time} (km {km})', { time: b.light.at, km: b.light.km }) : b.light.kind === 'off' ? t('On until about {time} (km {km})', { time: b.light.at, km: b.light.km }) : t('Dark the whole block')}{!bp.lights.length ? ` · ${t('no light on this trip')}` : n === 0 || b.light.kind === 'on' ? ` · ${names(bp.lights)}` : ''}
                    </dd>
                  {/if}
                </dl>
              {/if}
            </li>
          {/each}
        </ol>
        <p class="muted small">{nonstop && trip.plan?.schedule?.length ? t('Your time plan from the logbook.') : t('Blocks of 3 hours.')} {t('km at {kmh} km/h, the same guess as the riding time', { kmh: Math.round((st.km / st.hours) * 10) / 10 })}{pace.mine ? ` ${tn(pace.n, '(your pace from {n} ride)', '(your pace from {n} rides)')}` : ''}. {t('Drinking {l} L per hour ({hot} L from {c} °C) is a guess', { l: DRINK_L_PER_H, hot: DRINK_L_PER_H + HOT_EXTRA_L, c: HOT_C })}{bp.capL ? t('; your bottles hold {n} L', { n: Math.round(bp.capL * 10) / 10 }) : t('; no bottle on this trip')}. {t('Sunset and sunrise are computed for the start of the day.')}{saved ? '' : ` ${t('Load the forecast below for the weather per block.')}`}</p>
        {#if nonstop && planHours(trip) > st.hours + 1}<p class="small warn">{t('Your time plan has {plan} h of riding, the route about {route} h. The plan ends where the route ends; is the GPX the whole route?', { plan: Math.round(planHours(trip)), route: st.hours })}</p>{/if}
      </section>
    {/if}

    <!-- Answer 3a: the weather hour by hour, start and finish. Answer 5a: saved for offline. -->
    <section class="box" aria-labelledby="wx-h">
      <h2 id="wx-h" class="h">{t('Weather')}</h2>
      {#if !wxPlaces.length}
        <p class="muted">{t('No place yet. Add the start place or the GPX in')} <a href="#/pack">{t('Pack')}</a>.</p>
      {:else if tooEarly && !saved}
        <p class="muted">{t('The hourly forecast comes {n} days before the day.', { n: FORECAST_DAYS })}</p>
      {:else}
        {#if saved}
          <div class="wx">
            {#each saved.places as p (p.name)}
              {@const hrs = rideHours(p.hours, st.startAt, st.endAt)}
              <div class="wxp">
                <h3>{t(p.name)}</h3>
                <p class="sum">{wxSummary(hrs)}</p>
                <details class="hrs" open={!phoneSize}>
                  <summary>{t('Hour by hour')}</summary>
                <table>
                  <thead><tr><th>h</th><th>°C</th><th>{t('Rain')}</th><th>{t('Wind')}</th></tr></thead>
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
          {#if saved}<span class="muted">{t('Loaded {ago}', { ago: ageText(saved.fetchedAt) })}{online ? '' : ` · ${t('offline')}`}</span>{/if}
          <button type="button" class="btn sm" disabled={wxBusy || !online} onclick={loadWx}>{wxBusy ? t('Loading …') : saved ? t('Update') : t('Load the forecast')}</button>
        </p>
        {#if wxMsg}<p class="warn" role="status">{wxMsg}</p>{/if}
      {/if}
    </section>

    <!-- Answer 7a: a note for the debrief. -->
    <section class="box" aria-labelledby="note-h">
      <h2 id="note-h" class="h">{t('Note for the debrief')}</h2>
      <form class="noteform" onsubmit={saveNote}>
        <textarea class="inp big" rows="2" bind:value={note} placeholder={t('e.g. Puncture at km 80, the rain gloves were too thin')}></textarea>
        <button type="submit" class="btn hi" disabled={!note.trim()}>{t('Save note')}</button>
      </form>
      {#if noteMsg}<p class="ok" role="status">{noteMsg}</p>{/if}
      {#if notes.length}
        <ul class="notes">
          {#each notes as n, i (n.at)}
            <li><small class="num">{days > 1 ? `${t('Day {n}', { n: n.day + 1 })} · ` : ''}{time(n.at)}</small><span>{n.text}</span><button type="button" class="link" onclick={() => dropNote(i)} aria-label={t('Remove this note')}>{t('Remove')}</button></li>
          {/each}
        </ul>
      {/if}
    </section>

    <!-- Answer 2b: every bag with what is in it. On a phone each bag folds (tap to open). -->
    <section class="box" aria-labelledby="where-h">
      <h2 id="where-h" class="h">{t('What is where')}</h2>
      <div class="bags">
        {#each bags as z (z.key)}
          <details class="bag" open={!phoneSize}>
            <summary><b>{placeName(trip, z)}</b><span class="num">{z.entries.length}</span></summary>
            <ul>{#each z.entries as e (e.itemId)}<li>{itemsById[e.itemId] ? nameOf(itemsById[e.itemId]) : e.itemId}{#if (e.qty || 1) > 1}<small> × {e.qty}</small>{/if}</li>{/each}</ul>
          </details>
        {/each}
      </div>
    </section>

    <section class="card end" aria-labelledby="end-h">
      <h2 id="end-h" class="title">{t('Back home?')}</h2>
      <p>{t('End the trip and do the debrief now: two minutes on what you used, missed or did not use.')}</p>
      <button type="button" class="btn hi" onclick={finish}>{trip.finished ? t('Open the debrief') : t('End trip and debrief')}</button>
    </section>

    <p class="back"><a class="btn" href="#/pack">{t('Back to Pack')}</a></p>
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
    color: var(--ink-3);
  }
  .head h1 {
    margin: 2px 0 8px;
    font-size: var(--fs-page);
    line-height: var(--lh-title);
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
    font: 800 var(--fs-section) var(--font-title);
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
    font: 800 var(--fs-sub) var(--font-title);
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
    font: 900 var(--fs-page)/1.2 var(--font-title);
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
    font-size: var(--fs-small);
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
    font-size: var(--fs-small);
    font-weight: 700;
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
  .end p {
    margin: 0 0 12px;
  }
  .go {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    width: 100%;
    min-height: 60px;
    margin: 0 0 16px;
    padding: 10px 18px;
    text-align: left;
    box-sizing: border-box;
  }
  .go b {
    font-size: 18px;
  }
  .go b::after {
    content: ' →';
  }
  .go small {
    font-weight: 400;
    font-size: var(--fs-small);
  }
</style>
