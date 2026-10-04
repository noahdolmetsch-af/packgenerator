<script>
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { phone } from '../lib/media.svelte.js';
  import { SLOTS, bagsFor, formatVolume, sortBikes } from '../lib/bikes.js';
  import { CATEGORY, CATEGORIES, formatWeight, isInventory, matches, weighQueue } from '../lib/gear.js';
  import { tripStats, readyDone, whenLabel, onTrip, zoneName, freshReady, bagItemIds, NIGHT_SETS, toggleSet, WX_PRESETS, RAIN, biggerBag, tooFull, FILL_LIMIT, axleLoad, slotFor } from '../lib/trips.js';
  import { RIDES, layerSuggest, layerDone, applyLayers, openRows, waterOn } from '../lib/layers.js';
  import WeighMode from '../lib/gear/WeighMode.svelte';
  import PackStage from '../lib/pack/PackStage.svelte';
  import TripDialog from '../lib/pack/TripDialog.svelte';
  import NotPacked from '../lib/pack/NotPacked.svelte';
  import TemplateDialog from '../lib/pack/TemplateDialog.svelte';
  import { TEMPLATES_KEY } from '../lib/templates.js';

  const tripsQ = liveQuery(() => db.trips.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const bagsQ = liveQuery(() => db.containers.toArray());
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const riderQ = liveQuery(() => db.settings.get('riderWeightG'));
  const rearQ = liveQuery(() => db.settings.get('rearLimitPct'));
  const tplQ = liveQuery(() => db.settings.get(TEMPLATES_KEY));
  const templates = $derived($tplQ?.value ?? []);
  const fromTemplate = $derived(templates.find((t) => t.id === trip?.templateId) ?? null);
  let saveTpl = $state(false);
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
  const stats = $derived(trip ? tripStats(trip, items, bags, bike, $riderQ?.value) : null);

  let zoneKey = $state('seat'); // the bag that is open
  let tab = $state('pack'); // phone: pack | add | check
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
        title: z.zone.name,
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

  /** Change the open trip: fn gets a plain copy and returns the changes to store. */
  async function change(fn) {
    const copy = $state.snapshot(trip);
    await db.trips.update(trip.id, fn(copy));
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

  // Mockup answer 4a: drag an item from "Not packed" onto the open bag (or a bag on the drawing).
  let bagOver = $state(false);
  function bagDragover(event) {
    if (phone.matches || !event.dataTransfer.types.includes('text/plain')) return;
    event.preventDefault();
    bagOver = true;
  }
  function bagDrop(event) {
    event.preventDefault();
    bagOver = false;
    const id = event.dataTransfer.getData('text/plain');
    if (id) add(id);
  }

  // Answer 9a: on a phone the open bag is one column, with a small title per category.
  const bagRows = $derived.by(() => {
    if (!zone) return [];
    if (!phone.matches) return zone.entries.map((e) => ({ e, head: null }));
    const order = Object.fromEntries(CATEGORIES.map((c, n) => [c.key, n]));
    const cat = (e) => itemsById[e.itemId]?.category;
    const sorted = [...zone.entries].sort((a, b) => (order[cat(a)] ?? 99) - (order[cat(b)] ?? 99));
    return sorted.map((e, n) => ({ e, head: n === 0 || cat(sorted[n - 1]) !== cat(e) ? CATEGORY[cat(e)]?.name ?? 'Other' : null }));
  });

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

  // Answer 3: a bigger bag for the same place, when the open bag is too full.
  const bigger = $derived(zone ? biggerBag(zone, bags) : null);

  // Answer 9: luggage on the front and rear wheel.
  const axle = $derived(stats ? axleLoad(stats, itemsById) : null);
  const rearPct = $derived(axle && axle.front + axle.rear ? Math.round((axle.rear / (axle.front + axle.rear)) * 100) : null);
  const rearLimit = $derived($rearQ?.value ?? 60);

  // Answer 8: litres of water, already part of the system weight through the full bottles.
  const water = $derived(trip ? waterOn(trip, itemsById) : 0);

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
        {#if fromTemplate}<span class="from">from <a href="#/pack/templates">{fromTemplate.name}</a></span>{/if}
      </p>
      <div class="pick">
        <select class="sel" aria-label="Open another trip" value={trip.id} onchange={(e) => choose(e.currentTarget.value)}>
          {#each trips as t (t.id)}<option value={t.id}>{t.title}{t.startDate ? ` · ${t.startDate}` : ''}</option>{/each}
        </select>
        {#snippet actions()}
          <button type="button" class="btn" onclick={() => (dialog = { trip: null })}>New trip</button>
          <button type="button" class="btn" onclick={() => (saveTpl = true)}>Save as template</button>
          <a class="btn" href="#/pack/templates">Templates <small>{templates.length}</small></a>
          <button type="button" class="btn" onclick={() => window.print()}>Print</button>
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
    <!-- Design answer 9b: all weights in one compact line. -->
    <section class="sys" aria-label="Weights">
      <div class="w1"><span class="lbl">System</span><b class="num">{kg(stats.systemG)}</b></div>
      <div class="w1"><span class="lbl">Gear</span><b class="num">{formatWeight(stats.gearG)}</b></div>
      <div class="w1"><span class="lbl">On me</span><b class="num">{formatWeight(stats.onMeG)}</b></div>
      <div class="w1"><span class="lbl">Bags</span><b class="num">{formatWeight(stats.bagsG)}</b></div>
      <div class="w1"><span class="lbl">Bike</span>{#if stats.missing.bike}<a class="nw" href="#/bikes">not weighed</a>{:else}<b class="num">{formatWeight(stats.bikeG)}</b>{/if}</div>
      <div class="w1"><span class="lbl">Rider</span>{#if stats.missing.rider}<a class="nw" href="#/bikes">not set</a>{:else}<b class="num">{formatWeight(stats.riderG)}</b>{/if}</div>
      {#if water}<div class="w1"><span class="lbl">Water</span><b class="num">{Math.round(water * 10) / 10} L</b></div>{/if}
      <div class="w1" title="Luggage on the front / rear wheel: {formatWeight(axle.front)} / {formatWeight(axle.rear)}"><span class="lbl">Front / rear</span><b class="num" class:warn={rearPct > rearLimit}>{rearPct != null ? `${100 - rearPct} / ${rearPct} %` : '–'}</b></div>
      <div class="w1"><span class="lbl">Items</span><b class="num">{stats.count}</b></div>
      {#if stats.unweighed}
        <span class="nw">{stats.unweighed} not weighed</span>
        {#if toWeigh}<button type="button" class="btn sm" onclick={() => (weighing = true)}>Weigh {toWeigh}</button>{/if}
      {/if}
      {#if rearPct > rearLimit}<p class="sys-note warn">{rearPct} % of the luggage is on the rear wheel (hint above {rearLimit} %).</p>{/if}
    </section>

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
      <label class="hours"><span class="lbl">Riding hours{trip.days > 1 ? ' a day' : ''}</span><input class="inp num" type="text" inputmode="decimal" value={trip.hours ?? ''} onchange={(e) => typedHours(e.currentTarget.value)} placeholder="e.g. 6" /></label>
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
          <PackStage {cards} strip={phone.matches} onpick={(k) => (zoneKey = k)} ondropitem={phone.matches ? null : addTo} label="Bags on {bike?.name ?? 'the bike'}, tap one to open it" />

          {#if zone}
            <section class="bag" class:over={bagOver} aria-labelledby="bag-h" ondragover={bagDragover} ondragleave={() => (bagOver = false)} ondrop={bagDrop}>
              <div class="bag-h">
                <h2 id="bag-h" class="title">{zoneName(zone)}</h2>
                <span class="m num">{zone.entries.length} items · {formatWeight(zone.grams)}</span>
              </div>
              {#if fill != null}
                <div class="fill" class:warn={tooFull(zone)}>
                  <div class="bar" role="img" aria-label="About {Math.round(fill)} % full">
                    <span class="in" style:width="{Math.min(100, fill)}%"></span>
                    <span class="mark" style:left="{FILL_LIMIT * 100}%" title="{FILL_LIMIT * 100} %"></span>
                  </div>
                  <span class="num">{formatVolume(zone.vol)} of {formatVolume(zone.bag.volumeL)}</span>
                </div>
              {/if}
              {#if tooFull(zone)}
                <p class="warnbox soft">
                  {zone.vol > zone.bag.volumeL ? 'Probably too full' : `Over ${FILL_LIMIT * 100} %, keep some room free`}: about {formatVolume(zone.vol)} for {formatVolume(zone.bag.volumeL)}.
                  {#if bigger}<button type="button" class="btn sm" onclick={() => setBag(zone.key, bigger.id)}>Take {bigger.name} ({formatVolume(bigger.volumeL)})</button>{/if}
                </p>
              {/if}
              {#if zone.noBag}<p class="warnbox">This trip has no bag here. Move these items or choose a bag in "Bags for this trip".</p>{/if}
              <ul class="tiles">
                {#each bagRows as { e, head } (e.itemId)}
                  {@const it = itemsById[e.itemId]}
                  {#if head}<li class="cathead" style:--c={CATEGORY[it?.category]?.color ?? 'var(--line)'}>{head}</li>{/if}
                  <li class="tile" class:open={openRow === e.itemId} draggable={!phone.matches} ondragstart={(ev) => (ev.dataTransfer.setData('text/plain', e.itemId), (ev.dataTransfer.effectAllowed = 'copyMove'))} style:--c={CATEGORY[it?.category]?.color ?? 'var(--line)'}>
                    <span class="nm">{it?.name ?? e.itemId}</span>
                    <span class="foot">
                      <span class="w num" class:nw={it?.weightG == null} title={it?.weightG == null ? 'not weighed' : undefined}>{it?.weightG == null ? '—' : formatWeight(it.weightG * (e.qty || 1))}{#if (e.qty || 1) > 1}<small> ({e.qty}×)</small>{/if}</span>
                      <span class="tb">
                        <button type="button" class="more" aria-expanded={openRow === e.itemId} aria-label="Amount or other bag for {it?.name}" onclick={() => (openRow = openRow === e.itemId ? null : e.itemId)}>⋯</button>
                        <button type="button" class="minus" aria-label="Take {it?.name} out of {zoneName(zone)}" onclick={() => removeEntry(e.itemId)}>−</button>
                      </span>
                    </span>
                    {#if openRow === e.itemId}
                      <span class="acts">
                        <span class="qty">
                          <button type="button" aria-label="One less {it?.name}" disabled={(e.qty || 1) <= 1} onclick={() => setQty(e.itemId, (e.qty || 1) - 1)}>−</button>
                          <span class="num">{e.qty || 1}×</span>
                          <button type="button" aria-label="One more {it?.name}" onclick={() => setQty(e.itemId, (e.qty || 1) + 1)}>+</button>
                        </span>
                        <select class="sel mv" aria-label="Move {it?.name} to" value={e.slot} onchange={(ev) => moveTo(e.itemId, ev.currentTarget.value)}>
                          {#each targets as t (t.key)}<option value={t.key}>{t.bag ? t.bag.name : t.zone.name}</option>{/each}
                          {#if zone.noBag}<option value={zone.key}>{zone.zone.name} (no bag)</option>{/if}
                        </select>
                      </span>
                    {/if}
                  </li>
                {:else}
                  <li class="empty">Nothing in here yet. {phone.matches ? 'Add items in the Add tab.' : 'Press + in "Not packed" or drag an item onto a bag.'}</li>
                {/each}
              </ul>
            </section>
          {/if}

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
            <h2 id="cond-h" class="title">Layers</h2>
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
  .tag.hi {
    background: var(--hi);
    border-color: var(--hi);
    color: var(--ink);
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
  .from {
    font-size: 14px;
    color: var(--ink-3);
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
  .bag.over {
    outline: 3px dashed var(--hi);
    outline-offset: 4px;
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
  /* Mockup answer 5b: the items in the open bag as tiles. */
  .tiles {
    list-style: none;
    margin: 10px 0 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 160px), 1fr));
    gap: 8px;
  }
  .tile {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 2px;
    min-height: 52px;
    padding: 6px 8px;
    background: var(--paper);
    border: 1px solid var(--line);
    border-left: 4px solid var(--c);
  }
  .tile.open {
    grid-column: span 2;
  }
  .tb {
    display: inline-flex;
    gap: 4px;
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
  .tile .nm {
    overflow-wrap: anywhere;
    line-height: 1.25;
  }
  .foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .tile .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  /* Answer 9a: a phone shows the open bag as one column of rows, with a title per category. */
  @media (max-width: 719px) {
    .tiles {
      grid-template-columns: 1fr;
      gap: 0;
      border: 1px solid var(--line);
    }
    .tile {
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      min-height: 48px;
      border: 0;
      border-bottom: 1px solid var(--line);
      border-left: 4px solid var(--c);
    }
    .tile .nm {
      flex: 1;
      min-width: 0;
    }
    .tile .foot {
      gap: 6px;
    }
    .tile .acts {
      flex-basis: 100%;
    }
    .tile.open {
      grid-column: auto;
    }
  }
  .cathead {
    padding: 6px 8px 4px;
    background: var(--paper-2, #e6ebe3);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  .tiles .empty {
    grid-column: 1 / -1;
    background: var(--paper);
    border: 1px dashed var(--ink-3);
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
  .bag {
    margin-top: 12px;
  }
  .bag-h {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 12px;
    border-bottom: 3px solid var(--ink);
    padding-bottom: 4px;
  }
  .bag-h .title {
    font-size: 28px;
  }
  .bag-h .m {
    flex: 1;
    color: var(--ink-3);
    font-size: 14px;
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
  .tile[draggable='true'] {
    cursor: grab;
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
  .x,
  .plus {
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
  .plus {
    background: var(--ink);
    color: var(--paper);
    border-color: var(--ink);
  }
  .empty {
    padding: 12px 8px;
    color: var(--ink-3);
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
