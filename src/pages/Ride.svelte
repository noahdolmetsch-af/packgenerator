<script>
  import { localDay } from '../lib/localday.js';
  /**
   * On the way (v0.29.0, Noah 1a, 7a, 8a; was "Ride day", v0.18.0): what do I need NOW? The block of
   * the hour on top ("Now"): what to wear, eat, drink, and light. Quick notes for the debrief in two taps
   * ("Was missing", "Not needed", "Broken" go straight into it). The whole day in blocks, the weather hour
   * by hour, the route and "What is where" fold into rows.
   * (v0.18.0, answers 1a-8a): the screen for the day on the bike. Big text, readable in
   * the sun. What is in which bag (answer 2b: the list of all bags, no search), the day's stage with
   * its elevation profile (4a and 4b), the weather hour by hour at the start and the finish,
   * and notes that go into the debrief. Works offline with what was saved last.
   */
  import { liveQuery } from 'dexie';
  import { t, tn, num, locale, nameOf } from '../lib/i18n.svelte.js';
  import { db } from '../lib/db.js';
  import { nextTrip } from '../lib/debrief.js';
  import { tripStats, touched } from '../lib/trips.js';
  import { ageText, FORECAST_DAYS } from '../lib/weather.js';
  import Profile from '../lib/ui/Profile.svelte';
  import { paceOf, PACE_KEY } from '../lib/pace.js';
  import { blockPlan, eveningPlan, DRINK_L_PER_H, HOT_C, HOT_EXTRA_L } from '../lib/blockplan.js';
  import { chargeList, chargeCount } from '../lib/charge.js';
  import ChargeList from '../lib/trip/ChargeList.svelte';
  import { dayIndex, addTime, planHours, stage, stageCount, isNonstop, blocks, blockHours, dayProfile, placeName, fetchHourly, rideHours, wxSummary, DEFAULT_START } from '../lib/ride.js';
  import { newNote, tripNotes, DEBRIEF_KINDS, noteToDebrief, dropNoteFromDebrief } from '../lib/notes.js';
  import { newDebrief } from '../lib/debrief.js';
  import { homeOf } from '../lib/dayride.js';
  import { sunTimes } from '../lib/blockplan.js';
  import { isInventory } from '../lib/gear.js';
  import TripBand from '../lib/trip/TripBand.svelte';
  import BaseCheck from '../lib/trip/BaseCheck.svelte';
  import { openTrip } from '../lib/nav.js';
  import '../lib/trip/trip.css';
  import { Shirt, Utensils, Droplet, Lightbulb, Pencil, ArrowRight, ArrowLeft, Clock, CloudSun, Search, Route as RouteIcon, ChevronRight, Plus, Minus, X, Mic, Moon, BedDouble, BatteryCharging } from '@lucide/svelte';

  const tripsQ = liveQuery(() => db.trips.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const bagsQ = liveQuery(() => db.containers.toArray());
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const debriefsQ = liveQuery(() => db.debriefs.toArray());
  const notesQ = liveQuery(() => db.notes.toArray());
  // v0.19.0: your pace from your rides (Debrief → Your pace), else the standard guess.
  const paceQ = liveQuery(() => db.settings.get(PACE_KEY));
  const pace = $derived(paceOf($paceQ?.value));

  const today = localDay();
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
  // v0.30.1 (Noah C1): a day without a start time starts at the hour the page was opened (today only).
  const nowStart = `${String(new Date().getHours()).padStart(2, '0')}:00`;
  const st = $derived(trip ? stage(trip, cur, pace, { today, nowStart }) : null);
  // v0.30.1 (Noah C1): sunset and the light also without a route or start place: the home place.
  const homeQ = liveQuery(() => db.settings.get('homePlace'));
  const sunPlace = $derived(st?.from ?? trip?.place ?? homeOf($homeQ?.value) ?? null);
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
    await db.trips.update(trip.id, touched(fields));
  }
  // v0.20.1: end the trip now (also before its last day) and go straight to its debrief.
  async function finish() {
    await change({ finished: localDay() });
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
  // v0.30.1 (Noah C1): also without a route: blocks by time from the trip's riding hours.
  const plan = $derived(st?.hours ? blocks(nonstop ? trip : { ...trip, plan: null }, st) : []);
  // The weather of a block: from the start place in the first half, from the finish after.
  const blockHrs = (b) => {
    const places = saved?.places ?? [];
    const p = places.length > 1 && st.km && (b.kmFrom + b.kmTo) / 2 > st.km / 2 ? places[1] : places[0];
    return p ? blockHours(p.hours, b) : [];
  };
  // Per block: clothing, food and drink, light (answer 4b).
  const onTrip = $derived(stats ? stats.zones.flatMap((z) => z.entries.filter((e) => itemsById[e.itemId]).map((e) => ({ item: itemsById[e.itemId], qty: e.qty || 1, place: placeName(trip, z) }))) : []);
  const bp = $derived(plan.length ? blockPlan(plan, onTrip, { wxOf: blockHrs, place: sunPlace, tripWx: trip.wx ?? null }) : null);
  const names = (list) => list.map((w) => `${w.name} (${w.place})`).join(', ');

  /* ---------- v0.34.0 (L8, Noah a): the evening on a trip of several days ---------- */
  // Every day except the last: where you sleep, what to charge, what to lay out for tomorrow's first
  // block, and tomorrow morning's weather (its hourly forecast when loaded, else the trip weather).
  const nextSt = $derived(trip && !nonstop && cur < days - 1 ? stage(trip, cur + 1, pace, { today, nowStart }) : null);
  const nextSaved = $derived(nextSt?.date ? trip?.rideWx?.[nextSt.date] ?? null : null);
  const nextFirst = $derived.by(() => {
    if (!nextSt?.hours) return null;
    const first = blocks({ ...trip, plan: null }, nextSt).slice(0, 1);
    const p = nextSaved?.places?.[0];
    return first.length ? blockPlan(first, onTrip, { wxOf: (b) => (p ? blockHours(p.hours, b) : []), place: nextSt.from ?? sunPlace, tripWx: trip.wx ?? null }).rows[0] : null;
  });
  const eve = $derived(trip ? eveningPlan({ days: nonstop ? 1 : days, day: cur, date: st?.date ?? null, nextDate: nextSt?.date ?? null, overnight: trip.overnight, first: nextFirst, charge: chargeList(trip, items) }) : null);
  const eveCharged = $derived(eve ? chargeCount(trip, eve.charge, eve.date) : null);
  const nextTooEarly = $derived(nextSt?.date ? (new Date(`${nextSt.date}T00:00:00`) - new Date(`${today}T00:00:00`)) / 864e5 >= FORECAST_DAYS : true);
  let nextBusy = $state(false);
  let nextMsg = $state('');
  async function loadNextWx() {
    const from = nextSt.from ?? trip.place;
    if (!from) return;
    nextBusy = true;
    nextMsg = '';
    try {
      const wx = await fetchHourly([{ name: 'Start of the day', lat: from.lat, lon: from.lon }], nextSt.date, fetch, new Date());
      const cur0 = (await db.trips.get(trip.id))?.rideWx ?? {};
      await change({ rideWx: { ...cur0, [nextSt.date]: wx } });
    } catch {
      nextMsg = online ? t('The forecast could not be loaded. Try again later.') : t('No connection. The weather needs the internet; the last saved one stays.');
    }
    nextBusy = false;
  }
  const setNonstop = (on) => change({ nonstop: on, rideStart: {} });
  const dayName = (t) => new Date(`${t.slice(0, 10)}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short' });
  const dir = (pct) => (pct == null ? '' : `${Math.round(pct)} %`);

  /* ---------- notes for the debrief ---------- */
  const debrief = $derived(trip ? ($debriefsQ ?? []).find((d) => d.tripId === trip.id) ?? null : null);
  // v0.26.1 (AP20, Noah 19 a+b): a note here is a quick note with this trip and day: it stays in the
  // Inbox and the debrief shows it under "Notes on the way". Older notes in the debrief still show.
  const notes = $derived(trip ? tripNotes(debrief, $notesQ ?? [], trip.id) : []);
  let note = $state('');
  let noteMsg = $state('');
  async function saveNote(ev) {
    ev?.preventDefault();
    if (!note.trim()) return;
    const text = note;
    await once(async () => {
      await writeNote(text);
      note = '';
      quick = null;
    });
  }
  // v0.29.0 (Noah 8a): a note can carry an answer for the debrief ({ kind, itemId, name }); it goes
  // straight into the trip's debrief (a draft is made when there is none) and stays in the Inbox too.
  async function writeNote(text, debriefInfo = null) {
    const now = new Date().toISOString();
    const n = newNote({ text, page: 'ride', tripId: trip.id, bikeId: trip.bikeId ?? null, day: cur }, { id: `note-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, now });
    if (debriefInfo) n.debrief = debriefInfo;
    await db.transaction('rw', db.notes, db.debriefs, async () => {
      await db.notes.put(n);
      if (!debriefInfo) return;
      const d = (await db.debriefs.get(trip.id)) ?? newDebrief($state.snapshot(trip), now);
      await db.debriefs.put({ ...noteToDebrief(d, n), updatedAt: now });
    });
    noteMsg = debriefInfo ? t('Saved: {text}. It is in the debrief and in the Inbox.', { text }) : t('Saved. It shows in the debrief and in the Inbox.');
    setTimeout(() => (noteMsg = ''), 4000);
  }
  let quick = $state(null); // 'missing' | 'unused' | 'broken' | 'text'
  let missName = $state('');
  const kindText = { missing: '{name} was missing', unused: '{name} not needed', broken: '{name} broken' };
  // v0.30.1 (Noah C2): one tap = one note. A tap while a note is being saved does nothing, and the
  // same answer for the same item on this trip is not written a second time.
  let writing = false;
  const flash = (msg) => {
    noteMsg = msg;
    setTimeout(() => (noteMsg = ''), 4000);
  };
  async function once(fn) {
    if (writing) return;
    writing = true;
    try {
      await fn();
    } finally {
      writing = false;
    }
  }
  const noted = (kind, itemId, name = '') =>
    ($notesQ ?? []).some((n) => n.tripId === trip.id && n.debrief?.kind === kind && (itemId ? n.debrief.itemId === itemId : !n.debrief.itemId && (n.debrief.name ?? '').toLowerCase() === name.toLowerCase()));
  function quickItem(kind, item) {
    quick = null;
    return once(async () => {
      const text = t(kindText[kind], { name: nameOf(item) });
      if (noted(kind, item.id)) return flash(t('Already noted: {text}', { text }));
      await writeNote(text, { kind, itemId: item.id, name: item.name });
    });
  }
  function quickMissing(ev) {
    ev.preventDefault();
    const name = missName.trim();
    if (!name) return;
    const have = items.find((i) => isInventory(i) && (i.name.toLowerCase() === name.toLowerCase() || (i.nameDe ?? '').toLowerCase() === name.toLowerCase()));
    missName = '';
    quick = null;
    return once(async () => {
      const text = t(kindText.missing, { name: have ? nameOf(have) : name });
      if (noted('missing', have?.id ?? null, have?.name ?? name)) return flash(t('Already noted: {text}', { text }));
      await writeNote(text, { kind: 'missing', itemId: have?.id ?? null, name: have?.name ?? name });
    });
  }
  const notOnTrip = $derived(trip ? items.filter((i) => isInventory(i) && !trip.entries.some((e) => e.itemId === i.id)) : []);
  async function dropNote(n) {
    if (!confirm(t('Delete this note?'))) return;
    if (n.noteId) {
      const rec = ($notesQ ?? []).find((x) => x.id === n.noteId);
      return db.transaction('rw', db.notes, db.debriefs, async () => {
        await db.notes.delete(n.noteId);
        const d = rec?.debrief ? await db.debriefs.get(trip.id) : null;
        if (d) await db.debriefs.put(dropNoteFromDebrief(d, rec));
      });
    }
    const d = $state.snapshot(debrief);
    const i = Number(n.key.slice(5));
    d.rideNotes = d.rideNotes.filter((_, k) => k !== i);
    await db.debriefs.put(d);
  }
  const time = (iso) => new Date(iso).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });

  /* ---------- v0.29.0 (Noah 7a): the block of now ---------- */
  const nowAt = () => {
    const d = new Date();
    const p = (x) => String(x).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  let clock = $state(nowAt());
  $effect(() => {
    const id = setInterval(() => (clock = nowAt()), 60000);
    return () => clearInterval(id);
  });
  const rows = $derived(bp?.rows ?? []);
  // The block running now; before the start the first one, after the end the last one.
  const nowIdx = $derived.by(() => {
    if (!rows.length) return -1;
    const i = rows.findIndex((b) => b.startAt <= clock && clock < b.endAt);
    if (i >= 0) return i;
    return clock >= rows.at(-1).endAt ? rows.length - 1 : 0;
  });
  const isNow = $derived(nowIdx >= 0 && rows[nowIdx].startAt <= clock && clock < rows[nowIdx].endAt);
  const nowB = $derived(nowIdx >= 0 ? rows[nowIdx] : null);
  const nextB = $derived(nowIdx >= 0 ? rows[nowIdx + 1] ?? null : null);
  const hh = (hm) => hm?.slice(0, 2).replace(/^0/, '') ?? '';
  const span = (b) => `${hh(b.from)}–${hh(b.to)}`;
  const tempText = (b) => (b.temp ? (b.temp.lo === b.temp.hi ? `${b.temp.lo} °C` : `${b.temp.lo}–${b.temp.hi} °C`) : '');
  const wearText = (b, n) => (n === 0 ? (b.wear.length ? t('Start with {list}', { list: b.wear.map((w) => w.name).join(', ') }) : t('Every-ride clothes')) : [b.on.length ? t('On: {list}', { list: b.on.map((w) => w.name).join(', ') }) : '', b.off.length ? t('Off: {list}', { list: b.off.map((w) => w.name).join(', ') }) : ''].filter(Boolean).join(' · ') || t('No change'));
  const foodText = (b) => b.food.map((f) => `${f.n} × ${f.name}`).join(', ') || t('Nothing planned');
  const lightText = (b) => (!b.light ? t('Not needed') : b.light.kind === 'on' ? (b.light.km == null ? t('On from about {time}', { time: b.light.at }) : t('On from about {time} (km {km})', { time: b.light.at, km: b.light.km })) : b.light.kind === 'off' ? (b.light.km == null ? t('On until about {time}', { time: b.light.at }) : t('On until about {time} (km {km})', { time: b.light.at, km: b.light.km })) : t('Dark the whole block'));
  // v0.40.0: the one word of a block in the list: rain, light or a change of clothes, else nothing.
  const keyword = (b, n) => (b.rest ? '' : b.wet ? t('rain likely') : b.light ? t('light|block') : n > 0 && (b.on.length || b.off.length) ? t('change clothes') : '');
  // v0.30.1 (Noah C1): where a block is: km on a route, else its hours.
  const where = (b) => (b.kmFrom == null ? t('{n} h riding', { n: num(Math.round(((new Date(`${b.endAt}:00Z`) - new Date(`${b.startAt}:00Z`)) / 36e5) * 10) / 10) }) : `km ${b.kmFrom}–${b.kmTo}`);
  const refillText = (b) => (b.refillKm.length ? t('Refill at km {list}', { list: b.refillKm.join(', ') }) : b.refillAt?.length ? t('Refill at about {list}', { list: b.refillAt.join(', ') }) : '');
  const sunset = $derived.by(() => {
    const p = sunPlace;
    if (!st?.date || !p) return '';
    const s = sunTimes(st.date, p.lat, p.lon);
    return s ? new Date(s.set).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) : '';
  });
  const tripStarted = $derived(trip?.startDate ? trip.startDate <= today : false);
  // L7: before the start there is nothing to end yet: the next step leads back to Pack (the debrief opens from the last day on).
  const ahead = $derived(!!trip?.startDate && !tripStarted && !trip.finished);
  const kicker = $derived(!trip ? '' : tripStarted ? (days > 1 ? t('On the way · day {n} of {total}', { n: cur + 1, total: days }) : t('On the way|step')) : t('On the way · from {date}', { date: dateOf(0) }));
  // Opened once when shown; afterwards it stays as you leave it.
  const openOnce = (node, open) => { node.open = open; };
  const goNote = () => document.getElementById('note-h')?.scrollIntoView({ block: 'center' });

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

