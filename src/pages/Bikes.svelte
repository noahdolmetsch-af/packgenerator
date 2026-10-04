<script>
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { SLOTS, SLOT, FIXED_ZONES, sortBikes, bikeSetup, bagsFor, containerWeight, formatVolume } from '../lib/bikes.js';
  import { formatWeight, parseGrams } from '../lib/gear.js';
  import BikeStage from '../lib/bikes/BikeStage.svelte';
  import BagDialog from '../lib/bikes/BagDialog.svelte';
  import BikeDialog from '../lib/bikes/BikeDialog.svelte';
  import BikesNav from '../lib/care/BikesNav.svelte';
  import { phone } from '../lib/media.svelte.js';
  import { nextTrip } from '../lib/debrief.js';
  import { bikePhotos, shrinkImage } from '../lib/photo.js';
  import Lightbox from '../lib/ui/Lightbox.svelte';

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const bagsQ = liveQuery(() => db.containers.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const riderQ = liveQuery(() => db.settings.get('riderWeightG'));
  const rearQ = liveQuery(() => db.settings.get('rearLimitPct'));
  const tripsQ = liveQuery(() => db.trips.toArray());
  const photosQ = liveQuery(() => db.photos.toArray());

  const bikes = $derived(sortBikes($bikesQ ?? []));
  const bags = $derived($bagsQ ?? []);
  const items = $derived($itemsQ ?? []);
  const itemsById = $derived(Object.fromEntries(items.map((i) => [i.id, i])));

  let pickedId = $state(null);
  const bike = $derived(bikes.find((b) => b.id === pickedId) ?? bikes[0]);
  const setup = $derived(bike ? bikeSetup(bike, bags, items) : null);
  // Design audit B4: the bike's bags are the standard; the next trip on it may use others.
  const tripOn = $derived(bike ? nextTrip(($tripsQ ?? []).filter((t) => t.bikeId === bike.id)) : null);
  const tripBag = (key) => (tripOn && (tripOn.setup?.[key] ?? null) !== (bike.setup?.[key] ?? null) ? bags.find((b) => b.id === tripOn.setup?.[key]) ?? { name: 'no bag', none: true } : null);

  /* ---------- setup photos (Noah, 4.10.2026, answers 1a-6a) ---------- */
  const gallery = $derived(bikePhotos(bike, $photosQ ?? []));
  const bikeTrips = $derived(bike ? ($tripsQ ?? []).filter((t) => t.bikeId === bike.id).sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? '')) : []);
  const tripTitle = (id) => ($tripsQ ?? []).find((t) => t.id === id)?.title ?? null;
  let shown = $state(null); // index in the gallery
  let photoMsg = $state('');
  let adding = $state(false);
  async function addPhotos(event) {
    const files = [...event.currentTarget.files];
    event.currentTarget.value = '';
    adding = true;
    photoMsg = '';
    try {
      for (const [n, file] of files.entries()) {
        const data = await shrinkImage(file);
        const id = `photo-${Date.now().toString(36)}-${n}`;
        await db.photos.put({ id, bikeId: bike.id, name: file.name.replace(/\.[^.]+$/, '').slice(0, 40) || 'Setup', tripId: null, main: !gallery.length && n === 0, data, addedAt: new Date().toISOString() });
      }
    } catch (err) {
      photoMsg = err.message || 'This photo could not be read.';
    } finally {
      adding = false;
    }
  }
  /** The photo shown pale behind the bags in Pack. The old bike photo is main when no other one is. */
  async function setMain(p) {
    const mine = ($photosQ ?? []).filter((x) => x.bikeId === bike.id);
    await db.transaction('rw', db.photos, async () => {
      for (const x of mine) await db.photos.update(x.id, { main: x.id === p.id });
    });
  }
  async function rename(p) {
    const name = prompt('Name of this photo, e.g. "Hope 2026"', p.name);
    if (name?.trim()) await db.photos.update(p.id, { name: name.trim().slice(0, 60) });
  }
  const setTrip = (p, tripId) => db.photos.update(p.id, { tripId: tripId || null });
  async function removePhoto(p) {
    if (!confirm(`Remove the photo "${p.name}"?`)) return;
    if (p.stored) await db.photos.delete(p.id);
    else await db.bikes.update(bike.id, { photo: null });
    if (shown != null && shown >= gallery.length - 1) shown = gallery.length > 1 ? gallery.length - 2 : null;
  }

  let editMounts = $state(false); // show all places and let the user switch mounts on and off
  let activeSlot = $state(null);
  let dialog = $state(null); // { bag } or { bag: null, slot }
  let bikeDialog = $state(null); // { bike } or { bike: null }
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

  const setFixtures = (fixtures) => db.bikes.update(bike.id, { fixtures });

  async function saveBikeWeight(event) {
    const text = event.currentTarget.value.trim();
    if (text === '') return db.bikes.update(bike.id, { weightG: null });
    const g = parseGrams(text);
    if (g == null) return (message = 'Type the bike weight in whole grams, e.g. 13000.');
    message = '';
    // A weighed value replaces an estimate (Strava, logbook), so its note goes.
    await db.bikes.update(bike.id, { weightG: g, weightNote: '' });
  }

  async function saveRider(event) {
    const text = event.currentTarget.value.trim();
    const g = text === '' ? null : Math.round(Number(text.replace(',', '.')) * 1000);
    if (text !== '' && !(g >= 20000 && g <= 200000)) return (message = 'Type your weight in kilograms, e.g. 64.');
    message = '';
    await db.settings.put({ key: 'riderWeightG', value: g });
  }

  // Answer 5 (round C): Pack shows a hint when more than this share of the luggage sits on the rear wheel.
  async function saveRear(event) {
    const text = event.currentTarget.value.trim();
    const n = text === '' ? null : Math.round(Number(text));
    if (text !== '' && !(n >= 50 && n <= 90)) return (message = 'Rear wheel hint: a percentage from 50 to 90.');
    message = '';
    await db.settings.put({ key: 'rearLimitPct', value: n });
  }

  const onBikes = (bagId) => bikes.filter((b) => Object.values(b.setup ?? {}).includes(bagId)).map((b) => b.name);
  const bagsBySlot = $derived(SLOTS.map((s) => ({ slot: s, list: bagsFor(s.key, bags) })).filter((g) => g.list.length));
