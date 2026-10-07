<script>
  import { tick } from 'svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { SLOTS, SLOT, FIXED_ZONES, sortBikes, bikeSetup, bagsFor, containerWeight, formatVolume, bikesHash } from '../bikes.js';
  import { formatWeight, parseGrams } from '../gear.js';
  import BikeStage from './BikeStage.svelte';
  import BagDialog from './BagDialog.svelte';
  import BikeDialog from './BikeDialog.svelte';
  import { nextTrip } from '../debrief.js';
  import { bikePhotos, shrinkImage } from '../photo.js';
  import Lightbox from '../ui/Lightbox.svelte';
  import Fold from '../ui/Fold.svelte';
  import { withVisits, tyreSetup, bikeProfile } from '../workshop.js';
  import { t, tn, num, locale, nameOf } from '../i18n.svelte.js';

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const bagsQ = liveQuery(() => db.containers.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const riderQ = liveQuery(() => db.settings.get('riderWeightG'));
  const rearQ = liveQuery(() => db.settings.get('rearLimitPct'));
  const tripsQ = liveQuery(() => db.trips.toArray());
  const photosQ = liveQuery(() => db.photos.toArray());
  const visitsQ = liveQuery(() => db.visits.toArray());

  const bikes = $derived(sortBikes($bikesQ ?? []));
  const bags = $derived($bagsQ ?? []);
  const items = $derived($itemsQ ?? []);
  const itemsById = $derived(Object.fromEntries(items.map((i) => [i.id, i])));

  // v0.21.0: the chosen bike lives in the address (#/bikes?bike=<id>) and stays when Care is opened.
  let { bikeId = null, onbike } = $props();
  const bike = $derived(bikes.find((b) => b.id === bikeId) ?? bikes[0]);
  const setup = $derived(bike ? bikeSetup(bike, bags, items) : null);
  // Design audit B4: the bike's bags are the standard; the next trip on it may use others.
  const tripOn = $derived(bike ? nextTrip(($tripsQ ?? []).filter((t) => t.bikeId === bike.id)) : null);
  const tripBag = (key) => (tripOn && (tripOn.setup?.[key] ?? null) !== (bike.setup?.[key] ?? null) ? bags.find((b) => b.id === tripOn.setup?.[key]) ?? { name: t('no bag'), none: true } : null);

  // N14: the bike's profile (km, costs, what is due next, last workshop visit).
  const profile = $derived.by(() => {
    if (!bike) return null;
    const visits = $visitsQ ?? [];
    const view = withVisits(bike, visits);
    return bikeProfile(view, visits, tyreSetup(view, visits), new Date().toISOString().slice(0, 10));
  });
  const chf = (n) => `CHF ${Math.round(n).toLocaleString('de-CH')}`;
  const day = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

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
      photoMsg = err.message || t('This photo could not be read.');
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
    const name = prompt(t('Name of this photo, e.g. "Hope 2026"'), p.name);
    if (name?.trim()) await db.photos.update(p.id, { name: name.trim().slice(0, 60) });
  }
  const setTrip = (p, tripId) => db.photos.update(p.id, { tripId: tripId || null });
  async function removePhoto(p) {
    if (!confirm(t('Remove the photo "{name}"?', { name: p.name }))) return;
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
    const fixed = FIXED_ZONES.map((z) => ({ key: z.key, title: t(z.name), sub: '', box: z.box, empty: false, active: false }));
    const slots = SLOTS.filter((s) => editMounts || bike.slots.includes(s.key)).map((s) => {
      const has = bike.slots.includes(s.key);
      const bag = bags.find((b) => b.id === bike.setup?.[s.key]);
      return {
        key: s.key,
        title: has ? (bag ? bag.name : `+ ${t(s.name)}`) : t('{slot} (no mount)', { slot: t(s.name) }),
        sub: has && bag ? formatVolume(bag.volumeL) : '',
        box: s.box,
        empty: !has || !bag,
        active: activeSlot === s.key,
      };
    });
    return [...fixed, ...slots];
  });

  // v0.21.0: places with a bag first; the places without one fold into one line.
  const mySlots = $derived(bike ? SLOTS.filter((s) => bike.slots.includes(s.key)) : []);
  const filled = $derived(mySlots.filter((s) => bike.setup?.[s.key]));
  const emptySlots = $derived(mySlots.filter((s) => !bike.setup?.[s.key]));
  let emptyOpen = $state(false);

  async function pick(key) {
    if (!SLOT[key]) return;
    if (editMounts) return toggleMount(key);
    activeSlot = key;
    if (!bike.setup?.[key]) emptyOpen = true;
    await tick();
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
    if (g == null) return (message = t('Type the bike weight in whole grams, e.g. 13000.'));
    message = '';
    // A weighed value replaces an estimate (Strava, logbook), so its note goes.
    await db.bikes.update(bike.id, { weightG: g, weightNote: '' });
  }

  async function saveRider(event) {
    const text = event.currentTarget.value.trim();
    const g = text === '' ? null : Math.round(Number(text.replace(',', '.')) * 1000);
    if (text !== '' && !(g >= 20000 && g <= 200000)) return (message = t('Type your weight in kilograms, e.g. 64.'));
    message = '';
    await db.settings.put({ key: 'riderWeightG', value: g });
  }

  // Answer 5 (round C): Pack shows a hint when more than this share of the luggage sits on the rear wheel.
  async function saveRear(event) {
    const text = event.currentTarget.value.trim();
    const n = text === '' ? null : Math.round(Number(text));
    if (text !== '' && !(n >= 50 && n <= 90)) return (message = t('Rear wheel hint: a percentage from 50 to 90.'));
    message = '';
    await db.settings.put({ key: 'rearLimitPct', value: n });
  }

  const onBikes = (bagId) => bikes.filter((b) => Object.values(b.setup ?? {}).includes(bagId)).map((b) => b.name);
  const bagsBySlot = $derived(SLOTS.map((s) => ({ slot: s, list: bagsFor(s.key, bags) })).filter((g) => g.list.length));
