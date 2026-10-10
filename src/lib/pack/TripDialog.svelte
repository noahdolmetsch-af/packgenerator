<script>
  import DateInput from '../ui/DateInput.svelte';
  import { backClose } from '../ui/backclose.js';
  import '../trip/trip.css';
  import { tick } from 'svelte';
  import { liveQuery } from 'dexie';
  import { Check, ChevronRight } from '@lucide/svelte';
  import { db } from '../db.js';
  import { newTrip, lastTripOn, switchBike, WX_PRESETS, bagItemIds, touched } from '../trips.js';
  import { newBikeRecord } from '../bikes.js';
  import { contextSummary, startEntries, applyContext, hasContext, contextSets, dropNightOnly, NIGHT_CHOICES, nightFields, nightName, NIGHT_BLOCKS, rideSets, OFFER_ONLY, hasTent } from '../context.js';
  import { ridesIntoDark } from '../blockplan.js';
  import { isEvent } from '../care.js';
  import { tripFromTemplate, templateDefaults, tplDomain, templateParts } from '../templates.js';
  import { t, tn, num, nameOf, locale } from '../i18n.svelte.js';
  import { TRIP_DOMAINS, DOMAIN, BIKEPACKING, domainName, lastDomain, rememberDomain, newPackTrip, lastTripIn, readyKey, inDomain, hasBike } from '../domains.js';
  import { isInventory, knownWeight, formatWeight } from '../gear.js';
  import { SETS_KEY, allSets, addSetEntries, tripSlot, entriesWeight, isBlockTip, templateBlocks, blocksLine, blockLabel } from '../sets.js';
  import { localDay } from '../localday.js';
  import { autoKeep, leaveWindow } from '../drafts.js';
  import { rideName, rideDate, lastBikeId, buildBikeTrip, fetchHomeForecast, forecastPreset, homeOf, pickWxChip, noWx } from '../dayride.js';

  /**
   * trip: the trip to edit, or null for "New trip".
   * A new trip is a copy of the last trip with the same bike (decision 5a),
   * or starts from a template (4.10.2026) or from the standard set.
   * v0.21.0 (package 5): a new trip asks the area first (domain; default the last one used on this
   * device). Areas without a bike skip the bike and templates; their bags come with the area.
   * v0.25.0 (M3, Noah 1a–10): for a bike trip the dialog asks what kind of trip it is (hours per day,
   * overnight stay, cooking, weather, event) and shows live what the packing list will be
   * (context.js). Editing a trip applies a changed context at once through onchange (Pack's
   * change(), so Undo works, 9b).
   * v0.30.0 (Noah, finding 2): one window for a new bike trip, top to bottom: bike chips, when and
   * how long (the night from 2 days on), the standard set as a card, what the weather brings by
   * itself, building blocks to add (Rain, Light, own blocks …), template or last trip folded away,
   * and "Create trip · n items". Standard + Rain = 4 clicks (+, Plan a trip, Rain, Create).
   * bags: the containers (Pack's), so a block skips the bags themselves like Pack's block chips.
   */
  let { trip, trips: allTrips, bikes, items, bags = [], templates = [], startFrom = 'standard', domain = null, defaultBikeId = null, onclose, oncreated, onchange = null } = $props();

  // svelte-ignore state_referenced_locally
  const isNew = !trip;
  /*
   * v0.35.0 (AP29, Noah 4b + 5a): nothing typed is lost. As soon as a name is typed, the new trip is
   * saved (autoId) and every further choice here updates it; closing the window keeps it (Pack then
   * opens it, with Undo). Only "Discard" takes back the trip this window made (it has nothing else yet).
   * The dialog's own trip is left out of `trips`, so "Copy the last trip" never copies itself.
   */
  let autoId = $state(null);
  let autoNow = null; // the trip's id and creation time, fixed at the first save
  let ended = false; // "Create trip" or "Discard": closing does nothing more
  const trips = $derived(allTrips.filter((x) => x.id !== autoId));
  // svelte-ignore state_referenced_locally
  let draft = $state(
    trip
      ? { title: trip.title, startDate: trip.startDate ?? '', days: trip.days ?? 1, bikeId: trip.bikeId ?? bikes[0]?.id }
      : // v0.25.1 (Noah 2a): a new trip starts filled in: start date (today, after 14:00 tomorrow) and
        // the bike of the open or last trip; the name follows below. "Create trip" works untouched.
        { title: '', startDate: rideDate(), days: 1, bikeId: bikes.some((b) => b.id === defaultBikeId) ? defaultBikeId : lastBikeId(trips, bikes) ?? bikes[0]?.id },
  );
  // v0.25.1 (Noah 2a): the name is made from bike, date and days until Noah types in it.
  let autoName = $state(isNew);
  // v0.25.0 (M3): the trip's context. An older trip without an overnight value shows none chosen.
  // svelte-ignore state_referenced_locally
  const was = {
    hours: trip?.hours != null ? String(trip.hours) : '',
    overnight: trip?.overnight ?? null,
    cook: !!trip?.cook,
    min: trip?.wx?.min ?? null,
    max: trip?.wx?.max ?? null,
    rain: trip?.wx?.rain ?? 'none',
    event: trip ? isEvent(trip) : false,
    // v0.66.0 (Noah 8a): Bivouac + tent; a new trip starts with the tent (as the old "Outdoor (tent, bivvy)").
    tent: trip?.tent !== false, // an older outdoor trip (no field) had the tent
  };
  let ctx = $state({ ...was });
  const days = $derived(Math.max(1, Number(draft.days) || 1));
  // Noah 1a: None for 1 day, Outdoor from 2 days on, until one is chosen.
  // v0.30.0 (Noah, finding 2): a new trip asks for the night only from 2 days on; one day has none.
  const night = $derived(isNew && days === 1 ? 'none' : ctx.overnight ?? (isNew ? (days > 1 ? 'outdoor' : 'none') : null));
  const hoursNum = $derived(ctx.hours.trim() === '' ? null : Number(ctx.hours.replace(',', '.')));
  const hoursOk = $derived(hoursNum === null || (hoursNum >= 0.5 && hoursNum <= 24));
  const wet = $derived(ctx.rain === 'showers' || ctx.rain === 'rain');
  const wxOut = $derived(ctx.min != null || ctx.max != null || ctx.rain !== 'none' ? { min: ctx.min, max: ctx.max, rain: ctx.rain } : null);
  // v0.47.3 (Noah: «Kühl + Regen» brought nothing): a chip sets, it never takes off (dayride.js pickWxChip).
  function pickWx(choice) {
    wxTouched = true; // v0.25.1: Noah's own choice; the forecast leaves it alone
    Object.assign(ctx, pickWxChip(ctx, choice));
  }
  /** The context fields to store (only for bike trips). */
  // v0.66.0 (Noah 7a, 9a): dark: the ride goes into the dark (Light comes); sets: the ride blocks taken off here.
  const ctxFields = () => ({ hours: hoursOk ? hoursNum : null, overnight: night, cook: night === 'outdoor' && ctx.cook, tent: night === 'outdoor' && ctx.tent, wx: wxOut, event: ctx.event, dark, ...(isNew && off.length ? { sets: Object.fromEntries(off.map((k) => [k, false])) } : {}) });
  // v0.66.0 (Noah 8a): the night as one choice: none, Bivouac, Bivouac + tent, Hotel/hut.
  const choice = $derived(night === 'outdoor' ? (ctx.tent ? 'tent' : 'bivy') : night === 'lodging' ? 'hotel' : night);
  function pickNight(key) {
    const f = nightFields(key);
    ctx.overnight = f.overnight;
    ctx.tent = f.tent;
  }
  // v0.66.0 (Noah 7a): Light comes by itself when the ride goes into the dark (sunset at the trip's or the home place).
  const homeQ = liveQuery(() => db.settings.get('homePlace'));
  const darkPlace = $derived(trip?.place ?? homeOf($homeQ?.value) ?? null);
  const dark = $derived(ridesIntoDark({ ...(trip ?? {}), startDate: draft.startDate, days, hours: hoursOk ? hoursNum : null }, darkPlace));
  // v0.66.0 (Noah 9a): the ride blocks the window suggests, taken off with a tap (a visible suggestion, never forced).
  let off = $state([]);
  // svelte-ignore state_referenced_locally
  let start = $state(startFrom);
  // v0.26.1 (AP18, Noah 17b): a template brings its days, riding hours, overnight stay (+ cooking) and
  // bike as the dialog's defaults; everything stays changeable here.
  function useTemplate(id) {
    const d = templateDefaults(templates.find((x) => x.id === id), bikes);
    if (d.days) draft.days = d.days;
    if (d.bikeId) draft.bikeId = d.bikeId;
    if (d.hours != null) ctx.hours = String(d.hours);
    if (d.overnight) (ctx.overnight = d.overnight), (ctx.cook = d.cook);
  }
  // svelte-ignore state_referenced_locally
  if (isNew) useTemplate(startFrom);
  // v0.39.0 (AP28): a template makes a trip of its own area (older templates: bikepacking).
  // svelte-ignore state_referenced_locally
  const startTpl = templates.find((x) => x.id === startFrom);
  // svelte-ignore state_referenced_locally
  let area = $state(startTpl ? tplDomain(startTpl) : DOMAIN[domain] && DOMAIN[domain].trip !== false ? domain : lastDomain());
  // v0.39.0 (Noah 6a): archived templates are not offered; only the ones of the chosen area.
  const areaTemplates = $derived(templates.filter((x) => !x.archivedAt && tplDomain(x) === area));
  const chosenTpl = $derived(templates.find((x) => x.id === start) ?? null);
  const byBike = $derived(isNew ? !!DOMAIN[area]?.bike : hasBike(trip));
  const fromArea = $derived(isNew && !byBike ? lastTripIn(area, trips) : null);
  const areaItems = $derived(items.filter((i) => isInventory(i) && inDomain(i, area)).length);
  // A template of another area does not fit: back to the standard (the area's items).
  // v0.28.0 (Noah 8.10.2026): a new trip starts with the standard set; templates are optional.
  $effect(() => {
    const tp = templates.find((x) => x.id === start);
    if (tp && tplDomain(tp) !== area) start = 'standard';
  });
  let error = $state('');
  let dialog;
  const bike = $derived(bikes.find((b) => b.id === draft.bikeId));
  const from = $derived(isNew && bike ? lastTripOn(bike.id, trips) : null);
  // L9: "Copy the last trip" is only offered with a last trip; without one the start is the standard set.
  $effect(() => {
    if (isNew && byBike && start === 'last' && !from) start = 'standard';
  });
  $effect(() => {
    if (autoName) draft.title = rideName({ bike: byBike ? bike?.name : '', label: byBike ? '' : t(domainName(area)), date: draft.startDate, days });
  });

  // v0.25.1 (Noah 3a): with a home place and the internet, the weather preset comes from the
  // forecast for the start date (short timeout; offline or failed: nothing happens). Once Noah
  // picks a weather himself, the forecast no longer changes it.
  let forecast = $state.raw(null);
  let wxTouched = $state(false);
  const fcWx = $derived(isNew && byBike ? forecastPreset(forecast, draft.startDate) : null);
  const fromForecast = $derived(!!fcWx && ctx.min === fcWx.min && ctx.max === fcWx.max && ctx.rain === fcWx.rain);
  $effect(() => {
    if (!isNew) return;
    let gone = false;
    db.settings.get('homePlace').then((r) => (homeOf(r?.value) ? fetchHomeForecast(r.value) : null)).then((fc) => !gone && fc && (forecast = fc)).catch(() => {});
    return () => (gone = true);
  });
  $effect(() => {
    if (!fcWx || wxTouched) return;
    ctx.min = fcWx.min;
    ctx.max = fcWx.max;
    ctx.rain = fcWx.rain;
  });

  $effect(() => {
    dialog.showModal();
  });

  /** The start of a new bike trip (template, last trip or standard set), before its context. */
  function startTrip() {
    const tpl = templates.find((x) => x.id === start);
    const base = tpl ? tripFromTemplate({ ...draft, bike }, tpl, items, Date.now(), setsValue) : newTrip({ ...draft, bike, overnight: night }, start === 'standard' ? [] : trips, items);
    return { base, tpl, fromCopy: !tpl && !!base.copiedFrom };
  }
  // v0.25.0 (M3): "Your packing list", live from the same pure functions as "Create trip".
  // v0.30.0 (Noah, finding 2): the start as a card (count, weight, names) and what comes by itself.
  const preview = $derived.by(() => {
    if (!isNew || !byBike || !bike) return null;
    const { base, tpl, fromCopy } = startTrip();
    const fields = ctxFields();
    const trip = { ...base, ...fields, hours: fields.hours ?? base.hours ?? null };
    const start = fromCopy ? startEntries(trip, items) : base.entries;
    const sum = contextSummary(start, trip, items);
    const list = dropNightOnly(start, trip, items).filter((e) => byId.has(e.itemId));
    const copied = fromCopy ? trips.find((x) => x.id === base.copiedFrom) : null;
    return { tpl, copied, ...sum, w: entriesWeight(list, items), names: list.map((e) => nameOf(byId.get(e.itemId))) };
  });
  const setName = (key) => sets.find((s) => s.key === key)?.label ?? key;
  const byId = $derived(new Map(items.map((i) => [i.id, i])));
  let namesOpen = $state(false);

  // v0.30.0 (Noah, finding 2): the new trip as "Create trip" will make it, live (count on the button).
  const built = $derived(isNew && byBike && bike ? buildBikeTrip({ draft: { ...draft }, bike, start, templates, trips, items, fields: ctxFields(), sets: setsValue }, 0) : null);
  // Building blocks that do not come by themselves (contextSets), with what each would add. The
  // same function as Pack's "Add material → Building blocks" (addSetEntries), same bags skipped.
  const setsQ = liveQuery(() => db.settings.get(SETS_KEY));
  const setsValue = $derived($setsQ?.value ?? []);
  const sets = $derived(allSets($setsQ?.value).map((s) => ({ ...s, label: s.builtIn ? s.name.replace(/^(Night|Nacht): /, '') : s.name })));
  const skip = $derived(new Set([...bagItemIds(bags), ...(bike?.fixtures ?? [])]));
  let picked = $state([]);
  const blocks = $derived.by(() => {
    if (!built) return [];
    const comes = contextSets({ overnight: night, cook: night === 'outdoor' && ctx.cook, tent: night === 'outdoor' && ctx.tent, dark, event: ctx.event });
    return sets
      .filter((s) => !comes.includes(s.key) && !OFFER_ONLY.includes(s.key))
      .map((s) => {
        const add = addSetEntries(built, items, s, { skip, slotOf: () => 'body' }).entries.slice(built.entries.length);
        const w = entriesWeight(add, items);
        return { ...s, n: add.length, weight: w.missing && !w.g ? formatWeight(null) : knownWeight(w.g, w.missing), names: add.map((e) => `${nameOf(byId.get(e.itemId))}${e.qty > 1 ? ` ${e.qty}×` : ''}`), tip: isBlockTip(s, { wet, max: ctx.max, night }) };
      })
      .filter((s) => s.n > 0 || picked.includes(s.key))
      .sort((a, b) => b.tip - a.tip); // the tips first
  });
  const chosen = $derived(blocks.filter((s) => picked.includes(s.key)));
  // v0.66.0 (Noah 9a): the ride blocks that come by themselves (Repair, Charging, Light in the dark,
  // Race on an event), as pressed chips: one tap takes one off for this trip.
  const rideChips = $derived.by(() => {
    if (!built) return [];
    return rideSets({ dark, event: ctx.event }).map((key) => {
      const s = sets.find((x) => x.key === key);
      const its = items.filter((i) => isInventory(i) && inDomain(i, BIKEPACKING) && i.sets?.includes(key) && !skip.has(i.id));
      const w = entriesWeight(its.map((i) => ({ itemId: i.id, qty: 1 })), items);
      return s ? { ...s, n: its.length, weight: w.missing && !w.g ? formatWeight(null) : knownWeight(w.g, w.missing) } : null;
    }).filter((s) => s && s.n > 0);
  });
  const flipOff = (key) => (off = off.includes(key) ? off.filter((k) => k !== key) : [...off, key]);
  // v0.66.0 (Noah 9a): Comfort, nice to have: its items only as unticked suggestions, one tap each.
  let comfortPicked = $state([]);
  const comfortItems = $derived(built ? items.filter((i) => isInventory(i) && inDomain(i, BIKEPACKING) && i.sets?.includes('comfort') && !skip.has(i.id) && !built.entries.some((e) => e.itemId === i.id)) : []);
  const flipComfort = (id) => (comfortPicked = comfortPicked.includes(id) ? comfortPicked.filter((x) => x !== id) : [...comfortPicked, id]);
  const tips = $derived(blocks.filter((s) => s.tip).length);
  const pick = (key) => (picked = picked.includes(key) ? picked.filter((k) => k !== key) : [...picked, key]);
  /** The trip with the chosen blocks, each into its usual bag (Pack: tripSlot with the trip's setup). */
  const withBlocks = (nt) => {
    const out = chosen.reduce((cur, s) => ({ ...cur, entries: addSetEntries(cur, items, s, { skip, slotOf: (i) => tripSlot(i, cur.setup) }).entries }), nt);
    const have = new Set(out.entries.map((e) => e.itemId));
    const extra = comfortPicked.filter((id) => !have.has(id) && byId.has(id)).map((id) => ({ itemId: id, slot: tripSlot(byId.get(id), out.setup), qty: 1, packed: false, src: 'set' }));
    return extra.length ? { ...out, entries: [...out.entries, ...extra] } : out;
  };
  const total = $derived(built ? withBlocks(built).entries.length : 0);

  // v0.30.0 (Noah, finding 2): when and how long as chips; the date field stays for any other day.
  const today = localDay();
  const tomorrow = localDay(new Date(Date.now() + 864e5));
  let daysInput = $state();
  const LENGTHS = [{ n: 1, name: 'Day ride' }, { n: 2, name: '2 days' }, { n: 3, name: 'More' }];
  // "More" chosen (the field stays while typing 2 or 1), or 3 and more days (also from a template).
  let moreWanted = $state(false);
  const moreDays = $derived(moreWanted || days >= 3);
  async function pickLength(n) {
    draft.days = n < 3 ? n : Math.max(3, days);
    moreWanted = n === 3;
    if (n === 3) {
      await tick();
      daysInput?.focus();
    }
  }
  // v0.40.0 (Noah 10a): the area and the other starts are folded.
  let areaOpen = $state(false);
  let startsOpen = $state(false);
  // Templates in words: "1 day · 2 h · Standard + Rain", else their item count.
  const stdIds = $derived(bike ? newTrip({ title: '', startDate: '', days: 1, bike, overnight: 'none' }, [], items, 0).entries.map((e) => e.itemId) : []);
  function tplLine(tp) {
    const d = templateDefaults(tp, bikes);
    const parts = [tn(d.days ?? 1, '{n} day', '{n} days')];
    if (d.hours != null) parts.push(t('{n} h', { n: num(d.hours) }));
    // v0.30.1 (Noah N10): always in blocks ("Standard + Rain + Light"), the rest as "+ 3 extra".
    // v0.32.0 (finding 5): "Standard + Rain + 2 extra" (blocksLine, the same words as the Templates page).
    // v0.39.0 (AP28): a linked template says its blocks itself.
    const linked = templateParts(tp, setsValue);
    parts.push(linked ? blocksLine(linked, blockLabel) : blocksLine(templateBlocks((tp.entries ?? []).map((e) => e.itemId), stdIds, sets, items), (s) => s.label));
    return parts.join(' · ');
  }
  let tplOpen = $state(false);
  function pickStart(id) {
    start = id;
    useTemplate(id);
    tplOpen = false;
    startsOpen = false;
  }

  // L9: "+ Add a bike" inside the dialog when there is no bike (it was a dead end: "Choose a bike." without a choice).
  let addingBike = $state(false);
  let bikeName = $state('');
  let bikeBusy = $state(false);
  let bikeInput = $state();
  $effect(() => {
    if (addingBike && bikeInput) bikeInput.focus();
  });
  async function saveBike() {
    const name = bikeName.trim();
    if (!name) return (error = t('Give the bike a name.'));
    if (bikeBusy) return;
    bikeBusy = true;
    try {
      const rec = newBikeRecord(name, bikes, $state.snapshot(bags));
      await db.bikes.put(rec);
      draft.bikeId = rec.id;
      addingBike = false;
      bikeName = '';
      error = '';
    } catch {
      error = t('Could not save. Please try again.');
    } finally {
      bikeBusy = false;
    }
  }

  /** v0.39.0 (AP28): a new trip without a bike: from a template of this area, a copy of the last one, or the area's items. */
  function packTrip(readyStandard, now) {
    const snap = $state.snapshot(draft);
    if (chosenTpl) return tripFromTemplate(snap, $state.snapshot(chosenTpl), items, now ?? Date.now(), $state.snapshot(setsValue));
    return newPackTrip({ ...snap, domain: area, readyStandard }, start === 'standard' ? [] : trips, items, now ?? Date.now());
  }

  async function save(event) {
    event.preventDefault();
    if (!draft.title.trim()) return (error = t('Give the trip a name.'));
    if (byBike && !bike) return bikes.length ? (error = t('Choose a bike.')) : ((addingBike = true), (error = t('Add a bike first.')));
    if (byBike && !hoursOk) return (error = t('Riding hours per day: between 0.5 and 24, or leave it empty.'));
    if (isNew && !byBike) {
      const readyStandard = (await db.settings.get(readyKey(area)))?.value ?? null;
      const nt = packTrip(readyStandard, autoNow ?? Date.now());
      ended = true;
      clearTimeout(autoTimer);
      await db.trips.put(touched(nt));
      rememberDomain(area);
      oncreated?.(nt.id);
    } else if (isNew) {
      const readyStandard = (await db.settings.get('readyStandard'))?.value ?? null;
      // v0.25.1: the same path as the day ride (dayride.js buildBikeTrip); wxFrom says the weather came from the forecast.
      const fields = { ...ctxFields(), ...(fromForecast ? { wxFrom: 'forecast' } : {}) };
      const nt = buildBikeTrip({ draft: $state.snapshot(draft), bike: $state.snapshot(bike), start, templates, trips, items, readyStandard, fields, sets: $state.snapshot(setsValue) }, autoNow ?? Date.now());
      ended = true;
      clearTimeout(autoTimer);
      // v0.30.0 (Noah, finding 2): the building blocks chosen in the window, like Pack's block chips.
      await db.trips.put(touched($state.snapshot(withBlocks(nt))));
      rememberDomain(BIKEPACKING);
      oncreated?.(nt.id);
    } else {
      const changes = { title: draft.title.trim(), startDate: draft.startDate, days: Math.max(1, Number(draft.days) || 1) };
      if (byBike) {
        // v0.25.0 (M3): only what was changed here is stored (an older trip keeps its values).
        const f = ctxFields();
        if (ctx.hours !== was.hours) changes.hours = f.hours;
        if (night && (night !== was.overnight || ctx.cook !== was.cook || f.tent !== hasTent({ overnight: was.overnight, tent: was.tent }))) Object.assign(changes, { overnight: night, cook: f.cook, tent: f.tent });
        if (f.dark !== !!trip.dark) changes.dark = f.dark; // v0.66.0: Light follows the dark
        // v0.25.1: weather chosen here is no longer "from the forecast".
        if (ctx.min !== was.min || ctx.max !== was.max || ctx.rain !== was.rain) Object.assign(changes, { wx: f.wx, wxFrom: null });
        if (ctx.event !== was.event) changes.event = ctx.event;
      }
      const switching = byBike && draft.bikeId !== trip.bikeId;
      // Another bike brings its own bags; items in a place it has no bag for go to the seat pack.
      // 9b: a changed context (duration, overnight stay, weather) applies at once, with Undo in Pack.
      const fn = (cur) => {
        const next = { ...cur, ...changes, ...(switching ? switchBike(cur, bike) : {}) };
        const out = { ...changes, ...(switching ? switchBike(cur, bike) : {}) };
        return hasContext(next) ? { ...out, ...applyContext(next, items, cur) } : out;
      };
      if (onchange) await onchange(fn);
      else await db.trips.update(trip.id, touched(fn(await db.trips.get(trip.id))));
    }
    dialog.close();
  }

  /* ---------- v0.35.0 (AP29): the new trip is saved while it is typed ---------- */
  /** The new trip as the window would make it now, or null while it cannot be made (no name typed, no bike, hours wrong). */
  async function autoRecord() {
    if (!autoKeep({ isNew, name: draft.title, changed: !autoName })) return null;
    if (!byBike) {
      const readyStandard = (await db.settings.get(readyKey(area)))?.value ?? null;
      return packTrip(readyStandard, autoNow);
    }
    if (!bike || !hoursOk) return null;
    const readyStandard = (await db.settings.get('readyStandard'))?.value ?? null;
    const fields = { ...ctxFields(), ...(fromForecast ? { wxFrom: 'forecast' } : {}) };
    return $state.snapshot(withBlocks(buildBikeTrip({ draft: $state.snapshot(draft), bike: $state.snapshot(bike), start, templates, trips, items, readyStandard, fields, sets: $state.snapshot(setsValue) }, autoNow)));
  }
  let autoTimer;
  let autoBusy = Promise.resolve();
  function autoSave() {
    autoBusy = autoBusy.then(async () => {
      if (ended) return;
      autoNow ??= Date.now();
      const nt = await autoRecord();
      if (!nt || ended) return;
      await db.trips.put(touched(nt));
      autoId = nt.id;
    });
    return autoBusy;
  }
  // Every change of a field (after a name was typed) saves again, a moment after the last key.
  $effect(() => {
    if (!isNew) return;
    JSON.stringify([draft, ctx, start, picked, area, autoName, off, comfortPicked, dark]); // what the trip is made of
    if (!autoKeep({ isNew, name: draft.title, changed: !autoName })) return;
    clearTimeout(autoTimer);
    autoTimer = setTimeout(autoSave, 300);
    return () => clearTimeout(autoTimer);
  });
  /** Closing (Escape, outside, Close) keeps what was typed: the last change is saved, Pack opens the trip. */
  async function closed() {
    if (isNew && !ended && leaveWindow('close', { made: !!autoId, typed: autoKeep({ isNew, name: draft.title, changed: !autoName }) }) === 'keep') {
      clearTimeout(autoTimer);
      await autoSave();
      if (autoId && !ended) {
        ended = true;
        rememberDomain(area);
        oncreated?.(autoId);
      }
    }
    onclose?.();
  }
  // v0.72.0 «Feinschliff» (Umbenennen 4a, back rule in every window): Android back and Escape keep
  // what was typed. A new trip keeps it as before (closed()); an existing trip saves its changes like
  // «Save» (nothing changed: it only closes).
  // svelte-ignore state_referenced_locally
  const openedAs = JSON.stringify([draft, ctx]);
  const keepOnBack = () => (isNew || JSON.stringify([$state.snapshot(draft), $state.snapshot(ctx)]) === openedAs ? dialog.close() : save({ preventDefault() {} }));
  /** "Discard": the trip this window made goes again (it was made here and has nothing else). */
  async function discard() {
    ended = true;
    clearTimeout(autoTimer);
    await autoBusy;
    if (autoId) await db.trips.delete(autoId);
    dialog.close();
  }

  async function remove() {
    if (!confirm(t('Delete the trip "{title}"? A backup file can bring it back.', { title: trip.title }))) return;
    await db.trips.delete(trip.id);
    dialog.close();
  }
