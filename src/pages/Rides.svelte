<script>
  /**
   * v0.41.0 "GPX → Learning" (Noah 1-5). #/debrief/ride: upload a recorded ride (GPX or TCX), see
   * moving time and pauses, save it to a trip of that day, as a ride on its own, or as a new past
   * trip. #/debrief/ride/<id>: one saved ride: planned vs real and 1-3 learnings, each kept with one
   * tap. #/debrief/ride/shared: a file shared from another app (Android share sheet, the service
   * worker left it in the Cache). Rules in src/lib/gpx.js; nothing leaves the device.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { t, tn, num, locale } from '../lib/i18n.svelte.js';
  import { analyseRide, tripsOn, tripFromRide, plannedFor, compareRide, rideLearnings, learningFrom, addToPace, dropFromPace, speedOf, hm, PAUSE_MIN, RIDE_MAX_MB, SHARE_CACHE, SHARE_KEY } from '../lib/gpx.js';
  import { PACE_KEY, paceOf } from '../lib/pace.js';
  import { sortBikes } from '../lib/bikes.js';
  import Seg from '../lib/ui/Seg.svelte';
  import { Upload, ChevronRight, Check, Route } from '@lucide/svelte';

  let { sub = '' } = $props();

  const ridesQ = liveQuery(() => db.rides.toArray());
  const tripsQ = liveQuery(() => db.trips.toArray());
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const learnQ = liveQuery(() => db.learnings.toArray());
  const paceQ = liveQuery(() => db.settings.get(PACE_KEY));

  const rides = $derived([...($ridesQ ?? [])].sort((a, b) => (b.startAt ?? '').localeCompare(a.startAt ?? '')));
  const trips = $derived($tripsQ ?? []);
  const paceSetting = $derived($paceQ?.value ?? null);
  const pace = $derived(paceOf(paceSetting));
  const shared = $derived(sub === 'shared');
  const rideId = $derived(sub && sub !== 'shared' ? sub : null);
  const ride = $derived(rideId ? rides.find((r) => r.id === rideId) ?? null : null);

  const day = (iso) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '');
  const clock = (iso) => new Date(iso).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  const tripOf = (r) => (r?.tripId ? trips.find((x) => x.id === r.tripId) ?? null : null);

  /* ---------- upload: read the file, show it, save it ---------- */
  let draft = $state(null);
  let msg = $state('');
  let busy = $state(false);
  // the chosen place; until a tap: the trip of that day when there is one (the trips may load after the file)
  let picked = $state(null);
  let usePace = $state(true);
  const matches = $derived(draft ? tripsOn(trips, draft.date).slice(0, 2) : []);
  const to = $derived(picked ?? (matches[0] ? `trip:${matches[0].id}` : 'ride'));
  const dup = $derived(draft ? rides.find((r) => r.id === draft.id) ?? null : null);
  const options = $derived([
    ...matches.map((x) => ({ key: `trip:${x.id}`, name: x.title })),
    { key: 'ride', name: t('Ride only') },
    { key: 'new', name: t('New past trip') },
  ]);

  async function read(text, name) {
    msg = '';
    try {
      draft = analyseRide(text, name);
      picked = null;
    } catch (e) {
      draft = null;
      msg = e.message || t('This file could not be read.');
    }
  }

  async function pick(event) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    if (file.size > RIDE_MAX_MB * 1024 * 1024) return (msg = t('This file is too big (more than {mb} MB).', { mb: RIDE_MAX_MB }));
    busy = true;
    await read(await file.text(), file.name);
    busy = false;
  }

  // A file shared from another app waits in the Cache until it is saved or dropped (never lost on the way).
  const sharedUrl = () => new URL(SHARE_KEY, location.href).href;
  let sharedLoaded = $state(false);
  $effect(() => {
    if (!shared || sharedLoaded || !$tripsQ) return;
    sharedLoaded = true;
    (async () => {
      try {
        const res = await (await caches.open(SHARE_CACHE)).match(sharedUrl());
        if (!res) return (msg = t('The shared file is not here any more. Choose it again.'));
        await read(await res.text(), decodeURIComponent(res.headers.get('X-File-Name') ?? 'ride.gpx'));
      } catch {
        msg = t('The shared file could not be opened. Choose it again.');
      }
    })();
  });
  const dropShared = async () => {
    try {
      if (shared) await (await caches.open(SHARE_CACHE)).delete(sharedUrl());
    } catch {
      /* no Cache (private mode): nothing to tidy */
    }
  };
  async function discard() {
    await dropShared();
    draft = null;
    msg = '';
    if (shared) location.hash = '#/debrief/ride';
  }

  async function save() {
    if (!draft || busy) return;
    busy = true;
    try {
      const now = new Date().toISOString();
      const trip = to.startsWith('trip:') ? trips.find((x) => x.id === to.slice(5)) ?? null : null;
      const bike = sortBikes($bikesQ ?? [])[0] ?? null;
      const made = to === 'new' ? tripFromRide(draft, bike) : null;
      const record = {
        ...$state.snapshot(draft),
        tripId: trip?.id ?? made?.id ?? null,
        plan: trip ? plannedFor(trip, draft.date, pace) : null,
        basis: { kmh: pace.kmh, climbMh: pace.climbMh },
        answers: {},
        pace: usePace,
        createdAt: now,
      };
      await db.transaction('rw', [db.rides, db.trips, db.settings], async () => {
        await db.rides.put(record);
        if (made) await db.trips.add(made);
        if (usePace) await db.settings.put({ key: PACE_KEY, value: addToPace(paceSetting, record, now) });
      });
      await dropShared();
      location.hash = `#/debrief/ride/${encodeURIComponent(record.id)}`;
    } catch (e) {
      msg = t('Could not save. Please try again.');
      busy = false;
    }
  }

  /* ---------- one saved ride ---------- */
  const rows = $derived(ride ? compareRide(ride, ride.plan) : []);
  const suggs = $derived(ride ? rideLearnings(ride, ride.plan, ride.basis ?? pace) : []);
  const ROW = { km: 'Distance', gain: 'Climbing', moving: 'Moving time', speed: 'Average speed' };
  const fmt = (key, v) => (v == null ? '–' : key === 'km' ? `${num(v)} km` : key === 'gain' ? `${num(v)} m` : key === 'moving' ? hm(v) : `${num(v)} km/h`);
  const sign = (key, d) => {
    if (!d) return '±0';
    const abs = Math.abs(d);
    return `${d > 0 ? '+' : '−'}${key === 'moving' ? hm(abs) : key === 'gain' ? num(Math.round(abs)) : num(Math.round(abs * 10) / 10)}`;
  };
  let saving = $state(false);
  let rideMsg = $state('');
  async function answer(s, yes) {
    if (saving || ride.answers?.[s.id]) return;
    saving = true;
    try {
      await db.transaction('rw', [db.rides, db.learnings], async () => {
        const learnings = await db.learnings.toArray();
        let learningId = null;
        if (yes) {
          const l = learningFrom(s, learnings, tripOf(ride)?.title ?? ride.name, ride.id);
          await db.learnings.put(l);
          learningId = l.id;
        }
        await db.rides.update(ride.id, { answers: { ...(ride.answers ?? {}), [s.id]: yes ? { yes: true, learningId } : { yes: false } } });
      });
      rideMsg = yes ? t('Remembered: {label}', { label: s.label }) : '';
    } catch {
      rideMsg = t('Could not save. Please try again.');
    } finally {
      saving = false;
    }
  }
  async function togglePace(on) {
    const now = new Date().toISOString();
    await db.transaction('rw', [db.rides, db.settings], async () => {
      await db.settings.put({ key: PACE_KEY, value: on ? addToPace(paceSetting, ride, now) : dropFromPace(paceSetting, ride.id, now) });
      await db.rides.update(ride.id, { pace: on });
    });
  }
  // attach a saved ride later: a trip of that day, or a new past trip
  let attachTo = $state('');
  const attachMatches = $derived(ride && !ride.tripId ? tripsOn(trips, ride.date).slice(0, 2) : []);
  const attachOptions = $derived([...attachMatches.map((x) => ({ key: `trip:${x.id}`, name: x.title })), { key: 'new', name: t('New past trip') }]);
  const attachChoice = $derived(attachTo || attachOptions[0]?.key || 'new');
  async function attach() {
    const trip = attachChoice.startsWith('trip:') ? trips.find((x) => x.id === attachChoice.slice(5)) ?? null : null;
    const made = attachChoice === 'new' ? tripFromRide(ride, sortBikes($bikesQ ?? [])[0] ?? null) : null;
    await db.transaction('rw', [db.rides, db.trips], async () => {
      if (made) await db.trips.add(made);
      await db.rides.update(ride.id, { tripId: trip?.id ?? made.id, plan: trip ? plannedFor(trip, ride.date, ride.basis ?? pace) : null });
    });
  }
  async function remove() {
    if (!confirm(t('Delete this ride? Learnings you kept stay.'))) return;
    const now = new Date().toISOString();
    await db.transaction('rw', [db.rides, db.settings], async () => {
      if (paceSetting?.rides?.some((r) => r.id === ride.id)) await db.settings.put({ key: PACE_KEY, value: dropFromPace(paceSetting, ride.id, now) });
      await db.rides.delete(ride.id);
    });
    location.hash = '#/debrief/ride';
  }