</script>

<div class="bikes">
  <!-- Design audit B3, B5: title first, then Setup / Care; settings fold away. -->
  <header class="head">
    <h1 class="title">Bikes</h1>
    <BikesNav current="setup" />
  </header>
  <details class="settings">
    <summary><span class="lbl">Settings</span> Rider {$riderQ?.value ? formatWeight($riderQ.value) : 'not set'} · rear wheel hint over {$rearQ?.value ?? 60} %</summary>
    <div class="set-in">
      <label class="rider">
        <span class="lbl">Rider weight (kg)</span>
        <input class="inp num" type="text" inputmode="decimal" value={$riderQ?.value ? $riderQ.value / 1000 : ''} onchange={saveRider} placeholder="e.g. 64" />
      </label>
      <label class="rider">
        <span class="lbl">Hint when rear is over (%)</span>
        <input class="inp num" type="text" inputmode="numeric" value={$rearQ?.value ?? ''} onchange={saveRear} placeholder="60" />
      </label>
    </div>
  </details>

  {#if !bikes.length && $bikesQ}
    <p class="card">No bikes yet. Import your data on the <a href="#/">start page</a> (Your data → Import backup).</p>
  {:else if bike}
    <div class="tabs" role="tablist" aria-label="Bike">
      {#each bikes as b (b.id)}
        <button type="button" role="tab" aria-selected={b.id === bike.id} onclick={() => ((pickedId = b.id), (activeSlot = null))}>{b.name}</button>
      {/each}
    </div>
    <p class="addbike"><button type="button" class="link" onclick={() => (bikeDialog = { bike: null })}>Add bike</button></p>

    <section class="bike-card" aria-labelledby="bike-h">
      <div class="bh">
        <div>
          <h2 id="bike-h" class="title">{bike.name}</h2>
          <p class="sub">{bike.type ?? ''}{bike.use ? ` · ${bike.use}` : ''} <button type="button" class="link" onclick={() => (bikeDialog = { bike })}>Edit</button></p>
          <p class="fix">
            <span class="lbl">Always mounted</span>
            {#each bike.fixtures ?? [] as f (f)}
              <span class="chip">{itemsById[f]?.name ?? f}<button type="button" aria-label="Remove {itemsById[f]?.name ?? f}" onclick={() => setFixtures((bike.fixtures ?? []).filter((x) => x !== f))}>×</button></span>
            {:else}
              <span class="sub">nothing</span>
            {/each}
            <select class="sel mini" aria-label="Add something that is always mounted" value="" onchange={(e) => { if (e.currentTarget.value) setFixtures([...(bike.fixtures ?? []), e.currentTarget.value]); e.currentTarget.value = ''; }}>
              <option value="">+ add</option>
              {#each items.filter((i) => i.category === 'bike' && !(bike.fixtures ?? []).includes(i.id) && i.ownership !== 'gone') as i (i.id)}<option value={i.id}>{i.name}</option>{/each}
            </select>
          </p>
        </div>
        <div class="kpis">
          <label>
            <span class="lbl">Bike weight (g)</span>
            {#key bike.id}<input class="inp num" type="text" inputmode="numeric" value={bike.weightG ?? ''} onchange={saveBikeWeight} placeholder="not weighed" />{/key}
            {#if bike.weightNote}<small class="hintw">{bike.weightNote}</small>{/if}
            <small class="hintw">Without bags, with Garmin mount, Quad Lock and bottle cages.</small>
          </label>
          <div><span class="lbl">Bags</span><b class="num">{setup.bagCount} · {formatVolume(setup.volumeL)}</b></div>
          <div>
            <span class="lbl">Bags weigh</span><b class="num">{formatWeight(setup.bagsG)}</b>
            {#if setup.unweighed}<small class="nw">+ {setup.unweighed} not weighed</small>{/if}
          </div>
        </div>
      </div>

      <div class="gal" aria-label="Photos of the {bike.name}">
        {#each gallery as p, n (p.id)}
          <button type="button" class="th" class:main={p.main} onclick={() => (shown = n)} aria-label="Open photo {p.name}{p.main ? ', shown in Pack' : ''}">
            <img src={p.src} alt="" loading="lazy" />
            <span>{p.name}</span>
          </button>
        {/each}
        <label class="th add">{adding ? 'Reading…' : '+ Photo'}<input type="file" accept="image/*" multiple onchange={addPhotos} hidden disabled={adding} /></label>
        {#if photoMsg}<p class="err" role="alert">{photoMsg}</p>{/if}
      </div>

      <div class="layout">
      <div class="left">
      <!-- Design audit B1: on a phone the drawing is too small to read; it opens on request. -->
      <details class="onbike" open={!phone.matches || editMounts}>
        <summary>Show on the bike</summary>
        <BikeStage {zones} onpick={pick} label="{bike.name} with its bags" />
      </details>

      <div class="mounts">
        <button type="button" class="btn" class:ink={editMounts} aria-pressed={editMounts} onclick={() => (editMounts = !editMounts)}>
          {editMounts ? 'Done with mounts' : 'Edit mounts'}
        </button>
        <span class="hint">{editMounts ? 'Tap a place on the drawing to switch its mount on or off.' : 'Choose which bag sits where. Pack starts with this setup.'}</span>
      </div>
      </div>

      <div class="right">
      <p class="std"><b>Standard bags</b> · Pack starts every new trip on this bike with them; a trip can change its own.</p>
      <!-- Design audit B2: the places as a grid of small cards; places without a bag stay small and dashed. -->
      <ul class="slots">
        {#each SLOTS.filter((s) => bike.slots.includes(s.key)) as s (s.key)}
          {@const bag = bags.find((b) => b.id === bike.setup?.[s.key])}
          {@const options = bagsFor(s.key, bags)}
          {@const other = tripBag(s.key)}
          <li class:active={activeSlot === s.key} class:empty={!bag}>
            <label for="slot-{s.key}"><b>{s.name}</b><small>{s.where}</small></label>
            <span class="w num" class:muted={bag && containerWeight(bag, itemsById) == null}>{bag ? formatWeight(containerWeight(bag, itemsById)) : ''}</span>
            <select id="slot-{s.key}" class="sel" value={bike.setup?.[s.key] ?? ''} onchange={(e) => setBag(s.key, e.currentTarget.value)} onfocus={() => (activeSlot = s.key)}>
              <option value="">No bag</option>
              {#each options as o (o.id)}<option value={o.id}>{o.name}{o.volumeL ? ` · ${formatVolume(o.volumeL)}` : ''}</option>{/each}
            </select>
            {#if other}
              <p class="trip-bag">{tripOn.title}: {other.none ? 'no bag here' : `${other.name}${other.volumeL ? ` ${formatVolume(other.volumeL)}` : ''}`}{#if !other.none}<button type="button" class="link" onclick={() => setBag(s.key, other.id)}>Use as standard</button>{/if}</p>
            {/if}
          </li>
        {/each}
      </ul>
      </div>
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

{#if bikeDialog}
  <BikeDialog bike={bikeDialog.bike} {bikes} oncreated={(id) => (pickedId = id)} onclose={() => (bikeDialog = null)} />
{/if}

{#if dialog}
  <BagDialog bag={dialog.bag} {items} {bags} {bikes} onclose={() => (dialog = null)} />
{/if}

{#if shown != null && gallery.length}
  <Lightbox list={gallery.map((p) => ({ src: p.src, name: p.name, sub: [p.main ? 'Shown in Pack' : '', p.tripId ? `For ${tripTitle(p.tripId) ?? 'a trip'}` : ''].filter(Boolean).join(' · ') }))} start={shown} onclose={() => (shown = null)}>
    {#snippet actions(cur)}
      {@const p = gallery.find((x) => x.src === cur.src)}
      {#if p}
        {#if !p.main}<button type="button" class="lbtn" onclick={() => setMain(p)}>Show in Pack</button>{/if}
        {#if p.stored}
          <button type="button" class="lbtn" onclick={() => rename(p)}>Rename</button>
          <select class="lsel" aria-label="Show for this trip" value={p.tripId ?? ''} onchange={(e) => setTrip(p, e.currentTarget.value)}>
            <option value="">For every trip</option>
            {#each bikeTrips as t (t.id)}<option value={t.id}>For {t.title}</option>{/each}
          </select>
        {/if}
        <button type="button" class="lbtn" onclick={() => removePhoto(p)}>Remove</button>
      {/if}
    {/snippet}
  </Lightbox>
{/if}

<style>
  .gal {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 4px 0 10px;
    margin-bottom: 8px;
  }
  .th {
    flex: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 104px;
    padding: 0;
    border: 1.5px solid var(--line);
    border-radius: 6px;
    background: var(--paper);
    color: var(--ink-2);
    font: 600 12px var(--font-body);
    text-align: left;
    cursor: pointer;
    overflow: hidden;
  }
  .th.main {
    border-color: var(--ink);
  }
  .th img {
    width: 100%;
    height: 72px;
    object-fit: cover;
    display: block;
  }
  .th span {
    padding: 2px 6px 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .th.add {
    align-items: center;
    justify-content: center;
    min-height: 92px;
    border-style: dashed;
    font-size: 14px;
    text-align: center;
  }
  .lbtn,
  .lsel {
    min-height: 40px;
    padding: 0 12px;
    border: 1.5px solid #f4f6f2;
    border-radius: 6px;
    background: none;
    color: #f4f6f2;
    font: 600 14px var(--font-body);
    cursor: pointer;
  }
  .lsel option {
    color: var(--ink);
  }
  .gal .err {
    flex: none;
    align-self: center;
    margin: 0;
    color: #b42318;
    font-size: 14px;
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 20px;
    margin-bottom: 14px;
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
  .addbike {
    margin: -6px 0 12px;
    text-align: right;
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
  .fix {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 8px 0 0;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 2px 4px 2px 10px;
    border: 1.5px solid var(--ink-3);
    border-radius: 999px;
    background: var(--paper);
    font-size: 13px;
  }
  .chip button {
    border: 0;
    background: none;
    font-size: 16px;
    cursor: pointer;
    color: var(--ink-2);
  }
  .sel.mini {
    width: auto;
    padding: 2px 6px;
    font-size: 13px;
  }
  .hintw {
    display: block;
    color: var(--ink-3);
    font-size: 12px;
    max-width: 160px;
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
    display: grid;
    gap: 8px;
  }
  @media (min-width: 560px) {
    .slots {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .slots li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 4px 10px;
    align-items: start;
    padding: 8px 10px;
    background: var(--paper);
    border: 2px solid var(--ink);
    border-radius: 6px;
  }
  .slots li .sel {
    grid-column: 1 / -1;
  }
  .slots li.empty {
    background: transparent;
    border: 2px dashed var(--line);
  }
  .slots li.empty b {
    color: var(--ink-2);
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
  /* Status in grey, orange only for actions (design audit B5). */
  .muted,
  .nw {
    color: var(--ink-3);
    font-weight: 600;
    font-size: 13px;
  }
  .settings {
    margin: -6px 0 16px;
    font-size: 14px;
    color: var(--ink-2);
  }
  .settings summary {
    cursor: pointer;
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .settings summary .lbl {
    display: inline;
    margin: 0;
  }
  .set-in {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 24px;
    margin-top: 8px;
  }
  .onbike > summary {
    cursor: pointer;
    font-weight: 700;
    padding: 8px 0;
  }
  @media (min-width: 720px) {
    .onbike > summary {
      display: none;
    }
  }
  .std {
    margin: 0 0 8px;
    font-size: 14px;
    color: var(--ink-2);
  }
  .trip-bag {
    grid-column: 1 / -1;
    margin: 0;
    font-size: 13px;
    color: var(--ink-2);
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
    align-items: baseline;
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
