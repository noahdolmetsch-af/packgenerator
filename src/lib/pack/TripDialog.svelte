<script>
  import { offerTrip } from '../remind/ask.svelte.js';
  import DateInput from '../ui/DateInput.svelte';
  import { backClose } from '../ui/backclose.js';
  import '../trip/trip.css';
  import { tick } from 'svelte';
  import { liveQuery } from 'dexie';
  import { Check, ChevronRight, ChevronDown, Bike as BikeIcon, Plus, MapPin, Sun, Star, Flag, Info, MountainSnow, Footprints, Briefcase, Hotel, Snowflake, History } from '@lucide/svelte';
  import { db } from '../db.js';
  import { isOnMe } from '../swap.js';
  import { newTrip, switchBike, WX_PRESETS, bagItemIds, touched, riddenTrips, lastTripOn } from '../trips.js';
  import { newBikeRecord } from '../bikes.js';
  import { contextSummary, startEntries, applyContext, hasContext, contextSets, dropNightOnly, NIGHT_CHOICES, nightFields, OFFER_ONLY, hasTent } from '../context.js';
  import { ridesIntoDark } from '../blockplan.js';
  import { isEvent } from '../care.js';
  import { tripFromTemplate, templateDefaults, tplDomain, templateParts } from '../templates.js';
  import { t, tn, num, nameOf, locale } from '../i18n.svelte.js';
  import Help from '../ui/Help.svelte'; // FE14
  import { FIELD_HELP, weiter } from '../daumen.js'; // FE14, FE16
  import { TRIP_DOMAINS, DOMAIN, BIKEPACKING, domainName, rememberDomain, newPackTrip, readyKey, inDomain, hasBike } from '../domains.js';
  import { groupEntries, examplesFor, EXAMPLES_HIDDEN } from '../packgroups.js';
  import { coldLayer } from '../layers.js';
  import { searchPlace } from '../weather.js';
  import { catIcon } from '../gear/caticon.js';
  import { isInventory, knownWeight, formatWeight, STD_CATEGORIES } from '../gear.js';
  import { SETS_KEY, allSets, addSetEntries, tripSlot, entriesWeight, isBlockTip, templateBlocks, blocksLine, blockLabel } from '../sets.js';
  import { localDay } from '../localday.js';
  import { autoKeep, leaveWindow } from '../drafts.js';
  import { selectAll } from '../ui/selectall.js';
  import { rideName, rideDate, freeTitle, buildBikeTrip, fetchHomeForecast, forecastPreset, homeOf, pickWxChip, noWx } from '../dayride.js';
  import { X } from '@lucide/svelte';
  import TripAsk from '../helper/TripAsk.svelte';
  import { helper, isSetUp, isOn } from '../helper/client.svelte.js';
  import { addHelperItems } from '../helper/logic.js';
  import { take } from '../nav.js';
  import OptionButton from '../ui/OptionButton.svelte';
  import KomootRow from '../komoot/KomootRow.svelte'; // SN1b (answer 4a): «Tour aus komoot» next to the templates
  import { komootSport } from '../komoot.js';
  import { newTripOff } from '../repairslim.js';
  import { similarHours, nameClash } from '../formprefill.js';
  import '../ui/daumen.css'; // FE1: Save stays at the bottom edge of the window on a phone
  import { tourBike, tourBikeId, standardBike, setTourBike, TOUR_BIKE } from '../tourbike.svelte.js';
  import TourBikeAsk from '../bikes/TourBikeAsk.svelte';
  import BikeOrderSheet from '../bikes/BikeOrderSheet.svelte';
  import '../bikes/standardvelo.css';

  /**
   * trip: the trip to edit, or null for "New trip".
   * A new trip is a copy of the last trip with the same bike (decision 5a),
   * or starts from a template (4.10.2026) or from the standard set.
   * v0.21.0 (package 5): a new trip asks the area first (domain; default the last one used on this
   * device). Areas without a bike skip the bike and templates; their bags come with the area.
   * v0.25.0 (M3, Noah 1a–10): for a bike trip the dialog asks what kind of trip it is (hours per day,
   * overnight stay, cooking, weather, event) and shows live what the packing list will be
   * (context.js). Editing a trip applies a changed context at once through onchange (Pack's
   * change(), so Undo works, 9b).
   * v0.30.0 (Noah, finding 2): one window for a new bike trip, top to bottom: bike chips, when and
   * how long (the night from 2 days on), the standard set as a card, what the weather brings by
   * itself, building blocks to add (Rain, Light, own blocks …), template or last trip folded away,
   * and "Create trip · n items". Standard + Rain = 4 clicks (+, Plan a trip, Rain, Create).
   * bags: the containers (Pack's), so a block skips the bags themselves like Pack's block chips.
   * v0.102.0 Design-Refresh P4 «Touren» (T2, approved 12.10.2026 «Touren T1–T6 freigegeben»): a light
   * window: title with one sentence, the kind of trip as chips (the area), the name right under it, the
   * bike chips with a bike, when and how long, «Packliste startet mit» as a gallery (standard, the last
   * trip, the templates), the helper's notice at the end and «Abbrechen · Tour anlegen» on the right.
   * v0.114.0 «Rahmenbedingungen» (Noah 12.10.2026, B1–B3 approved «b1 ok», «b3 ok», «b2 b4 b5 ok»): the title
   * «Rahmenbedingungen» without the hint line; «Sportart» Fahrrad (default) · Skitour · Wandern · + Andere;
   * the weather from a start postcode (Open-Meteo, free); the event with its hint and the block «Rennen»;
   * «Vorlage wählen» folded, as buttons: Standard, own templates and two examples, never a past trip
   * (the bug: «Letzte Tour» showed test and future trips); the whole list in four groups with a picture
   * per item, worn items apart; building blocks only in Packen (Repair and Charging no longer by
   * themselves: switch them on in Packen). The helper only comes with a question from the search.
   */
  let { trip, trips: allTrips, bikes, items, bags = [], templates = [], startFrom = 'standard', domain = null, defaultBikeId = null, onclose, oncreated, onchange = null } = $props();

  // svelte-ignore state_referenced_locally
  const isNew = !trip;
  /*
   * v0.35.0 (AP29, Noah 4b + 5a): nothing typed is lost. As soon as a name is typed, the new trip is
   * saved (autoId) and every further choice here updates it; closing the window keeps it (Pack then
   * opens it, with Undo). Only "Discard" takes back the trip this window made (it has nothing else yet).
   * The dialog's own trip is left out of `trips`, so "Copy the last trip" never copies itself.
   */
  let autoId = $state(null);
  let autoNow = null; // the trip's id and creation time, fixed at the first save
  let ended = false; // "Create trip" or "Discard": closing does nothing more
  const trips = $derived(allTrips.filter((x) => x.id !== autoId));
  // VS1 (Noah 14.10.2026): «always the standard bike» wins over the bike of the open trip; with «the one
  // ridden last» the open trip's bike comes first, as before
  // svelte-ignore state_referenced_locally
  const openBike = tourBike.mode === 'last' && bikes.some((b) => b.id === defaultBikeId);
  // svelte-ignore state_referenced_locally
  let draft = $state(
    trip
      ? { title: trip.title, startDate: trip.startDate ?? '', days: trip.days ?? 1, bikeId: trip.bikeId ?? bikes[0]?.id, testTrip: trip.testTrip === true }
      : // v0.25.1 (Noah 2a): a new trip starts filled in: start date (today, after 14:00 tomorrow) and
        // the bike of the open or last trip; the name follows below. "Create trip" works untouched.
        { title: '', startDate: rideDate(), days: 1, bikeId: openBike ? defaultBikeId : tourBikeId(trips, bikes) ?? bikes[0]?.id },
  );
  // v0.25.1 (Noah 2a): the name is made from bike, date and days until Noah types in it.
  let autoName = $state(isNew);
  // v0.25.0 (M3): the trip's context. An older trip without an overnight value shows none chosen.
  // svelte-ignore state_referenced_locally
  const was = {
    hours: trip?.hours != null ? String(trip.hours) : '',
    overnight: trip?.overnight ?? null,
    cook: !!trip?.cook,
    min: trip?.wx?.min ?? null,
    max: trip?.wx?.max ?? null,
    rain: trip?.wx?.rain ?? 'none',
    event: trip ? isEvent(trip) : false,
    // v0.66.0 (Noah 8a): Bivouac + tent; a new trip starts with the tent (as the old "Outdoor (tent, bivvy)").
    tent: trip?.tent !== false, // an older outdoor trip (no field) had the tent
  };
  let ctx = $state({ ...was });
  const days = $derived(Math.max(1, Number(draft.days) || 1));
  // Noah 1a: None for 1 day, Outdoor from 2 days on, until one is chosen.
  // v0.30.0 (Noah, finding 2): a new trip asks for the night only from 2 days on; one day has none.
  const night = $derived(isNew && days === 1 ? 'none' : ctx.overnight ?? (isNew ? (days > 1 ? 'outdoor' : 'none') : null));
  const hoursNum = $derived(ctx.hours.trim() === '' ? null : Number(ctx.hours.replace(',', '.')));
  const hoursOk = $derived(hoursNum === null || (hoursNum >= 0.5 && hoursNum <= 24));
  const wet = $derived(ctx.rain === 'showers' || ctx.rain === 'rain');
  const wxOut = $derived(ctx.min != null || ctx.max != null || ctx.rain !== 'none' ? { min: ctx.min, max: ctx.max, rain: ctx.rain } : null);
  // v0.47.3 (Noah: «Kühl + Regen» brought nothing): a chip sets, it never takes off (dayride.js pickWxChip).
  function pickWx(choice) {
    wxTouched = true; // v0.25.1: Noah's own choice; the forecast leaves it alone
    Object.assign(ctx, pickWxChip(ctx, choice));
  }
  /** The context fields to store (only for bike trips). */
  // v0.66.0 (Noah 7a, 9a): dark: the ride goes into the dark (Light comes); sets: the ride blocks taken off here.
  const ctxFields = () => ({ hours: hoursOk ? hoursNum : null, overnight: night, cook: night === 'outdoor' && ctx.cook, tent: night === 'outdoor' && ctx.tent, wx: wxOut, event: ctx.event, dark, ...(isNew && off.length ? { sets: Object.fromEntries(off.map((k) => [k, false])) } : {}), ...(isNew && wxPlace ? { place: wxPlace } : {}) });
  // v0.66.0 (Noah 8a): the night as one choice: none, Bivouac, Bivouac + tent, Hotel/hut.
  const choice = $derived(night === 'outdoor' ? (ctx.tent ? 'tent' : 'bivy') : night === 'lodging' ? 'hotel' : night);
  function pickNight(key) {
    const f = nightFields(key);
    ctx.overnight = f.overnight;
    ctx.tent = f.tent;
  }
  // v0.66.0 (Noah 7a): Light comes by itself when the ride goes into the dark (sunset at the trip's or the home place).
  const homeQ = liveQuery(() => db.settings.get('homePlace'));
  const darkPlace = $derived(trip?.place ?? wxPlace ?? homeOf($homeQ?.value) ?? null);
  const dark = $derived(ridesIntoDark({ ...(trip ?? {}), startDate: draft.startDate, days, hours: hoursOk ? hoursNum : null }, darkPlace));
  // v0.66.0 (Noah 9a): the ride blocks the window suggests, taken off with a tap (a visible suggestion, never forced).
  // v0.114.0 (Noah: «92 Teile … nur 10-20»): Repair (36 tools) and Charging no longer come by themselves
  // with a new trip; they stay one switch away in Packen (answer 1a: building blocks only when packing).
  // v0.124.0 B5 (Noah «a ★ Ja, schlank dabei»): a slim Repair (at most 8 parts) comes again by itself,
  // a suggestion that Packen takes off with one tap; a Repair that is not slim yet stays off (repairslim.js).
  // svelte-ignore state_referenced_locally
  let off = $state(isNew ? newTripOff(items) : []);
  // v0.114.0 (bug «Letzte Tour»): a new trip never started from a past trip here, only Standard or a template.
  // v0.143.0 WS3 (Release-Analyse F5, Noah 14.10.2026 «1a»): «Like the last trip» is back, but only from a
  // trip really ridden with the chosen bike (riddenTrips: never a trip planned for later, never skipped).
  // svelte-ignore state_referenced_locally
  let start = $state(startFrom);
  // v0.26.1 (AP18, Noah 17b): a template brings its days, riding hours, overnight stay (+ cooking) and
  // bike as the dialog's defaults; everything stays changeable here.
  function useTemplate(id) {
    const d = templateDefaults(templates.find((x) => x.id === id), bikes);
    if (d.days) draft.days = d.days;
    if (d.bikeId) draft.bikeId = d.bikeId;
    if (d.hours != null) ctx.hours = String(d.hours);
    if (d.overnight) (ctx.overnight = d.overnight), (ctx.cook = d.cook);
  }
  // svelte-ignore state_referenced_locally
  if (isNew) useTemplate(startFrom);
  // v0.39.0 (AP28): a template makes a trip of its own area (older templates: bikepacking).
  // svelte-ignore state_referenced_locally
  const startTpl = templates.find((x) => x.id === startFrom);
  // svelte-ignore state_referenced_locally
  // v0.114.0 (Noah): a new trip starts as Fahrrad, unless it comes from a template or an area's page.
  // svelte-ignore state_referenced_locally
  let area = $state(startTpl ? tplDomain(startTpl) : DOMAIN[domain] && DOMAIN[domain].trip !== false ? domain : BIKEPACKING);
  // v0.114.0 (answer 2a): «Sportart» Fahrrad · Skitour · Wandern in sight, the other areas behind «+ Andere».
  // Data cleanup 14.10.2026: which areas are in sight, their names and icons come from domains.js (DOMAINS[].sport).
  // v0.124.0: the examples' icons (also the sports) for the shared option button (ui/OptionButton.svelte).
  const EX_ICON = { bag: Briefcase, hut: Hotel, ski: MountainSnow, walk: Footprints, bike: BikeIcon };
  const SPORTS = TRIP_DOMAINS.filter((d) => d.sport).map((d) => ({ key: d.key, name: d.sportName ?? d.name, icon: EX_ICON[d.icon] ?? BikeIcon }));
  const otherAreas = TRIP_DOMAINS.filter((d) => !SPORTS.some((x) => x.key === d.key));
  // svelte-ignore state_referenced_locally
  let othersOpen = $state(otherAreas.some((d) => d.key === area));
  // v0.114.0 (answer 3b, B2): two example templates per kind of trip; they can be hidden.
  let example = $state(null);
  let tplOpen = $state(false);
  const hiddenQ = liveQuery(() => db.settings.get(EXAMPLES_HIDDEN));
  const examples = $derived($hiddenQ?.value ? [] : examplesFor(area));
  const chosenEx = $derived(examples.find((x) => x.id === example) ?? null);
  function pickExample(ex) {
    start = 'standard';
    example = ex.id;
    draft.days = ex.days;
    moreWanted = ex.days >= 3;
    if (ex.hours != null) ctx.hours = String(ex.hours);
    if (ex.overnight) (ctx.overnight = ex.overnight), (ctx.cook = false);
  }
  async function hideExamples() {
    example = null;
    await db.settings.put({ key: EXAMPLES_HIDDEN, value: true });
  }
  // v0.39.0 (Noah 6a): archived templates are not offered; only the ones of the chosen area.
  const areaTemplates = $derived(templates.filter((x) => !x.archivedAt && tplDomain(x) === area));
  const chosenTpl = $derived(templates.find((x) => x.id === start) ?? null);
  const byBike = $derived(isNew ? !!DOMAIN[area]?.bike : hasBike(trip));
  // v0.143.0 WS3: the trips a copy may come from, and the last one ridden with the bike chosen above
  // (the bike chips decide the bike; «Like the last trip» follows them).
  const ridden = $derived(riddenTrips(trips));
  const lastRidden = $derived(isNew && byBike && draft.bikeId ? lastTripOn(draft.bikeId, ridden) : null);
  const lastWhen = $derived(lastRidden?.startDate ? new Date(`${lastRidden.startDate}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' }) : '');
  const lastLine = $derived(lastRidden ? [lastWhen, lastRidden.bike ?? bikes.find((b) => b.id === lastRidden.bikeId)?.name ?? ''].filter(Boolean).join(' · ') : '');
  function pickLast() {
    start = 'last';
    example = null;
  }
  const areaItems = $derived(items.filter((i) => isInventory(i) && inDomain(i, area)).length);
  // A template of another area does not fit: back to the standard (the area's items).
  // v0.28.0 (Noah 8.10.2026): a new trip starts with the standard set; templates are optional.
  $effect(() => {
    const tp = templates.find((x) => x.id === start);
    if (tp && tplDomain(tp) !== area) start = 'standard';
    // v0.143.0 WS3: no ridden trip with this bike (or not a bike trip): back to the standard
    if (start === 'last' && !lastRidden) start = 'standard';
    if (example && !examplesFor(area).some((x) => x.id === example)) example = null;
  });
  let error = $state('');
  let dialog;
  const bike = $derived(bikes.find((b) => b.id === draft.bikeId));
  $effect(() => {
    // v0.127.0 A-U5: the made name is one no other trip has («… (2)»), like the day ride's
    if (autoName) draft.title = freeTitle(rideName({ bike: byBike ? bike?.name : '', label: byBike ? '' : t(domainName(area)), date: draft.startDate, days }), trips);
  });

  /* ---------- v0.127.0 A-U5 «Formulare nutzen vorhandene Daten» (formprefill.js) ---------- */
  // The riding hours of the last similar trips (same days), on a green field with where they come from;
  // typing replaces them, a template or an example sets its own. Nothing is locked.
  const simHours = $derived(isNew && byBike ? similarHours(trips, days) : null);
  let hoursOwn = $state(false);
  let hoursSet = ''; // the value the suggestion put in last
  $effect(() => {
    if (!isNew || hoursOwn) return;
    const v = simHours ? String(simHours.hours) : '';
    if (ctx.hours === '' || ctx.hours === hoursSet) {
      ctx.hours = v;
      hoursSet = v;
    }
  });
  const hoursPre = $derived(isNew && !hoursOwn && !!simHours && ctx.hours === String(simHours.hours));
  const hoursFrom = $derived(
    !simHours ? '' : days === 1 ? tn(simHours.n, 'like your last day ride · you can change it', 'like your last {n} day rides · you can change it') : days === 2 ? tn(simHours.n, 'like your last two-day trip · you can change it', 'like your last {n} two-day trips · you can change it') : tn(simHours.n, 'like your last trip of {d} days · you can change it', 'like your last {n} trips of {d} days · you can change it', { d: days }),
  );
  // the bike of the last trip (chosen above), said once below the chips until another one is tapped
  // svelte-ignore state_referenced_locally
  const bikeAtStart = isNew && trips.some((x) => hasBike(x) && !x.skipped && x.bikeId === draft.bikeId) ? draft.bikeId : null;
  // svelte-ignore state_referenced_locally
  const bikeFromOpen = openBike;
  let bikeOwn = $state(false);
  const bikePre = $derived(!!bikeAtStart && !bikeOwn && draft.bikeId === bikeAtStart && bikes.length > 1);
  // VS1–VS4 (Noah 14.10.2026 «VS1–VS4 freigegeben», «1a 2b 3a»): the standard bike (first in the order)
  // has a star and is chosen unless «the one ridden last» was picked; the app asks that once, here,
  // at the first new trip with more than one bike. «Change standard» opens the order window.
  const stdBike = $derived(standardBike(bikes));
  const stdPre = $derived(!bikeFromOpen && !bikeOwn && tourBike.mode !== 'last' && draft.bikeId === stdBike?.id && bikes.length > 1);
  let askTourBike = $state(false);
  let orderOpen = $state(false);
  $effect(() => {
    // «bei der allerersten Tour, nur einmalig» (Noah 13.10.2026 21:33): only while no trip exists yet
    if (!isNew || bikes.length < 2 || bikeFromOpen || (allTrips ?? []).length) return;
    db.settings.get(TOUR_BIKE).then((row) => (askTourBike = !row));
  });
  // a new standard chosen in the order window comes along while no bike was tapped
  let prevStd = null;
  $effect(() => {
    const id = stdBike?.id ?? null;
    if (isNew && !bikeOwn && !bikeFromOpen && tourBike.mode !== 'last' && prevStd && id && id !== prevStd && draft.bikeId === prevStd) draft.bikeId = id;
    prevStd = id;
  });
  async function answerTourBike(mode) {
    askTourBike = false;
    await setTourBike(db, mode);
    if (!bikeOwn) draft.bikeId = tourBikeId(trips, bikes, mode) ?? draft.bikeId;
  }
  // the check at the name field: another trip has this name → a free one to take with one tap
  const clash = $derived(nameClash(draft.title, trips, trip?.id ?? null));
  const clashWhen = $derived(clash?.trip.startDate ? new Date(`${clash.trip.startDate}T12:00:00`).toLocaleDateString(locale(), { month: 'long', year: 'numeric' }) : '');
  const takeFree = () => ((draft.title = clash.suggestion), (autoName = false));

  // v0.25.1 (Noah 3a): with a home place and the internet, the weather preset comes from the
  // forecast for the start date (short timeout; offline or failed: nothing happens). Once Noah
  // picks a weather himself, the forecast no longer changes it.
  let forecast = $state.raw(null);
  let wxTouched = $state(false);
  const fcWx = $derived(isNew && byBike ? forecastPreset(forecast, draft.startDate) : null);
  const fromForecast = $derived(!!fcWx && ctx.min === fcWx.min && ctx.max === fcWx.max && ctx.rain === fcWx.rain);
  // v0.114.0 (Noah: «Wettervorschlag … mit PLZ, kostenlos»): the start place, from the settings' home place,
  // changeable here by postcode or name (Open-Meteo's free place search). Kept on the trip (trip.place).
  let wxPlace = $state.raw(null);
  let placeText = $state('');
  let placeTyped = $state(false);
  let placeBusy = $state(false);
  let placeErr = $state('');
  $effect(() => {
    const home = homeOf($homeQ?.value);
    if (isNew && !placeTyped && !wxPlace && home) placeText = home.name ?? '';
  });
  // v0.127.0 A-U5: the home place as the start, green with where it comes from, until changed
  const placePre = $derived(isNew && !placeTyped && !wxPlace && !!homeOf($homeQ?.value)?.name && placeText === homeOf($homeQ?.value)?.name);
  async function findPlace() {
    const q = placeText.trim();
    if (!q || placeBusy) return;
    placeBusy = true;
    placeErr = '';
    try {
      const [p] = await searchPlace(q);
      if (p) {
        wxPlace = { name: p.name, lat: p.lat, lon: p.lon };
        placeText = p.name;
        wxTouched = false; // a new place: its forecast may set the weather again
      } else placeErr = t('No place found for «{q}».', { q });
    } catch {
      placeErr = t('No connection: the weather stays as chosen.');
    } finally {
      placeBusy = false;
    }
  }
  $effect(() => {
    if (!isNew) return;
    const p = wxPlace;
    let gone = false;
    (p ? Promise.resolve(p) : db.settings.get('homePlace').then((r) => homeOf(r?.value)))
      .then((pl) => (pl ? fetchHomeForecast(pl) : null))
      .then((fc) => !gone && fc && (forecast = fc))
      .catch(() => {});
    return () => (gone = true);
  });
  $effect(() => {
    if (!fcWx || wxTouched) return;
    ctx.min = fcWx.min;
    ctx.max = fcWx.max;
    ctx.rain = fcWx.rain;
  });

  $effect(() => {
    dialog.showModal();
  });

  /** The start of a new bike trip (template, last trip or standard set), before its context. */
  function startTrip() {
    const tpl = templates.find((x) => x.id === start);
    const base = tpl ? tripFromTemplate({ ...draft, bike }, tpl, items, Date.now(), setsValue) : newTrip({ ...draft, bike, overnight: night }, start === 'standard' ? [] : ridden, items);
    return { base, tpl, fromCopy: !tpl && !!base.copiedFrom };
  }
  // v0.25.0 (M3): "Your packing list", live from the same pure functions as "Create trip".
  // v0.30.0 (Noah, finding 2): the start as a card (count, weight, names) and what comes by itself.
  const preview = $derived.by(() => {
    if (!isNew || !byBike || !bike) return null;
    const { base, tpl, fromCopy } = startTrip();
    const fields = ctxFields();
    const trip = { ...base, ...fields, hours: fields.hours ?? base.hours ?? null };
    const start = fromCopy ? startEntries(trip, items) : base.entries;
    const sum = contextSummary(start, trip, items);
    const list = dropNightOnly(start, trip, items).filter((e) => byId.has(e.itemId));
    return { tpl, ...sum, w: entriesWeight(list, items), n: list.length };
  });
  const byId = $derived(new Map(items.map((i) => [i.id, i])));

  // v0.30.0 (Noah, finding 2): the new trip as "Create trip" will make it, live (count on the button).
  const built = $derived(isNew && byBike && bike ? buildBikeTrip({ draft: { ...draft }, bike, start, templates, trips: ridden, items, fields: ctxFields(), sets: setsValue }, 0) : null);
  // Building blocks that do not come by themselves (contextSets), with what each would add. The
  // same function as Pack's "Add material → Building blocks" (addSetEntries), same bags skipped.
  const setsQ = liveQuery(() => db.settings.get(SETS_KEY));
  const setsValue = $derived($setsQ?.value ?? []);
  const sets = $derived(allSets($setsQ?.value).map((s) => ({ ...s, label: s.builtIn ? s.name.replace(/^(Night|Nacht): /, '') : s.name })));
  const skip = $derived(new Set([...bagItemIds(bags), ...(bike?.fixtures ?? [])]));
  let picked = $state([]);
  const blocks = $derived.by(() => {
    if (!built) return [];
    const comes = contextSets({ overnight: night, cook: night === 'outdoor' && ctx.cook, tent: night === 'outdoor' && ctx.tent, dark, event: ctx.event });
    return sets
      .filter((s) => !comes.includes(s.key) && !OFFER_ONLY.includes(s.key))
      .map((s) => {
        const add = addSetEntries(built, items, s, { skip, slotOf: () => 'body' }).entries.slice(built.entries.length);
        const w = entriesWeight(add, items);
        return { ...s, n: add.length, weight: w.missing && !w.g ? formatWeight(null) : knownWeight(w.g, w.missing), names: add.map((e) => `${nameOf(byId.get(e.itemId))}${e.qty > 1 ? ` ${e.qty}×` : ''}`), tip: isBlockTip(s, { wet, max: ctx.max, night }) };
      })
      .filter((s) => s.n > 0 || picked.includes(s.key))
      .sort((a, b) => b.tip - a.tip); // the tips first
  });
  const chosen = $derived(blocks.filter((s) => picked.includes(s.key)));
  const pick = (key) => (picked = picked.includes(key) ? picked.filter((k) => k !== key) : [...picked, key]);
  /** The trip with the chosen blocks, each into its usual bag (Pack: tripSlot with the trip's setup). */
  const withBlocksOnly = (nt) => {
    const out = chosen.reduce((cur, s) => ({ ...cur, entries: addSetEntries(cur, items, s, { skip, slotOf: (i) => tripSlot(i, cur.setup) }).entries }), nt);
    return out;
  };
  const withBlocks = (nt) => withExtras(withBlocksOnly(nt));
  // v0.114.0 (answers 4b, 7a): the list in four groups; the button counts what goes into the bags.
  const warmIds = $derived(new Set((preview?.weather ?? []).filter((i) => coldLayer(i)).map((i) => i.id)));
  const builtEntries = $derived(built ? withBlocks(built).entries : []);
  const packList = $derived(built ? groupEntries(builtEntries, items, warmIds) : null);
  // 0.161.0 (Bugfixes 0.132.2 B1, Noah 5b + 4a): the button counts what the trip will hold, as Pack does:
  // «x in the bags · y on me»; on me = the body and the worn places (swap.js isOnMe), as on the trip.
  const known = $derived(new Set(items.map((i) => i.id)));
  const meN = $derived(builtEntries.filter((e) => known.has(e.itemId) && isOnMe(e)).length);
  const bagN = $derived(builtEntries.filter((e) => known.has(e.itemId)).length - meN);
  const total = $derived(bagN + meN);
  // v0.114.0 (answer 5b, B3): the event brings the block «Rennen»; its items named in the hint.
  const raceItems = $derived(items.filter((i) => isInventory(i) && inDomain(i, BIKEPACKING) && i.sets?.includes('race') && !skip.has(i.id)));
  const RACE_COLOR = STD_CATEGORIES.find((c) => c.key === 'cook').color;
  const raceW = $derived(entriesWeight(raceItems.map((i) => ({ itemId: i.id, qty: 1 })), items));

  /* ---------- v0.77.0 (answer 1a): «Frag den Helfer» ---------- */
  // From the search («Als Packliste vorschlagen», answer 2a): the question comes along and is asked at once.
  // svelte-ignore state_referenced_locally
  const askPrefill = isNew ? take('pack.helperAsk') ?? '' : '';
  let extras = $state([]); // [{ id, reason }] the helper's extra items, each with × in the form
  const extraRows = $derived(extras.filter((r) => byId.has(r.id)));
  const askAreas = $derived(TRIP_DOMAINS.map((d) => ({ key: d.key, name: t(d.name) })));
  /** «Übernehmen»: the chips that are left go into the form; blocks switch on; the items come along. */
  function takeProposal(p) {
    const c = p.conditions;
    if (c.area && DOMAIN[c.area]) area = c.area;
    if (c.bikeId && bikes.some((b) => b.id === c.bikeId)) draft.bikeId = c.bikeId;
    if (c.days > 0) {
      draft.days = c.days;
      moreWanted = c.days >= 3;
    }
    if (c.overnight) (ctx.overnight = c.overnight), (ctx.cook = c.overnight === 'outdoor' && !!c.cook);
    if (c.tempMin != null || c.tempMax != null || c.rain) {
      wxTouched = true;
      if (c.tempMin != null) (ctx.min = c.tempMin), (ctx.max = c.tempMax ?? c.tempMin);
      if (c.rain) ctx.rain = c.rain;
    }
    const comes = contextSets({ overnight: c.overnight || night, cook: !!c.cook });
    picked = [...new Set([...picked, ...p.blocks.filter((k) => !comes.includes(k) && sets.some((s) => s.key === k))])];
    extras = [...extras.filter((r) => !p.items.some((x) => x.id === r.id)), ...p.items];
  }
  /** The helper's items into a trip: bike trips into their usual bag, other areas into their first bag. */
  const withExtras = (nt) => (extraRows.length ? addHelperItems(nt, items, extraRows.map((r) => r.id), (i) => (nt.packs?.length ? nt.packs[0].key : tripSlot(i, nt.setup))) : nt);

  // v0.30.0 (Noah, finding 2): when and how long as chips; the date field stays for any other day.
  const today = localDay();
  const tomorrow = localDay(new Date(Date.now() + 864e5));
  let daysInput = $state();
  const LENGTHS = [{ n: 1, name: 'Day ride' }, { n: 2, name: '2 days' }, { n: 3, name: 'More' }];
  // "More" chosen (the field stays while typing 2 or 1), or 3 and more days (also from a template).
  let moreWanted = $state(false);
  const moreDays = $derived(moreWanted || days >= 3);
  async function pickLength(n) {
    draft.days = n < 3 ? n : Math.max(3, days);
    moreWanted = n === 3;
    if (n === 3) {
      await tick();
      daysInput?.focus();
    }
  }
  // Templates in words: "1 day · 2 h · Standard + Rain", else their item count.
  const stdIds = $derived(bike ? newTrip({ title: '', startDate: '', days: 1, bike, overnight: 'none' }, [], items, 0).entries.map((e) => e.itemId) : []);
  function tplLine(tp) {
    const d = templateDefaults(tp, bikes);
    const parts = [tn(d.days ?? 1, '{n} day', '{n} days')];
    if (d.hours != null) parts.push(t('{n} h', { n: num(d.hours) }));
    // v0.30.1 (Noah N10): always in blocks ("Standard + Rain + Light"), the rest as "+ 3 extra".
    // v0.32.0 (finding 5): "Standard + Rain + 2 extra" (blocksLine, the same words as the Templates page).
    // v0.39.0 (AP28): a linked template says its blocks itself.
    const linked = templateParts(tp, setsValue);
    parts.push(linked ? blocksLine(linked, blockLabel) : blocksLine(templateBlocks((tp.entries ?? []).map((e) => e.itemId), stdIds, sets, items), (s) => s.label));
    return parts.join(' · ');
  }
  function pickStart(id) {
    start = id;
    example = null;
    useTemplate(id);
  }

  // L9: "+ Add a bike" inside the dialog when there is no bike (it was a dead end: "Choose a bike." without a choice).
  let addingBike = $state(false);
  let bikeName = $state('');
  let bikeBusy = $state(false);
  let bikeInput = $state();
  $effect(() => {
    if (addingBike && bikeInput) bikeInput.focus();
  });
  async function saveBike() {
    const name = bikeName.trim();
    if (!name) return (error = t('Give the bike a name.'));
    if (bikeBusy) return;
    bikeBusy = true;
    try {
      const rec = newBikeRecord(name, bikes, $state.snapshot(bags));
      await db.bikes.put(rec);
      draft.bikeId = rec.id;
      addingBike = false;
      bikeName = '';
      error = '';
    } catch {
      error = t('Could not save. Please try again.');
    } finally {
      bikeBusy = false;
    }
  }

  /** v0.39.0 (AP28): a new trip without a bike: from a template of this area, a copy of the last one, or the area's items. */
  function packTrip(readyStandard, now) {
    const snap = $state.snapshot(draft);
    if (chosenTpl) return withExtras(tripFromTemplate(snap, $state.snapshot(chosenTpl), items, now ?? Date.now(), $state.snapshot(setsValue)));
    return withExtras(newPackTrip({ ...snap, domain: area, readyStandard }, start === 'standard' ? [] : trips, items, now ?? Date.now()));
  }

  async function save(event) {
    event.preventDefault();
    if (!draft.title.trim()) return (error = t('Give the trip a name.'));
    if (byBike && !bike) return bikes.length ? (error = t('Choose a bike.')) : ((addingBike = true), (error = t('Add a bike first.')));
    if (byBike && !hoursOk) return (error = t('Riding hours per day: between 0.5 and 24, or leave it empty.'));
    if (isNew && !byBike) {
      const readyStandard = (await db.settings.get(readyKey(area)))?.value ?? null;
      const nt = packTrip(readyStandard, autoNow ?? Date.now());
      ended = true;
      clearTimeout(autoTimer);
      await db.trips.put(touched(nt));
      rememberDomain(area);
      oncreated?.(nt.id);
      offerTrip(nt); // ER2 (Noah 14.10.2026 «er1-er3 freigabe»): «Soll ich dich vor der Tour erinnern?»
    } else if (isNew) {
      const readyStandard = (await db.settings.get('readyStandard'))?.value ?? null;
      // v0.25.1: the same path as the day ride (dayride.js buildBikeTrip); wxFrom says the weather came from the forecast.
      const fields = { ...ctxFields(), ...(fromForecast ? { wxFrom: 'forecast' } : {}) };
      const nt = buildBikeTrip({ draft: $state.snapshot(draft), bike: $state.snapshot(bike), start, templates, trips: ridden, items, readyStandard, fields, sets: $state.snapshot(setsValue) }, autoNow ?? Date.now());
      ended = true;
      clearTimeout(autoTimer);
      // v0.30.0 (Noah, finding 2): the building blocks chosen in the window, like Pack's block chips.
      await db.trips.put(touched($state.snapshot(withBlocks(nt))));
      rememberDomain(BIKEPACKING);
      oncreated?.(nt.id);
      offerTrip(nt); // ER2: «Soll ich dich vor der Tour erinnern?»
    } else {
      const changes = { title: draft.title.trim(), startDate: draft.startDate, days: Math.max(1, Number(draft.days) || 1) };
      if (draft.testTrip !== (trip.testTrip === true)) changes.testTrip = draft.testTrip; // 0.161.0 (Noah H3a)
      if (byBike) {
        // v0.25.0 (M3): only what was changed here is stored (an older trip keeps its values).
        const f = ctxFields();
        if (ctx.hours !== was.hours) changes.hours = f.hours;
        if (night && (night !== was.overnight || ctx.cook !== was.cook || f.tent !== hasTent({ overnight: was.overnight, tent: was.tent }))) Object.assign(changes, { overnight: night, cook: f.cook, tent: f.tent });
        if (f.dark !== !!trip.dark) changes.dark = f.dark; // v0.66.0: Light follows the dark
        // v0.25.1: weather chosen here is no longer "from the forecast".
        if (ctx.min !== was.min || ctx.max !== was.max || ctx.rain !== was.rain) Object.assign(changes, { wx: f.wx, wxFrom: null });
        if (ctx.event !== was.event) changes.event = ctx.event;
      }
      const switching = byBike && draft.bikeId !== trip.bikeId;
      // Another bike brings its own bags; items in a place it has no bag for go to the seat pack.
      // 9b: a changed context (duration, overnight stay, weather) applies at once, with Undo in Pack.
      const fn = (cur) => {
        const next = { ...cur, ...changes, ...(switching ? switchBike(cur, bike) : {}) };
        const out = { ...changes, ...(switching ? switchBike(cur, bike) : {}) };
        return hasContext(next) ? { ...out, ...applyContext(next, items, cur) } : out;
      };
      if (onchange) await onchange(fn);
      else await db.trips.update(trip.id, touched(fn(await db.trips.get(trip.id))));
    }
    dialog.close();
  }

  /* ---------- v0.35.0 (AP29): the new trip is saved while it is typed ---------- */
  /** The new trip as the window would make it now, or null while it cannot be made (no name typed, no bike, hours wrong). */
  async function autoRecord() {
    if (!autoKeep({ isNew, name: draft.title, changed: !autoName })) return null;
    if (!byBike) {
      const readyStandard = (await db.settings.get(readyKey(area)))?.value ?? null;
      return packTrip(readyStandard, autoNow);
    }
    if (!bike || !hoursOk) return null;
    const readyStandard = (await db.settings.get('readyStandard'))?.value ?? null;
    const fields = { ...ctxFields(), ...(fromForecast ? { wxFrom: 'forecast' } : {}) };
    return $state.snapshot(withBlocks(buildBikeTrip({ draft: $state.snapshot(draft), bike: $state.snapshot(bike), start, templates, trips: ridden, items, readyStandard, fields, sets: $state.snapshot(setsValue) }, autoNow)));
  }
  let autoTimer;
  let autoBusy = Promise.resolve();
  function autoSave() {
    autoBusy = autoBusy.then(async () => {
      if (ended) return;
      autoNow ??= Date.now();
      const nt = await autoRecord();
      if (!nt || ended) return;
      await db.trips.put(touched(nt));
      autoId = nt.id;
    });
    return autoBusy;
  }
  // Every change of a field (after a name was typed) saves again, a moment after the last key.
  $effect(() => {
    if (!isNew) return;
    JSON.stringify([draft, ctx, start, picked, area, autoName, off, dark, extras, wxPlace]); // what the trip is made of
    if (!autoKeep({ isNew, name: draft.title, changed: !autoName })) return;
    clearTimeout(autoTimer);
    autoTimer = setTimeout(autoSave, 300);
    return () => clearTimeout(autoTimer);
  });
  /** Closing (Escape, outside, Close) keeps what was typed: the last change is saved, Pack opens the trip. */
  async function closed() {
    if (isNew && !ended && leaveWindow('close', { made: !!autoId, typed: autoKeep({ isNew, name: draft.title, changed: !autoName }) }) === 'keep') {
      clearTimeout(autoTimer);
      await autoSave();
      if (autoId && !ended) {
        ended = true;
        rememberDomain(area);
        oncreated?.(autoId);
      }
    }
    onclose?.();
  }
  // v0.72.0 «Feinschliff» (Umbenennen 4a, back rule in every window): Android back and Escape keep
  // what was typed. A new trip keeps it as before (closed()); an existing trip saves its changes like
  // «Save» (nothing changed: it only closes).
  // svelte-ignore state_referenced_locally
  const openedAs = JSON.stringify([draft, ctx]);
  const keepOnBack = () => (isNew || JSON.stringify([$state.snapshot(draft), $state.snapshot(ctx)]) === openedAs ? dialog.close() : save({ preventDefault() {} }));
  /** "Discard": the trip this window made goes again (it was made here and has nothing else). */
  async function discard() {
    ended = true;
    clearTimeout(autoTimer);
    await autoBusy;
    if (autoId) await db.trips.delete(autoId);
    dialog.close();
  }

  async function remove() {
    if (!confirm(t('Delete the trip "{title}"? A backup file can bring it back.', { title: trip.title }))) return;
    await db.trips.delete(trip.id);
    dialog.close();
  }
</script>

{#snippet overnight()}
  <fieldset class="ctx">
    <legend class="lbl">{t('Overnight')}</legend>
    <div class="chips">
      {#each NIGHT_CHOICES as o (o.key)}<button type="button" class="toggle" aria-pressed={choice === o.key} onclick={() => pickNight(o.key)}>{t(o.name)}</button>{/each}
    </div>
    {#if !night}<p class="note">{t('Not set for this trip: its list stays as it is until you choose.')}</p>{/if}
    {#if days > 1 && night === 'none'}<p class="note">{t('More than one day without a night? Choose where you sleep.')}</p>{/if}
    <!-- Noah 3a: cooking only for a night outdoors. -->
    {#if night === 'outdoor'}<label class="ck"><input type="checkbox" bind:checked={ctx.cook} /> {t('Cooking')}</label>{/if}
  </fieldset>
{/snippet}
{#snippet weather()}
  <fieldset class="ctx">
    <legend class="lbl">{t('Weather')}</legend>
    {#if isNew}
      <!-- v0.114.0 (B1): the start place by postcode or name; the forecast for it as a suggestion (Open-Meteo, free). -->
      <div class="plz">
        <label class="plzin" class:pre={placePre}><MapPin size={18} aria-hidden="true" /><input class="inp" class:pre={placePre} aria-describedby={placePre ? 'tn-placefrom' : undefined} bind:value={placeText} oninput={() => (placeTyped = true)} onblur={() => placeTyped && findPlace()} onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), findPlace())} placeholder={t('e.g. 3011 Bern')} aria-label={t('Start postcode or place')} enterkeyhint="search" /></label>
        {#if placePre && !placeBusy && !placeErr}<small class="prefrom" id="tn-placefrom">{t('from your home place · you can change it')}</small>
        {:else}<p class="note small">{placeBusy ? t('Looking up the place …') : placeErr || (wxPlace ? t('Start place for this trip') : t('Start postcode, from your settings. Changeable here.'))}</p>{/if}
      </div>
      {#if fcWx}
        <div class="fcard" aria-live="polite">
          <Sun size={22} aria-hidden="true" />
          <div class="fct">
            <b>{t('Forecast suggestion: {min}–{max}°, {rain}', { min: fcWx.min, max: fcWx.max, rain: fcWx.rain === 'rain' ? t('Rain') : fcWx.rain === 'showers' ? t('showers') : t('dry') })}</b>
            <small>{t('{place} · free from Open-Meteo', { place: forecast?.place?.name ?? '' })}</small>
          </div>
          {#if !fromForecast}<button type="button" class="btn sm" onclick={() => ((wxTouched = false), Object.assign(ctx, { min: fcWx.min, max: fcWx.max, rain: fcWx.rain }))}>{t('Use|forecast')}</button>{/if}
        </div>
      {/if}
    {/if}
    <div class="chips">
      <!-- v0.47.1 (Noah d): the forecast's own range, when it is not one of the presets (it used to be rounded to one). -->
      {#if fcWx && !WX_PRESETS.some((p) => p.min === fcWx.min && p.max === fcWx.max)}<button type="button" class="toggle" aria-pressed={ctx.min === fcWx.min && ctx.max === fcWx.max} onclick={() => pickWx({ min: fcWx.min, max: fcWx.max })}>{fcWx.min}–{fcWx.max}° <small class="fcmark">{t('from forecast')}</small></button>{/if}
      {#each WX_PRESETS as p (p.name)}<button type="button" class="toggle" aria-pressed={ctx.min === p.min && ctx.max === p.max} onclick={() => pickWx(p)}>{t(p.name)} <small>{p.min}–{p.max}°</small>{#if fromForecast && ctx.min === p.min && ctx.max === p.max}<small class="fcmark">{t('from forecast')}</small>{/if}</button>{/each}
    </div>
    <!-- v0.47.3: dry or rain as two chips, the same as on the trip page (it was a «+ Rain» toggle). -->
    <div class="chips" role="group" aria-label={t('Rain')}>
      <button type="button" class="toggle" aria-pressed={!wet && !noWx(ctx)} onclick={() => pickWx({ rain: 'none' })}>{t('Dry|weather')}</button>
      <button type="button" class="toggle" aria-pressed={wet} onclick={() => pickWx({ rain: 'rain' })}>{t('Rain')}</button>
      <!-- v0.47.3 (Noah: never binding, always removable): the whole weather off, also the forecast's. -->
      <button type="button" class="toggle" aria-pressed={noWx(ctx)} onclick={() => pickWx({ none: true })}>{t('No weather|chip')}</button>
    </div>
    {#if fromForecast}<p class="note small fc">{t('From the forecast for {place}', { place: forecast.place?.name ?? '' })}</p>
    {:else if !isNew}<p class="note small">{t('or get the forecast later in Pack (Edit trip conditions)')}</p>{/if}
  </fieldset>
{/snippet}

{#snippet clashMsg()}
  <!-- v0.127.0 A-U5: the check at the field, before saving; a free name to take with one tap (never forced) -->
  {#if clash}<p class="fieldmsg" id="tn-clash">{clashWhen ? t('This name already exists ({when}).', { when: clashWhen }) : t('This name already exists.')} <button type="button" class="tp-link" onclick={takeFree}>{t('Suggestion: «{name}»', { name: clash.suggestion })}</button></p>{/if}
{/snippet}

{#snippet helperItems()}
  {#if extraRows.length}
    <section class="blocks kh-extras" aria-labelledby="kh-extras-h">
      <h3 id="kh-extras-h">{t('From the helper')}</h3>
      <div class="tp-chips">
        {#each extraRows as r (r.id)}<button type="button" class="tp-chip" aria-label={t('Remove {name}', { name: nameOf(byId.get(r.id)) })} title={r.reason} onclick={() => (extras = extras.filter((x) => x.id !== r.id))}>{nameOf(byId.get(r.id))} <X size={16} aria-hidden="true" /></button>{/each}
      </div>
    </section>
  {/if}
{/snippet}


{#snippet templatesFold()}
  <!-- v0.114.0 (answers 1a, 3b, B2): «Vorlage wählen» folded; the starts as buttons: Standard, own templates,
       two examples of this kind of trip. Never a past trip (the bug «Letzte Tour»).
       v0.143.0 WS3: «Like the last trip» on top again, only a trip really ridden with the chosen bike. -->
  <section class="tplbox" class:open={tplOpen}>
    <button type="button" class="tplhead" aria-expanded={tplOpen} aria-controls="tpl-body" onclick={() => (tplOpen = !tplOpen)}>
      <span class="tplic" aria-hidden="true"><Star size={18} /></span>
      <span class="tplt"><b>{t('Choose a template')}</b><small>{tplOpen ? t('The packing list starts with it: the last trip ridden with this bike or a template.') : t('{name} chosen · {own} own, {ex} examples', { name: chosenTpl ? chosenTpl.name : chosenEx ? t(chosenEx.name) : start === 'last' && lastRidden ? t('Like the last trip') : t('Standard'), own: areaTemplates.length, ex: examples.length })}</small></span>
      {#if tplOpen}<ChevronDown size={20} aria-hidden="true" />{:else}<ChevronRight size={20} aria-hidden="true" />{/if}
    </button>
    {#if tplOpen}
      <div id="tpl-body" class="tplbody">
        <!-- v0.143.0 WS3 (F5, Noah «1a»): first the last trip really ridden with this bike, with its date and bike -->
        {#if lastRidden}
          <p class="grp-l">{t('Like the last trip')}</p>
          <div class="obtns" role="group" aria-label={t('Like the last trip')}>
            <OptionButton pressed={start === 'last'} icon={History} label={lastRidden.title || t('Last trip')} title={lastLine} data-start="last" onclick={pickLast} />
          </div>
        {/if}
        <p class="grp-l">{t('Your templates')}</p>
        <div class="obtns" role="group" aria-label={t('Your templates')}>
          <OptionButton pressed={start === 'standard' && !example} label={t('Standard')} onclick={() => ((start = 'standard'), (example = null))} />
          {#each areaTemplates as tp (tp.id)}<OptionButton pressed={start === tp.id} icon={Star} label={tp.name} title={tplLine(tp)} onclick={() => pickStart(tp.id)} />{/each}
        </div>
        {#if examples.length}
          <p class="grp-l">{t('Examples {sport}', { sport: t(SPORTS.find((x) => x.key === area)?.name ?? domainName(area)) })}</p>
          <div class="obtns" role="group" aria-label={t('Examples')}>
            {#each examples as ex (ex.id)}<OptionButton pressed={example === ex.id} icon={EX_ICON[ex.icon] ?? BikeIcon} label={t(ex.name)} onclick={() => pickExample(ex)} />{/each}
          </div>
        {/if}
        <p class="tplinfo"><Info size={16} aria-hidden="true" /><span>
          {#if chosenTpl}<b>{chosenTpl.name}</b> · {tplLine(chosenTpl)}
          {:else if start === 'last' && lastRidden}<b>{lastRidden.title || t('Last trip')}</b> · {lastLine}{#if preview}{' · '}{tn(preview.n, '{n} item', '{n} items')}{/if}{' · '}{t('copied, nothing ticked off')}
          {:else if chosenEx}<b>{t(chosenEx.name)}</b> · {tn(chosenEx.days, '{n} day', '{n} days')}{#if chosenEx.hours != null}{' · '}{t('{n} h', { n: num(chosenEx.hours) })}{/if} · {t('from Standard')}
          {:else}<b>{t('Standard')}</b>{#if preview}{' · '}{tn(preview.n, '{n} item', '{n} items')} · {knownWeight(preview.w.g, preview.w.missing)}{/if} · {t('always with you')}{/if}
        </span></p>
        <p class="note small">{t('Save your own templates from a trip with «Save as template».')}{#if examples.length} <button type="button" class="tp-link" onclick={hideExamples}>{t('Hide examples')}</button>{/if}</p>
      </div>
    {/if}
  </section>
{/snippet}

{#snippet komootRow()}
  <!-- SN1b (answer 4a): «Tour aus komoot», a quiet row next to the templates; it only opens komoot -->
  {#if komootSport(area, bike?.type)}<div class="kmbox"><KomootRow framed sport={komootSport(area, bike?.type)} /></div>{/if}
{/snippet}

{#snippet eventBox()}
  <!-- v0.114.0 (answer 5b, B3): the event as a box with its hint; ticked, the block «Rennen» with its items. -->
  <section class="evbox" class:on={ctx.event}>
    <label class="ck ev"><input type="checkbox" bind:checked={ctx.event} /> {t('Event: a race or organised ride')}</label>
    <p class="note small evn">{ctx.event ? t('For a race or an organised ride the block «Race» comes along. You can take it off again when packing.') : raceItems.length ? t('Ticked, the block «Race» comes along ({names}).', { names: raceItems.slice(0, 3).map((i) => nameOf(i)).join(', ') }) : t('Ticked, the block «Race» comes along.')}</p>
    {#if ctx.event && raceItems.length}
      <div class="grp race">
        <h4><span class="gic" style:--c={RACE_COLOR} aria-hidden="true"><Flag size={16} /></span><span>{t('Block «Race»')}</span><small class="num">{tn(raceItems.length, '{n} item', '{n} items')} · {knownWeight(raceW.g, raceW.missing)}</small></h4>
        <ul>
          {#each raceItems as i (i.id)}{@const Icon = catIcon(i.category)}<li><span class="pic" aria-hidden="true"><Icon size={16} /></span><span class="nm">{nameOf(i)}</span><span class="wt num">{formatWeight(i.weightG == null ? null : i.weightG * (i.qty || 1))}</span></li>{/each}
        </ul>
      </div>
    {/if}
  </section>
{/snippet}

{#snippet packListView()}
  <!-- v0.114.0 (answers 4b, 7a, B1): the whole list in four groups, a picture per item, long names wrap, weight on the right. -->
  <section class="plist" aria-labelledby="plist-h" aria-live="polite">
    <div class="plh">
      <h3 id="plist-h">{t('Your packing list')}</h3>
      <span class="num">{tn(packList.bag, '{n} item to pack', '{n} items to pack')} · {knownWeight(packList.w.g, packList.w.missing)}</span>
    </div>
    <p class="note small">{t('From Standard, weather and duration. Everything can be changed.')}{#if packList.worn.length}{' '}{tn(packList.worn.length, 'Plus {n} item on the body ({names}), counted apart.', 'Plus {n} items on the body ({names}), counted apart.', { names: packList.worn.slice(0, 2).map((i) => nameOf(i)).join(', ') + (packList.worn.length > 2 ? ' …' : '') })}{/if}</p>
    {#each packList.groups as g (g.key)}
      <div class="grp" style:--c={g.color}>
        <h4><span class="gic" aria-hidden="true">{#if g.key === 'warm'}<Snowflake size={16} />{:else if g.key === 'elec'}{@const E = catIcon('elec')}<E size={16} />{:else if g.key === 'clothes'}{@const C = catIcon('onbike')}<C size={16} />{:else}{@const G = catIcon('tools')}<G size={16} />{/if}</span><span>{t(g.name)}</span><small class="num">{tn(g.n, '{n} item', '{n} items')} · {knownWeight(g.w.g, g.w.missing)}</small></h4>
        {#if g.key === 'warm' && ctx.min != null}<p class="warmn">{t('Comes along: down to {n}°', { n: ctx.min })}</p>{/if}
        <ul>
          {#each g.rows as r (r.entry.itemId + r.entry.slot)}{@const Icon = catIcon(r.item.category)}<li><span class="pic" aria-hidden="true"><Icon size={16} /></span><span class="nm">{nameOf(r.item)}{#if r.entry.qty > 1}{' '}{r.entry.qty}×{/if}</span><span class="wt num">{knownWeight(r.w.g, r.w.missing)}</span></li>{/each}
        </ul>
      </div>
    {/each}
  </section>
{/snippet}

<dialog class="sheet trip-dlg" bind:this={dialog} use:backClose={keepOnBack} onclose={closed} aria-labelledby="trip-h">
  <form onsubmit={save} novalidate use:weiter>
    <!-- v0.114.0 (Noah): «Rahmenbedingungen», no hint line under it. -->
    <header class="dh">
      <h2 id="trip-h">{isNew ? t('Conditions|newtrip') : t('Trip details')}</h2>
    </header>
    <!-- v0.114.0 (Noah: «KI helfer soll raus»): the helper only with a question from the search («Als Packliste vorschlagen»). -->
    {#if isNew && askPrefill && helper.loaded && isSetUp() && isOn()}
      <TripAsk {items} {bikes} {sets} areas={askAreas} prefill={askPrefill} onapply={takeProposal} />
    {/if}
    {#if isNew}
      <!-- v0.114.0 (answer 2a): «Sportart», Fahrrad first; the other areas behind «+ Andere». -->
      <fieldset class="ctx area">
        <legend class="lbl">{t('Sport')}</legend>
        <div class="tp-chips areas">
          {#each SPORTS as d (d.key)}{@const Icon = d.icon}<button type="button" class="tp-chip" aria-pressed={area === d.key} onclick={() => (area = d.key)}><Icon size={16} aria-hidden="true" />{t(d.name)}</button>{/each}
          {#if othersOpen}
            {#each otherAreas as d (d.key)}<button type="button" class="tp-chip" aria-pressed={area === d.key} onclick={() => (area = d.key)}>{t(d.name)}</button>{/each}
          {:else if otherAreas.length}
            <button type="button" class="tp-chip more" aria-expanded="false" onclick={() => (othersOpen = true)}><Plus size={16} aria-hidden="true" />{t('Other|sport')}</button>
          {/if}
        </div>
      </fieldset>
    {/if}
    {#if isNew && byBike}
      <label class="name"><span class="lbl">{t('Name')}</span><input class="inp" use:selectAll bind:value={draft.title} oninput={() => (autoName = false)} placeholder={t('e.g. Jura weekend')} required aria-invalid={!!clash} aria-describedby={clash ? 'tn-clash' : undefined} /></label>
      {@render clashMsg()}
      <!-- v0.30.0 (Noah, finding 2): the whole new bike trip in one window. -->
      {#if bikes.length}
        <fieldset class="ctx">
          <legend class="lbl">{t('Bike')}</legend>
          <div class="tp-chips">
            {#each bikes as b (b.id)}<button type="button" class="tp-chip" aria-pressed={draft.bikeId === b.id} onclick={() => ((draft.bikeId = b.id), (bikeOwn = true))}><BikeIcon size={16} aria-hidden="true" />{b.name}{#if b.id === stdBike?.id && bikes.length > 1}<span class="sv-pill" aria-hidden="true"><Star size={12} class="sv-star" />{t('Standard')}</span>{/if}</button>{/each}
          </div>
          {#if stdPre}
            <p class="sv-hint std-pre"><Star size={14} class="sv-star" aria-hidden="true" /><span><b>{t('Standard bike')}</b> {t('is chosen. A tap on another bike counts only for this trip.')} <button type="button" class="std-link" onclick={() => (orderOpen = true)}>{t('Change standard')}</button></span></p>
          {:else if bikePre}<small class="prefrom">{bikeFromOpen ? t('the bike of the open trip · you can change it') : t('the bike of your last trip · you can change it')}</small>{/if}
        </fieldset>
      {:else}
        <!-- L9: no bike yet: add one right here (only its name), it is chosen at once. -->
        <fieldset class="ctx nobike">
          <legend class="lbl">{t('Bike')}</legend>
          {#if addingBike}
            <div class="bikeadd">
              <input class="inp" bind:this={bikeInput} bind:value={bikeName} onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), saveBike())} placeholder={t('e.g. Gravel bike')} aria-label={t('Name of the bike')} enterkeyhint="done" />
              <button type="button" class="btn" disabled={bikeBusy} onclick={saveBike}>{t('Save')}</button>
            </div>
          {:else}
            <p class="note">{t('No bike added yet.')}</p>
            <button type="button" class="btn" onclick={() => ((addingBike = true), (error = ''))}>+ {t('Add a bike')}</button>
          {/if}
        </fieldset>
      {/if}
      <fieldset class="ctx">
        <legend class="lbl">{t('When?')}</legend>
        <div class="tp-chips">
          <button type="button" class="tp-chip" aria-pressed={draft.startDate === today} onclick={() => (draft.startDate = today)}>{t('Today')}</button>
          <button type="button" class="tp-chip" aria-pressed={draft.startDate === tomorrow} onclick={() => (draft.startDate = tomorrow)}>{t('Tomorrow')}</button>
          <DateInput class="inp date" bind:value={draft.startDate} aria-label={t('Start date')} />
        </div>
      </fieldset>
      <fieldset class="ctx">
        <legend class="lbl">{t('How long?')}</legend>
        <div class="tp-chips">
          {#each LENGTHS as l (l.n)}<button type="button" class="tp-chip" aria-pressed={l.n < 3 ? days === l.n && !moreDays : moreDays} onclick={() => pickLength(l.n)}>{t(l.name)}</button>{/each}
        </div>
        <div class="grid two">
          <!-- v0.40.0 (design check): the field for the days only with "More"; 1 and 2 days are the chips. -->
          {#if moreDays}<label><input class="inp num" type="number" inputmode="numeric" min="1" max="60" bind:value={draft.days} bind:this={daysInput} aria-label={t('Days')} /><span class="sub">{t('Days')}</span></label>{/if}
          <label><input id="tn-hours" class="inp num" class:pre={hoursPre} type="text" inputmode="decimal" bind:value={ctx.hours} oninput={() => (hoursOwn = true)} placeholder={t('e.g. 2')} aria-label={t('Riding hours per day')} aria-invalid={!hoursOk} aria-describedby={hoursPre ? 'tn-hoursfrom' : undefined} /><span class="sub">{t('Riding hours per day')} <Help field="tn-hours" text={t(FIELD_HELP.hours)} /></span></label>
        </div>
        {#if hoursPre}<small class="prefrom" id="tn-hoursfrom">{hoursFrom}</small>{/if}
        {#if !hoursOk}<p class="warn">{t('Riding hours per day: between 0.5 and 24, or leave it empty.')}</p>{/if}
      </fieldset>
      {#if days > 1}{@render overnight()}{/if}
      {@render weather()}
      {@render eventBox()}
      {@render templatesFold()}{@render komootRow()}
      {@render helperItems()}
      {#if packList}{@render packListView()}{/if}
    {:else}
      <div class="grid">
        <label class="wide"><span class="lbl">{t('Name')}</span><input class="inp" use:selectAll bind:value={draft.title} oninput={() => (autoName = false)} placeholder={t('e.g. Jura weekend')} required aria-invalid={!!clash} aria-describedby={clash ? 'tn-clash' : undefined} /></label>
        {#if clash}<div class="wide">{@render clashMsg()}</div>{/if}
        <label><span class="lbl">{t('Start date')}</span><DateInput bind:value={draft.startDate} /></label>
        {#if byBike}
          <label>
            <span class="lbl">{t('Bike')}</span>
            <select class="sel" bind:value={draft.bikeId}>
              {#each bikes as b (b.id)}<option value={b.id}>{b.name}</option>{/each}
            </select>
          </label>
        {:else}
          <label><span class="lbl">{t('Days')}</span><input class="inp num" type="number" inputmode="numeric" min="1" max="60" bind:value={draft.days} /></label>
        {/if}
      </div>
      {#if byBike}
        <!-- v0.25.0 (M3, Noah 1a): what kind of trip it is, all on one page. -->
        <fieldset class="ctx">
          <legend class="lbl">{t('How long?')}</legend>
          <div class="grid">
            <label><input class="inp num" type="number" inputmode="numeric" min="1" max="60" bind:value={draft.days} aria-label={t('Days')} /><span class="sub">{t('Days')}</span></label>
            <label><input id="te-hours" class="inp num" type="text" inputmode="decimal" bind:value={ctx.hours} placeholder={t('e.g. 2')} aria-label={t('Riding hours per day')} aria-invalid={!hoursOk} /><span class="sub">{t('Riding hours per day')} <Help field="te-hours" text={t(FIELD_HELP.hours)} /></span></label>
          </div>
          {#if !hoursOk}<p class="warn">{t('Riding hours per day: between 0.5 and 24, or leave it empty.')}</p>{/if}
        </fieldset>
        {@render overnight()}
        {@render weather()}
        <label class="ck ev"><input type="checkbox" bind:checked={ctx.event} /> {t('Event (race or organised ride)')}</label>
      {/if}
      {#if !isNew}
        <!-- 0.161.0 (Noah H3a): only this switch hides a trip as a test; its name never does. -->
        <label class="ck"><input type="checkbox" bind:checked={draft.testTrip} data-test-trip /> {t('Test trip (counts nowhere)')}</label>
      {/if}
      {#if isNew}
        <!-- v0.114.0 (bug «Letzte Tour»): no past trip as a start; templates and examples as buttons. -->
        {@render templatesFold()}{@render komootRow()}
        {@render helperItems()}
        <p class="note">
          {#if chosenTpl}{t('From the template {name}. Bags: {bags}.', { name: chosenTpl.name, bags: DOMAIN[area].packs.map((p) => t(p.name)).join(', ') })}
          {:else if areaItems}{t('Starts with the {area} items in Standard. Bags: {bags}.', { area: t(domainName(area)), bags: DOMAIN[area].packs.map((p) => t(p.name)).join(', ') })}
          {:else}{t('No items for {area} yet, so the list starts empty. Add items in Pack (search finds all your gear), or in Gear: open an item and tick {area} under Areas.', { area: t(domainName(area)) })}{/if}
        </p>
      {:else if byBike && draft.bikeId !== trip.bikeId}
        <p class="note">{t('The trip takes the bags of the new bike. Items in a place without a bag move to the seat pack.')}</p>
      {/if}
    {/if}
    <p class="err" role="alert">{error}</p>
    <div class="foot daumen-foot" class:fnew={isNew}>
      {#if !isNew}<button type="button" class="btn del" onclick={remove}>{t('Delete trip')}</button>{/if}
      {#if isNew && autoId}<span class="kept" role="status"><Check size={14} aria-hidden="true" />{t('Saved')}</span><button type="button" class="btn" onclick={discard}>{t('Discard')}</button>
      {:else}<button type="button" class="btn" onclick={() => (isNew ? discard() : dialog.close())}>{t('Cancel')}</button>{/if}
      <!-- v0.30.0 (Noah, finding 2): the live item count on the one orange button; v0.114.0 (7a): bag items only. -->
      <button type="submit" class="btn hi">{isNew ? t('Create trip') : t('Save')}{#if total}<span class="cnt" data-count-split>{` · ${t('{n} in the bags', { n: bagN })}${meN ? ` · ${t('{n} on me', { n: meN })}` : ''}`}</span>{/if}</button>
    </div>
  </form>
</dialog>

{#if askTourBike}
  <TourBikeAsk standard={stdBike} onanswer={answerTourBike} />
{/if}
{#if orderOpen}
  <BikeOrderSheet {bikes} onclose={() => (orderOpen = false)} />
{/if}

<style>
  .std-pre {
    margin-top: 8px;
  }
  .std-pre b {
    color: var(--ink-2);
    font-weight: 600;
  }
  .std-link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
  .area {
    border: 0;
    margin: 0;
    padding: 0;
  }
  .areas {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .toggle {
    min-height: 44px;
    border: 1px solid var(--line-strong);
    background: var(--paper);
    border-radius: 999px;
    padding: 5px 14px;
    font: 500 var(--fs-small) var(--font-body);
    color: var(--ink);
    cursor: pointer;
  }
  /* v0.25.1 (Noah 3a): the preset the forecast chose. */
  .fcmark {
    margin-left: 6px;
    font-weight: 500;
    opacity: 0.85;
  }
  .toggle[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  /* v0.25.0 (M3): the context of a bike trip and the live "Your packing list". */
  .ctx {
    border: 0;
    margin: 14px 0 0;
    padding: 0;
    min-width: 0;
  }
  .ctx .grid label,
  .ctx label {
    display: grid;
    gap: 2px;
  }
  .sub {
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  /* v0.47.3: dry or rain on a row of its own under the ranges. */
  .chips + .chips {
    margin-top: 6px;
  }
  .ck {
    display: flex !important;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    min-height: 44px;
  }
  .ck input {
    width: 20px;
    height: 20px;
  }
  .ev {
    margin-top: 12px;
    font-weight: 600;
  }
  .warn {
    color: var(--bad);
    font-size: var(--fs-small);
    margin: 6px 0 0;
  }
  .small {
    font-size: var(--fs-small);
  }
  h2 {
    font-size: var(--fs-section);
    margin: 0;
  }
  /* v0.30.0 (Noah, finding 2): the window of a new trip. The dark band like the trip pages,
     chips and one card style from trip.css, 44 px taps. */
  .trip-dlg {
    width: min(600px, calc(100vw - 24px));
  }
  /* v0.102.0 P4 (T2): the light head of the window */
  .trip-dlg {
    padding: 22px 22px 18px;
    border-radius: var(--radius-card);
  }
  .dh {
    margin: 0 0 4px;
  }
  .area .areas {
    gap: 6px;
  }

  .ctx .tp-chips {
    align-items: center;
  }
  /* v0.67.1: the date field is ui/DateInput.svelte (its own box around the input) */
  .tp-chips :global(.date-in) {
    flex: 1 1 170px;
    max-width: 220px;
  }
  .tp-chips :global(.inp.date) {
    min-height: 44px;
  }
  .grid.two {
    margin-top: 8px;
  }
  .blocks {
    margin-top: 16px;
  }
  .blocks h3 {
    margin: 0 0 8px;
    font: 600 var(--fs-sub)/1.25 var(--font-body);
  }
  .name {
    display: grid;
    gap: 4px;
    margin-top: 8px;
  }
  .cnt {
    font-weight: 500;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .wide {
    grid-column: 1 / -1;
  }
  /* v0.25.0: at 320 px the bike name needs the whole width. */
  @media (max-width: 360px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
  .note {
    font-size: var(--fs-small);
    color: var(--ink-2);
    margin: 12px 0 0;
  }
  /* L9: a bike added inside the dialog. */
  .nobike .note {
    margin: 0 0 8px;
  }
  .bikeadd {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .bikeadd .inp {
    flex: 1;
    min-width: 0;
    min-height: 44px;
  }
  .err {
    color: var(--bad);
    min-height: 1.2em;
    font-size: var(--fs-small);
  }
  .foot {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
  }
  .kept {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .del {
    margin-right: auto;
    border-color: var(--bad);
    color: var(--bad);
  }
  /* v0.114.0 «Rahmenbedingungen» (B1–B3): the sport chips with their icon, «+ Andere» dashed. */
  .areas .tp-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .areas .more {
    border-style: dashed;
    color: var(--ink-2);
  }
  /* the start place and the forecast suggestion */
  .plz {
    display: grid;
    grid-template-columns: minmax(0, 220px) minmax(0, 1fr);
    gap: 10px;
    align-items: center;
    margin-bottom: 10px;
  }
  .plz .note {
    margin: 0;
  }
  .plzin {
    display: flex !important;
    align-items: center;
    gap: 8px;
    padding-left: 10px;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-ctl);
    background: var(--paper);
  }
  /* v0.127.0 A-U5: the home place as the start, the whole field green */
  .plzin.pre {
    background: var(--ok-soft);
    border-color: var(--ok);
  }
  .plzin .inp.pre {
    background: transparent;
  }
  .plzin .inp {
    flex: 1;
    min-width: 0;
    min-height: 44px;
    border: 0;
    padding-left: 0;
  }
  .fcard {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin: 0 0 10px;
    padding: 12px 14px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  .fcard > :global(svg) {
    flex: none;
    color: var(--warn);
  }
  .fct {
    display: grid;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }
  .fct small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  /* the event box */
  .evbox {
    margin-top: 16px;
    padding: 4px 14px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .evbox.on {
    border-color: var(--bad);
  }
  .evbox .ev {
    margin-top: 4px;
  }
  .evn {
    margin: 0 0 0 28px;
  }
  .evbox .grp {
    margin: 10px 0 0 28px;
  }
  /* SN1b: «Tour aus komoot» under the templates */
  .kmbox {
    margin: 12px 0 0;
  }
  /* «Vorlage wählen», folded; the starts as option buttons (the Knöpfe pattern N1–N4: 44 px, chosen green with a tick) */
  .tplbox {
    margin-top: 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .tplbox.open {
    border-color: var(--ink);
  }
  .tplhead {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 56px;
    padding: 10px 14px;
    border: 0;
    background: none;
    color: var(--ink);
    text-align: left;
    cursor: pointer;
  }
  .tplic {
    display: grid;
    place-items: center;
    flex: none;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: var(--paper-2);
  }
  .tplt {
    display: grid;
    flex: 1;
    min-width: 0;
  }
  .tplt small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .tplbody {
    padding: 0 14px 12px;
  }
  .grp-l {
    margin: 10px 0 6px;
    font-size: var(--fs-tiny);
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ink-2);
  }
  .obtns {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px;
  }
  .tplinfo {
    display: flex;
    gap: 8px;
    margin: 10px 0 0;
    padding: 10px 12px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    font-size: var(--fs-small);
  }
  .tplinfo :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  /* «Deine Packliste» in four groups: a picture per item, long names wrap, the weight stays right */
  .plist {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--line);
  }
  .plh {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 4px 12px;
  }
  .plh h3 {
    margin: 0;
    font: 600 var(--fs-sub)/1.25 var(--font-body);
  }
  .plh .num {
    font-weight: 600;
  }
  .plist > .note {
    margin-top: 4px;
  }
  .grp {
    margin-top: 12px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .grp h4 {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 4px;
    font: 600 var(--fs-body)/1.25 var(--font-body);
  }
  .grp h4 small {
    margin-left: auto;
    font-weight: 400;
    font-size: var(--fs-small);
    color: var(--ink-2);
    white-space: nowrap;
  }
  .gic,
  .pic {
    display: grid;
    place-items: center;
    flex: none;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    color: var(--c, var(--ink-2));
    background: color-mix(in srgb, var(--c, var(--ink-3)) 14%, var(--paper));
  }
  .grp ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .grp li {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 44px;
    padding: 4px 0;
    border-top: 1px solid var(--line);
    font-size: var(--fs-body);
  }
  .grp li:first-child {
    border-top: 0;
  }
  .grp .nm {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .grp .wt {
    flex: none;
    color: var(--ink-2);
    font-size: var(--fs-small);
    white-space: nowrap;
  }
  .warmn {
    margin: 4px 0;
    padding: 4px 10px;
    border-radius: 6px;
    background: var(--warn-soft);
    font-size: var(--fs-small);
  }
  /* v0.114.0 (Noah): on the phone the two buttons of a new trip fill the row edge to edge */
  @media (max-width: 600px) {
    .foot.fnew {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
    }
    .foot.fnew .kept {
      grid-column: 1 / -1;
    }
    .foot.fnew .btn {
      width: 100%;
      justify-content: center;
      white-space: nowrap;
    }
    .foot.fnew .btn.hi {
      grid-column: 2;
    }
    .plz {
      grid-template-columns: 1fr;
    }
  }
</style>