</script>

<!-- v0.21.0 (Noah 6a, 5): the bike with its bags first; details, profile, photos, settings and the
     bag list fold away behind one summary line each. -->
<div class="setup">
  {#if !bikes.length && $bikesQ}
    <p class="card">{t('No bikes yet. Import your data on the')} <a href="#/">{t('start page')}</a> {t('(Your data → Import backup).')}</p>
  {:else if bike}
    <div class="picker">
      <div class="tabs" role="tablist" aria-label={t('Bike')}>
        {#each bikes as b (b.id)}
          <button type="button" role="tab" aria-selected={b.id === bike.id} onclick={() => (onbike?.(b.id), (activeSlot = null), (emptyOpen = false))}>{b.name}</button>
        {/each}
      </div>
      <button type="button" class="link addbike" onclick={() => (bikeDialog = { bike: null })}>{t('Add bike')}</button>
    </div>

    <section class="bike-card" aria-labelledby="bike-h">
      <div class="bh">
        <div>
          <h2 id="bike-h" class="title">{bike.name}</h2>
          <p class="sub">{bike.type ?? ''}{bike.use ? ` · ${bike.use}` : ''} <button type="button" class="link" onclick={() => (bikeDialog = { bike })}>{t('Edit')}</button></p>
        </div>
        <p class="kpi num">
          <span><span class="lbl">{t('Bags')}</span><b>{setup.bagCount} · {formatVolume(setup.volumeL)}</b></span>
          <span><span class="lbl">{t('Bags weigh')}</span><b>{formatWeight(setup.bagsG)}</b>{#if setup.unweighed}<small class="nw">{t('+ {n} not weighed', { n: setup.unweighed })}</small>{/if}</span>
        </p>
      </div>

      <div class="layout">
        <div class="left">
          <BikeStage {zones} onpick={pick} label={t('{bike} with its bags', { bike: bike.name })} />
          <div class="mounts">
            <button type="button" class="btn sm" class:ink={editMounts} aria-pressed={editMounts} onclick={() => (editMounts = !editMounts)}>
              {editMounts ? t('Done with mounts') : t('Edit mounts')}
            </button>
            <span class="hint">{editMounts ? t('Tap a place on the drawing to switch its mount on or off.') : t('Choose which bag sits where. Pack starts with this setup.')}</span>
          </div>
        </div>

        <div class="right">
          <p class="std"><b>{t('Standard bags')}</b> · {t('Pack starts every new trip on this bike with them; a trip can change its own.')}</p>
          <!-- Design audit B2: the places as a grid of small cards. -->
          <ul class="slots">
            {#each filled as s (s.key)}{@render slot(s)}{/each}
          </ul>
          {#if emptySlots.length}
            <details class="empties" bind:open={emptyOpen}>
              <summary>{tn(emptySlots.length, '{n} place without a bag', '{n} places without a bag')}</summary>
              {#if emptyOpen}
                <ul class="slots">
                  {#each emptySlots as s (s.key)}{@render slot(s)}{/each}
                </ul>
              {/if}
            </details>
          {/if}
        </div>
      </div>
      {#if message}<p class="msg" role="status">{message}</p>{/if}

      <Fold label={t('Bike details')} summary={`${bike.weightG ? formatWeight(bike.weightG) : t('not weighed')} · ${tn((bike.fixtures ?? []).length, '{n} thing always mounted', '{n} things always mounted')}`}>
        <div class="details-in">
          <label class="wlabel">
            <span class="lbl">{t('Bike weight (g)')}</span>
            {#key bike.id}<input class="inp num" type="text" inputmode="numeric" value={bike.weightG ?? ''} onchange={saveBikeWeight} placeholder={t('not weighed')} />{/key}
            {#if bike.weightNote}<small class="hintw">{bike.weightNote}</small>{/if}
            <small class="hintw">{t('Without bags, with Garmin mount, Quad Lock and bottle cages.')}</small>
          </label>
          <p class="fix">
            <span class="lbl">{t('Always mounted')}</span>
            {#each bike.fixtures ?? [] as f (f)}
              <span class="chip">{itemsById[f] ? nameOf(itemsById[f]) : f}<button type="button" aria-label={t('Remove {name}', { name: itemsById[f] ? nameOf(itemsById[f]) : f })} onclick={() => setFixtures((bike.fixtures ?? []).filter((x) => x !== f))}>×</button></span>
            {:else}
              <span class="sub">{t('nothing')}</span>
            {/each}
            <select class="sel mini" aria-label={t('Add something that is always mounted')} value="" onchange={(e) => { if (e.currentTarget.value) setFixtures([...(bike.fixtures ?? []), e.currentTarget.value]); e.currentTarget.value = ''; }}>
              <option value="">{t('+ add')}</option>
              {#each items.filter((i) => i.category === 'bike' && !(bike.fixtures ?? []).includes(i.id) && i.ownership !== 'gone') as i (i.id)}<option value={i.id}>{nameOf(i)}</option>{/each}
            </select>
          </p>
        </div>
      </Fold>

      {#if profile}
        <Fold label={t('Profile')} late={profile.next[0]?.late} summary={`${profile.km == null ? t('km not set') : `${num(profile.km)} km`} · ${profile.next[0] ? `${profile.next[0].late ? t('Due now') : t('Next')}: ${profile.next[0].name}` : t('nothing recorded')} · ${profile.last ? t('workshop {date}', { date: day(profile.last.date) }) : t('no workshop visit yet')}`}>
            <dl class="profile" aria-label={t('Profile of the {bike}', { bike: bike.name })}>
              <div><dt>km</dt><dd class="num">{profile.km == null ? t('not set') : num(profile.km)}{#if profile.kmDate}<small>{t('set {date}', { date: day(profile.kmDate) })}</small>{/if}</dd></div>
              <div><dt>{t('Workshop {year}', { year: new Date().getFullYear() })}</dt><dd class="num">{profile.year ? (profile.year.unknown === profile.year.visits ? t('cost unknown') : chf(profile.year.chf)) : 'CHF 0'}{#if profile.year}<small>{tn(profile.year.visits, '{n} visit', '{n} visits')}</small>{/if}</dd></div>
              <div><dt>{t('Per 1000 km')}</dt><dd class="num">{profile.per?.chf != null ? chf(profile.per.chf) : '–'}<small>{profile.per?.chf != null ? t('over {km} km', { km: num(profile.per.km) }) : profile.per?.wait ? t('after {km} more km', { km: num(profile.per.wait) }) : t('needs km at a visit')}</small></dd></div>
              <div class:late={profile.next[0]?.late}><dt>{profile.next[0]?.late ? t('Due now') : t('Next')}</dt><dd>{#each profile.next as n (n.name)}<span>{n.name}<small>{n.detail}</small></span>{:else}<span>{t('nothing recorded')}</span>{/each}</dd></div>
              <div><dt>{t('Last workshop')}</dt><dd>{#if profile.last}<span>{day(profile.last.date)}<small>{profile.last.shop}{profile.last.chf != null ? ` · ${chf(profile.last.chf)}` : ''}</small></span>{:else}<span>{t('none yet')}</span>{/if}</dd></div>
            </dl>
            <p class="to-care"><a class="link" href={bikesHash({ tab: 'care', bike: bike.id, open: true })}>{t('Bike care for the {bike}', { bike: bike.name })}</a></p>
        </Fold>
      {/if}

      <Fold label={t('Photos')} summary={`${gallery.length ? tn(gallery.length, '{n} photo', '{n} photos') : t('no photo yet')}${gallery.find((p) => p.main) ? ` · ${t('in Pack: {name}', { name: gallery.find((p) => p.main).name })}` : ''}`}>
        <div class="gal" aria-label={t('Photos of the {bike}', { bike: bike.name })}>
          {#each gallery as p, n (p.id)}
            <button type="button" class="th" class:main={p.main} onclick={() => (shown = n)} aria-label={p.main ? t('Open photo {name}, shown in Pack', { name: p.name }) : t('Open photo {name}', { name: p.name })}>
              <img src={p.src} alt="" loading="lazy" />
              <span>{p.name}</span>
            </button>
          {/each}
          <label class="th add">{adding ? t('Reading…') : t('+ Photo')}<input type="file" accept="image/*" multiple onchange={addPhotos} hidden disabled={adding} /></label>
          {#if photoMsg}<p class="err" role="alert">{photoMsg}</p>{/if}
        </div>
      </Fold>
    </section>
  {/if}

  <Fold label={t('Settings')} summary={t('Rider {weight} · rear wheel hint over {pct} %', { weight: $riderQ?.value ? formatWeight($riderQ.value) : t('not set'), pct: $rearQ?.value ?? 60 })}>
    <div class="set-in">
      <label class="rider">
        <span class="lbl">{t('Rider weight (kg)')}</span>
        <input class="inp num" type="text" inputmode="decimal" value={$riderQ?.value ? $riderQ.value / 1000 : ''} onchange={saveRider} placeholder={t('e.g. 64')} />
      </label>
      <label class="rider">
        <span class="lbl">{t('Hint when rear is over (%)')}</span>
        <input class="inp num" type="text" inputmode="numeric" value={$rearQ?.value ?? ''} onchange={saveRear} placeholder="60" />
      </label>
    </div>
  </Fold>

  <Fold label={t('Your bags')} summary={tn(bags.length, '{n} bag or cage', '{n} bags and cages')}>
      <div class="bl-h">
        <p class="sub">{t('Every bag and cage that can go on a bike. The weight comes from the linked gear item.')}</p>
        <button type="button" class="btn hi" onclick={() => (dialog = { bag: null })}>{t('Add bag')}</button>
      </div>
      {#each bagsBySlot as g (g.slot.key)}
        <h3 class="slot-h">{t(g.slot.name)} <small>{t(g.slot.where)}</small></h3>
        <ul class="rows">
          {#each g.list as b (b.id)}
            <li>
              <button type="button" onclick={() => (dialog = { bag: b })}>
                <span class="nm">{b.name}</span>
                <span class="bg">{onBikes(b.id).join(', ') || t('Not on a bike')}</span>
                <span class="v num">{formatVolume(b.volumeL)}</span>
                <span class="w num" class:nw={containerWeight(b, itemsById) == null}>{formatWeight(containerWeight(b, itemsById))}</span>
              </button>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="card">{t('No bags yet. Import your data, or add a bag.')}</p>
      {/each}
  </Fold>
</div>

{#snippet slot(s)}
  {@const bag = bags.find((b) => b.id === bike.setup?.[s.key])}
  {@const options = bagsFor(s.key, bags)}
  {@const other = tripBag(s.key)}
  <li class:active={activeSlot === s.key} class:empty={!bag}>
    <label for="slot-{s.key}"><b>{t(s.name)}</b><small>{t(s.where)}</small></label>
    <span class="w num" class:muted={bag && containerWeight(bag, itemsById) == null}>{bag ? formatWeight(containerWeight(bag, itemsById)) : ''}</span>
    <select id="slot-{s.key}" class="sel" value={bike.setup?.[s.key] ?? ''} onchange={(e) => setBag(s.key, e.currentTarget.value)} onfocus={() => (activeSlot = s.key)}>
      <option value="">{t('No bag')}</option>
      {#each options as o (o.id)}<option value={o.id}>{o.name}{o.volumeL ? ` · ${formatVolume(o.volumeL)}` : ''}</option>{/each}
    </select>
    {#if other}
      <p class="trip-bag">{tripOn.title}: {other.none ? t('no bag here') : `${other.name}${other.volumeL ? ` ${formatVolume(other.volumeL)}` : ''}`}{#if !other.none}<button type="button" class="link" onclick={() => setBag(s.key, other.id)}>{t('Use as standard')}</button>{/if}</p>
    {/if}
  </li>
{/snippet}

{#if bikeDialog}
  <BikeDialog bike={bikeDialog.bike} {bikes} oncreated={(id) => onbike?.(id)} onclose={() => (bikeDialog = null)} />
{/if}

{#if dialog}
  <BagDialog bag={dialog.bag} {items} {bags} {bikes} onclose={() => (dialog = null)} />
{/if}

{#if shown != null && gallery.length}
  <Lightbox list={gallery.map((p) => ({ src: p.src, name: p.name, sub: [p.main ? t('Shown in Pack') : '', p.tripId ? t('For {trip}', { trip: tripTitle(p.tripId) ?? t('a trip') }) : ''].filter(Boolean).join(' · ') }))} start={shown} onclose={() => (shown = null)}>
    {#snippet actions(cur)}
      {@const p = gallery.find((x) => x.src === cur.src)}
      {#if p}
        {#if !p.main}<button type="button" class="lbtn" onclick={() => setMain(p)}>{t('Show in Pack')}</button>{/if}
        {#if p.stored}
          <button type="button" class="lbtn" onclick={() => rename(p)}>{t('Rename')}</button>
          <select class="lsel" aria-label={t('Show for this trip')} value={p.tripId ?? ''} onchange={(e) => setTrip(p, e.currentTarget.value)}>
            <option value="">{t('For every trip')}</option>
            {#each bikeTrips as bt (bt.id)}<option value={bt.id}>{t('For {trip}', { trip: bt.title })}</option>{/each}
          </select>
        {/if}
        <button type="button" class="lbtn" onclick={() => removePhoto(p)}>{t('Remove')}</button>
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
    font: 600 13px var(--font-body);
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
    color: var(--bad);
    font-size: 14px;
  }
  .rider .inp {
    width: 110px;
  }
  .tabs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border: 1.5px solid var(--line-strong);
    border-radius: 6px;
    overflow: hidden;
    flex: 1 1 320px;
  }
  .tabs button {
    border: 0;
    border-right: 1px solid var(--line);
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
      border-bottom: 1px solid var(--line);
    }
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
    font-size: var(--fs-small);
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
    font-size: var(--fs-small);
  }
  .hintw {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
    max-width: 160px;
  }
  .profile {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 8px;
    margin: 12px 0 0;
  }
  .profile > div {
    background: var(--paper-2, #f4f2ee);
    border-radius: 8px;
    padding: 8px 10px;
    min-width: 0;
  }
  .profile .late {
    box-shadow: inset 3px 0 0 var(--bad);
  }
  .profile dt {
    font-size: var(--fs-small);
    font-weight: 700;
    color: var(--ink-3);
  }
  .profile dd {
    margin: 2px 0 0;
    font-weight: 700;
    font-size: 15px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .profile dd span {
    display: flex;
    flex-direction: column;
  }
  .profile small {
    font-weight: 400;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .to-care {
    margin: 6px 0 0;
    font-size: 14px;
  }
  .bike-card {
    margin-bottom: 18px;
  }
  /* v0.21.0: bike picker and "Add bike" on one line. */
  .picker {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 16px;
    margin-bottom: 14px;
  }
  .addbike {
    margin-left: auto;
  }
  .kpi {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 22px;
    margin: 0;
  }
  .kpi > span {
    display: flex;
    flex-direction: column;
  }
  .kpi b {
    font-family: var(--font-title);
    font-weight: 800;
    font-size: var(--fs-sub);
    line-height: 1.1;
  }
  .kpi .lbl {
    margin: 0;
  }
  .details-in {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 28px;
    align-items: start;
  }
  .wlabel {
    display: flex;
    flex-direction: column;
  }
  .wlabel .inp {
    width: 130px;
  }
  .empties {
    margin-top: 8px;
  }
  .empties > summary {
    cursor: pointer;
    font-size: 14px;
    font-weight: 700;
    color: var(--ink-2);
    padding: 8px 0;
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
    font-size: var(--fs-page);
  }
  .sub {
    margin: 2px 0 0;
    color: var(--ink-3);
    font-size: 14px;
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
    border: 1px solid var(--line);
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
    font-size: var(--fs-small);
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
    font-size: var(--fs-small);
  }
  .set-in {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 24px;
    margin-top: 8px;
  }
  .std {
    margin: 0 0 8px;
    font-size: 14px;
    color: var(--ink-2);
  }
  .trip-bag {
    grid-column: 1 / -1;
    margin: 0;
    font-size: var(--fs-small);
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
  .slot-h {
    margin: 18px 0 0;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--line-strong);
    font: 800 var(--fs-sub) var(--font-title);
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
    font-size: var(--fs-small);
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
