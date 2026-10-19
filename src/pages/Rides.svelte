<script>
  /**
   * v0.41.0 "GPX → Learning" (Noah 1-5). #/debrief/ride: upload a recorded ride (GPX or TCX), see
   * moving time and pauses, save it to a trip of that day, as a ride on its own, or as a new past
   * trip. #/debrief/ride/<id>: one saved ride: planned vs real and 1-3 learnings, each kept with one
   * tap. #/debrief/ride/shared: a file shared from another app (Android share sheet, the service
   * worker left it in the Cache). Rules in src/lib/gpx.js; nothing leaves the device.
   */
  import { liveQuery } from 'dexie';
  import Skeleton from '../lib/ui/Skeleton.svelte';
  import { db } from '../lib/db.js';
  import HintCard from '../lib/pageinfo/HintCard.svelte';
  import { heartOfRide } from '../lib/kmbook.js';
  import { t, tn, num, locale } from '../lib/i18n.svelte.js';
  import { analyseRide, tripsOn, tripFromRide, plannedFor, compareRide, rideLearnings, learningFrom, addToPace, dropFromPace, speedOf, hm, PAUSE_MIN, RIDE_MAX_MB, SHARE_CACHE, SHARE_KEY } from '../lib/gpx.js';
  import { PACE_KEY, PACE_MIN, paceOf, startKey } from '../lib/pace.js';
  import { markSaved, savedNote, seenCard } from '../lib/ridejourney.js';
  import { sharedKind } from '../lib/komoot.js';
  import { parseActivitiesCsv } from '../lib/activities.js';
  import { isList, kmIntoDebrief, listToTrips, handToKmImport } from '../lib/ridelist.js';
  import { sortBikes, bikesHash } from '../lib/bikes.js';
  import '../lib/review/review.css';
  import Seg from '../lib/ui/Seg.svelte';
  import Profile from '../lib/ui/Profile.svelte';
  import { Upload, ChevronLeft, ChevronRight, Check, Route, Plus, Gauge, Coffee, Lightbulb, BookOpen, TriangleAlert, X, CircleCheck, Map } from '@lucide/svelte';

  let { sub = '' } = $props();

  const ridesQ = liveQuery(() => db.rides.toArray());
  const tripsQ = liveQuery(() => db.trips.toArray());
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const learnQ = liveQuery(() => db.learnings.toArray());
  const paceQ = liveQuery(() => db.settings.get(PACE_KEY));
  const debriefsQ = liveQuery(() => db.debriefs.toArray());
  // heart rate of the same ride in Strava (observation only, Noah 12.10.2026 «1a»)
  const kmBookQ = liveQuery(() => db.kmBook.toArray());

  const rides = $derived([...($ridesQ ?? [])].sort((a, b) => (b.startAt ?? '').localeCompare(a.startAt ?? '')));
  const trips = $derived($tripsQ ?? []);
  const paceSetting = $derived($paceQ?.value ?? null);
  const pace = $derived(paceOf(paceSetting));
  const shared = $derived(sub === 'shared');
  const rideId = $derived(sub && sub !== 'shared' ? sub : null);
  const ride = $derived(rideId ? rides.find((r) => r.id === rideId) ?? null : null);
  const heart = $derived(ride ? heartOfRide($kmBookQ ?? [], ride) : null);

  const day = (iso) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '');
  const clock = (iso) => new Date(iso).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  const firstBike = $derived(sortBikes($bikesQ ?? [])[0] ?? null);
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
  // GPX-Weg: the same ride is known by its start minute, whichever way it came in
  const dup = $derived(draft ? rides.find((r) => startKey(r.id) === startKey(draft.id)) ?? null : null);
  const inPace = (r) => (paceSetting?.rides ?? []).some((x) => startKey(x.id) === startKey(r.id));
  // GPX-Weg (Noah 15.10.2026 «1-5 a»): what saving does, in three lines, before the tap
  const willCount = $derived(!!draft && usePace && draft.km >= 20 && draft.movingH > 0.5 && !inPace(draft));
  const paceAfter = $derived(Math.min(PACE_MIN, pace.n + (willCount ? 1 : 0)));
  const options = $derived([
    ...matches.map((x) => ({ key: `trip:${x.id}`, name: x.title })),
    { key: 'ride', name: t('Ride only') },
    { key: 'new', name: t('New past trip') },
  ]);

  // GPX-Weg 4a: a GPX without times is a planned route, not a ride: say so and offer the trip
  let route = $state(null);
  let batch = $state(null);
  // GPX-Weg R3 (Noah 15.10.2026 «5a»): a CSV list comes in here too; what it did, in one card
  let list = $state(null);
  let listFiles = [];
  async function read(text, name) {
    msg = '';
    route = null;
    batch = null;
    try {
      draft = analyseRide(text, name);
      picked = null;
    } catch (e) {
      draft = null;
      if (sharedKind(text) === 'route') route = { text, name };
      else msg = e.message || t('This file could not be read.');
    }
  }

  async function pick(event) {
    let files = [...(event.currentTarget.files ?? [])];
    event.currentTarget.value = '';
    if (!files.length) return;
    list = null;
    const lists = files.filter(isList);
    if (lists.length) await readLists(lists);
    files = files.filter((f) => !isList(f));
    if (!files.length) return;
    if (files.length > 1) return saveMany(files);
    const file = files[0];
    if (file.size > RIDE_MAX_MB * 1024 * 1024) return (msg = t('This file is too big (more than {mb} MB).', { mb: RIDE_MAX_MB }));
    busy = true;
    await read(await file.text(), file.name);
    busy = false;
  }

  /**
   * The km of rides on a bike trip's days into that trip's look back (what «Import from Strava or Garmin»
   * did there). A finished look back keeps its km (they went to the bike already): false then.
   */
  async function kmToTrip(trip, rides) {
    const stored = await db.debriefs.get(trip.id);
    if (stored?.status === 'done') return false;
    const d = kmIntoDebrief(stored, trip, rides);
    if (d) await db.debriefs.put(d);
    return true;
  }

  /** CSV lists: the km of the rides on each bike trip's days go into its look back; one card says what. */
  async function readLists(files) {
    busy = true;
    msg = '';
    draft = null;
    route = null;
    batch = null;
    try {
      const acts = [];
      for (const f of files) acts.push(...parseActivitiesCsv(await f.text()));
      // from the database: the trips may not have loaded on this page yet
      const res = listToTrips(acts, await db.trips.toArray());
      await db.transaction('rw', [db.debriefs], async () => {
        for (const h of res.hits) h.done = !(await kmToTrip(h.trip, h.rides));
      });
      listFiles = files;
      list = { ...res, name: files.map((f) => f.name).join(', ') };
    } catch (e) {
      msg = e.message || t('This file could not be read.');
    } finally {
      busy = false;
    }
  }
  function toBikeKm() {
    handToKmImport(listFiles);
    location.hash = '#/bikes?tab=care&view=import';
  }

  // the route file goes the way a file shared from komoot goes: the sheet «Tour aus komoot übernehmen» over Touren
  async function useRoute() {
    try {
      await (await caches.open(SHARE_CACHE)).put(sharedUrl(), new Response(route.text, { headers: { 'Content-Type': 'application/gpx+xml', 'X-File-Name': encodeURIComponent(route.name) } }));
      location.hash = '#/komoot/shared';
    } catch {
      location.hash = '#/trips';
    }
  }

  /**
   * GPX-Weg 2a: several files at once (as «Dein Tempo» could): each saved like one file with the defaults,
   * to the trip of that day or on its own, counting for your pace. Files without times or already saved
   * are named, not saved twice.
   */
  async function saveMany(files) {
    busy = true;
    msg = '';
    draft = null;
    route = null;
    const first = rides.length === 0;
    const allTrips = await db.trips.toArray();
    const saved = [];
    const skipped = [];
    let setting = $state.snapshot(paceSetting);
    const now = new Date().toISOString();
    for (const f of files) {
      if (f.size > RIDE_MAX_MB * 1024 * 1024) {
        skipped.push({ name: f.name, why: t('too big') });
        continue;
      }
      const text = await f.text();
      let r;
      try {
        r = analyseRide(text, f.name);
      } catch {
        skipped.push({ name: f.name, why: sharedKind(text) === 'route' ? t('a planned route, no times') : t('could not be read') });
        continue;
      }
      if (rides.some((x) => startKey(x.id) === startKey(r.id)) || saved.some((x) => startKey(x.id) === startKey(r.id))) {
        skipped.push({ name: r.name, why: t('saved already') });
        continue;
      }
      const trip = tripsOn(allTrips, r.date)[0] ?? null;
      const record = { ...r, tripId: trip?.id ?? null, plan: trip ? plannedFor(trip, r.date, pace) : null, basis: { kmh: pace.kmh, climbMh: pace.climbMh }, answers: {}, pace: true, createdAt: now };
      setting = addToPace(setting, record, now);
      saved.push(record);
    }
    try {
      if (saved.length)
        await db.transaction('rw', [db.rides, db.settings], async () => {
          await db.rides.bulkPut(saved);
          await db.settings.put({ key: PACE_KEY, value: setting });
        });
      for (const r of saved) {
        const trip = r.tripId ? allTrips.find((x) => x.id === r.tripId) : null;
        if (trip?.bikeId) await kmToTrip(trip, [r]);
      }
      markSaved(saved.map((r) => r.id), { first });
      batch = { saved, skipped, first };
    } catch {
      msg = t('Could not save. Please try again.');
    } finally {
      busy = false;
    }
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
        const text = await res.text();
        // SN1b: a GPX without times is a planned route (from komoot): the sheet «Tour aus komoot übernehmen»
        if (sharedKind(text) === 'route') return location.replace('#/komoot/shared');
        await read(text, decodeURIComponent(res.headers.get('X-File-Name') ?? 'ride.gpx'));
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
      if (trip?.bikeId) await kmToTrip(trip, [record]);
      await dropShared();
      markSaved([record.id], { first: rides.length === 0 });
      location.hash = `#/debrief/ride/${encodeURIComponent(record.id)}`;
    } catch (e) {
      msg = t('Could not save. Please try again.');
      busy = false;
    }
  }

  /* ---------- one saved ride ---------- */
  const rows = $derived(ride ? compareRide(ride, ride.plan) : []);
  // v0.151.0 HP3: the planned route's profile, only when this ride is the trip's one ride (a stage of a
  // longer trip would not match the whole route).
  const planProfileOf = (r, trip) => (trip?.route?.profile?.length > 1 && rides.filter((x) => x.tripId === trip.id).length === 1 ? trip.route.profile : null);
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
  // GPX-Weg 1a: right after saving you land here, with one calm card: what happened, one next step
  let note = $state(savedNote());
  const justSaved = $derived(!!ride && !!note && !note.seen && (note.last ?? note.ids).includes(ride.id));
  const openLearn = $derived(ride ? suggs.filter((s) => !ride.answers?.[s.id]).length : 0);
  const closeCard = () => {
    seenCard();
    note = savedNote();
  };
  const toLearnings = () => document.getElementById('lr-h')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    if (trip?.bikeId) await kmToTrip(trip, [ride]);
  }
  async function remove() {
    if (!confirm(t('Delete this ride? Learnings you kept stay.'))) return;
    const now = new Date().toISOString();
    await db.transaction('rw', [db.rides, db.settings], async () => {
      if (inPace(ride)) await db.settings.put({ key: PACE_KEY, value: dropFromPace(paceSetting, ride.id, now) });
      await db.rides.delete(ride.id);
    });
    location.hash = '#/debrief/ride';
  }
