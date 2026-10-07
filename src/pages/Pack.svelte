<script>
  import { liveQuery } from 'dexie';
  import { untrack } from 'svelte';
  import { db } from '../lib/db.js';
  import { isOver, tipsByItem } from '../lib/debrief.js';
  import { phone } from '../lib/media.svelte.js';
  import { SLOTS, bagsFor, formatVolume, sortBikes, bikesHash } from '../lib/bikes.js';
  import { CATEGORY, CATEGORIES, formatWeight, isInventory, matches, weighQueue } from '../lib/gear.js';
  import { tripStats, packSteps, togglePacked, readyDone, whenLabel, onTrip, zoneName, freshReady, bagItemIds, NIGHT_SETS, toggleSet, WX_PRESETS, RAIN, biggerBag, tooFull, FILL_LIMIT, axleLoad, slotFor, switchBike, heavyHigh } from '../lib/trips.js';
  import { RIDES, layerSuggest, layerDone, applyLayers, openRows, waterOn } from '../lib/layers.js';
  import WeighMode from '../lib/gear/WeighMode.svelte';
  import PackStage from '../lib/pack/PackStage.svelte';
  import TripDialog from '../lib/pack/TripDialog.svelte';
  import NotPacked from '../lib/pack/NotPacked.svelte';
  import TemplateDialog from '../lib/pack/TemplateDialog.svelte';
  import PackDay from '../lib/pack/PackDay.svelte';
  import TripRoute from '../lib/pack/TripRoute.svelte';
  import BikeChoice from '../lib/pack/BikeChoice.svelte';
  import { bikeChoice } from '../lib/choice.js';
  import { sharePayload, shareLink } from '../lib/share.js';
  import { TEMPLATES_KEY } from '../lib/templates.js';
  import { bikePhotos, packPhoto } from '../lib/photo.js';
  import Lightbox from '../lib/ui/Lightbox.svelte';
  import { withVisits, tyreSetup, tripPrep, prepGroups } from '../lib/workshop.js';
  import { stageCount } from '../lib/ride.js';
  import { forecastForTrip, toWx } from '../lib/weather.js';
  import { take } from '../lib/nav.js';
  import { packBadges, ballast, leaveAtHome, keepOnTrip } from '../lib/packhints.js';
  import { t, tn, num, locale, nameOf } from '../lib/i18n.svelte.js';
  import { hasBike, domainOf, domainName, inDomain, itemDomains, readyKey, READY_BY_DOMAIN } from '../lib/domains.js';

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
  let ballastAll = $state(false);
  const leave = (ids) => change((t) => leaveAtHome(t, ids));
  const keep = (id) => change((t) => keepOnTrip(t, id));
  const templates = $derived($tplQ?.value ?? []);
  const fromTemplate = $derived(templates.find((x) => x.id === trip?.templateId) ?? null);
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
    zoneKey = 'seat';
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* private mode: fine, only this visit remembers it */
    }
  }
  const today = new Date().toISOString().slice(0, 10);
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
    return tripPrep(view, trip, $tasksQ ?? [], view ? tyreSetup(view, $visitsQ ?? []) : undefined, today);
  });
  const beforeGroups = $derived(prepGroups(before?.rows ?? []));
  const SHOW = 4;
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
    change((t) => ({ wx: { ...(t.wx ?? {}), ...fcWx } }));
    packDay = false;
    condOpen = true;
    if (phone.matches) tab = 'add';
    setTimeout(() => {
      const box = document.querySelector('.ph-cond');
      if (box) box.open = true; // phone: the layers sit in the folded "Ride, weather and night"
      document.querySelector('.sugg-h')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }
  // v0.21.0: a trip without a bike ends here (with a bike: "End trip and debrief" on the ride day).
  async function endTrip() {
    const id = trip.id;
    await change(() => ({ finished: new Date().toISOString().slice(0, 10) }));
    location.hash = `#/debrief/${encodeURIComponent(id)}`;
  }
  const toggleIn = (itemId) => change((t) => ({ entries: togglePacked(t.entries, itemId) }));
  // Answer 14: the list as a link (the list travels inside the address, nothing is uploaded).
  let shareNote = $state('');
  async function shareList() {
    const url = await shareLink(sharePayload($state.snapshot(trip), stats, itemsById));
    try {
      if (navigator.share && phone.matches) await navigator.share({ title: t('Packing list: {title}', { title: trip.title }), url });
      else {
        await navigator.clipboard.writeText(url);
        shareNote = t('Link copied. Paste it into a message; it opens a read-only list.');
      }
    } catch (err) {
      if (err?.name !== 'AbortError') shareNote = t('Copy this link: {url}', { url });
    }
    setTimeout(() => (shareNote = ''), 8000);
  }
  const resetPacked = () => confirm(t('Untick every item, to pack again from the start?')) && change((t) => ({ entries: t.entries.map((e) => ({ ...e, packed: false })) }));

  let zoneKey = $state('seat'); // the bag that is open
  let tab = $state('pack'); // phone: pack | add | check
  let menuOpen = $state(false); // v0.21.0: the "•••" menu in the header
  function closeMenu(event) {
    menuOpen = false;
    event.currentTarget.querySelector('summary')?.focus();
  }
  // A click anywhere else closes the menu.
  $effect(() => {
    if (!menuOpen) return;
    const away = (e) => !e.target.closest?.('.head .menu') && (menuOpen = false);
    document.addEventListener('click', away);
    return () => document.removeEventListener('click', away);
  });
  let allWeights = $state(false); // every weight, not only the four main figures (design audit P1, v0.21.0)
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
  let q = $state('');
  let newCheck = $state('');
  let openRow = $state(null); // phone: the row whose actions (amount, move, remove) are shown

  const zone = $derived(stats?.zones.find((z) => z.key === zoneKey) ?? stats?.zones.find((z) => z.key === (bikeTrip ? 'seat' : trip.packs[0]?.key)) ?? stats?.zones[0]);

  // Noah's sketch (4.10.2026): big boxes per bag with what is inside, instead of small labels.
  const cards = $derived(
    (stats?.zones ?? []).map((z) => {
      const names = z.entries.map((e) => (itemsById[e.itemId] ? nameOf(itemsById[e.itemId]) : e.itemId));
      const cap = z.bag?.volumeL || null;
      return {
        key: z.key,
        title: trip?.purpose?.[z.key] || t(z.zone.name),
        name: z.bag ? z.bag.name : t(z.zone.name),
        count: z.entries.length,
        grams: z.grams,
        names: names.slice(0, 4),
        more: Math.max(0, names.length - 4),
        fill: cap && z.vol ? (z.vol / cap) * 100 : null,
        vol: z.vol,
        cap,
        empty: !z.entries.length,
        active: z.key === zone?.key,
        noBag: z.noBag && z.entries.length > 0,
        // v0.21.0 (stage D): a quiet hint, nothing moves by itself.
        heavy: heavyHigh(z, itemsById).map((id) => (itemsById[id] ? nameOf(itemsById[id]) : id)),
      };
    }),
  );

  // Moving into a place: every zone of the trip.
  const targets = $derived((stats?.zones ?? []).filter((z) => !z.noBag));

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
    return bikeChoice(trip, bikes.map((b) => withVisits(b, visits)), { containers: bags, items, visits, trips: $tripsQ ?? [], today });
  });
  const useBike = (b) => change((t) => switchBike(t, b));
  // Answer 9a: every change is saved at once; "Undo" puts the trip back one step.
  let undo = $state.raw([]); // raw: plain copies, IndexedDB cannot store proxies
  const canUndo = $derived(undo.length > 0 && undo.at(-1).id === trip?.id);
  async function undoLast() {
    const last = undo.at(-1);
    if (!last) return;
    undo = undo.slice(0, -1);
    await db.trips.put(last.before);
  }
  /** Open a bag from the boxes: it becomes the "Adding to" bag and its list scrolls into view. */
  function pick(key) {
    zoneKey = key;
    if (!phone.matches) document.getElementById(`bag-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  const setEntries = (fn) => change((t) => ({ entries: fn(t.entries) }));

  const moveTo = (itemId, slot) => setEntries((es) => es.map((e) => (e.itemId === itemId ? { ...e, slot, packed: false } : e)));
  const removeEntry = (itemId) => setEntries((es) => es.filter((e) => e.itemId !== itemId));
  const setQty = (itemId, qty) => setEntries((es) => es.map((e) => (e.itemId === itemId ? { ...e, qty: Math.max(1, Math.min(20, qty)) } : e)));
  /** Put an item into a bag (key of the place); a place without a bag puts it on me. */
  function addTo(key, itemId) {
    const z = stats.zones.find((x) => x.key === key);
    if (!z || !itemsById[itemId]) return;
    const slot = z.noBag ? 'body' : z.key;
    // Design answer 4b: a tile dragged onto another bag moves there.
    if (onTrip(trip).has(itemId)) return moveTo(itemId, slot);
    setEntries((es) => [...es, { itemId, slot, qty: 1, packed: false }]);
  }
  const add = (itemId) => addTo(zone.key, itemId);
  const targetName = $derived(zone ? (zone.noBag ? t('On me') : zone.bag ? zone.bag.name : t(zone.zone.name)) : t('the trip'));

  // Drag an item from "Not packed", or a row from another bag, onto a bag in the list.
  let overList = $state(null);
  function listDragover(event, key) {
    if (phone.matches || !event.dataTransfer.types.includes('text/plain')) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = event.dataTransfer.effectAllowed === 'copyMove' ? 'move' : 'copy';
    overList = key;
  }
  function listDrop(event, key) {
    event.preventDefault();
    overList = null;
    const id = event.dataTransfer.getData('text/plain');
    if (id) addTo(key, id);
  }
  const listZones = $derived(phone.matches ? (zone ? [zone] : []) : stats?.zones ?? []);

  // Answer 4a: a bag can get a name for what it is for ("Quick access"); stored on the trip.
  let editPurpose = $state(null);
  const purposeOf = (key) => trip?.purpose?.[key] || null;
  function savePurpose(key, value) {
    editPurpose = null;
    const name = String(value ?? '').trim().slice(0, 40);
    change((t) => ({ purpose: { ...(t.purpose ?? {}), [key]: name || null } }));
  }

  // Answer 9a: on a phone a bag is one column, with a small title per category.
  function rowsOf(z) {
    if (!phone.matches) return z.entries.map((e) => ({ e, head: null }));
    const order = Object.fromEntries(CATEGORIES.map((c, n) => [c.key, n]));
    const cat = (e) => itemsById[e.itemId]?.category;
    const sorted = [...z.entries].sort((a, b) => (order[cat(a)] ?? 99) - (order[cat(b)] ?? 99));
    return sorted.map((e, n) => ({ e, head: n === 0 || cat(sorted[n - 1]) !== cat(e) ? t(CATEGORY[cat(e)]?.name ?? 'Other') : null }));
  }

  // How full the open bag is, in % (only when the bag has a volume).
  const fill = $derived(zone?.bag?.volumeL && zone.vol ? (zone.vol / zone.bag.volumeL) * 100 : null);

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
  const tickAllReady = () => change((t) => ({ ready: t.ready.map((r) => (r.itemId ? r : { ...r, done: true })) }));
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
  const setWx = (patch) => change((t) => ({ wx: { min: t.wx?.min ?? null, max: t.wx?.max ?? null, rain: t.wx?.rain ?? 'none', ...patch } }));
  function typedTemp(field, value) {
    const n = value.trim() === '' ? null : Math.round(Number(value));
    if (n === null || (n >= -30 && n <= 45)) setWx({ [field]: n });
  }
  function typedHours(value) {
    const n = value.trim() === '' ? null : Number(value.replace(',', '.'));
    if (n === null || (n > 0 && n <= 24)) change(() => ({ hours: n }));
  }
  const slotOf = (id) => slotFor(itemsById[id]?.defaultBag, trip.setup);
  const takeLayer = (row) => setEntries((es) => applyLayers(es, [row], slotOf));
  const openLayers = $derived(trip ? openRows(suggestion, trip) : []);
  const layerGroups = $derived.by(() => {
    const groups = [];
    for (const r of suggestion) {
      let g = groups.at(-1);
      if (!g || g.why !== r.why) groups.push((g = { why: r.why, rows: [], done: [] }));
      (!r.skipped && layerDone(r, trip) ? g.done : g.rows).push(r);
    }
    return groups;
  });
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
  // Round D answer 5: take an alternative (mini lock) or nothing instead of the usual item.
  const pickLayer = (slot, value) => change((t) => ({ layerPick: { ...(t.layerPick ?? {}), [slot]: value === slot ? null : value } }));
  const addAllLayers = () => setEntries((es) => applyLayers(es, openLayers, slotOf));

  // v0.21.0 (decision 5): "Ride and weather" and "Night" folded, one line says what is set.
  const condLine = $derived.by(() => {
    if (!trip) return '';
    const wxText = wxSet ? `${t(RAIN[wx.rain ?? 'none'])} ${wx.min === wx.max ? wx.min : `${wx.min}–${wx.max}`} °C` : t('no weather');
    const kindName = RIDES.find((r) => r.key === trip.ride)?.name;
    const route = typeof trip.route?.km === 'number' ? `${num(Math.round(trip.route.km))} km` : t('no route');
    return [wxText, route, kindName ? t(kindName.replace(' ride', '')) : null].filter(Boolean).join(' · ');
  });
  const nightLine = $derived(NIGHT_SETS.filter((ns) => setOn(ns.key)).map((ns) => t(ns.name)).join(' · ') || t('no overnight set'));
  // Open when the trip needs it now: layers to add, the forecast differs, or a trip with nights
  // and no overnight set yet. Decided once per trip, so a box does not close under the hand.
  let condOpen = $state(false);
  let nightOpen = $state(false);
  let openedFor = null;
  $effect(() => {
    if (!trip || !$itemsQ || openedFor === trip.id) return;
    openedFor = trip.id;
    untrack(() => {
      condOpen = bikeTrip && !over && (openLayers.length > 0 || !!wxGap);
      nightOpen = bikeTrip && !over && (trip.days ?? 1) > 1 && !NIGHT_SETS.some((ns) => setOn(ns.key)) && NIGHT_SETS.some((ns) => setCount(ns.key) > 0);
    });
  });


  // Answer 9: luggage on the front and rear wheel.
  const axle = $derived(stats ? axleLoad(stats, itemsById) : null);
  const rearPct = $derived(axle && axle.front + axle.rear ? Math.round((axle.rear / (axle.front + axle.rear)) * 100) : null);
  const rearLimit = $derived($rearQ?.value ?? 60);

  // Answer 8: litres of water, already part of the system weight through the full bottles.
  const water = $derived(trip ? waterOn(trip, itemsById) : 0);

  // Answer 8a: small symbols in the line of numbers.
  const ICONS = {
    bag: 'M3 6h10l-1 8H4zM6 6V4.5a2 2 0 0 1 4 0V6',
    bags: 'M2 7h6l-.5 6h-5zM9 5h5l-.5 8H9.5zM4 7V5.5a1 1 0 0 1 2 0V7',
    me: 'M8 2.5a2 2 0 1 1 0 4a2 2 0 0 1 0-4M4 14c0-3 1.8-5.5 4-5.5s4 2.5 4 5.5',
    bike: 'M1.5 11a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M9.5 11a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M4 11l3-5h4l1 5M6 4h2',
    water: 'M8 2c3 4 4 6 4 8a4 4 0 0 1-8 0c0-2 1-4 4-8z',
    axle: 'M2 8h12M5 5L2 8l3 3M11 5l3 3-3 3',
    list: 'M6 4h8M6 8h8M6 12h8M2.5 4h.5M2.5 8h.5M2.5 12h.5',
  };

  const kg = (g) => (g ? `${(g / 1000).toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg` : '–');
</script>

<div class="pack">
  {#if !trips.length && $tripsQ}
    <h1 class="title big">{t('Pack')}</h1>
    <p class="card">{t('No trips yet. Import your data on the')} <a href="#/">{t('start page')}</a>{t(', or')} <button type="button" class="btn hi" onclick={() => (dialog = { trip: null })}>{t('Create a trip')}</button></p>
  {:else if trip && stats}
    <!-- Answer 1a: title, facts and buttons in one row.
         v0.21.0 (decision 5, 8a): only title and tags stay in sight; the trip picker, the small
         "Packing day" and "Ride day" buttons and every rare action sit in one "•••" menu, also on a
         desktop. The big "Next" button below stays the main action. -->
    <header class="head">
      <h1 class="title big">{trip.title}</h1>
      <p class="tags">
        {#if whenLabel(trip.startDate)}<span class="tag hi">{whenLabel(trip.startDate)}</span>{/if}
        <span class="tag">{tn(trip.days, '{n} day', '{n} days')}</span>
        <span class="tag">{bikeTrip ? (bike?.name ?? t('No bike')) : t(domainName(domain))}</span>
        {#if trip.skipped}<span class="tag">{bikeTrip ? t('Not riding') : t('Not going')}</span>{/if}
      </p>
      <details class="menu" bind:open={menuOpen} onkeydown={(e) => e.key === 'Escape' && closeMenu(e)}>
        <summary aria-label={t('More: other trip, packing day, templates, print')} title={t('More')}>•••</summary>
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <div class="menu-in" onclick={(e) => e.target.closest('button, a') && (menuOpen = false)}>
          <label class="m-pick">
            <span class="lbl">{t('Open another trip')}</span>
            <select class="sel" value={trip.id} onchange={(e) => ((menuOpen = false), choose(e.currentTarget.value))}>
              {#each trips as tr (tr.id)}<option value={tr.id}>{tr.title}{tr.startDate ? ` · ${tr.startDate}` : ''}</option>{/each}
            </select>
          </label>
          <div class="m-row">
            <button type="button" class="btn" onclick={() => (packDay = true)}>{t('Packing day')}{#if stats.packed}<small class="num"> {stats.packed}/{stats.count}</small>{/if}</button>
            {#if bikeTrip}<a class="btn" href="#/ride" onclick={() => choose(trip.id)}>{t('Ride day')}</a>{/if}
            {#if trip.startDate && trip.startDate <= new Date().toISOString().slice(0, 10) && step < DEBRIEF}<a class="btn" href="#/debrief/{encodeURIComponent(trip.id)}">{t('Debrief')}</a>{/if}
          </div>
          <hr />
          <button type="button" class="btn" onclick={() => (dialog = { trip: null })}>{t('New trip')}</button>
          <!-- Answer 5a: the templates as buttons; one click starts a new trip from it. -->
          {#if templates.length && bikeTrip}
            <div class="tpls" role="group" aria-label={t('New trip from a template')}>
              <span class="lbl">{t('New trip from a template')}</span>
              {#each templates as tp (tp.id)}
                <button type="button" class="tpl" class:cur={tp.id === fromTemplate?.id} title={tp.id === fromTemplate?.id ? t('This trip comes from this template. Click for a new trip from it.') : t('New trip from this template')} onclick={() => (dialog = { trip: null, startFrom: tp.id })}>{tp.name}</button>
              {/each}
            </div>
          {/if}
          {#if bikeTrip}<button type="button" class="btn" onclick={() => (saveTpl = true)}>{t('Save as template')}</button>{/if}
          <a class="btn" href="#/pack/templates">{t('Templates')} <small>{templates.length}</small></a>
          <hr />
          <button type="button" class="btn" onclick={() => window.print()} title={t('In the print dialog choose Save as PDF')}>{t('Print / PDF')}</button>
          <button type="button" class="btn" onclick={shareList}>{t('Share link')}</button>
          {#if stats.packed}<button type="button" class="btn" onclick={resetPacked}>{t('Untick packed items')}</button>{/if}
          <hr />
          <button type="button" class="btn" onclick={() => (dialog = { trip })}>{t('Edit trip')}</button>
          {#if bikeTrip && !over && bikes.length > 1}<button type="button" class="btn" onclick={() => (choosing = true)}>{t('Compare bikes')}</button>{/if}
          <!-- v0.19.2 (question 10): a trip you will not ride stays, but is no "next trip" and no reminder. -->
          <button type="button" class="btn" onclick={() => change(() => ({ skipped: !trip.skipped }))}>{bikeTrip ? (trip.skipped ? t('Riding it after all') : t('Not riding')) : trip.skipped ? t('Going after all') : t('Not going')}</button>
        </div>
      </details>
    </header>

    {#if tplNote}<p class="ok" role="status">{tplNote}</p>{/if}
    {#if shareNote}<p class="ok share-note" role="status">{shareNote}</p>{/if}
    <!-- Design answer 9b: all weights in one compact line. -->
    <!-- Design audit P1, P2: on a phone only System, Gear and Items show, the rest behind "More";
         in the Add tab the weights step aside so the items start higher up. -->
    <!-- v0.20.2 (Noah: "einen grossen Knopf, der mich zum nächsten Schritt bringt"):
         the four steps of a trip, and one big button for the next one. -->
    <nav class="next" aria-label={t('Steps of this trip')}>
      <ol class="steps">
        {#each STEPS as s, i (s)}<li class:done={i < step} class:cur={i === step}><span class="n">{i < step ? '✓' : i + 1}</span>{t(s)}</li>{/each}
      </ol>
      {#if step === DEBRIEF}
        {#if over}
          <a class="btn hi go" href="#/debrief/{encodeURIComponent(trip.id)}"><b>{t('Next: debrief')}</b><small>{t('Two minutes: what you used, missed or did not need.')}</small></a>
        {:else}
          <!-- v0.21.0: no ride day without a bike; this button ends the trip, as "End trip and debrief" does there. -->
          <button type="button" class="btn hi go" onclick={endTrip}><b>{t('Next: debrief')}</b><small>{t('Everything packed. Back home? This ends the trip: two minutes on what you used, missed or did not need.')}</small></button>
        {/if}
      {:else if step === 2}
        <a class="btn hi go" href="#/ride" onclick={() => choose(trip.id)}><b>{t('Next: ride day')}</b><small>{t('Everything packed. Route, weather, what is where, and at the end "End trip and debrief".')}</small></a>
      {:else}
        <button type="button" class="btn hi go" onclick={() => (packDay = true)}><b>{t('Next: packing day')}</b><small>{t('Pack bag by bag and tick off, then the ready check: {packed} of {count} packed, {ready} of {total} checks.', { packed: stats.packed, count: stats.count, ready: readyCount, total: readyTotal })}</small></button>
      {/if}
    </nav>
    <!-- v0.21.0 (decision 5): "Before the trip" folded, its counts in the summary. Inside, the
         preparation tasks (answer 2b: they stay on every trip) fold into one line; bike rows apart. -->
    {#if before?.rows.length}
      {@const late = before.rows.filter((r) => r.late).length}
      <details class="shop">
        <summary><span class="lbl">{t('Before the trip')}</span> <small>{t('{n} to do', { n: before.rows.length })}{late ? ` · ${t('{n} overdue', { n: late })}` : ''}</small></summary>
        {#if beforeGroups.prep.rows.length}
          <details class="prepg">
            <summary>{beforeGroups.prep.late ? t('Preparation: {n} open ({late} overdue)', { n: beforeGroups.prep.rows.length, late: beforeGroups.prep.late }) : t('Preparation: {n} open', { n: beforeGroups.prep.rows.length })}</summary>
            <ul>
              {#each beforeGroups.prep.rows as r (r.key)}<li class:now={r.late}><b>{r.name}</b> <small>{r.detail}</small></li>{/each}
            </ul>
          </details>
        {/if}
        {#if beforeGroups.bike.rows.length}
          <ul>
            {#each beforeGroups.bike.rows as r (r.key)}<li class:now={r.late}><b>{r.name}</b> <small>{r.when === 'during' ? `${t('on the trip')} · ` : ''}{r.detail}</small></li>{/each}
          </ul>
        {/if}
        {#if bikeTrip}<a class="btn sm" href={bikesHash({ tab: 'care', bike: trip?.bikeId })}>{t('Bike care')}</a>{/if}
      </details>
    {/if}
    {#if extra?.rows.length}
      <section class="ballast" aria-labelledby="ballast-h">
        <h2 id="ballast-h"><span class="lbl">{t('Ballast')}</span> <small class="num">{extra.totalG ? formatWeight(extra.totalG) : ''}{extra.unweighed ? `${extra.totalG ? ' + ' : ''}${t('{n} not weighed', { n: extra.unweighed })}` : ''} · {t('not used the last times')}</small></h2>
        <ul>
          {#each ballastAll ? extra.rows : extra.rows.slice(0, SHOW) as r (r.itemId)}
            <li>
              <span class="b-nm"><b>{itemsById[r.itemId] ? nameOf(itemsById[r.itemId]) : r.name}</b> <small title={t('Not used on {trips}', { trips: r.titles.join(', ') })}>{t('{n}× not used', { n: r.n })}</small></span>
              <span class="w num" class:nw={r.g == null}>{r.g == null ? t('not weighed') : formatWeight(r.g)}</span>
              <button type="button" class="link" onclick={() => leave([r.itemId])}>{t('Leave at home')}</button>
              <button type="button" class="link quiet" title={t('Stays on this trip, the card stops asking')} onclick={() => keep(r.itemId)}>{t('Keep')}</button>
            </li>
          {/each}
          {#if !ballastAll && extra.rows.length > SHOW}<li class="more-li"><button type="button" class="link" onclick={() => (ballastAll = true)}>{t('{n} more', { n: extra.rows.length - SHOW })}</button></li>{/if}
        </ul>
        {#if extra.rows.length > 1}<button type="button" class="btn sm" onclick={() => leave(extra.rows.map((r) => r.itemId))}>{t('Leave all {n} at home', { n: extra.rows.length })}{extra.totalG ? ` (−${formatWeight(extra.totalG)})` : ''}</button>{/if}
      </section>
    {/if}
    <!-- v0.21.0 (decision 5, 9a): four figures in sight, every other one under "More". -->
    <section class="sys" class:away={phone.matches && tab === 'add'} aria-label={t('Weights')}>
      {#snippet ic(name)}<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><path d={ICONS[name]} /></svg>{/snippet}
      {#if bikeTrip}<div class="w1"><span class="lbl">{t('System')}</span><b class="num">{kg(stats.systemG)}</b></div>
      {:else}<div class="w1" title={t('Everything packed and worn')}><span class="lbl">{t('Total')}</span><b class="num">{kg(stats.gearG + stats.onMeG)}</b></div>{/if}
      <div class="w1" title={bikeTrip ? t('Gear in the bags and on the bike, without what you wear and without food and water') : t('Gear in the bags, without what you wear and without food and water')}>{@render ic('bag')}<span class="lbl">{t('Base')}</span><b class="num">{formatWeight(stats.baseG)}</b></div>
      <div class="w1" title={t('What you wear, without food in the pockets')}>{@render ic('me')}<span class="lbl">{t('On you')}</span><b class="num">{formatWeight(stats.wornG)}</b></div>
      <div class="w1" title={t('Food and full bottles, wherever they are')}>{@render ic('water')}<span class="lbl">{t('Food and water')}</span><b class="num">{formatWeight(stats.consumablesG)}</b></div>
      <button type="button" class="link morew" aria-expanded={allWeights} aria-controls="sys-more" onclick={() => (allWeights = !allWeights)}>{allWeights ? t('Less') : t('More')}</button>
      {#if canUndo}<button type="button" class="btn sm undo" onclick={undoLast} title={t('Put back the last change')}>↶ {t('Undo')}</button>{/if}
      {#if allWeights}
        <div class="more-w" id="sys-more">
          {#if bikeTrip}
          <div class="w1">{@render ic('bags')}<span class="lbl">{t('Bags')}</span><b class="num">{formatWeight(stats.bagsG)}</b></div>
          <div class="w1">{@render ic('bike')}<span class="lbl">{t('Bike')}</span>{#if stats.missing.bike}<a class="nw" href="#/bikes">{t('not weighed')}</a>{:else}<b class="num">{formatWeight(stats.bikeG)}</b>{/if}</div>
          <div class="w1">{@render ic('me')}<span class="lbl">{t('Rider')}</span>{#if stats.missing.rider}<a class="nw" href="#/bikes">{t('not set')}</a>{:else}<b class="num">{formatWeight(stats.riderG)}</b>{/if}</div>
          {/if}
          {#if water}<div class="w1">{@render ic('water')}<span class="lbl">{t('Water')}</span><b class="num">{num(Math.round(water * 10) / 10)} L</b></div>{/if}
          {#if bikeTrip}<div class="w1" title={t('Luggage on the front / rear wheel: {front} / {rear}', { front: formatWeight(axle.front), rear: formatWeight(axle.rear) })}>{@render ic('axle')}<span class="lbl">{t('Front / rear')}</span><b class="num" class:warn={rearPct > rearLimit}>{rearPct != null ? `${100 - rearPct} / ${rearPct} %` : '–'}</b></div>{/if}
          <div class="w1">{@render ic('list')}<span class="lbl">{t('Items')}</span><b class="num">{stats.count}</b></div>
          {#if stats.unweighed}
            <span class="nw">{t('{n} not weighed', { n: stats.unweighed })}</span>
            {#if toWeigh}<button type="button" class="btn sm" onclick={() => (weighing = true)}>{t('Weigh {n}', { n: toWeigh })}</button>{/if}
          {/if}
        </div>
      {/if}
      {#if bikeTrip && rearPct > rearLimit}<p class="sys-note warn">{t('{pct} % of the luggage is on the rear wheel (hint above {limit} %).', { pct: rearPct, limit: rearLimit })}</p>{/if}
    </section>

    {#if choosing && choiceRows.length}
      <BikeChoice rows={choiceRows} {trip} onpick={useBike} onclose={() => (choosing = false)} />
    {/if}
    {#if packDay}
      <PackDay {trip} bike={bikeTrip} wxGap={bikeTrip ? wxGap : null} onwx={useForecast} steps={daySteps} {itemsById} {badges} {ready} ontoggle={toggleIn} onready={toggleReady} onclose={() => (packDay = false)} />
    {/if}
    {#if shownPhoto != null && gallery.length}
      <Lightbox list={gallery.map((p) => ({ src: p.src, name: p.name, sub: bike?.name ?? '' }))} start={shownPhoto} onclose={() => (shownPhoto = null)} />
    {/if}
    {#if weighing}
      <WeighMode items={tripItems} onclose={() => (weighing = false)} />
    {:else}
    {#if phone.matches}
      <div class="tabs" role="tablist" aria-label={t('Show')}>
        <button type="button" role="tab" aria-selected={tab === 'pack'} onclick={() => (tab = 'pack')}>{t('Pack')} <small>{stats.count}</small></button>
        <button type="button" role="tab" aria-selected={tab === 'add'} onclick={() => (tab = 'add')}>{t('Add')} <small>{candidates.length}</small></button>
        <button type="button" role="tab" aria-selected={tab === 'check'} onclick={() => (tab = 'check')}>{t('Check|ready')} <small>{readyCount}/{readyTotal}</small></button>
      </div>
    {/if}

    {#snippet layers()}
      <p class="hint">{t('Suggestions only: nothing goes on the trip until you press Pack, Wear or Add all.')}</p>
      <div class="ride" role="group" aria-label={t('Kind of ride')}>
        <span class="lbl">{t('Kind of ride')}</span>
        <div class="presets">
          {#each RIDES as r (r.key)}
            <button type="button" class="toggle" aria-pressed={trip.ride === r.key} onclick={() => change(() => ({ ride: trip.ride === r.key ? null : r.key }))}>{t(r.name.replace(' ride', ''))}</button>
          {/each}
        </div>
        <p class="hint">{rideHint}</p>
      </div>
      <TripRoute {trip} onchange={change} />
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
      {#if suggestion.length}
        <div class="sugg">
          <p class="sugg-h"><b>{t('Layers for this ride')}</b>{#if openLayers.length}<button type="button" class="btn sm hi" onclick={addAllLayers}>{t('Add all {n}', { n: openLayers.length })}</button>{:else}<span class="ok">{t('All set')}</span>{/if}</p>
          <!-- Answer 5a: one title per rule; rows already done fold into one line. -->
          {#each layerGroups as g, n (n)}
            <div class="lg">
              <p class="lgh">{g.why}</p>
              {#if g.rows.length}
                <ul>
                  {#each g.rows as r (r.slot)}
                    <li class:skip={r.skipped}>
                      <span class="nm">
                        {#if r.alts.length}
                          <select class="sel alt" aria-label={t('Choose for {name}', { name: nameOf(itemsById[r.slot]) })} value={r.skipped ? 'none' : r.id} onchange={(e) => pickLayer(r.slot, e.currentTarget.value)}>
                            {#each r.alts as a (a)}<option value={a}>{nameOf(itemsById[a])}</option>{/each}
                            <option value="none">{t('None')}</option>
                          </select>
                        {:else}{nameOf(itemsById[r.id])}{/if}{#if r.qty > 1}<small> × {r.qty}</small>{/if}
                        {#if r.replaces}<small class="instead">{t('instead of {name}', { name: nameOf(itemsById[r.replaces]) })}</small>{/if}
                      </span>
                      {#if r.skipped}<span class="ok muted">{t('Skipped')}</span>{:else}<button type="button" class="btn sm" onclick={() => takeLayer(r)}>{r.replaces ? t('Swap') : r.place === 'wear' ? t('Wear') : t('Pack')}</button>{/if}
                    </li>
                  {/each}
                </ul>
              {/if}
              {#if g.done.length}<p class="lgd">✓ {t('Done: {names}', { names: g.done.map((r) => nameOf(itemsById[r.id])).join(', ') })}</p>{/if}
            </div>
          {/each}
        </div>
      {:else if trip.ride || (wx?.min != null && wx?.max != null) || wx?.rain === 'showers' || wx?.rain === 'rain'}
        <p class="hint">{t('Nothing to add. Set layers on your items in Gear (Edit → Layers).')}</p>
      {/if}
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

    {#snippet target()}
      <!-- Answer 2a: a calm line instead of a big orange field; the choice opens on "change". -->
      <label class="target">
        <span>{t('Adding to')}</span>
        <b>{targetName}</b>
        <span class="tc">{t('change')}</span>
        <select value={zone?.key} onchange={(e) => (zoneKey = e.currentTarget.value)} aria-label={t('Bag that + adds to')}>
          {#each targets as tg (tg.key)}<option value={tg.key}>{tg.bag ? tg.bag.name : t(tg.zone.name)}</option>{/each}
        </select>
      </label>
    {/snippet}

    <div class="cols">
      {#if !phone.matches || tab === 'add'}
        <div class="c-np">
          {#if phone.matches && bikeTrip}
            <details class="ph-cond">
              <summary>{t('Ride, weather and night')}{#if openLayers.length}<small class="lab">{tn(openLayers.length, '{n} layer to add', '{n} layers to add')}</small>{/if}</summary>
              {@render layers()}
              <h3 class="sub">{t('Night')}</h3>
              {@render night()}
            </details>
          {/if}
          <NotPacked items={candidates} {tagOf} target={targetName} onadd={add} drag={!phone.matches} bind:q empty={bikeTrip ? '' : items.some((i) => isInventory(i) && inDomain(i, domain)) ? t('Every {area} item is on this trip. Search above to find any other item you own.', { area: t(domainName(domain)) }) : t('No items for {area} yet. Search above to add any item you own, or in Gear open an item and tick {area} under Areas.', { area: t(domainName(domain)) })}>
            {#if !phone.matches}{@render target()}{/if}
          </NotPacked>
        </div>
      {/if}

      {#if !phone.matches || tab === 'pack'}
        <div class="c-bag">
          <PackStage {cards} bike={bikeTrip} photo={bikeTrip ? (shot?.src ?? null) : null} photoName={shot?.name ?? ''} onphoto={() => (shownPhoto = Math.max(0, gallery.findIndex((p) => p.id === shot?.id)))} strip={phone.matches} onpick={pick} ondropitem={phone.matches ? null : addTo} label={!bikeTrip ? t('Bags of this trip, tap one to open it') : bike?.name ? t('Bags on {bike}, tap one to open it', { bike: bike.name }) : t('Bags on the bike, tap one to open it')} />

          <!-- Answer 3a (4.10.2026): under the boxes every bag as a list, items moved with "Move" or by dragging.
               On a phone only the bag chosen in the strip. -->
          <div class="blist">
            {#each listZones as z (z.key)}
              {@const zf = z.bag?.volumeL && z.vol ? (z.vol / z.bag.volumeL) * 100 : null}
              {@const purpose = purposeOf(z.key)}
              <section class="bl" class:on={z.key === zone?.key} class:over={overList === z.key} id="bag-{z.key}" aria-label={purpose ?? zoneName(z)} ondragover={(ev) => listDragover(ev, z.key)} ondragleave={() => overList === z.key && (overList = null)} ondrop={(ev) => listDrop(ev, z.key)}>
                <header class="bl-h">
                  <h2 class="title">{purpose ?? t(z.zone.name)}</h2>
                  <span class="bn">{purpose ? zoneName(z) : z.bag && z.bag.name !== z.zone.name ? z.bag.name : ''}</span>
                  <span class="m num">{tn(z.entries.length, '{n} item', '{n} items')} · {z.grams || !z.entries.length ? formatWeight(z.grams) : t('not weighed')}{#if z.bag?.volumeL}{` · ${formatVolume(z.bag.volumeL)}`}{/if}</span>
                  <span class="bl-acts">
                    <button type="button" class="link ra" onclick={() => (editPurpose = editPurpose === z.key ? null : z.key)}>{purpose ? t('Rename') : t('Name it')}</button>
                    {#if !phone.matches && !z.noBag}
                      <button type="button" class="btn sm" class:pressed={z.key === zone?.key} aria-pressed={z.key === zone?.key} onclick={() => (zoneKey = z.key)}>{z.key === zone?.key ? t('Adding here') : t('+ Add here')}</button>
                    {/if}
                  </span>
                </header>
                {#if editPurpose === z.key}
                  <form class="pname" onsubmit={(ev) => (ev.preventDefault(), savePurpose(z.key, new FormData(ev.currentTarget).get('p')))}>
                    <!-- svelte-ignore a11y_autofocus -->
                    <input class="inp" name="p" value={purpose ?? ''} placeholder={t('What it is for, e.g. Quick access')} aria-label={t('What {bag} is for', { bag: zoneName(z) })} autofocus />
                    <button type="submit" class="btn sm">{t('Save')}</button>
                  </form>
                {/if}
                {#if zf != null}
                  <div class="fill" class:warn={tooFull(z)}>
                    <div class="bar" role="img" aria-label={t('About {pct} % full', { pct: Math.round(zf) })}>
                      <span class="in" style:width="{Math.min(100, zf)}%"></span>
                      <span class="mark" style:left="{FILL_LIMIT * 100}%" title="{FILL_LIMIT * 100} %"></span>
                    </div>
                    <span class="num">{t('{vol} of {cap}', { vol: formatVolume(z.vol), cap: formatVolume(z.bag.volumeL) })}</span>
                  </div>
                {/if}
                {#if tooFull(z)}
                  {@const big = biggerBag(z, bags)}
                  <p class="warnbox soft">
                    {z.vol > z.bag.volumeL ? t('Probably too full: about {vol} for {cap}.', { vol: formatVolume(z.vol), cap: formatVolume(z.bag.volumeL) }) : t('Over {pct} %, keep some room free: about {vol} for {cap}.', { pct: FILL_LIMIT * 100, vol: formatVolume(z.vol), cap: formatVolume(z.bag.volumeL) })}
                    {#if big}<button type="button" class="btn sm" onclick={() => setBag(z.key, big.id)}>{t('Take {bag} ({vol})', { bag: big.name, vol: formatVolume(big.volumeL) })}</button>{/if}
                  </p>
                {/if}
                {#if phone.matches && heavyHigh(z, itemsById).length}
                  <p class="hint heavy">{t('Heavy item high or far back: move to the frame bag?')} <small>{heavyHigh(z, itemsById).map((id) => nameOf(itemsById[id])).join(', ')}</small></p>
                {/if}
                {#if z.noBag}<p class="warnbox">{t('This trip has no bag here. Move these items or choose a bag in "Bags for this trip".')}</p>{/if}
                <ul class="rows">
                  {#each rowsOf(z) as { e, head } (e.itemId)}
                    {@const it = itemsById[e.itemId]}
                    {#if head}<li class="cathead">{head}</li>{/if}
                    <!-- v0.21.0 (decision 5): a desktop row shows name and weight; "•••", "Move" and "−"
                         appear when the row is hovered, focused or open (keyboard: Tab reaches them).
                         On a phone the whole row is one button that opens amount, bag and "Take out". -->
                    <li class="row" class:open={openRow === e.itemId} class:ph={phone.matches} draggable={!phone.matches} ondragstart={(ev) => (ev.dataTransfer.setData('text/plain', e.itemId), (ev.dataTransfer.effectAllowed = 'copyMove'))} style:--c={CATEGORY[it?.category]?.color ?? 'var(--line)'}>
                      {#snippet nm()}{it ? nameOf(it) : e.itemId}{#if (e.qty || 1) > 1}<small class="q"> × {e.qty}</small>{/if}{#if e.packed}<small class="in" title={t('In the bag (packing day)')}> ✓</small>{/if}{#if badges[e.itemId]}<span class="bdgs">{#each badges[e.itemId] as b (b.key)}<span class="bdg {b.tone}" title={b.text}>{b.label}</span>{/each}</span>{/if}{/snippet}
                      {#if phone.matches}
                        <button type="button" class="nm nmb" aria-expanded={openRow === e.itemId} onclick={() => (openRow = openRow === e.itemId ? null : e.itemId)}>{@render nm()}</button>
                      {:else}
                        <span class="nm">{@render nm()}</span>
                      {/if}
                      <span class="w num" class:nw={it?.weightG == null} title={it?.weightG == null ? t('not weighed') : undefined}>{it?.weightG == null ? '—' : formatWeight(it.weightG * (e.qty || 1))}</span>
                      {#if !phone.matches}
                        <button type="button" class="more ra" aria-expanded={openRow === e.itemId} aria-label={t('Amount for {name}', { name: nameOf(it) })} onclick={() => (openRow = openRow === e.itemId ? null : e.itemId)}>⋯</button>
                        <select class="sel mv ra" aria-label={t('Move {name} to', { name: nameOf(it) })} value={e.slot} onchange={(ev) => moveTo(e.itemId, ev.currentTarget.value)}>
                          {#each targets as tg (tg.key)}<option value={tg.key}>{tg.key === e.slot ? t('Move') : (purposeOf(tg.key) ?? (tg.bag ? tg.bag.name : t(tg.zone.name)))}</option>{/each}
                          {#if z.noBag}<option value={z.key}>{t('Move')}</option>{/if}
                        </select>
                        <button type="button" class="minus ra" aria-label={t('Take {name} out of {bag}', { name: nameOf(it), bag: zoneName(z) })} onclick={() => removeEntry(e.itemId)}>−</button>
                      {/if}
                      {#if openRow === e.itemId}
                        {#if badges[e.itemId]}
                          <span class="why">{#each badges[e.itemId] as b (b.key)}<span><b>{b.key === 'tip' ? t('Learning') : b.label}:</b> {b.text}</span>{/each}</span>
                        {/if}
                        <span class="acts">
                          <span class="qty">
                            <button type="button" aria-label={t('One less {name}', { name: nameOf(it) })} disabled={(e.qty || 1) <= 1} onclick={() => setQty(e.itemId, (e.qty || 1) - 1)}>−</button>
                            <span class="num">{e.qty || 1}×</span>
                            <button type="button" aria-label={t('One more {name}', { name: nameOf(it) })} onclick={() => setQty(e.itemId, (e.qty || 1) + 1)}>+</button>
                          </span>
                          {#if phone.matches}
                            <select class="sel mv" aria-label={t('Move {name} to', { name: nameOf(it) })} value={e.slot} onchange={(ev) => moveTo(e.itemId, ev.currentTarget.value)}>
                              {#each targets as tg (tg.key)}<option value={tg.key}>{purposeOf(tg.key) ?? (tg.bag ? tg.bag.name : t(tg.zone.name))}</option>{/each}
                              {#if z.noBag}<option value={z.key}>{t('{name} (no bag)', { name: t(z.zone.name) })}</option>{/if}
                            </select>
                            <button type="button" class="btn sm out" aria-label={t('Take {name} out of {bag}', { name: nameOf(it), bag: zoneName(z) })} onclick={() => removeEntry(e.itemId)}>− {t('Take out')}</button>
                          {/if}
                        </span>
                      {/if}
                    </li>
                  {:else}
                    <li class="drophint">{phone.matches ? t('Nothing in here yet. Add items in the Add tab.') : t('+ Drop or add an item')}</li>
                  {/each}
                </ul>
              </section>
            {/each}
          </div>

          {#if phone.matches && bikeTrip}
            <details class="setup">
              <summary>{t('Bags for this trip')}</summary>
              {@render bagChoice()}
            </details>
          {/if}
        </div>
      {/if}

      {#if !phone.matches}
        <aside class="c-side" aria-label={bikeTrip ? t('Ride and checks') : t('Checks')}>
          <!-- v0.21.0 (decision 5): folded with a one-line summary, open when the trip needs it now. -->
          {#if bikeTrip}
          <details class="box-s fold" bind:open={condOpen}>
            <summary><span class="title">{t('Ride and weather')}</span><span class="fsum">{condLine}{#if openLayers.length}<small class="lab">{tn(openLayers.length, '{n} layer to add', '{n} layers to add')}</small>{/if}</span></summary>
            {@render layers()}
          </details>
          <details class="box-s fold" bind:open={nightOpen}>
            <summary><span class="title">{t('Night')}</span><span class="fsum">{nightLine}</span></summary>
            {@render night()}
          </details>
          {/if}
          <!-- Noah, 4.10.2026: the ready check is always folded; a click opens the whole list. -->
          <details class="box-s ready fold">
            <summary class="ready-h">
              <span class="title">{t('Ready check')}</span>
              <span class="num m">{readyCount} / {readyTotal}</span>
            </summary>
            {@render readyFull()}
          </details>
          {#if bikeTrip}
            <details class="box-s setup">
              <summary>{t('Bags for this trip')}</summary>
              {@render bagChoice()}
            </details>
          {/if}
        </aside>
      {/if}

      {#if phone.matches && tab === 'check'}
        <section class="ready" aria-labelledby="ready-h">
          <div class="ready-h">
            <h2 id="ready-h" class="title">{t('Ready check')}</h2>
            <span class="num m">{readyCount} / {readyTotal}</span>
          </div>
          {@render readyFull()}
        </section>
      {/if}
    </div>
    {#if phone.matches && tab === 'add' && zone}
      <div class="addbar">
        <span class="t">{t('Adding to')} <b>{targetName}</b>{#if fill != null}{' · '}{t('{vol} of {cap}', { vol: formatVolume(zone.vol), cap: formatVolume(zone.bag.volumeL) })}{/if}</span>
        <label class="chg">
          <span>{t('Change bag')}</span>
          <select value={zone.key} onchange={(e) => (zoneKey = e.currentTarget.value)} aria-label={t('Change the bag that + adds to')}>
            {#each targets as tg (tg.key)}<option value={tg.key}>{tg.bag ? tg.bag.name : t(tg.zone.name)}</option>{/each}
          </select>
        </label>
      </div>
    {/if}
    {/if}
    <section class="print" aria-hidden="true">
      <h1>{trip.title}</h1>
      {#if bikeTrip}<p>{trip.startDate ?? ''} · {tn(trip.days, '{n} day', '{n} days')} · {bike?.name ?? ''} · {t('system weight {kg}', { kg: kg(stats.systemG) })}</p>
      {:else}<p>{trip.startDate ?? ''} · {tn(trip.days, '{n} day', '{n} days')} · {t(domainName(domain))} · {t('total {kg}', { kg: kg(stats.gearG + stats.onMeG) })}</p>{/if}
      {#each stats.zones.filter((z) => z.entries.length) as z (z.key)}
        <h2>{zoneName(z)} <small>{tn(z.entries.length, '{n} item', '{n} items')} · {formatWeight(z.grams)}</small></h2>
        <ul>
          {#each z.entries as e (e.itemId)}<li>☐ {itemsById[e.itemId] ? nameOf(itemsById[e.itemId]) : e.itemId}{(e.qty || 1) > 1 ? ` × ${e.qty}` : ''}</li>{/each}
        </ul>
      {/each}
      <h2>{t('Ready check')}</h2>
      <ul>{#each ready as r (r.id)}<li>☐ {t(r.label)}</li>{/each}</ul>
    </section>
  {/if}
</div>

{#if dialog}
  <TripDialog trip={dialog.trip} {trips} {bikes} {items} {templates} startFrom={dialog.startFrom ?? 'last'} domain={dialog.domain ?? null} defaultBikeId={trip?.bikeId} onclose={() => (dialog = null)} oncreated={choose} />
{/if}
{#if saveTpl && trip}
  <TemplateDialog {trip} {templates} onclose={() => (saveTpl = false)} onsaved={(name) => ((tplNote = t('Saved as template "{name}".', { name })), setTimeout(() => (tplNote = ''), 4000))} />
{/if}

<style>
  /* v0.21.0 (decision 5): "Before the trip" folded; the preparation tasks fold once more inside. */
  .shop {
    margin: 0 0 12px;
    padding: 8px 14px;
    border: 1.5px solid var(--line);
    border-left: 5px solid var(--ink);
    border-radius: 8px;
    background: var(--paper);
  }
  .shop summary {
    cursor: pointer;
  }
  .shop > summary {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 10px;
  }
  .shop > summary::before {
    content: '▸';
  }
  .shop[open] > summary::before {
    content: '▾';
  }
  .shop > summary::-webkit-details-marker {
    display: none;
  }
  .shop > summary .lbl {
    margin: 0;
    font-weight: 700;
  }
  .shop > summary {
    list-style: none;
  }
  .shop > summary small,
  .shop li small {
    color: var(--ink-3);
  }
  .shop[open] > summary {
    margin-bottom: 6px;
  }
  .prepg {
    margin: 0 0 6px;
  }
  .prepg > summary {
    font-weight: 600;
  }
  .shop ul {
    margin: 4px 0 8px;
    padding-left: 18px;
  }
  .shop li.now b {
    color: #a03a00;
  }
  /* v0.20.2: the steps of a trip and the big "next" button */
  .next {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
    align-items: center;
    gap: 12px 24px;
    margin: 0 0 16px;
    padding: 14px 16px;
    border: 2px solid var(--ink);
    border-radius: 10px;
    background: var(--paper);
  }
  .steps {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
    margin: 0;
    padding: 0;
    list-style: none;
    font: 600 14px var(--font-body);
    color: var(--ink-3);
  }
  .steps li {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .steps .n {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid currentColor;
    font-size: 12px;
  }
  .steps .done {
    color: var(--ink);
  }
  .steps .cur {
    color: var(--ink);
  }
  .steps .cur .n {
    background: var(--hi);
    border-color: var(--hi);
    color: #fff;
  }
  .go {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 2px;
    width: 100%;
    min-height: 64px;
    padding: 10px 18px;
    text-align: left;
    box-sizing: border-box;
  }
  .go b {
    font-size: 19px;
  }
  .go b::after {
    content: ' →';
  }
  .go small {
    font-weight: 400;
    font-size: 13px;
    opacity: 0.92;
    white-space: normal;
  }
  @media (max-width: 719px) {
    .next {
      grid-template-columns: minmax(0, 1fr);
      padding: 12px;
    }
    .steps {
      font-size: 12px;
      gap: 4px 10px;
    }
  }
  .sys.away {
    display: none;
  }
  .more-w {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px 22px;
    flex-basis: 100%;
  }
  .morew {
    font-size: 14px;
  }
  .big {
    font-size: clamp(38px, 5vw, 56px);
    line-height: 0.95;
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
    margin-bottom: 10px;
  }
  @media (max-width: 719px) {
    .head .title {
      flex: 1 1 0;
      min-width: 0;
      overflow-wrap: anywhere;
    }
    .head .tags {
      order: 3;
      flex-basis: 100%;
    }
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 0;
  }
  .menu {
    position: relative;
    margin-left: auto;
  }
  .menu summary {
    list-style: none;
    padding: 4px 12px;
    border: 2px solid var(--ink);
    border-radius: 6px;
    background: var(--paper);
    font: 700 20px/1 var(--font-body);
    letter-spacing: 2px;
    cursor: pointer;
  }
  .menu summary::-webkit-details-marker {
    display: none;
  }
  .menu[open] summary {
    background: var(--ink);
    color: var(--paper);
  }
  /* v0.21.0 (8a): one menu for the trip picker and every rare action. */
  .menu-in {
    position: absolute;
    right: 0;
    top: calc(100% + 4px);
    z-index: 6;
    display: grid;
    gap: 6px;
    width: 300px;
    max-width: calc(100vw - 2 * var(--gut, 16px));
    max-height: 75vh;
    overflow: auto;
    padding: 10px;
    background: var(--paper);
    border: 2px solid var(--ink);
    border-radius: 6px;
    box-shadow: 0 6px 18px rgb(0 0 0 / 0.15);
    box-sizing: border-box;
  }
  .menu-in hr {
    width: 100%;
    margin: 2px 0;
    border: 0;
    border-top: 1px solid var(--line);
  }
  .menu-in .btn {
    text-align: left;
  }
  .m-pick {
    display: grid;
    gap: 2px;
  }
  .m-pick .sel {
    width: 100%;
    min-width: 0;
  }
  .m-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .m-row .btn {
    flex: 1;
    text-align: center;
  }
  .tag {
    border: 1.5px solid var(--ink);
    padding: 1px 7px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  /* Answer 1a: orange only for actions; the countdown is dark. */
  .tag.hi {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .tpls {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0;
  }
  .tpls .lbl {
    flex-basis: 100%;
  }
  .tpl {
    border: 1.5px solid var(--line);
    border-radius: 6px;
    background: var(--paper);
    padding: 4px 12px;
    font: 600 14px var(--font-body);
    color: var(--ink);
    cursor: pointer;
  }
  .tpl.cur {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .ic {
    width: 15px;
    height: 15px;
    align-self: center;
    fill: none;
    stroke: var(--ink-3);
    stroke-width: 1.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .undo {
    margin-left: auto;
  }
  /* Answer 3a: all bags as a list under the boxes. */
  .blist {
    display: grid;
    gap: 12px;
    margin-top: 14px;
  }
  .bl {
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 10px 12px;
    scroll-margin-top: 70px;
  }
  .bl.on {
    border-color: var(--ink);
    box-shadow: inset 4px 0 0 var(--ink);
  }
  .bl.over {
    outline: 3px solid var(--hi);
    outline-offset: 2px;
  }
  .bl-h {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 10px;
    padding-bottom: 6px;
    border-bottom: 2px solid var(--ink);
  }
  .bl-h .title {
    font-size: 24px;
  }
  .bn {
    font-size: 14px;
    color: var(--ink-2);
  }
  .bl-h .m {
    color: var(--ink-3);
    font-size: 13px;
  }
  .bl-acts {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: auto;
  }
  .btn.pressed {
    background: var(--ink);
    color: var(--paper);
  }
  .pname {
    display: flex;
    gap: 8px;
    margin: 8px 0 0;
  }
  .pname .inp {
    flex: 1;
    min-width: 0;
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto auto auto;
    align-items: center;
    gap: 8px;
    min-height: 34px;
    padding: 1px 0 1px 10px;
    border-bottom: 1px solid var(--paper-2, #e6ebe3);
    border-left: 4px solid var(--c);
  }
  .row:last-child {
    border-bottom: 0;
  }
  .row .nm {
    overflow-wrap: anywhere;
  }
  .q {
    color: var(--ink-3);
  }
  .row .in {
    color: var(--ink-3);
  }
  /* v0.19.5 (F4, answer 3a): short badges, the sentence when the row opens. */
  .bdgs {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-left: 6px;
    vertical-align: middle;
  }
  .bdg {
    display: inline-block;
    padding: 1px 7px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink-2);
    font: 600 11px/1.5 var(--font-body);
  }
  .bdg.warn {
    border-color: #c98a55;
    color: #8a3d00;
  }
  .row .why {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 13px;
    color: var(--ink-2);
  }
  /* N3 (answer 2a): ballast on this trip. */
  .ballast {
    margin: 0 0 12px;
    padding: 10px 14px;
    border: 1.5px solid var(--line);
    border-left: 5px solid #c98a55;
    border-radius: 8px;
    background: var(--paper);
  }
  .ballast h2 {
    margin: 0 0 4px;
    font: inherit;
  }
  .ballast h2 .lbl {
    font-weight: 700;
  }
  .ballast h2 small,
  .ballast li small {
    color: var(--ink-3);
  }
  .ballast ul {
    list-style: none;
    margin: 0 0 8px;
    padding: 0;
  }
  .ballast li {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 12px;
    padding: 3px 0;
    border-bottom: 1px solid var(--paper-2, #e6ebe3);
  }
  .ballast .b-nm {
    flex: 1 1 180px;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .ballast .quiet {
    color: var(--ink-3);
  }
  .row .acts {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    padding: 4px 0 6px;
  }
  .row .mv {
    max-width: 150px;
    padding: 3px 6px;
    font-size: 13px;
    color: var(--ink-2);
  }
  @media (max-width: 719px) {
    .row {
      grid-template-columns: minmax(0, 1fr) auto auto auto;
      min-height: 48px;
    }
    .row .mv {
      max-width: none;
      flex: 1;
    }
  }
  /* v0.21.0 (decision 5): on a desktop with a mouse the row actions show on hover, focus or when open. */
  @media (hover: hover) and (min-width: 720px) {
    .row:not(.open):not(:hover):not(:focus-within) .ra,
    .bl:not(:hover):not(:focus-within) .bl-acts .ra {
      opacity: 0;
    }
  }
  .row.ph {
    grid-template-columns: minmax(0, 1fr) auto;
    padding-right: 4px;
  }
  .nmb {
    min-height: 44px;
    padding: 4px 0;
    border: 0;
    background: none;
    font: inherit;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }
  .hint.heavy small {
    display: block;
  }
  .row[draggable='true'] {
    cursor: grab;
  }
  .drophint {
    margin-top: 8px;
    padding: 10px;
    border: 1.5px dashed var(--line);
    border-radius: 6px;
    color: var(--ink-3);
    text-align: center;
  }
  .link {
    border: 0;
    background: none;
    padding: 0;
    font: inherit;
    font-size: 14px;
    color: var(--ink);
    text-decoration: underline;
    cursor: pointer;
  }
  .sys {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px 22px;
    padding: 8px 0;
    border-top: 3px solid var(--ink);
    border-bottom: 1px solid var(--line);
    margin-bottom: 14px;
  }
  .w1 {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }
  .w1 .lbl {
    margin: 0;
  }
  .w1 b {
    font-weight: 700;
  }
  .w1:first-child b {
    font: 900 28px/1 var(--font-title);
  }
  /* Design answer 8b: "not weighed" in grey, not orange. */
  .nw {
    color: var(--ink-3);
    font-size: 13px;
  }
  .sys-note {
    flex-basis: 100%;
    margin: 0;
    font-size: 14px;
  }
  .warn {
    color: var(--hi);
  }
  .tabs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    border: 2px solid var(--ink);
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 12px;
  }
  .tabs button {
    border: 0;
    border-right: 2px solid var(--ink);
    background: var(--paper);
    padding: 8px 4px;
    font: 700 15px var(--font-body);
    color: var(--ink);
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .tabs button:last-child {
    border-right: 0;
  }
  .tabs button[aria-selected='true'] {
    background: var(--ink);
    color: var(--paper);
  }
  .tabs small {
    font-weight: 400;
    font-size: 12px;
  }
  .btn.sm {
    padding: 3px 10px;
    font-size: 13px;
    margin-left: 6px;
  }
  .warnbox.soft {
    border-color: var(--hi);
    background: var(--hi-soft);
  }
  .sets,
  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
  }
  .toggle {
    border: 1.5px solid var(--ink-3);
    background: var(--paper);
    border-radius: 999px;
    padding: 5px 12px;
    font: 600 14px var(--font-body);
    color: var(--ink);
    cursor: pointer;
  }
  .toggle[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .toggle:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .toggle small {
    font-weight: 400;
    opacity: 0.8;
  }
  .setlist summary {
    cursor: pointer;
    font-size: 14px;
    font-weight: 700;
  }
  .setlist ul {
    margin: 4px 0 0;
    padding: 0 0 0 18px;
    font-size: 14px;
    color: var(--ink-3);
  }
  .setlist li.on {
    color: var(--ink);
  }
  .wxin {
    display: grid;
    grid-template-columns: 1fr 1fr 1.4fr;
    align-items: end;
    gap: 8px;
    margin-bottom: 8px;
  }
  .wxbox {
    margin-bottom: 8px;
  }
  .wxbox summary {
    cursor: pointer;
    font-weight: 700;
    padding: 4px 0;
  }
  .wxbox .chg {
    margin-left: 8px;
    font-weight: 400;
    font-size: 14px;
    text-decoration: underline;
  }
  .wxbox[open] .chg {
    display: none;
  }
  .ride .hint {
    margin: 2px 0 8px;
  }
  .hours {
    display: grid;
    grid-template-columns: auto 90px;
    align-items: center;
    gap: 10px;
  }
  .hint.hrs {
    margin: 2px 0 10px;
  }
  .sugg {
    margin-top: 10px;
    background: var(--paper);
    padding: 8px;
    border: 1px solid var(--line);
  }
  .sugg-h {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0 0 6px;
  }
  .sugg ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .lg + .lg {
    margin-top: 6px;
  }
  .lgh {
    margin: 6px 0 0;
    padding-bottom: 2px;
    border-bottom: 1px solid var(--line);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  .lgd {
    margin: 4px 0 0;
    font-size: 13px;
    font-weight: 600;
    color: #2f7a4f;
  }
  .sugg li:first-child {
    border-top: 0;
  }
  .sugg li {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    align-items: center;
    padding: 4px 0;
    border-top: 1px solid var(--line);
  }
  .instead {
    display: block;
    color: var(--ink-3);
  }
  .sel.alt {
    padding: 2px 6px;
    font-size: 14px;
    max-width: 100%;
  }
  .ok.muted {
    color: var(--ink-3);
  }
  .ok {
    font-size: 13px;
    color: #2f7a4f;
    font-weight: 700;
  }
  .print {
    display: none;
  }
  .share-note {
    overflow-wrap: anywhere;
  }
  @media print {
    :global(nav.top),
    .head .menu,
    .sys,
    .tabs,
    .cols,
    :global(.weigh) {
      display: none !important;
    }
    :global(body) {
      background: #fff !important;
    }
    .print {
      display: block;
      font-size: 12pt;
      color: #000;
    }
    .print h1 {
      font-size: 22pt;
      margin: 0;
    }
    .print h2 {
      font-size: 14pt;
      margin: 14pt 0 4pt;
      border-bottom: 1pt solid #000;
      break-after: avoid;
    }
    .print ul {
      list-style: none;
      padding: 0;
      margin: 0;
      columns: 2;
    }
    .print li {
      padding: 2pt 0;
      break-inside: avoid;
    }
    .head {
      display: none;
    }
  }
  /* Mockup answer 1a: three columns. Not packed | bike and open bag | layers, night, ready check. */
  .cols {
    display: grid;
    gap: 16px;
  }
  .c-np,
  .c-bag,
  .c-side {
    min-width: 0;
  }
  .c-side {
    display: grid;
    gap: 12px;
    align-content: start;
    align-items: start;
  }
  @media (min-width: 720px) {
    .cols {
      grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
      align-items: start;
    }
    .c-np {
      position: sticky;
      top: 60px;
      height: calc(100vh - 76px);
      display: flex;
      flex-direction: column;
    }
    .c-np :global(.np) {
      flex: 1;
    }
    .c-side {
      grid-column: 2;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    }
  }
  @media (min-width: 1180px) {
    .cols {
      grid-template-columns: minmax(270px, 330px) minmax(0, 1fr) minmax(290px, 340px);
    }
    .c-side {
      grid-column: auto;
      grid-template-columns: none;
    }
  }
  .box-s {
    background: var(--paper);
    border: 1px solid var(--line);
    padding: 10px;
  }
  .box-s .title {
    font-size: 26px;
    border-bottom: 3px solid var(--ink);
    margin-bottom: 8px;
  }
  .box-s.setup summary {
    font-family: var(--font-title);
    font-size: 22px;
    text-transform: uppercase;
  }
  .target {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 700;
    color: var(--ink-3);
  }
  .target {
    position: relative;
    padding: 5px 12px;
    border-radius: 999px;
    background: var(--paper-2, #e6ebe3);
    font-weight: 400;
    color: var(--ink-2);
  }
  .target b {
    flex: 1;
    min-width: 0;
    color: var(--ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .target .tc {
    color: var(--ink);
    font-weight: 600;
    text-decoration: underline;
  }
  .target select {
    position: absolute;
    inset: 0;
    width: 100%;
    opacity: 0;
    cursor: pointer;
    font-size: 16px;
  }
  .ph-cond {
    margin-bottom: 12px;
    background: var(--paper);
    border: 1px solid var(--line);
    padding: 8px 10px;
  }
  .ph-cond summary {
    cursor: pointer;
    font-weight: 700;
  }
  .lab {
    margin-left: 8px;
    padding: 0 6px;
    border: 1px solid var(--hi);
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
  }
  .sub {
    margin: 12px 0 6px;
    font-size: 12px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  .fill {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 8px 0;
    font-size: 13px;
  }
  .fill .bar {
    position: relative;
    flex: 1;
    height: 10px;
    background: var(--paper);
    border: 1.5px solid var(--ink);
    border-radius: 2px;
  }
  .fill .in {
    position: absolute;
    inset: 0 auto 0 0;
    background: var(--ink);
  }
  .fill.warn .in {
    background: var(--hi);
  }
  .fill .mark {
    position: absolute;
    top: -5px;
    bottom: -5px;
    width: 2px;
    background: var(--hi);
  }
  /* Noah, 4.10.2026: no tick boxes; one click on − takes the item out of the bag. */
  .minus {
    width: 26px;
    height: 26px;
    border: 1.5px solid var(--ink-3);
    border-radius: 4px;
    background: var(--paper);
    color: var(--ink);
    font: 700 16px/1 var(--font-body);
    cursor: pointer;
  }
  @media (hover: hover) {
    .minus:hover {
      border-color: #c0392b;
      color: #c0392b;
    }
  }
  /* Answer 9a: a phone shows the open bag as one column of rows, with a title per category. */
  .cathead {
    padding: 6px 8px 4px;
    background: var(--paper-2, #e6ebe3);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  /* Mockup answer 8a: on a phone a fixed bar at the bottom says where "+" puts things. */
  .addbar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: calc(62px + env(safe-area-inset-bottom)); /* above the bottom bar (v0.19.6) */
    z-index: 4;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px var(--gut);
    border-bottom: 1px solid #3b5a50;
    background: var(--ink);
    color: var(--paper);
    font-size: 14px;
  }
  .addbar .t {
    flex: 1;
    min-width: 0;
  }
  .chg {
    position: relative;
    flex: none;
    border: 1.5px solid var(--paper);
    border-radius: 999px;
    padding: 6px 12px;
    font-weight: 600;
  }
  .chg select {
    position: absolute;
    inset: 0;
    width: 100%;
    opacity: 0;
    font-size: 16px;
  }
  .pack:has(.addbar) {
    padding-bottom: 70px;
  }
  .warnbox {
    margin: 8px 0;
    padding: 8px 10px;
    border: 2px solid #c0392b;
    background: #fbe9e7;
    font-size: 14px;
  }
  .ready ul,
  .slots {
    list-style: none;
    margin: 0;
    padding: 0;
    background: var(--paper);
  }
  .ck {
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 0;
    cursor: pointer;
  }
  .ck input {
    width: 22px;
    height: 22px;
    accent-color: var(--ink);
    flex: none;
  }
  .w {
    text-align: right;
    font-weight: 700;
    font-size: 14px;
  }
  .w.nw {
    font-weight: 400;
  }
  .qty {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
  .more {
    width: 36px;
    height: 32px;
    border: 0;
    background: none;
    font: 700 20px/1 var(--font-body);
    color: var(--ink-2);
  }
  .qty button,
  .x {
    width: 32px;
    height: 32px;
    border: 1.5px solid var(--ink-3);
    border-radius: 4px;
    background: var(--paper);
    font: 700 18px/1 var(--font-body);
    color: var(--ink);
    cursor: pointer;
  }
  .qty button:disabled {
    opacity: 0.35;
  }
  .qty .num {
    min-width: 26px;
    text-align: center;
    font-size: 14px;
  }
  .mv {
    flex: 1;
    min-width: 0;
    max-width: 200px;
    padding: 4px 6px;
    font-size: 14px;
  }
  .x {
    margin-left: auto;
  }
  .setup {
    margin-top: 16px;
  }
  .setup summary {
    cursor: pointer;
    font-weight: 700;
  }
  .hint {
    color: var(--ink-3);
    font-size: 14px;
    margin: 4px 0 8px;
  }
  .slots li {
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: 8px;
    align-items: center;
    padding: 6px 8px;
    border-bottom: 1px solid var(--line);
  }
  .ready .title {
    font-size: 26px;
    border-bottom: 0;
    margin-bottom: 0;
  }
  .fold summary {
    cursor: pointer;
    list-style: none;
  }
  .fold summary::-webkit-details-marker {
    display: none;
  }
  .fold summary .title {
    display: block;
    font-size: 26px;
  }
  .fold .fsum {
    display: block;
    margin-top: -4px;
    font-size: 14px;
    color: var(--ink-2);
  }
  .fold summary .title::before {
    content: '▸ ';
    font-size: 18px;
  }
  .fold[open] summary .title::before {
    content: '▾ ';
  }
  .fold[open] summary {
    margin-bottom: 8px;
  }
  .ready-h {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    border-bottom: 3px solid var(--ink);
  }
  .ready li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    border-bottom: 1px solid var(--line);
  }
  .ready li.done span {
    color: var(--ink-3);
  }
  .ready-acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 14px;
    margin: 0 0 8px;
  }
  .addcheck {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    margin: 12px 0 8px;
  }
</style>
