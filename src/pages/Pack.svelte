<script>
  import { localDay } from '../lib/localday.js';
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { isOver, tipsByItem } from '../lib/debrief.js';
  import { phone } from '../lib/media.svelte.js';
  import { SLOTS, bagsFor, sortBikes, bikesHash } from '../lib/bikes.js';
  import { CATEGORIES, formatWeight, weightText, isInventory, matches, weighQueue } from '../lib/gear.js';
  import { tripStats, packSteps, togglePacked, packAll, tickReady, packAndReady, addEntries, readyDone, whenLabel, onTrip, zoneName, freshReady, bagItemIds, NIGHT_SETS, toggleSet, WX_PRESETS, RAIN, axleLoad, axleSplit, switchBike, setQty } from '../lib/trips.js';
  import { suggestPlaces, applyPlaces, dismissPlace } from '../lib/bagsuggest.js';
  import PlaceSuggest from '../lib/pack/PlaceSuggest.svelte';
  import { RIDES, layerSuggest, openRows, waterOn } from '../lib/layers.js';
  import { applyContext, hasContext, carryHint } from '../lib/context.js';
  import WeighMode from '../lib/gear/WeighMode.svelte';
  import CalmPack from '../lib/pack/CalmPack.svelte';
  import { acceptReview } from '../lib/preparation.js';
  import '../lib/pack/calm-pack.css';
  let review = $state(false);
  import TripDialog from '../lib/pack/TripDialog.svelte';
  import NotPacked from '../lib/pack/NotPacked.svelte';
  import TemplateDialog from '../lib/pack/TemplateDialog.svelte';
  import PackDay from '../lib/pack/PackDay.svelte';
  import ItemDialog from '../lib/gear/ItemDialog.svelte';
  import TripRoute from '../lib/pack/TripRoute.svelte';
  import BikeChoice from '../lib/pack/BikeChoice.svelte';
  import { bikeChoice } from '../lib/choice.js';
  import { sharePayload, shareLink, SHARE_LONG } from '../lib/share.js';
  import { TEMPLATES_KEY } from '../lib/templates.js';
  import { SETS_KEY, allSets, addSetEntries, tripSlot } from '../lib/sets.js';
  import { bikePhotos, packPhoto } from '../lib/photo.js';
  import Lightbox from '../lib/ui/Lightbox.svelte';
  import { withVisits, overdueFor } from '../lib/workshop.js';
  import { prepFor, isEvent } from '../lib/care.js';
  import { bikeCare, bikeCareLine, eventPrep, eventPrepLine, isShortRide } from '../lib/readiness.js';
  import { stageCount } from '../lib/ride.js';
  import { forecastForTrip, toWx } from '../lib/weather.js';
  import { take } from '../lib/nav.js';
  import { dayRidePlan, buildBikeTrip, fetchHomeForecast, forecastPreset, rideDate, wxLabel } from '../lib/dayride.js';
  import { packBadges, ballast, leaveAtHome, keepOnTrip } from '../lib/packhints.js';
  import { t, tn, num, locale, nameOf } from '../lib/i18n.svelte.js';
  import { hasBike, domainOf, domainName, inDomain, itemDomains, readyKey, READY_BY_DOMAIN, rememberDomain, BIKEPACKING } from '../lib/domains.js';

  const tripsQ = liveQuery(() => db.trips.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const bagsQ = liveQuery(() => db.containers.toArray());
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const photosQ = liveQuery(() => db.photos.toArray());
  const visitsQ = liveQuery(() => db.visits.toArray());
  const tasksQ = liveQuery(() => db.maintenance.toArray());
  const riderQ = liveQuery(() => db.settings.get('riderWeightG'));
  const rearQ = liveQuery(() => db.settings.get('rearLimitPct'));
  // Always an object, also before any template is saved (else "New → Packing list" never opens).
  const tplQ = liveQuery(async () => (await db.settings.get(TEMPLATES_KEY)) ?? { value: [] });
  const learnQ = liveQuery(() => db.learnings.toArray());
  // Answer 3a: one learning per item as a small hint while packing.
  const tips = $derived(tipsByItem($learnQ ?? []));
  const debriefsQ = liveQuery(() => db.debriefs.toArray());
  // v0.19.5 (F4, answer 3a): short badges per item, the sentence behind them on tap.
  const badges = $derived(trip ? packBadges(trip, $tripsQ ?? [], $debriefsQ ?? [], tips) : {});
  // N3 (answer 2a): what was not used the last times, with grams and "Leave at home".
  const extra = $derived(trip && !over ? ballast(trip, items, $tripsQ ?? [], $debriefsQ ?? []) : null);
  const leave = (ids) => change((t) => leaveAtHome(t, ids));
  const keep = (id) => change((t) => keepOnTrip(t, id));
  const templates = $derived($tplQ?.value ?? []);
  let saveTpl = $state(takeFlag('pack.saveTemplate'));
  function takeFlag(key) {
    try {
      const on = localStorage.getItem(key) === '1';
      localStorage.removeItem(key);
      return on;
    } catch {
      return false;
    }
  }
  let tplNote = $state('');

  const trips = $derived([...($tripsQ ?? [])].sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? '')));
  const items = $derived($itemsQ ?? []);
  const bags = $derived($bagsQ ?? []);
  const bikes = $derived(sortBikes($bikesQ ?? []));
  const itemsById = $derived(Object.fromEntries(items.map((i) => [i.id, i])));

  // Which trip is open: the last one chosen on this device, else the next upcoming one.
  const KEY = 'pack.currentTrip';
  let chosen = $state(read());
  function read() {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  }
  function choose(id) {
    chosen = id;
    zoneKey = 'frame';
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* private mode: fine, only this visit remembers it */
    }
  }
  const today = localDay();
  const trip = $derived(
    trips.find((t) => t.id === chosen) ??
      [...trips].filter((t) => !t.skipped && (t.startDate ?? '') >= today).sort((a, b) => a.startDate.localeCompare(b.startDate))[0] ??
      trips[0],
  );
  // v0.21.0 (package 5): ski touring, weekend and world trip have no bike, only their own bags.
  const bikeTrip = $derived(trip ? hasBike(trip) : true);
  const domain = $derived(domainOf(trip));
  const bike = $derived(trip && bikeTrip ? bikes.find((b) => b.id === trip.bikeId) : null);
  // Setup photo behind the bags (answers 2a-4a): the trip's own photo, else the bike's main photo.
  const gallery = $derived(bikePhotos(bike, $photosQ ?? []));
  const shot = $derived(packPhoto(trip, bike, $photosQ ?? []));
  let shownPhoto = $state(null);
  // Before the trip (v0.18.2, answer 3a): the same list as on Home and in Bike care: preparation
  // tasks, what the bike needs (workshop from 14 days before) and open repairs.
  const before = $derived.by(() => {
    // v0.21.0: the preparation tasks and the bike's needs are bike things; a trip without a bike skips them.
    if (!trip || over || trip.skipped || !bikeTrip) return null;
    const view = bike ? withVisits(bike, $visitsQ ?? []) : null;
    const tasks = $tasksQ ?? [];
    // v0.25.0 (Noah 10): a short ride (1 day, no event) shows no bike care here (it stays in Bikes).
    const care = view && !isShortRide(trip) ? bikeCare(view, { tasks, visits: $visitsQ ?? [], trip, today }) : null;
    const prep = eventPrep(trip, tasks, today);
    const open = prepFor(trip, tasks, today).filter(r => !r.finished);
    // v0.22.1 (Noah 4b): shown on every bike trip, so the Event switch is always in reach.
    return { care, prep, open, event: isEvent(trip) };
  });
  // Design audit P4: after the trip, Pack leads to the debrief.
  const over = $derived(trip ? isOver(trip) : false);
  // Start page "Print list": #/pack?print opens the print dialog once the trip is there.
  let printed = false;
  $effect(() => {
    if (!printed && stats && location.hash.includes('print')) {
      printed = true;
      history.replaceState(null, '', '#/pack');
      setTimeout(() => window.print(), 300);
    }
  });
  const stats = $derived(trip ? tripStats(trip, items, bags, bike, $riderQ?.value) : null);

  // Packing day (answer 2a): full screen, bag by bag. #/pack?day (from the start page) opens it.
  let packDay = $state(location.hash.includes('day'));
  $effect(() => {
    if (packDay && location.hash.includes('day')) history.replaceState(null, '', '#/pack');
  });
  const daySteps = $derived(stats ? packSteps(stats, trip.purpose ?? {}) : []);
  // v0.18.1 (303 demo): the forecast says something else than what the trip is packed for.
  // The packing day says so first, so the layers get added before the bags are closed.
  const fcWx = $derived(trip ? toWx(forecastForTrip(trip)) : null);
  const wxGap = $derived.by(() => {
    if (!fcWx) return null;
    const have = trip.wx?.min != null ? trip.wx : { min: 15, max: 15, rain: 'none' };
    const colder = fcWx.min < have.min - 2;
    const wetter = (fcWx.rain !== 'none') !== ((have.rain ?? 'none') !== 'none') || (fcWx.rain === 'rain' && have.rain !== 'rain');
    return colder || wetter ? { fc: fcWx, have } : null;
  });
  function useForecast() {
    changeContext((t) => ({ wx: { ...(t.wx ?? {}), ...fcWx } }));
    packDay = false;

  }
  // v0.21.0: a trip without a bike ends here (with a bike: "End trip and debrief" on the ride day).
  async function endTrip() {
    const id = trip.id;
    await change(() => ({ finished: localDay() }));
    location.hash = `#/debrief/${encodeURIComponent(id)}`;
  }
  const toggleIn = (itemId) => change((t) => ({ entries: togglePacked(t.entries, itemId) }));
  // v0.24.0: a whole bag (or, with null, the whole trip) in one tap.
  const packIn = (ids) => change((t) => ({ entries: packAll(t.entries, ids) }));
  // Answer 14: the list as a link (the list travels inside the address, nothing is uploaded).
  let shareNote = $state('');
  async function shareList() {
    // v0.27.0 (Noah 1a, AP22): a link that cannot be made says so; a very long one gets a hint.
    let url;
    try {
      url = await shareLink(sharePayload($state.snapshot(trip), stats, itemsById));
    } catch {
      shareNote = t('The link could not be made in this browser. Use Print / PDF instead.');
      setTimeout(() => (shareNote = ''), 8000);
      return;
    }
    const long = url.length > SHARE_LONG ? ` ${t('The list is long ({n} characters); some apps cut long links. Print / PDF is safer.', { n: url.length })}` : '';
    try {
      if (navigator.share && phone.matches) {
        await navigator.share({ title: t('Packing list: {title}', { title: trip.title }), url });
        shareNote = long.trim();
      } else {
        await navigator.clipboard.writeText(url);
        shareNote = t('Link copied. Paste it into a message; it opens a read-only list.') + long;
      }
    } catch (err) {
      if (err?.name !== 'AbortError') shareNote = t('Copy this link: {url}', { url }) + long;
    }
    setTimeout(() => (shareNote = ''), 8000);
  }
  const resetPacked = () => confirm(t('Untick every item, to pack again from the start?')) && change((t) => ({ entries: t.entries.map((e) => ({ ...e, packed: false })) }));

  let zoneKey = $state('frame'); // the bag that is open
  let dialog = $state(null); // { trip } or { trip: null, startFrom? }
  // "New trip from it" on the Templates page opens the new-trip dialog with that template.
  // v0.19.6: also "New → Packing list" from any page (nav.js newTrip), even when Pack is open.
  $effect(() => {
    if (!$tplQ) return; // wait until the templates are loaded, so the choice can be shown
    // v0.21.0 (found by the e2e test): also wait for bikes, items and trips. Opened before the bikes
    // were loaded, the dialog had no bike chosen ("Choose a bike." with the one bike shown), and
    // before the items it would make an empty standard set.
    if (!$bikesQ || !$itemsQ || !$tripsQ) return;
    const startNew = () => {
      const id = take('pack.startFrom');
      const area = take('pack.domain'); // v0.21.0: the area chosen in "New → Packing list"
      if (id) dialog = { trip: null, startFrom: id, domain: area };
    };
    startNew();
    window.addEventListener('pg:newtrip', startNew);
    return () => window.removeEventListener('pg:newtrip', startNew);
  });
  // v0.25.1 (Noah 1a): "Day ride" (nav.js dayRide, event 'pg:dayride'): the trip without a dialog,
  // like the last day ride (or 2 h, Chilly), weather from the home forecast when there is one.
  // A bar says what was made, with "Change" (Edit trip) and "Undo" (deletes the new trip).
  let dayMade = $state(null); // { id, before, bike, hours, wx, wxFrom }
  let dayBusy = false;
  async function makeDayRide() {
    if (dayBusy) return;
    dayBusy = true;
    try {
      const plan0 = dayRidePlan(trips, bikes);
      // No bike yet: the dialog, so Noah sees why (it offers the areas without a bike too).
      if (!plan0) return (dialog = { trip: null });
      const home = (await db.settings.get('homePlace'))?.value;
      const forecastWx = forecastPreset(await fetchHomeForecast(home), rideDate());
      const plan = dayRidePlan(trips, bikes, { forecastWx });
      const readyStandard = (await db.settings.get('readyStandard'))?.value ?? null;
      const fields = { hours: plan.hours, overnight: 'none', cook: false, wx: plan.wx, event: false, ...(plan.wxFrom ? { wxFrom: plan.wxFrom } : {}) };
      const nt = buildBikeTrip({ draft: { title: plan.title, startDate: plan.startDate, days: 1 }, bike: $state.snapshot(plan.bike), start: 'last', templates, trips, items, readyStandard, fields });
      await db.trips.put($state.snapshot(nt));
      rememberDomain(BIKEPACKING);
      dayMade = { id: nt.id, before: chosen, bike: plan.bike.name, hours: plan.hours, wx: plan.wx, wxFrom: plan.wxFrom };
      choose(nt.id);
    } finally {
      dayBusy = false;
    }
  }
  async function undoDayRide() {
    const made = dayMade;
    dayMade = null;
    await db.trips.delete(made.id);
    undo = undo.filter((u) => u.id !== made.id);
    if (made.before && made.before !== made.id) choose(made.before);
  }
  $effect(() => {
    if (!$tplQ || !$bikesQ || !$itemsQ || !$tripsQ) return; // as for "New trip": wait for the data
    const run = () => take('pack.dayRide') && makeDayRide();
    const onEvent = () => {
      take('pack.dayRide');
      makeDayRide();
    };
    run();
    window.addEventListener('pg:dayride', onEvent);
    return () => window.removeEventListener('pg:dayride', onEvent);
  });
  let q = $state('');
  let newCheck = $state('');

  const zone = $derived(stats?.zones.find((z) => z.key === zoneKey) ?? stats?.zones.find((z) => z.key === (bikeTrip ? 'seat' : trip.packs[0]?.key)) ?? stats?.zones[0]);

  // Moving into a place: every zone of the trip.
  const targets = $derived((stats?.zones ?? []).filter((z) => !z.noBag));
  $effect(() => { if ($bagsQ && $itemsQ && $bikesQ && targets.length && !targets.some(z => z.key === zoneKey)) zoneKey = targets.find(z => z.key === 'frame')?.key ?? targets.find(z => z.key !== 'body' && z.key !== 'mounted')?.key ?? targets[0].key; });

  // Items that can still be added: owned or unclear, not on the trip yet.
  const candidates = $derived.by(() => {
    if (!trip) return [];
    const on = onTrip(trip);
    const asBag = bagItemIds(bags); // bags go on the bike (Bags for this trip), not into a bag
    const fixed = new Set(bike?.fixtures ?? []); // always mounted, part of the bike
    // v0.21.0: the items of the trip's area; a search finds every item you own.
    const list = items.filter((i) => isInventory(i) && !on.has(i.id) && !asBag.has(i.id) && !fixed.has(i.id) && (inDomain(i, domain) || q.trim()) && matches(i, { q }));
    const order = Object.fromEntries(CATEGORIES.map((c, n) => [c.key, n]));
    const rank = (i) => (i.role === 'standard' || i.role === 'worn' ? 0 : i.sets?.length ? 1 : i.role === 'optional' ? 2 : 3);
    return list.sort((a, b) => rank(a) - rank(b) || Number(!!b.favorite) - Number(!!a.favorite) || (order[a.category] ?? 99) - (order[b.category] ?? 99) || a.name.localeCompare(b.name));
  });

  /**
   * Change the open trip: fn gets a plain copy and returns the changes to store.
   * The copy is read inside the write (v0.18.1): quick taps on the packing day came in before the
   * page had the last change back and overwrote it, so ticks got lost.
   */
  async function change(fn) {
    const id = trip.id;
    await db.transaction('rw', db.trips, async () => {
      const cur = await db.trips.get(id);
      if (!cur) return;
      undo = [...undo.filter((u) => u.id === id).slice(-19), { id, before: structuredClone(cur) }];
      await db.trips.update(id, fn(structuredClone(cur)));
    });
  }
  // N13: the bikes side by side for this trip.
  let choosing = $state(false);
  const choiceRows = $derived.by(() => {
    if (!choosing || !trip) return [];
    const visits = $visitsQ ?? [];
    return bikeChoice(trip, bikes.map((b) => withVisits(b, visits)), { containers: bags, items, visits, trips: $tripsQ ?? [], tasks: $tasksQ ?? [], today });
  });
  const useBike = (b) => change((t) => switchBike(t, b));
  // v0.25.1 (Noah 3a): Today's "Choose a bike for the trip" opens the comparison (#/pack?choose).
  $effect(() => {
    if (trip && location.hash.includes('choose')) {
      history.replaceState(null, '', '#/pack');
      choosing = true;
    }
  });
  // v0.22.1 (Noah 4b): the Excel preparation only for events.
  const setEvent = (on) => change((t) => ({ ...t, event: on }));
  // Answer 9a: every change is saved at once; "Undo" puts the trip back one step.
  let undo = $state.raw([]); // raw: plain copies, IndexedDB cannot store proxies
  const canUndo = $derived(undo.length > 0 && undo.at(-1).id === trip?.id);
  async function undoLast() {
    const last = undo.at(-1);
    if (!last) return;
    undo = undo.slice(0, -1);
    await db.trips.put(last.before);
  }
  const setEntries = (fn) => change((t) => ({ entries: fn(t.entries) }));
  // v0.26.1 (AP17, Noah 14a): better places for sleep and cook items on an outdoor trip; one change() each (Undo).
  const placeRows = $derived(trip && bikeTrip && !over ? suggestPlaces(trip, items, bags, bike) : []);
  const applyRows = (rows) => change((t) => applyPlaces(t, rows));
  const dismissRow = (itemId) => change((t) => dismissPlace(t, itemId));

  const moveTo = (itemId, slot) => setEntries((es) => es.map((e) => (e.itemId === itemId ? { ...e, slot, packed: false } : e)));
  const removeEntry = (itemId) => setEntries((es) => es.filter((e) => e.itemId !== itemId));
  /** Put an item into a bag (key of the place); a place without a bag puts it on me. */
  function addTo(key, itemId) {
    const z = stats.zones.find((x) => x.key === key);
    if (!z || !itemsById[itemId]) return;
    const slot = z.noBag ? 'body' : z.key;
    // Design answer 4b: a tile dragged onto another bag moves there.
    if (onTrip(trip).has(itemId)) return moveTo(itemId, slot);
    return setEntries((es) => [...es, { itemId, slot, qty: 1, packed: false }]);
  }
  // v0.24.1 (Noah 6a): the ticked items of "Add material" into one place, in one write (one Undo).
  function addMany(key, itemIds) {
    const z = stats.zones.find((x) => x.key === key);
    const ids = itemIds.filter((id) => itemsById[id]);
    if (!z || !ids.length) return;
    return setEntries((es) => addEntries(es, ids, z.noBag ? 'body' : z.key, { packed: false }));
  }
  // v0.24.0 (Noah): "Add … as a new item and pack it" from the search in "Add material". An item
  // you already own under that name is packed instead of making a second one.
  let newItem = $state(null); // { name, key }
  function createAndPack(name) {
    const have = items.find((i) => isInventory(i) && i.name.toLowerCase() === name.toLowerCase());
    if (have) return addTo(zone?.key, have.id);
    newItem = { name, key: zone?.key };
  }
  function packNew(record) {
    const z = stats.zones.find((x) => x.key === newItem.key);
    const slot = !z || z.noBag ? 'body' : z.key;
    q = '';
    return setEntries((es) => (es.some((e) => e.itemId === record.id) ? es : [...es, { itemId: record.id, slot, qty: 1, packed: false }]));
  }
  // v0.26.0 (Noah 3a): "+ {block}" chips in "Add material": one tap adds every owned item of a
  // building block that is not on the trip yet, into its usual bag (a trip without a bike: the
  // chosen bag), with the block's amount, src 'set'. Entries already on the trip stay as they are.
  const setsQ = liveQuery(() => db.settings.get(SETS_KEY));
  const blockSkip = $derived(new Set([...bagItemIds(bags), ...(bike?.fixtures ?? [])]));
  const blockSlot = (cur) => (i) => (bikeTrip ? tripSlot(i, cur.setup) : zone?.noBag || !zone ? 'body' : zone.key);
  const chips = $derived.by(() => {
    if (!trip) return [];
    return allSets($setsQ?.value)
      .map((s) => ({ ...s, label: s.builtIn ? s.name.replace(/^(Night|Nacht): /, '') : s.name, n: addSetEntries(trip, items, s, { skip: blockSkip, slotOf: () => 'body' }).added.length, has: items.some((i) => isInventory(i) && i.sets?.includes(s.key)) }))
      .filter((s) => s.has);
  });
  let blockNote = $state('');
  async function addBlock(block) {
    let n = 0;
    await change((cur) => {
      const r = addSetEntries(cur, items, block, { skip: blockSkip, slotOf: blockSlot(cur) });
      n = r.added.length;
      return { entries: r.entries };
    });
    blockNote = tn(n, '{n} item of {block} added.', '{n} items of {block} added.', { block: block.label });
  }
  async function undoBlock() {
    blockNote = '';
    await undoLast();
  }
  const targetName = $derived(zone ? (zone.noBag ? t('On me') : zone.bag ? zone.bag.name : t(zone.zone.name)) : t('the trip'));

  // Answer 4a: a bag can get a name for what it is for ("Quick access"); stored on the trip.
  function savePurpose(key, value) {
    const name = String(value ?? '').trim().slice(0, 40);
    change((t) => ({ purpose: { ...(t.purpose ?? {}), [key]: name || null } }));
  }

  const setBag = (slotKey, bagId) => change((t) => ({ setup: { ...t.setup, [slotKey]: bagId || null } }));

  // Ready check (decision 7, mockup 6a, cleanup 4.10.2026): one short list, edits change only this trip.
  // v0.21.0: every area keeps its own standard list (settings readyStandard, readyStandard.ski …).
  const standardQ = liveQuery(() => db.settings.where('key').startsWith('readyStandard').toArray());
  const standard = $derived(($standardQ ?? []).find((r) => r.key === readyKey(domain))?.value ?? null);
  const readyFallback = $derived(bikeTrip ? undefined : READY_BY_DOMAIN[domain] ?? []);
  const ready = $derived(trip?.ready ?? []);
  const readyCount = $derived(ready.filter((r) => trip && readyDone(r, trip)).length);
  const readyTotal = $derived(ready.length);
  // v0.20.2: where the trip stands. 0 pack list, 1 packing day, 2 ride day, 3 debrief.
  // v0.21.0: a trip without a bike has no ride day; after the packing day comes the debrief.
  const STEPS = $derived(bikeTrip ? ['Packing list', 'Packing day', 'Ride day', 'Debrief'] : ['Packing list', 'Packing day', 'Debrief']);
  const allIn = $derived(!!stats?.count && stats.packed >= stats.count && readyCount >= readyTotal);
  const step = $derived(!trip || !stats ? 0 : bikeTrip ? (over ? 3 : allIn ? 2 : 1) : over || allIn ? 2 : 1);
  const DEBRIEF = $derived(STEPS.length - 1);
  function toggleReady(row) {
    if (row.itemId) {
      // Older trips: an "always with me" row adds its missing item to its usual place.
      if (!readyDone(row, trip) && itemsById[row.itemId]) {
        const slot = row.slot === 'body' || row.slot === 'mounted' || trip.setup?.[row.slot] ? row.slot : 'body';
        return setEntries((es) => [...es, { itemId: row.itemId, slot, qty: 1, packed: false }]);
      }
      return;
    }
    change((t) => ({ ready: t.ready.map((r) => (r.id === row.id ? { ...r, done: !r.done } : r)) }));
  }
  // Answer 4: accept everything with one click.
  const tickAllReady = () => change((t) => ({ ready: tickReady(t.ready) }));
  // v0.24.1 (Noah 2a): a day ride skips the packing day: every item packed and the whole ready
  // check in one write (packAll + tickReady, one Undo), then on to the ride day.
  async function packAndGo() {
    await change((t) => packAndReady(t));
    goRide();
  }
  function goRide() {
    choose(trip.id);
    location.hash = '#/ride';
  }
  const removeReady = (id) => change((t) => ({ ready: t.ready.filter((r) => r.id !== id) }));
  function addReady(event) {
    event.preventDefault();
    const label = newCheck.trim();
    if (!label) return;
    newCheck = '';
    change((t) => ({ ready: [...t.ready, { id: `own-${Date.now().toString(36)}`, label, done: false }] }));
  }
  const resetReady = () => confirm(t('Use your standard ready check again for this trip?')) && change(() => ({ ready: freshReady(standard, readyFallback) }));
  const readyChanged = $derived(ready.map((r) => r.label).join('|') !== freshReady(standard, readyFallback).map((r) => r.label).join('|'));
  // Answer 4: save this trip's list as the standard for every new trip.
  let savedNote = $state('');
  async function saveStandard() {
    const list = ready.filter((r) => !r.itemId).map((r, n) => ({ id: r.id.startsWith('own-') ? `std-${n}-${Date.now().toString(36)}` : r.id, label: r.label }));
    await db.settings.put({ key: readyKey(domain), value: list });
    savedNote = t('Saved. New trips start with this list.');
    setTimeout(() => (savedNote = ''), 4000);
  }

  // Answer 7: weigh what is on this trip, right here.
  let weighing = $state(false);
  const tripItems = $derived(trip ? items.filter((i) => onTrip(trip).has(i.id)) : []);
  const toWeigh = $derived(weighQueue(tripItems).length);

  // Answer 4: overnight sets as switches.
  const setOn = (key) => !!trip?.sets?.[key];
  const switchSet = (key) => change((t) => toggleSet(t, items, key, !t.sets?.[key]));
  const warmItems = $derived(items.filter((i) => isInventory(i) && i.sets?.includes('warm')));
  const tripIds = $derived(trip ? onTrip(trip) : new Set());
  const setCount = (key) => items.filter((i) => isInventory(i) && i.sets?.includes(key)).length;

  // Answer 5 and round C answer 2: weather range, kind of ride and the layers they add.
  const wx = $derived(trip?.wx ?? null);
  const wxSet = $derived(wx?.min != null && wx?.max != null);
  const suggestion = $derived(trip ? layerSuggest(trip, items) : []);
  // v0.25.0 (M3, Noah 9b): on a trip with its context a change of weather or hours applies at once (Undo).
  const changeContext = (fn) => change((cur) => {
    const patch = fn(cur);
    const next = { ...cur, ...patch };
    return hasContext(next) ? { ...patch, ...applyContext(next, items, cur) } : patch;
  });
  const setWx = (patch) => changeContext((t) => ({ wx: { min: t.wx?.min ?? null, max: t.wx?.max ?? null, rain: t.wx?.rain ?? 'none', ...patch } }));
  function typedTemp(field, value) {
    const n = value.trim() === '' ? null : Math.round(Number(value));
    if (n === null || (n >= -30 && n <= 45)) setWx({ [field]: n });
  }
  function typedHours(value) {
    const n = value.trim() === '' ? null : Number(value.replace(',', '.'));
    if (n === null || (n > 0 && n <= 24)) changeContext(() => ({ hours: n }));
  }
  // v0.25.0 (M3, Noah 8a): "Buy … on the way?" for amounts over more days or above what you can carry.
  const carry = $derived(new Set(trip && bikeTrip ? carryHint(trip, items).map((i) => i.id) : []));
  const openLayers = $derived(trip ? openRows(suggestion, trip) : []);
  // What a kind of ride adds, in words (Noah did not understand the drop-down, 4.10.2026).
  // Every ride < Daily < Training: each kind also brings what the ones before it bring.
  const rideHint = $derived.by(() => {
    if (!trip?.ride) return t('Choose one: it adds what you take on that kind of ride.');
    const upTo = RIDES.slice(0, RIDES.findIndex((r) => r.key === trip.ride) + 1).map((r) => r.key);
    const names = items.filter((i) => isInventory(i) && upTo.includes(i.ride)).map((i) => nameOf(i));
    return names.length ? t('Adds: {names}.', { names: names.join(', ') }) : t('No items set for this kind of ride yet (Gear → Edit → Layers).');
  });
  // Mockup answer 3a: a small label in "Not packed" says why an item is suggested.
  // v0.21.0: an item of another area (found by the search) is labelled with its area.
  const tagOf = (i) => (!inDomain(i, domain) ? t(domainName(itemDomains(i)[0])) : '') || (suggestion.find((r) => r.id === i.id && !r.skipped)?.why ?? (i.always ? t('every trip') : i.role === 'standard' || i.role === 'worn' ? t('standard') : ''));
  // Answer 9: luggage on the front and rear wheel.
  const axle = $derived(stats ? axleLoad(stats, itemsById) : null);
  const split = $derived(axleSplit(axle));
  const rearLimit = $derived($rearQ?.value ?? 60);

  // Answer 8: litres of water, already part of the system weight through the full bottles.
  const water = $derived(trip ? waterOn(trip, itemsById) : 0);

  const kg = (g) => (g ? `${(g / 1000).toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg` : '–');