</script>

{#snippet stats(r, skip = [])}
  <!-- skip: the numbers "Planned vs real" already shows (no label twice) -->
  <ul class="rowlist stats">
    {#if !skip.includes('km')}<li class="srow"><span>{t('Distance')}</span><b class="num">{num(r.km)} km</b></li>{/if}
    {#if !skip.includes('gain')}<li class="srow"><span>{t('Climbing')}</span><b class="num">{num(r.gainM)} m</b></li>{/if}
    {#if !skip.includes('moving')}<li class="srow"><span>{t('Moving time')}</span><b class="num">{hm(r.movingH)}</b></li>{/if}
    <li>
      {#if r.pauses.length}
        <details class="pz">
          <summary class="srow"><span>{t('Pauses')} <small class="nbadge num">{r.pauses.length}</small></span><b class="num">{hm(r.pauseH)}</b><ChevronRight class="chev" size={16} aria-hidden="true" /></summary>
          <ul class="plist">{#each r.pauses as p, i (i)}<li><span class="num">{t('km {km}', { km: num(Math.round(p.km)) })}</span><span class="num q">{clock(p.at)}</span><b class="num">{t('{min} min', { min: p.min })}</b></li>{/each}</ul>
        </details>
      {:else}
        <span class="srow"><span>{t('Pauses')}</span><b class="num">{t('none|pauses')}</b></span>
      {/if}
    </li>
    {#if !skip.includes('speed')}<li class="srow"><span>{t('Average speed')}</span><b class="num">{speedOf(r) != null ? `${num(speedOf(r))} km/h` : '–'}</b></li>{/if}
    <li class="srow quiet"><span>{t('Total time')}</span><b class="num">{hm(r.totalH)}</b></li>
  </ul>
  <p class="foot">{t('A stop of {n} minutes or more is a pause; shorter stops count as moving time.', { n: PAUSE_MIN })}</p>
{/snippet}

<div class="rides">
  {#if rideId}
    <p class="back"><a href="#/debrief/ride">← {t('Upload ride')}</a></p>
    {#if !$ridesQ}
      <p class="foot">{t('Loading…')}</p>
    {:else if !ride}
      <p class="card">{t('This ride does not exist any more.')}</p>
    {:else}
      {@const trip = tripOf(ride)}
      <h1 class="title">{ride.name}</h1>
      <p class="page-sub">{[day(ride.date), trip?.title].filter(Boolean).join(' · ')}</p>
      {#if rideMsg}<p class="card ok" role="status">{rideMsg}</p>{/if}

      {#if suggs.length}
        <h2 class="sec-head" id="lr-h"><span>{t('Learnings from this ride')}</span><span class="n">{suggs.length}</span></h2>
        <ul class="rowlist learn" aria-labelledby="lr-h">
          {#each suggs as s (s.id)}
            {@const a = ride.answers?.[s.id]}
            <li class="lr">
              <span class="m"><span class="t">{s.label}</span><span class="s">{s.detail}</span></span>
              {#if a?.yes}
                <span class="nbadge"><span class="udot ok" aria-hidden="true"></span>{t('Remembered')}</span>
              {:else if a}
                <span class="nbadge">{t('Not kept')}</span>
              {:else}
                <span class="acts" role="group" aria-label={s.label}>
                  <button type="button" class="btn" disabled={saving} onclick={() => answer(s, true)}><Check size={16} aria-hidden="true" />{t('Remember')}</button>
                  <button type="button" class="btn" disabled={saving} onclick={() => answer(s, false)}>{t('No')}</button>
                </span>
              {/if}
            </li>
          {/each}
        </ul>
        <p class="foot">{t('Nothing is kept without a tap. Kept learnings show up in Debrief → Learnings.')}</p>
      {/if}

      {#if rows.length}
        <h2 class="sec-head" id="cmp-h"><span>{t('Planned vs real')}</span><span class="n">{ride.plan?.source === 'plan' ? t('from the time plan') : ride.plan?.source === 'hours' ? t('from your riding hours') : t('from the route')}</span></h2>
        <table class="cmp" aria-labelledby="cmp-h">
          <thead><tr><th scope="col"><span class="sr">{t('What')}</span></th><th scope="col">{t('Planned')}</th><th scope="col">{t('Real')}</th><th scope="col"><span class="sr">{t('Difference')}</span></th></tr></thead>
          <tbody>
            {#each rows as r (r.key)}
              <tr><th scope="row">{t(ROW[r.key])}</th><td class="num">{fmt(r.key, r.plan)}</td><td class="num">{fmt(r.key, r.real)}</td><td class="num d">{sign(r.key, r.diff)}</td></tr>
            {/each}
          </tbody>
        </table>
      {/if}

      <h2 class="sec-head" id="st-h"><span>{t('The ride')}</span><span class="n">{t('Start {time}', { time: clock(ride.startAt) })}</span></h2>
      {@render stats(ride, rows.map((x) => x.key))}

      <h2 class="sec-head" id="tr-h"><span>{t('Trip')}</span></h2>
      <div class="box">
        {#if trip}
          <a class="lrow" href={trip.fromRide ? '#/pack/past' : `#/debrief/${encodeURIComponent(trip.id)}`}><span class="ic"><Route size={18} aria-hidden="true" /></span><span class="m"><span class="t">{trip.title}</span><span class="s">{trip.fromRide ? t('Past trip made from this ride') : t('Open its debrief')}</span></span><ChevronRight class="chev" size={18} aria-hidden="true" /></a>
        {:else}
          <p class="foot">{attachMatches.length ? t('A trip on this day:') : t('No trip on this day. Make it a past trip?')}</p>
          {#if attachOptions.length > 1}<Seg label={t('Save to')} value={attachChoice} options={attachOptions} onchange={(v) => (attachTo = v)} />{/if}
          <p><button type="button" class="btn" onclick={attach}>{attachChoice === 'new' ? t('Make a past trip') : t('Attach to the trip')}</button></p>
        {/if}
        <label class="chk"><input type="checkbox" checked={ride.pace !== false} onchange={(e) => togglePace(e.currentTarget.checked)} /><span>{t('Counts for your pace')}<small>{pace.mine ? t('Your pace now: {kmh} km/h', { kmh: num(pace.kmh) }) : t('Rides of 20 km or more count.')}</small></span></label>
      </div>
      <p class="del"><button type="button" class="link" onclick={remove}>{t('Delete ride')}</button></p>
    {/if}
  {:else}
    <p class="back"><a href="#/debrief">← {t('Debrief')}</a></p>
    <h1 class="title">{t('Upload ride')}</h1>
    <p class="page-sub">{t('A recorded ride as GPX: pauses, planned vs real, learnings. Read on this device.')}</p>

    <section class="up" aria-label={t('Upload ride')}>
      <label class="btn pickbtn" class:hi={!draft}><Upload size={18} aria-hidden="true" />{busy && !draft ? t('Reading …') : draft ? t('Choose another file') : t('Choose GPX file')}<input type="file" accept=".gpx,.tcx,application/gpx+xml,application/vnd.garmin.tcx+xml,application/xml,text/xml" onchange={pick} disabled={busy} /></label>
      {#if msg}<p class="card warn" role="status">{msg}</p>{/if}
      {#if !draft}<p class="foot">{t('Garmin, Wahoo, Strava or Komoot: a ride → Export GPX. On Android you can also share the file to Pack Generator.')}</p>{/if}
    </section>

    {#if draft}
      <h2 class="sec-head" id="pv-h"><span>{draft.name}</span><span class="n">{day(draft.date)}</span></h2>
      {@render stats(draft)}
      {#if dup}
        <p class="card">{t('This ride is saved already.')} <a href={`#/debrief/ride/${encodeURIComponent(dup.id)}`}>{t('Open it')}</a></p>
      {:else}
        <div class="savebox">
          <span class="lbl" id="to-h">{t('Save to')}</span>
          <Seg labelledby="to-h" value={to} {options} onchange={(v) => (picked = v)} />
          <p class="foot">{to.startsWith('trip:') ? t('Planned vs real with this trip.') : to === 'new' ? t('A past trip of one day with this ride as its route.') : t('Saved on its own; you can attach it later.')}</p>
          <label class="chk"><input type="checkbox" bind:checked={usePace} /><span>{t('Counts for your pace')}<small>{t('The riding-time guess learns your speed.')}</small></span></label>
          <p class="acts2"><button type="button" class="btn hi" disabled={busy} onclick={save}>{t('Save ride')}</button><button type="button" class="link" onclick={discard}>{t('Discard')}</button></p>
        </div>
      {/if}
    {/if}

    {#if rides.length}
      <h2 class="sec-head" id="saved-h"><span>{t('Saved rides')}</span><span class="n">{rides.length}</span></h2>
      <ul class="rowlist" aria-labelledby="saved-h">
        {#each rides as r (r.id)}
          {@const open = rideLearnings(r, r.plan, r.basis ?? pace).filter((s) => !r.answers?.[s.id]).length}
          <li>
            <a class="lrow" href={`#/debrief/ride/${encodeURIComponent(r.id)}`}>
              <span class="m"><span class="t">{r.name}</span><span class="s">{[day(r.date), tripOf(r)?.title, tn(r.pauses.length, '{n} pause', '{n} pauses')].filter(Boolean).join(' · ')}</span></span>
              {#if open}<span class="nbadge">{tn(open, '{n} learning', '{n} learnings')}</span>{/if}
              <span class="v num">{num(r.km)} km</span>
              <ChevronRight class="chev" size={18} aria-hidden="true" />
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>

<style>
  .rides {
    max-width: 760px;
    margin: 0 auto;
  }
  .back {
    margin: 0 0 6px;
  }
  .foot {
    margin: 6px 2px 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .up {
    display: grid;
    gap: 8px;
    margin: 8px 0 4px;
  }
  .pickbtn {
    position: relative;
    justify-self: start;
    min-height: 48px;
    padding: 10px 18px;
    overflow: hidden;
  }
  /* the file input covers the button, so a tap anywhere opens the picker (and tests can set files) */
  .pickbtn input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }
  .card.warn {
    margin: 0;
    background: var(--warn-soft);
    border-color: transparent;
  }
  .card.ok {
    background: var(--ok-soft);
    border-color: transparent;
    margin: 8px 0;
  }
  .srow {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    padding: 6px 12px;
  }
  .srow > span:first-child {
    flex: 1;
    min-width: 0;
  }
  .srow b {
    font-weight: 600;
    text-align: right;
    white-space: nowrap;
  }
  .srow.quiet b,
  .srow.quiet span {
    color: var(--ink-3);
    font-weight: 500;
  }
  .sec-head + .rowlist.stats,
  .sec-head + .rowlist {
    border-radius: 0 0 8px 8px;
  }
  .pz > summary {
    list-style: none;
    cursor: pointer;
  }
  .pz > summary::-webkit-details-marker {
    display: none;
  }
  .pz > summary :global(.chev) {
    flex: none;
    color: var(--ink-3);
    transition: transform 0.15s;
  }
  .pz[open] > summary :global(.chev) {
    transform: rotate(90deg);
  }
  .plist {
    list-style: none;
    margin: 0;
    padding: 0 12px 8px 24px;
  }
  .plist li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 12px;
    padding: 4px 0;
    border-top: 1px solid var(--line);
    font-size: 15px;
  }
  .plist .q {
    color: var(--ink-3);
  }
  .plist b {
    text-align: right;
    min-width: 56px;
    font-weight: 500;
  }
  .savebox,
  .box {
    display: grid;
    gap: 8px;
    padding: 12px;
    border: 1px solid var(--line);
    border-radius: 0 0 8px 8px;
    background: var(--paper);
  }
  .savebox {
    margin-top: 12px;
    border-radius: 8px;
  }
  .savebox .lbl {
    margin: 0;
  }
  .savebox .foot {
    margin-top: 0;
  }
  .box .lrow {
    padding: 4px 0;
  }
  .box p {
    margin: 0;
  }
  .chk {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    min-height: 44px;
    padding: 6px 0;
    cursor: pointer;
  }
  .chk input {
    width: 22px;
    height: 22px;
    margin: 1px 0 0;
    flex: none;
    accent-color: var(--brand);
  }
  .chk small {
    display: block;
    color: var(--ink-3);
    font-size: 14px;
  }
  .acts2 {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
    margin: 4px 0 0;
  }
  .acts2 .btn {
    min-height: 48px;
    padding: 10px 22px;
  }
  .link {
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
  .lr {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    padding: 10px 12px;
  }
  .lr .m {
    flex: 1 1 220px;
    min-width: 0;
  }
  .lr .t {
    display: block;
    font-weight: 600;
    line-height: 1.3;
    overflow-wrap: break-word;
  }
  .lr .s {
    display: block;
    font-size: 14px;
    color: var(--ink-3);
  }
  .lr .acts {
    display: flex;
    gap: 8px;
  }
  .lr .btn {
    min-height: 44px;
  }
  .cmp {
    width: 100%;
    border-collapse: collapse;
    background: var(--paper);
    border: 1px solid var(--line);
    font-size: 15px;
  }
  .cmp th,
  .cmp td {
    padding: 10px 12px;
    border-top: 1px solid var(--line);
    text-align: right;
    white-space: nowrap;
  }
  .cmp th[scope='row'] {
    text-align: left;
    font-weight: 500;
    white-space: normal;
  }
  .cmp thead th {
    border-top: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--ink-3);
  }
  .cmp .d {
    color: var(--ink-3);
  }
  @media (max-width: 400px) {
    .cmp th,
    .cmp td {
      padding: 8px 6px;
      font-size: 14px;
    }
  }
  .del {
    margin: 18px 0 0;
  }
</style>