{#snippet go()}{#if ahead}<a class="btn hi go" href="#/pack?day" onclick={() => openTrip(trip.id)}><ArrowLeft size={20} aria-hidden="true" />{t('Back to packing')}</a>{:else}<button type="button" class="btn hi go" onclick={finish}>{trip.finished ? t('Open the debrief') : t('Next: Debrief')}<ArrowRight size={20} aria-hidden="true" /></button>{/if}{/snippet}
{#snippet pen()}<button type="button" class="tp-icon-btn" aria-label={t('Note for the debrief')} onclick={goNote}><Pencil size={22} aria-hidden="true" /></button>{/snippet}

{#if !trip}
  {#if $tripsQ}<p class="card">{t('No trip yet. Create one in')} <a href="#/pack">{t('Plan|stage')}</a>.</p>{/if}
{:else}
<div class="ride trip-page">
  <TripBand {trip} tab="ride" {kicker} compact action={go} aside={pen} hint={ahead ? '' : t('End the trip when you are back home.')} />
  {#if !trip.finished && !Array.isArray(trip.packs)}<BaseCheck {trip} />{/if}
  <div class="tp-grid2 r">
    <div class="col">
      <!-- Noah 7a: the days, then the block of now, on top. -->
      <div class="days">
        {#if days > 1}
          <nav class="tp-chips" aria-label={t('Days')}>
            {#each Array.from({ length: days }, (_, n) => n) as n (n)}
              <button type="button" class="tp-chip" aria-pressed={n === cur} aria-current={n === cur ? 'true' : undefined} onclick={() => (day = n)}>{dayLabel(n)}</button>
            {/each}
          </nav>
        {:else if trip.startDate}<span class="tp-chip" aria-current="true">{dayLabel(0)}</span>{/if}
        {#if st.km}<span class="tp-muted tp-small num sum">{num(st.km)} km · {st.gainM ?? '–'} {t('m up|short')} · {t('Arrive about')} {st.arrive}</span>{/if}
      </div>

      {#if nowB}
        <section class="tp-card now" aria-labelledby="now-h">
          <div class="nowh">
            <div>
              <p class="tt">{isNow ? t('Now') : nowIdx === 0 ? t('First block') : t('Last block')} · {t('Block {n} of {total}', { n: nowIdx + 1, total: rows.length })}</p>
              <h2 id="now-h" class="num">{t('{span} h', { span: span(nowB) })}</h2>
              <span class="tp-muted tp-small num">{nowB.rest ? t('stop at km {km}', { km: nowB.kmTo }) : where(nowB)}{nowB.name && !/^(Block|Etappe) \d/.test(nowB.name) ? ` · ${nowB.name}` : ''}</span>
            </div>
            {#if nowB.temp}<div class="wxp"><b class="num">{tempText(nowB)}</b>{nowB.wet ? t('rain likely') : t('dry')}{#if nowB.wxFrom === 'trip'}<small>{t('trip weather')}</small>{/if}</div>{/if}
          </div>
          {#if nowB.note}<p class="bn tp-small">{nowB.note}</p>{/if}
          {#if !nowB.rest}
            <ul class="do">
              <li><span class="k"><Shirt size={20} aria-hidden="true" /></span><div><span class="lab">{t('Wear')}</span><span class="val">{wearText(nowB, nowIdx)}</span></div></li>
              <li><span class="k"><Utensils size={20} aria-hidden="true" /></span><div><span class="lab">{t('Eat')}</span><span class="val">{foodText(nowB)}</span>{#if nowB.food.some((f) => f.short)}<small class="warn">{t('Not enough on the bike: from here on, buy {list} on the way', { list: nowB.food.filter((f) => f.short).map((f) => `${f.short} × ${f.name}`).join(', ') })}</small>{/if}</div></li>
              <li><span class="k"><Droplet size={20} aria-hidden="true" /></span><div><span class="lab">{t('Drink')}</span><span class="val num">{t('about {n} L to drink', { n: num(nowB.drinkL) })}{#if refillText(nowB)} <small>· {refillText(nowB)}</small>{/if}</span></div></li>
              <li><span class="k"><Lightbulb size={20} aria-hidden="true" /></span><div><span class="lab">{t('Light')}</span><span class="val" class:warn={nowB.light && !bp.lights.length}>{lightText(nowB)}{#if !nowB.light && sunset} <small>· {t('Sunset {time}', { time: sunset })}</small>{:else if nowB.light && !bp.lights.length} <small>· {t('no light on this trip')}</small>{:else if nowB.light} <small>· {names(bp.lights)}</small>{/if}</span></div></li>
            </ul>
          {/if}
        </section>
        {#if nextB}
          <div class="tp-card after"><span class="tt num">{t('Then {span}', { span: span(nextB) })}</span><div class="tp-small">{nextB.rest ? t('stop at km {km}', { km: nextB.kmTo }) : [wearText(nextB, nowIdx + 1), foodText(nextB), t('about {n} L to drink', { n: num(nextB.drinkL) }), nextB.light ? lightText(nextB) : ''].filter(Boolean).join(' · ')}</div></div>
        {/if}
      {:else if !st.km}
        <p class="tp-card tp-muted">{t('No route yet. Load the GPX in')} <a href="#/pack">{t('Plan|stage')}</a> {t('under "Trip conditions" (••• menu).')}</p>
      {/if}

      {#if eve}
        <!-- v0.34.0 (L8): the evening, folded; it opens by itself once the day's riding is over. -->
        <details class="tp-fold eve" use:openOnce={!!st.endAt && clock >= st.endAt}>
          <summary><Moon size={20} aria-hidden="true" /><span id="eve-h">{t('Evening')}</span><span class="r">{#if eve.overnight}<i class="tp-badge">{eve.overnight === 'lodging' ? t('Lodging') : t('Outdoor')}</i>{/if}{#if eve.charge.length}<i class="tp-badge num" class:ok={eveCharged.done === eveCharged.total}>{t('Charge {done}/{n}', { done: eveCharged.done, n: eveCharged.total })}</i>{/if}<ChevronRight class="chev" size={18} aria-hidden="true" /></span></summary>
          <ul class="do">
            <li><span class="k"><BedDouble size={20} aria-hidden="true" /></span><div><span class="lab">{t('Night')}</span><span class="val">{#if eve.overnight === 'lodging'}{t('Lodging')}{:else if eve.overnight === 'outdoor'}{t('Outdoor')}{:else}<span class="tp-muted">{t('Not set')}</span>{' '}<small>· <a href="#/pack" onclick={() => openTrip(trip.id)}>{t('Set it in Plan')}</a></small>{/if}</span></div></li>
            <li><span class="k"><BatteryCharging size={20} aria-hidden="true" /></span><div><span class="lab">{t('Charge tonight')}</span><ChargeList {trip} {items} night={eve.date} /></div></li>
            <li><span class="k"><Shirt size={20} aria-hidden="true" /></span><div><span class="lab">{t('Lay out for tomorrow')}</span><span class="val">{eve.layOut.length ? names(eve.layOut) : eve.everyRide ? t('Every-ride clothes') : t('Not known yet')}</span></div></li>
            <li><span class="k"><CloudSun size={20} aria-hidden="true" /></span><div><span class="lab">{t('Tomorrow morning')}</span>
              {#if eve.morning}<span class="val num">{t('{span} h', { span: span(eve.morning) })}{#if eve.morning.temp}{` · ${tempText(eve.morning)} · ${eve.morning.wet ? t('rain likely') : t('dry')}`}{/if}{#if eve.morning.wxFrom === 'trip'}{' '}<small>· {t('trip weather')}</small>{:else if !eve.morning.temp}{' '}<small>· {t('no weather yet')}</small>{/if}</span>
              {:else}<span class="val tp-muted">{t('Not known yet')}</span>{/if}
              {#if nextSt?.date && !nextSaved && !nextTooEarly && (nextSt.from ?? trip.place)}<button type="button" class="tp-link" disabled={nextBusy || !online} onclick={loadNextWx}>{nextBusy ? t('Loading …') : t("Load tomorrow's forecast")}</button>{/if}
              {#if nextMsg}<small class="warn" role="status">{nextMsg}</small>{/if}
            </div></li>
          </ul>
        </details>
      {/if}
    </div>

    <div class="col">
      <!-- Noah 8a: quick notes for the debrief: two taps, no typing. -->
      <section class="tp-card" aria-labelledby="note-h">
        <h2 id="note-h"><Pencil size={18} aria-hidden="true" />{t('Note for the debrief')}</h2>
        <div class="tp-chips qn" role="group" aria-label={t('Quick note')}>
          {#each DEBRIEF_KINDS as k (k.key)}
            <button type="button" class="tp-chip" aria-pressed={quick === k.key} aria-expanded={quick === k.key} onclick={() => (quick = quick === k.key ? null : k.key)}>{#if k.key === 'missing'}<Plus size={16} aria-hidden="true" />{:else if k.key === 'unused'}<Minus size={16} aria-hidden="true" />{:else}<X size={16} aria-hidden="true" />{/if}{t(k.name)}</button>
          {/each}
          <button type="button" class="tp-chip quiet" aria-pressed={quick === 'text'} aria-expanded={quick === 'text'} onclick={() => (quick = quick === 'text' ? null : 'text')}><Mic size={16} aria-hidden="true" />{t('Free text')}</button>
        </div>
        {#if quick === 'unused' || quick === 'broken'}
          <div class="pick" role="group" aria-label={quick === 'unused' ? t('What did you not need?') : t('What broke?')}>
            <p class="tp-small tp-muted">{quick === 'unused' ? t('What did you not need?') : t('What broke?')}</p>
            {#each bags as z (z.key)}
              <span class="lbl">{placeName(trip, z)}</span>
              <div class="tp-chips">{#each z.entries.filter((e) => itemsById[e.itemId]) as e (e.itemId)}<button type="button" class="tp-chip" onclick={() => quickItem(quick, itemsById[e.itemId])}>{nameOf(itemsById[e.itemId])}</button>{/each}</div>
            {/each}
          </div>
        {:else if quick === 'missing'}
          <form class="noteform" onsubmit={quickMissing}>
            <input class="inp" list="ride-gear" bind:value={missName} placeholder={t('What was missing, e.g. Chamois cream')} aria-label={t('What was missing')} />
            <datalist id="ride-gear">{#each notOnTrip as i (i.id)}<option value={nameOf(i)}></option>{/each}</datalist>
            <button type="submit" class="btn ink" disabled={!missName.trim()}>{t('Save note')}</button>
          </form>
        {:else if quick === 'text'}
          <form class="noteform" onsubmit={saveNote}>
            <textarea class="inp" rows="2" bind:value={note} placeholder={t('e.g. Puncture at km 80, the rain gloves were too thin')} aria-label={t('Note for the debrief')}></textarea>
            <button type="submit" class="btn ink" disabled={!note.trim()}>{t('Save note')}</button>
          </form>
        {/if}
        <p class="ok tp-small" role="status">{noteMsg}</p>
        {#if notes.length}
          <ul class="notes">
            {#each notes as n (n.key)}
              <li><i class="tp-badge num">{days > 1 ? `${t('Day {n}', { n: n.day + 1 })} · ` : ''}{time(n.at)}</i><span>{n.text}</span><button type="button" class="tp-link" onclick={() => dropNote(n)} aria-label={t('Remove this note')}>{t('Remove')}</button></li>
            {/each}
          </ul>
        {/if}
      </section>

      {#if bp}
        <!-- v0.19.5 (answer 4b): every block with clothing, food and drink, light; the current one marked. -->
        <section class="tp-card" aria-labelledby="blocks-h">
          <h2 id="blocks-h"><Clock size={18} aria-hidden="true" />{t('The day in blocks')}<span class="r">{nonstop && trip.plan?.schedule?.length ? t('your time plan') : t('3 h each')}</span></h2>
          <ol class="timeline blocks">
            <!-- v0.40.0 (design check R2): one short line per block (time · °C · one word); the whole
                 block (clothes, food, drink, light) opens with a tap, so the Now card is not repeated. -->
            {#each bp.rows as b, n (b.startAt)}
              {@const key = keyword(b, n)}
              <li class:cur={n === nowIdx} class:rest={b.rest} aria-current={n === nowIdx && isNow ? 'time' : undefined}>
                <details>
                  <summary><span class="num tm">{dayName(b.startAt)} {span(b)}</span><span class="one"><b class="num">{b.rest ? t('stop at km {km}', { km: b.kmTo }) : where(b)}</b>{#if b.temp}{' · '}<span class="num">{tempText(b)}</span>{/if}{#if key}{' · '}{key}{/if}</span><ChevronRight class="chev" size={16} aria-hidden="true" /></summary>
                  {#if !b.rest}<p class="full">{wearText(b, n)} · {foodText(b)} · {t('about {n} L to drink', { n: num(b.drinkL) })}{#if refillText(b)}{' · '}{refillText(b)}{/if}{#if b.light}{' · '}{lightText(b)}{/if}</p>{/if}
                  {#if b.note}<small>{b.note}</small>{/if}
                </details>
              </li>
            {/each}
          </ol>
          <details class="how">
            <summary>{t('How this is worked out')}</summary>
            <p class="tp-muted tp-small">{nonstop && trip.plan?.schedule?.length ? t('Your time plan from the logbook.') : t('Blocks of 3 hours.')} {#if st.km}{t('km at {kmh} km/h, the same guess as the riding time', { kmh: Math.round((st.km / st.hours) * 10) / 10 })}{pace.mine ? ` ${tn(pace.n, '(your pace from {n} ride)', '(your pace from {n} rides)')}` : ''}.{:else}{st.hoursGuess ? t('No route and no riding hours: {n} h assumed from the start.', { n: st.hours }) : t('No route: {n} h riding from the start (riding hours of the trip).', { n: num(st.hours) })}{/if} {t('Drinking {l} L per hour ({hot} L from {c} °C) is a guess', { l: DRINK_L_PER_H, hot: DRINK_L_PER_H + HOT_EXTRA_L, c: HOT_C })}{bp.capL ? t('; your bottles hold {n} L', { n: Math.round(bp.capL * 10) / 10 }) : t('; no bottle on this trip')}. {t('Sunset and sunrise are computed for the start of the day.')}{saved ? '' : ` ${t('Load the forecast below for the weather per block.')}`}</p>
          </details>
          {#if nonstop && planHours(trip) > st.hours + 1}<p class="tp-small warn">{t('Your time plan has {plan} h of riding, the route about {route} h. The plan ends where the route ends; is the GPX the whole route?', { plan: Math.round(planHours(trip)), route: st.hours })}</p>{/if}
        </section>
      {/if}

      <!-- Answer 4a: the day's stage: start time, nonstop, profile. -->
      <!-- v0.30.1 (Noah C1): also without a route, for the start time of the day. -->
      {#if st.km || st.hours}
      <details class="tp-fold" use:openOnce={!bp}>
        <summary><RouteIcon size={20} aria-hidden="true" /><span>{nonstop ? t('Nonstop') : days > 1 ? t('Stage {n}', { n: cur + 1 }) : t('Stage')}</span><span class="r num">{st.hours ? `${t('Start')} ${st.start}` : ''}<ChevronRight class="chev" size={18} aria-hidden="true" /></span></summary>
        <div class="in">
          {#if st.km}
            <label class="ns"><input type="checkbox" checked={nonstop} onchange={(e) => setNonstop(e.currentTarget.checked)} /> {t('Nonstop: one stage through the night')}</label>
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
            {:else}<p class="tp-muted tp-small">{t('Load the GPX again in Pack to see the elevation profile.')}</p>{/if}
            {#if days > 1 && !nonstop}<p class="tp-muted tp-small">{prof ? t('The route is shared out evenly over {n} days (dark: this stage).', { n: days }) : t('The route is shared out evenly over {n} days.', { n: days })}</p>{/if}
          {:else}
            <div class="times">
              <label>{t('Start')} <input class="inp" type="time" value={st.start} onchange={(e) => setStart(e.currentTarget.value)} /></label>
              <p>{t('Back about')} <b class="num">{st.arrive}</b> <small>{st.hoursGuess ? t('{n} h assumed', { n: num(st.hours) }) : t('{n} h riding', { n: num(st.hours) })}</small></p>
            </div>
            <p class="tp-muted">{t('No route yet. Load the GPX in')} <a href="#/pack">{t('Plan|stage')}</a> {t('under "Trip conditions" (••• menu).')}</p>
          {/if}
        </div>
      </details>
      {/if}

      <!-- Answer 3a: the weather hour by hour, start and finish. Answer 5a: saved for offline. -->
      <details class="tp-fold wxfold">
        <summary><CloudSun size={20} aria-hidden="true" /><span id="wx-h">{t('Weather hour by hour')}</span><span class="r">{saved ? ageText(saved.fetchedAt) : ''}<ChevronRight class="chev" size={18} aria-hidden="true" /></span></summary>
        <div class="in">
          {#if !wxPlaces.length}
            <p class="tp-muted">{t('No place yet. Add the start place or the GPX in')} <a href="#/pack">{t('Plan|stage')}</a>.</p>
          {:else if tooEarly && !saved}
            <p class="tp-muted">{t('The hourly forecast comes {n} days before the day.', { n: FORECAST_DAYS })}</p>
          {:else}
            {#if saved}
              <div class="wx">
                {#each saved.places as p (p.name)}
                  {@const hrs = rideHours(p.hours, st.startAt, st.endAt)}
                  <div class="wxp2">
                    <h3>{t(p.name)}</h3>
                    <p class="sum">{wxSummary(hrs)}</p>
                    <table>
                      <thead><tr><th>h</th><th>°C</th><th>{t('Rain')}</th><th>{t('Wind')}</th></tr></thead>
                      <tbody>
                        {#each hrs as x (x.h)}
                          <tr class:wet={(x.rainMm ?? 0) >= 0.5 || (x.rainPct ?? 0) >= 50} class:newday={x.h === 0}><td class="num">{x.h === 0 || x === hrs[0] ? `${dayName(x.t)} ` : ''}{x.h}</td><td class="num">{x.temp != null ? Math.round(x.temp) : '–'}</td><td class="num">{x.rainMm ? `${x.rainMm} mm` : ''} <small>{dir(x.rainPct)}</small></td><td class="num">{x.wind != null ? Math.round(x.wind) : '–'}{#if x.gust != null && x.gust >= 30}<small> ({Math.round(x.gust)})</small>{/if}</td></tr>
                        {/each}
                      </tbody>
                    </table>
                  </div>
                {/each}
              </div>
            {/if}
            <p class="wxbar">
              {#if saved}<span class="tp-muted">{t('Loaded {ago}', { ago: ageText(saved.fetchedAt) })}{online ? '' : ` · ${t('offline')}`}</span>{/if}
              <button type="button" class="btn sm" disabled={wxBusy || !online} onclick={loadWx}>{wxBusy ? t('Loading …') : saved ? t('Update') : t('Load the forecast')}</button>
            </p>
            {#if wxMsg}<p class="warn" role="status">{wxMsg}</p>{/if}
          {/if}
        </div>
      </details>

      <!-- Answer 2b: every bag with what is in it. -->
      <details class="tp-fold">
        <summary><Search size={20} aria-hidden="true" /><span id="where-h">{t('What is where')}</span><span class="r num">{tn(stats.count, '{n} item', '{n} items')}<ChevronRight class="chev" size={18} aria-hidden="true" /></span></summary>
        <div class="in bags">
          {#each bags as z (z.key)}
            <div class="bag">
              <b>{placeName(trip, z)} <span class="num tp-muted">{z.entries.length}</span></b>
              <ul>{#each z.entries as e (e.itemId)}<li>{itemsById[e.itemId] ? nameOf(itemsById[e.itemId]) : e.itemId}{#if (e.qty || 1) > 1}<small> × {e.qty}</small>{/if}</li>{/each}</ul>
            </div>
          {/each}
        </div>
      </details>
    </div>
  </div>
</div>
{/if}

<style>
  .col { min-width: 0; }
  .days { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; margin: 0 0 12px; }
  .days .sum { flex-basis: 100%; }
  @media (min-width: 900px) { .days .sum { flex-basis: auto; } }
  .now { border: 2px solid var(--ink); padding: 0; overflow: hidden; }
  .nowh { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 4px 12px; padding: 14px 16px 10px; }
  .nowh > div:first-child { flex: 1 1 160px; min-width: 0; }
  .tt { margin: 0; font-size: 13px; font-weight: 600; color: var(--ok); }
  .nowh h2 { margin: 0; font: 700 24px/1.2 var(--font-body); }
  .wxp { margin-left: auto; text-align: right; font-size: 14px; color: var(--ink-2); }
  .wxp b { display: block; font-size: 22px; color: var(--ink); }
  .wxp small { display: block; color: var(--ink-3); font-size: 12px; }
  .bn { margin: 0; padding: 0 16px 10px; color: var(--ink-3); }
  .do { list-style: none; margin: 0; padding: 0; }
  .do li { display: grid; grid-template-columns: 40px minmax(0, 1fr); gap: 10px; padding: 12px 16px; border-top: 1px solid var(--paper-2); align-items: start; }
  .k { width: 40px; height: 40px; border-radius: 10px; background: var(--paper-2); display: grid; place-items: center; color: var(--ink-2); }
  .lab { display: block; font-size: 13px; font-weight: 500; color: var(--ink-3); }
  .val { display: block; font-size: 17px; font-weight: 600; line-height: 1.3; overflow-wrap: break-word; }
  .val small, .do small { font-weight: 400; font-size: 14px; color: var(--ink-2); }
  .do small.warn { display: block; }
  .after { display: flex; gap: 12px; align-items: flex-start; }
  .after .tt { color: var(--ink-3); white-space: nowrap; padding-top: 1px; }
  .qn { margin-top: 10px; }
  .pick { margin-top: 12px; display: grid; gap: 6px; }
  .pick p { margin: 0; }
  .pick .lbl { margin: 6px 0 0; }
  .noteform { display: grid; gap: 8px; margin-top: 12px; }
  .noteform .btn { justify-self: start; min-height: 44px; }
  .ok { margin: 8px 0 0; color: var(--ink-2); font-weight: 600; }
  .ok:empty { display: none; }
  .notes { list-style: none; margin: 10px 0 0; padding: 0; font-size: 15px; }
  .notes li { display: flex; flex-wrap: wrap; gap: 4px 8px; align-items: center; padding: 6px 0; border-top: 1px solid var(--paper-2); }
  .notes li span { flex: 1 1 50%; min-width: 0; overflow-wrap: break-word; }
  .timeline { list-style: none; margin: 10px 0 0; padding: 0; }
  .timeline li { padding: 0; border-top: 1px solid var(--paper-2); font-size: 14px; overflow-wrap: break-word; }
  .timeline summary { display: grid; grid-template-columns: 92px minmax(0, 1fr) auto; gap: 10px; align-items: center; min-height: 44px; padding: 6px 0; list-style: none; cursor: pointer; }
  .timeline summary::-webkit-details-marker { display: none; }
  .timeline summary :global(.chev) { color: var(--ink-3); transition: transform 0.15s; }
  .timeline details[open] summary :global(.chev) { transform: rotate(90deg); }
  .timeline .full { margin: 0 0 10px 102px; color: var(--ink-2); }
  @media (max-width: 479px) { .timeline .full { margin-left: 0; } }
  .timeline li .tm { color: var(--ink-3); }
  .timeline li.cur { background: var(--paper-2); margin: 0 -16px; padding: 0 16px 0 13px; border-left: 3px solid var(--ink); }
  .timeline li.cur .tm { color: var(--ink); font-weight: 700; }
  .timeline li.rest { color: var(--ink-3); }
  .timeline small { display: block; color: var(--ink-3); }
  .how summary { min-height: 44px; display: flex; align-items: center; cursor: pointer; color: var(--ink-2); font-size: 14px; text-decoration: underline; }
  .how p { margin: 0 0 8px; }
  .ns { display: flex; gap: 8px; align-items: center; min-height: 44px; margin-bottom: 6px; }
  .ns input { width: 22px; height: 22px; }
  .nums { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .nums div { display: flex; flex-direction: column; }
  .nums b { font: 700 26px/1.2 var(--font-body); }
  .nums span { color: var(--ink-3); font-size: 14px; }
  .times { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 20px; margin-top: 12px; }
  .times label { display: flex; gap: 8px; align-items: center; }
  .times input { min-height: 44px; font-size: 17px; width: auto; }
  .times p { margin: 0; }
  .times small { color: var(--ink-3); font-size: 14px; }
  .prof { margin-top: 12px; }
  .wx { display: grid; gap: 14px; }
  @media (min-width: 640px) { .wx { grid-template-columns: 1fr 1fr; } }
  .wxp2 { min-width: 0; }
  .wxp2 h3 { margin: 0; font-size: 16px; }
  .sum { margin: 2px 0 6px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; font-size: 15px; }
  th { text-align: left; font-size: 13px; color: var(--ink-3); font-weight: 600; }
  td, th { padding: 3px 4px; border-bottom: 1px solid var(--paper-2); }
  tr.wet td { background: #e3eef8; }
  tr.newday td { border-top: 2px solid var(--ink-3); }
  td small { color: var(--ink-3); }
  .wxbar { display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center; justify-content: space-between; margin: 10px 0 0; }
  .bags { display: grid; gap: 10px; }
  @media (min-width: 640px) { .bags { grid-template-columns: 1fr 1fr; } }
  .bag { min-width: 0; }
  .bag ul { margin: 4px 0 0; padding-left: 20px; overflow-wrap: break-word; }
  .warn { color: #a03a00; }
  /* v0.34.0 (L8): the evening is quiet: smaller values than the block of now. */
  .eve .do li:first-child { border-top: 1px solid var(--paper-2); }
  .eve .val { font-size: 16px; font-weight: 500; }
  .eve .do small a { color: inherit; }
</style>