</script>

{#snippet stats(r, skip = [])}
  <!-- skip: the numbers "Planned vs real" already shows (no label twice) -->
  <ul class="stats">
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

<!-- v0.109.0 Design-Refresh P6 (T22 «Fahrten», T23 «Fahrt: geplant gegen echt», approved 12.10.2026): the quiet
     path; two columns on a computer. T22: the dashed card to choose a GPX file, the saved rides as rows, on
     the right «Gut zu wissen» (only what the app really does) and «Mehr». T23: numbered sections (numbers,
     pauses, planned vs real, learnings), on the right where the ride is saved, «counts for your pace» and
     delete. -->
<div class="rides rv-page">
  {#if rideId}
    <nav class="crumb" aria-label={t('Path')}><a href="#/trips"><ChevronLeft size={14} aria-hidden="true" />{t('Trips|place')}</a><ChevronRight size={12} aria-hidden="true" /><a href="#/debrief">{t('Look back|page')}</a><ChevronRight size={12} aria-hidden="true" /><a href="#/debrief/ride">{t('Upload ride')}</a>{#if ride}<ChevronRight size={12} aria-hidden="true" /><span aria-current="page">{day(ride.date)}</span>{/if}</nav>
    {#if !$ridesQ}
      <Skeleton rows={3} />
    {:else if !ride}
      <p class="rv-box pad">{t('This ride does not exist any more.')}</p>
    {:else}
      {@const trip = tripOf(ride)}
      {@const parts = ['num', 'pz', rows.length ? 'cmp' : '', suggs.length ? 'lr' : ''].filter(Boolean)}
      {@const no = (k) => `${parts.indexOf(k) + 1} · `}
      {@const planP = planProfileOf(ride, trip)}
      <h1 class="title">{ride.name}</h1>
      <p class="page-sub">{[day(ride.date), t('Start {time}', { time: clock(ride.startAt) }), trip?.title].filter(Boolean).join(' · ')}</p>
      {#if rideMsg}<p class="okmsg" role="status">{rideMsg}</p>{/if}
      {#if justSaved}
        <!-- GPX-Weg 1a: what just happened, and one next step -->
        <section class="rv-box pad saved" aria-labelledby="saved-card-h" data-saved-card>
          <button type="button" class="x" onclick={closeCard} aria-label={t('Close')}><X size={18} aria-hidden="true" /></button>
          <p class="sk"><CircleCheck size={16} aria-hidden="true" />{t('Ride saved')}</p>
          <h2 id="saved-card-h" class="sh">{note.first ? t('Your first ride is here.') : t('The ride is saved.')}</h2>
          <ul class="sl">
            <li class="ok"><Check size={16} aria-hidden="true" /><span><b>{tripOf(ride) ? tripOf(ride).title : t('In Look back')}</b> · {tripOf(ride) ? t('saved with this trip, planned vs real below.') : t('Trips › Look back shows it now.')}</span></li>
            {#if ride.pace === false}
              <li><Gauge size={16} aria-hidden="true" /><span><b>{t('Your pace')}</b> · {t('this ride does not count, as you chose on the right.')}</span></li>
            {:else if ride.km < 20}
              <li><Gauge size={16} aria-hidden="true" /><span><b>{t('Your pace')}</b> · {t('under 20 km, so it does not count. It stays saved.')}</span></li>
            {:else if pace.mine}
              <li class="ok"><Check size={16} aria-hidden="true" /><span><b>{t('Your pace')}</b> · {t('it counts. Every new trip now guesses with {kmh} km/h.', { kmh: num(pace.kmh) })}</span></li>
            {:else}
              <li class="ok"><Check size={16} aria-hidden="true" /><span><b>{t('Your pace: {n} of {min}', { n: pace.n, min: PACE_MIN })}</b> · {tn(pace.need, '{n} more ride from 20 km, then every trip guesses with your pace.', '{n} more rides from 20 km, then every trip guesses with your pace.')}</span></li>
            {/if}
            {#if openLearn}<li><Lightbulb size={16} aria-hidden="true" /><span><b>{tn(openLearn, '{n} learning is waiting', '{n} learnings are waiting')}</b> · {t('below. Remember or No, both are fine.')}</span></li>{/if}
          </ul>
          <p class="sacts">
            {#if openLearn}<button type="button" class="btn hi" onclick={toLearnings}>{t('See learnings')}</button>{/if}
            <a class="btn" class:hi={!openLearn} href="#/debrief/ride" onclick={closeCard}>{t('Upload next ride')}</a>
            <a class="link" href="#/debrief/pace" onclick={closeCard}>{t('To your pace')}</a>
          </p>
        </section>
      {/if}

      <div class="rv-lay">
        <div class="rv-col">
          <section class="rv-sec" aria-labelledby="st-h">
            <div class="rv-h"><div><h2 id="st-h">{no('num')}{t('Numbers')}</h2></div></div>
            <dl class="rv-box rv-tiles nums">
              <div class="rv-tile"><dd><b class="num">{num(ride.km)} km</b></dd><dt><small>{t('Distance')}</small></dt></div>
              <div class="rv-tile"><dd><b class="num">{num(ride.gainM)} m</b></dd><dt><small>{t('Climbing')}</small></dt></div>
              <div class="rv-tile"><dd><b class="num">{hm(ride.movingH)}</b></dd><dt><small>{t('Moving time')}</small></dt></div>
              <div class="rv-tile"><dd><b class="num">{speedOf(ride) != null ? `${num(speedOf(ride))} km/h` : '–'}</b></dd><dt><small>{t('Average speed')}</small></dt></div>
              {#if heart}<div class="rv-tile"><dd><b class="num">{heart.avg} / {heart.max ?? '–'}</b></dd><dt><small>{t('Heart rate Ø / max · bpm')}</small></dt></div>{/if}
            </dl>
            <!-- v0.151.0 HP3: the profile of this ride -->
            {#if ride.profile?.length > 1}<div class="rv-box pad rprof"><Profile points={ride.profile} label="Elevation of the ride" /></div>{/if}
          </section>

          <section class="rv-sec" aria-labelledby="pz-h">
            <div class="rv-h"><div><h2 id="pz-h">{no('pz')}{t('Pauses')}</h2><p class="rv-sub">{t('A stop of {n} minutes or more is a pause; shorter stops count as moving time.', { n: PAUSE_MIN })}</p></div></div>
            <ul class="rv-box plist2">
              {#each ride.pauses as p, i (i)}
                <li class="rv-row"><span class="rv-ic" aria-hidden="true"><Coffee size={16} /></span><span class="rv-m"><span class="rv-t num">{t('km {km}', { km: num(Math.round(p.km)) })}</span><span class="rv-s num">{clock(p.at)}</span></span><b class="rv-v num">{t('{min} min', { min: p.min })}</b></li>
              {:else}
                <li class="rv-row"><span class="rv-ic" aria-hidden="true"><Coffee size={16} /></span><span class="rv-m"><span class="rv-t">{t('none|pauses')}</span></span></li>
              {/each}
              <li class="rv-row tot"><span class="rv-m"><span class="rv-t">{t('Total time')}</span>{#if ride.pauses.length}<span class="rv-s num">{t('Pauses')} {hm(ride.pauseH)}</span>{/if}</span><b class="rv-v num">{hm(ride.totalH)}</b></li>
            </ul>
          </section>

          {#if rows.length}
            <section class="rv-sec" aria-labelledby="cmp-h">
              <div class="rv-h"><div><h2 id="cmp-h">{no('cmp')}{t('Planned vs real')}</h2><p class="rv-sub">{ride.plan?.source === 'plan' ? t('from the time plan') : ride.plan?.source === 'hours' ? t('from your riding hours') : t('from the route')}</p></div></div>
              <!-- v0.151.0 HP3 (Noah «1a»): planned and ridden in one picture -->
              {#if planP && ride.profile?.length > 1}<div class="rv-box pad rprof"><Profile points={ride.profile} plan={planP} label="Elevation, planned and ridden" /></div>{/if}
              <div class="rv-box">
                <table class="cmp" aria-labelledby="cmp-h">
                  <thead><tr><th scope="col"><span class="sr">{t('What')}</span></th><th scope="col">{t('Planned')}</th><th scope="col">{t('Real')}</th><th scope="col"><span class="sr">{t('Difference')}</span></th></tr></thead>
                  <tbody>
                    {#each rows as r (r.key)}
                      <tr><th scope="row">{t(ROW[r.key])}</th><td class="num">{fmt(r.key, r.plan)}</td><td class="num">{fmt(r.key, r.real)}</td><td class="num d">{sign(r.key, r.diff)}</td></tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </section>
          {/if}

          {#if suggs.length}
            <section class="rv-sec" aria-labelledby="lr-h">
              <div class="rv-h"><div><h2 id="lr-h">{no('lr')}{t('Learnings from this ride')}</h2><p class="rv-sub">{t('Nothing is kept without a tap. Kept learnings show up in Debrief → Learnings.')}</p></div></div>
              <ul class="rv-box learn" aria-labelledby="lr-h">
                {#each suggs as s (s.id)}
                  {@const a = ride.answers?.[s.id]}
                  <li class="rv-row lr">
                    <span class="rv-ic" aria-hidden="true"><Lightbulb size={16} /></span>
                    <span class="rv-m"><span class="rv-t">{s.label}</span><span class="rv-s">{s.detail}</span></span>
                    {#if a?.yes}
                      <span class="rv-tag">{t('Remembered')}</span>
                    {:else if a}
                      <span class="rv-tag warn">{t('Not kept')}</span>
                    {:else}
                      <span class="acts" role="group" aria-label={s.label}>
                        <button type="button" class="btn" disabled={saving} onclick={() => answer(s, true)}><Check size={16} aria-hidden="true" />{t('Remember')}</button>
                        <button type="button" class="btn" disabled={saving} onclick={() => answer(s, false)}>{t('No')}</button>
                      </span>
                    {/if}
                  </li>
                {/each}
              </ul>
            </section>
          {/if}
        </div>

        <div class="rv-col">
          <section class="rv-sec" aria-labelledby="tr-h">
            <div class="rv-h"><div><h2 id="tr-h">{t('Saved with')}</h2></div></div>
            <div class="rv-box box">
              {#if trip}
                <a class="rv-row" href={trip.fromRide ? '#/pack/past' : `#/debrief/${encodeURIComponent(trip.id)}`}><span class="rv-ic" aria-hidden="true"><Route size={18} /></span><span class="rv-m"><span class="rv-t">{trip.title}</span><span class="rv-s">{trip.fromRide ? t('Past trip made from this ride') : t('Open its debrief')}</span></span><ChevronRight class="rv-chev" size={18} aria-hidden="true" /></a>
              {:else}
                <div class="attach">
                  <p class="foot">{attachMatches.length ? t('A trip on this day:') : t('No trip on this day. Make it a past trip?')}</p>
                  {#if attachOptions.length > 1}<Seg label={t('Save to')} value={attachChoice} options={attachOptions} onchange={(v) => (attachTo = v)} />{/if}
                  <p><button type="button" class="btn" onclick={attach}>{attachChoice === 'new' ? t('Make a past trip') : t('Attach to the trip')}</button></p>
                </div>
              {/if}
              <label class="rv-row chk"><span class="rv-ic" aria-hidden="true"><Gauge size={18} /></span><span class="rv-m"><span class="rv-t">{t('Counts for your pace')}</span><span class="rv-s">{pace.mine ? t('Your pace now: {kmh} km/h', { kmh: num(pace.kmh) }) : t('Rides of 20 km or more count.')}</span></span><input type="checkbox" checked={ride.pace !== false} onchange={(e) => togglePace(e.currentTarget.checked)} /></label>
            </div>
          </section>
          <p class="del"><button type="button" class="link" onclick={remove}>{t('Delete ride')}</button></p>
        </div>
      </div>
    {/if}
  {:else}
    <nav class="crumb" aria-label={t('Path')}><a href="#/trips"><ChevronLeft size={14} aria-hidden="true" />{t('Trips|place')}</a><ChevronRight size={12} aria-hidden="true" /><a href="#/debrief">{t('Look back|page')}</a><ChevronRight size={12} aria-hidden="true" /><span aria-current="page">{t('Upload ride')}</span></nav>
    <h1 class="title">{t('Upload ride')}</h1>
    <p class="page-sub">{t('A recorded ride as GPX or TCX: pauses, planned vs real, learnings. A CSV list from Strava or Garmin: the km of your trips. Read on this device.')}</p>
    <HintCard page="rides" />

    <div class="rv-lay">
      <div class="rv-col">
        <section class="up" aria-label={t('Upload ride')}>
          <div class="drop">
            <span class="rv-ic" aria-hidden="true"><Plus size={18} /></span>
            <span class="rv-m"><span class="rv-t">{t('Choose a ride file')}</span>{#if !draft}<span class="rv-s">{t('GPX, TCX or CSV. Garmin, Wahoo, Strava or Komoot: a ride → Export GPX. On Android you can also share the file to Pack Generator.')}</span>{/if}</span>
            <label class="btn pickbtn" class:hi={!draft}><Upload size={18} aria-hidden="true" />{busy && !draft ? t('Reading …') : draft ? t('Choose another file') : t('Choose file')}<input type="file" multiple accept=".gpx,.tcx,.csv,application/gpx+xml,application/vnd.garmin.tcx+xml,application/xml,text/xml,text/csv" onchange={pick} disabled={busy} /></label>
          </div>
          {#if !draft && !route && !batch && !list && !rides.length}
            <!-- GPX-Weg 3a/5a: before the first ride, what a ride file does here -->
            <ol class="rv-box pad how" aria-label={t('How it works')}>
              <li><b>{t('Choose a file')}</b> · {t('a recorded ride from your bike computer or phone (GPX or TCX), or the CSV list from Strava or Garmin. Several at once work too.')}</li>
              <li><b>{t('Check and save')}</b> · {t('you see km, climbing, riding time and pauses, and where it is saved.')}</li>
              <li><b>{t('The app learns')}</b> · {t('the ride shows up in Look back, counts for your pace and suggests learnings.')}</li>
            </ol>
          {/if}
          <!-- GPX-Weg R3: where the files come from (was in the trip's look back) -->
          <details class="rv-box pad howto" data-where-from>
            <summary>{t('Where do I get the file?')}</summary>
            <p><b>Strava:</b> {t('on a ride → ••• → Export GPX (one ride), or Settings → My Account → Download your data → activities.csv (all rides).')}</p>
            <p><b>Garmin Connect:</b> {t('on a ride → ⚙ → Export to GPX or TCX, or Activities → Export CSV (the list).')}</p>
            <p>{t('One ride (GPX or TCX): pauses, planned vs real, your pace. The list (CSV): only date and km, for the km of your trips and bikes.')}</p>
          </details>
          {#if msg}<p class="warnmsg" role="status">{msg}</p>{/if}
          {#if list}
            <!-- GPX-Weg R3: a CSV list: the km of the trips, then on to the km per bike -->
            <div class="rv-box pad saved" role="status" data-list-card>
              <p class="sk"><CircleCheck size={16} aria-hidden="true" />{tn(list.all, 'List read: {n} ride', 'List read: {n} rides')}</p>
              <ul class="sl">
                {#each list.hits as h (h.trip.id)}<li class="ok"><Check size={16} aria-hidden="true" /><span><b>{h.trip.title}</b> · {h.done ? tn(h.rides.length, '{n} ride, {km} km. Its look back is finished, so its km stay as they are.', '{n} rides, {km} km. Its look back is finished, so its km stay as they are.', { km: num(h.km) }) : tn(h.rides.length, '{n} ride, {km} km: in the look back of this trip.', '{n} rides, {km} km: in the look back of this trip.', { km: num(h.km) })}</span></li>{/each}
                {#if !list.hits.length}<li><TriangleAlert size={16} aria-hidden="true" /><span>{t('No ride is on the days of one of your bike trips.')}</span></li>{/if}
                {#if list.outside && list.hits.length}<li><Route size={16} aria-hidden="true" /><span>{tn(list.outside, '{n} ride on a day without a trip: not counted here.', '{n} rides on days without a trip: not counted here.')}</span></li>{/if}
                <li><Gauge size={16} aria-hidden="true" /><span><b>{t('Your pace')}</b> · {t('a list has no track and no times, so it does not count. For your pace upload the ride as GPX.')}</span></li>
              </ul>
              <p class="sacts"><button type="button" class="btn hi" onclick={toBikeKm}>{t('Also for the km of my bikes')}</button>{#if list.hits.length === 1}<a class="link" href={`#/debrief/${encodeURIComponent(list.hits[0].trip.id)}`}>{t('To the look back of this trip')}</a>{:else}<a class="link" href="#/debrief">{t('To Look back')}</a>{/if}<button type="button" class="link" onclick={() => (list = null)}>{t('Close')}</button></p>
            </div>
          {/if}
          {#if route}
            <!-- GPX-Weg 4a: a planned route instead of a ride -->
            <div class="rv-box pad warncard" role="status" data-route-card>
              <p class="sk warn"><Map size={16} aria-hidden="true" />{t('Planned route, not a ride')}</p>
              <p>{t('«{file}» has no times. It is a route you want to ride, not a ride you rode. For your pace the app needs the recording of your bike computer.', { file: route.name })}</p>
              <p class="sacts"><button type="button" class="btn hi" onclick={useRoute}>{t('Use as route for a trip')}</button><button type="button" class="link" onclick={() => (route = null)}>{t('Choose another file')}</button></p>
            </div>
          {/if}
          {#if batch}
            <!-- GPX-Weg 1a/2a: several files: one card, what happened -->
            <div class="rv-box pad saved" role="status" data-saved-card>
              <p class="sk"><CircleCheck size={16} aria-hidden="true" />{tn(batch.saved.length, '{n} ride saved', '{n} rides saved')}</p>
              <ul class="sl">
                {#if batch.saved.length}
                  <li class="ok"><Check size={16} aria-hidden="true" /><span><b>{t('In Look back')}</b> · {t('Trips › Look back shows them now; a ride on a trip day went to that trip.')}</span></li>
                  <li class="ok"><Check size={16} aria-hidden="true" /><span><b>{pace.mine ? t('Your pace') : t('Your pace: {n} of {min}', { n: pace.n, min: PACE_MIN })}</b> · {pace.mine ? t('they count. Every new trip now guesses with {kmh} km/h.', { kmh: num(pace.kmh) }) : tn(pace.need, '{n} more ride from 20 km, then every trip guesses with your pace.', '{n} more rides from 20 km, then every trip guesses with your pace.')}</span></li>
                {/if}
                {#each batch.skipped as k, i (i)}<li><TriangleAlert size={16} aria-hidden="true" /><span><b>{k.name}</b> · {t('not saved: {why}.', { why: k.why })}</span></li>{/each}
              </ul>
              <p class="sacts"><a class="btn hi" href="#/debrief/pace">{t('To your pace')}</a><a class="link" href="#/debrief">{t('To Look back')}</a></p>
            </div>
          {/if}
        </section>

        {#if draft}
          <section class="rv-sec" aria-labelledby="pv-h">
            <div class="rv-h"><div><h2 id="pv-h">{draft.name}</h2><p class="rv-sub">{day(draft.date)}</p></div></div>
            <div class="rv-box">
              {@render stats(draft)}
            </div>
            {#if dup}
              <p class="rv-box pad dupmsg" role="status">{t('You uploaded «{name}» of {day} already. It counts only once.', { name: dup.name, day: day(dup.date) })} <a href={`#/debrief/ride/${encodeURIComponent(dup.id)}`}>{t('Open it')}</a></p>
            {:else}
              <div class="rv-box pad savebox">
                <span class="rv-lbl" id="to-h">{t('Save to')}</span>
                <Seg labelledby="to-h" value={to} {options} onchange={(v) => (picked = v)} />
                <p class="foot">{to.startsWith('trip:') ? t('Planned vs real with this trip.') : to === 'new' ? t('A past trip of one day with this ride as its route.') : t('Saved on its own; you can attach it later.')}</p>
                <label class="chk2"><input type="checkbox" bind:checked={usePace} /><span>{t('Counts for your pace')}<small>{t('The riding-time guess learns your speed.')}</small></span></label>
                <!-- GPX-Weg 2a: what saving does, before the tap -->
                <div class="what" data-what-happens>
                  <p class="rv-lbl">{t('What happens when you save')}</p>
                  <ul class="sl">
                    <li><Route size={16} aria-hidden="true" /><span><b>{t('Look back')}</b> · {to.startsWith('trip:') ? t('with this trip, planned vs real.') : t('it shows up at once in Trips › Look back.')}</span></li>
                    <li><Gauge size={16} aria-hidden="true" /><span><b>{t('Your pace')}</b> · {!usePace ? t('it does not count (switched off above).') : draft.km < 20 ? t('under 20 km, so it does not count.') : inPace(draft) ? t('it counts already.') : pace.mine ? t('your pace learns from it.') : t('ride {n} of {min}. From {min} rides every trip guesses with your pace.', { n: paceAfter, min: PACE_MIN })}</span></li>
                    <li><Lightbulb size={16} aria-hidden="true" /><span><b>{t('Learnings')}</b> · {t('the app suggests a few. Nothing is kept without a tap.')}</span></li>
                  </ul>
                  <p class="foot">{t('Nothing is uploaded; everything stays on this device.')}</p>
                </div>
                <p class="acts2"><button type="button" class="btn hi" disabled={busy} onclick={save}>{t('Save ride')}</button><button type="button" class="link" onclick={discard}>{t('Discard')}</button></p>
              </div>
            {/if}
          </section>
        {/if}

        {#if rides.length}
          <section class="rv-sec" aria-labelledby="saved-h">
            <div class="rv-h"><div><h2 id="saved-h">{t('Saved rides')}</h2><p class="rv-sub num">{tn(rides.length, '{n} ride', '{n} rides')}</p></div></div>
            <ul class="rv-box" aria-labelledby="saved-h">
              {#each rides as r (r.id)}
                {@const open = rideLearnings(r, r.plan, r.basis ?? pace).filter((s) => !r.answers?.[s.id]).length}
                <li>
                  <a class="rv-row" href={`#/debrief/ride/${encodeURIComponent(r.id)}`}>
                    <span class="rv-ic" aria-hidden="true"><Route size={18} /></span>
                    <span class="rv-m"><span class="rv-t">{r.name}{#if note?.ids.includes(r.id)}<span class="rv-tag nw">{t('New|ride')}</span>{/if}</span><span class="rv-s num">{[day(r.date), `${num(r.km)} km`, tripOf(r)?.title, tn(r.pauses.length, '{n} pause', '{n} pauses')].filter(Boolean).join(' · ')}</span>{#if open}<span class="rv-tag warn lt">{tn(open, '{n} learning', '{n} learnings')}</span>{/if}</span>
                    <ChevronRight class="rv-chev" size={18} aria-hidden="true" />
                  </a>
                </li>
              {/each}
            </ul>
          </section>
        {/if}
      </div>

      <div class="rv-col">
        <section class="rv-sec" aria-labelledby="know-h">
          <div class="rv-h"><div><h2 id="know-h">{t('Good to know')}</h2></div></div>
          <ul class="rv-box">
            <li class="rv-row"><span class="rv-ic" aria-hidden="true"><Gauge size={16} /></span><span class="rv-m"><span class="rv-t">{t('From 20 km a ride counts for your pace')}</span><span class="rv-s">{t('shorter rides stay saved')}</span></span></li>
            <li class="rv-row"><span class="rv-ic" aria-hidden="true"><Coffee size={16} /></span><span class="rv-m"><span class="rv-t">{t('A stop of {n} minutes or more is a pause', { n: PAUSE_MIN })}</span><span class="rv-s">{t('shorter stops count as moving time')}</span></span></li>
            <li class="rv-row"><span class="rv-ic" aria-hidden="true"><Route size={16} /></span><span class="rv-m"><span class="rv-t">{t('A ride on a trip day goes to that trip')}</span><span class="rv-s">{t('chosen for you, you can change it')}</span></span></li>
            <li class="rv-row"><span class="rv-ic" aria-hidden="true"><TriangleAlert size={16} /></span><span class="rv-m"><span class="rv-t">{t('Your file stays on this device')}</span><span class="rv-s">{t('nothing is uploaded')}</span></span></li>
          </ul>
        </section>
        <section class="rv-sec" aria-labelledby="rmore-h">
          <div class="rv-h"><div><h2 id="rmore-h">{t('More')}</h2></div></div>
          <ul class="rv-box">
            <li><a class="rv-row" href="#/debrief/pace"><span class="rv-ic" aria-hidden="true"><Gauge size={18} /></span><span class="rv-m"><span class="rv-t">{t('Your pace')}</span>{#if pace.mine}<span class="rv-s num">{t('Your pace now: {kmh} km/h', { kmh: num(pace.kmh) })}</span>{/if}</span><ChevronRight class="rv-chev" size={18} aria-hidden="true" /></a></li>
            <li><a class="rv-row" href="#/debrief/logbook"><span class="rv-ic" aria-hidden="true"><BookOpen size={18} /></span><span class="rv-m"><span class="rv-t">{t('Logbook')}</span></span><ChevronRight class="rv-chev" size={18} aria-hidden="true" /></a></li>
            {#if firstBike}<li><a class="rv-row" href={bikesHash({ tab: 'care', bike: firstBike.id, view: 'import' })}><span class="rv-ic" aria-hidden="true"><Plus size={18} /></span><span class="rv-m"><span class="rv-t">{t('Import rides')}</span><span class="rv-s">{t('Strava export or Garmin files · the file stays on this device')}</span></span><ChevronRight class="rv-chev" size={18} aria-hidden="true" /></a></li>{/if}
          </ul>
        </section>
      </div>
    </div>
  {/if}
</div>

<style>
  .crumb {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px 4px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .crumb a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--ink-3);
    text-decoration: none;
  }
  .crumb a:hover {
    color: var(--ink);
    text-decoration: underline;
  }
  .crumb [aria-current] {
    color: var(--ink);
  }
  .rides > .page-sub {
    margin-bottom: 18px;
  }
  .foot {
    margin: 6px 2px 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .up {
    display: grid;
    gap: 8px;
  }
  /* the dashed card: choose a GPX file */
  .drop {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 14px;
    padding: 16px;
    border: 1.5px dashed var(--line-strong);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .drop .rv-m {
    flex: 1 1 260px;
  }
  .drop .rv-t {
    font-weight: 600;
  }
  .drop .rv-ic {
    background: var(--hi-soft);
    color: var(--ink);
  }
  .pickbtn {
    position: relative;
    min-height: 44px;
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
  .warnmsg,
  .okmsg {
    margin: 0;
    padding: 12px 16px;
    border-radius: var(--radius-card);
    background: var(--warn-soft);
  }
  .okmsg {
    margin: 0 0 18px;
    background: var(--ok-soft);
  }
  .stats {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .stats > li + li {
    border-top: 1px solid var(--line);
  }
  .srow {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    padding: 6px 0;
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
  .stats + .foot {
    margin: 0 0 10px;
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
    padding: 0 0 8px 12px;
  }
  .plist li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 12px;
    padding: 4px 0;
    border-top: 1px solid var(--line);
    font-size: var(--fs-small);
  }
  .plist .q {
    color: var(--ink-3);
  }
  .plist b {
    text-align: right;
    min-width: 56px;
    font-weight: 500;
  }
  .savebox {
    display: grid;
    gap: 8px;
    margin-top: 12px;
  }
  .savebox .foot {
    margin-top: 0;
  }
  .savebox p {
    margin: 0;
  }
  /* GPX-Weg: the card after saving, the route card, what saving does */
  .saved,
  .warncard {
    position: relative;
    display: grid;
    gap: 8px;
    margin: 14px 0;
    border: 1px solid var(--ok);
  }
  .warncard {
    border-color: var(--warn);
  }
  .warncard p,
  .how li {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
  .sk {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    color: var(--ok);
    font-size: var(--fs-tiny);
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .sk.warn {
    color: var(--warn);
  }
  .sh {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
    padding-right: 36px;
  }
  .sl {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .sl li {
    display: grid;
    grid-template-columns: 18px 1fr;
    gap: 8px;
    align-items: start;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
  .sl li :global(svg) {
    margin-top: 2px;
    color: var(--ink-3);
  }
  .sl li.ok :global(svg) {
    color: var(--ok);
  }
  .sl b {
    color: var(--ink);
  }
  .sacts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    margin: 4px 0 0;
  }
  .sacts .btn {
    min-height: 44px;
  }
  .x {
    position: absolute;
    top: 8px;
    right: 8px;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  .howto {
    margin: 12px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .howto summary {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--ink);
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .howto p {
    margin: 6px 0;
  }
  .how {
    display: grid;
    gap: 6px;
    margin: 12px 0 0;
    padding-left: 34px;
  }
  .what {
    display: grid;
    gap: 6px;
    margin-top: 6px;
    padding-top: 10px;
    border-top: 1px solid var(--line);
  }
  .rv-tag.nw {
    margin-left: 8px;
    vertical-align: 1px;
  }
  .dupmsg {
    margin: 12px 0 0;
  }
  .chk2 {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    min-height: 44px;
    padding: 6px 0;
    cursor: pointer;
  }
  .chk2 input,
  .chk input {
    width: 22px;
    height: 22px;
    margin: 1px 0 0;
    flex: none;
    accent-color: var(--ink);
  }
  .chk2 small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .acts2 {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
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
    font-size: var(--fs-small);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .nums {
    margin: 0;
  }
  .nums dd,
  .nums dt {
    margin: 0;
  }
  .nums .rv-tile {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .rv-tag.lt {
    margin-top: 4px;
  }
  .tot .rv-t {
    font-weight: 600;
  }
  .tot .rv-v {
    color: var(--ink);
    font-weight: 600;
  }
  .lr {
    flex-wrap: wrap;
  }
  .lr .rv-m {
    flex: 1 1 200px;
  }
  .lr .acts {
    display: flex;
    gap: 8px;
    margin-left: auto;
  }
  .lr .btn {
    min-height: 44px;
  }
  .cmp {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-small);
  }
  .cmp th,
  .cmp td {
    padding: 10px 8px;
    text-align: right;
    white-space: nowrap;
  }
  .cmp tbody tr {
    border-top: 1px solid var(--line);
  }
  .cmp th[scope='row'] {
    padding-left: 0;
    text-align: left;
    color: var(--ink-2);
    font-weight: 400;
    white-space: normal;
  }
  .cmp thead th {
    font-size: var(--fs-tiny);
    font-weight: 600;
    color: var(--ink-3);
  }
  .cmp td:last-child {
    padding-right: 0;
  }
  .cmp .d {
    color: var(--ink-3);
  }
  @media (max-width: 400px) {
    .cmp th,
    .cmp td {
      padding: 8px 4px;
    }
  }
  .box .rv-row + .rv-row,
  .box .attach + .rv-row {
    border-top: 1px solid var(--line);
  }
  .attach {
    display: grid;
    gap: 8px;
    padding: 12px 0;
  }
  .attach p {
    margin: 0;
  }
  .del {
    margin: 0;
    padding: 0 12px;
  }
  .rprof {
    margin-top: 12px;
  }
</style>
