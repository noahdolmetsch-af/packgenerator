<script>
  import { askDelete, deleteWithUndo } from '../ui/ask.js'; // «Rückmeldungen» 19.10.2026: the app's own question, then 4 s «Undo»
  import CameraButton from '../ui/CameraButton.svelte'; // P3b Teil 3: the camera wherever a photo is added
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
  import Empty from '../ui/Empty.svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { SLOTS, SLOT, sortBikes, bikeSetup, bagsFor, containerWeight, formatVolume, bikesHash, bikeWeightKind, placesOf } from '../bikes.js';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import { offerRename } from '../ui/rename.svelte.js';
  import { formatWeight, parseGrams } from '../gear.js';
  import { Bike as BikeIcon, Briefcase, Plus, ChevronRight, Scale, User, Wrench, MoreHorizontal, Package, Route, BookOpen, Image as ImageIcon, ArrowLeftRight, RefreshCw } from '@lucide/svelte';
  import SetupBand from './SetupBand.svelte';
  import SetupDrawing from './SetupDrawing.svelte';
  import SetupFold from './SetupFold.svelte';
  import BagSheet from './BagSheet.svelte';
  import WhoCard from './WhoCard.svelte';
  import GarminCard from './GarminCard.svelte';
  import FitCard from './FitCard.svelte';
  import SitPosCard from '../vision/SitPosCard.svelte';
  import SheetFolder from './SheetFolder.svelte';
  import Help from '../ui/Help.svelte';
  import BagDialog from './BagDialog.svelte';
  import BikeDialog from './BikeDialog.svelte';
  import BikeOrderSheet from './BikeOrderSheet.svelte';
  import NewStandardSheet from './NewStandardSheet.svelte';
  import { nextTrip } from '../debrief.js';
  import { bikePhotos, shrinkImage } from '../photo.js';
  import Lightbox from '../ui/Lightbox.svelte';
  import SetupPhotos from '../bilder/SetupPhotos.svelte'; // «Bilder in der App» 2a: the setup photos as a timeline
  import IdeasFold from './IdeasFold.svelte';
  import OrderDialog from '../care/OrderDialog.svelte';
  import { withVisits, tyreSetup, bikeProfile, workshopOrder } from '../workshop.js';
  import { upcomingTrips } from '../care.js';
  import { bikeCare, bikeCareWords } from '../readiness.js';
  import { nextForShop } from './who.js';
  import { t, tn, num, nameOf, bagName, dateOf } from '../i18n.svelte.js';
  // Impeccable Runde 2 (18.10.2026, Velos 2): «Hersteller und Garantie» (SK X9) is entered from the bike's «…»;
  // under its name only once a link is there, as «Hersteller und Garantie ↗».
  import { slotOf, LINKS, linkOn } from '../sk/links.js';
  import { skLinks, watchLinks } from '../sk/linkstore.svelte.js';
  import { setOwnLink, removeOwnLink, setLinkOff } from '../sk/store.js';
  import OwnLinkSheet from '../sk/OwnLinkSheet.svelte';
  import SkToast from '../sk/SkToast.svelte';
  import { Pencil, EyeOff, ShieldCheck, Gauge } from '@lucide/svelte';
  import { wearRows, wearSummary } from '../wear.js';
  import { take } from '../nav.js';
  import { strava } from '../strava/client.svelte.js';
  import { signFor } from '../daumen.js'; // FE13: a sign next to the colour
  import '../ui/fe-seiten.css';

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
  let { bikeId = null, more = false, onbike, onopened } = $props();
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
  // «Verschleiss» (Noah 20.10.2026, 5a): the most worn part in one line («Chain: 260 km left»)
  const wearSum = $derived(view ? wearSummary(wearRows(view, { today })) : null);
  const wearLine = $derived(
    !wearSum || !wearSum.top
      ? t('Set start points, then the app can tell')
      : wearSum.state === 'ok'
        ? t('All parts fine · most worn: {part}', { part: wearSum.top.name })
        : wearSum.top.left != null && wearSum.top.left > 0
          ? t('{part}: {km} km left', { part: wearSum.top.name, km: num(wearSum.top.left) })
          : t('{part}: replace soon', { part: wearSum.top.name }),
  );
  // N15: the order for the shop (for the bike's next trip, else what is due today), without what I do myself.
  const orderTrip = $derived(bike ? upcomingTrips($tripsQ ?? [], today).find((x) => x.bikeId === bike.id) ?? null : null);
  const order = $derived(view ? workshopOrder(view, orderTrip, tasks, visits, tyres, today) : null);
  const forShop = $derived(view ? nextForShop(order, view) : null);
  let orderOpen = $state(false);
  // v0.95.0 «Velo kurz» (App einfach D, Noah 4a/5a, mockup D): the bike page is short: three rows
  // (care, bags, equipment), «Import rides» as the one button, everything else under «More».
  const careWords = $derived(care ? bikeCareWords(care) : null);
  // Design-Refresh P7 (V1): the drawing and the bags stand open; «More» is a card of rows (folder,
  // photos, compare, profile and settings, ideas), each opens in place.
  let folderOpen = $state(false);
  let profileOpen = $state(false);
  // «&open=1» (a sheet's «Folder», «enter» or «Change values») lands on the folder and the measures.
  $effect(() => {
    if (!more) return;
    folderOpen = true;
    profileOpen = true;
    onopened?.();
    // Bugfix Dateneingabe: and shows them, instead of the top of the page far above them
    let tries = 0;
    const show = () => {
      const el = document.getElementById('vk-more');
      if (el) el.scrollIntoView({ block: 'start' });
      else if (tries++ < 20) setTimeout(show, 50);
    };
    setTimeout(show, 0);
  });
  // Impeccable Runde 2 (Velos 2): «4 bikes · next trip: {trip} on {date} with {bike}»; without a trip only the count.
  const nextRide = $derived.by(() => {
    const n = nextTrip(($tripsQ ?? []).filter((x) => x.bikeId));
    const b = n ? bikes.find((x) => x.id === n.bikeId) ?? null : null;
    return n && b ? { trip: n, bike: b } : null;
  });
  const sub = $derived([tn(bikes.length, '{n} bike', '{n} bikes'), nextRide ? t('next trip: {trip} on {date} with {bike}', { trip: nextRide.trip.title ?? '', date: dateOf(nextRide.trip.startDate), bike: nextRide.bike.name }) : ''].filter(Boolean).join(' · '));

  /* ---------- Velos 2: the maker and warranty link in the bike's «…» ---------- */
  watchLinks();
  const makerSlot = $derived(bike ? slotOf('x9', bike.id) : null);
  const maker = $derived(makerSlot ? skLinks.own[makerSlot] ?? null : null);
  const makerOn = $derived(linkOn(skLinks.off, 'x9'));
  let makerEdit = $state(false);
  let linkNote = $state(null);
  function hideMaker() {
    setLinkOff('x9', true);
    linkNote = { text: t('«{name}» no longer shown', { name: t(LINKS.x9.label) }), undo: () => setLinkOff('x9', false) };
  }
  const bikeMenu = $derived(
    bike
      ? [
          { name: t('Edit|bike'), explain: t('Name, type, weight and more'), icon: Pencil, run: () => (bikeDialog = { bike }) },
          ...(makerOn
            ? [
                maker
                  ? { name: t('Change the maker and warranty link'), explain: maker.url, icon: ShieldCheck, run: () => (makerEdit = true) }
                  : { name: t('Enter a link to maker and warranty'), explain: t('Warranty and recalls · your own link'), icon: ShieldCheck, run: () => (makerEdit = true) },
                { name: t('Don’t show «{name}» any more', { name: t(LINKS.x9.label) }), explain: t('Comes back under Me › Appearance'), icon: EyeOff, run: hideMaker },
              ]
            : []),
        ]
      : [],
  );
  const chf = (n) => `CHF ${Math.round(n).toLocaleString('de-CH')}`;

  /* ---------- setup photos (Noah, 4.10.2026, answers 1a-6a) ---------- */
  const gallery = $derived(bikePhotos(bike, $photosQ ?? []));
  // v0.73.0 «Fotoband»: «Album ›» on Today opens this fold once for its bike.
  let photosOpen = $state(false);
  let photosEl = $state();
  $effect(() => {
    if (!bike?.id || !photosEl) return;
    let wish = null;
    try {
      wish = localStorage.getItem('bikes.photos');
    } catch {
      return;
    }
    if (wish !== bike.id) return;
    take('bikes.photos');
    photosOpen = true;
    queueMicrotask(() => photosEl?.scrollIntoView({ block: 'start' }));
  });
  const bikeTrips = $derived(bike ? ($tripsQ ?? []).filter((t) => t.bikeId === bike.id).sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? '')) : []);
  const tripTitle = (id) => ($tripsQ ?? []).find((t) => t.id === id)?.title ?? null;
  let shown = $state(null); // index in the gallery
  let timeline = $state(false);
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
        await db.photos.put({ id, bikeId: bike.id, name: file.name.replace(/\.[^.]+$/, '').slice(0, 40) || 'Setup', tripId: null, main: !gallery.length && saved === 0, data, day: localDay(), addedAt: new Date().toISOString() });
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
  // v0.72.0 «Feinschliff» (Umbenennen 1a): the same rename sheet as everywhere (was the browser's prompt()).
  let photoRename = $state(null);
  const rename = (p) => (photoRename = p);
  async function renamePhoto(name) {
    const p = photoRename;
    const next = name.slice(0, 60);
    await db.photos.update(p.id, { name: next });
    offerRename(next, () => db.photos.update(p.id, { name: p.name }));
  }
  const setTrip = (p, tripId) => db.photos.update(p.id, { tripId: tripId || null });
  async function removePhoto(p) {
    if ((await askDelete({ title: t('Remove the photo "{name}"?', { name: p.name }), text: t('You can bring it back for 4 seconds afterwards.'), label: t('Remove') })) !== 'delete') return;
    const bikeId = bike.id;
    const ok = await deleteWithUndo({
      run: async () => {
        if (p.stored) {
          const rec = await db.photos.get(p.id);
          await db.photos.delete(p.id);
          return { rec };
        }
        const photo = (await db.bikes.get(bikeId))?.photo ?? null;
        await db.bikes.update(bikeId, { photo: null });
        return { photo };
      },
      undo: (was) => (was.rec ? db.photos.put(was.rec) : was.photo ? db.bikes.update(bikeId, { photo: was.photo }) : null),
      text: t('"{name}" removed.', { name: p.name }),
      name: p.name,
    });
    if (ok && shown != null && shown >= gallery.length - 1) shown = gallery.length > 1 ? gallery.length - 2 : null;
  }

  let editMounts = $state(false); // show all places and let the user switch mounts on and off
  let activeSlot = $state(null);
  let sheet = $state(null); // the place whose bag is being chosen
  let dialog = $state(null); // { bag } or { bag: null, slot }
  let bikeDialog = $state(null); // { bike } or { bike: null }
  // VS3/VS4 (Noah 14.10.2026 «1a 2b 3a»): the order window, and after a new bike the question «New standard bike?»
  let standardOpen = $state(false);
  let newStd = $state(null); // { id, standard } of a bike just added while there were bikes before
  const newBike = $derived(newStd && bikes.find((b) => b.id === newStd.id));
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

  /*
   * Regeln der App C b (Noah 14.10.2026, mockup C2): the pencil next to the bike's name opens «Bike details»
   * right away, the name and everything else in one window (was: only «Rename bike», v0.72.0).
   */

  function chooseBike(id) {
    onbike?.(id);
    activeSlot = null;
    sheet = null;
  }

  // WS5 «Wieder sichtbar» (Noah 14.10.2026 «ws1-ws7 freigeben»): what the bike costs, back in its head
  // line (since 0.107 only in «Ausstattung»): the workshop this year and per 1000 km, when known.
  const costLine = $derived.by(() => {
    if (!profile) return '';
    const y = profile.year && profile.year.unknown < profile.year.visits && profile.year.chf > 0 ? t('{chf} this year', { chf: chf(profile.year.chf) }) : '';
    const per = profile.per?.chf != null ? t('{chf} per 1000 km', { chf: chf(profile.per.chf) }) : '';
    return [y, per].filter(Boolean).join(' · ');
  });
  const weightWords = $derived(bike ? (bikeKind === 'missing' ? t('not weighed') : `${bikeKind === 'estimate' ? '~' : ''}${formatWeight(bike.weightG)} ${bikeKind === 'estimate' ? t('estimate') : t('measured')}`) : '');