</script>

{#if !trips.length && $tripsQ}
  <h1 class="title big">{t('Pack')}</h1><p>{t('No trips yet. Import your data on the')} <a href="#/">{t('start page')}</a>{t(', or')} <button class="btn hi" onclick={() => dialog = { trip: null }}>{t('Create a trip')}</button></p>
{:else if trip && stats}
    {#snippet layers()}
      <p class="hint">{t('Review suggestions before adding them to your packing list.')}</p>
      <div class="ride" role="group" aria-label={t('Kind of ride')}>
        <span class="lbl">{t('Kind of ride')}</span>
        <div class="presets">
          {#each RIDES as r (r.key)}
            <button type="button" class="toggle" aria-pressed={trip.ride === r.key} onclick={() => change(() => ({ ride: trip.ride === r.key ? null : r.key }))}>{t(r.name.replace(' ride', ''))}</button>
          {/each}
        </div>
        <p class="hint">{rideHint}</p>
      </div>
      <TripRoute {trip} onchange={changeContext} />
      <label class="hours"><span class="lbl">{stageCount(trip) > 1 ? t('Riding hours a day') : t('Riding hours')}</span><input class="inp num" type="text" inputmode="decimal" value={trip.hours ?? ''} onchange={(e) => typedHours(e.currentTarget.value)} placeholder={t('e.g. 6')} /></label>
      <p class="hint hrs">{t('Bottles and food come in amounts per hour (e.g. 1 bottle per 3 h).')}</p>
      <!-- Design answer 6a: the weather folds away once it is set. -->
      <details class="wxbox" open={!wxSet}>
        <summary>{wxSet ? t('Weather: {min}–{max} °C, {rain}', { min: wx.min, max: wx.max, rain: t(RAIN[wx.rain ?? 'none']) }) : t('Weather')}<span class="chg">{wxSet ? t('Change') : ''}</span></summary>
        <div class="presets" role="group" aria-label={t('Weather presets')}>
          {#each WX_PRESETS as p (p.name)}
            <button type="button" class="toggle" aria-pressed={wx?.min === p.min && wx?.max === p.max} onclick={() => setWx({ min: p.min, max: p.max })}>{t(p.name)} <small>{p.min}–{p.max}°</small></button>
          {/each}
        </div>
        <div class="wxin">
          <label><span class="lbl">Min °C</span><input class="inp num" type="text" inputmode="numeric" value={wx?.min ?? ''} onchange={(e) => typedTemp('min', e.currentTarget.value)} /></label>
          <label><span class="lbl">Max °C</span><input class="inp num" type="text" inputmode="numeric" value={wx?.max ?? ''} onchange={(e) => typedTemp('max', e.currentTarget.value)} /></label>
          <label><span class="lbl">{t('Rain')}</span>
            <select class="sel" value={wx?.rain ?? 'none'} onchange={(e) => setWx({ rain: e.currentTarget.value })}>
              {#each Object.entries(RAIN) as [k, v] (k)}<option value={k}>{t(v)}</option>{/each}
            </select>
          </label>
        </div>
      </details>
    {/snippet}

    {#snippet night()}
      <div class="sets" role="group" aria-label={t('Overnight sets')}>
        {#each NIGHT_SETS as ns (ns.key)}
          <button type="button" class="toggle" aria-pressed={setOn(ns.key)} onclick={() => switchSet(ns.key)} disabled={!setCount(ns.key)} title={setCount(ns.key) ? '' : t('No items in this set yet. Tag them in Gear.')}>
            {t(ns.name)} <small>{setCount(ns.key)}</small>
          </button>
        {/each}
      </div>
      <!-- Noah, 4.10.2026 (1b): what "Warm" brings is shown open. -->
      {#if warmItems.length}
        <details class="setlist" open>
          <summary>{t('Warm')}: {tn(warmItems.length, '{n} item', '{n} items')}</summary>
          <ul>
            {#each warmItems as i (i.id)}<li class:on={tripIds.has(i.id)}>{nameOf(i)}{#if tripIds.has(i.id)}<span class="ok"> ✓</span>{/if}</li>{/each}
          </ul>
        </details>
      {/if}
    {/snippet}

    {#snippet bagChoice()}
      <ul class="slots">
        {#each SLOTS.filter((s) => !bike || bike.slots?.includes(s.key)) as s (s.key)}
          <li>
            <label for="ts-{s.key}">{t(s.name)}</label>
            <select id="ts-{s.key}" class="sel" value={trip.setup?.[s.key] ?? ''} onchange={(ev) => setBag(s.key, ev.currentTarget.value)}>
              <option value="">{t('No bag')}</option>
              {#each bagsFor(s.key, bags) as o (o.id)}<option value={o.id}>{o.name}</option>{/each}
            </select>
          </li>
        {/each}
      </ul>
      <p class="hint">{t('Starts with the bags set on {bike} (Bikes page). Changes here only count for this trip.', { bike: bike?.name ?? t('the bike') })}</p>
    {/snippet}

    {#snippet readyFull()}
      <ul>
        {#each ready as r (r.id)}
          {@const done = readyDone(r, trip)}
          <li class:done>
            <label class="ck">
              <input type="checkbox" checked={done} disabled={!!r.itemId && done} onchange={() => toggleReady(r)} />
              <span>{t(r.label)}{#if r.itemId && !done}<small class="warn"> {t('not on this trip, tick to add it')}</small>{/if}</span>
            </label>
            <button type="button" class="x" aria-label={t("Remove {name} from this trip's check", { name: t(r.label) })} onclick={() => removeReady(r.id)}>×</button>
          </li>
        {/each}
      </ul>
      <form class="addcheck" onsubmit={addReady}>
        <input class="inp" bind:value={newCheck} placeholder={t('Add a check for this trip')} aria-label={t('Add a check for this trip')} />
        <button type="submit" class="btn">{t('Add')}</button>
      </form>
      <p class="ready-acts">
        {#if readyCount < readyTotal}<button type="button" class="btn hi" onclick={tickAllReady}>{t('Tick all checks')}</button>{/if}
        {#if readyChanged}
          <button type="button" class="btn" onclick={saveStandard}>{t('Save as my standard')}</button>
          <button type="button" class="link" onclick={resetReady}>{t('Back to my standard list')}</button>
        {/if}
      </p>
      {#if savedNote}<p class="ok" role="status">{savedNote}</p>{/if}
    {/snippet}

  {#if dayMade && dayMade.id === trip.id}
    <div class="dayride-bar" role="status">
      <p>{t('Day ride created: {bike} · {hours} h · {weather}.', { bike: dayMade.bike, hours: num(dayMade.hours), weather: dayMade.wxFrom === 'forecast' ? t('{weather} (forecast)', { weather: wxLabel(dayMade.wx) }) : wxLabel(dayMade.wx) })}</p>
      <div class="dayride-acts">
        <button type="button" class="btn sm" onclick={() => (dialog = { trip })}>{t('Change')}</button>
        <button type="button" class="btn sm" onclick={undoDayRide}>{t('Undo')}</button>
        <button type="button" class="x" aria-label={t('Close')} onclick={() => (dayMade = null)}>×</button>
      </div>
    </div>
  {/if}
  <CalmPack {trip} {stats} {carry} {bike} {bikeTrip} domainLabel={t(domainName(domain))} {items} {itemsById} {trips} {candidates} {targets} {templates} hasPhoto={!!shot} {openLayers} {canUndo} {readyCount} {readyTotal} {over} {step} debriefStep={DEBRIEF} bind:q bind:zoneKey bind:review
    actions={{
      // v0.25.0 (M3): an amount set by hand stays when the trip's context changes (qtyManual).
      // v0.26.1 (Noah 18b): a packed item stays packed when its amount changes (setQty).
      choose, addTo, addMany, qty: (id, qty) => setEntries(es => setQty(es, id, qty)),
      move: moveTo, remove: removeEntry, undo: undoLast,
      apply: choices => change(cur => acceptReview(cur, items, choices)),
      edit: () => dialog = { trip }, newTrip: () => dialog = { trip: null },
      pack: () => packDay = true, ride: goRide, packAndGo, end: endTrip,
      photo: () => shownPhoto = Math.max(0, gallery.findIndex(p => p.id === shot?.id)), compare: () => choosing = true, template: () => saveTpl = true, share: shareList, resetPacked,
      skip: () => change(() => ({ skipped: !trip.skipped })),
    }}>
    {#snippet suggest()}{#if placeRows.length}<PlaceSuggest rows={placeRows} {itemsById} {bags} onapply={applyRows} ondismiss={dismissRow} />{/if}{/snippet}
    {#snippet settings(mode)}
      {#if mode === 'conditions'}
        {#if bikeTrip}{@render layers()}<h3>{t('Night')}</h3>{@render night()}{:else}<TripRoute {trip} onchange={changeContext} />{/if}
      {:else if mode === 'bags'}{@render bagChoice()}
      {:else if mode === 'purposes'}{#each stats.zones as z}<label class="bag-purpose">{zoneName(z)}<input class="inp" value={trip.purpose?.[z.key] ?? ''} placeholder={t('What it is for, e.g. Quick access')} onchange={e => savePurpose(z.key, e.currentTarget.value)} /></label>{/each}
      {:else if mode === 'ready'}{@render readyFull()}{/if}
    {/snippet}
    {#snippet picker(addItem, addItems)}<NotPacked items={candidates} {tagOf} target={targetName} onadd={addItem} onaddmany={addItems} drag={false} bind:q oncreate={createAndPack}>
      {#if chips.length}
        <div class="blockchips" role="group" aria-labelledby="blockchips-h">
          <span class="lbl" id="blockchips-h">{t('Building blocks')}</span>
          <div class="chips">
            {#each chips as c (c.key)}<button type="button" class="chip" disabled={!c.n} aria-label={c.n ? tn(c.n, 'Add {block}: {n} item', 'Add {block}: {n} items', { block: c.label }) : t('{block}: everything is on the trip', { block: c.label })} onclick={() => addBlock(c)}>+ {c.label} ({c.n})</button>{/each}
          </div>
          {#if blockNote}<p class="blocknote" role="status"><span>{blockNote}</span> {#if canUndo}<button type="button" class="text-button" onclick={undoBlock}>{t('Undo')}</button>{/if}</p>{/if}
        </div>
      {/if}
    </NotPacked>{/snippet}
    {#snippet moreWeights()}
      <div class="extra-inner">
        <p>{bikeTrip ? t('System') : t('Total')}: {bikeTrip ? `${stats.bikeKind === 'estimate' ? '~' : ''}${weightText(stats.systemG, stats.systemMissing, kg)}` : weightText(stats.gearG + stats.onMeG, stats.unweighed, kg)} · {t('Bags')}: {weightText(stats.bagsG, stats.bagsMissing)}{#if bikeTrip} · {t('Bike')}: {stats.missing.bike ? t('not weighed') : `${stats.bikeKind === 'estimate' ? '~' : ''}${formatWeight(stats.bikeG)} · ${stats.bikeKind === 'estimate' ? t('estimate') : t('measured')}`} · {t('Rider')}: {stats.missing.rider ? t('not set') : formatWeight(stats.riderG)}{/if}</p>
        {#if water}<p>{t('Water')}: {num(water)} L</p>{/if}
        {#if bikeTrip && split}<p>{t('Front / rear')}: {split.estimate ? '~' : ''}{split.front} / {split.rear} % {#if split.estimate}· {t('estimate, {n} not weighed', { n: axle.missing })}{/if}{#if split.rear > rearLimit} · {split.estimate ? t('About {pct} % of the luggage is on the rear wheel (hint above {limit} %, estimate: not everything is weighed).', { pct: split.rear, limit: rearLimit }) : t('{pct} % of the luggage is on the rear wheel (hint above {limit} %).', { pct: split.rear, limit: rearLimit })}{/if}</p>{/if}
        {#if toWeigh}<button class="text-button" onclick={() => weighing = true}>{t('Weigh {n}', { n: toWeigh })}</button>{/if}
      </div>
    {/snippet}
    {#snippet preparation()}
      {#if before}
        <details class="calm-extra">
          <!-- v0.25.0 (Noah 10): a short ride has no bike care line; then the ready check says where it stands. -->
          <summary>{t('Before the trip')} · {[before.care ? bikeCareLine(before.care) : null, before.prep.total ? eventPrepLine(before.prep) : null].filter(Boolean).join(' · ') || (before.care || before.event ? t('Event preparation: no tasks') : t('Ready check {done} / {n}', { done: readyCount, n: readyTotal }))}</summary>
          <div class="extra-inner">
            {#if before.care}
              <p><a href={before.care.href}>{bikeCareLine(before.care)}</a></p>
              {#if before.care.rows.length || before.care.soon.length}<ul>{#each [...before.care.rows, ...before.care.soon] as row (row.key)}<li><b>{row.name}</b> {row.detail}</li>{/each}</ul>
              {:else if before.care.status === 'nodata'}<p>{t('No data: enter km and record a check or service, then the app can tell.')}</p>{/if}
            {/if}
            <label class="ev"><input type="checkbox" checked={before.event} onchange={(e) => setEvent(e.currentTarget.checked)} /> {t('Event (race or organised ride): show the event preparation')}</label>
            {#if before.prep.total}
              <p>{eventPrepLine(before.prep)}</p>
              <ul>{#each before.open as row (row.task.id)}<li><b>{row.task.task}</b> {row.needed ? t('work needed') : row.overdue ? overdueFor(row.due, today) : t('by {date}', { date: row.due ?? '–' })}</li>{/each}</ul>
              <a href={before.prep.href}>{t('Tick off in Bike care')}</a>
            {/if}
          </div>
        </details>
      {/if}
    {/snippet}
    {#snippet ballastContent()}{#if extra?.rows.length}<details class="calm-extra"><summary>{t('Ballast')} · {t('not used the last times')}</summary><div class="extra-inner"><ul>{#each extra.rows as r}<li>{itemsById[r.itemId] ? nameOf(itemsById[r.itemId]) : r.name} · {t('{n}× not used', { n: r.n })} · {r.g == null ? t('not weighed') : formatWeight(r.g)} <button class="text-button" onclick={() => leave([r.itemId])}>{t('Leave at home')}</button> <button class="text-button" onclick={() => keep(r.itemId)}>{t('Keep')}</button></li>{/each}</ul></div></details>{/if}{/snippet}
  </CalmPack>
  {#if tplNote}<p role="status">{tplNote}</p>{/if}{#if shareNote}<p role="status">{shareNote}</p>{/if}
  {#if choosing && choiceRows.length}<BikeChoice rows={choiceRows} {trip} onpick={useBike} onclose={() => choosing = false} />{/if}
  {#if newItem}<ItemDialog item={null} {items} preset={{ name: newItem.name, ...(trip?.domain && trip.domain !== 'bikepacking' ? { domains: [trip.domain] } : {}) }} onsaved={packNew} onclose={() => (newItem = null)} />{/if}
  {#if packDay}<PackDay {trip} bike={bikeTrip} wxGap={bikeTrip ? wxGap : null} onwx={() => { useForecast(); review = true; }} steps={daySteps} {itemsById} {badges} {ready} ontoggle={toggleIn} onready={toggleReady} onpack={packIn} onreadyall={tickAllReady} onclose={() => packDay = false} />{/if}
  {#if shownPhoto != null && gallery.length}<Lightbox list={gallery.map(p => ({ src: p.src, name: p.name, sub: bike?.name ?? '' }))} start={shownPhoto} onclose={() => shownPhoto = null} />{/if}
  {#if weighing}<WeighMode items={tripItems} onclose={() => weighing = false} />{/if}
    <section class="print" aria-hidden="true">
      <h1>{trip.title}</h1>
      {#if bikeTrip}<p>{trip.startDate ?? ''} · {tn(trip.days, '{n} day', '{n} days')} · {bike?.name ?? ''} · {t('system weight {kg}', { kg: weightText(stats.systemG, stats.systemMissing, kg) })}</p>
      {:else}<p>{trip.startDate ?? ''} · {tn(trip.days, '{n} day', '{n} days')} · {t(domainName(domain))} · {t('total {kg}', { kg: weightText(stats.gearG + stats.onMeG, stats.unweighed, kg) })}</p>{/if}
      {#each stats.zones.filter((z) => z.entries.length) as z (z.key)}
        <h2>{zoneName(z)} <small>{tn(z.entries.length, '{n} item', '{n} items')} · {weightText(z.grams, z.unweighed)}</small></h2>
        <ul>
          {#each z.entries as e (e.itemId)}<li>☐ {itemsById[e.itemId] ? nameOf(itemsById[e.itemId]) : e.itemId}{(e.qty || 1) > 1 ? ` × ${e.qty}` : ''}</li>{/each}
        </ul>
      {/each}
      <h2>{t('Ready check')}</h2>
      <ul>{#each ready as r (r.id)}<li>☐ {t(r.label)}</li>{/each}</ul>
    </section>{/if}
{#if dialog}
  <TripDialog trip={dialog.trip} {trips} {bikes} {items} {templates} startFrom={dialog.startFrom ?? 'last'} domain={dialog.domain ?? null} defaultBikeId={trip?.bikeId} onchange={dialog.trip ? change : null} onclose={() => (dialog = null)} oncreated={choose} />
{/if}
{#if saveTpl && trip}
  <TemplateDialog {trip} {templates} onclose={() => (saveTpl = false)} onsaved={(name) => ((tplNote = t('Saved as template "{name}".', { name })), setTimeout(() => (tplNote = ''), 4000))} />
{/if}

<style>
  .print { display: none; }
  /* v0.26.0 (Noah 3a): building block chips in "Add material". */
  .blockchips { display: grid; gap: 6px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { min-height: 40px; padding: 6px 12px; border: 1.5px solid var(--line-strong); border-radius: 999px; background: var(--paper); color: var(--ink); font: 500 15px var(--font-body); cursor: pointer; overflow-wrap: anywhere; text-align: left; }
  .chip:disabled { opacity: 0.5; cursor: default; }
  .blocknote { margin: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; font-size: 14px; }
  /* v0.25.1 (Noah 1a): what the day ride was made with, and the way back. */
  .dayride-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 4px 12px; margin: 0 0 12px; padding: 8px 8px 8px 14px; border: 1px solid var(--line); border-radius: 10px; background: var(--paper-2, var(--paper)); }
  .dayride-bar p { margin: 0; flex: 1 1 200px; min-width: 0; overflow-wrap: anywhere; }
  .dayride-acts { display: flex; align-items: center; gap: 8px; }
  .bag-purpose { display: block; margin-bottom: 16px; font-size: 14px; }
  .bag-purpose input { margin-top: 8px; }
  .sets, .presets, .ready-acts { display: flex; gap: 8px; flex-wrap: wrap; }
  .wxin { display: grid; grid-template-columns: 1fr 1fr 1.3fr; gap: 12px; margin-top: 16px; }
  .hours { display: block; margin-top: 20px; }
  .hours input { max-width: 120px; }
  .hint { font-size: 14px; color: var(--ink-3); }
  .slots { list-style: none; padding: 0; }
  .slots li { display: grid; grid-template-columns: 1fr 1.5fr; gap: 16px; align-items: center; padding: 8px 0; }
  .addcheck { display: flex; gap: 10px; }
  .ck { display: inline-flex; gap: 10px; }
  .x { background: none; border: 0; padding: 12px; }
  @media print { .print { display: block; } }
</style>
