<script>
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { SLOTS, SLOT, FIXED_ZONES, sortBikes, bikeSetup, bagsFor, containerWeight, formatVolume } from '../lib/bikes.js';
  import { formatWeight, parseGrams } from '../lib/gear.js';
  import BikeStage from '../lib/bikes/BikeStage.svelte';
  import BagDialog from '../lib/bikes/BagDialog.svelte';

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const bagsQ = liveQuery(() => db.containers.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const riderQ = liveQuery(() => db.settings.get('riderWeightG'));

  const bikes = $derived(sortBikes($bikesQ ?? []));
  const bags = $derived($bagsQ ?? []);
  const items = $derived($itemsQ ?? []);
  const itemsById = $derived(Object.fromEntries(items.map((i) => [i.id, i])));

  let pickedId = $state(null);
  const bike = $derived(bikes.find((b) => b.id === pickedId) ?? bikes[0]);
  const setup = $derived(bike ? bikeSetup(bike, bags, items) : null);

  let editMounts = $state(false); // show all places and let the user switch mounts on and off
  let activeSlot = $state(null);
  let dialog = $state(null); // { bag } or { bag: null, slot }
  let message = $state('');

  // Boxes on the drawing: every place this bike has (in edit mode: all places).
  const zones = $derived.by(() => {
    if (!bike) return [];
    const fixed = FIXED_ZONES.map((z) => ({ key: z.key, title: z.name, sub: '', box: z.box, empty: false, active: false }));
    const slots = SLOTS.filter((s) => editMounts || bike.slots.includes(s.key)).map((s) => {
      const has = bike.slots.includes(s.key);
      const bag = bags.find((b) => b.id === bike.setup?.[s.key]);
      return {
        key: s.key,
        title: has ? (bag ? bag.name : `+ ${s.name}`) : `${s.name} (no mount)`,
        sub: has && bag ? formatVolume(bag.volumeL) : '',
        box: s.box,
        empty: !has || !bag,
        active: activeSlot === s.key,
      };
    });
    return [...fixed, ...slots];
  });

  function pick(key) {
    if (!SLOT[key]) return;
    if (editMounts) return toggleMount(key);
    activeSlot = key;
    document.getElementById(`slot-${key}`)?.focus();
  }

  async function setBag(slotKey, bagId) {
    await db.bikes.update(bike.id, { [`setup.${slotKey}`]: bagId || null });
  }

  async function toggleMount(slotKey) {
    const has = bike.slots.includes(slotKey);
    const slots = has ? bike.slots.filter((k) => k !== slotKey) : [...bike.slots, slotKey];
    const changes = { slots };
    if (has) changes[`setup.${slotKey}`] = null; // no mount, no bag
    await db.bikes.update(bike.id, changes);
  }

  async function saveBikeWeight(event) {
    const text = event.currentTarget.value.trim();
    if (text === '') return db.bikes.update(bike.id, { weightG: null });
    const g = parseGrams(text);
    if (g == null) return (message = 'Type the bike weight in whole grams, e.g. 13000.');
    message = '';
    await db.bikes.update(bike.id, { weightG: g });
  }

  async function saveRider(event) {
    const text = event.currentTarget.value.trim();
    const g = text === '' ? null : Math.round(Number(text.replace(',', '.')) * 1000);
    if (text !== '' && !(g >= 20000 && g <= 200000)) return (message = 'Type your weight in kilograms, e.g. 64.');
    message = '';
    await db.settings.put({ key: 'riderWeightG', value: g });
  }

  const onBikes = (bagId) => bikes.filter((b) => Object.values(b.setup ?? {}).includes(bagId)).map((b) => b.name);
  const bagsBySlot = $derived(SLOTS.map((s) => ({ slot: s, list: bagsFor(s.key, bags) })).filter((g) => g.list.length));
</script>

<div class="bikes">
  <header class="head">
    <h1 class="title">Bikes</h1>
    <label class="rider">
      <span class="lbl">Rider weight (kg)</span>
      <input class="inp num" type="text" inputmode="decimal" value={$riderQ?.value ? $riderQ.value / 1000 : ''} onchange={saveRider} placeholder="e.g. 64" />
    </label>
  </header>

  {#if !bikes.length && $bikesQ}
    <p class="card">No bikes yet. Import your data on the <a href="#/">start page</a> (Your data → Import backup).</p>
  {:else if bike}
    <div class="tabs" role="tablist" aria-label="Bike">
      {#each bikes as b (b.id)}
        <button type="button" role="tab" aria-selected={b.id === bike.id} onclick={() => ((pickedId = b.id), (activeSlot = null))}>{b.name}</button>
      {/each}
    </div>

    <section class="bike-card" aria-labelledby="bike-h">
      <div class="bh">
        <div>
          <h2 id="bike-h" class="title">{bike.name}</h2>
          <p class="sub">{bike.type ?? ''}{bike.use ? ` · ${bike.use}` : ''}</p>
        </div>
        <div class="kpis">
          <label>
            <span class="lbl">Bike weight (g)</span>
            {#key bike.id}<input class="inp num" type="text" inputmode="numeric" value={bike.weightG ?? ''} onchange={saveBikeWeight} placeholder="not weighed" />{/key}
          </label>
          <div><span class="lbl">Bags</span><b class="num">{setup.bagCount} · {formatVolume(setup.volumeL)}</b></div>
          <div>
            <span class="lbl">Bags weigh</span><b class="num">{formatWeight(setup.bagsG)}</b>
            {#if setup.unweighed}<small class="nw">+ {setup.unweighed} not weighed</small>{/if}
          </div>
        </div>
      </div>

      <div class="layout">
      <div class="left">
      <BikeStage {zones} onpick={pick} label="{bike.name} with its bags" />

      <div class="mounts">
        <button type="button" class="btn" class:ink={editMounts} aria-pressed={editMounts} onclick={() => (editMounts = !editMounts)}>
          {editMounts ? 'Done with mounts' : 'Edit mounts'}
        </button>
        <span class="hint">{editMounts ? 'Tap a place on the drawing to switch its mount on or off.' : 'Choose which bag sits where. Pack starts with this setup.'}</span>
      </div>
      </div>

      <ul class="slots">
        {#each SLOTS.filter((s) => bike.slots.includes(s.key)) as s (s.key)}
          {@const bag = bags.find((b) => b.id === bike.setup?.[s.key])}
          {@const options = bagsFor(s.key, bags)}
          <li class:active={activeSlot === s.key}>
            <label for="slot-{s.key}"><b>{s.name}</b><small>{s.where}</small></label>
            <select id="slot-{s.key}" class="sel" value={bike.setup?.[s.key] ?? ''} onchange={(e) => setBag(s.key, e.currentTarget.value)} onfocus={() => (activeSlot = s.key)}>
              <option value="">No bag</option>
              {#each options as o (o.id)}<option value={o.id}>{o.name}{o.volumeL ? ` · ${formatVolume(o.volumeL)}` : ''}</option>{/each}
            </select>
            <span class="w num" class:muted={bag && containerWeight(bag, itemsById) == null}>{bag ? formatWeight(containerWeight(bag, itemsById)) : ''}</span>
          </li>
        {/each}
      </ul>
      </div>
      {#if message}<p class="msg" role="status">{message}</p>{/if}
    </section>
  {/if}

  <section class="baglist" aria-labelledby="bags-h">
    <div class="bl-h">
      <h2 id="bags-h" class="title">Your bags</h2>
      <button type="button" class="btn hi" onclick={() => (dialog = { bag: null })}>Add bag</button>
    </div>
    <p class="sub">Every bag and cage that can go on a bike. The weight comes from the linked gear item.</p>
    {#each bagsBySlot as g (g.slot.key)}
      <h3 class="slot-h">{g.slot.name} <small>{g.slot.where}</small></h3>
      <ul class="rows">
        {#each g.list as b (b.id)}
          <li>
            <button type="button" onclick={() => (dialog = { bag: b })}>
              <span class="nm">{b.name}</span>
              <span class="bg">{onBikes(b.id).join(', ') || 'Not on a bike'}</span>
              <span class="v num">{formatVolume(b.volumeL)}</span>
              <span class="w num" class:nw={containerWeight(b, itemsById) == null}>{formatWeight(containerWeight(b, itemsById))}</span>
            </button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="card">No bags yet. Import your data, or add a bag.</p>
    {/each}
  </section>
</div>

{#if dialog}
  <BagDialog bag={dialog.bag} {items} {bags} {bikes} onclose={() => (dialog = null)} />
{/if}

<style>
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    justify-content: space-between;
    gap: 12px 24px;
    margin-bottom: 18px;
  }
  .head .title {
    font-size: clamp(56px, 12vw, 88px);
  }
  .rider .inp {
    width: 110px;
  }
  .tabs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border: 2px solid var(--ink);
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 14px;
  }
  .tabs button {
    border: 0;
    border-right: 2px solid var(--ink);
    background: var(--paper);
    padding: 10px 4px;
    font: 700 15px var(--font-body);
    color: var(--ink);
    cursor: pointer;
  }
  .tabs button:last-child {
    border-right: 0;
  }
  .tabs button[aria-selected='true'] {
    background: var(--ink);
    color: var(--paper);
  }
  @media (max-width: 479px) {
    .tabs {
      grid-template-columns: 1fr 1fr;
    }
    .tabs button:nth-child(2) {
      border-right: 0;
    }
    .tabs button:nth-child(-n + 2) {
      border-bottom: 2px solid var(--ink);
    }
  }
  .bike-card {
    margin-bottom: 32px;
  }
  .bh {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: end;
    gap: 10px 24px;
    margin-bottom: 12px;
  }
  .bh .title {
    font-size: 40px;
  }
  .sub {
    margin: 2px 0 0;
    color: var(--ink-3);
    font-size: 14px;
  }
  .kpis {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 22px;
    align-items: end;
  }
  .kpis div,
  .kpis label {
    display: flex;
    flex-direction: column;
  }
  .kpis b {
    font-family: var(--font-title);
    font-weight: 800;
    font-size: 26px;
    line-height: 1.1;
  }
  .kpis .inp {
    width: 130px;
  }
  @media (min-width: 1000px) {
    .layout {
      display: grid;
      grid-template-columns: 1.3fr 1fr;
      gap: 20px;
      align-items: start;
    }
    .left {
      position: sticky;
      top: 64px;
    }
    .slots li {
      grid-template-columns: 1fr 90px;
    }
    .slots .sel {
      grid-column: 1 / -1;
      grid-row: 2;
    }
  }
  .mounts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 14px;
    margin: 12px 0;
  }
  .hint {
    color: var(--ink-3);
    font-size: 14px;
  }
  .slots {
    list-style: none;
    margin: 0;
    padding: 0;
    background: var(--paper);
    border-top: 3px solid var(--ink);
  }
  .slots li {
    display: grid;
    grid-template-columns: 1fr minmax(0, 1.4fr) 80px;
    gap: 6px 12px;
    align-items: center;
    padding: 8px;
    border-bottom: 1px solid var(--line);
  }
  .slots li.active {
    background: var(--hi-soft);
  }
  .slots label {
    display: flex;
    flex-direction: column;
  }
  .slots small {
    color: var(--ink-3);
    font-size: 13px;
  }
  .slots .sel {
    width: 100%;
  }
  .w {
    text-align: right;
    font-weight: 700;
  }
  .muted,
  .nw {
    color: var(--hi);
    font-weight: 600;
    font-size: 13px;
  }
  @media (max-width: 479px) {
    .slots li {
      grid-template-columns: 1fr 90px;
    }
    .slots .sel {
      grid-column: 1 / -1;
      grid-row: 2;
    }
  }
  .msg {
    font-weight: 700;
  }
  .bl-h {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  .bl-h .title {
    font-size: 32px;
  }
  .slot-h {
    margin: 18px 0 0;
    padding-bottom: 4px;
    border-bottom: 3px solid var(--ink);
    font: 800 22px var(--font-title);
    text-transform: uppercase;
  }
  .slot-h small {
    font: 400 13px var(--font-body);
    text-transform: none;
    color: var(--ink-3);
    margin-left: 6px;
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
    background: var(--paper);
  }
  .rows button {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 2px 12px;
    width: 100%;
    text-align: left;
    background: none;
    border: 0;
    border-bottom: 1px solid var(--line);
    padding: 9px 8px;
    font: inherit;
    color: inherit;
    cursor: pointer;
  }
  @media (hover: hover) {
    .rows button:hover {
      background: var(--hi-soft);
    }
  }
  .rows .bg {
    grid-column: 1;
    grid-row: 2;
    font-size: 13px;
    color: var(--ink-3);
  }
  .rows .v {
    grid-row: 1 / span 2;
    align-self: center;
    color: var(--ink-2);
  }
  .rows .w {
    grid-row: 1 / span 2;
    align-self: center;
    min-width: 80px;
  }
</style>
