<script>
  /**
   * Today (Heute). v0.46.0 «Startseite neu» (Noah, 9.10.2026, answers 1a 2b 3a 4b 5a+menu 6-33a 34b):
   * a calm cockpit instead of many big tiles, top to bottom (a phone stacks it in the same order):
   *
   *  1. Greeting band: "Good morning, Noah." and the weather in one sentence (home forecast); beside it
   *     the suggestion of the day (a day ride when it stays dry, "Other bike").
   *  2. The next trip as a compact card: countdown, name, bike · items · weight · km, the steps as thin
   *     bars, ONE button for the current step; several trips: "+2 more trips ▾"
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
   * with "All good" (v0.24.1), the ride day opening by itself (v0.20) and the footer.
   * The rules are pure and tested: lib/home/heute.js, lib/home/functions.js, today.js, schedule.js.
   *
   * v0.94.0 «Kachel-Wand» (Noah 11.10.2026, Trello nLi5yNmS «1-5 a», mockups #startseite-kacheln):
   * under the greeting the page is a wall of tiles (lib/home/Wall.svelte, tiles.js): the trip, Important
   * today, Im Flow, the series over everything, what is new, Meditation, the playground, the 16
   * functions as small buttons, the bikes and the 12 months. «Customise the start page» (or a long
   * press on a phone) moves, resizes and removes tiles; «+» adds any tile (TileCatalog.svelte); «Reset»
   * brings the ready wall back. Stored in «homeWall» (in every backup). «Your data» lives under Me now.
   */
  import { todayNotes } from '../lib/notebook.js';
  import Skeleton from '../lib/ui/Skeleton.svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { localDay } from '../lib/localday.js';
  import { LAST_BACKUP, LAST_IMPORT, backupDue, downloadBackup } from '../lib/backup.js';
  import { backupAfterTrip } from '../lib/todos.js';
  import { knownWeight, isInventory } from '../lib/gear.js';
  import { sortBikes, bikesHash } from '../lib/bikes.js';
  import { sheetReminders, laterChanges } from '../lib/sheets2.js';
  import { withVisits, tripPrep, tyreSetup } from '../lib/workshop.js';
  import { tripSchedule, stepWords, STEP_NAME, weatherKnown } from '../lib/schedule.js';
  import { shopList, shopCount } from '../lib/shop.js';
  import { layerSuggest, openRows } from '../lib/layers.js';
  import { bikeCare, eventPrep, eventPrepLine, isShortRide } from '../lib/readiness.js';
  import { tripStats } from '../lib/trips.js';
  import { onTripDay } from '../lib/ride.js';
  import { demoState } from '../lib/demo.js';
  import { askTour } from '../lib/tour/run.js';
  import Continue from '../lib/home/Continue.svelte';
  import { stepOf, lastEvening, betweenHref } from '../lib/phase.js';
  import { quickDebrief, templateOffer, templateName, nextTrip, learningsFor } from '../lib/debrief.js';
  import TemplateOffer from '../lib/debrief/TemplateOffer.svelte';
  import { openNew, openNote, openTrip, openPrep, addItem, wantBike, take, dayRide, openData, openPlay } from '../lib/nav.js';
  import { todayFocus, openDebrief, endedOn } from '../lib/today.js';
  import { t, tn, num, locale, lang, setLang, nameOf } from '../lib/i18n.svelte.js';
  import { hasBike, domainOf, domainName } from '../lib/domains.js';
  import { phone } from '../lib/media.svelte.js';
  import { newsHint, newerThan, SEEN_KEY, BEFORE, WHATS_NEW } from '../lib/whatsnew.js';
  import { messageOn, tileDaysLeft, pinNews, unpinNews } from '../lib/know/wasneu.js';
  import { readUpdate, writeUpdate, readMute, readPin, writePin } from '../lib/know/wasneuStore.js';
  import NewsBanner from '../lib/know/NewsBanner.svelte';
  import MaintHint from '../lib/maintenance/MaintHint.svelte';
  import { HOME_PLACE, HOME_FORECAST, usable, needsFetch, knowCards, wearWhat } from '../lib/know.js';
  import { openTodos } from '../lib/todos.js';
  import { weightText } from '../lib/gear.js';
  import { homeForecast } from '../lib/home-weather.js';
  import { toWx } from '../lib/weather.js';
  import { lastBikeId } from '../lib/dayride.js';
  import { quickPlan, quickStart } from '../lib/quickstart.js';
  import { RAIN } from '../lib/trips.js';
  import Btn from '../lib/ui/Btn.svelte';
  import { explain } from '../lib/ui/explain.js';
  import { readyLight, quickHints, dueAll } from '../lib/quickcare.js';
  import { chargeList, chargeCount } from '../lib/charge.js';
  import { TIPS, TIPS_KEY, tipPossible, usedTips, isUsed, tapTip, updateTips } from '../lib/tips.js';
  import { PACE_KEY, paceOf } from '../lib/pace.js';
  import { SETS_KEY } from '../lib/sets.js';
  import { TEMPLATES_KEY } from '../lib/templates.js';
  import { standalone } from '../lib/install.js';
  import HelloSheet from '../lib/home/HelloSheet.svelte'; // HG1d
  import NameAsk from '../lib/home/NameAsk.svelte'; // HG1b
  import { helloPart, NAME_ASKED_KEY } from '../lib/home/hallo.js'; // HG1
  import { homeTrips, testTrips, archiveChanges, greeting, weatherLine, dayDry, dayPart, countdown, timeLeft, packedOf, soonTrips, milestoneLevels, milestoneStep, milestonesNow, milestoneText, stepOf as stepOfMs, MILESTONE_KEY, LAYOUT_KEY } from '../lib/home/heute.js';
  import { WALL_KEY, TILE, wallOf, wallRecord, addTile, removeTile, isNew, HELPER_TILES, hideTiles, keepHidden } from '../lib/home/tiles.js';
  import { activeDays, seriesOf, restOf, REST_KEY, SERIES_STEPS } from '../lib/home/series.js';
  import { FUNCTIONS, USAGE_KEY, usageOf, dataUsed, usedFunctions, levelOf, untried } from '../lib/home/functions.js';
  import { countUse } from '../lib/home/usage.js';
  import { recordCare, undoCare } from '../lib/home/care-tap.js';
  import { yearReview, tripDone } from '../lib/yearreview.js';
  import { tripState, tripStates } from '../lib/tripstate.js';
  import { asksRide } from '../lib/trip/fixed.js';
  import { answerRide } from '../lib/trip/reopen.svelte.js';
  import TripState from '../lib/ui/TripState.svelte';
  import InProgress from '../lib/trip/InProgress.svelte';
  import Wall from '../lib/home/Wall.svelte';
  import TileCatalog from '../lib/home/TileCatalog.svelte';
  import SmallTile from '../lib/home/SmallTile.svelte';
  import IntroKT from '../lib/home/IntroKT.svelte';
  import { INTRO_KEY, introDue } from '../lib/home/introkt.js';
  import SeriesTile from '../lib/home/SeriesTile.svelte';
  import NewsTile from '../lib/home/NewsTile.svelte';
  import MedTile from '../lib/home/MedTile.svelte';
  import BalanceTile from '../lib/home/BalanceTile.svelte';
  import RoundTile from '../lib/home/RoundTile.svelte'; // WG: the round of «Wi gaht's?» (was the morning check)
  import TryCard from '../lib/home/TryCard.svelte';
  import BikeCards from '../lib/home/BikeCards.svelte';
  import YearRow from '../lib/home/YearRow.svelte';
  import WeekTile from '../lib/home/WeekTile.svelte';
  import TodaySuggest from '../lib/home/TodaySuggest.svelte';
  import BagReminder from '../lib/home/BagReminder.svelte';
  import { CHALLENGES_KEY, challengesOf, freshDone } from '../lib/challenge.js';
  import MonthTile from '../lib/home/MonthTile.svelte';
  import NextMsTile from '../lib/home/NextMsTile.svelte';
  import YearAgoTile from '../lib/home/YearAgoTile.svelte';
  import WearToday from '../lib/home/WearToday.svelte';
  import FlowCard from '../lib/home/FlowCard.svelte';
  import AbCard from '../lib/abfragen/AbCard.svelte';
  import KmCard from '../lib/home/KmCard.svelte';
  import StravaChanges from '../lib/strava/StravaChanges.svelte';
  import StravaTile from '../lib/strava/StravaTile.svelte';
  import StravaConnect from '../lib/strava/StravaConnect.svelte';
  import { strava } from '../lib/strava/client.svelte.js';
  import { isShown } from '../lib/helper/client.svelte.js';
  import HomePlaceForm from '../lib/know/HomePlaceForm.svelte';
  import { tripToday } from '../lib/home/ruhig.js';
  import { quietHome } from '../lib/bedienung.svelte.js';
  import { PartyPopper, Sun, Pencil, RotateCcw, Route, ChevronRight, TriangleAlert, SlidersHorizontal, Hand, X } from '@lucide/svelte';
  import Profile from '../lib/ui/Profile.svelte';

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
  const SKEYS = ['riderWeightG', TEMPLATES_KEY, USAGE_KEY, LAYOUT_KEY, WALL_KEY, 'userName', NAME_ASKED_KEY, MILESTONE_KEY, SETS_KEY, HOME_PLACE, TIPS_KEY, PACE_KEY, CHALLENGES_KEY, 'homeHintLongPress', INTRO_KEY];
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
  // FE8 «Nachtruhe» (Noah 13.10.2026): 22–06 Today keeps its tips back (switch in Ich › Darstellung)
  const hush = $derived(quietHome(now));
  const evening = $derived(dayPart(now.getHours()) === 'evening' && now.getHours() >= 18);

  /* ---------- v0.35.0: "New in the app" once after an update ---------- */
  // v0.110.0 Design-Refresh P10 (I11b, I11e): after a real update the device keeps it (wasneuStore:
  // version, the one before, the day); the message comes at each start until «Do not show again»
  // (until the next update) and the tile «New» goes on top of the wall for 14 days.
  let newsN = $state(0);
  let newsBanner = $state([]);
  let newsChecked = false;
  let newsUpdate = $state(readUpdate());
  $effect(() => {
    // the stored wall must be read before the tile «New» moves on it ($setQ)
    if (newsChecked || !loaded || !$bikesQ || !$setQ) return;
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
    // v0.78.0 (Ü9a): after a real update (a version was seen before) a calm sheet says what is new;
    // a first visit with data (a backup, an import) keeps the quiet line.
    if (h.show && seen) {
      writeUpdate({ v: h.mark, from: seen, at: localDay() });
      newsUpdate = readUpdate();
      pinNewsTile();
    } else newsN = h.show ? newerThan(seen ?? BEFORE).reduce((n, e) => n + e.points.length, 0) : 0;
    const u = readUpdate();
    // v0.127.0 A-U1 (Noah 3a): a calm banner on top instead of the window, for 7 days or until ×
    if (messageOn({ update: u, mute: readMute(), today: localDay() })) newsBanner = newerThan(u.from ?? BEFORE);
    unpinNewsTile();
  });
  const newsDays = $derived(tileDaysLeft(newsUpdate, today));
  // I11e: on top of the wall, a whole row, once per update; back where it stood after the 14 days
  function pinNewsTile() {
    const v = WHATS_NEW[0].version;
    if (readPin()?.v === v) return;
    const { tiles, from } = pinNews(wall);
    writePin({ v, from, done: false });
    saveWall(tiles);
  }
  function unpinNewsTile() {
    const p = readPin();
    if (!p || p.done || p.v !== WHATS_NEW[0].version || tileDaysLeft(readUpdate(), localDay()) > 0) return;
    writePin({ ...p, done: true });
    const back = unpinNews(wall, p.from);
    if (back) saveWall(back);
  }

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
  // HG1 3: at night only «Guät Nacht, Nachtülä», no tap line and no name question
  const night = $derived(helloPart(now.getHours()) === 'night');
  // HG1b: no name yet: one quiet row under the greeting, asked only once
  const askName = $derived(ready && !night && !editing && !String(S.userName ?? '').trim() && !S[NAME_ASKED_KEY]);
  const wx = $derived(fc ? weatherLine(fc, now) : null);
  const shortDate = $derived(now.toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' }));
  const dateLine = $derived([now.toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' }), place?.name?.split(',')[0]].filter(Boolean).join(' · '));
  let placeOpen = $state(false);

  // The suggestion of the day: a ride when today stays dry, on the bike of the last ride or the best
  // ready one; "Other bike" goes round the bikes.
  // v0.119.0 «Schnellstart» (Noah Q1 1a): always today (the day ride's «after 14:00 tomorrow» is gone).
  let otherBike = $state(null);
  const tripOnRideDay = $derived(trips.some((x) => !x.skipped && !x.finished && x.startDate && onTripDay(x, today)));
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
    if (!dayDry(fc, today, now.getHours())) return null;
    const plan = quickPlan(trips, bikes, { now, bikeId: suggestBikeId });
    return plan ? { bike: plan.bike, hours: plan.hours } : null;
  });
  // v0.73.0 (Noah, Heute ruhiger 1a 3a): with a trip today the suggestion is one slim row under the
  // trip card; without one it stays big beside the greeting (then it is the main thing).
  const slim = $derived(!!suggestion && on('trip') && tripToday(trips, today));
  // v0.119.0 «Schnellstart» (mockups Q1, Q2a): one click makes the trip and Noah stays on Today; the
  // green card says what was made, «Open» goes to it, «Undo» deletes it again.
  let made = $state(null); // { id, title, line }
  // the hours as in the approved mockup («2,5 Std.»; de-CH would write 2.5)
  const hrs = (n) => (lang.v === 'de' ? String(n).replace('.', ',') : num(n));
  let quickBusy = false;
  async function startQuick() {
    if (quickBusy) return;
    quickBusy = true;
    countUse('dayride');
    try {
      // offline: no weather (Noah 1a); online the home forecast (saved when fresh, else fetched)
      const forecast = navigator.onLine ? await homeForecast(db).catch(() => null) : null;
      const raw = sortBikes(($bikesQ ?? []).map((b) => ({ ...b })));
      const trip = await quickStart(db, { trips: allTrips.map((x) => ({ ...x })), bikes: raw, items: items.map((x) => ({ ...x })), forecast, bikeId: suggestion?.bike?.id ?? suggestBikeId });
      if (!trip) return openNew('list'); // no bike yet: the New trip window says why
      const w = trip.wx?.min != null && trip.wx?.max != null ? `${trip.wx.min}–${trip.wx.max} °C ${t(RAIN[trip.wx.rain ?? 'none'])}` : t('no weather|quick');
      const weather = w && trip.wxFrom === 'forecast' && place?.name ? t('{weather} (forecast {place})', { weather: w, place: place.name.split(',')[0] }) : w;
      made = { id: trip.id, title: trip.title, line: t('Today · {h} h · {weather} · listed under Trips › Planned', { h: hrs(trip.hours), weather }) };
    } finally {
      quickBusy = false;
    }
  }
  async function undoQuickStart() {
    const m = made;
    made = null;
    if (m) await db.trips.delete(m.id);
  }
  const madeTrip = $derived(made ? allTrips.find((x) => x.id === made.id) ?? null : null);
  function nextBike() {
    const i = bikes.findIndex((b) => b.id === suggestion?.bike?.id);
    otherBike = bikes[(i + 1) % bikes.length]?.id ?? null;
  }

  /* ---------- 2. the trip card ---------- */
  // v0.67.0 (U007): «Open the trip» leads into the step the trip is in now, not always to Plan.
  const stepHere = (tr) => stepOf(tr, today, { debriefDone: debriefs.some((d) => d.tripId === tr.id && d.status === 'done') });
  const focus = $derived(loaded ? todayFocus(trips, debriefs, today) : null);
  // TZ-2 «Fest nach der Fahrt» (mockup TZ2 Heute): a trip whose date passed but was never ended asks
  // «Bist du gefahren?» (a row of its own) instead of waiting in the debrief row; a reopened trip does
  // not wait for a debrief. The card's «How was …?» of a fresh trip stays («All good» says you rode).
  const states = $derived(loaded && $ridesQ ? tripStates(trips, { debriefs, rides: $ridesQ, today }) : {});
  const heroAsks = $derived(focus?.kind === 'debrief' ? focus.trip?.id : null);
  const askTrips = $derived(trips.filter((x) => x.id !== heroAsks && asksRide(states[x.id])).sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? '')));
  const waitTrips = $derived(trips.filter((x) => !asksRide(states[x.id]) && !states[x.id]?.reopened));
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
  // v0.125.0 TZ-1 «Zustand sichtbar» (mockup TZ2 Heute): the state pill of the trip on the card
  const shownState = $derived(shown ? tripState(shown, { debrief: debriefs.find((d) => d.tripId === shown.id) ?? null, rides: $ridesQ ?? [], today }) : null);
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
  // 0.96.0 (Noah 11.10.2026 «bild wieder vom homescreen weg»): Heute shows no photo; the photos
  // stay under Velos › Setup.
  const meta = $derived.by(() => {
    if (!shown || !stats) return '';
    const who = hasBike(shown) ? shown.bike : t(domainName(domainOf(shown)));
    // v0.137.0 (Noah «3a», release check «1-5a»): the big line shows the base weight, without food,
    // water and worn items (as the bag setups); the small line under it gives the whole trip.
    const w = stats.baseG ? knownWeight(stats.baseG, stats.baseMissing) : null;
    const km = shown.route?.km ? `${num(Math.round(shown.route.km))} km` : null;
    // once packing has started, how far it is (the same words as Pack)
    const es = shown.entries ?? [];
    const pk = es.filter((e) => e.packed).length;
    const pct = pk ? t('{n} % packed', { n: Math.round((pk / es.length) * 100) }) : null;
    return [who, tn(stats.count, '{n} item', '{n} items'), w, km, pct].filter(Boolean).join(' · ');
  });
  // v0.137.0 (Durchklick H1, Noah 14.10.2026 «3a»): the big line keeps the weight as before; a small
  // line under it gives the whole trip with food, water and worn items, the same as the trip head.
  const kg1 = (g) => `${(g / 1000).toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`; // as the trip head
  const packLine = $derived(shown && stats?.packG && stats.packG > stats.baseG ? t('with food, water and worn items {w}', { w: knownWeight(stats.packG, stats.packMissing, kg1) }) : '');
  // v0.101.0 Design-Refresh P2 (H1): number boxes (days, hours, open steps), the packing bar and,
  // with a route, its distance, climbing and profile on the right.
  const left = $derived(shown && !ask ? timeLeft(shown, now) : null);
  const openSteps = $derived(bars.filter((s) => s.state !== 'done' && s.state !== 'skip').length);
  const packed = $derived(shown ? packedOf(shown, itemsById, nameOf) : null);
  const prof = $derived(shown?.route?.km && shown.route.profile?.length > 1 ? shown.route.profile : null);
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
    if (what === 'dayride') startQuick();
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
    const tips = hush ? [] : TIPS.filter((x) => x.go.run !== 'install' && tipPossible(x, { trips: allTrips, items, bikes: $bikesQ ?? [] }, today) && !isUsed(S[TIPS_KEY], x.id, tipUsed) && !fns.some((f) => f.id === x.id)).map((x) => ({ id: `tip-${x.id}`, text: t(x.text), button: x.id === 'lang' ? (lang.v === 'de' ? t('Switch to English') : t('Switch to German')) : t(x.button), run: () => runTip(x) }));
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
  const debrief = $derived(loaded && focus?.kind !== 'debrief' ? openDebrief(null, waitTrips, debriefs, today) : null);
  // TZ-2: «Ja» ends the trip on its last day, «Nicht gefahren» marks it skipped; both with Undo
  async function rideAnswer(trip, yes) {
    const undo = await answerRide($state.snapshot(trip), yes);
    if (undo) say(yes ? t('Saved: you rode {trip}. The list is fixed now.', { trip: trip.title }) : t('{trip}: marked as not ridden.', { trip: trip.title }), undo);
  }
  const shortDay = (iso) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short' }) : '');
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
    await db.transaction('rw', [db.trips, db.bikes, db.debriefs, db.settings, db.flowLog, db.rides], async () => {
      const [all, bikeRows, drs, stored, log, rideRows, rest] = await Promise.all([db.trips.toArray(), db.bikes.toArray(), db.debriefs.toArray(), db.settings.get(MILESTONE_KEY), db.flowLog.toArray(), db.rides.toArray(), db.settings.get(REST_KEY)]);
      if (!all.length && !bikeRows.length) return; // nothing to count yet
      const home = homeTrips(all);
      const done = home.filter((x) => tripDone(x, drs, day));
      const nights = yearReview({ today: day, trips: home, debriefs: drs, rides: [] }).ride.nights + 0;
      // v0.94.0 (idea 6): the series over everything reaching 2, 4, 8 … weeks is celebrated too
      const series = stepOfMs(seriesOf(activeDays({ log, rides: rideRows, trips: home, debriefs: drs, today: day }), restOf(rest?.value), day).n, SERIES_STEPS);
      const cur = milestoneLevels({ tripsDone: done.length, bikes: bikeRows, nights: done.some((x) => Number(x.days) > 1 && x.overnight !== 'lodging' && x.overnight !== 'none') ? Math.max(1, nights) : 0, series });
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
    // v0.102.0 (D1b/D5): a challenge reached becomes a milestone
    for (const c of freshDone(challengesOf(S[CHALLENGES_KEY]), today)) rows.push({ key: `ch:${c.id}`, tone: 'party', text: t('Challenge reached: {n}× {what}', { n: num(c.times), what: t(c.what) }) });
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
    // TZ-2 (mockup TZ2 Heute): «Jura-Höhen (1. Okt.): Rückblick ausfüllen · 2 Min.» with «Rückblick»; «All good»
    // (v0.24.1, quickDebrief) stays beside it as a quiet second way
    if (debrief) rows.push({ key: 'debrief', tone: 'warn', st: 'done', text: t('{title} ({date}): fill in the debrief · 2 min.', { title: debrief.title, date: shortDay(debrief.startDate) }), act: { label: t('Debrief'), trip: debrief.id, run: () => (location.hash = `#/debrief/${encodeURIComponent(debrief.id)}`) }, act2: { label: t('All good'), run: () => allGood(debrief), quiet: true } });
    // TZ-2: the newest trip whose date passed without an end: «Datum vorbei. Bist du gefahren?» Ja · Nicht gefahren
    const askT = askTrips[0];
    if (askT) rows.push({ key: 'ride', tone: 'warn', st: 'done', text: hasBike(askT) ? t('{title} ({date}): date passed. Did you ride?', { title: askT.title, date: shortDay(askT.startDate) }) : t('{title} ({date}): date passed. Did you go?', { title: askT.title, date: shortDay(askT.startDate) }), act: { label: t('Yes|rode'), run: () => rideAnswer(askT, true) }, act2: { label: hasBike(askT) ? t('Not ridden|answer') : t('Did not happen'), run: () => rideAnswer(askT, false) } });
    if (backup.due) rows.push({ key: 'backup', tone: 'bad', text: `${t('Time for a backup')}: ${backup.days == null ? t('You have not saved a backup file yet.') : t('Your last backup is {n} days old.', { n: backup.days })}${$metaQ?.imp?.from ? ` ${t('Data from the backup of {date}. Newer state on the phone? Load its backup here.', { date: new Date($metaQ.imp.from).toLocaleDateString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) })}` : backup.afterTrip ? ` ${t('New debrief since the last backup: save one, then load it on the desktop.')}` : ''}`, act: { label: t('Download backup'), run: backupNow, busy: true } });
    rows.push(...careRows.filter((r) => r.tone === 'bad'));
    if (prep) rows.push({ key: 'prep', tone: prep.overdue ? 'bad' : 'warn', text: eventPrepLine(prep), act: { label: t('Tick off in the trip'), href: '#/pack', prep: next.id } });
    rows.push(...careRows.filter((r) => r.tone !== 'bad'));
    for (const x of alsoToday) rows.push({ key: `also:${x.id}`, tone: 'info', text: `${t('Also today: {title}', { title: x.title })}${x.bike ? ` · ${x.bike}` : ''}`, act: { label: t('Open the trip'), href: stepHere(x).href, trip: x.id } });
    if (focus?.kind === 'debrief' && next) rows.push({ key: 'next', tone: 'info', text: t('Next trip: {title}', { title: next.title }), act: { label: t('Open the trip'), href: stepHere(next).href, trip: next.id } });
    if (notes.length) rows.push({ key: 'inbox', tone: 'info', text: tn(notes.length, '{n} note to sort', '{n} notes to sort'), act: { label: t('Inbox'), href: '#/inbox' } });
    // v0.48.0 (Noah 17a): one line only for a pinned note with an open checklist.
    for (const x of todayNotes($notesQ ?? [], 1)) rows.push({ key: `note:${x.id}`, tone: 'info', text: tn(x.open, 'Note «{title}»: {n} point open', 'Note «{title}»: {n} points open', { title: x.title }), act: { label: t('Notes'), href: '#/notes' } });
    if (!bikes.length && !showFirst) rows.push({ key: 'nobike', tone: 'info', text: t('No bikes yet.'), act: { label: t('Add a bike'), href: '#/bikes', run: wantBike } });
    rows.push(...knowRows);
    // v0.70.0 «Velo-Blätter Teil 2» (W3 a, W6 a): a due step of a Break-in plan, a warranty that ends soon; «later» waits a week
    for (const r of sheetReminders(bikes, { visits, today })) rows.push({ key: `sheet:${r.bikeId}:${r.key}`, tone: r.tone, text: r.text, act: { label: t('Open the sheet'), href: r.href }, later: () => sheetLater(r) });
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
  async function sheetLater(r) {
    const bike = await db.bikes.get(r.bikeId);
    if (bike) await db.bikes.update(r.bikeId, { sheets: laterChanges(bike, r.key, today) });
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

  /* ---------- v0.94.0 «Kachel-Wand»: the wall, customising and «+» ---------- */
  // the stored wall; without one the ready wall (minus sections switched off in the old layout)
  const wall = $derived(wallOf(S[WALL_KEY], S[LAYOUT_KEY]));
  const onWall = $derived(new Set(wall.map((x) => x.id)));
  const on = (key) => onWall.has(key);
  let editing = $state(false);
  let catalogOpen = $state(false);
  const saveWall = (tiles) => db.settings.put({ key: WALL_KEY, value: wallRecord(tiles) });
  // v0.118.0 «KI-Helfer ausblenden» (K4): while the AI helper is off its tile leaves the wall, but stays stored
  // A-U1 (Noah ★ «Nur das Banner»): at most one «new» on Today; while the banner shows, the tile «New» waits
  const hiddenTiles = $derived([...(isShown() ? [] : HELPER_TILES), ...(newsBanner.length && !editing ? ['news'] : [])]);
  const shownWall = $derived(hideTiles(wall, hiddenTiles));
  const saveShown = (tiles) => saveWall(keepHidden(tiles, wall, hiddenTiles));
  const toggleTile = (id) => saveWall(onWall.has(id) ? removeTile(wall, id) : addTile(wall, id));
  // «Reset» (Noah 3a): the ready wall again; the old layout no longer counts after that
  async function resetWall() {
    await db.settings.delete(WALL_KEY);
    await db.settings.delete(LAYOUT_KEY);
  }
  let nameIn = $state('');
  $effect(() => {
    if (editing) nameIn = S.userName ?? '';
  });
  async function saveName(e) {
    e.preventDefault();
    await db.settings.put({ key: 'userName', value: nameIn.trim() });
  }
  const newTile = (id) => isNew(TILE[id], today);
  // v0.127.0 «Tages-Check» 2: the hint to the long press shows until it is closed (settings, in every backup)
  const HINT_KEY = 'homeHintLongPress';
  const closeHint = () => db.settings.put({ key: HINT_KEY, value: true });
  // KT «Kacheln antippbar» (Noah 14.10.2026, 3a, mockup KT3): the short intro, once after the update (or
  // again from Me). Not while editing, over a sheet, in the playground or with «Nachtruhe»; it waits a
  // moment until Today has laid out its tiles. Its end closes the long-press tip too (it says the same).
  let introOn = $state(false);
  $effect(() => {
    if (introOn || !ready || $demoQ === undefined) return;
    if (!introDue({ value: S[INTRO_KEY], updated: !!newsUpdate, editing, play: !!$demoQ, hush })) return;
    const id = setTimeout(() => {
      const onToday = /^#?\/?(\?.*)?$/.test(location.hash);
      if (onToday && !editing && !document.querySelector('dialog[open]')) introOn = true;
    }, 700);
    return () => clearTimeout(id);
  });
  async function endIntro() {
    introOn = false;
    await db.settings.bulkPut([
      { key: INTRO_KEY, value: true },
      { key: HINT_KEY, value: true },
    ]);
  }
  // 0.125.0 Tagespaket: one hint on top at a time, the tip waits while «Connect Strava» shows
  let stravaCard = $state(false);
  // «App-Wartung» (BF7, BF8): the maintenance line comes after «Connect Strava», the long-press tip after it
  let maintHint = $state(false);
  const tripsDone = $derived(homeTrips(allTrips).filter((x) => tripDone(x, debriefs, today)).length);
  // a short line under a small function tile (a computer, or a wide tile)
  const gearN = $derived(items.filter(isInventory).length);
  function fnSub(id) {
    if (id === 'dayride') return suggestion ? t('{h} h ride, dry', { h: hrs(suggestion.hours) }) : '';
    if (id === 'gear') return gearN ? tn(gearN, '{n} item', '{n} items') : '';
    return '';
  }
  const seriesParty = $derived(milestones.some((m) => m.key === 'series'));

  // Ride day (answer 1a): on the days of the trip the app opens the ride view, once a day.
  // v0.29.2 (Noah 6a): not on the day the trip was made: then Noah is still planning or packing.
  const madeToday = (tr) => !!tr?.createdAt && localDay(new Date(tr.createdAt)) === today;
  const riding = $derived(next && hasBike(next) && !madeToday(next) ? onTripDay(next, today) : false);
  // v0.67.0 (U22b): on the evening of a trip's last day the interstitial «Tour beendet» opens by itself,
  // once (the app does not end the trip: «Weiter zum Rückblick» or «Doch noch unterwegs» decide).
  // Not for a trip made today (as the ride day, Noah 6a): Today's «Review today» row is its place.
  const lastEve = $derived(loaded && $debriefsQ ? trips.find((x) => !x.id.startsWith('demo') && !madeToday(x) && lastEvening(x, today, now.getHours(), { debriefDone: debriefs.some((d) => d.tripId === x.id && d.status === 'done') })) ?? null : null);
  $effect(() => {
    if (!lastEve) return;
    const key = 'between.evening';
    try {
      if (localStorage.getItem(key) === `${lastEve.id}:${today}`) return;
      localStorage.setItem(key, `${lastEve.id}:${today}`);
    } catch {
      return; // without storage it would open every time: better not at all
    }
    openTrip(lastEve.id);
    location.hash = betweenHref(lastEve, 'ended');
  });
  $effect(() => {
    // on the last evening the interstitial wins (asked of this trip itself: lastEve may still load)
    if (!riding || lastEve || lastEvening(next, today, now.getHours())) return;
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
  // v0.80.0 «Tests stabil»: <html data-today="n"> says Today has made the two decisions above with n
  // trips loaded (after them, in the same run). Nothing in the app reads it; the browser tests wait for it.
  $effect(() => {
    if (!loaded || !$debriefsQ) return;
    document.documentElement.dataset.today = String(allTrips.length);
    return () => delete document.documentElement.dataset.today;
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
  <section class="greet" class:solo={!suggestion || slim} aria-labelledby="hello-h" data-section="greeting">
    <div class="ghead">
      <div class="hi-text">
        <h1 id="hello-h" class="hello">{hello}</h1>
        {#if !night}<HelloSheet name={S.userName ?? ''} />{/if}
        <p class="dl">{phone.matches ? shortDate : dateLine}{#if wx}<span aria-hidden="true">{'\u00a0· '}</span><span class="wx" data-weather>{wx.text}</span>{/if}{#if strava.changes.length}<span aria-hidden="true">{'\u00a0· '}</span><span data-strava-questions>{tn(strava.changes.length, '{n} question from Strava', '{n} questions from Strava')}</span>{/if}</p>
        {#if !wx && ready}
          {#if !place}
            <button type="button" class="linkq" aria-expanded={placeOpen} onclick={() => (placeOpen = !placeOpen)}>{t('Set your home place for the weather')}</button>
          {/if}
        {/if}
        {#if placeOpen}<div class="pf"><HomePlaceForm onchosen={() => (placeOpen = false)} /></div>{/if}
        {#if askName}<NameAsk />{/if}
      </div>
      {#if !phone.matches && !editing}<button type="button" class="btn adapt" data-intro="custom" onclick={() => (editing = true)}><SlidersHorizontal size={18} aria-hidden="true" />{t('Customise the start page')}</button>{/if}
    </div>
    {#if suggestion && !slim}
      <div class="sugg" data-suggestion>
        <span class="kick">{t('Idea for today')}</span>
        <span class="sq">{t('Ride up to {h} h with the {bike}, today', { h: hrs(suggestion.hours), bike: suggestion.bike.name })}</span>
        {#if !phone.matches}<span class="ss">{t('One click: standard items, weather from the forecast, all planned')}</span>{/if}
        <span class="sa">
          <Btn kind="hi" label={t('Quick start')} explain={explain('Quick start')} onclick={startQuick} data-quickstart />
          {#if bikes.length > 1}<button type="button" class="linkq" onclick={nextBike}>{t('Other bike')}</button>{/if}
        </span>
      </div>
    {/if}
  </section>
{/snippet}

<!-- 2. the next trip -->
{#snippet tripS()}
  {#if focus || shown}
    <section class="trip noswipe" class:wide2={!!prof} aria-labelledby="next-h" data-section="trip" data-trip={shown?.id} onpointerdown={pdown} onpointerup={pup} onpointercancel={() => (sx = null)}>
      <div class="tc">
        <div class="kl">
          <Route size={16} aria-hidden="true" />
          <TripState state={shownState} />
          {#if ask}
            <span class="cdn">{t('trip ended')}</span>
          {:else if cd}
            <span class="sub">{isLead ? t('Next trip') : t('Later trip')}</span>
            <span class="cdn" class:near={cd.near} data-countdown>{cd.text}</span>
            {#if Number(shown.days) > 1 && !cd.under}<span class="sub">{tn(Number(shown.days), '{n} day', '{n} days')}</span>{/if}
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
          <p class="meta num">{meta}{#if startLine && !phone.matches}{' · '}{startLine}{/if}</p>
          {#if packLine && !ask}<p class="meta pack num" data-pack-weight>{packLine}</p>{/if}
        </div>
        {#if !ask && (left || openSteps)}
          <dl class="boxes num" data-boxes>
            {#if left}
              {#if left.days}<div><dt>{left.days === 1 ? t('day|left') : t('days|left')}</dt><dd>{left.days}</dd></div>{/if}
              <div><dt>{left.hours === 1 ? t('hour|left') : t('hours|left')}</dt><dd>{left.hours}</dd></div>
            {/if}
            <div><dt>{t('open|steps')}</dt><dd>{openSteps}</dd></div>
          </dl>
        {/if}
        {#if !ask && packed}
          <div class="packed" data-packed>
            <div class="bar" role="progressbar" aria-label={t('Packed')} aria-valuemin="0" aria-valuemax={packed.of} aria-valuenow={packed.packed}><span style:width="{Math.round((packed.packed / packed.of) * 100)}%"></span></div>
            <p class="pl"><b>{t('{n} of {m} packed', { n: packed.packed, m: packed.of })}</b>{#if packed.left.length}<span>{t('Still: {list}', { list: packed.left.join(', ') })}</span>{/if}</p>
          </div>
        {/if}
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
            <a class="btn" href={focus.href} onclick={() => openTrip(shown.id)}>{t(focus.label)}</a>
          {:else if stepNow}
            <a class="btn hi main" href={stepNow.href} onclick={() => openTrip(shown.id)} data-step={sched.next.key}>{stepNow.button}<ChevronRight size={18} aria-hidden="true" /></a>
            {#each stepNow.links.slice(0, 1) as l (l.href)}<a class="btn" href={l.href} onclick={() => openTrip(shown.id)}>{l.label}</a>{/each}
            {#if stepNow.href !== stepHere(shown).href}<a class="btn" href={stepHere(shown).href} onclick={() => openTrip(shown.id)}>{t('Open the trip')}</a>{/if}
          {:else if focus && isLead}
            <a class="btn hi main" href={focus.href} onclick={() => openTrip(shown.id)}>{t(focus.label)}</a>
          {/if}
          {#if phone.matches}<InProgress current={shown?.id} light label={(n) => tn(n, '+{n} more trip', '+{n} more trips')} />{/if}
        </div>
      </div>
      {#if prof}
        <div class="route" data-route>
          <dl class="boxes sm num">
            <div><dt>{t('Distance')}</dt><dd>{num(Math.round(shown.route.km))} km</dd></div>
            {#if shown.route.gainM}<div><dt>{t('Climbing')}</dt><dd>{num(Math.round(shown.route.gainM))} m</dd></div>{/if}
          </dl>
          <Profile points={prof} />
        </div>
      {/if}
    </section>
    {#if slim}
      <div class="srow" data-suggestion data-slim>
        <Sun size={20} aria-hidden="true" />
        <span class="st"><b>{t('Dry today')}:</b> <span>{t('Ride up to {h} h with the {bike}, today', { h: hrs(suggestion.hours), bike: suggestion.bike.name })}</span></span>
        <Btn label={t('Quick start')} explain={explain('Quick start')} onclick={startQuick} data-quickstart />
        {#if bikes.length > 1 && !phone.matches}<button type="button" class="linkq" onclick={nextBike}>{t('Other bike')}</button>{/if}
      </div>
    {/if}
  {:else if loaded && !showFirst}
    <section class="trip none" aria-labelledby="next-h" data-section="trip">
      <div class="tc">
        <h2 id="next-h" class="tt">{t('No trip planned')}</h2>
        <p class="meta">{t('Start a packing list from a template, from your last trip or from Standard.')}</p>
        <div class="acts"><button type="button" class="btn hi main" onclick={() => (countUse('trip'), openNew('list'))} data-explain={t('Start a new trip')}>{t('New trip')}</button></div>
      </div>
    </section>
  {/if}
{/snippet}

<!-- 4. Important today and Tried it yet? -->
{#snippet todayS()}
  <div class="impw" data-section="today">
    <section class="imp" aria-labelledby="imp-h">
      <div class="ih"><span class="ico" aria-hidden="true"><TriangleAlert size={16} /></span><h2 id="imp-h">{t('Important today')}</h2>{#if important.length}<span class="cnt num" aria-hidden="true">{important.length}</span>{/if}</div>
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
                <span class="tx">{#if r.st}<span class="tsw"><TripState state={r.st} /></span>{/if}{r.text}</span>
                {#if r.act2?.run}
                  <!-- TZ-2: two answers («Ja · Nicht gefahren», «Rückblick · Alles gut») stay together on one line -->
                  <span class="ra"><button type="button" class="btn sm" onclick={() => act(r)}>{r.act.label}</button><button type="button" class={r.act2.quiet ? 'lkb' : 'btn sm'} onclick={r.act2.run}>{r.act2.label}</button></span>
                {:else}
                {#if r.act}
                  {#if r.act.href}<a class="lk" href={r.act.href} onclick={() => act(r)}>{r.act.label}</a>
                  {:else if r.act.care}<button type="button" class="btn sm" onclick={() => act(r)}>{r.act.label}</button>
                  {:else}<button type="button" class="btn sm" disabled={r.act.busy && backingUp} onclick={() => act(r)}>{r.act.label}</button>{/if}
                {/if}
                {#if r.act2}<a class="lk" href={r.act2.href} onclick={() => r.act2.trip && openTrip(r.act2.trip)}>{r.act2.label}</a>{/if}
                {/if}
                {#if r.later}<button type="button" class="lkb" onclick={r.later}>{t('later')}</button>{/if}
              {/if}
            </li>
          {/each}
        </ul>
        {#if important.length > 3}<button type="button" class="lkb more" aria-expanded={allRows} onclick={() => (allRows = !allRows)}>{allRows ? t('Show fewer') : t('Show all {n}', { n: important.length })}</button>{/if}
      {:else if ready}
        <p class="calm">{t('Nothing urgent. Enjoy the day.')}</p>
      {/if}
    </section>
  </div>
{/snippet}

<!-- v0.94.0 «Kachel-Wand»: what each tile shows (lib/home/tiles.js) -->
{#snippet tileBody(x)}
  {#if x.id === 'trip'}
    {#if focus || shown || (loaded && !showFirst)}<div class="stack">{@render tripS()}{#if ready}<KmCard {today} />{/if}</div>{/if}
  {:else if x.id === 'important'}{@render todayS()}
  {:else if x.id === 'flow'}<FlowCard {today} />
  {:else if x.id === 'series'}<SeriesTile {today} size={x.size} party={seriesParty} />
  {:else if x.id === 'news'}<NewsTile size={x.size} days={newsDays} onremove={() => saveWall(removeTile(wall, 'news'))} />
  {:else if x.id === 'meditation'}<MedTile {today} size={x.size} isnew={newTile('meditation')} />
  {:else if x.id === 'play'}<SmallTile tile={TILE.play} size={x.size} isnew={newTile('play')} sub={$demoQ?.play ? t('The playground is running') : t('try without risk')} onclick={openPlay} />
  {:else if x.id === 'try'}<TryCard list={tryList} used={used.size} total={FUNCTIONS.length} level={levelOf(used.size)} />
  {:else if x.id === 'bikes'}{#if ready}<div data-section="bikes"><BikeCards {bikes} {tasks} {visits} {next} {today} /></div>{/if}
  {:else if x.id === 'year'}<div data-section="year"><YearRow {today} /></div>
  {:else if x.id === 'milestones'}<SmallTile tile={TILE.milestones} size={x.size} href="#/flow/milestones" />
  {:else if x.id === 'helper'}<SmallTile tile={TILE.helper} size={x.size} href="#/helper" />
  {:else if x.id === 'features'}<SmallTile tile={TILE.features} size={x.size} href="#/features" />
  {:else if x.id === 'inbox'}<SmallTile tile={TILE.inbox} size={x.size} href="#/inbox" badge={notes.length} />
  {:else if x.id === 'data'}<SmallTile tile={TILE.data} size={x.size} onclick={openData} badge={backup.due ? 1 : 0} />
  {:else if x.id === 'suggest'}<TodaySuggest {today} />
  {:else if x.id === 'week'}<WeekTile {today} rides={$ridesQ ?? []} isnew={newTile('week')} />
  {:else if x.id === 'month'}<MonthTile {today} rides={$ridesQ ?? []} isnew={newTile('month')} />
  {:else if x.id === 'nextms'}<NextMsTile {bikes} {tripsDone} isnew={newTile('nextms')} />
  {:else if x.id === 'strava'}<StravaTile isnew={newTile('strava')} />
  {:else if x.id === 'balance'}<BalanceTile {today} size={x.size} isnew={newTile('balance')} />
  {:else if x.id === 'morningcheck'}<RoundTile {today} size={x.size} isnew={newTile('morningcheck')} />
  {:else if x.id === 'yearago'}<YearAgoTile trips={homeTrips(allTrips)} {debriefs} {today} isnew={newTile('yearago')} />
  {:else if TILE[x.id]?.fn}
    {@const f = FUNCTIONS.find((y) => y.id === TILE[x.id].fn)}
    <SmallTile tile={TILE[x.id]} size={x.size} fn={f.id} badge={badges[f.id] ?? 0} sub={fnSub(f.id)} onclick={() => runFn(f)} />
  {/if}
{/snippet}

<div class="home">
  {#if newsBanner.length}<NewsBanner entries={newsBanner} onclose={() => (newsBanner = [])} />{/if}
  <!-- HG1 2a: the greeting always first on Today, the evening before a trip too; the Vorabend line follows -->
  {@render greetingS()}
  <!-- v0.67.0 «Übergänge 1» (U3, U007, U24b, Ü6a): «Weitermachen» and the evening reminders, on top
       (HG1 2a: right under the greeting). -->
  {#if loaded && $debriefsQ}<Continue {trips} {debriefs} {today} hour={now.getHours()} cardId={on('trip') ? cardTrips[0]?.id ?? null : null} />{/if}
  <!-- «Sporttasche» (mockup AK3, 4a): the evening before a fixed date, «Morgen Yoga 07:00: Tasche packen» -->
  {#if loaded}<BagReminder {today} now={now.getTime()} />{/if}
  <!-- v0.30.2 (L9): a new user: three steps, each ticked once it has data. -->
  {#if showFirst}
    <section class="card first" aria-labelledby="first-h">
      <h2 id="first-h" class="title">{t('First steps')}</h2>
      <p class="muted">{t('Three steps, then Today shows your next trip.')}</p>
      <!-- «Rundgang» (Noah 15.10.2026 «4a», the line on Today approved): the tour through the app, on top of First steps -->
      <div class="tourline" data-tourline>
        <span><b>{t('New here? Take the tour')}</b><small>{t('2 minutes, with an example trip. Your data stays untouched.')}</small></span>
        <button type="button" class="btn sm hi" onclick={() => askTour('app')}>{t('Start ›|tour')}</button>
      </div>
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
          {#if steps.trip}<span class="txt">{t('Plan your first trip')}</span>{:else}<button type="button" class="btn sm step" onclick={() => openNew('list')} data-explain={t('Plan your first trip')}>{t('Plan a trip|first')}</button>{/if}
        </li>
      </ol>
    </section>
  {/if}

  {#if editing}
    <div class="ebar" role="region" aria-label={t('Customise the start page')}>
      <b>{t('Customise the start page')}</b>
      {#if !phone.matches}<span class="eh">{t('Drag to move · tap a tile for its size · × takes it away')}</span>{/if}
      <span class="ea">
        <button type="button" class="btn sm" onclick={resetWall}><RotateCcw size={16} aria-hidden="true" />{t('Reset')}</button>
        <button type="button" class="btn sm hi" onclick={() => (editing = false)}>{t('Done|customise')}</button>
      </span>
    </div>
  {/if}
  <!-- v0.116.0 «Strava-Verbindung» (4b, S4): a changed Strava bike asks here, on top, until you choose -->
  {#if !editing}<StravaChanges wide={!phone.matches} />{/if}
  <!-- AB3 «Deine Abfragen» (replaces SN2l): what is due now, a calm card under the greeting -->
  {#if !editing && ready}<AbCard {today} />{/if}
  <!-- SV1 «Strava verbinden» (Noah 13.10.2026): until Strava is connected on this device, one card on top -->
  {#if !editing}<StravaConnect wide={!phone.matches} bind:shown={stravaCard} />{/if}
  <!-- «App-Wartung» (Noah 13.10.2026): one calm line when a key runs out, a link fails or Strava's limit is near -->
  {#if !editing}<MaintHint blocked={stravaCard} bind:shown={maintHint} />{/if}
  <!-- v0.127.0 «Tages-Check» 2 (mockup T3): the hint to the long press, once, until it is closed -->
  {#if !editing && $setQ && !S[HINT_KEY] && !stravaCard && !maintHint && !hush}
    <p class="lphint" role="note" data-hint="longpress">
      <Hand size={18} aria-hidden="true" />
      <span><b>{t('Tip:')}</b> {t('Press a tile long to change its size. Or «{customise}».', { customise: t('Customise the start page') })}</span>
      <button type="button" class="lpx" aria-label={t('Close the tip')} onclick={closeHint}><X size={18} aria-hidden="true" /></button>
    </p>
  {/if}
  <!-- v0.127.0 A-U2 (mockup «Laden»): calm placeholders until Today has read its data, then the wall -->
  {#if ready}<Wall tiles={shownWall} body={tileBody} {editing} onedit={() => (editing = true)} onchange={saveShown} onadd={() => (catalogOpen = true)} />
  {:else}<Skeleton kind="home" rows={2} />{/if}

  <div class="custom">
    {#if editing}
      <form class="nm" onsubmit={saveName}>
        <label><span class="lbl">{t('Your name for the greeting')}</span><input class="inp" type="text" bind:value={nameIn} autocomplete="given-name" maxlength="40" /></label>
        <button type="submit" class="btn">{t('Save name')}</button>
      </form>
    {:else if phone.matches}
      <button type="button" class="lkb" data-intro="custom" onclick={() => (editing = true)}><Pencil size={16} aria-hidden="true" />{t('Customise the start page')}</button>
    {/if}
  </div>

  <footer>
    <span class="odot" class:off={!online}></span>
    {online ? t('Online') : t('Offline')} · v{__APP_VERSION__}
  </footer>
</div>

<!-- KT (3a): the short intro, once -->
{#if introOn}<IntroKT onend={endIntro} />{/if}

<!-- v0.119.0 «Schnellstart» (mockup Q2a): what one click made, Noah stays on Today -->
{#if made}
  <div class="qmade" role="status" data-quick-made>
    <p class="qt"><span aria-hidden="true">✓{'\u00a0'}</span>{t('Trip planned: {name}', { name: made.title })}</p>
    <p class="qs">{made.line}</p>
    <div class="qa">
      <Btn kind="hi" label={t('Open')} explain={explain('Open|quick')} href={madeTrip ? stepHere(madeTrip).href : '#/pack'} onclick={() => (openTrip(made.id), (made = null))} />
      <Btn label={t('Undo')} explain={explain('Undo|quick')} onclick={undoQuickStart} />
    </div>
    <button type="button" class="qx" aria-label={t('Close')} onclick={() => (made = null)}>×</button>
  </div>
{/if}
{#if catalogOpen}<TileCatalog on={onWall} hidden={hiddenTiles} ontoggle={toggleTile} onclose={() => (catalogOpen = false)} />{/if}
<dialog class="sheet wear" bind:this={wearDlg} onclose={() => (wearOpen = false)} onclick={(e) => e.target === wearDlg && (wearOpen = false)} aria-label={t('What do I wear?')}>
  <div class="wh"><button type="button" class="btn sm" onclick={() => (wearOpen = false)}>{t('Close')}</button></div>
  {#if wearOpen}
    <WearToday {items} {trips} />
    <p class="muted wnote">{t('Your clothes for the coldest hour of a ride at your home place, from the wardrobe.')} <a href="#/wardrobe" onclick={() => (wearOpen = false)}>{t('Open the wardrobe')}</a></p>
  {/if}
</dialog>

<style>
  /* v0.127.0 «Tages-Check» 2 (mockup T3): the hint to the long press, a calm yellow line */
  .lphint {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 12px;
    padding: 4px 4px 4px 14px;
    border: 1px solid color-mix(in srgb, var(--warn) 25%, var(--paper));
    border-radius: 14px;
    background: var(--warn-soft);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .lphint > :global(svg) {
    flex: none;
    color: var(--warn);
  }
  .lphint span {
    flex: 1;
    min-width: 0;
    padding: 8px 0;
  }
  .lpx {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  /* v0.119.0 «Schnellstart» (mockup Q2a): the green card after one click, above the page */
  .qmade {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: 96px;
    z-index: 40;
    width: min(520px, calc(100vw - 32px));
    padding: 14px 48px 14px 16px;
    border: 1px solid color-mix(in srgb, var(--ok) 40%, var(--ok-soft));
    border-radius: 14px;
    background: var(--ok-soft);
    box-shadow: 0 6px 24px var(--shadow);
  }
  .qmade p {
    margin: 0;
    overflow-wrap: break-word;
  }
  .qmade .qt {
    font-weight: 600;
  }
  .qmade .qs {
    margin-top: 2px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .qmade .qa {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }
  .qmade .qx {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-2);
    font-size: var(--fs-section);
    cursor: pointer;
  }
  @media (max-width: 719px) {
    .qmade {
      bottom: calc(96px + env(safe-area-inset-bottom));
    }
  }
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
  /* v0.101.0 Design-Refresh P2 (H1): the greeting alone in the heading, date and weather in one quiet
     line under it, «Customise the start page» as a light button at the top right */
  .ghead {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px 24px;
    min-width: 0;
  }
  .hi-text {
    flex: 1 1 440px; /* HG1a: room for the greeting's question (was 320px) */
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .hello {
    margin: 0;
    font: 700 var(--fs-page) / 1.1 var(--font-body);
    /* HG1a: the longer Swiss greeting (a question) is a little smaller, as in the mockup */
    font-size: var(--fs-title);
    line-height: 1.15;
    letter-spacing: -0.01em;
    overflow-wrap: break-word;
  }
  .dl {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .adapt {
    flex: none;
    background: var(--paper);
  }
  @media (max-width: 719px) {
    .hello {
      font-size: 25px;
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
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
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
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
    touch-action: pan-y;
  }
  @media (min-width: 900px) {
    .trip.wide2 {
      grid-template-columns: minmax(0, 1.4fr) minmax(260px, 1fr);
    }
  }
  .route {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
    padding: 0 14px 14px;
  }
  @media (min-width: 900px) {
    .route {
      padding: 22px 24px 18px 0;
    }
  }
  /* the number boxes: days, hours and open steps; the route's distance and climbing */
  .boxes {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
    gap: 8px;
    margin: 0;
  }
  .boxes div {
    display: flex;
    flex-direction: column-reverse;
    align-items: center;
    padding: 10px 8px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  .boxes dd {
    margin: 0;
    font: 600 24px/1.15 var(--font-body);
  }
  .boxes dt {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  @media (max-width: 719px) {
    .boxes div {
      padding: 6px;
    }
    .boxes dd {
      font-size: 20px;
    }
  }
  .boxes.sm div {
    align-items: flex-start;
    padding: 8px 12px;
  }
  .boxes.sm dd {
    font-size: 18px;
  }
  .packed {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .bar {
    height: 8px;
    border-radius: 4px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .bar span {
    display: block;
    height: 100%;
    border-radius: 4px;
    background: var(--hi);
  }
  .pl {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 2px 16px;
    margin: 0;
    font-size: var(--fs-small);
  }
  .pl b {
    font-weight: 600;
  }
  .pl span {
    color: var(--ink-2);
  }
  .tc {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
    padding: 22px 28px;
  }
  @media (max-width: 719px) {
    .tc {
      gap: 8px;
      padding: 12px 14px;
    }
  }
  .kl {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .kl > :global(svg) {
    flex: none;
  }
  /* v0.125.0 TZ-1: the state pill on its own line above the text of a row in «Heute wichtig» */
  .tsw {
    display: flex;
    margin-bottom: 2px;
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
    font: 700 clamp(21px, 1vw + 14px, 28px) / 1.15 var(--font-body);
    overflow-wrap: break-word;
  }
  .meta {
    margin: 4px 0 0;
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .meta.pack {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
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
    font-size: var(--fs-small);
  }
  .steps li {
    min-width: 0;
    padding-top: 6px;
    border-top: 3px solid var(--paper-2);
    color: var(--ink-2);
    overflow-wrap: break-word;
    hyphens: auto;
  }
  .steps li.done {
    border-top-color: var(--ok);
    color: var(--ink-2);
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
  .acts {
    gap: 8px 10px;
  }
  @media (max-width: 719px) {
    .btn.main {
      flex: 1 1 100%;
    }
  }
  /* v0.73.0 (Noah 1a): «Idea for tomorrow» beside a trip today is one slim row with a light button */
  .srow {
    display: flex;
    align-items: center;
    gap: var(--sp-2) var(--sp-3);
    min-height: 56px;
    padding: var(--sp-2) 18px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .srow :global(svg) {
    flex: none;
    color: var(--head);
  }
  .st {
    flex: 1 1 0;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .st b {
    font-weight: 600;
  }
  .st span {
    color: var(--ink-2);
  }
  .srow .btn {
    flex: none;
    min-height: 44px;
  }
  @media (max-width: 719px) {
    .srow {
      padding: var(--sp-2) var(--sp-3);
    }
    .st {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
  .trip.none .tc {
    gap: 10px;
  }

  /* 4. Important today + Tried it yet? */
  /* v0.94.0 «Kachel-Wand»: the trip tile stacks the card, the slim row and the week km */
  .stack {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .impw {
    height: 100%;
  }
  .imp {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
    min-width: 0;
    padding: 14px 18px 8px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  /* v0.101.0 Design-Refresh P2 (H1): the tile head, an icon in a grey square, the name, the count */
  .ih {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--line);
  }
  .ih h2 {
    flex: 1;
    margin: 0;
    font: 600 var(--fs-body)/1.3 var(--font-body);
  }
  .ico {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .cnt {
    color: var(--ink-3);
    font-size: var(--fs-small);
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
  .custom .lkb {
    gap: 6px;
    color: var(--ink-2);
    font-size: 14px;
  }
  .nm {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px 12px;
    align-self: stretch;
    max-width: 560px;
    margin: 0 auto;
  }
  .nm label {
    flex: 1 1 220px;
  }
  /* edit mode: one dark bar on top of the wall, «Reset» and «Done» always in reach */
  .ebar {
    position: sticky;
    top: 8px;
    z-index: 30;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
    padding: 10px 16px;
    border-radius: 14px;
    background: var(--ink);
    color: var(--paper);
  }
  .eh {
    color: color-mix(in srgb, var(--paper) 75%, transparent);
    font-size: var(--fs-small);
  }
  .ea {
    display: flex;
    gap: 8px;
    margin-left: auto;
  }
  .ea .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
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
  /* «Rundgang»: the line on top of First steps */
  .tourline {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 12px 0 4px;
    padding: 12px 14px;
    border-radius: 14px;
    background: var(--hi-soft);
    border: 2px solid var(--hi);
  }
  .tourline > span {
    flex: 1;
    display: grid;
    gap: 2px;
  }
  .tourline small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .tourline .btn {
    white-space: nowrap;
  }
</style>
