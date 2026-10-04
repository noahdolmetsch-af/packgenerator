<script>
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { phone } from '../lib/media.svelte.js';
  import { SLOTS, bagsFor, formatVolume, sortBikes } from '../lib/bikes.js';
  import { CATEGORY, CATEGORIES, formatWeight, isInventory, matches, weighQueue } from '../lib/gear.js';
  import { tripStats, readyDone, whenLabel, onTrip, zoneName, freshReady, bagItemIds, READY_DEFAULT, NIGHT_SETS, toggleSet, WX_PRESETS, RAIN, biggerBag, tooFull, FILL_LIMIT, axleLoad, slotFor } from '../lib/trips.js';
  import { RIDES, layerSuggest, layerDone, applyLayers, waterOn } from '../lib/layers.js';
  import WeighMode from '../lib/gear/WeighMode.svelte';
  import BikeStage from '../lib/bikes/BikeStage.svelte';
  import TripDialog from '../lib/pack/TripDialog.svelte';

  const tripsQ = liveQuery(() => db.trips.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const bagsQ = liveQuery(() => db.containers.toArray());
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const riderQ = liveQuery(() => db.settings.get('riderWeightG'));
  const rearQ = liveQuery(() => db.settings.get('rearLimitPct'));

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
  let dialog = $state(null); // { trip } or { trip: null }
  let q = $state('');
  let cat = $state('');
  let editBags = $state(false);
  let newCheck = $state('');
  let openRow = $state(null); // phone: the row whose actions (amount, move, remove) are shown

  const zone = $derived(stats?.zones.find((z) => z.key === zoneKey) ?? stats?.zones.find((z) => z.key === 'seat') ?? stats?.zones[0]);

  const stageZones = $derived(
    (stats?.zones ?? [])
      .filter((z) => z.zone.box)
      .map((z) => ({
        key: z.key,
        title: z.bag ? z.bag.name : z.zone.name,
        sub: `${z.entries.length} · ${formatWeight(z.grams)}${z.entries.length ? ` · ${z.packed}/${z.entries.length} ✓` : ''}`,
        box: z.zone.box,
        empty: !z.entries.length,
        active: z.key === zone?.key,
        full: z.noBag && z.entries.length > 0,
      })),
  );

  // Moving into a place: every zone of the trip.
  const targets = $derived((stats?.zones ?? []).filter((z) => !z.noBag));

  // Items that can still be added: owned or unclear, not on the trip yet.
  const candidates = $derived.by(() => {
    if (!trip) return [];
    const on = onTrip(trip);
    const asBag = bagItemIds(bags); // bags go on the bike (Bags for this trip), not into a bag
    const fixed = new Set(bike?.fixtures ?? []); // always mounted, part of the bike
    const list = items.filter((i) => isInventory(i) && !on.has(i.id) && !asBag.has(i.id) && !fixed.has(i.id) && matches(i, { q, category: cat }));
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

  const togglePacked = (itemId) => setEntries((es) => es.map((e) => (e.itemId === itemId ? { ...e, packed: !e.packed } : e)));
  const moveTo = (itemId, slot) => setEntries((es) => es.map((e) => (e.itemId === itemId ? { ...e, slot, packed: false } : e)));
  const removeEntry = (itemId) => setEntries((es) => es.filter((e) => e.itemId !== itemId));
  const setQty = (itemId, qty) => setEntries((es) => es.map((e) => (e.itemId === itemId ? { ...e, qty: Math.max(1, Math.min(20, qty)) } : e)));
  const add = (itemId) => setEntries((es) => [...es, { itemId, slot: zone.noBag ? 'body' : zone.key, qty: 1, packed: false }]);
  const tickZone = (on) => setEntries((es) => es.map((e) => (e.slot === zone.key ? { ...e, packed: on } : e)));

  const setBag = (slotKey, bagId) => change((t) => ({ setup: { ...t.setup, [slotKey]: bagId || null } }));

  // Ready check (decision 7 and 6a): edits change only this trip.
  const ready = $derived(trip?.ready ?? []);
  const readyGroups = $derived([...new Set(ready.map((r) => r.group))].map((g) => ({ group: g, rows: ready.filter((r) => r.group === g) })));
  const readyCount = $derived(ready.filter((r) => trip && readyDone(r, trip)).length + (stats && stats.count && stats.packed === stats.count ? 1 : 0));
  const readyTotal = $derived(ready.length + 1);
  function toggleReady(row) {
    if (row.itemId) {
      // An "always with me" item that is missing gets added to its usual place.
      if (!readyDone(row, trip) && itemsById[row.itemId]) {
        const slot = row.slot === 'body' || row.slot === 'mounted' || trip.setup?.[row.slot] ? row.slot : 'body';
        return setEntries((es) => [...es, { itemId: row.itemId, slot, qty: 1, packed: false }]);
      }
      return;
    }
    change((t) => ({ ready: t.ready.map((r) => (r.id === row.id ? { ...r, done: !r.done } : r)) }));
  }
  const removeReady = (id) => change((t) => ({ ready: t.ready.filter((r) => r.id !== id) }));
  function addReady(event) {
    event.preventDefault();
    const label = newCheck.trim();
    if (!label) return;
    newCheck = '';
    change((t) => ({ ready: [...t.ready, { id: `own-${Date.now().toString(36)}`, group: 'This trip', label, done: false }] }));
  }
  const resetReady = () => confirm('Use the standard ready check again for this trip?') && change(() => ({ ready: freshReady() }));
  const readyChanged = $derived(ready.map((r) => r.id).join() !== READY_DEFAULT.map((r) => r.id).join());

  // Answer 7: weigh what is on this trip, right here.
  let weighing = $state(false);
  const tripItems = $derived(trip ? items.filter((i) => onTrip(trip).has(i.id)) : []);
  const toWeigh = $derived(weighQueue(tripItems).length);

  // Answer 4: overnight sets as switches.
  const setOn = (key) => !!trip?.sets?.[key];
  const switchSet = (key) => change((t) => toggleSet(t, items, key, !t.sets?.[key]));
  const setCount = (key) => items.filter((i) => isInventory(i) && i.sets?.includes(key)).length;

  // Answer 5 and round C answer 2: weather range, kind of ride and the layers they add.
  const wx = $derived(trip?.wx ?? null);
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
  const openLayers = $derived(trip ? suggestion.filter((r) => !r.optional && !layerDone(r, trip)) : []);
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
    <header class="head">
      <div class="tt">
        <h1 class="title big">{trip.title}</h1>
        <p class="tags">
          {#if whenLabel(trip.startDate)}<span class="tag hi">{whenLabel(trip.startDate)}</span>{/if}
          <span class="tag">{trip.days} {trip.days === 1 ? 'day' : 'days'}</span>
          <span class="tag">{bike?.name ?? 'No bike'}</span>
          <button type="button" class="link" onclick={() => (dialog = { trip })}>Edit trip</button>
        </p>
      </div>
      <div class="pick">
        <label>
          <span class="lbl">Trip</span>
          <select class="sel" value={trip.id} onchange={(e) => choose(e.currentTarget.value)}>
            {#each trips as t (t.id)}<option value={t.id}>{t.title}{t.startDate ? ` · ${t.startDate}` : ''}</option>{/each}
          </select>
        </label>
        <button type="button" class="btn" onclick={() => (dialog = { trip: null })}>New trip</button>
        <button type="button" class="btn" onclick={() => window.print()}>Print list</button>
      </div>
    </header>

    <section class="sys" aria-label="Weights">
      <div class="big-w"><span class="lbl">System weight</span><b class="num">{kg(stats.systemG)}</b></div>
      <dl class="parts">
        <div><dt>Gear on the bike</dt><dd class="num">{formatWeight(stats.gearG)}</dd></div>
        <div><dt>On me</dt><dd class="num">{formatWeight(stats.onMeG)}</dd></div>
        <div><dt>Bags</dt><dd class="num">{formatWeight(stats.bagsG)}</dd></div>
        <div><dt>Bike</dt><dd class="num" class:warn={stats.missing.bike}>{stats.missing.bike ? 'not set' : formatWeight(stats.bikeG)}</dd></div>
        <div><dt>Rider</dt><dd class="num" class:warn={stats.missing.rider}>{stats.missing.rider ? 'not set' : formatWeight(stats.riderG)}</dd></div>
        {#if water}<div><dt>Of it water</dt><dd class="num">{Math.round(water * 10) / 10} L</dd></div>{/if}
        <div class="axle"><dt>Luggage front / rear</dt><dd class="num" class:warn={rearPct > rearLimit}>{formatWeight(axle.front)} / {formatWeight(axle.rear)}{#if rearPct != null}<small> ({100 - rearPct} / {rearPct} %)</small>{/if}</dd></div>
      </dl>
      <p class="sys-note">
        {stats.packed} of {stats.count} items ticked off{#if stats.unweighed}{' · '}<span class="warn">{stats.unweighed} not weighed (counted as 0)</span>
          {#if toWeigh}<button type="button" class="btn sm" onclick={() => (weighing = true)}>Weigh {toWeigh}</button>{/if}{/if}
        {#if stats.missing.bike || stats.missing.rider}{' · '}set weights on <a href="#/bikes">Bikes</a>{/if}
        {#if rearPct > rearLimit}{' · '}<span class="warn">{rearPct} % of the luggage is on the rear wheel (hint above {rearLimit} %)</span>{/if}
      </p>
    </section>

    {#if weighing}
      <WeighMode items={tripItems} onclose={() => (weighing = false)} />
    {:else}
    {#if phone.matches}
      <div class="tabs" role="tablist" aria-label="Show">
        <button type="button" role="tab" aria-selected={tab === 'pack'} onclick={() => (tab = 'pack')}>Pack <small>{stats.packed}/{stats.count}</small></button>
        <button type="button" role="tab" aria-selected={tab === 'add'} onclick={() => (tab = 'add')}>Add <small>{candidates.length}</small></button>
        <button type="button" role="tab" aria-selected={tab === 'check'} onclick={() => (tab = 'check')}>Check <small>{readyCount}/{readyTotal}</small></button>
      </div>
    {/if}

    <div class="cols">
      {#if !phone.matches || tab === 'pack' || tab === 'add'}
        <div class="left">
          <BikeStage zones={stageZones} onpick={(k) => (zoneKey = k)} label="Bags on {bike?.name ?? 'the bike'}, tap one to open it" />
          {#if phone.matches}
            <div class="chips" role="group" aria-label="Bags">
              {#each stats.zones as z (z.key)}
                <button type="button" class="chip" class:on={z.key === zone?.key} class:warn={z.noBag && z.entries.length} aria-pressed={z.key === zone?.key} onclick={() => (zoneKey = z.key)}>
                  {z.bag ? z.bag.name : z.zone.name} <small>{z.packed}/{z.entries.length}</small>
                </button>
              {/each}
            </div>
          {/if}

          {#if zone && (!phone.matches || tab === 'pack')}
            <section class="bag" aria-labelledby="bag-h">
              <div class="bag-h">
                <h2 id="bag-h" class="title">{zoneName(zone)}</h2>
                <span class="m num">{zone.entries.length} items · {formatWeight(zone.grams)}{#if zone.bag?.volumeL && zone.vol}{' · '}<span class:warn={tooFull(zone)}>about {formatVolume(zone.vol)} of {formatVolume(zone.bag.volumeL)}</span>{/if}</span>
                {#if zone.entries.length}
                  <button type="button" class="link" onclick={() => tickZone(zone.packed < zone.entries.length)}>{zone.packed < zone.entries.length ? 'Tick all' : 'Untick all'}</button>
                {/if}
              </div>
              {#if tooFull(zone)}
                <p class="warnbox soft">
                  {zone.vol > zone.bag.volumeL ? 'Probably too full' : `Over ${FILL_LIMIT * 100} %, keep some room free`}: about {formatVolume(zone.vol)} for {formatVolume(zone.bag.volumeL)}.
                  {#if bigger}<button type="button" class="btn sm" onclick={() => setBag(zone.key, bigger.id)}>Take {bigger.name} ({formatVolume(bigger.volumeL)})</button>{/if}
                </p>
              {/if}
              {#if zone.noBag}<p class="warnbox">This trip has no bag here. Move these items or choose a bag below.</p>{/if}
              <ul class="entries">
                {#each zone.entries as e (e.itemId)}
                  {@const it = itemsById[e.itemId]}
                  <li class:done={e.packed}>
                    <label class="ck">
                      <input type="checkbox" checked={e.packed} onchange={() => togglePacked(e.itemId)} />
                      <span class="nm">{it?.name ?? e.itemId}</span>
                    </label>
                    <span class="w num" class:warn={it?.weightG == null}>{it?.weightG == null ? 'not weighed' : formatWeight(it.weightG * (e.qty || 1))}{#if (e.qty || 1) > 1}<small> ({e.qty}×)</small>{/if}</span>
                    {#if phone.matches}
                      <button type="button" class="more" aria-expanded={openRow === e.itemId} aria-label="Change {it?.name}" onclick={() => (openRow = openRow === e.itemId ? null : e.itemId)}>⋯</button>
                    {/if}
                    {#if !phone.matches || openRow === e.itemId}
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
                      <button type="button" class="x" aria-label="Take {it?.name} off the trip" onclick={() => removeEntry(e.itemId)}>×</button>
                    </span>
                    {/if}
                  </li>
                {:else}
                  <li class="empty">Nothing in here yet. Add items{phone.matches ? ' in the Add tab' : ' on the right'}.</li>
                {/each}
              </ul>
            </section>

            <details class="setup" bind:open={editBags}>
              <summary>Bags for this trip</summary>
              <p class="hint">Starts with the bags of {bike?.name ?? 'the bike'}. Changes here only count for this trip.</p>
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
            </details>
          {/if}
        </div>
      {/if}

      <div class="right">
        {#if !phone.matches || tab === 'add'}
          <section class="cond" aria-labelledby="cond-h">
            <h2 id="cond-h" class="title">Ride, night and weather</h2>
            <div class="wxin">
              <label><span class="lbl">Kind of ride</span>
                <select class="sel" value={trip.ride ?? ''} onchange={(e) => change(() => ({ ride: e.currentTarget.value || null }))}>
                  <option value="">Choose</option>
                  {#each RIDES as r (r.key)}<option value={r.key}>{r.name}</option>{/each}
                </select>
              </label>
              <label><span class="lbl">Riding hours{trip.days > 1 ? ' a day' : ''}</span><input class="inp num" type="text" inputmode="decimal" value={trip.hours ?? ''} onchange={(e) => typedHours(e.currentTarget.value)} placeholder="e.g. 6" /></label>
            </div>
            <div class="sets" role="group" aria-label="Overnight sets">
              {#each NIGHT_SETS as ns (ns.key)}
                <button type="button" class="toggle" aria-pressed={setOn(ns.key)} onclick={() => switchSet(ns.key)} disabled={!setCount(ns.key)} title={setCount(ns.key) ? '' : 'No items in this set yet. Tag them in Gear.'}>
                  {ns.name} <small>{setCount(ns.key)}</small>
                </button>
              {/each}
            </div>
            <div class="wx">
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
              {#if suggestion.length}
                <div class="sugg">
                  <p class="sugg-h"><b>Layers for this ride</b>{#if openLayers.length}<button type="button" class="btn sm hi" onclick={addAllLayers}>Add all {openLayers.length}</button>{:else}<span class="ok">All set</span>{/if}</p>
                  <ul>
                    {#each suggestion as r (r.id)}
                      <li>
                        <span class="wt">{r.why}</span>
                        <span class="nm">{itemsById[r.id]?.name}{#if r.qty > 1}<small> × {r.qty}</small>{/if}</span>
                        {#if layerDone(r, trip)}<span class="ok">{r.place === 'wear' ? 'On me' : 'Packed'}</span>{:else}<button type="button" class="btn sm" onclick={() => takeLayer(r)}>{r.place === 'wear' ? 'Wear' : 'Pack'}</button>{/if}
                      </li>
                    {/each}
                  </ul>
                </div>
              {:else if trip.ride || (wx?.min != null && wx?.max != null) || wx?.rain === 'showers' || wx?.rain === 'rain'}
                <p class="hint">Nothing to add. Set layers on your items in Gear (Edit → Layers).</p>
              {/if}
            </div>
          </section>
          <section class="add" aria-labelledby="add-h">
            <h2 id="add-h" class="title">Add to {zone ? (zone.noBag ? 'On me' : zone.bag ? zone.bag.name : zone.zone.name) : 'the trip'}</h2>
            <p class="hint">Choose a bag on the drawing first, then add what goes in it.</p>
            <div class="filters">
              <input class="inp" type="search" placeholder="Search your gear" bind:value={q} aria-label="Search your gear" />
              <select class="sel" bind:value={cat} aria-label="Category">
                <option value="">All categories</option>
                {#each CATEGORIES as c (c.key)}<option value={c.key}>{c.name}</option>{/each}
              </select>
            </div>
            <ul class="cands">
              {#each candidates.slice(0, 60) as i (i.id)}
                <li>
                  <span class="sw" style:background={CATEGORY[i.category]?.color}></span>
                  <span class="nm">{i.name}{#if i.role === 'standard' || i.role === 'worn'}<small class="pill">standard</small>{/if}</span>
                  <span class="w num">{i.weightG == null ? '–' : formatWeight(i.weightG)}</span>
                  <button type="button" class="plus" aria-label="Add {i.name}" onclick={() => add(i.id)}>+</button>
                </li>
              {:else}
                <li class="empty">{q || cat ? 'Nothing matches.' : 'Everything you own is on this trip.'}</li>
              {/each}
            </ul>
            {#if candidates.length > 60}<p class="hint">{candidates.length - 60} more: search to narrow the list.</p>{/if}
          </section>
        {/if}

        {#if !phone.matches || tab === 'check'}
          <section class="ready" aria-labelledby="ready-h">
            <div class="ready-h">
              <h2 id="ready-h" class="title">Ready check</h2>
              <span class="num m">{readyCount} / {readyTotal}</span>
            </div>
            <ul>
              <li class="auto" class:done={stats.count && stats.packed === stats.count}>
                <span class="box" aria-hidden="true">{stats.count && stats.packed === stats.count ? '✓' : ''}</span>
                <span>{stats.packed === stats.count ? 'Every bag ticked off' : `${stats.count - stats.packed} items not ticked off yet`}</span>
              </li>
            </ul>
            {#each readyGroups as g (g.group)}
              <h3>{g.group}</h3>
              <ul>
                {#each g.rows as r (r.id)}
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
            {/each}
            <form class="addcheck" onsubmit={addReady}>
              <input class="inp" bind:value={newCheck} placeholder="Add a check for this trip" aria-label="Add a check for this trip" />
              <button type="submit" class="btn">Add</button>
            </form>
            {#if readyChanged}<button type="button" class="link" onclick={resetReady}>Back to the standard list</button>{/if}
          </section>
        {/if}
      </div>
    </div>
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
  <TripDialog trip={dialog.trip} {trips} {bikes} {items} defaultBikeId={trip?.bikeId} onclose={() => (dialog = null)} oncreated={choose} />
{/if}

<style>
  .big {
    font-size: clamp(48px, 10vw, 88px);
    line-height: 0.9;
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: end;
    gap: 12px 24px;
    margin-bottom: 14px;
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 8px 0 0;
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
    align-items: end;
    flex-wrap: wrap;
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
    align-items: end;
    gap: 8px 28px;
    padding: 12px 0;
    border-top: 3px solid var(--ink);
    border-bottom: 1px solid var(--line);
    margin-bottom: 14px;
  }
  .big-w {
    display: flex;
    flex-direction: column;
  }
  .big-w b {
    font: 900 44px/1 var(--font-title);
  }
  .parts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 22px;
    margin: 0;
  }
  .parts div {
    display: flex;
    flex-direction: column;
  }
  .parts dt {
    font-size: 12px;
    color: var(--ink-3);
  }
  .parts dd {
    margin: 0;
    font-weight: 700;
  }
  .sys-note {
    flex-basis: 100%;
    margin: 0;
    font-size: 14px;
    color: var(--ink-2);
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
  .cond {
    margin-bottom: 24px;
  }
  .cond .title {
    font-size: 28px;
    border-bottom: 3px solid var(--ink);
    margin-bottom: 8px;
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
  .wxin {
    display: grid;
    grid-template-columns: 1fr 1fr 1.4fr;
    align-items: end;
    gap: 8px;
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
  .sugg li {
    display: grid;
    grid-template-columns: 92px 1fr auto;
    gap: 8px;
    align-items: center;
    padding: 4px 0;
    border-top: 1px solid var(--line);
  }
  .wt {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
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
  .cols {
    display: grid;
    gap: 20px;
  }
  @media (min-width: 1000px) {
    .cols {
      grid-template-columns: 1.35fr 1fr;
      align-items: start;
    }
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 10px 0;
  }
  .chip {
    border: 1.5px solid var(--ink-3);
    background: var(--paper);
    border-radius: 999px;
    padding: 5px 10px;
    font: 600 14px var(--font-body);
    color: var(--ink);
  }
  .chip.on {
    border-color: var(--hi);
    background: var(--hi-soft);
  }
  .chip.warn {
    border-color: #c0392b;
  }
  .chip small {
    color: var(--ink-3);
    font-weight: 400;
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
  .entries,
  .cands,
  .ready ul,
  .slots {
    list-style: none;
    margin: 0;
    padding: 0;
    background: var(--paper);
  }
  .entries li {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 4px 10px;
    align-items: center;
    padding: 8px;
    border-bottom: 1px solid var(--line);
  }
  .entries li.done .nm {
    color: var(--ink-3);
    text-decoration: line-through;
  }
  .entries .acts {
    grid-column: 1 / -1;
    display: flex;
    gap: 8px;
    align-items: center;
  }
  @media (min-width: 720px) {
    .entries li {
      grid-template-columns: 1fr auto auto;
    }
    .entries .acts {
      grid-column: 3;
      grid-row: 1;
    }
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
  .w.warn {
    font-weight: 600;
    font-size: 13px;
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
  .add .title,
  .ready .title {
    font-size: 28px;
  }
  .add {
    margin-bottom: 24px;
  }
  .filters {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    margin-bottom: 8px;
  }
  .cands {
    max-height: 480px;
    overflow: auto;
    border-top: 3px solid var(--ink);
  }
  .cands li {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    gap: 8px;
    align-items: center;
    padding: 6px 8px;
    border-bottom: 1px solid var(--line);
  }
  .pill {
    margin-left: 6px;
    padding: 0 5px;
    border: 1px solid var(--ink-3);
    border-radius: 999px;
    font-size: 11px;
    color: var(--ink-3);
  }
  .ready-h {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    border-bottom: 3px solid var(--ink);
  }
  .ready h3 {
    margin: 12px 0 4px;
    font-size: 12px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-3);
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
  .ready .auto .box {
    width: 22px;
    height: 22px;
    border: 2px solid var(--ink-3);
    border-radius: 3px;
    display: grid;
    place-items: center;
    font-size: 14px;
    flex: none;
  }
  .addcheck {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    margin: 12px 0 8px;
  }
</style>