</script>

<div class="setup">
  {#if !bikes.length && $bikesQ}
    <!-- v0.127.0 A-U2: the one empty building block -->
    <Empty icon={BikeIcon} title={t('No bikes yet')} text={t('Add your bike, or bring your data along with a backup.')} action={{ label: t('Add bike'), onclick: () => (bikeDialog = { bike: null }) }}>{t('Or bring your data along from a backup:')} <a href="#/me/data">{t('Me › Data and backup')}</a>.</Empty>
  {:else if bike}
    <SetupBand {bikes} {bike} {setup} {sub} kind={bikeKind} cost={costLine} due={care?.rows.length ?? 0} careHref={bikesHash({ tab: 'care', bike: bike.id, open: true })} onbike={chooseBike} onadd={() => (bikeDialog = { bike: null })} onedit={() => (bikeDialog = { bike })} onorder={() => (standardOpen = true)} menu={bikeMenu} link={makerOn && maker ? { kind: 'x9', url: maker.url, name: maker.name || t(LINKS.x9.label) } : null} />

    <!-- Design-Refresh P7 «Velo» (V1): the drawing and the bags left; care and equipment, «Import rides»
         and «More» right; on a phone one after the other. Everything from «Velo kurz» stays. -->
    <div class="cols">
      <div class="main" id="vk-bags">
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

        <section class="std" aria-labelledby="std-h">
          <div class="vh">
            <div class="vh-t">
              <h2 id="std-h">{editMounts ? t('Mounts') : t('Bags')}</h2>
              <p class="vh-s">{editMounts ? t('{n} of {all} places', { n: bike.slots.filter((k) => MOUNTS.some((m) => m.key === k)).length, all: MOUNTS.length }) : [t('Standard for every new trip on this bike'), tn(setup.bagCount, '{n} bag', '{n} bags'), setup.bagCount && setup.unweighed < setup.bagCount ? formatWeight(setup.bagsG) : ''].filter(Boolean).join(' · ')}</p>
            </div>
            {#if !editMounts}<button type="button" class="vh-a" onclick={() => (dialog = { bag: null })}>{t('Add bag')}<ChevronRight size={16} aria-hidden="true" /></button>{/if}
          </div>
          <div class="card vlist">
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
            <div class="vfold">{@render yourBags()}</div>
          </div>
        </section>
      </div>

      <div class="side">
        <section class="vsec" aria-labelledby="pa-h">
          <div class="vh"><div class="vh-t"><h2 id="pa-h">{t('Care and equipment')}</h2><p class="vh-s num">{[bike.name, bike.km != null ? `${num(bike.km)} km` : '', bike.weightG ? `${bikeKind === 'estimate' ? '~' : ''}${formatWeight(bike.weightG)}` : ''].filter(Boolean).join(' · ')}</p></div></div>
          <ul class="card vlist vk-rows" aria-label={t('{bike} at a glance', { bike: bike.name })}>
            <!-- Impeccable Runde 2 (Velos 3): with something due, «Bike care» is the one main button of the page;
                 otherwise a calm row, «… parts without a start value · enter now» when data is missing. -->
            <li>
              {#if care?.rows.length}
                <a class="btn hi vk-care" href={bikesHash({ tab: 'care', bike: bike.id, open: true })}><Wrench size={18} aria-hidden="true" />{tn(care.rows.length, 'See care · {n} due', 'See care · {n} due')}</a>
                <p class="vk-care-s">{careWords?.text}</p>
              {:else}
                <a class="vk-row" href={bikesHash({ tab: 'care', bike: bike.id, open: true })}><span class="ib care"><Wrench size={18} aria-hidden="true" /></span><span class="m"><b>{t('Bike care')}</b><small>{care?.gaps && !care.kmMissing ? tn(care.gaps, '{n} part without a start value · enter now', '{n} parts without a start value · enter now') : careWords?.text || careWords?.tag || ''}</small></span><ChevronRight class="chev" size={18} aria-hidden="true" /></a>
              {/if}
            </li>
            <li>
              <SetupFold flat icon={Package} label={t('Always mounted')} summary={[(bike.fixtures ?? []).map((f) => (itemsById[f] ? nameOf(itemsById[f]) : f)).join(', ') || t('nothing'), weightWords].join(' · ')}>
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
            </li>
            <!-- «Verschleiss» (Noah 20.10.2026, 5a): how worn the parts are, one calm row to the page «Wear» -->
            <li><a class="vk-row" href={bikesHash({ tab: 'care', view: 'wear', bike: bike.id })} data-wear-row={wearSum?.state ?? 'unknown'}><span class="ib"><Gauge size={18} aria-hidden="true" /></span><span class="m"><b>{t('Wear|page')}</b><small>{wearLine}</small></span><ChevronRight class="chev" size={18} aria-hidden="true" /></a></li>
            <li><a class="vk-row" href={bikesHash({ tab: 'compare', bike: bike.id })}><span class="ib"><Scale size={18} aria-hidden="true" /></span><span class="m"><b>{t('Equipment|tab')}</b><small>{t('Measures, parts, geometry')}</small></span><ChevronRight class="chev" size={18} aria-hidden="true" /></a></li>
          </ul>
        </section>

        <!-- «Garmin-Seiten» GA-A1 (Noah 14.10.2026 «GA-A1–A3 freigegeben»): the bike's Garmin pages -->
        <GarminCard {bike} />

        <!-- the coordinator 11.10.2026: Noah could not find the Strava import (it was three taps deep in Care).
             Impeccable Runde 2 (Velos 3): a normal button; the km mostly come by themselves. -->
        <div class="card vk-imp">
          <a class="btn vk-go" href={bikesHash({ tab: 'care', bike: bike.id, view: 'import' })}><Route size={18} aria-hidden="true" />{t('Import rides')}</a>
          <p class="vk-imp-s">{t('Strava file or GPX · counts the km for every part')}</p>
          <!-- WS5: Strava right here, one tap to connect (or to see it, when connected) -->
          <a class="vk-row vk-strava" href={bikesHash({ tab: 'care', bike: bike.id, view: 'strava' })}><span class="ib"><RefreshCw size={18} aria-hidden="true" /></span><span class="m"><b>Strava</b><small>{strava.key ? t('connected: new rides come by themselves') : t('connect: new rides come by themselves')}</small></span><ChevronRight class="chev" size={18} aria-hidden="true" /></a>
        </div>

        <section class="vsec" aria-labelledby="vm-h">
          <div class="vh"><div class="vh-t"><h2 id="vm-h">{t('More')}</h2></div></div>
          <div class="card vlist vm" id="vk-more">
            <!-- v0.69.0 «Velo-Blätter» (Noah V1 a, mockup a-mappe): the bike's folder of sheets. -->
            <SetupFold flat cls="vm-folder" icon={BookOpen} bind:open={folderOpen} label={t('Folder|sheets')} summary={t('Bike pass, service plan …')}>
              <SheetFolder {bike} />
            </SetupFold>
            <div bind:this={photosEl}></div>
            <SetupFold flat icon={ImageIcon} bind:open={photosOpen} label={t('Photos')} summary={`${gallery.length ? tn(gallery.length, '{n} photo', '{n} photos') : t('no photo yet')}${gallery.find((p) => p.main) ? ` · ${t('in Pack: {name}', { name: gallery.find((p) => p.main).name })}` : ''}`}>
              <div class="gal" aria-label={t('Photos of the {bike}', { bike: bike.name })}>
                {#each gallery as p, n (p.id)}
                  <button type="button" class="th" class:main={p.main} onclick={() => (shown = n)} aria-label={p.main ? t('Open photo {name}, shown in Pack', { name: p.name }) : t('Open photo {name}', { name: p.name })}>
                    <img src={p.src} alt="" loading="lazy" />
                    <span>{p.name}</span>
                  </button>
                {/each}
                <label class="th add">{adding ? t('Reading…') : t('+ Photo')}<input type="file" accept="image/*" multiple onchange={addPhotos} hidden disabled={adding} /></label>
                <CameraButton onchange={addPhotos} disabled={adding} />
              </div>
              <p class="note">{t('Open a photo to show it in Pack, rename it or keep it for one trip.')} {#if gallery.length}<button type="button" class="btn btn-link" onclick={() => (timeline = true)} data-setup-timeline>{t('As a timeline by date')}</button>{/if}</p>
              <!-- v0.27.0 (AP22): below the gallery, so a long message wraps instead of scrolling sideways. -->
              {#if photoMsg}<p class="photo-err" role="alert">{photoMsg}</p>{/if}
            </SetupFold>
            <!-- v0.48.0 (Noah): all bikes' parts, values and geometry side by side, two taps from Bikes. -->
            <a class="vk-row cmplink" href={bikesHash({ tab: 'compare', view: 'all' })}><span class="ib"><ArrowLeftRight size={18} aria-hidden="true" /></span><span class="m"><b class="cl">{t('Compare bikes')}</b><small class="sum">{t('Fit, parts, values, geometry')}</small></span><ChevronRight class="chev" size={18} aria-hidden="true" /></a>
            <SetupFold flat cls="vm-profile" icon={MoreHorizontal} bind:open={profileOpen} label={t('Profile and settings')} summary={t('Rider {weight} · rear wheel hint over {pct} %', { weight: $riderQ?.value ? formatWeight($riderQ.value) : t('not set'), pct: $rearQ?.value ?? 60 })}>
              {#if profile}
                <dl class="profile" aria-label={t('Profile of the {bike}', { bike: bike.name })}>
                  <div><dt>km</dt><dd class="num">{profile.km == null ? t('not set') : num(profile.km)}{#if profile.kmDate}<small>{t('set {date}', { date: dateOf(profile.kmDate) })}</small>{/if}</dd></div>
                  <div><dt>{t('Workshop {year}', { year: today.slice(0, 4) })}</dt><dd class="num">{profile.year ? (profile.year.unknown === profile.year.visits ? t('cost unknown') : chf(profile.year.chf)) : 'CHF 0'}{#if profile.year}<small>{tn(profile.year.visits, '{n} visit', '{n} visits')}</small>{/if}</dd></div>
                  <div><dt>{t('Per 1000 km')}</dt><dd class="num">{profile.per?.chf != null ? chf(profile.per.chf) : '–'}<small>{profile.per?.chf != null ? t('over {km} km', { km: num(profile.per.km) }) : profile.per?.wait ? t('after {km} more km', { km: num(profile.per.wait) }) : t('needs km at a visit')}</small></dd></div>
                  <div class:late={profile.next[0]?.late}><dt data-sign={profile.next[0]?.late ? signFor('warn') : null}>{profile.next[0]?.late ? t('Due now') : t('Next')}</dt><dd>{#each profile.next as n (n.name)}<span>{n.name}<small>{n.detail}</small></span>{:else}<span>{t('nothing recorded')}</span>{/each}</dd></div>
                  <div><dt>{t('Last workshop')}</dt><dd>{#if profile.last}<span>{dateOf(profile.last.date)}<small>{profile.last.shop}{profile.last.chf != null ? ` · ${chf(profile.last.chf)}` : ''}</small></span>{:else}<span>{t('none yet')}</span>{/if}</dd></div>
                </dl>
                <p class="to-care"><a class="link" href={bikesHash({ tab: 'care', bike: bike.id, open: true })}>{t('Bike care for the {bike}', { bike: bike.name })}</a></p>
              {/if}
              <!-- v0.40.0 (design check): "Who works on it" only once there is something in it (WhoCard). -->
              <WhoCard bike={view} {visits} {tasks} year={today.slice(0, 4)} per={profile?.per} next={forShop} onorder={() => (orderOpen = true)} />
              <!-- v0.65.0 «Velo-Masse» (Noah): the fit and setup numbers. -->
              {#key bike.id}<FitCard {bike} />{/key}
              <!-- Paket L2 «Sitzposition» (Noah 19.10.2026 «4a»): the measured sitting position with its history -->
              {#key bike.id}<SitPosCard {bike} />{/key}
              {@render settings()}
            </SetupFold>
            <!-- v0.25.1 (Noah 2b): "Was geil wäre", the bike's own ideas -->
            {#key bike.id}<IdeasFold {bike} flat />{/key}
          </div>
        </section>
      </div>
    </div>
  {/if}
  {#if !bike}{@render settings()}{@render yourBags()}{/if}
</div>

{#if makerEdit && bike}
  <OwnLinkSheet title={t('Enter a link')} context={bike.name} value={maker} name={t(LINKS.x9.label)} onsave={(v) => setOwnLink(makerSlot, v)} onremove={maker ? () => removeOwnLink(makerSlot) : null} onoff={hideMaker} onclose={() => (makerEdit = false)} />
{/if}
<SkToast bind:note={linkNote} />

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
                    <span class="nm">{#if bag}<b>{bagName(bag.name)}</b>{:else}<b class="quiet">{t('empty · choose a bag')}</b>{/if}<small>{t(s.name)} · {t(s.where)}</small></span>
                    {#if bag}<span class="w num">{[bag.volumeL ? formatVolume(bag.volumeL) : '', bagWeight(bag) != null ? formatWeight(bagWeight(bag)) : ''].filter(Boolean).join(' · ')}{#if bagWeight(bag) == null}<span class="nw" title={t('not weighed')}><Scale size={14} aria-hidden="true" /><span class="sr">{t('not weighed')}</span></span>{/if}</span>{/if}
                    <ChevronRight class="chev" size={18} aria-hidden="true" />
                  </button>
                  {#if other}
                    <p class="trip-bag">{tripOn.title}: {other.none ? t('no bag here') : `${bagName(other.name)}${other.volumeL ? ` ${formatVolume(other.volumeL)}` : ''}`}{#if !other.none}<button type="button" class="link" onclick={() => setBag(s.key, other.id)}>{t('Use as standard')}</button>{/if}</p>
                  {/if}
{/snippet}

{#snippet settingsIn()}
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
{/snippet}

<!-- Settings and the bag list are there also without a bike. With a bike the settings live in «Profile and settings». -->
{#snippet settings()}
  {#if bike}
    <h3 class="set-h">{t('Settings')}</h3>
    {@render settingsIn()}
  {:else}
    <SetupFold icon={User} label={t('Settings')} summary={t('Rider {weight} · rear wheel hint over {pct} %', { weight: $riderQ?.value ? formatWeight($riderQ.value) : t('not set'), pct: $rearQ?.value ?? 60 })}>
      {@render settingsIn()}
    </SetupFold>
  {/if}
{/snippet}

{#snippet yourBags()}
  <SetupFold flat={!!bike} icon={Briefcase} label={t('Your bags')} summary={tn(bags.length, '{n} bag or cage', '{n} bags and cages')}>
    <div class="bl-h">
      <p class="note">{t('Every bag, cage and backpack. The weight comes from the linked gear item or from the bag itself.')}</p>
      <button type="button" class="btn" onclick={() => (dialog = { bag: null })}>{t('Add bag')}</button>
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
      <Empty icon={Briefcase} text={t('No bags yet. Import your data, or add a bag.')} />
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

{#if standardOpen}
  <BikeOrderSheet {bikes} onclose={() => (standardOpen = false)} />
{/if}
{#if newBike && !bikeDialog}
  <NewStandardSheet bike={newBike} standard={newStd.standard} {bikes} onclose={() => (newStd = null)} />
{/if}
{#if bikeDialog}
  <BikeDialog bike={bikeDialog.bike} {bikes} oncreated={(id) => { const others = bikes.filter((b) => b.id !== id); newStd = others.length ? { id, standard: others[0] } : null; onbike?.(id); }} onsaved={(id) => onbike?.(id)} onclose={() => (bikeDialog = null)} />
{/if}

{#if photoRename}
  <RenameSheet kicker={t('Photo')} title={t('Rename photo')} value={photoRename.name} hint={t('Name of this photo, e.g. "Hope 2026"')} onsave={renamePhoto} onclose={() => (photoRename = null)} />
{/if}

{#if dialog}
  <BagDialog bag={dialog.bag} slot={dialog.slot ?? null} {items} {bags} {bikes} onclose={() => (dialog = null)} />
{/if}

{#if orderOpen && order && forShop?.rows.length}
  <OrderDialog order={{ ...order, rows: forShop.rows }} bike={view} trip={orderTrip} bikeNames={Object.fromEntries(bikes.map((b) => [b.id, b.name]))} onclose={() => (orderOpen = false)} />
{/if}

{#if timeline && bike}<SetupPhotos {bike} onclose={() => (timeline = false)} />{/if}
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
  .cols,
  .main,
  .side {
    min-width: 0;
  }
  @media (min-width: 1000px) {
    .cols {
      display: grid;
      grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
      gap: 24px;
      align-items: start;
    }
  }
  /* Design-Refresh P7 (V1): a section title with its quiet line above each card, an action right. */
  .vh {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 4px 12px;
    margin: 0 2px 10px;
  }
  .vh-t {
    min-width: 0;
  }
  .vh h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.25 var(--font-body);
    color: var(--ink);
  }
  .vh-s {
    margin: 2px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
    overflow-wrap: break-word;
  }
  .vh-a {
    position: relative;
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 var(--fs-small) / 1.3 var(--font-body);
    cursor: pointer;
  }
  .vh-a:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .vsec,
  .std {
    margin: 0 0 24px;
  }
  /* A card of rows: the rows divided by a quiet line. */
  .vlist {
    list-style: none;
    margin: 0;
    padding: 4px 16px;
  }
  .vlist > li + li,
  .vm > :global(* + *),
  .vlist .vfold {
    border-top: 1px solid var(--line);
  }
  .vm > :global(div:empty) {
    display: none;
  }
  .vm > :global(div:empty + *) {
    border-top: 0;
  }
  .vk-row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 60px;
    padding: 8px 0;
    box-sizing: border-box;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
  }
  .vk-row:visited {
    color: var(--ink);
  }
  @media (hover: hover) {
    .vk-row:hover b {
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  }
  .vk-row .ib {
    display: inline-grid;
    place-items: center;
    width: 34px;
    height: 34px;
    flex: none;
    border-radius: var(--radius);
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .vk-row .m {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }
  .vk-row .m b {
    font-weight: 500;
    line-height: 1.3;
  }
  .vk-row .m small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.35;
    overflow-wrap: break-word;
  }
  .vk-row :global(.chev) {
    flex: none;
    color: var(--ink-3);
  }
  .vk-imp {
    display: grid;
    gap: 10px;
    margin: 0 0 24px;
  }
  .vk-go {
    width: 100%;
    box-sizing: border-box;
  }
  .vk-care {
    width: 100%;
    box-sizing: border-box;
    margin: 12px 0 0;
  }
  .vk-care-s {
    margin: 6px 0 12px;
    font-size: var(--fs-small);
    color: var(--ink-3);
    overflow-wrap: break-word;
  }
  .vk-imp-s {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .vk-strava {
    border-top: 1px solid var(--line);
    padding-top: 10px;
  }
  .draw {
    padding: 12px;
    margin-bottom: 24px;
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
    font-size: var(--fs-small);
  }
  .mountbtn {
    min-height: 44px;
  }
  .worn-h {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin: 0;
    padding: 12px 0 2px;
    border-top: 1px solid var(--line);
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
  }
  .worn-h .r {
    margin-left: auto;
    font-weight: 400;
    color: var(--ink-3);
  }
  .slot-h {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin: 0 0 4px;
    line-height: 1.25;
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
    padding: 8px 0;
    border: 0;
    border-radius: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
  }
  button.row {
    cursor: pointer;
  }
  @media (hover: hover) {
    button.row:hover b {
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  }
  .slots li.active .row {
    background: var(--hi-soft);
  }
  .ibox {
    flex: none;
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: var(--radius);
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
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .nm b {
    font-weight: 500;
  }
  .quiet {
    color: var(--ink-3);
  }
  .w {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--fs-small);
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
    margin: 0 0 8px 46px;
    font-size: var(--fs-small);
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .none {
    padding: 12px 0;
    font-size: var(--fs-small);
  }
  .note {
    margin: 8px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .msg {
    font-weight: 600;
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
    background: var(--hi);
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
    font-size: var(--fs-small);
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
  .more-d {
    display: inline-block;
    margin-top: 10px;
    min-height: 44px;
    color: var(--accent);
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
    font-size: var(--fs-small);
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
    padding: 2px 2px 2px 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .chip button {
    min-width: 36px;
    min-height: 36px;
    border: 0;
    background: none;
    font-size: var(--fs-sub);
    cursor: pointer;
    color: var(--ink-2);
  }
  .sel.mini {
    width: auto;
    max-width: 100%;
    font-size: var(--fs-small);
  }
  .profile {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 8px;
    margin: 0;
  }
  .profile > div {
    background: var(--paper-2);
    border-radius: var(--r-ctl);
    padding: 10px 12px;
    min-width: 0;
  }
  .profile .late {
    box-shadow: inset 3px 0 0 var(--bad);
  }
  .profile dt {
    font-size: var(--fs-tiny);
    font-weight: 600;
    color: var(--ink-3);
  }
  .profile dd {
    margin: 2px 0 0;
    font-weight: 600;
    font-size: var(--fs-body);
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
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .to-care {
    margin: 10px 0 14px;
    font-size: var(--fs-small);
  }
  .set-h {
    margin: 16px 0 8px;
    font: 600 var(--fs-small) / 1.3 var(--font-body);
    color: var(--ink-2);
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
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink-2);
    font: 500 var(--fs-tiny) var(--font-body);
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
    font-size: var(--fs-small);
    text-align: center;
  }
  .photo-err {
    margin: 8px 0 0;
    overflow-wrap: break-word;
    color: var(--bad);
    font-size: var(--fs-small);
  }
  .lbtn,
  .lsel {
    min-height: 44px;
    padding: 0 12px;
    border: 1.5px solid #f4f6f2;
    border-radius: var(--r-ctl);
    background: none;
    color: #f4f6f2;
    font: 600 var(--fs-small) var(--font-body);
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
  /* The bag list: a quiet section header, numbers right-aligned in one column. */
  .slot-h {
    margin: 16px 0 0;
    padding: 6px 10px;
    border-radius: var(--radius);
    background: var(--paper-2);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .slot-h small {
    font-size: var(--fs-tiny);
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
    font-size: var(--fs-small);
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
