<script>
  /**
   * Bikes → Setup. v0.31.0 (Noah 9a, variant A "Ruhig und klar"):
   * - a dark band like the trip pages: name, km, weight, bags, "n care due"; the bikes as tabs in it;
   * - the big light drawing with the bag names around it (never cut off), and below it the list
   *   "Standard bags", one row per place; a tap on a row or on the drawing opens a list from below;
   * - the card "Who works on it" (me / bike shop, the last jobs, next for the bike shop);
   * - folded rows: Bike details, Profile, Photos, Ideas, Settings, Your bags.
   * Everything from before stays: switching, adding and editing bikes, the numbers, mounts on and off,
   * the trip's other bags, photos, ideas, the rider settings and the bag list.
   */
  import { localDay } from '../localday.js';
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { SLOTS, SLOT, sortBikes, bikeSetup, bagsFor, containerWeight, formatVolume, bikesHash, bikeWeightKind, placesOf } from '../bikes.js';
  import { formatWeight, parseGrams } from '../gear.js';
  import { Briefcase, Plus, ChevronRight, Scale, Bike, Gauge, Camera, User, Columns3 } from '@lucide/svelte';
  import SetupBand from './SetupBand.svelte';
  import SetupDrawing from './SetupDrawing.svelte';
  import SetupFold from './SetupFold.svelte';
  import BagSheet from './BagSheet.svelte';
  import WhoCard from './WhoCard.svelte';
  import FitCard from './FitCard.svelte';
  import Help from '../ui/Help.svelte';
  import BagDialog from './BagDialog.svelte';
  import BikeDialog from './BikeDialog.svelte';
  import { nextTrip } from '../debrief.js';
  import { bikePhotos, shrinkImage } from '../photo.js';
  import Lightbox from '../ui/Lightbox.svelte';
  import IdeasFold from './IdeasFold.svelte';
  import OrderDialog from '../care/OrderDialog.svelte';
  import { withVisits, tyreSetup, bikeProfile, workshopOrder } from '../workshop.js';
  import { upcomingTrips } from '../care.js';
  import { bikeCare } from '../readiness.js';
  import { nextForShop } from './who.js';
  import { t, tn, num, nameOf, bagName, dateOf } from '../i18n.svelte.js';
  import { take } from '../nav.js';

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const bagsQ = liveQuery(() => db.containers.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const riderQ = liveQuery(() => db.settings.get('riderWeightG'));
  const rearQ = liveQuery(() => db.settings.get('rearLimitPct'));
  const tripsQ = liveQuery(() => db.trips.toArray());
  const photosQ = liveQuery(() => db.photos.toArray());
  const visitsQ = liveQuery(() => db.visits.toArray());
  const tasksQ = liveQuery(() => db.maintenance.toArray());

  const bikes = $derived(sortBikes($bikesQ ?? []));
  const bags = $derived($bagsQ ?? []);
  const items = $derived($itemsQ ?? []);
  const itemsById = $derived(Object.fromEntries(items.map((i) => [i.id, i])));
  const visits = $derived($visitsQ ?? []);
  const tasks = $derived($tasksQ ?? []);
  const today = localDay();

  // v0.21.0: the chosen bike lives in the address (#/bikes?bike=<id>) and stays when Care is opened.
  let { bikeId = null, onbike } = $props();
  const bike = $derived(bikes.find((b) => b.id === bikeId) ?? bikes[0]);
  const setup = $derived(bike ? bikeSetup(bike, bags, items) : null);
  const bikeKind = $derived(bikeWeightKind(bike));
  // Design audit B4: the bike's bags are the standard; the next trip on it may use others.
  const tripOn = $derived(bike ? nextTrip(($tripsQ ?? []).filter((t) => t.bikeId === bike.id)) : null);
  const tripBag = (key) => (tripOn && (tripOn.setup?.[key] ?? null) !== (bike.setup?.[key] ?? null) ? bags.find((b) => b.id === tripOn.setup?.[key]) ?? { name: t('no bag'), none: true } : null);

  // The bike with its workshop jobs, for the profile, the care count and "Who works on it".
  const view = $derived(bike ? withVisits(bike, visits) : null);
  const tyres = $derived(view ? tyreSetup(view, visits) : null);
  // N14: the bike's profile (km, costs, what is due next, last workshop visit).
  const profile = $derived(view ? bikeProfile(view, visits, tyres, today) : null);
  // The same count as Bike care, Home and Pack (readiness.js).
  const care = $derived(view ? bikeCare(view, { tasks, visits, today }) : null);
  // N15: the order for the shop (for the bike's next trip, else what is due today), without what I do myself.
  const orderTrip = $derived(bike ? upcomingTrips($tripsQ ?? [], today).find((x) => x.bikeId === bike.id) ?? null : null);
  const order = $derived(view ? workshopOrder(view, orderTrip, tasks, visits, tyres, today) : null);
  const forShop = $derived(view ? nextForShop(order, view) : null);
  let orderOpen = $state(false);
  const chf = (n) => `CHF ${Math.round(n).toLocaleString('de-CH')}`;

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
    // v0.27.0 (Noah 1a, AP22): each file on its own; a bad one is named and the good ones are still saved.
    const failed = [];
    let saved = 0;
    for (const [n, file] of files.entries()) {
      try {
        const data = await shrinkImage(file);
        const id = `photo-${Date.now().toString(36)}-${n}`;
        await db.photos.put({ id, bikeId: bike.id, name: file.name.replace(/\.[^.]+$/, '').slice(0, 40) || 'Setup', tripId: null, main: !gallery.length && saved === 0, data, addedAt: new Date().toISOString() });
        saved++;
      } catch (err) {
        failed.push(`${file.name}: ${err.message || t('This photo could not be read.')}`);
      }
    }
    if (failed.length) photoMsg = [...failed, saved ? tn(saved, '{n} other photo was saved.', '{n} other photos were saved.') : t('No photo was saved.')].join(' ');
    adding = false;
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
  let sheet = $state(null); // the place whose bag is being chosen
  let dialog = $state(null); // { bag } or { bag: null, slot }
  let bikeDialog = $state(null); // { bike } or { bike: null }
  // v0.23.0 (AP07): Today's "Add a bike" opens the dialog right away.
  if (take('bikes.add')) bikeDialog = { bike: null };
  $effect(() => {
    const add = () => take('bikes.add') && (bikeDialog = { bike: null });
    window.addEventListener('pg:addbike', add);
    return () => window.removeEventListener('pg:addbike', add);
  });
  let message = $state('');

  const bagWeight = (bag) => containerWeight(bag, itemsById);
  const bagSub = (bag) => [bag.volumeL ? formatVolume(bag.volumeL) : '', bagWeight(bag) != null ? formatWeight(bagWeight(bag)) : ''].filter(Boolean).join(' · ');

  // Places on the drawing: the bike's places (while editing the mounts: every place).
  const places = $derived.by(() => {
    if (!bike) return [];
    // v0.37.0: the worn places (Back, Hip) are always there; they are no mounts to switch.
    return (editMounts ? MOUNTS : placesOf(bike)).map((s) => {
      const on = s.worn || bike.slots.includes(s.key);
      const bag = on ? bags.find((b) => b.id === bike.setup?.[s.key]) : null;
      return { key: s.key, name: t(s.name), box: s.box, on, bag: bag ? { name: bagName(bag.name), sub: bagSub(bag) } : null };
    });
  });
  // The rows of "Standard bags": every place the bike has (while editing the mounts: every place).
  const MOUNTS = SLOTS.filter((s) => !s.worn);
  const rows = $derived(bike ? (editMounts ? MOUNTS : placesOf(bike).filter((s) => !s.worn)) : []);
  const wornRows = $derived(bike && !editMounts ? placesOf(bike).filter((s) => s.worn) : []);
  // v0.40.0: a place without a bag (and without another bag on the coming trip) is "empty".
  const isEmpty = (s) => !bags.some((b) => b.id === bike?.setup?.[s.key]) && !tripBag(s.key);

  function pick(key) {
    if (!SLOT[key]) return;
    if (editMounts) return toggleMount(key);
    activeSlot = key;
    sheet = key;
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
  const bagsBySlot = $derived(SLOTS.map((s) => ({ slot: s, list: bags.filter((b) => b.slot === s.key) })).filter((g) => g.list.length));
  const sheetOptions = $derived(
    sheet
      ? bagsFor(sheet, bags).map((b) => ({
          id: b.id,
          name: bagName(b.name),
          sub: bagSub(b),
          unweighed: bagWeight(b) == null,
          others: bikes.filter((x) => x.id !== bike.id && x.setup?.[sheet] === b.id).map((x) => x.name).join(', '),
        }))
      : [],
  );

  function chooseBike(id) {
    onbike?.(id);
    activeSlot = null;
    sheet = null;
  }

  const weightWords = $derived(bike ? (bikeKind === 'missing' ? t('not weighed') : `${bikeKind === 'estimate' ? '~' : ''}${formatWeight(bike.weightG)} ${bikeKind === 'estimate' ? t('estimate') : t('measured')}`) : '');
</script>

<div class="setup">
  {#if !bikes.length && $bikesQ}
    <p class="card">{t('No bikes yet. Import your data on the')} <a href="#/">{t('start page')}</a> {t('(Your data → Import backup).')}
      <!-- v0.23.0 (AP07): or add one right here -->
      <button type="button" class="btn hi addfirst" onclick={() => (bikeDialog = { bike: null })}>{t('Add bike')}</button></p>
  {:else if bike}
    <SetupBand {bikes} {bike} {setup} kind={bikeKind} due={care?.rows.length ?? 0} careHref={bikesHash({ tab: 'care', bike: bike.id, open: true })} onbike={chooseBike} onadd={() => (bikeDialog = { bike: null })} onedit={() => (bikeDialog = { bike })} />

    <!-- v0.62.0 «Velo-Masse» (Noah): the fit and setup numbers, always open, at the top of the bike. -->
    {#key bike.id}<FitCard {bike} />{/key}

    <div class="cols">
      <div class="main">
        <section class="card draw" aria-label={t('{bike} with its bags', { bike: bike.name })}>
          <SetupDrawing {places} mounts={editMounts} active={activeSlot} label={t('{bike} with its bags', { bike: bike.name })} onpick={pick} />
          <div class="drawfoot">
            <!-- v0.40.0 (design check R2): no "Tap a place …" sentence; only while editing the mounts. -->
            <span class="hint">{#if editMounts}{t('Tap a place to switch its mount on or off.')}{/if}</span>
            <button type="button" class="btn sm mountbtn" class:ink={editMounts} aria-pressed={editMounts} onclick={() => (editMounts = !editMounts)}>
              {editMounts ? t('Done with mounts') : t('Edit mounts')}
            </button>
          </div>
        </section>

        <section class="card std" aria-labelledby="std-h">
          <div class="std-head">
            <h2 id="std-h">{editMounts ? t('Mounts') : t('Standard bags')}<span class="r">{editMounts ? t('{n} of {all} places', { n: bike.slots.filter((k) => MOUNTS.some((m) => m.key === k)).length, all: MOUNTS.length }) : t('every new trip')}</span></h2>
            {#if !editMounts}<Help label={t('Standard bags')}><p>{t('Pack starts every new trip on this bike with them; a trip can change its own.')}</p></Help>{/if}
          </div>
          <ul class="slots">
            {#each editMounts ? rows : rows.filter((s) => !isEmpty(s)) as s (s.key)}
              {@const on = bike.slots.includes(s.key)}
              {@const bag = on ? bags.find((b) => b.id === bike.setup?.[s.key]) : null}
              {@const other = on ? tripBag(s.key) : null}
              <li class:active={activeSlot === s.key}>
                {#if editMounts}
                  <div class="row">
                    <span class="ibox" class:empty={!on}><Briefcase size={18} aria-hidden="true" /></span>
                    <span class="nm"><b>{t(s.name)}</b><small>{t(s.where)}</small></span>
                    <button type="button" class="switch" role="switch" aria-checked={on} aria-label={t('Mount: {place}', { place: t(s.name) })} onclick={() => toggleMount(s.key)}><span class="knob"></span></button>
                  </div>
                {:else}
                  {@render slotRow(s, bag, other)}
                {/if}
              </li>
            {:else}
              {#if !rows.length}<li class="quiet none">{t('No mounts on this bike yet. Tap "Edit mounts".')}</li>{/if}
            {/each}
            {#if !editMounts}{@render empties(rows.filter((s) => isEmpty(s)))}{/if}
          </ul>
          {#if wornRows.length}
            <!-- v0.37.0 (Noah 2a): the worn places, a light header; their weight counts to On me. -->
            <h3 class="worn-h">{t('On me')}<span class="r">{t('not part of the bike weight')}</span></h3>
            <ul class="slots">
              {#each wornRows.filter((s) => !isEmpty(s)) as s (s.key)}
                {@const bag = bags.find((b) => b.id === bike.setup?.[s.key])}
                {@const other = tripBag(s.key)}
                <li class:active={activeSlot === s.key}>{@render slotRow(s, bag, other)}</li>
              {/each}
              {@render empties(wornRows.filter((s) => isEmpty(s)))}
            </ul>
          {/if}
        </section>
      </div>

      <div class="side">
        <!-- v0.40.0 (design check): "Who works on it" only once there is something in it (WhoCard). -->
        <WhoCard bike={view} {visits} {tasks} year={today.slice(0, 4)} per={profile?.per} next={forShop} onorder={() => (orderOpen = true)} />

        <!-- v0.48.0 (Noah): all bikes' parts, values and geometry side by side, two taps from Bikes. -->
        <a class="cmplink" href={bikesHash({ tab: 'compare' })}><Columns3 class="ic" size={20} aria-hidden="true" /><span class="cl">{t('Compare bikes')}</span><span class="sum">{t('Fit, parts, values, geometry')}</span><ChevronRight class="chev" size={18} aria-hidden="true" /></a>

        <SetupFold icon={Bike} label={t('Bike details')} summary={`${weightWords} · ${tn((bike.fixtures ?? []).length, '{n} thing always mounted', '{n} things always mounted')}`}>
          <div class="details-in">
            <label class="wlabel">
              <span class="lbl">{t('Bike weight (g)')}</span>
              {#key bike.id}<input class="inp num" type="text" inputmode="numeric" value={bike.weightG ?? ''} onchange={saveBikeWeight} placeholder={t('not weighed')} />{/key}
              {#if bike.weightNote}<small class="hintw">{bike.weightNote}</small>{/if}
              <small class="hintw">{t('Without bags, with Garmin mount, Quad Lock and bottle cages.')}</small>
            </label>
            <div class="fix">
              <span class="lbl">{t('Always mounted')}</span>
              <div class="chips">
                {#each bike.fixtures ?? [] as f (f)}
                  <span class="chip">{itemsById[f] ? nameOf(itemsById[f]) : f}<button type="button" aria-label={t('Remove {name}', { name: itemsById[f] ? nameOf(itemsById[f]) : f })} onclick={() => setFixtures((bike.fixtures ?? []).filter((x) => x !== f))}>×</button></span>
                {:else}
                  <span class="quiet">{t('nothing')}</span>
                {/each}
              </div>
              <select class="sel mini" aria-label={t('Add something that is always mounted')} value="" onchange={(e) => { if (e.currentTarget.value) setFixtures([...(bike.fixtures ?? []), e.currentTarget.value]); e.currentTarget.value = ''; }}>
                <option value="">{t('+ add')}</option>
                {#each items.filter((i) => i.category === 'bike' && !(bike.fixtures ?? []).includes(i.id) && i.ownership !== 'gone') as i (i.id)}<option value={i.id}>{nameOf(i)}</option>{/each}
              </select>
            </div>
          </div>
          {#if message}<p class="msg" role="status">{message}</p>{/if}
        </SetupFold>

        {#if profile}
          <SetupFold icon={Gauge} label={t('Profile')} late={profile.next[0]?.late} summary={`${profile.km == null ? t('km not set') : `${num(profile.km)} km`} · ${profile.next[0] ? `${profile.next[0].late ? t('Due now') : t('Next')}: ${profile.next[0].name}` : t('nothing recorded')}`}>
            <dl class="profile" aria-label={t('Profile of the {bike}', { bike: bike.name })}>
              <div><dt>km</dt><dd class="num">{profile.km == null ? t('not set') : num(profile.km)}{#if profile.kmDate}<small>{t('set {date}', { date: dateOf(profile.kmDate) })}</small>{/if}</dd></div>
              <div><dt>{t('Workshop {year}', { year: today.slice(0, 4) })}</dt><dd class="num">{profile.year ? (profile.year.unknown === profile.year.visits ? t('cost unknown') : chf(profile.year.chf)) : 'CHF 0'}{#if profile.year}<small>{tn(profile.year.visits, '{n} visit', '{n} visits')}</small>{/if}</dd></div>
              <div><dt>{t('Per 1000 km')}</dt><dd class="num">{profile.per?.chf != null ? chf(profile.per.chf) : '–'}<small>{profile.per?.chf != null ? t('over {km} km', { km: num(profile.per.km) }) : profile.per?.wait ? t('after {km} more km', { km: num(profile.per.wait) }) : t('needs km at a visit')}</small></dd></div>
              <div class:late={profile.next[0]?.late}><dt>{profile.next[0]?.late ? t('Due now') : t('Next')}</dt><dd>{#each profile.next as n (n.name)}<span>{n.name}<small>{n.detail}</small></span>{:else}<span>{t('nothing recorded')}</span>{/each}</dd></div>
              <div><dt>{t('Last workshop')}</dt><dd>{#if profile.last}<span>{dateOf(profile.last.date)}<small>{profile.last.shop}{profile.last.chf != null ? ` · ${chf(profile.last.chf)}` : ''}</small></span>{:else}<span>{t('none yet')}</span>{/if}</dd></div>
            </dl>
            <p class="to-care"><a class="link" href={bikesHash({ tab: 'care', bike: bike.id, open: true })}>{t('Bike care for the {bike}', { bike: bike.name })}</a></p>
          </SetupFold>
        {/if}

        <SetupFold icon={Camera} label={t('Photos')} summary={`${gallery.length ? tn(gallery.length, '{n} photo', '{n} photos') : t('no photo yet')}${gallery.find((p) => p.main) ? ` · ${t('in Pack: {name}', { name: gallery.find((p) => p.main).name })}` : ''}`}>
          <div class="gal" aria-label={t('Photos of the {bike}', { bike: bike.name })}>
            {#each gallery as p, n (p.id)}
              <button type="button" class="th" class:main={p.main} onclick={() => (shown = n)} aria-label={p.main ? t('Open photo {name}, shown in Pack', { name: p.name }) : t('Open photo {name}', { name: p.name })}>
                <img src={p.src} alt="" loading="lazy" />
                <span>{p.name}</span>
              </button>
            {/each}
            <label class="th add">{adding ? t('Reading…') : t('+ Photo')}<input type="file" accept="image/*" multiple onchange={addPhotos} hidden disabled={adding} /></label>
          </div>
          <p class="note">{t('Open a photo to show it in Pack, rename it or keep it for one trip.')}</p>
          <!-- v0.27.0 (AP22): below the gallery, so a long message wraps instead of scrolling sideways. -->
          {#if photoMsg}<p class="photo-err" role="alert">{photoMsg}</p>{/if}
        </SetupFold>

        <!-- v0.25.1 (Noah 2b): "Was geil wäre", the bike's own ideas -->
        {#key bike.id}<IdeasFold {bike} />{/key}
        {@render rest()}
      </div>
    </div>
  {/if}
  {#if !bike}{@render rest()}{/if}
</div>


<!-- v0.40.0 (design check R1/R2): the empty places as one row "4 places empty ›"; open, each one as before. -->
{#snippet empties(list)}
  {#if list.length}
    <li class="empties">
      <details open={list.some((s) => s.key === activeSlot)}>
        <summary class="row erow"><span class="ibox empty"><Plus size={18} aria-hidden="true" /></span><span class="nm"><b class="quiet">{tn(list.length, '{n} place empty', '{n} places empty')}</b><small>{list.map((s) => t(s.name)).join(' · ')}</small></span><ChevronRight class="chev" size={18} aria-hidden="true" /></summary>
        <ul class="slots inner">
          {#each list as s (s.key)}<li class:active={activeSlot === s.key}>{@render slotRow(s, null, tripBag(s.key))}</li>{/each}
        </ul>
      </details>
    </li>
  {/if}
{/snippet}

{#snippet slotRow(s, bag, other)}
                  <button type="button" class="row" id="slot-{s.key}" onclick={() => pick(s.key)}>
                    <span class="ibox" class:empty={!bag}>{#if bag}<Briefcase size={18} aria-hidden="true" />{:else}<Plus size={18} aria-hidden="true" />{/if}</span>
                    <span class="nm"><small>{t(s.name)} · {t(s.where)}</small>{#if bag}<b>{bagName(bag.name)}</b>{:else}<b class="quiet">{t('empty · choose a bag')}</b>{/if}</span>
                    {#if bag}<span class="w num">{[bag.volumeL ? formatVolume(bag.volumeL) : '', bagWeight(bag) != null ? formatWeight(bagWeight(bag)) : ''].filter(Boolean).join(' · ')}{#if bagWeight(bag) == null}<span class="nw" title={t('not weighed')}><Scale size={14} aria-hidden="true" /><span class="sr">{t('not weighed')}</span></span>{/if}</span>{/if}
                    <ChevronRight class="chev" size={18} aria-hidden="true" />
                  </button>
                  {#if other}
                    <p class="trip-bag">{tripOn.title}: {other.none ? t('no bag here') : `${bagName(other.name)}${other.volumeL ? ` ${formatVolume(other.volumeL)}` : ''}`}{#if !other.none}<button type="button" class="link" onclick={() => setBag(s.key, other.id)}>{t('Use as standard')}</button>{/if}</p>
                  {/if}
{/snippet}

<!-- Settings and the bag list are there also without a bike. -->
{#snippet rest()}
  <SetupFold icon={User} label={t('Settings')} summary={t('Rider {weight} · rear wheel hint over {pct} %', { weight: $riderQ?.value ? formatWeight($riderQ.value) : t('not set'), pct: $rearQ?.value ?? 60 })}>
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
    {#if message}<p class="msg" role="status">{message}</p>{/if}
  </SetupFold>

  <SetupFold icon={Briefcase} label={t('Your bags')} summary={tn(bags.length, '{n} bag or cage', '{n} bags and cages')}>
    <div class="bl-h">
      <p class="note">{t('Every bag, cage and backpack. The weight comes from the linked gear item or from the bag itself.')}</p>
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
              <span class="w num">{#if bagWeight(b) == null}<span class="nw" title={t('not weighed')}><Scale size={14} aria-hidden="true" /><span class="sr">{t('not weighed')}</span></span>{:else}{formatWeight(bagWeight(b))}{/if}</span>
            </button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="card">{t('No bags yet. Import your data, or add a bag.')}</p>
    {/each}
  </SetupFold>
{/snippet}

{#if sheet && bike}
  <BagSheet
    place={t(SLOT[sheet].name)}
    where={t(SLOT[sheet].where)}
    bikeName={bike.name}
    current={bike.setup?.[sheet] ?? null}
    options={sheetOptions}
    onpick={(id) => setBag(sheet, id)}
    onadd={() => (dialog = { bag: null, slot: sheet })}
    onclose={() => ((sheet = null), (activeSlot = null))}
  />
{/if}

{#if bikeDialog}
  <BikeDialog bike={bikeDialog.bike} {bikes} oncreated={(id) => onbike?.(id)} onclose={() => (bikeDialog = null)} />
{/if}

{#if dialog}
  <BagDialog bag={dialog.bag} slot={dialog.slot ?? null} {items} {bags} {bikes} onclose={() => (dialog = null)} />
{/if}

{#if orderOpen && order && forShop?.rows.length}
  <OrderDialog order={{ ...order, rows: forShop.rows }} bike={view} trip={orderTrip} bikeNames={Object.fromEntries(bikes.map((b) => [b.id, b.name]))} onclose={() => (orderOpen = false)} />
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
  .setup {
    min-width: 0;
  }
  /* v0.48.0: the link to «Compare bikes», drawn like a closed SetupFold row. */
  .cmplink {
    display: flex;
    align-items: center;
    gap: 4px 12px;
    min-height: 56px;
    margin: 0 0 8px;
    padding: 8px 14px 8px 16px;
    box-sizing: border-box;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 12px;
    color: var(--ink);
    text-decoration: none;
  }
  .cmplink:visited {
    color: var(--ink);
  }
  .cmplink:hover {
    background: var(--paper-2);
  }
  .cmplink :global(.ic),
  .cmplink :global(.chev) {
    flex: none;
    color: var(--ink-3);
  }
  .cmplink .cl {
    flex: none;
    margin: 0;
    font-size: var(--fs-body);
    font-weight: 600;
    color: var(--ink);
  }
  .cmplink .sum {
    flex: 1;
    min-width: 0;
    text-align: right;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .cols,
  .main,
  .side {
    min-width: 0;
  }
  .card {
    border-radius: 12px;
  }
  .draw {
    padding: 12px;
    margin-bottom: 12px;
  }
  .drawfoot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px 12px;
    margin-top: 6px;
  }
  .hint {
    color: var(--ink-3);
    font-size: 14px;
  }
  .mountbtn {
    min-height: 44px;
  }
  .std {
    margin-bottom: 12px;
  }
  .worn-h {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin: 14px 0 2px;
    font-size: 15px;
    font-weight: 600;
    color: var(--ink-2);
  }
  .worn-h .r {
    margin-left: auto;
    font-size: 13px;
    font-weight: 400;
    color: var(--ink-3);
  }
  .std h2,
  .slot-h {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin: 0 0 4px;
    font-size: 18px;
    font-weight: 600;
    line-height: 1.25;
  }
  .std h2 .r {
    margin-left: auto;
    font-size: 14px;
    font-weight: 400;
    color: var(--ink-3);
    text-align: right;
  }
  .slots {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .slots li + li {
    border-top: 1px solid var(--line);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 60px;
    padding: 6px 4px;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
  }
  button.row {
    cursor: pointer;
  }
  @media (hover: hover) {
    button.row:hover {
      background: var(--paper-2);
    }
  }
  .slots li.active .row {
    background: var(--hi-soft);
  }
  .ibox {
    flex: none;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .ibox.empty {
    background: none;
    border: 1.5px dashed var(--line-strong);
    color: var(--ink-3);
  }
  .nm {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow-wrap: break-word;
  }
  .std-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
    margin: 0 0 4px;
  }
  .std-head h2 {
    flex: 1;
    min-width: 0;
    margin: 0;
  }
  .erow {
    list-style: none;
    cursor: pointer;
  }
  .erow::-webkit-details-marker {
    display: none;
  }
  .empties details[open] > .erow :global(.chev) {
    transform: rotate(90deg);
  }
  .slots.inner {
    padding-left: 12px;
    border-top: 1px solid var(--line);
  }
  /* v0.40.0 (design check R3): litres and weight stay in the right column on a phone too. */
  @media (max-width: 400px) {
    .ibox {
      width: 34px;
      height: 34px;
    }
    .row {
      gap: 10px;
    }
  }
  /* v0.45.1 (G009): under 360 px litres and weight go under the bag's name when both do not fit,
     so "Rahmentasche" never breaks in the middle of the word. */
  @media (max-width: 359px) {
    .row {
      flex-wrap: wrap;
      row-gap: 0;
    }
    .row .nm {
      flex: 1 1 9em;
    }
    .row .w {
      margin-left: auto;
    }
  }
  .nm small {
    font-size: 13px;
    color: var(--ink-3);
  }
  .nm b {
    font-weight: 600;
  }
  .quiet {
    color: var(--ink-3);
  }
  .nm b.quiet {
    font-weight: 500;
  }
  .w {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    color: var(--ink-3);
    text-align: right;
    white-space: nowrap;
  }
  .nw {
    display: inline-flex;
    color: var(--ink-3);
  }
  .row :global(.chev) {
    flex: none;
    color: var(--ink-3);
  }
  .trip-bag {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 10px;
    margin: 0 0 8px 56px;
    font-size: 13px;
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .none {
    padding: 12px 0;
    font-size: 14px;
  }
  .note {
    margin: 8px 0 0;
    font-size: 13px;
    color: var(--ink-3);
  }
  .msg {
    font-weight: 700;
    margin: 8px 0 0;
  }
  /* A mount on or off: a switch, not a word. */
  .switch {
    position: relative;
    flex: none;
    width: 52px;
    height: 44px;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .switch::before {
    content: '';
    position: absolute;
    left: 4px;
    right: 4px;
    top: 50%;
    height: 26px;
    transform: translateY(-50%);
    border-radius: 99px;
    background: var(--line);
    transition: background 0.15s;
  }
  .switch .knob {
    position: absolute;
    top: 50%;
    left: 7px;
    width: 20px;
    height: 20px;
    transform: translateY(-50%);
    border-radius: 50%;
    background: var(--input);
    box-shadow: 0 1px 2px var(--shadow);
    transition: left 0.15s;
  }
  .switch[aria-checked='true']::before {
    background: var(--ok);
  }
  .switch[aria-checked='true'] .knob {
    left: 25px;
  }
  .link {
    position: relative;
    border: 0;
    background: none;
    padding: 0;
    font: inherit;
    font-size: 14px;
    color: var(--ink);
    text-decoration: underline;
    cursor: pointer;
  }
  .link::after {
    content: '';
    position: absolute;
    left: -6px;
    right: -6px;
    top: 50%;
    height: 44px;
    transform: translateY(-50%);
  }
  .addfirst {
    display: flex;
    margin-top: 12px;
  }
  .details-in {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 28px;
    align-items: start;
  }
  .wlabel {
    display: flex;
    flex-direction: column;
  }
  .wlabel .inp {
    width: 130px;
  }
  .hintw {
    display: block;
    color: var(--ink-3);
    font-size: 13px;
    max-width: 220px;
  }
  .fix {
    min-width: 0;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 6px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 2px 2px 2px 10px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    font-size: 14px;
    overflow-wrap: break-word;
  }
  .chip button {
    min-width: 36px;
    min-height: 36px;
    border: 0;
    background: none;
    font-size: 18px;
    cursor: pointer;
    color: var(--ink-2);
  }
  .sel.mini {
    width: auto;
    max-width: 100%;
    font-size: 14px;
  }
  .profile {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 8px;
    margin: 0;
  }
  .profile > div {
    background: var(--paper-2);
    border-radius: 8px;
    padding: 8px 10px;
    min-width: 0;
  }
  .profile .late {
    box-shadow: inset 3px 0 0 var(--bad);
  }
  .profile dt {
    font-size: 13px;
    font-weight: 600;
    color: var(--ink-3);
  }
  .profile dd {
    margin: 2px 0 0;
    font-weight: 600;
    font-size: 15px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow-wrap: break-word;
  }
  .profile dd span {
    display: flex;
    flex-direction: column;
  }
  .profile small {
    font-weight: 400;
    font-size: 13px;
    color: var(--ink-3);
  }
  .to-care {
    margin: 10px 0 0;
    font-size: 14px;
  }
  .gal {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 2px 0 8px;
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
  .photo-err {
    margin: 8px 0 0;
    overflow-wrap: break-word;
    color: var(--bad);
    font-size: 14px;
  }
  .lbtn,
  .lsel {
    min-height: 44px;
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
  .set-in {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 24px;
  }
  .rider .inp {
    width: 110px;
  }
  .bl-h {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 8px 12px;
  }
  .bl-h .note {
    margin: 0;
    flex: 1 1 220px;
  }
  .bl-h .btn {
    min-height: 44px;
  }
  /* The bag list: a quiet section header with a rule, numbers right-aligned in one column. */
  .slot-h {
    margin: 16px 0 0;
    padding: 6px 8px;
    border-radius: 6px;
    background: var(--paper-2);
    font-size: 15px;
  }
  .slot-h small {
    font-size: 13px;
    font-weight: 400;
    color: var(--ink-3);
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .rows button {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto 5.5em;
    gap: 2px 12px;
    width: 100%;
    min-height: 52px;
    padding: 8px;
    border: 0;
    border-bottom: 1px solid var(--line);
    background: none;
    font: inherit;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }
  @media (hover: hover) {
    .rows button:hover {
      background: var(--paper-2);
    }
  }
  .rows .nm {
    display: block;
    overflow-wrap: break-word;
  }
  .rows .bg {
    grid-column: 1;
    grid-row: 2;
    font-size: 13px;
    color: var(--ink-3);
    overflow-wrap: break-word;
  }
  .rows .v {
    grid-row: 1 / span 2;
    align-self: center;
    text-align: right;
    color: var(--ink-2);
  }
  .rows .w {
    grid-row: 1 / span 2;
    align-self: center;
    justify-content: flex-end;
    color: var(--ink);
    font-weight: 600;
  }
  @media (min-width: 1000px) {
    .cols {
      display: grid;
      grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
      gap: 20px;
      align-items: start;
    }
  }
  /* v0.45.1 (G009): under 360 px the bag list puts litres and weight on a line below the name. */
  @media (max-width: 359px) {
    .rows button {
      grid-template-columns: auto auto minmax(0, 1fr);
    }
    .rows .nm,
    .rows .bg {
      grid-column: 1 / -1;
    }
    .rows .v {
      grid-row: 3;
      grid-column: 1;
      text-align: left;
    }
    .rows .w {
      grid-row: 3;
      grid-column: 2;
      justify-content: flex-start;
    }
  }
</style>