</script>

{#snippet overnight()}
  <fieldset class="ctx">
    <legend class="lbl">{t('Overnight')}</legend>
    <div class="chips">
      {#each NIGHT_CHOICES as o (o.key)}<button type="button" class="toggle" aria-pressed={choice === o.key} onclick={() => pickNight(o.key)}>{t(o.name)}</button>{/each}
    </div>
    {#if !night}<p class="note">{t('Not set for this trip: its list stays as it is until you choose.')}</p>{/if}
    {#if days > 1 && night === 'none'}<p class="note">{t('More than one day without a night? Choose where you sleep.')}</p>{/if}
    <!-- Noah 3a: cooking only for a night outdoors. -->
    {#if night === 'outdoor'}<label class="ck"><input type="checkbox" bind:checked={ctx.cook} /> {t('Cooking')}</label>{/if}
  </fieldset>
{/snippet}
{#snippet weather()}
  <fieldset class="ctx">
    <legend class="lbl">{t('Weather')}</legend>
    <div class="chips">
      <!-- v0.47.1 (Noah d): the forecast's own range, when it is not one of the presets (it used to be rounded to one). -->
      {#if fcWx && !WX_PRESETS.some((p) => p.min === fcWx.min && p.max === fcWx.max)}<button type="button" class="toggle" aria-pressed={ctx.min === fcWx.min && ctx.max === fcWx.max} onclick={() => pickWx({ min: fcWx.min, max: fcWx.max })}>{fcWx.min}–{fcWx.max}° <small class="fcmark">{t('from forecast')}</small></button>{/if}
      {#each WX_PRESETS as p (p.name)}<button type="button" class="toggle" aria-pressed={ctx.min === p.min && ctx.max === p.max} onclick={() => pickWx(p)}>{t(p.name)} <small>{p.min}–{p.max}°</small>{#if fromForecast && ctx.min === p.min && ctx.max === p.max}<small class="fcmark">{t('from forecast')}</small>{/if}</button>{/each}
    </div>
    <!-- v0.47.3: dry or rain as two chips, the same as on the trip page (it was a «+ Rain» toggle). -->
    <div class="chips" role="group" aria-label={t('Rain')}>
      <button type="button" class="toggle" aria-pressed={!wet && !noWx(ctx)} onclick={() => pickWx({ rain: 'none' })}>{t('Dry|weather')}</button>
      <button type="button" class="toggle" aria-pressed={wet} onclick={() => pickWx({ rain: 'rain' })}>{t('Rain')}</button>
      <!-- v0.47.3 (Noah: never binding, always removable): the whole weather off, also the forecast's. -->
      <button type="button" class="toggle" aria-pressed={noWx(ctx)} onclick={() => pickWx({ none: true })}>{t('No weather|chip')}</button>
    </div>
    {#if fromForecast}<p class="note small fc">{t('From the forecast for {place}', { place: forecast.place?.name ?? '' })}</p>
    {:else}<p class="note small">{t('or get the forecast later in Pack (Edit trip conditions)')}</p>{/if}
  </fieldset>
{/snippet}

<dialog class="sheet trip-dlg" bind:this={dialog} use:backClose={keepOnBack} onclose={closed} aria-labelledby="trip-h">
  <form onsubmit={save} novalidate>
    <!-- v0.30.0 (Noah, finding 2): the dark band of the trip pages on top. -->
    <div class="band"><h2 id="trip-h" class="title">{isNew ? t('New trip') : t('Trip details')}</h2></div>
    {#if isNew}
      <!-- v0.21.0 (package 5): the area first; it decides bike or own bags.
           v0.40.0 (Noah 10a): folded as one row "Area · Bikepacking ›", the last chosen area preselected. -->
      <details class="tp-fold area-fold" bind:open={areaOpen}>
        <summary><span>{t('Area')}</span><span class="r"><b class="cur">{t(domainName(area))}</b></span><ChevronRight class="chev" size={18} aria-hidden="true" /></summary>
        <fieldset class="area in">
          <legend class="sr">{t('Area')}</legend>
          <div class="areas">
            {#each TRIP_DOMAINS as d (d.key)}<button type="button" class="toggle" aria-pressed={area === d.key} onclick={() => ((area = d.key), (areaOpen = false))}>{t(d.name)}</button>{/each}
          </div>
        </fieldset>
      </details>
    {/if}
    {#if isNew && byBike}
      <!-- v0.30.0 (Noah, finding 2): the whole new bike trip in one window. -->
      {#if bikes.length}
        <fieldset class="ctx">
          <legend class="lbl">{t('Bike')}</legend>
          <div class="tp-chips">
            {#each bikes as b (b.id)}<button type="button" class="tp-chip" aria-pressed={draft.bikeId === b.id} onclick={() => (draft.bikeId = b.id)}>{b.name}</button>{/each}
          </div>
        </fieldset>
      {:else}
        <!-- L9: no bike yet: add one right here (only its name), it is chosen at once. -->
        <fieldset class="ctx nobike">
          <legend class="lbl">{t('Bike')}</legend>
          {#if addingBike}
            <div class="bikeadd">
              <input class="inp" bind:this={bikeInput} bind:value={bikeName} onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), saveBike())} placeholder={t('e.g. Gravel bike')} aria-label={t('Name of the bike')} enterkeyhint="done" />
              <button type="button" class="btn" disabled={bikeBusy} onclick={saveBike}>{t('Save')}</button>
            </div>
          {:else}
            <p class="note">{t('No bike added yet.')}</p>
            <button type="button" class="btn" onclick={() => ((addingBike = true), (error = ''))}>+ {t('Add a bike')}</button>
          {/if}
        </fieldset>
      {/if}
      <fieldset class="ctx">
        <legend class="lbl">{t('When?')}</legend>
        <div class="tp-chips">
          <button type="button" class="tp-chip" aria-pressed={draft.startDate === today} onclick={() => (draft.startDate = today)}>{t('Today')}</button>
          <button type="button" class="tp-chip" aria-pressed={draft.startDate === tomorrow} onclick={() => (draft.startDate = tomorrow)}>{t('Tomorrow')}</button>
          <DateInput class="inp date" bind:value={draft.startDate} aria-label={t('Start date')} />
        </div>
      </fieldset>
      <fieldset class="ctx">
        <legend class="lbl">{t('How long?')}</legend>
        <div class="tp-chips">
          {#each LENGTHS as l (l.n)}<button type="button" class="tp-chip" aria-pressed={l.n < 3 ? days === l.n && !moreDays : moreDays} onclick={() => pickLength(l.n)}>{t(l.name)}</button>{/each}
        </div>
        <div class="grid two">
          <!-- v0.40.0 (design check): the field for the days only with "More"; 1 and 2 days are the chips. -->
          {#if moreDays}<label><input class="inp num" type="number" min="1" max="60" bind:value={draft.days} bind:this={daysInput} aria-label={t('Days')} /><span class="sub">{t('Days')}</span></label>{/if}
          <label><input class="inp num" type="text" inputmode="decimal" bind:value={ctx.hours} placeholder={t('e.g. 2')} aria-label={t('Riding hours per day')} aria-invalid={!hoursOk} /><span class="sub">{t('Riding hours per day')}</span></label>
        </div>
        {#if !hoursOk}<p class="warn">{t('Riding hours per day: between 0.5 and 24, or leave it empty.')}</p>{/if}
      </fieldset>
      {#if days > 1}{@render overnight()}{/if}
      {@render weather()}
      {#if preview}
        <section class="plan" aria-label={t('Your packing list|preview')} aria-live="polite">
          <div class="tp-card std">
            <h3>
              <Check size={18} aria-hidden="true" />
              <span class="what">{preview.tpl ? t('Template: {name}', { name: preview.tpl.name }) : preview.copied ? t('Copy: {title}', { title: preview.copied.title }) : t('Standard')}</span>
              {#if !preview.tpl && !preview.copied}<i class="tp-badge ok">{t('always with you')}</i>{/if}
              <span class="r num">{tn(preview.start, '{n} item', '{n} items')} · {knownWeight(preview.w.g, preview.w.missing)}</span>
            </h3>
            {#if preview.names.length}<button type="button" class="names" class:open={namesOpen} aria-expanded={namesOpen} onclick={() => (namesOpen = !namesOpen)}>{preview.names.join(' · ')}</button>{/if}
            {#if start !== 'standard'}<button type="button" class="tp-link" onclick={() => (start = 'standard')}>{t('Back to Standard')}</button>{/if}
          </div>
          <ul class="auto">
            <li>{#if preview.weather.length}{t('For the weather, comes by itself')}: {preview.weather.map((i) => nameOf(i)).join(' · ')}{:else}{t('For the weather: nothing extra')}{/if}</li>
            {#if preview.amounts.length}<li>{t('By duration')}: {#each preview.amounts as a, n (a.item.id)}{n ? ', ' : ''}{nameOf(a.item)} <b>{a.qty}</b>{/each}</li>{/if}
            {#if night === 'lodging' || night === 'outdoor'}<li>{t('Overnight ({night}): {sets}', { night: t(nightName({ overnight: night, tent: ctx.tent })), sets: preview.sets.filter((x) => NIGHT_BLOCKS.includes(x.key) && (x.n || x.key !== 'firstaid')).map((x) => `${setName(x.key)} ${x.n}`).join(', ') })}</li>{/if}
            {#if preview.left.length}<li class="tp-muted">{preview.left.includes('overnight') && preview.left.includes('event') ? t('Not included: overnight gear, event preparation') : preview.left.includes('overnight') ? t('Not included: overnight gear') : t('Not included: event preparation')}</li>{/if}
          </ul>
        </section>
      {/if}
      <!-- L9: only real choices: no last trip, no "Copy the last trip"; nothing to choose, no "Start from".
           v0.40.0 (Noah 10a, Funde 7a): the standard first; the last trip and the templates folded below
           it as one row "Start differently ›". -->
      {#if from || areaTemplates.length}
        <details class="tp-fold starts" bind:open={startsOpen}>
          <summary><span>{t('Start differently')}</span><span class="r">{#if start !== 'standard'}<b>{chosenTpl ? chosenTpl.name : t('Copy|start')}</b>{/if}</span><ChevronRight class="chev" size={18} aria-hidden="true" /></summary>
          <div class="in">
            {#if from}<button type="button" class="opt" aria-pressed={start === 'last'} onclick={() => ((start = 'last'), (startsOpen = false))}><b>{t('Copy the last trip: {title}', { title: from.title })}</b></button>{/if}
            {#if areaTemplates.length}
              <details class="tp-fold tpls" bind:open={tplOpen}>
                <summary><span>{t('Start from a template')}</span><span class="r"><span class="num">{areaTemplates.length}</span></span><ChevronRight class="chev" size={18} aria-hidden="true" /></summary>
                <ul class="in opts">
                  {#each areaTemplates as tp (tp.id)}<li><button type="button" class="opt" aria-pressed={start === tp.id} onclick={() => pickStart(tp.id)}><b>{tp.name}</b><span>{tplLine(tp)}</span></button></li>{/each}
                </ul>
              </details>
            {/if}
          </div>
        </details>
      {/if}
      {#if rideChips.length || blocks.length || comfortItems.length}
        <section class="blocks" aria-labelledby="blocks-h">
          <h3 id="blocks-h">{t('Building blocks')}{#if tips}<span class="tp-muted">{` · ${tn(tips, '{n} tip', '{n} tips')}`}</span>{/if}</h3>
          <!-- v0.66.0 (Noah 7a, 9a): what the ride suggests is pressed already; one tap takes it off. -->
          {#if rideChips.length}
            <p class="note small sub">{t('Suggested for this ride')}</p>
            <div class="tp-chips" role="group" aria-label={t('Suggested for this ride')}>
              {#each rideChips as b (b.key)}<button type="button" class="tp-chip blk" aria-pressed={!off.includes(b.key)} onclick={() => flipOff(b.key)}><span class="bn">{b.label}</span> <small class="num">{b.n} · {b.weight}</small></button>{/each}
            </div>
          {/if}
          {#if blocks.length}
            <p class="note small sub">{t('Add building blocks')}</p>
            <div class="tp-chips" role="group" aria-label={t('Add building blocks')}>
              {#each blocks as b (b.key)}<button type="button" class="tp-chip blk" aria-pressed={picked.includes(b.key)} onclick={() => pick(b.key)}><span class="bn">+ {b.label}</span> <small class="num">{b.n} · {b.weight}</small>{#if b.tip}<i class="tp-badge">{t('Tip')}</i>{/if}</button>{/each}
            </div>
            <p class="note small" aria-live="polite">{#if chosen.length}{chosen.map((b) => `${b.label}: ${b.names.join(', ')}`).join(' · ')}{/if}</p>
          {/if}
          <!-- v0.66.0 (Noah 9a): Comfort only ever as unticked suggestions, one item at a time. -->
          {#if comfortItems.length}
            <p class="note small sub">{t('Comfort, if you like')}</p>
            <div class="tp-chips" role="group" aria-label={t('Comfort, if you like')}>
              {#each comfortItems as i (i.id)}<button type="button" class="tp-chip" aria-pressed={comfortPicked.includes(i.id)} onclick={() => flipComfort(i.id)}>+ {nameOf(i)}</button>{/each}
            </div>
          {/if}
        </section>
      {/if}
      <label class="name"><span class="lbl">{t('Name')}</span><input class="inp" bind:value={draft.title} oninput={() => (autoName = false)} placeholder={t('e.g. Jura weekend')} required /></label>
      <label class="ck ev"><input type="checkbox" bind:checked={ctx.event} /> {t('Event (race or organised ride)')}</label>
    {:else}
      <div class="grid">
        <label class="wide"><span class="lbl">{t('Name')}</span><input class="inp" bind:value={draft.title} oninput={() => (autoName = false)} placeholder={t('e.g. Jura weekend')} required /></label>
        <label><span class="lbl">{t('Start date')}</span><DateInput bind:value={draft.startDate} /></label>
        {#if byBike}
          <label>
            <span class="lbl">{t('Bike')}</span>
            <select class="sel" bind:value={draft.bikeId}>
              {#each bikes as b (b.id)}<option value={b.id}>{b.name}</option>{/each}
            </select>
          </label>
        {:else}
          <label><span class="lbl">{t('Days')}</span><input class="inp num" type="number" min="1" max="60" bind:value={draft.days} /></label>
        {/if}
      </div>
      {#if byBike}
        <!-- v0.25.0 (M3, Noah 1a): what kind of trip it is, all on one page. -->
        <fieldset class="ctx">
          <legend class="lbl">{t('How long?')}</legend>
          <div class="grid">
            <label><input class="inp num" type="number" min="1" max="60" bind:value={draft.days} aria-label={t('Days')} /><span class="sub">{t('Days')}</span></label>
            <label><input class="inp num" type="text" inputmode="decimal" bind:value={ctx.hours} placeholder={t('e.g. 2')} aria-label={t('Riding hours per day')} aria-invalid={!hoursOk} /><span class="sub">{t('Riding hours per day')}</span></label>
          </div>
          {#if !hoursOk}<p class="warn">{t('Riding hours per day: between 0.5 and 24, or leave it empty.')}</p>{/if}
        </fieldset>
        {@render overnight()}
        {@render weather()}
        <label class="ck ev"><input type="checkbox" bind:checked={ctx.event} /> {t('Event (race or organised ride)')}</label>
      {/if}
      {#if isNew}
        {#if fromArea || areaTemplates.length}
          <label class="start"><span class="lbl">{t('Start from')}</span>
            <select class="sel" bind:value={start}>
              {#if fromArea}<option value="last">{t('Last {area} trip: {title}', { area: t(domainName(area)), title: fromArea.title })}</option>{/if}
              <option value="standard">{t('Items of this area')}</option>
              <!-- v0.39.0 (AP28): templates of an area without a bike -->
              {#each areaTemplates as tp (tp.id)}<option value={tp.id}>{t('Template: {name}', { name: tp.name })}</option>{/each}
            </select>
          </label>
        {/if}
        <p class="note">
          {#if chosenTpl}{t('From the template {name}. Bags: {bags}.', { name: chosenTpl.name, bags: DOMAIN[area].packs.map((p) => t(p.name)).join(', ') })}
          {:else if fromArea && start !== 'standard'}{t('A copy of {title}. Nothing is ticked off yet.', { title: fromArea.title })}
          {:else if areaItems}{t('Starts with the {area} items in Standard. Bags: {bags}.', { area: t(domainName(area)), bags: DOMAIN[area].packs.map((p) => t(p.name)).join(', ') })}
          {:else}{t('No items for {area} yet, so the list starts empty. Add items in Pack (search finds all your gear), or in Gear: open an item and tick {area} under Areas.', { area: t(domainName(area)) })}{/if}
        </p>
      {:else if byBike && draft.bikeId !== trip.bikeId}
        <p class="note">{t('The trip takes the bags of the new bike. Items in a place without a bag move to the seat pack.')}</p>
      {/if}
    {/if}
    <p class="err" role="alert">{error}</p>
    <div class="foot">
      <!-- v0.30.0 (Noah, finding 2): the live item count on the one orange button. -->
      <button type="submit" class="btn hi">{isNew ? t('Create trip') : t('Save')}{#if total}<span class="cnt">{` · ${tn(total, '{n} item', '{n} items')}`}</span>{/if}</button>
      {#if isNew && autoId}<button type="button" class="btn" onclick={discard}>{t('Discard')}</button><span class="kept" role="status"><Check size={14} aria-hidden="true" />{t('Saved')}</span>
      {:else}<button type="button" class="btn" onclick={() => (isNew ? discard() : dialog.close())}>{t('Cancel')}</button>{/if}
      {#if !isNew}<button type="button" class="btn del" onclick={remove}>{t('Delete trip')}</button>{/if}
    </div>
  </form>
</dialog>

<style>
  .area {
    border: 0;
    margin: 0;
    padding: 0;
  }
  .areas {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .toggle {
    min-height: 44px;
    border: 1.5px solid var(--ink-3);
    background: var(--paper);
    border-radius: 999px;
    padding: 5px 14px;
    font: 600 15px var(--font-body);
    color: var(--ink);
    cursor: pointer;
  }
  /* v0.25.1 (Noah 3a): the preset the forecast chose. */
  .fcmark {
    margin-left: 6px;
    font-weight: 500;
    opacity: 0.85;
  }
  .toggle[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  /* v0.25.0 (M3): the context of a bike trip and the live "Your packing list". */
  .ctx {
    border: 0;
    margin: 14px 0 0;
    padding: 0;
    min-width: 0;
  }
  .ctx .grid label,
  .ctx label {
    display: grid;
    gap: 2px;
  }
  .sub {
    font-size: 13px;
    color: var(--ink-2);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  /* v0.47.3: dry or rain on a row of its own under the ranges. */
  .chips + .chips {
    margin-top: 6px;
  }
  .ck {
    display: flex !important;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    min-height: 44px;
  }
  .ck input {
    width: 20px;
    height: 20px;
  }
  .ev {
    margin-top: 12px;
    font-weight: 600;
  }
  .warn {
    color: var(--bad);
    font-size: 14px;
    margin: 6px 0 0;
  }
  .plan {
    margin-top: 16px;
  }
  .small {
    font-size: 13px;
  }
  .start {
    display: grid;
    gap: 4px;
    margin-top: 12px;
  }
  h2 {
    font-size: var(--fs-section);
    margin: 0;
  }
  /* v0.30.0 (Noah, finding 2): the window of a new trip. The dark band like the trip pages,
     chips and one card style from trip.css, 44 px taps. */
  .trip-dlg {
    width: min(600px, calc(100vw - 24px));
  }
  .band {
    margin: -18px -18px 14px;
    padding: 14px 18px;
    background: var(--brand);
    color: var(--brand-ink);
  }
  .ctx .tp-chips {
    align-items: center;
  }
  /* v0.67.1: the date field is ui/DateInput.svelte (its own box around the input) */
  .tp-chips :global(.date-in) {
    flex: 1 1 170px;
    max-width: 220px;
  }
  .tp-chips :global(.inp.date) {
    min-height: 44px;
  }
  .grid.two {
    margin-top: 8px;
  }
  .std {
    margin: 0 0 8px;
    padding: 12px 14px;
  }
  .std h3 {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
    margin: 0;
    font: 600 17px/1.25 var(--font-body);
  }
  .std h3 :global(svg) {
    color: var(--ok);
  }
  .std .r {
    margin-left: auto;
    font-size: 14px;
    font-weight: 400;
    color: var(--ink-3);
  }
  .names {
    display: block;
    width: 100%;
    min-height: 44px;
    margin-top: 4px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: 400 14px/1.45 var(--font-body);
    text-align: left;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .names.open {
    white-space: normal;
  }
  .auto {
    list-style: none;
    padding: 0 2px;
    margin: 0;
    display: grid;
    gap: 4px;
    font-size: 14px;
    color: var(--ink-2);
  }
  .blocks {
    margin-top: 16px;
  }
  .blocks h3 {
    margin: 0 0 8px;
    font: 600 17px/1.25 var(--font-body);
  }
  .blocks .sub {
    margin: 8px 0 4px;
  }
  .blk small {
    font-size: 13px;
    opacity: 0.85;
  }
  .starts {
    margin-top: 12px;
  }
  .starts > .in {
    display: grid;
    gap: 8px;
  }
  .starts .tpls {
    margin: 0;
  }
  .area-fold {
    margin-bottom: 4px;
  }
  .area-fold .cur {
    color: var(--ink);
    font-weight: 600;
  }
  .starts .opts {
    list-style: none;
    margin: 0;
    display: grid;
    gap: 8px;
  }
  .opt {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 100%;
    min-height: 56px;
    padding: 10px 14px;
    border: 1.5px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .opt[aria-pressed='true'] {
    border-color: var(--ink);
  }
  .opt span {
    color: var(--ink-3);
    font-size: 14px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 56px;
    padding: 6px 16px;
    color: var(--ink);
    font: 500 16px var(--font-body);
    text-align: left;
    cursor: pointer;
  }
  .row[aria-pressed='true'] {
    border-color: var(--ink);
  }
  .row .rt {
    display: grid;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .row b {
    font-weight: 500;
  }
  .row :global(.chev) {
    margin-left: auto;
    flex: none;
    color: var(--ink-3);
  }
  .name {
    display: grid;
    gap: 4px;
    margin-top: 8px;
  }
  .cnt {
    font-weight: 500;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .wide {
    grid-column: 1 / -1;
  }
  /* v0.25.0: at 320 px the bike name needs the whole width. */
  @media (max-width: 360px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
  .note {
    font-size: 14px;
    color: var(--ink-2);
    margin: 12px 0 0;
  }
  /* L9: a bike added inside the dialog. */
  .nobike .note {
    margin: 0 0 8px;
  }
  .bikeadd {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .bikeadd .inp {
    flex: 1;
    min-width: 0;
    min-height: 44px;
  }
  .err {
    color: var(--bad);
    min-height: 1.2em;
    font-size: 14px;
  }
  .foot {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .kept {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: var(--ink-3);
  }
  .del {
    margin-left: auto;
    border-color: var(--bad);
    color: var(--bad);
  }
</style>
