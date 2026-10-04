<script>
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { isOver, tipsByItem } from '../lib/debrief.js';
  import { phone } from '../lib/media.svelte.js';
  import { SLOTS, bagsFor, formatVolume, sortBikes } from '../lib/bikes.js';
  import { CATEGORY, CATEGORIES, formatWeight, isInventory, matches, weighQueue } from '../lib/gear.js';
  import { tripStats, packSteps, togglePacked, readyDone, whenLabel, onTrip, zoneName, freshReady, bagItemIds, NIGHT_SETS, toggleSet, WX_PRESETS, RAIN, biggerBag, tooFull, FILL_LIMIT, axleLoad, slotFor } from '../lib/trips.js';
  import { RIDES, layerSuggest, layerDone, applyLayers, openRows, waterOn } from '../lib/layers.js';
  import WeighMode from '../lib/gear/WeighMode.svelte';
  import PackStage from '../lib/pack/PackStage.svelte';
  import TripDialog from '../lib/pack/TripDialog.svelte';
  import NotPacked from '../lib/pack/NotPacked.svelte';
  import TemplateDialog from '../lib/pack/TemplateDialog.svelte';
  import PackDay from '../lib/pack/PackDay.svelte';
  import TripRoute from '../lib/pack/TripRoute.svelte';
  import { sharePayload, shareLink } from '../lib/share.js';
  import { TEMPLATES_KEY } from '../lib/templates.js';
  import { bikePhotos, packPhoto } from '../lib/photo.js';
  import Lightbox from '../lib/ui/Lightbox.svelte';
  import { withVisits, tyreSetup, beforeTrip } from '../lib/workshop.js';
  import { stageCount } from '../lib/ride.js';
  import { forecastForTrip, toWx } from '../lib/weather.js';

  const tripsQ = liveQuery(() => db.trips.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const bagsQ = liveQuery(() => db.containers.toArray());
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const photosQ = liveQuery(() => db.photos.toArray());
  const visitsQ = liveQuery(() => db.visits.toArray());
  const riderQ = liveQuery(() => db.settings.get('riderWeightG'));
  const rearQ = liveQuery(() => db.settings.get('rearLimitPct'));
  const tplQ = liveQuery(() => db.settings.get(TEMPLATES_KEY));
  const learnQ = liveQuery(() => db.learnings.toArray());
  // Answer 3a: one learning per item as a small hint while packing.
  const tips = $derived(tipsByItem($learnQ ?? []));
  const templates = $derived($tplQ?.value ?? []);
  const fromTemplate = $derived(templates.find((t) => t.id === trip?.templateId) ?? null);
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
      [...trips].filter((t) => (t.startDate ?? '') >= today).sort((a, b) => a.startDate.localeCompare(b.startDate))[0] ??
      trips[0],
  );
  const bike = $derived(trip ? bikes.find((b) => b.id === trip.bikeId) : null);
  // Setup photo behind the bags (answers 2a-4a): the trip's own photo, else the bike's main photo.
  const gallery = $derived(bikePhotos(bike, $photosQ ?? []));
  const shot = $derived(packPhoto(trip, bike, $photosQ ?? []));
  let shownPhoto = $state(null);
  // Workshop before the trip (v0.18.0, answers 9a and 10a): from 14 days before, what is due now
  // or becomes due on the way. Home stays calm (answer 17b).
  const workshop = $derived.by(() => {
    if (!bike || !trip) return null;
    const view = withVisits(bike, $visitsQ ?? []);
    return beforeTrip(view, trip, tyreSetup(view, $visitsQ ?? []), today);
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
    change((t) => ({ wx: { ...(t.wx ?? {}), ...fcWx } }));
    packDay = false;
    if (phone.matches) tab = 'add';
    setTimeout(() => {
      const box = document.querySelector('.ph-cond');
      if (box) box.open = true; // phone: the layers sit in the folded "Ride, weather and night"
      document.querySelector('.sugg-h')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }
  const toggleIn = (itemId) => change((t) => ({ entries: togglePacked(t.entries, itemId) }));
  // Answer 14: the list as a link (the list travels inside the address, nothing is uploaded).
  let shareNote = $state('');
  async function shareList() {
    const url = await shareLink(sharePayload($state.snapshot(trip), stats, itemsById));
    try {
      if (navigator.share && phone.matches) await navigator.share({ title: `Packing list: ${trip.title}`, url });
      else {
        await navigator.clipboard.writeText(url);
        shareNote = 'Link copied. Paste it into a message; it opens a read-only list.';
      }
    } catch (err) {
      if (err?.name !== 'AbortError') shareNote = `Copy this link: ${url}`;
    }
    setTimeout(() => (shareNote = ''), 8000);
  }
  const resetPacked = () => confirm('Untick every item, to pack again from the start?') && change((t) => ({ entries: t.entries.map((e) => ({ ...e, packed: false })) }));

  let zoneKey = $state('seat'); // the bag that is open
  let tab = $state('pack'); // phone: pack | add | check
  let allWeights = $state(false); // phone: show every weight (design audit P1)
  let dialog = $state(null); // { trip } or { trip: null, startFrom? }
  // "New trip from it" on the Templates page opens the new-trip dialog with that template.
  $effect(() => {
    if (!$tplQ) return; // wait until the templates are loaded, so the choice can be shown
    let id = null;
    try {
      id = localStorage.getItem('pack.startFrom');
      localStorage.removeItem('pack.startFrom');
    } catch {
      /* private mode */
    }
    if (id) dialog = { trip: null, startFrom: id };
  });
  let q = $state('');
  let newCheck = $state('');
  let openRow = $state(null); // phone: the row whose actions (amount, move, remove) are shown

  const zone = $derived(stats?.zones.find((z) => z.key === zoneKey) ?? stats?.zones.find((z) => z.key === 'seat') ?? stats?.zones[0]);

  // Noah's sketch (4.10.2026): big boxes per bag with what is inside, instead of small labels.
  const cards = $derived(
    (stats?.zones ?? []).map((z) => {
      const names = z.entries.map((e) => itemsById[e.itemId]?.name ?? e.itemId);
      const cap = z.bag?.volumeL || null;
      return {
        key: z.key,
        title: trip?.purpose?.[z.key] || z.zone.name,
        name: z.bag ? z.bag.name : z.zone.name,
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
    const list = items.filter((i) => isInventory(i) && !on.has(i.id) && !asBag.has(i.id) && !fixed.has(i.id) && matches(i, { q }));
    const order = Object.fromEntries(CATEGORIES.map((c, n) => [c.key, n]));
    const rank = (i) => (i.role === 'standard' || i.role === 'worn' ? 0 : i.sets?.length ? 1 : i.role === 'optional' ? 2 : 3);
    return list.sort((a, b) => rank(a) - rank(b) || (order[a.category] ?? 99) - (order[b.category] ?? 99) || a.name.localeCompare(b.name));
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
  const targetName = $derived(zone ? (zone.noBag ? 'On me' : zone.bag ? zone.bag.name : zone.zone.name) : 'the trip');

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
    return sorted.map((e, n) => ({ e, head: n === 0 || cat(sorted[n - 1]) !== cat(e) ? CATEGORY[cat(e)]?.name ?? 'Other' : null }));
  }

  // How full the open bag is, in % (only when the bag has a volume).
  const fill = $derived(zone?.bag?.volumeL && zone.vol ? (zone.vol / zone.bag.volumeL) * 100 : null);

  const setBag = (slotKey, bagId) => change((t) => ({ setup: { ...t.setup, [slotKey]: bagId || null } }));

  // Ready check (decision 7, mockup 6a, cleanup 4.10.2026): one short list, edits change only this trip.
  const standardQ = liveQuery(() => db.settings.get('readyStandard'));
  const standard = $derived($standardQ?.value ?? null);
  const ready = $derived(trip?.ready ?? []);
  const readyCount = $derived(ready.filter((r) => trip && readyDone(r, trip)).length);
  const readyTotal = $derived(ready.length);
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
  const resetReady = () => confirm('Use your standard ready check again for this trip?') && change(() => ({ ready: freshReady(standard) }));
  const readyChanged = $derived(ready.map((r) => r.label).join('|') !== freshReady(standard).map((r) => r.label).join('|'));
  // Answer 4: save this trip's list as the standard for every new trip.
  let savedNote = $state('');
  async function saveStandard() {
    const list = ready.filter((r) => !r.itemId).map((r, n) => ({ id: r.id.startsWith('own-') ? `std-${n}-${Date.now().toString(36)}` : r.id, label: r.label }));
    await db.settings.put({ key: 'readyStandard', value: list });
    savedNote = 'Saved. New trips start with this list.';
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
    if (!trip?.ride) return 'Choose one: it adds what you take on that kind of ride.';
    const upTo = RIDES.slice(0, RIDES.findIndex((r) => r.key === trip.ride) + 1).map((r) => r.key);
    const names = items.filter((i) => isInventory(i) && upTo.includes(i.ride)).map((i) => i.name);
    return names.length ? `Adds: ${names.join(', ')}.` : 'No items set for this kind of ride yet (Gear → Edit → Layers).';
  });
  // Mockup answer 3a: a small label in "Not packed" says why an item is suggested.
  const tagOf = (i) => suggestion.find((r) => r.id === i.id && !r.skipped)?.why ?? (i.always ? 'every trip' : i.role === 'standard' || i.role === 'worn' ? 'standard' : '');
  // Round D answer 5: take an alternative (mini lock) or nothing instead of the usual item.
  const pickLayer = (slot, value) => change((t) => ({ layerPick: { ...(t.layerPick ?? {}), [slot]: value === slot ? null : value } }));
  const addAllLayers = () => setEntries((es) => applyLayers(es, openLayers, slotOf));


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

  const kg = (g) => (g ? `${(g / 1000).toFixed(1)} kg` : '–');
</script>

<div class="pack">
  {#if !trips.length && $tripsQ}
    <h1 class="title big">Pack</h1>
    <p class="card">No trips yet. Import your data on the <a href="#/">start page</a>, or <button type="button" class="btn hi" onclick={() => (dialog = { trip: null })}>Create a trip</button></p>
  {:else if trip && stats}
    <!-- Answer 1a: title, facts and buttons in one row. -->
    <header class="head">
      <h1 class="title big">{trip.title}</h1>
      <p class="tags">
        {#if whenLabel(trip.startDate)}<span class="tag hi">{whenLabel(trip.startDate)}</span>{/if}
        <span class="tag">{trip.days} {trip.days === 1 ? 'day' : 'days'}</span>
        <span class="tag">{bike?.name ?? 'No bike'}</span>
        <button type="button" class="link" onclick={() => (dialog = { trip })}>Edit</button>
      </p>
      <!-- Answer 5a: the templates as buttons; one click starts a new trip from it. -->
      {#if templates.length}
        <p class="tpls" role="group" aria-label="Templates">
          {#each templates as t (t.id)}
            <button type="button" class="tpl" class:cur={t.id === fromTemplate?.id} title={t.id === fromTemplate?.id ? 'This trip comes from this template. Click for a new trip from it.' : 'New trip from this template'} onclick={() => (dialog = { trip: null, startFrom: t.id })}>{t.name}</button>
          {/each}
        </p>
      {/if}
      <div class="pick">
        <select class="sel" aria-label="Open another trip" value={trip.id} onchange={(e) => choose(e.currentTarget.value)}>
          {#each trips as t (t.id)}<option value={t.id}>{t.title}{t.startDate ? ` · ${t.startDate}` : ''}</option>{/each}
        </select>
        <button type="button" class="btn hi" onclick={() => (packDay = true)}>Packing day{#if stats.packed}<small class="num"> {stats.packed}/{stats.count}</small>{/if}</button>
        <a class="btn" href="#/ride" onclick={() => choose(trip.id)}>Ride day</a>
        {#snippet actions()}
          <button type="button" class="btn" onclick={() => (dialog = { trip: null })}>New trip</button>
          <button type="button" class="btn" onclick={() => (saveTpl = true)}>Save as template</button>
          <a class="btn" href="#/pack/templates">Templates <small>{templates.length}</small></a>
          <button type="button" class="btn" onclick={() => window.print()} title="In the print dialog choose Save as PDF">Print / PDF</button>
          <button type="button" class="btn" onclick={shareList}>Share link</button>
          {#if stats.packed}<button type="button" class="btn" onclick={resetPacked}>Untick packed items</button>{/if}
        {/snippet}
        {#if phone.matches}
          <details class="menu">
            <summary aria-label="More: new trip, templates, print">•••</summary>
            <div class="menu-in">{@render actions()}</div>
          </details>
        {:else}
          {@render actions()}
        {/if}
      </div>
    </header>

    {#if tplNote}<p class="ok" role="status">{tplNote}</p>{/if}
    {#if shareNote}<p class="ok share-note" role="status">{shareNote}</p>{/if}
    <!-- Design answer 9b: all weights in one compact line. -->
    <!-- Design audit P1, P2: on a phone only System, Gear and Items show, the rest behind "More";
         in the Add tab the weights step aside so the items start higher up. -->
    {#if over}
      <p class="debrief-cta">This trip is over. <a class="btn hi sm" href="#/debrief/{encodeURIComponent(trip.id)}">Start debrief</a><span class="muted">Two minutes: what you used, missed or did not need.</span></p>
    {/if}
    {#if workshop?.rows.length}
      <section class="shop" aria-labelledby="shop-h">
        <h2 id="shop-h"><span class="lbl">Workshop before the trip</span> <small>{workshop.days ? `${workshop.days} ${workshop.days === 1 ? 'day' : 'days'} to go` : 'on the way'}</small></h2>
        <ul>
          {#each workshop.rows as r (r.key + r.when)}<li class:now={r.when === 'now'}><b>{r.name}</b> <small>{r.detail}</small></li>{/each}
        </ul>
        <a class="btn sm" href="#/care">Bike care</a>
      </section>
    {/if}
    <section class="sys" class:short={phone.matches && !allWeights} class:away={phone.matches && tab === 'add'} aria-label="Weights">
      {#snippet ic(name)}<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><path d={ICONS[name]} /></svg>{/snippet}
      <div class="w1"><span class="lbl">System</span><b class="num">{kg(stats.systemG)}</b></div>
      <div class="w1">{@render ic('bag')}<span class="lbl">Gear</span><b class="num">{formatWeight(stats.gearG)}</b></div>
      <div class="w1 sec">{@render ic('me')}<span class="lbl">On me</span><b class="num">{formatWeight(stats.onMeG)}</b></div>
      <div class="w1 sec">{@render ic('bags')}<span class="lbl">Bags</span><b class="num">{formatWeight(stats.bagsG)}</b></div>
      <div class="w1 sec">{@render ic('bike')}<span class="lbl">Bike</span>{#if stats.missing.bike}<a class="nw" href="#/bikes">not weighed</a>{:else}<b class="num">{formatWeight(stats.bikeG)}</b>{/if}</div>
      <div class="w1 sec">{@render ic('me')}<span class="lbl">Rider</span>{#if stats.missing.rider}<a class="nw" href="#/bikes">not set</a>{:else}<b class="num">{formatWeight(stats.riderG)}</b>{/if}</div>
      {#if water}<div class="w1 sec">{@render ic('water')}<span class="lbl">Water</span><b class="num">{Math.round(water * 10) / 10} L</b></div>{/if}
      <div class="w1 sec" title="Luggage on the front / rear wheel: {formatWeight(axle.front)} / {formatWeight(axle.rear)}">{@render ic('axle')}<span class="lbl">Front / rear</span><b class="num" class:warn={rearPct > rearLimit}>{rearPct != null ? `${100 - rearPct} / ${rearPct} %` : '–'}</b></div>
      <div class="w1">{@render ic('list')}<span class="lbl">Items</span><b class="num">{stats.count}</b></div>
      {#if stats.unweighed}
        <span class="nw">{stats.unweighed} not weighed</span>
        {#if toWeigh}<button type="button" class="btn sm" onclick={() => (weighing = true)}>Weigh {toWeigh}</button>{/if}
      {/if}
      {#if phone.matches}<button type="button" class="link morew" aria-expanded={allWeights} onclick={() => (allWeights = !allWeights)}>{allWeights ? 'Less' : 'More weights'}</button>{/if}
      {#if canUndo}<button type="button" class="btn sm undo" onclick={undoLast} title="Put back the last change">↶ Undo</button>{/if}
      {#if rearPct > rearLimit}<p class="sys-note warn">{rearPct} % of the luggage is on the rear wheel (hint above {rearLimit} %).</p>{/if}
    </section>

    {#if packDay}
      <PackDay {trip} {wxGap} onwx={useForecast} steps={daySteps} {itemsById} {tips} {ready} ontoggle={toggleIn} onready={toggleReady} onclose={() => (packDay = false)} />
    {/if}
    {#if shownPhoto != null && gallery.length}
      <Lightbox list={gallery.map((p) => ({ src: p.src, name: p.name, sub: bike?.name ?? '' }))} start={shownPhoto} onclose={() => (shownPhoto = null)} />
    {/if}
    {#if weighing}
      <WeighMode items={tripItems} onclose={() => (weighing = false)} />
    {:else}
    {#if phone.matches}
      <div class="tabs" role="tablist" aria-label="Show">
        <button type="button" role="tab" aria-selected={tab === 'pack'} onclick={() => (tab = 'pack')}>Pack <small>{stats.count}</small></button>
        <button type="button" role="tab" aria-selected={tab === 'add'} onclick={() => (tab = 'add')}>Add <small>{candidates.length}</small></button>
        <button type="button" role="tab" aria-selected={tab === 'check'} onclick={() => (tab = 'check')}>Check <small>{readyCount}/{readyTotal}</small></button>
      </div>
    {/if}

    {#snippet layers()}
      <p class="hint">Suggestions only: nothing goes on the trip until you press Pack, Wear or Add all.</p>
      <div class="ride" role="group" aria-label="Kind of ride">
        <span class="lbl">Kind of ride</span>
        <div class="presets">
          {#each RIDES as r (r.key)}
            <button type="button" class="toggle" aria-pressed={trip.ride === r.key} onclick={() => change(() => ({ ride: trip.ride === r.key ? null : r.key }))}>{r.name.replace(' ride', '')}</button>
          {/each}
        </div>
        <p class="hint">{rideHint}</p>
      </div>
      <TripRoute {trip} onchange={change} />
      <label class="hours"><span class="lbl">Riding hours{stageCount(trip) > 1 ? ' a day' : ''}</span><input class="inp num" type="text" inputmode="decimal" value={trip.hours ?? ''} onchange={(e) => typedHours(e.currentTarget.value)} placeholder="e.g. 6" /></label>
      <p class="hint hrs">Bottles and food come in amounts per hour (e.g. 1 bottle per 3 h).</p>
      <!-- Design answer 6a: the weather folds away once it is set. -->
      <details class="wxbox" open={!wxSet}>
        <summary>{wxSet ? `Weather: ${wx.min}–${wx.max} °C, ${RAIN[wx.rain ?? 'none'].toLowerCase()}` : 'Weather'}<span class="chg">{wxSet ? 'Change' : ''}</span></summary>
        <div class="presets" role="group" aria-label="Weather presets">
          {#each WX_PRESETS as p (p.name)}
            <button type="button" class="toggle" aria-pressed={wx?.min === p.min && wx?.max === p.max} onclick={() => setWx({ min: p.min, max: p.max })}>{p.name} <small>{p.min}–{p.max}°</small></button>
          {/each}
        </div>
        <div class="wxin">
          <label><span class="lbl">Min °C</span><input class="inp num" type="text" inputmode="numeric" value={wx?.min ?? ''} onchange={(e) => typedTemp('min', e.currentTarget.value)} /></label>
          <label><span class="lbl">Max °C</span><input class="inp num" type="text" inputmode="numeric" value={wx?.max ?? ''} onchange={(e) => typedTemp('max', e.currentTarget.value)} /></label>
          <label><span class="lbl">Rain</span>
            <select class="sel" value={wx?.rain ?? 'none'} onchange={(e) => setWx({ rain: e.currentTarget.value })}>
              {#each Object.entries(RAIN) as [k, v] (k)}<option value={k}>{v}</option>{/each}
            </select>
          </label>
        </div>
      </details>
      {#if suggestion.length}
        <div class="sugg">
          <p class="sugg-h"><b>Layers for this ride</b>{#if openLayers.length}<button type="button" class="btn sm hi" onclick={addAllLayers}>Add all {openLayers.length}</button>{:else}<span class="ok">All set</span>{/if}</p>
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
                          <select class="sel alt" aria-label="Choose for {itemsById[r.slot]?.name}" value={r.skipped ? 'none' : r.id} onchange={(e) => pickLayer(r.slot, e.currentTarget.value)}>
                            {#each r.alts as a (a)}<option value={a}>{itemsById[a]?.name}</option>{/each}
                            <option value="none">None</option>
                          </select>
                        {:else}{itemsById[r.id]?.name}{/if}{#if r.qty > 1}<small> × {r.qty}</small>{/if}
                        {#if r.replaces}<small class="instead">instead of {itemsById[r.replaces]?.name}</small>{/if}
                      </span>
                      {#if r.skipped}<span class="ok muted">Skipped</span>{:else}<button type="button" class="btn sm" onclick={() => takeLayer(r)}>{r.replaces ? 'Swap' : r.place === 'wear' ? 'Wear' : 'Pack'}</button>{/if}
                    </li>
                  {/each}
                </ul>
              {/if}
              {#if g.done.length}<p class="lgd">✓ Done: {g.done.map((r) => itemsById[r.id]?.name).join(', ')}</p>{/if}
            </div>
          {/each}
        </div>
      {:else if trip.ride || (wx?.min != null && wx?.max != null) || wx?.rain === 'showers' || wx?.rain === 'rain'}
        <p class="hint">Nothing to add. Set layers on your items in Gear (Edit → Layers).</p>
      {/if}
    {/snippet}

    {#snippet night()}
      <div class="sets" role="group" aria-label="Overnight sets">
        {#each NIGHT_SETS as ns (ns.key)}
          <button type="button" class="toggle" aria-pressed={setOn(ns.key)} onclick={() => switchSet(ns.key)} disabled={!setCount(ns.key)} title={setCount(ns.key) ? '' : 'No items in this set yet. Tag them in Gear.'}>
            {ns.name} <small>{setCount(ns.key)}</small>
          </button>
        {/each}
      </div>
      <!-- Noah, 4.10.2026 (1b): what "Warm" brings is shown open. -->
      {#if warmItems.length}
        <details class="setlist" open>
          <summary>Warm: {warmItems.length} items</summary>
          <ul>
            {#each warmItems as i (i.id)}<li class:on={tripIds.has(i.id)}>{i.name}{#if tripIds.has(i.id)}<span class="ok"> ✓</span>{/if}</li>{/each}
          </ul>
        </details>
      {/if}
    {/snippet}

    {#snippet bagChoice()}
      <ul class="slots">
        {#each SLOTS.filter((s) => !bike || bike.slots?.includes(s.key)) as s (s.key)}
          <li>
            <label for="ts-{s.key}">{s.name}</label>
            <select id="ts-{s.key}" class="sel" value={trip.setup?.[s.key] ?? ''} onchange={(ev) => setBag(s.key, ev.currentTarget.value)}>
              <option value="">No bag</option>
              {#each bagsFor(s.key, bags) as o (o.id)}<option value={o.id}>{o.name}</option>{/each}
            </select>
          </li>
        {/each}
      </ul>
      <p class="hint">Starts with the bags set on {bike?.name ?? 'the bike'} (Bikes page). Changes here only count for this trip.</p>
    {/snippet}

    {#snippet readyFull()}
      <ul>
        {#each ready as r (r.id)}
          {@const done = readyDone(r, trip)}
          <li class:done>
            <label class="ck">
              <input type="checkbox" checked={done} disabled={!!r.itemId && done} onchange={() => toggleReady(r)} />
              <span>{r.label}{#if r.itemId && !done}<small class="warn"> not on this trip, tick to add it</small>{/if}</span>
            </label>
            <button type="button" class="x" aria-label="Remove {r.label} from this trip's check" onclick={() => removeReady(r.id)}>×</button>
          </li>
        {/each}
      </ul>
      <form class="addcheck" onsubmit={addReady}>
        <input class="inp" bind:value={newCheck} placeholder="Add a check for this trip" aria-label="Add a check for this trip" />
        <button type="submit" class="btn">Add</button>
      </form>
      <p class="ready-acts">
        {#if readyCount < readyTotal}<button type="button" class="btn hi" onclick={tickAllReady}>Tick all checks</button>{/if}
        {#if readyChanged}
          <button type="button" class="btn" onclick={saveStandard}>Save as my standard</button>
          <button type="button" class="link" onclick={resetReady}>Back to my standard list</button>
        {/if}
      </p>
      {#if savedNote}<p class="ok" role="status">{savedNote}</p>{/if}
    {/snippet}

    {#snippet target()}
      <!-- Answer 2a: a calm line instead of a big orange field; the choice opens on "change". -->
      <label class="target">
        <span>Adding to</span>
        <b>{targetName}</b>
        <span class="tc">change</span>
        <select value={zone?.key} onchange={(e) => (zoneKey = e.currentTarget.value)} aria-label="Bag that + adds to">
          {#each targets as t (t.key)}<option value={t.key}>{t.bag ? t.bag.name : t.zone.name}</option>{/each}
        </select>
      </label>
    {/snippet}

    <div class="cols">
      {#if !phone.matches || tab === 'add'}
        <div class="c-np">
          {#if phone.matches}
            <details class="ph-cond">
              <summary>Ride, weather and night{#if openLayers.length}<small class="lab">{openLayers.length} layers to add</small>{/if}</summary>
              {@render layers()}
              <h3 class="sub">Night</h3>
              {@render night()}
            </details>
          {/if}
          <NotPacked items={candidates} {tagOf} target={targetName} onadd={add} drag={!phone.matches} bind:q>
            {#if !phone.matches}{@render target()}{/if}
          </NotPacked>
        </div>
      {/if}

      {#if !phone.matches || tab === 'pack'}
        <div class="c-bag">
          <PackStage {cards} photo={shot?.src ?? null} photoName={shot?.name ?? ''} onphoto={() => (shownPhoto = Math.max(0, gallery.findIndex((p) => p.id === shot?.id)))} strip={phone.matches} onpick={pick} ondropitem={phone.matches ? null : addTo} label="Bags on {bike?.name ?? 'the bike'}, tap one to open it" />

          <!-- Answer 3a (4.10.2026): under the boxes every bag as a list, items moved with "Move" or by dragging.
               On a phone only the bag chosen in the strip. -->
          <div class="blist">
            {#each listZones as z (z.key)}
              {@const zf = z.bag?.volumeL && z.vol ? (z.vol / z.bag.volumeL) * 100 : null}
              {@const purpose = purposeOf(z.key)}
              <section class="bl" class:on={z.key === zone?.key} class:over={overList === z.key} id="bag-{z.key}" aria-label={purpose ?? zoneName(z)} ondragover={(ev) => listDragover(ev, z.key)} ondragleave={() => overList === z.key && (overList = null)} ondrop={(ev) => listDrop(ev, z.key)}>
                <header class="bl-h">
                  <h2 class="title">{purpose ?? z.zone.name}</h2>
                  <span class="bn">{purpose ? zoneName(z) : z.bag && z.bag.name !== z.zone.name ? z.bag.name : ''}</span>
                  <span class="m num">{z.entries.length} {z.entries.length === 1 ? 'item' : 'items'} · {z.grams || !z.entries.length ? formatWeight(z.grams) : 'not weighed'}{#if z.bag?.volumeL}{` · ${formatVolume(z.bag.volumeL)}`}{/if}</span>
                  <span class="bl-acts">
                    <button type="button" class="link" onclick={() => (editPurpose = editPurpose === z.key ? null : z.key)}>{purpose ? 'Rename' : 'Name it'}</button>
                    {#if !phone.matches && !z.noBag}
                      <button type="button" class="btn sm" class:pressed={z.key === zone?.key} aria-pressed={z.key === zone?.key} onclick={() => (zoneKey = z.key)}>{z.key === zone?.key ? 'Adding here' : '+ Add here'}</button>
                    {/if}
                  </span>
                </header>
                {#if editPurpose === z.key}
                  <form class="pname" onsubmit={(ev) => (ev.preventDefault(), savePurpose(z.key, new FormData(ev.currentTarget).get('p')))}>
                    <!-- svelte-ignore a11y_autofocus -->
                    <input class="inp" name="p" value={purpose ?? ''} placeholder="What it is for, e.g. Quick access" aria-label="What {zoneName(z)} is for" autofocus />
                    <button type="submit" class="btn sm">Save</button>
                  </form>
                {/if}
                {#if zf != null}
                  <div class="fill" class:warn={tooFull(z)}>
                    <div class="bar" role="img" aria-label="About {Math.round(zf)} % full">
                      <span class="in" style:width="{Math.min(100, zf)}%"></span>
                      <span class="mark" style:left="{FILL_LIMIT * 100}%" title="{FILL_LIMIT * 100} %"></span>
                    </div>
                    <span class="num">{formatVolume(z.vol)} of {formatVolume(z.bag.volumeL)}</span>
                  </div>
                {/if}
                {#if tooFull(z)}
                  {@const big = biggerBag(z, bags)}
                  <p class="warnbox soft">
                    {z.vol > z.bag.volumeL ? 'Probably too full' : `Over ${FILL_LIMIT * 100} %, keep some room free`}: about {formatVolume(z.vol)} for {formatVolume(z.bag.volumeL)}.
                    {#if big}<button type="button" class="btn sm" onclick={() => setBag(z.key, big.id)}>Take {big.name} ({formatVolume(big.volumeL)})</button>{/if}
                  </p>
                {/if}
                {#if z.noBag}<p class="warnbox">This trip has no bag here. Move these items or choose a bag in "Bags for this trip".</p>{/if}
                <ul class="rows">
                  {#each rowsOf(z) as { e, head } (e.itemId)}
                    {@const it = itemsById[e.itemId]}
                    {#if head}<li class="cathead">{head}</li>{/if}
                    <li class="row" class:open={openRow === e.itemId} draggable={!phone.matches} ondragstart={(ev) => (ev.dataTransfer.setData('text/plain', e.itemId), (ev.dataTransfer.effectAllowed = 'copyMove'))} style:--c={CATEGORY[it?.category]?.color ?? 'var(--line)'}>
                      <span class="nm">{it?.name ?? e.itemId}{#if (e.qty || 1) > 1}<small class="q"> × {e.qty}</small>{/if}{#if e.packed}<small class="in" title="In the bag (packing day)"> ✓</small>{/if}{#if tips[e.itemId]}<small class="tip" title={tips[e.itemId].rule}>{tips[e.itemId].rule}</small>{/if}</span>
                      <span class="w num" class:nw={it?.weightG == null} title={it?.weightG == null ? 'not weighed' : undefined}>{it?.weightG == null ? '—' : formatWeight(it.weightG * (e.qty || 1))}</span>
                      <button type="button" class="more" aria-expanded={openRow === e.itemId} aria-label="Amount{phone.matches ? ' or other bag' : ''} for {it?.name}" onclick={() => (openRow = openRow === e.itemId ? null : e.itemId)}>⋯</button>
                      {#if !phone.matches}
                        <select class="sel mv" aria-label="Move {it?.name} to" value={e.slot} onchange={(ev) => moveTo(e.itemId, ev.currentTarget.value)}>
                          {#each targets as t (t.key)}<option value={t.key}>{t.key === e.slot ? 'Move' : (purposeOf(t.key) ?? (t.bag ? t.bag.name : t.zone.name))}</option>{/each}
                          {#if z.noBag}<option value={z.key}>Move</option>{/if}
                        </select>
                      {/if}
                      <button type="button" class="minus" aria-label="Take {it?.name} out of {zoneName(z)}" onclick={() => removeEntry(e.itemId)}>−</button>
                      {#if openRow === e.itemId}
                        <span class="acts">
                          <span class="qty">
                            <button type="button" aria-label="One less {it?.name}" disabled={(e.qty || 1) <= 1} onclick={() => setQty(e.itemId, (e.qty || 1) - 1)}>−</button>
                            <span class="num">{e.qty || 1}×</span>
                            <button type="button" aria-label="One more {it?.name}" onclick={() => setQty(e.itemId, (e.qty || 1) + 1)}>+</button>
                          </span>
                          {#if phone.matches}
                            <select class="sel mv" aria-label="Move {it?.name} to" value={e.slot} onchange={(ev) => moveTo(e.itemId, ev.currentTarget.value)}>
                              {#each targets as t (t.key)}<option value={t.key}>{purposeOf(t.key) ?? (t.bag ? t.bag.name : t.zone.name)}</option>{/each}
                              {#if z.noBag}<option value={z.key}>{z.zone.name} (no bag)</option>{/if}
                            </select>
                          {/if}
                        </span>
                      {/if}
                    </li>
                  {:else}
                    <li class="drophint">{phone.matches ? 'Nothing in here yet. Add items in the Add tab.' : '+ Drop or add an item'}</li>
                  {/each}
                </ul>
              </section>
            {/each}
          </div>

          {#if phone.matches}
            <details class="setup">
              <summary>Bags for this trip</summary>
              {@render bagChoice()}
            </details>
          {/if}
        </div>
      {/if}

      {#if !phone.matches}
        <aside class="c-side" aria-label="Ride and checks">
          <section class="box-s" aria-labelledby="cond-h">
            <h2 id="cond-h" class="title">Ride and weather</h2>
            {@render layers()}
          </section>
          <section class="box-s" aria-labelledby="night-h">
            <h2 id="night-h" class="title">Night</h2>
            {@render night()}
          </section>
          <!-- Noah, 4.10.2026: the ready check is always folded; a click opens the whole list. -->
          <details class="box-s ready fold">
            <summary class="ready-h">
              <span class="title">Ready check</span>
              <span class="num m">{readyCount} / {readyTotal}</span>
            </summary>
            {@render readyFull()}
          </details>
          <details class="box-s setup">
            <summary>Bags for this trip</summary>
            {@render bagChoice()}
          </details>
        </aside>
      {/if}

      {#if phone.matches && tab === 'check'}
        <section class="ready" aria-labelledby="ready-h">
          <div class="ready-h">
            <h2 id="ready-h" class="title">Ready check</h2>
            <span class="num m">{readyCount} / {readyTotal}</span>
          </div>
          {@render readyFull()}
        </section>
      {/if}
    </div>
    {#if phone.matches && tab === 'add' && zone}
      <div class="addbar">
        <span class="t">Adding to <b>{targetName}</b>{#if fill != null}{' · '}{formatVolume(zone.vol)} of {formatVolume(zone.bag.volumeL)}{/if}</span>
        <label class="chg">
          <span>Change bag</span>
          <select value={zone.key} onchange={(e) => (zoneKey = e.currentTarget.value)} aria-label="Change the bag that + adds to">
            {#each targets as t (t.key)}<option value={t.key}>{t.bag ? t.bag.name : t.zone.name}</option>{/each}
          </select>
        </label>
      </div>
    {/if}
    {/if}
    <section class="print" aria-hidden="true">
      <h1>{trip.title}</h1>
      <p>{trip.startDate ?? ''} · {trip.days} {trip.days === 1 ? 'day' : 'days'} · {bike?.name ?? ''} · system weight {kg(stats.systemG)}</p>
      {#each stats.zones.filter((z) => z.entries.length) as z (z.key)}
        <h2>{zoneName(z)} <small>{z.entries.length} items · {formatWeight(z.grams)}</small></h2>
        <ul>
          {#each z.entries as e (e.itemId)}<li>☐ {itemsById[e.itemId]?.name ?? e.itemId}{(e.qty || 1) > 1 ? ` × ${e.qty}` : ''}</li>{/each}
        </ul>
      {/each}
      <h2>Ready check</h2>
      <ul>{#each ready as r (r.id)}<li>☐ {r.label}</li>{/each}</ul>
    </section>
  {/if}
</div>

{#if dialog}
  <TripDialog trip={dialog.trip} {trips} {bikes} {items} {templates} startFrom={dialog.startFrom ?? 'last'} defaultBikeId={trip?.bikeId} onclose={() => (dialog = null)} oncreated={choose} />
{/if}
{#if saveTpl && trip}
  <TemplateDialog {trip} {templates} onclose={() => (saveTpl = false)} onsaved={(name) => ((tplNote = `Saved as template "${name}".`), setTimeout(() => (tplNote = ''), 4000))} />
{/if}

<style>
  .shop {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 16px;
    margin: 0 0 12px;
    padding: 10px 14px;
    border: 1.5px solid var(--line);
    border-left: 5px solid var(--ink);
    border-radius: 8px;
    background: var(--paper);
  }
  .shop h2 {
    flex: 1 0 100%;
    margin: 0;
    font: inherit;
  }
  .shop h2 .lbl {
    font-weight: 700;
  }
  .shop h2 small,
  .shop li small {
    color: var(--ink-3);
  }
  .shop ul {
    flex: 1 1 300px;
    margin: 0;
    padding-left: 18px;
  }
  .shop li.now b {
    color: #a03a00;
  }
  .debrief-cta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    background: var(--paper);
    border: 2px solid var(--ink);
    border-left: 6px solid var(--hi);
    border-radius: 6px;
    padding: 10px 14px;
    margin: 0 0 14px;
    font-weight: 600;
  }
  .debrief-cta .muted {
    font-weight: 400;
    color: var(--ink-3);
    font-size: 14px;
  }
  .sys.short .sec,
  .sys.away {
    display: none;
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
  .tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 0;
  }
  .menu {
    position: relative;
  }
  .menu summary {
    list-style: none;
    padding: 4px 10px;
    font: 700 20px/1 var(--font-body);
    letter-spacing: 2px;
    cursor: pointer;
  }
  .menu summary::-webkit-details-marker {
    display: none;
  }
  .menu-in {
    position: absolute;
    right: 0;
    top: 100%;
    z-index: 5;
    display: grid;
    gap: 6px;
    min-width: 200px;
    padding: 8px;
    background: var(--paper);
    border: 2px solid var(--ink);
    border-radius: 6px;
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
  .pick {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
    margin-left: auto;
  }
  .pick .btn {
    padding: 6px 10px;
  }
  @media (min-width: 720px) {
    .pick {
      flex-wrap: nowrap;
      flex-shrink: 0;
    }
    .pick .btn {
      white-space: nowrap;
    }
    .pick .sel {
      max-width: 220px;
    }
  }
  @media (max-width: 719px) {
    .head .title {
      flex: 1 1 100%;
    }
    .pick {
      flex: 1;
      flex-wrap: nowrap;
    }
    .pick .sel {
      flex: 1;
      min-width: 0;
    }
  }
  .tpls {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0;
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
    min-height: 40px;
    padding: 2px 0 2px 10px;
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
  /* Answer 3a: the learning for this item, one quiet line (the whole sentence on hover). */
  .row .tip {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    line-height: 1.3;
    color: var(--ink-3);
  }
  .row .tip::before {
    content: 'Learning: ';
    font-weight: 700;
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
  .pick .sel {
    max-width: 260px;
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
    .head .pick,
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
    bottom: 0;
    z-index: 4;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px var(--gut) calc(10px + env(safe-area-inset-bottom));
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
    font-size: 26px;
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
