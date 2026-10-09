<script>
  /**
   * Today (Heute). v0.46.0 «Startseite neu» (Noah, 9.10.2026, answers 1a 2b 3a 4b 5a+menu 6-33a 34b):
   * a calm cockpit instead of many big tiles, top to bottom (a phone stacks it in the same order):
   *
   *  1. Greeting band: "Good morning, Noah." and the weather in one sentence (home forecast); beside it
   *     the suggestion of the day (a day ride when it stays dry, "Other bike").
   *  2. The next trip as a compact card: countdown, name, bike · items · weight · km, the steps as thin
   *     bars, ONE button for the current step, a quiet setup photo; several trips: "+2 more trips ▾"
   *     (the 0.35 switcher) and a swipe on a phone. Test trips ("test" in the name) never lead here.
   *  3. "What do you want to do?": 12 buttons (phone 8), the last "All 16 functions" (lib/home/functions.js).
   *  4. "Important today" (at most 3 rows, urgent first, one action each; a bike job can be done right
   *     here) beside "Tried it yet?" (one function never used, "Next ›", "You use 9 of 16 · Level 2").
   *  5. The bikes as four small cards; 6. the last 12 months in one row with the series.
   *  Evening (from 18:00): "Review today" and "Charge batteries" come first in Important today.
   *  A milestone (10th trip, 1000 km on a bike, the first night out) is a quiet row for a day.
   *  "Customise the start page" switches sections on and off and moves them (settings "homeLayout").
   *
   * Kept from before: First steps for a new user (until its three steps are done), "How was {trip}?"
   * with "All good" (v0.24.1), the ride day opening by itself (v0.20), "Your data" and the footer.
   * The rules are pure and tested: lib/home/heute.js, lib/home/functions.js, today.js, schedule.js.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { localDay } from '../lib/localday.js';
  import DataPanel from '../lib/DataPanel.svelte';
  import { LAST_BACKUP, LAST_IMPORT, backupDue, downloadBackup } from '../lib/backup.js';
  import { backupAfterTrip } from '../lib/todos.js';
  import { knownWeight, isInventory } from '../lib/gear.js';
  import { sortBikes, bikesHash } from '../lib/bikes.js';
  import { withVisits, tripPrep, tyreSetup } from '../lib/workshop.js';
  import { tripSchedule, stepWords, STEP_NAME, weatherKnown } from '../lib/schedule.js';
  import { shopList, shopCount } from '../lib/shop.js';
  import { layerSuggest, openRows } from '../lib/layers.js';
  import { bikeCare, eventPrep, eventPrepLine, isShortRide } from '../lib/readiness.js';
  import { tripStats } from '../lib/trips.js';
  import { onTripDay } from '../lib/ride.js';
  import { demoState } from '../lib/demo.js';
  import { quickDebrief, templateOffer, templateName, nextTrip, learningsFor } from '../lib/debrief.js';
  import TemplateOffer from '../lib/debrief/TemplateOffer.svelte';
  import { openNew, openNote, openTrip, openPrep, addItem, wantBike, take, dayRide } from '../lib/nav.js';
  import { todayFocus, openDebrief, endedOn } from '../lib/today.js';
  import { t, tn, num, locale, lang, setLang, nameOf } from '../lib/i18n.svelte.js';
  import { hasBike, domainOf, domainName } from '../lib/domains.js';
  import { phone } from '../lib/media.svelte.js';
  import { newsHint, newerThan, SEEN_KEY, BEFORE } from '../lib/whatsnew.js';
  import { HOME_PLACE, HOME_FORECAST, usable, needsFetch, knowCards, wearWhat } from '../lib/know.js';
  import { openTodos } from '../lib/todos.js';
  import { weightText } from '../lib/gear.js';
  import { homeForecast } from '../lib/home-weather.js';
  import { toWx } from '../lib/weather.js';
  import { dayRidePlan, daySource, rideDate, lastBikeId } from '../lib/dayride.js';
  import { readyLight, quickHints, dueAll } from '../lib/quickcare.js';
  import { chargeList, chargeCount } from '../lib/charge.js';
  import { TIPS, TIPS_KEY, tipPossible, usedTips, isUsed, tapTip, updateTips } from '../lib/tips.js';
  import { PACE_KEY, paceOf } from '../lib/pace.js';
  import { SETS_KEY } from '../lib/sets.js';
  import { TEMPLATES_KEY } from '../lib/templates.js';
  import { standalone } from '../lib/install.js';
  import { homeTrips, testTrips, archiveChanges, greeting, weatherLine, dayDry, dayPart, countdown, soonTrips, milestoneLevels, milestoneStep, milestonesNow, milestoneText, MILESTONE_KEY, LAYOUT_KEY, layoutOf } from '../lib/home/heute.js';
  import { FUNCTIONS, USAGE_KEY, usageOf, dataUsed, usedFunctions, levelOf, untried } from '../lib/home/functions.js';
  import { countUse } from '../lib/home/usage.js';
  import { recordCare, undoCare } from '../lib/home/care-tap.js';
  import { yearReview, tripDone } from '../lib/yearreview.js';
  import InProgress from '../lib/trip/InProgress.svelte';
  import ActionGrid from '../lib/home/ActionGrid.svelte';
  import TryCard from '../lib/home/TryCard.svelte';
  import BikeCards from '../lib/home/BikeCards.svelte';
  import YearRow from '../lib/home/YearRow.svelte';
  import Customize from '../lib/home/Customize.svelte';
  import WearToday from '../lib/home/WearToday.svelte';
  import FlowCard from '../lib/home/FlowCard.svelte';
  import HomePlaceForm from '../lib/know/HomePlaceForm.svelte';
  import { PartyPopper } from '@lucide/svelte';

  /* ---------- the records ---------- */
  const tripsQ = liveQuery(() => db.trips.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const visitsQ = liveQuery(() => db.visits.toArray());
  const bagsQ = liveQuery(() => db.containers.toArray());
  const tasksQ = liveQuery(() => db.maintenance.toArray());
  const debriefsQ = liveQuery(() => db.debriefs.toArray());
  const notesQ = liveQuery(() => db.notes.toArray());
  const ridesQ = liveQuery(() => db.rides.toArray());
  const learnQ = liveQuery(() => db.learnings.toArray());
  // the setup photos Today may show: a trip's own, else the bike's main photo (Noah 11a)
  const photosQ = liveQuery(() => db.photos.filter((p) => !!p.main || !!p.tripId).toArray());
  const SKEYS = ['riderWeightG', TEMPLATES_KEY, USAGE_KEY, LAYOUT_KEY, 'userName', MILESTONE_KEY, SETS_KEY, HOME_PLACE, TIPS_KEY, PACE_KEY];
  const setQ = liveQuery(async () => {
    const rows = await db.settings.bulkGet(SKEYS);
    return Object.fromEntries(SKEYS.map((k, i) => [k, rows[i]?.value ?? null]));
  });
  const metaQ = liveQuery(async () => {
    const [file, folder, imp, fc] = await Promise.all([db.meta.get(LAST_BACKUP), db.meta.get('backupFolder'), db.meta.get(LAST_IMPORT), db.meta.get(HOME_FORECAST)]);
    return { last: [file?.at, folder?.lastWrite].filter(Boolean).sort().at(-1) ?? null, imp: imp ?? null, fc: fc ?? null };
  });
  const demoQ = liveQuery(() => demoState(db));

  const allTrips = $derived($tripsQ ?? []);
  // Noah 10a: test trips and archived ones never lead on Today
  const trips = $derived(homeTrips(allTrips));
  const items = $derived($itemsQ ?? []);
  const visits = $derived($visitsQ ?? []);
  const debriefs = $derived($debriefsQ ?? []);
  const bikes = $derived(sortBikes($bikesQ ?? []).map((b) => withVisits(b, visits)));
  const tasks = $derived($tasksQ ?? []);
  const S = $derived($setQ ?? {});
  const templates = $derived(S[TEMPLATES_KEY] ?? []);
  const notes = $derived(($notesQ ?? []).filter((n) => n.status === 'open'));
  const loaded = $derived(!!$tripsQ && !!$itemsQ);
  const ready = $derived(loaded && !!$bikesQ && !!$visitsQ && !!$tasksQ && !!$debriefsQ && !!$setQ && !!$metaQ && !!$notesQ && !!$ridesQ);
  const itemsById = $derived(Object.fromEntries(items.map((i) => [i.id, i])));

  /* ---------- the clock: greeting, evening rows ---------- */
  let now = $state(new Date());
  $effect(() => {
    const id = setInterval(() => (now = new Date()), 60_000);
    return () => clearInterval(id);
  });
  const today = $derived(localDay(now));
  const evening = $derived(dayPart(now.getHours()) === 'evening' && now.getHours() >= 18);

  /* ---------- v0.35.0: "New in the app" once after an update ---------- */
  let newsN = $state(0);
  let newsChecked = false;
  $effect(() => {
    if (newsChecked || !loaded || !$bikesQ) return;
    newsChecked = true;
    let seen = null;
    try {
      seen = localStorage.getItem(SEEN_KEY);
    } catch {
      return; // private mode: no line, nothing stored
    }
    const h = newsHint(seen, !!(allTrips.length || items.length || $bikesQ.length));
    try {
      if (h.mark) localStorage.setItem(SEEN_KEY, h.mark);
    } catch {
      /* private mode */
    }
    newsN = h.show ? newerThan(seen ?? BEFORE).reduce((n, e) => n + e.points.length, 0) : 0;
  });

  /* ---------- 1. greeting and weather (Noah 18a, 19a, 20a) ---------- */
  const place = $derived(S[HOME_PLACE] ?? null);
  const fc = $derived.by(() => {
    const raw = $metaQ?.fc;
    if (!place || !raw || !usable(place, raw, now.getTime())) return null;
    return { ...raw, days: (raw.days ?? []).map((d) => ({ ...d, rain: toWx([d])?.rain ?? null })) };
  });
  let fetched = false;
  $effect(() => {
    if (fetched || !$setQ || !$metaQ || !place || !navigator.onLine || !needsFetch(place, $metaQ.fc)) return;
    fetched = true;
    homeForecast(db); // saves into meta; the greeting follows the saved forecast
  });
  const hello = $derived(greeting(now.getHours(), S.userName ?? ''));
  const wx = $derived(fc ? weatherLine(fc, now) : null);
  const dateLine = $derived([now.toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' }), place?.name?.split(',')[0]].filter(Boolean).join(' · '));
  let placeOpen = $state(false);

  // The suggestion of the day: a day ride when the day of the ride stays dry (before 14:00 today, else
  // tomorrow), on the bike of the last ride or the best ready one; "Other bike" goes round the bikes.
  let otherBike = $state(null);
  const rideDay = $derived(rideDate(now));
  const tripOnRideDay = $derived(trips.some((x) => !x.skipped && !x.finished && x.startDate && onTripDay(x, rideDay)));
  const suggestBikeId = $derived.by(() => {
    if (otherBike && bikes.some((b) => b.id === otherBike)) return otherBike;
    const last = lastBikeId(trips, bikes, today);
    const tone = (b) => readyLight(b, { tasks, visits, today }).tone;
    const lastBike = bikes.find((b) => b.id === last);
    if (lastBike && tone(lastBike) !== 'due') return last;
    return bikes.find((b) => ['ok', 'soon'].includes(tone(b)))?.id ?? last;
  });
  const suggestion = $derived.by(() => {
    if (!ready || !bikes.length || tripOnRideDay || !fc) return null;
    if (!dayDry(fc, rideDay, rideDay === today ? now.getHours() : 9)) return null;
    const plan = dayRidePlan(trips, bikes, { now, bikeId: suggestBikeId });
    if (!plan) return null;
    const src = daySource(trips);
    return { bike: plan.bike, hours: plan.hours, n: src?.entries?.length ?? 0, fromLast: !!src, tomorrow: rideDay !== today };
  });
  function startDayRide() {
    countUse('dayride');
    dayRide(suggestion?.bike?.id ?? null);
  }
  function nextBike() {
    const i = bikes.findIndex((b) => b.id === suggestion?.bike?.id);
    otherBike = bikes[(i + 1) % bikes.length]?.id ?? null;
  }

  /* ---------- 2. the trip card ---------- */
  const focus = $derived(loaded ? todayFocus(trips, debriefs, today) : null);
  const lead = $derived(focus?.trip ?? null);
  const next = $derived(nextTrip(trips, today));
  // Noah 7a, 31a: the trip Today leads with, then the other trips still to come (swipe, "1 / 3 ›")
  const cardTrips = $derived.by(() => {
    const soon = soonTrips(trips, today);
    return lead ? [lead, ...soon.filter((x) => x.id !== lead.id)] : soon;
  });
  let cardIdx = $state(0);
  const shown = $derived(cardTrips.length ? cardTrips[Math.min(cardIdx, cardTrips.length - 1)] : null);
  const isLead = $derived(!!shown && !!lead && shown.id === lead.id);
  const ask = $derived(isLead && !!focus?.ask);
  const shownBike = $derived(shown ? bikes.find((b) => b.id === shown.bikeId) ?? null : null);
  const stats = $derived(shown ? tripStats(shown, items, $bagsQ ?? [], shownBike, S.riderWeightG) : null);
  // The facts the schedule needs (schedule.js is pure), as in v0.34.0, for the trip shown.
  function ctxFor(tr) {
    const b = hasBike(tr) ? bikes.find((x) => x.id === tr.bikeId) : null;
    let service = null;
    if (b && !isShortRide(tr)) {
      const rows = (tripPrep(b, tr, tasks, tyreSetup(b, visits), today)?.rows ?? []).filter((r) => r.group === 'bike');
      service = { n: rows.length, late: rows.some((r) => r.late), href: bikesHash({ tab: 'care', bike: b.id, open: true }) };
    }
    return {
      service,
      weather: { known: weatherKnown(tr), open: hasBike(tr) ? openRows(layerSuggest(tr, items), tr).length : 0 },
      shop: shopCount(shopList(tr, itemsById)),
      charge: null,
      debriefDone: debriefs.some((d) => d.tripId === tr.id && d.status === 'done'),
    };
  }
  const ctx = $derived(shown && !ask ? ctxFor(shown) : null);
  const sched = $derived(ctx ? tripSchedule(shown, ctx, today) : null);
  const stepNow = $derived(sched?.next ? stepWords(sched.next, shown, ctx, today) : null);
  const bars = $derived(sched ? sched.steps.filter((s) => s.key !== 'plan' && s.key !== 'debrief') : []);
  const cd = $derived(shown ? countdown(shown, now) : null);
  const photo = $derived.by(() => {
    if (!shown) return null;
    const ps = $photosQ ?? [];
    return (ps.find((p) => p.tripId === shown.id) ?? (shown.bikeId ? ps.find((p) => p.bikeId === shown.bikeId && p.main) : null))?.data ?? null;
  });
  const meta = $derived.by(() => {
    if (!shown || !stats) return '';
    const who = hasBike(shown) ? shown.bike : t(domainName(domainOf(shown)));
    const w = stats.gearG ? knownWeight(stats.gearG, stats.gearMissing) : null;
    const km = shown.route?.km ? `${num(Math.round(shown.route.km))} km` : null;
    // once packing has started, how far it is (the same words as Pack)
    const es = shown.entries ?? [];
    const pk = es.filter((e) => e.packed).length;
    const pct = pk ? t('{n} % packed', { n: Math.round((pk / es.length) * 100) }) : null;
    return [who, tn(stats.count, '{n} item', '{n} items'), w, km, pct].filter(Boolean).join(' · ');
  });
  const startLine = $derived(shown?.startDate ? new Date(`${shown.startDate}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'long' }) : '');
  function go(dir) {
    if (cardTrips.length < 2) return;
    cardIdx = (Math.min(cardIdx, cardTrips.length - 1) + dir + cardTrips.length) % cardTrips.length;
  }
  // Noah 31a: a swipe sideways on the card (touch); a short tap stays a tap.
  let sx = null;
  const pdown = (e) => {
    if (e.pointerType === 'touch' || e.pointerType === 'pen') sx = { x: e.clientX, y: e.clientY };
  };
  const pup = (e) => {
    if (!sx) return;
    const dx = e.clientX - sx.x;
    const dy = e.clientY - sx.y;
    sx = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  };

  /* ---------- v0.24.1 (Noah 3a): "How was {trip}?" → "All good" saves the debrief right here ---------- */
  let quick = $state(null);
  let quickTimer;
  const UNDO_MS = 8000;
  async function allGood(of = lead) {
    const trip = $state.snapshot(of);
    const prev = debriefs.find((x) => x.tripId === trip.id) ?? null;
    const record = quickDebrief(trip, prev ? structuredClone($state.snapshot(prev)) : null);
    const offer = templateOffer(trip, templates, trips) ? templateName(trip, bikes.find((b) => b.id === trip.bikeId), templates) : null;
    await db.transaction('rw', db.debriefs, db.trips, async () => {
      await db.debriefs.put(record);
      await db.trips.update(trip.id, { status: 'done' });
    });
    clearTimeout(quickTimer);
    quick = { trip, prev, prevStatus: trip.status, offer, undo: true };
    quickTimer = setTimeout(() => {
      if (!quick) return;
      quick.undo = false;
      if (!quick.offer) quick = null;
    }, UNDO_MS);
  }
  async function undoQuick() {
    const q = $state.snapshot(quick);
    clearTimeout(quickTimer);
    quick = null;
    await db.transaction('rw', db.debriefs, db.trips, async () => {
      if (q.prev) await db.debriefs.put(q.prev);
      else await db.debriefs.delete(q.trip.id);
      await db.trips.update(q.trip.id, { status: q.prevStatus });
    });
  }
  $effect(() => () => clearTimeout(quickTimer));

  /* ---------- v0.30.2 (L9): First steps for a new user, until its three steps are done ---------- */
  const FIRST = 'home.firstSteps';
  const steps = $derived({ bike: bikes.length > 0, gear: items.length > 0, trip: allTrips.length > 0 });
  const stepsAll = $derived(steps.bike && steps.gear && steps.trip);
  let firstOn = $state(
    (() => {
      try {
        return localStorage.getItem(FIRST) === '1';
      } catch {
        return false;
      }
    })(),
  );
  $effect(() => {
    if (!loaded || !$bikesQ) return;
    const empty = !steps.bike && !steps.gear && !steps.trip;
    if (empty && !firstOn) firstOn = true;
    else if (stepsAll && firstOn) firstOn = false;
    else return;
    try {
      if (firstOn) localStorage.setItem(FIRST, '1');
      else localStorage.removeItem(FIRST);
    } catch {
      /* private mode: only while the app is empty */
    }
  });
  const showFirst = $derived(loaded && !!$bikesQ && firstOn && !stepsAll);

  /* ---------- 3. the 16 functions (Noah 12a, 13a, 15a) ---------- */
  const usage = $derived(usageOf(S[USAGE_KEY]));
  const unweighed = $derived(items.filter((i) => isInventory(i) && i.weightG == null).length);
  const due = $derived(dueAll(bikes, { tasks, visits, today }));
  const badges = $derived({ weigh: unweighed, care: due.points, note: notes.length });
  const used = $derived(usedFunctions(usage, dataUsed({ trips: allTrips, items, bikes: $bikesQ ?? [], debriefs, templates, rides: $ridesQ ?? [], notesN: ($notesQ ?? []).length, sets: S[SETS_KEY] ?? [] })));
  let wearOpen = $state(false);
  let wearDlg = $state();
  $effect(() => {
    if (wearOpen && wearDlg && !wearDlg.open) wearDlg.showModal();
    if (!wearOpen && wearDlg?.open) wearDlg.close();
  });
  $effect(() => {
    if (take('home.wear')) wearOpen = true;
    const on = () => take('home.wear') && (wearOpen = true);
    window.addEventListener('pg:wear', on);
    return () => window.removeEventListener('pg:wear', on);
  });
  /** One of the 16 functions: counted (the order and "Tried it yet?"), then done. */
  function runFn(f) {
    countUse(f.id);
    if (f.go.href) {
      if (location.hash === f.go.href) window.dispatchEvent(new HashChangeEvent('hashchange'));
      else location.hash = f.go.href;
      return;
    }
    const what = f.go.run;
    if (what === 'dayride') dayRide(suggestion?.bike?.id ?? null);
    else if (what === 'trip') openNew('list');
    else if (what === 'wear') wearOpen = true;
    else if (what === 'note') notes.length ? (location.hash = '#/inbox') : openNote('');
    else if (what === 'km') openNew('km');
  }

  /* ---------- 4b. "Tried it yet?" (Noah 16a, 17a, 28a) ---------- */
  const tipUsed = $derived(
    usedTips({ trips: allTrips, items, bikes: $bikesQ ?? [], visits, debriefs, templates, sets: S[SETS_KEY] ?? [], notesN: ($notesQ ?? []).length, homePlace: place, pace: paceOf(S[PACE_KEY]), lastBackup: $metaQ?.last ?? null, demo: $demoQ ?? null, langSet: (() => { try { return localStorage.getItem('lang') != null; } catch { return false; } })(), standalone: standalone() }),
  );
  function runTip(x) {
    updateTips(db, (s) => tapTip(s, x.id, today));
    if (x.go.href) return (location.hash = x.go.href);
    const what = x.go.run;
    if (what === 'dayRide') dayRide();
    else if (what === 'note') openNote('');
    else if (what === 'receipt') openNote(t('Workshop receipt: '));
    else if (what === 'km') openNew('km');
    else if (what === 'data') openData();
    else if (what === 'lang') setLang(lang.v === 'de' ? 'en' : 'de');
    else if (what === 'homePlace') placeOpen = true;
    else if (what === 'backup') downloadBackup(db);
  }
  const tryList = $derived.by(() => {
    if (!ready) return [];
    const fns = untried(used).map((f) => ({ id: f.id, text: t(f.pitch), button: t('Try it'), run: () => runFn(f) }));
    const tips = TIPS.filter((x) => x.go.run !== 'install' && tipPossible(x, { trips: allTrips, items, bikes: $bikesQ ?? [] }, today) && !isUsed(S[TIPS_KEY], x.id, tipUsed) && !fns.some((f) => f.id === x.id)).map((x) => ({ id: `tip-${x.id}`, text: t(x.text), button: x.id === 'lang' ? (lang.v === 'de' ? t('Switch to English') : t('Switch to German')) : t(x.button), run: () => runTip(x) }));
    return [...fns, ...tips];
  });

  /* ---------- 4a. Important today (Noah 26a, 27a, 32a, 10a, 21a) ---------- */
  const backup = $derived.by(() => {
    if (!$metaQ || !items.length || $demoQ) return { due: false, days: null };
    const b = backupDue($metaQ.last);
    return backupAfterTrip($metaQ.last, debriefs) ? { ...b, due: true, afterTrip: true } : b;
  });
  let backingUp = $state(false);
  async function backupNow() {
    backingUp = true;
    try {
      await downloadBackup(db);
    } finally {
      backingUp = false;
    }
  }
  const debrief = $derived(loaded ? openDebrief(focus, trips, debriefs, today) : null);
  const alsoToday = $derived(trips.filter((x) => x !== lead && !x.skipped && !x.finished && !x.id.startsWith('demo') && onTripDay(x, today)));
  const prep = $derived.by(() => {
    const p = next && hasBike(next) ? eventPrep(next, tasks, today) : null;
    return p?.total && p.status === 'open' ? p : null;
  });
  const tests = $derived(testTrips(allTrips));
  const milestones = $derived(milestonesNow(S[MILESTONE_KEY], today));
  // Milestones: the levels of now against the stored ones (first time: stored, nothing celebrated).
  // v0.46.0 (Gesamttest S6): read in ONE transaction, not from the live queries: right after an import
  // they change one by one (the new trips with the old, empty bikes), so the levels were stored half
  // (bikes {}, or 0 trips) and written again a moment later; with 0 trips stored first, the import
  // itself could later be celebrated as "Your 10th trip".
  async function stepMilestones(day) {
    await db.transaction('rw', db.trips, db.bikes, db.debriefs, db.settings, async () => {
      const [all, bikeRows, drs, stored] = await Promise.all([db.trips.toArray(), db.bikes.toArray(), db.debriefs.toArray(), db.settings.get(MILESTONE_KEY)]);
      if (!all.length && !bikeRows.length) return; // nothing to count yet
      const home = homeTrips(all);
      const done = home.filter((x) => tripDone(x, drs, day));
      const nights = yearReview({ today: day, trips: home, debriefs: drs, rides: [] }).ride.nights + 0;
      const cur = milestoneLevels({ tripsDone: done.length, bikes: bikeRows, nights: done.some((x) => Number(x.days) > 1 && x.overnight !== 'lodging' && x.overnight !== 'none') ? Math.max(1, nights) : 0 });
      const r = milestoneStep(stored?.value ?? null, cur, day);
      if (r.changed) await db.settings.put({ key: MILESTONE_KEY, value: r.state });
    });
  }
  $effect(() => {
    if (!ready || !$ridesQ || (!allTrips.length && !($bikesQ ?? []).length)) return; // nothing to count yet
    void [allTrips, debriefs, $bikesQ, S[MILESTONE_KEY]]; // run again when one of them changes
    stepMilestones(today).catch(() => {});
  });
  const SOON_KM = 60;
  const careRows = $derived.by(() => {
    const out = [];
    for (const b of bikes) {
      const c = bikeCare(b, { tasks, visits, today });
      if (c?.status === 'due') {
        const one = c.rows.length === 1 ? c.rows[0] : null;
        const kind = one?.part === 'chain' && one.kind === 'km' ? 'chain' : one?.part === 'tyres' && one.kind === 'time' ? 'sealant' : null;
        const text = kind === 'chain' ? t('{bike}: lube the chain', { bike: b.name }) : kind === 'sealant' ? t('{bike}: top up the sealant', { bike: b.name }) : tn(c.rows.length, '{bike}: {n} point due', '{bike}: {n} points due', { bike: b.name });
        out.push({ key: `care:${b.id}`, tone: 'bad', text, act: kind ? { label: kind === 'chain' ? t('Lubed ✓') : t('Done ✓'), care: { bikeId: b.id, kind } } : { label: t('View|care'), href: c.href } });
        continue;
      }
      const h = quickHints(b, { visits, today });
      if (h.chain && h.chain.left > 0 && h.chain.left <= SOON_KM) out.push({ key: `chain:${b.id}`, tone: 'warn', text: t('{bike}: lube the chain in {km} km', { bike: b.name, km: num(h.chain.left) }), act: { label: t('Lubed ✓'), care: { bikeId: b.id, kind: 'chain' } } });
    }
    return out;
  });
  /* Noah 34b: what "Good to know" had to do (know.js knowCards) is a row here now: the demo, what is
     still open, the wear forecast, template suggestions, the best upgrade, long unused items and a
     learning for the next trip. The weather, weekend, season, trend and pace cards are not repeated
     (the greeting, the trip card and the last 12 months say it). */
  const todoText = (r) =>
    r.key === 'bikes' ? tn(r.n, 'Weigh {n} bike', 'Weigh {n} bikes')
    : r.key === 'pace' ? t('Load a few GPX rides')
    : r.key === 'check' ? tn(r.n, 'Check {n} item in the inventory', 'Check {n} items in the inventory')
    : r.key === 'favourites' ? t('Apply the favourites file')
    : t('Ride your first real trip with the app');
  const wearLine = (r) => {
    const what = t(wearWhat(r), { km: num(r.every) });
    return t('{what} {bike}: due in about {km} km', { what, bike: r.bike, km: num(r.left) });
  };
  const knowRows = $derived.by(() => {
    if (!ready || !$learnQ) return [];
    const pace = paceOf(S[PACE_KEY]);
    const todos = openTodos({ bikes, items, pace, debriefs, trips }).filter((x) => !(x.key === 'trip' && showFirst));
    const tips = learningsFor(next, $learnQ, 1);
    const cards = knowCards({ today, todos, demo: $demoQ ?? null, next, tips, pace, bikes, trips, debriefs, visits, items, containers: $bagsQ ?? [], templates, placeLoading: true });
    const out = [];
    for (const c of cards) {
      const d = c.data;
      if (c.key === 'demo') out.push({ key: 'demo', tone: 'info', text: `${t('Demo running')}: ${t('No backups while the demo runs; your own data waits until you end it.')}`, act: { label: t('Open your data'), run: openData } });
      else if (c.key === 'todo') {
        const f = d.rows[0];
        const run = f.action === 'data' ? openData : () => openNew('list');
        out.push({ key: 'todo', tone: c.prio === 1 ? 'warn' : 'quiet', text: todoText(f), act: f.href ? { label: t('Do it now'), href: f.href } : { label: t('Do it now'), run } });
      } else if (c.key === 'wear') out.push({ key: 'wear', tone: 'quiet', text: wearLine(d.rows[0]), act: { label: t('Plan in Bike care'), href: bikesHash({ tab: 'care', bike: d.rows[0].bikeId, open: true }) } });
      else if (c.key === 'templates') out.push({ key: 'templates', tone: 'info', text: tn(d.n, '{n} suggestion for your templates', '{n} suggestions for your templates'), act: { label: t('Look at them'), href: '#/pack/templates' } });
      else if (c.key === 'upgrade') out.push({ key: 'upgrade', tone: 'quiet', text: t('{name}: {g} g lighter for CHF {chf} ({x} g per 100 CHF)', { name: nameOf(d.item), g: num(d.savedG), chf: num(d.chf), x: num(d.gPer100) }), act: { label: t('Open wishlist'), href: '#/gear?tab=wishlist' } });
      else if (c.key === 'unused') out.push({ key: 'unused', tone: 'quiet', text: `${d.full ? tn(d.items.length, '{n} item not on any trip for 12 months', '{n} items not on any trip for 12 months') : tn(d.items.length, '{n} item not on any trip since {date}', '{n} items not on any trip since {date}', { date: new Date(`${d.since}T00:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' }) })} · ${t('{w} in total', { w: weightText(d.g, d.missing) })}`, act: { label: t('Look through'), href: '#/gear?unused=1' } });
      else if (c.key === 'learnings') out.push({ key: 'learnings', tone: 'quiet', text: d.tip.rule, act: { label: t('All learnings'), href: '#/debrief/learnings' } });
    }
    return out;
  });
  const important = $derived.by(() => {
    if (!ready) return [];
    const rows = [];
    for (const m of milestones) rows.push({ key: `ms:${m.key}:${m.bikeId ?? ''}:${m.day}`, tone: 'party', text: milestoneText(m) });
    if (evening) {
      // Noah 32a: in the evening the day's review and charging come first
      const endedToday = trips.filter((x) => !x.skipped && x.entries?.length && endedOn(x) === today && !debriefs.some((d) => d.tripId === x.id && d.status === 'done'));
      for (const x of endedToday) rows.push({ key: `eve:${x.id}`, tone: 'eve', text: t('Review today: {trip}', { trip: x.title }), act: { label: t('Debrief'), href: `#/debrief/${encodeURIComponent(x.id)}`, trip: x.id } });
      const soon = soonTrips(trips, today).find((x) => x.startDate > today && x.startDate <= rideDateTomorrow(today)) ?? null;
      if (soon) {
        const list = chargeList(soon, items);
        const c = chargeCount(soon, list);
        if (c.total > c.done) rows.push({ key: 'charge', tone: 'eve', text: tn(c.total - c.done, 'Charge batteries: {n} device for {trip}', 'Charge batteries: {n} devices for {trip}', { trip: soon.title }), act: { label: t('Charge list'), href: '#/pack?charge', trip: soon.id } });
      }
    }
    if (debrief) rows.push({ key: 'debrief', tone: 'warn', text: t('Debrief still open: {title}', { title: debrief.title }), act: { label: t('All good'), run: () => allGood(debrief) } });
    if (backup.due) rows.push({ key: 'backup', tone: 'bad', text: `${t('Time for a backup')}: ${backup.days == null ? t('You have not saved a backup file yet.') : t('Your last backup is {n} days old.', { n: backup.days })}${$metaQ?.imp?.from ? ` ${t('Data from the backup of {date}. Newer state on the phone? Load its backup here.', { date: new Date($metaQ.imp.from).toLocaleDateString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) })}` : backup.afterTrip ? ` ${t('New debrief since the last backup: save one, then load it on the desktop.')}` : ''}`, act: { label: t('Download backup'), run: backupNow, busy: true } });
    rows.push(...careRows.filter((r) => r.tone === 'bad'));
    if (prep) rows.push({ key: 'prep', tone: prep.overdue ? 'bad' : 'warn', text: eventPrepLine(prep), act: { label: t('Tick off in the trip'), href: '#/pack', prep: next.id } });
    rows.push(...careRows.filter((r) => r.tone !== 'bad'));
    for (const x of alsoToday) rows.push({ key: `also:${x.id}`, tone: 'info', text: `${t('Also today: {title}', { title: x.title })}${x.bike ? ` · ${x.bike}` : ''}`, act: { label: t('Open the trip'), href: '#/pack', trip: x.id } });
    if (focus?.kind === 'debrief' && next) rows.push({ key: 'next', tone: 'info', text: t('Next trip: {title}', { title: next.title }), act: { label: t('Open the trip'), href: '#/pack', trip: next.id } });
    if (notes.length) rows.push({ key: 'inbox', tone: 'info', text: tn(notes.length, '{n} note to sort', '{n} notes to sort'), act: { label: t('Inbox'), href: '#/inbox' } });
    if (!bikes.length && !showFirst) rows.push({ key: 'nobike', tone: 'info', text: t('No bikes yet.'), act: { label: t('Add a bike'), href: '#/bikes', run: wantBike } });
    rows.push(...knowRows);
    if (newsN) rows.push({ key: 'news', tone: 'quiet', text: tn(newsN, 'New in the app: {n} update', 'New in the app: {n} updates'), act: { label: t('Show'), href: '#/features?news' } });
    if (tests.length) rows.push({ key: 'tests', tone: 'quiet', text: tn(tests.length, 'Clean up {n} test trip', 'Clean up {n} test trips'), act: { label: t('Clean up'), run: () => (cleanAsk = true) } });
    // milestones and the evening rows first, then the urgent ones (bad, warn), then the rest
    const rank = { party: 0, eve: 1, bad: 2, warn: 3, info: 4, quiet: 5 };
    return rows.map((r, i) => ({ r, i })).sort((a, b) => rank[a.r.tone] - rank[b.r.tone] || a.i - b.i).map((x) => x.r);
  });
  function rideDateTomorrow(day) {
    const d = new Date(`${day}T12:00:00`);
    d.setDate(d.getDate() + 1);
    return localDay(d);
  }
  let allRows = $state(false);
  const rowsShown = $derived(allRows ? important : important.slice(0, 3));
  let notice = $state(null); // { text, undo() } for a few seconds
  let noticeTimer;
  function say(text, undo) {
    clearTimeout(noticeTimer);
    notice = { text, undo };
    noticeTimer = setTimeout(() => (notice = null), 10000);
  }
  $effect(() => () => clearTimeout(noticeTimer));
  async function act(row) {
    const a = row.act;
    if (a.care) {
      countUse('care');
      const r = await recordCare(a.care.bikeId, a.care.kind, today);
      if (r) say(r.text, () => undoCare(r.undo));
      return;
    }
    if (a.prep) openPrep(a.prep);
    else if (a.trip) openTrip(a.trip);
    a.run?.();
  }
  // Noah 10a: clean up the test trips: asked here on the page (no browser question), archived, Undo.
  let cleanAsk = $state(false);
  async function cleanTests() {
    const before = $state.snapshot(tests);
    const ch = archiveChanges();
    await db.transaction('rw', db.trips, async () => {
      for (const x of before) await db.trips.update(x.id, ch);
    });
    cleanAsk = false;
    say(tn(before.length, '{n} test trip archived.', '{n} test trips archived.'), () => db.transaction('rw', db.trips, async () => {
      for (const x of before) await db.trips.put(x);
    }));
  }
  async function undoNotice() {
    const n = notice;
    clearTimeout(noticeTimer);
    notice = null;
    await n?.undo?.();
  }

  /* ---------- Customise (Noah 33a) ---------- */
  const layout = $derived(layoutOf(S[LAYOUT_KEY]));
  let customOpen = $state(false);
  const on = (key) => !layout.off.includes(key);

  /* ---------- Your data (v0.30.0: openData from anywhere opens it here) ---------- */
  let dataOpen = $state(false);
  let autoOpened = false;
  $effect(() => {
    if (loaded && !allTrips.length && !autoOpened) {
      autoOpened = true;
      dataOpen = true;
    }
  });
  let dataEl = $state();
  function openData() {
    dataOpen = true;
    queueMicrotask(() => dataEl?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
  $effect(() => {
    if (dataEl && take('home.data')) openData();
    const onData = () => take('home.data') && openData();
    window.addEventListener('pg:data', onData);
    return () => window.removeEventListener('pg:data', onData);
  });

  // Ride day (answer 1a): on the days of the trip the app opens the ride view, once a day.
  // v0.29.2 (Noah 6a): not on the day the trip was made: then Noah is still planning or packing.
  const madeToday = (tr) => !!tr?.createdAt && localDay(new Date(tr.createdAt)) === today;
  const riding = $derived(next && hasBike(next) && !madeToday(next) ? onTripDay(next, today) : false);
  $effect(() => {
    if (!riding) return;
    const key = 'ride.autoOpened';
    try {
      if (localStorage.getItem(key) === `${next.id}:${today}`) return;
      localStorage.setItem(key, `${next.id}:${today}`);
    } catch {
      return; // without storage it would open every time: better not at all
    }
    openTrip(next.id);
    location.hash = '#/ride';
  });

  let online = $state(navigator.onLine);
  $effect(() => {
    const update = () => (online = navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  });
</script>

{#snippet mark(done, n)}{#if done}<span class="mark ok" role="img" aria-label={t('Done|task')}>✓</span>{:else}<span class="mark" aria-hidden="true">{n}</span>{/if}{/snippet}

<!-- 1. greeting and weather, the suggestion of the day -->
{#snippet greetingS()}
  <section class="greet" class:solo={!suggestion} aria-labelledby="hello-h" data-section="greeting">
    <div class="hi-text">
      {#if !phone.matches}<span class="dl">{dateLine}</span>{/if}
      <h1 id="hello-h" class="hello">{hello}{#if wx}<br /><span class="wx" data-weather>{wx.text}</span>{/if}</h1>
      {#if !wx && ready}
        {#if !place}
          <button type="button" class="linkq" aria-expanded={placeOpen} onclick={() => (placeOpen = !placeOpen)}>{t('Set your home place for the weather')}</button>
        {/if}
      {/if}
      {#if placeOpen}<div class="pf"><HomePlaceForm onchosen={() => (placeOpen = false)} /></div>{/if}
    </div>
    {#if suggestion}
      <div class="sugg" data-suggestion>
        <span class="kick">{suggestion.tomorrow ? t('Idea for tomorrow') : t('Idea for today')}</span>
        <span class="sq">{t('{h} h ride with the {bike}?', { h: num(suggestion.hours), bike: suggestion.bike.name })}</span>
        {#if !phone.matches}<span class="ss">{suggestion.fromLast ? tn(suggestion.n, 'List from your last day ride · {n} item · the weather fits', 'List from your last day ride · {n} items · the weather fits') : t('Standard list · the weather fits')}</span>{/if}
        <span class="sa">
          <button type="button" class="btn hi" onclick={startDayRide}>{t('Start day ride')}</button>
          {#if bikes.length > 1}<button type="button" class="linkq" onclick={nextBike}>{t('Other bike')}</button>{/if}
        </span>
      </div>
    {/if}
  </section>
{/snippet}

<!-- 2. the next trip -->
{#snippet tripS()}
  {#if focus || shown}
    <section class="trip" class:has-photo={!!photo && !phone.matches} aria-labelledby="next-h" data-section="trip" data-trip={shown?.id} onpointerdown={pdown} onpointerup={pup} onpointercancel={() => (sx = null)}>
      <div class="tc">
        <div class="kl">
          {#if ask}
            <span class="cdn">{t('trip ended')}</span>
          {:else if cd}
            <span class="cdn" class:near={cd.near} data-countdown>{cd.text}</span>
            {#if !phone.matches && startLine && !cd.under}<span class="sub">{isLead ? t('Next trip') : t('Later trip')} · {startLine}</span>{/if}
          {/if}
          <span class="kr">
            {#if cardTrips.length > 1}
              <button type="button" class="pos num" onclick={() => go(1)} aria-label={t('Trip {i} of {n}, show the next', { i: Math.min(cardIdx, cardTrips.length - 1) + 1, n: cardTrips.length })}>{Math.min(cardIdx, cardTrips.length - 1) + 1} / {cardTrips.length} ›</button>
            {/if}
            {#if !phone.matches}<InProgress current={shown?.id} light label={(n) => tn(n, '+{n} more trip', '+{n} more trips')} />{/if}
          </span>
        </div>
        <div>
          <h2 id="next-h" class="tt">{ask ? t('How was {trip}?', { trip: shown.title }) : shown.title}</h2>
          <p class="meta num">{meta}</p>
        </div>
        {#if bars.length}
          <ol class="steps" aria-label={t('Trip schedule')}>
            {#each bars as s (s.key)}
              {@const cur = s.key === sched.next?.key}
              <li class:done={s.state === 'done'} class:skip={s.state === 'skip'} class:cur class:late={s.late} aria-current={cur ? 'step' : undefined}>
                <span>{#if s.state === 'done'}✓ {/if}{t(STEP_NAME[s.key])}</span>
              </li>
            {/each}
          </ol>
        {/if}
        <div class="acts">
          {#if ask}
            <button type="button" class="btn hi main" onclick={() => allGood()}>{t('All good')}</button>
            <a class="lk" href={focus.href} onclick={() => openTrip(shown.id)}>{t(focus.label)}</a>
          {:else if stepNow}
            <a class="btn hi main" href={stepNow.href} onclick={() => openTrip(shown.id)} data-step={sched.next.key}>{stepNow.button}</a>
            {#each stepNow.links.slice(0, 1) as l (l.href)}<a class="lk" href={l.href} onclick={() => openTrip(shown.id)}>{l.label}</a>{/each}
            {#if stepNow.href !== '#/pack'}<a class="lk" href="#/pack" onclick={() => openTrip(shown.id)}>{t('Open the trip')}</a>{/if}
          {:else if focus && isLead}
            <a class="btn hi main" href={focus.href} onclick={() => openTrip(shown.id)}>{t(focus.label)}</a>
          {/if}
          {#if phone.matches}<InProgress current={shown?.id} light label={(n) => tn(n, '+{n} more trip', '+{n} more trips')} />{/if}
        </div>
      </div>
      {#if photo && !phone.matches}<div class="ph" aria-hidden="true"><img src={photo} alt="" /></div>{/if}
    </section>
  {:else if loaded && !showFirst}
    <section class="trip none" aria-labelledby="next-h" data-section="trip">
      <div class="tc">
        <h2 id="next-h" class="tt">{t('No trip planned')}</h2>
        <p class="meta">{t('Start a packing list from a template, from your last trip or from Standard.')}</p>
        <div class="acts"><button type="button" class="btn hi main" onclick={() => (countUse('trip'), openNew('list'))}>{t('Start a new trip')}</button></div>
      </div>
    </section>
  {/if}
{/snippet}

<!-- 4. Important today and Tried it yet? -->
{#snippet todayS()}
  <div class="two" data-section="today">
    <section class="imp" aria-labelledby="imp-h">
      <h2 id="imp-h" class="kick">{t('Important today')}</h2>
      {#if notice}<p class="notice" role="status"><span>{notice.text}</span>{#if notice.undo}<button type="button" class="btn sm" onclick={undoNotice}>{t('Undo')}</button>{/if}</p>{/if}
      {#if quick}
        <div class="notice" role="status"><span>{t('Saved: {trip}.', { trip: quick.trip.title })}</span>{#if quick.undo}<button type="button" class="btn sm" onclick={undoQuick}>{t('Undo')}</button>{/if}</div>
        {#if quick.offer}<TemplateOffer trip={quick.trip} name={quick.offer} />{/if}
      {/if}
      {#if important.length}
        <ul>
          {#each rowsShown as r (r.key)}
            <li class="row {r.tone}" data-row={r.key.split(':')[0]}>
              {#if r.tone === 'party'}<PartyPopper size={18} aria-hidden="true" />{:else}<span class="dot" aria-hidden="true"></span>{/if}
              {#if r.key === 'tests' && cleanAsk}
                <span class="tx">{tn(tests.length, 'Archive {n} test trip? It stays in your data, Today leaves it out.', 'Archive {n} test trips? They stay in your data, Today leaves them out.')}</span>
                <span class="ra"><button type="button" class="btn sm" onclick={cleanTests}>{t('Archive')}</button><button type="button" class="lkb" onclick={() => (cleanAsk = false)}>{t('Cancel')}</button></span>
              {:else}
                <span class="tx">{r.text}</span>
                {#if r.act}
                  {#if r.act.href}<a class="lk" href={r.act.href} onclick={() => act(r)}>{r.act.label}</a>
                  {:else if r.act.care}<button type="button" class="btn sm" onclick={() => act(r)}>{r.act.label}</button>
                  {:else}<button type="button" class="btn sm" disabled={r.act.busy && backingUp} onclick={() => act(r)}>{r.act.label}</button>{/if}
                {/if}
              {/if}
            </li>
          {/each}
        </ul>
        {#if important.length > 3}<button type="button" class="lkb more" aria-expanded={allRows} onclick={() => (allRows = !allRows)}>{allRows ? t('Show fewer') : t('Show all {n}', { n: important.length })}</button>{/if}
      {:else if ready}
        <p class="calm">{t('Nothing urgent. Enjoy the day.')}</p>
      {/if}
    </section>
    <TryCard list={tryList} used={used.size} total={FUNCTIONS.length} level={levelOf(used.size)} />
  </div>
{/snippet}

<div class="home">
  <!-- v0.30.2 (L9): a new user: three steps, each ticked once it has data. -->
  {#if showFirst}
    <section class="card first" aria-labelledby="first-h">
      <h2 id="first-h" class="title">{t('First steps')}</h2>
      <p class="muted">{t('Three steps, then Today shows your next trip.')}</p>
      <ol>
        <li class:done={steps.bike}>
          {@render mark(steps.bike, 1)}
          {#if steps.bike}<span class="txt">{t('Add your bike')}</span>{:else}<a class="btn sm step" href="#/bikes" onclick={wantBike}>{t('Add your bike')}</a>{/if}
        </li>
        <li class:done={steps.gear}>
          {@render mark(steps.gear, 2)}
          <span class="txt">{t('Gear: import a backup or enter your first items')}</span>
          {#if !steps.gear}<span class="step-acts"><button type="button" class="btn sm step" onclick={openData}>{t('Import backup')}</button><button type="button" class="btn sm step" onclick={() => addItem()}>{t('Add item')}</button></span>{/if}
        </li>
        <li class:done={steps.trip}>
          {@render mark(steps.trip, 3)}
          {#if steps.trip}<span class="txt">{t('Plan your first trip')}</span>{:else}<button type="button" class="btn sm step" onclick={() => openNew('list')}>{t('Plan your first trip')}</button>{/if}
        </li>
      </ol>
    </section>
  {/if}

  {#each layout.order as key (key)}
    {#if on(key)}
      {#if key === 'greeting'}{@render greetingS()}
      {:else if key === 'trip'}{@render tripS()}
      {:else if key === 'flow'}<FlowCard {today} />
      {:else if key === 'actions'}
        <div data-section="actions"><ActionGrid {usage} {badges} {used} onrun={runFn} /></div>
      {:else if key === 'today'}{@render todayS()}
      {:else if key === 'bikes' && ready}
        <div data-section="bikes"><BikeCards {bikes} {tasks} {visits} {next} {today} /></div>
      {:else if key === 'year'}
        <div data-section="year"><YearRow {today} /></div>
      {/if}
    {/if}
  {/each}

  <div class="custom">
    {#if customOpen}
      <Customize layout={S[LAYOUT_KEY]} name={S.userName ?? ''} onclose={() => (customOpen = false)} />
    {:else}
      <button type="button" class="lkb" onclick={() => (customOpen = true)} aria-expanded={customOpen}>{t('Customise the start page')}</button>
    {/if}
  </div>

  <details class="data" bind:this={dataEl} bind:open={dataOpen}>
    <summary><b>{t('Your data')}</b> <span class="muted">{t('backup, import, export, favourites')}</span></summary>
    <DataPanel />
  </details>

  <footer>
    <span class="odot" class:off={!online}></span>
    {online ? t('Online') : t('Offline')} · v{__APP_VERSION__}
  </footer>
</div>

<dialog class="sheet wear" bind:this={wearDlg} onclose={() => (wearOpen = false)} onclick={(e) => e.target === wearDlg && (wearOpen = false)} aria-label={t('What do I wear?')}>
  <div class="wh"><button type="button" class="btn sm" onclick={() => (wearOpen = false)}>{t('Close')}</button></div>
  {#if wearOpen}
    <WearToday {items} {trips} />
    <p class="muted wnote">{t('Your clothes for the coldest hour of a ride at your home place, from the wardrobe.')} <a href="#/wardrobe" onclick={() => (wearOpen = false)}>{t('Open the wardrobe')}</a></p>
  {/if}
</dialog>

<style>
  .home {
    display: flex;
    flex-direction: column;
    gap: 24px;
    max-width: 1328px;
    margin: 0 auto;
  }
  @media (max-width: 719px) {
    .home {
      gap: 14px;
    }
  }
  .muted {
    color: var(--ink-3);
  }
  .kick {
    margin: 0;
    font: 600 13px/1.3 var(--font-body);
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--ink-2);
  }
  .lk,
  .lkb {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 2px;
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 15px var(--font-body);
    text-decoration: underline;
    text-underline-offset: 2px;
    text-decoration-thickness: 1.5px;
    cursor: pointer;
  }
  .linkq {
    min-height: 44px;
    padding: 0 2px;
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 15px var(--font-body);
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
    text-align: left;
  }

  /* 1. greeting */
  .greet {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
    align-items: end;
  }
  @media (min-width: 900px) {
    .greet {
      grid-template-columns: minmax(0, 1fr) minmax(320px, 480px);
      gap: 32px;
    }
    .greet.solo {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .hi-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .dl {
    color: var(--ink-2);
  }
  .hello {
    margin: 0;
    font: 800 clamp(26px, 3vw + 14px, 60px) / 0.98 var(--font-brand);
    letter-spacing: 0.005em;
    overflow-wrap: break-word;
  }
  .wx {
    color: var(--head);
  }
  @media (max-width: 719px) {
    .hello {
      font: 600 21px/1.25 var(--font-body);
    }
    .wx {
      font-size: 16px;
      font-weight: 500;
      color: var(--ink-2);
    }
  }
  .pf {
    max-width: 520px;
  }
  .sugg {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px 18px;
    border: 1px solid var(--line);
    border-radius: 18px;
    background: var(--paper);
  }
  .sugg .kick {
    font-size: 12.5px;
  }
  .sq {
    font: 600 19px/1.25 var(--font-body);
  }
  .ss {
    font-size: 15px;
    color: var(--ink-2);
  }
  .sa {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 16px;
  }
  .sa .btn {
    min-height: 44px;
    padding-inline: 18px;
    border-radius: 12px;
    font-size: 16px;
  }
  @media (max-width: 719px) {
    .sugg {
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px 10px;
      padding: 8px 12px;
      border-radius: 14px;
    }
    .sugg .kick {
      display: none;
    }
    .sq {
      flex: 1 1 140px;
      font-size: 15px;
    }
    .sa .btn {
      min-height: 44px;
      padding-inline: 12px;
      font-size: 15px;
    }
  }

  /* 2. the trip card */
  .trip {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 20px;
    background: var(--paper);
    touch-action: pan-y;
  }
  .trip.has-photo {
    grid-template-columns: minmax(0, 1fr) minmax(200px, 340px);
  }
  .tc {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
    padding: 22px 28px;
  }
  @media (max-width: 719px) {
    .trip {
      border-radius: 16px;
    }
    .tc {
      gap: 8px;
      padding: 12px 14px;
    }
  }
  .kl {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
    font-size: 15px;
  }
  .cdn {
    font-weight: 600;
    color: var(--ink-2);
  }
  .cdn.near {
    color: var(--hi);
  }
  .sub {
    color: var(--ink-2);
  }
  .kr {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }
  .pos {
    min-height: 44px;
    min-width: 44px;
    padding: 0 6px;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: 500 14px var(--font-body);
    cursor: pointer;
  }
  .tt {
    margin: 0;
    font: 600 clamp(21px, 1.6vw + 12px, 34px) / 1.12 var(--font-body);
    overflow-wrap: break-word;
  }
  .meta {
    margin: 4px 0 0;
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  @media (max-width: 719px) {
    .meta {
      margin: 2px 0 0;
      font-size: 14px;
    }
  }
  .steps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: 15px;
  }
  .steps li {
    min-width: 0;
    padding-top: 7px;
    border-top: 4px solid var(--bar);
    color: var(--ink-2);
    overflow-wrap: break-word;
    hyphens: auto;
  }
  .steps li.done {
    border-top-color: var(--accent);
    color: var(--accent);
    font-weight: 500;
  }
  .steps li.skip {
    color: var(--ink-3);
  }
  .steps li.cur {
    border-top-color: var(--hi);
    color: var(--hi);
    font-weight: 600;
  }
  @media (max-width: 719px) {
    .steps {
      gap: 4px;
      font-size: 12.5px;
      line-height: 1.25;
    }
    /* a phone: five words in 60 px columns break mid-word, so only the current step is named, in one line under the bars */
    .steps {
      position: relative;
      padding-bottom: 22px;
    }
    .steps li {
      padding-top: 0;
    }
    .steps li span {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }
    .steps li.cur span {
      left: 0;
      bottom: 0;
      width: auto;
      height: auto;
      overflow: visible;
      clip: auto;
    }
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 18px;
  }
  .btn.main {
    min-height: 48px;
    padding-inline: 22px;
    border-radius: 12px;
    font-size: 16px;
  }
  @media (max-width: 719px) {
    .btn.main {
      flex: 1 1 100%;
    }
  }
  .ph {
    position: relative;
    background: var(--paper-2);
  }
  .ph img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.55;
  }
  .trip.none .tc {
    gap: 10px;
  }

  /* 4. Important today + Tried it yet? */
  .two {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
  }
  @media (min-width: 900px) {
    .two {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 24px;
    }
  }
  .imp {
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding: 16px 20px 10px;
    border: 1px solid var(--line);
    border-radius: 18px;
    background: var(--paper);
  }
  .imp .kick {
    margin-bottom: 4px;
  }
  .imp ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
    min-height: 52px;
    padding: 4px 0;
    border-bottom: 1px solid var(--line);
  }
  .row:last-child {
    border-bottom: 0;
  }
  .row .tx {
    flex: 1 1 200px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .row .dot {
    flex: none;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--ink-3);
  }
  .row.bad .dot {
    background: var(--bad);
  }
  .row.warn .dot {
    background: var(--warn);
  }
  .row.eve .dot {
    background: var(--accent);
  }
  .row.quiet {
    color: var(--ink-2);
    font-size: 15px;
  }
  .row.quiet .dot {
    background: transparent;
    border: 1.5px solid var(--line-strong);
  }
  .row.party {
    margin: 4px 0;
    padding: 6px 12px;
    border: 0;
    border-radius: 12px;
    background: var(--accent-soft);
  }
  .row.party :global(svg) {
    color: var(--accent);
    flex: none;
  }
  .ra {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
  }
  .row .btn.sm {
    min-height: 44px;
    border-radius: 22px;
    padding-inline: 14px;
  }
  .more {
    align-self: flex-start;
    color: var(--ink-2);
    font-size: 14px;
  }
  .notice {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px 12px;
    margin: 4px 0 6px;
    padding: 6px 10px;
    border-radius: 10px;
    background: var(--accent-soft);
    font-weight: 500;
  }
  .notice span {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .calm {
    margin: 8px 0;
    color: var(--ink-2);
  }

  .custom {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .custom > :global(section) {
    align-self: stretch;
  }
  .custom .lkb {
    color: var(--ink-2);
    font-size: 14px;
  }

  /* v0.30.2 (L9): First steps, three numbered rows; a done one shows ✓ and loses its buttons. */
  .first h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .first > p {
    margin: 4px 0 8px;
  }
  .first ol {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .first li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    min-height: 44px;
    padding: 8px 0;
    border-bottom: 1px solid var(--line);
  }
  .first li:last-child {
    border-bottom: 0;
  }
  .first .txt {
    flex: 1 1 200px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .first li.done .txt {
    color: var(--ink-3);
    text-decoration: line-through;
  }
  .mark {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: 1.5px solid var(--ink-3);
    border-radius: 50%;
    font-weight: 700;
  }
  .mark.ok {
    border-color: var(--ok);
    background: var(--ok);
    color: var(--paper);
  }
  .first .step {
    min-height: 44px;
    max-width: 100%;
    white-space: normal;
    text-align: left;
  }
  .step-acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding-left: 40px;
  }

  .wear {
    width: min(560px, calc(100vw - 24px));
  }
  .wh {
    display: flex;
    justify-content: flex-end;
  }
  .wnote {
    font-size: 14px;
  }

  .data {
    border: 1.5px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    padding: 12px 16px;
  }
  .data summary {
    cursor: pointer;
  }
  footer {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .odot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--ok);
  }
  .odot.off {
    background: var(--ink-3);
  }
</style>
