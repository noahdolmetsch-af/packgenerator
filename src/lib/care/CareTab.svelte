<script>
  import { backClose } from '../ui/backclose.js'; // Regeln der App (14.10.2026): back closes this window first
  import AreaIntro from '../intro/AreaIntro.svelte'; // «Einstieg» on top (Noah «4a»)
  import { offerCare } from '../remind/ask.svelte.js';
  import HintCard from '../pageinfo/HintCard.svelte';
  import PageMore from '../pageinfo/PageMore.svelte';
  import TipLine from '../pageinfo/TipLine.svelte';
  import { localDay } from '../localday.js';
  import Empty from '../ui/Empty.svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { sortBikes, bikesHash } from '../bikes.js';
  import VeloHead from '../bikes/VeloHead.svelte';
  import '../bikes/velo-dlg.css';
  import { X, Check as CheckIcon, Bike as BikeIcon } from '@lucide/svelte';
  import { wantBike } from '../nav.js';
  import { explain } from '../ui/explain.js';
  import { nextId } from '../gear.js';
  import { chainWish } from '../quickcare.js';
  import { tick } from 'svelte';
  import {
    ensureParts, isPrep, checkState, serviceDue, logPart, parseKm, PART, taskBike, openRepairs, toReview, prepFor, prepRules, upcomingTrips, wishFor, CHECK_KM,
  } from '../care.js';
  import TripCare from './TripCare.svelte';
  import { tickPrep, untickPrep } from './prep.js';
  import { orderOf as orderFor } from './orders.js';
  import BikeCare from './BikeCare.svelte';
  import CareOverview from './CareOverview.svelte';
  import ProblemList from './ProblemList.svelte';
  import StartValues from './StartValues.svelte';
  import StartPointDialog from './StartPointDialog.svelte';
  import { partStart } from '../kmbook.js';
  import { setSpec } from '../bikespecs.js';
  import { setReading, addHand } from '../kmbookdb.js';
  import { nextNumber } from '../notes.js';
  import { isMore, partName as nameOfPart } from '../care.js';
  import Fold from '../ui/Fold.svelte';
  import PartDialog from './PartDialog.svelte';
  import VisitDialog from './VisitDialog.svelte';
  import OrderDialog from './OrderDialog.svelte';
  import { withVisits, visitsOf, tyreSetup, timeDue, lastPrice } from '../workshop.js';
  import { hasBike } from '../domains.js';
  import { daysFrom } from '../today.js';
  import { t, tn, num, dateOf } from '../i18n.svelte.js';
  import { bikeCare, eventPrep } from '../readiness.js';
  import { serviceDone } from '../bikeservice.js';
  import { wearRows, wearForTrip } from '../wear.js';
  import { hoursOn } from '../bikehours.js';
  import { vig } from '../veloimgriff.svelte.js';
  import { offerDone } from '../ui/rename.svelte.js';

  // v0.21.0 (answer 7a): Bike care is the Care tab of Bikes. bikeId: the bike chosen on the page;
  // open: open that bike's section (a link "Bike care for the …").
  // tripId (v0.22.0, AP06): a link "Event preparation" opens that trip's preparation.
  let { bikeId = null, open = false, tripId = null, onbike, onopened } = $props();

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const tripsQ = liveQuery(() => db.trips.toArray());
  const tasksQ = liveQuery(() => db.maintenance.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const visitsQ = liveQuery(() => db.visits.toArray());
  const kmQ = liveQuery(() => db.kmBook.toArray()); // v0.68.0 «Q1 Jeder km zählt»: the ride ledger

  // What is stored (writes go here) and what is shown: the stored parts plus the jobs of the workshop visits.
  const bikes = $derived(sortBikes($bikesQ ?? []).map((b) => ({ ...b, parts: ensureParts(b) })));
  const bikeById = $derived(Object.fromEntries(bikes.map((b) => [b.id, b])));
  const visits = $derived($visitsQ ?? []);
  const views = $derived(bikes.map((b) => withVisits(b, visits)));
  const viewById = $derived(Object.fromEntries(views.map((b) => [b.id, b])));
  const tasks = $derived($tasksQ ?? []);
  const items = $derived($itemsQ ?? []);
  const today = localDay();
  const now = () => new Date().toISOString();

  // Who did the work (Noah, 4.10.2026): remembered on this device, stored with every entry.
  // v0.31.0 (answer 10a): chosen in the dialog "Record work" (me / bike shop), no longer at the top.
  let by = $state(readBy());
  function readBy() {
    try {
      return localStorage.getItem('care.by') ?? 'self';
    } catch {
      return 'self';
    }
  }
  function setBy(v) {
    by = v;
    try {
      localStorage.setItem('care.by', v);
    } catch {
      /* fine: only this visit remembers it */
    }
  }

  /* ---------- filter (v0.31.0): all parts, only due, by me, by the bike shop; remembered here ---------- */
  // v0.38.0 (Noah 5a): one segmented toggle "All | Due | by me | Bike shop".
  const FILTERS = [['all', 'All|parts'], ['due', 'Due|filter'], ['self', 'by me'], ['shop', 'bike shop|filter']];
  let filter = $state(readFilter());
  function readFilter() {
    try {
      const v = localStorage.getItem('care.filter');
      return FILTERS.some(([k]) => k === v) ? v : 'all';
    } catch {
      return 'all';
    }
  }
  function setFilter(v) {
    filter = v;
    try {
      localStorage.setItem('care.filter', v);
    } catch {
      /* fine: only this visit remembers it */
    }
  }

  /* ---------- what is due ---------- */
  // v0.18.2 (answer 3a): the same list "Before the trip" as on Home and in Pack. The preparation
  // tasks keep their buttons here; the bike's part of the list (workshop, repairs) shows as hints.
  const trips = $derived(
    upcomingTrips($tripsQ ?? [], today).map((t) => {
      const v = viewById[t.bikeId];
      // v0.22.0 (AP06): the bike's part is Bike care (the same as on Home and in Pack), the tasks Event preparation.
      const care = v && hasBike(t) ? bikeCare(v, { tasks, visits, trip: t, today }) : null;
      // «Verschleiss» (Noah 20.10.2026, 5a): parts that run out before or on the trip
      const wear = care ? wearForTrip(wearRows(v, { entries: kmEntries, today }), t, today) : [];
      return { trip: t, rows: prepFor(t, tasks, today), rules: prepRules(t, tasks), care, prep: eventPrep(t, tasks, today), wear };
    }),
  );
  const checks = $derived(
    views.map((b) => {
      // N15: one order for the shop, for this bike's next trip (or what is due today); v0.31.0: only what
      // I do not usually do myself. Impeccable (Velopflege 3): the same order as in Workshop & receipts.
      const { tyres, order, orderTrip: trip } = orderFor(b, $tripsQ ?? [], tasks, visits, today);
      const care = bikeCare(b, { tasks, visits, today });
      return { bike: b, check: checkState(b), services: serviceDue(b), tyres, time: timeDue(b, tyres, today), mine: visitsOf(visits, b.id), order, orderTrip: trip, care };
    }),
  );

  /* ---------- parts ---------- */
  let partOpen = $state(null); // { bikeId, key, start: null | 'replace' | 'service' }
  let startOpen = $state(null); // the bike id of the start-values wizard
  let workOpen = $state(false); // «Record work»: pick a bike and a part
  let workBike = $state(null);
  let workDialog = $state();
  $effect(() => {
    if (workOpen && workDialog && !workDialog.open) workDialog.showModal();
  });
  /** The shop names of the earlier visits, newest first (who did a replacement). */
  const shops = $derived([...new Set([...visits].sort((a, b) => b.date.localeCompare(a.date)).map((v) => v.shop).filter(Boolean))].slice(0, 4));

  /** v0.48.0 (Noah 11a): a guided replacement or service: all entries at once, follow-up questions as problems. */
  async function saveFlow(view, { entries, problems = [] }) {
    const bike = bikeById[view.id];
    const prev = bike.parts;
    let parts = bike.parts;
    for (const { key, entry } of entries) parts = logPart(parts, key, entry);
    const taskIds = [];
    await db.transaction('rw', db.bikes, db.maintenance, async () => {
      await db.bikes.update(bike.id, { parts });
      let id = nextNumber(await db.maintenance.toArray());
      for (const text of problems) {
        await db.maintenance.put({ id, area: 'Bike', bikeId: bike.id, subject: bike.name, task: text, category: 'Repair', source: 'Care', logDate: today, leadWeeks: null, priority: 'medium', status: 'open', note: '', fix: 'self', beforeRide: true, done: false });
        taskIds.push(id++);
      }
    });
    if (entries.length) saved(view, [...new Set(entries.map((e) => e.key))], entries.at(-1).entry, { bikeId: bike.id, prev, itemId: null, taskIds });
  }
  /** v0.48.0 «Teile pro Velo»: one value of a part's spec sheet. */
  async function saveSpec(bikeId, key, field, value) {
    const bike = await db.bikes.get(bikeId);
    if (bike) await db.bikes.update(bikeId, setSpec(bike, key, field, value));
  }
  async function saveStart(bikeId, values) {
    // v0.68.0 (Q1): the km go into the ride ledger: the km at the purchase as its start value (when the
    // ledger is still empty), the km today as a new reading. Nothing is overwritten.
    const { km, kmDate, ...rest } = values;
    await db.bikes.update(bikeId, rest);
    const kmBought = rest.parts.flatMap((p) => p.history ?? []).find((h) => h.start)?.km ?? 0;
    if (!(await db.kmBook.where('bikeId').equals(bikeId).count()) && rest.bought) await addHand(db, { bikeId, date: rest.bought, km: kmBought, kind: 'start', note: 'Start value' });
    if (typeof km === 'number') await setReading(db, bikeId, km, { date: kmDate ?? today });
    say(t('Start values saved.'));
  }

  /* ---------- v0.68.0 (Q1.7 a): a part's start point, with Undo ---------- */
  let startPoint = $state(null); // { bikeId, key, missing }
  const kmEntries = $derived($kmQ ?? []);
  async function saveStartPoint(bikeId, key, entry) {
    const bike = bikeById[bikeId];
    const prev = bike.parts;
    const parts = bike.parts.map((p) => {
      if (p.key !== key) return p;
      const history = [...(p.history ?? [])];
      // in date order: the mounting goes before the work done after it
      const at = history.findIndex((h) => (h.date ?? '') > entry.date);
      history.splice(at < 0 ? history.length : at, 0, entry);
      return { ...p, history };
    });
    await db.bikes.update(bikeId, { parts });
    say(t('Start point saved: {part}, {date} · {km} km.', { part: PART[key] ? t(PART[key].name) : key, date: dateOf(entry.date), km: num(entry.km) }), { bikeId, prev, itemId: null });
  }
  const setQ1 = (bikeId, on) => db.bikes.update(bikeId, { q1: on });

  /* ---------- «Velo im Griff» #193: the whole-bike service done today, with Undo ---------- */
  async function serviceNow(bikeId) {
    const b = await db.bikes.get(bikeId);
    if (!b) return;
    const before = b.service ?? {};
    await db.bikes.update(bikeId, serviceDone(b, { day: today, km: b.km ?? null, hours: hoursOn(vig.hours[bikeId] ?? null, today) }));
    offerDone(t('Bike service saved: {date}.', { date: dateOf(today) }), () => db.bikes.update(bikeId, { service: before }));
  }
  /** «Done» on a due row: the whole-bike service, or a part's service. */
  const doneRow = (view, r) => (r.kind === 'service' ? serviceNow(view.id) : checkAndSay(view, [r.part], 'service', r.kind === 'time' ? r.name : '', 'self'));

  async function savePart(view, key, entry) {
    const bike = bikeById[view.id];
    // v0.40.0 (Noah 1 "b und a"): a chain checked at or over its replace limit is "work needed", not OK.
    const lim = typeof entry.limit === 'number' ? entry.limit : (bike.parts?.find((p) => p.key === key)?.limit ?? PART[key]?.limit);
    const e = key === 'chain' && entry.action === 'check' && entry.value != null && lim != null && entry.value >= lim ? { ...entry, result: 'needed' } : entry;
    const prev = bike.parts;
    await db.bikes.update(bike.id, { parts: logPart(bike.parts, key, e) });
    // "Replace needed" puts the part on the wishlist (answer 6), with the last price paid (answer 19a);
    // a worn chain with its wear as the reason (quickcare.js chainWish), never twice.
    let item = null;
    if (e.result === 'needed') {
      if (key === 'chain' && e.value != null) {
        item = chainWish({ ...bike, parts: logPart(bike.parts, key, e) }, items, { id: nextId(items, 'bike'), value: e.value, today, price: lastPrice(visits, view.id, key) });
        if (item) await db.items.put(item);
      } else item = await wish(view, key, e.model);
    }
    saved(view, [key], e, { bikeId: bike.id, prev, itemId: item?.id ?? null });
    // ER2 (Noah 14.10.2026 «er1-er3 freigabe»): after «Kette geölt» once «Wieder erinnern, wenn es fällig ist?»
    if (key === 'chain' && e.action === 'service') offerCare(bike, 'chain');
  }
  async function undoSave() {
    const u = $state.snapshot(notice?.undo); // plain data: Dexie cannot store a state proxy
    clearTimeout(noticeTimer);
    notice = null;
    if (!u) return;
    await db.transaction('rw', db.bikes, db.items, db.maintenance, async () => {
      await db.bikes.update(u.bikeId, { parts: u.prev });
      if (u.itemId) await db.items.delete(u.itemId);
      for (const id of u.taskIds ?? []) await db.maintenance.delete(id);
    });
  }
  async function wish(view, key, model = null) {
    const part = view.parts.find((p) => p.key === key);
    const item = wishFor({ ...part, model: model ?? part.model }, view, items, nextId(items, 'bike'), lastPrice(visits, view.id, key));
    if (item) await db.items.put(item);
    return item;
  }
  let wished = $state({});
  async function wishTime(view, s) {
    const item = await wish(view, s.key);
    wished = { ...wished, [`${view.id}.${s.key}`]: item ? t('On the wishlist') : t('Already on the wishlist') };
  }

  /** Several parts at once (a 1000 km check, or a preparation task that covers them). */
  async function checkParts(view, keys, action = 'check', note = '', who = by) {
    const bike = bikeById[view.id];
    let parts = bike.parts;
    const entry = { date: today, km: bike.km ?? null, value: null, action, result: action === 'check' ? 'ok' : 'done', by: who, model: null, note };
    for (const k of keys) parts = logPart(parts, k, entry);
    await db.bikes.update(bike.id, { parts });
    return entry;
  }

  /* ---------- what was just saved (v0.30.1, D1 + D2: Noah did not see that it worked) ---------- */
  let notice = $state(null); // { id, text }
  let noticeTimer;
  function say(text, undo = null) {
    clearTimeout(noticeTimer);
    notice = { id: Date.now(), text, undo };
    noticeTimer = setTimeout(() => (notice = null), undo ? 8000 : 6000);
  }
  const WHAT = (entry, key) =>
    entry.result === 'needed' ? t('work needed') : entry.action === 'check' ? t('checked, OK') : entry.action === 'service' ? t('serviced') : PART[key]?.unit ? t('replaced') : t('done');
  /** "Saved: Tyres + sealant, done, 8 Oct 2026 · 3'200 km. Next time 6 Jan 2027." */
  function saved(view, keys, entry, undo = null) {
    const parts = keys.map((k) => (PART[k] ? t(PART[k].name) : k)).join(', ');
    const vars = { part: parts, what: WHAT(entry, keys[0]), date: dateOf(entry.date), km: num(entry.km) };
    let text = entry.km != null ? t('Saved: {part}, {what}, {date} · {km} km.', vars) : t('Saved: {part}, {what}, {date}.', vars);
    // A service by time: say when it is due next (sealant every 90 days, fork once a year).
    const timed = keys.length === 1 && entry.result === 'done' && entry.action !== 'check' ? checks.find((c) => c.bike.id === view.id)?.time.find((s) => s.key === keys[0]) : null;
    if (timed) text += ` ${t('Next time {date}.', { date: dateOf(new Date(Date.parse(`${entry.date}T00:00:00Z`) + timed.every * 864e5).toISOString().slice(0, 10)) })}`;
    if (undo?.itemId) text += ` ${t('The chain is on the wishlist.')}`;
    say(text, undo);
  }
  // v0.117.0 «Knöpfe neu» (N2, answer 2a): «Done» and «All checked» can be taken back like a saved
  // flow (the same undo: the parts as they were before).
  async function checkAndSay(view, keys, action, note, who = by) {
    const prev = $state.snapshot(bikeById[view.id]?.parts ?? []);
    const entry = await checkParts(view, keys, action, note, who);
    saved(view, keys, entry, { bikeId: view.id, prev, itemId: null });
  }

  // v0.30.1 (D1): km typed the Swiss or German way ("2'287", "2.287", "2 287") are saved and said.
  let kmMsg = $state(null); // { bikeId, text, error }
  async function saveKm(bike, text) {
    const n = parseKm(text);
    if (n === null) {
      // an empty field keeps the km: nothing is lost by clearing it by mistake (v0.30.2, V9.10: the old error goes)
      if (kmMsg?.bikeId === bike.id && kmMsg.error) kmMsg = null;
      return null;
    }
    if (Number.isNaN(n)) {
      kmMsg = { bikeId: bike.id, text: t('Type the km as a whole number, e.g. 12400.'), error: true };
      return null;
    }
    await setReading(db, bike.id, n, { date: today }); // v0.68.0: an entry in the ride ledger
    kmMsg = { bikeId: bike.id, text: t('{km} km saved.', { km: num(n) }), error: false };
    return n;
  }

  /* ---------- preparation tasks per trip ---------- */
  // v0.30.2 (L5): the same saving as in the trip (Plan → Before the trip): care/prep.js.
  // The check before the event also counts for the 1000 km check (answer 7).
  const prepNote = (trip) => t('Before {trip}', { trip: trip.title });
  const prepResult = (trip, row, result) => tickPrep(db, trip.id, [row], result, { today, by, note: prepNote(trip) });
  // v0.24.0 (Noah, "select all"): every open task of a trip done in one tap, saved in one write.
  const prepAll = (trip, rows) => tickPrep(db, trip.id, rows.filter((r) => !r.finished), 'done', { today, by, note: prepNote(trip) });
  const undoPrep = (trip, row) => untickPrep(db, trip.id, row);

  /* ---------- repairs from the Excel (and the June walk-through) ---------- */
  const repairs = $derived(openRepairs(tasks));
  const review = $derived(toReview(tasks));
  let reviewing = $state(false);
  let skipped = $state([]);
  const reviewQueue = $derived([...review.filter((t) => !skipped.includes(t.id)), ...review.filter((t) => skipped.includes(t.id))]);
  const repairResult = (t, status) => db.maintenance.update(t.id, { status, statusDate: today, by, reviewedAt: now() });
  const repairsFor = (bikeId) => repairs.filter((t) => taskBike(t) === bikeId && t.status !== 'check');
  const otherRepairs = $derived(repairs.filter((t) => !taskBike(t) && t.status !== 'check'));
  // v0.47.1 (Noah): the problems of all bikes in one flat list, newest on top (was: in each bike's «Due now»).
  const bikeProblems = $derived(tasks.filter((x) => !isPrep(x) && (x.status === 'open' || x.status === 'needed') && bikes.some((b) => b.id === taskBike(x))));
  // v0.48.0 (Pflege C): the overview's list can also show the problems solved lately («All»).
  const allBikeProblems = $derived(tasks.filter((x) => !isPrep(x) && x.status !== 'check' && x.status !== 'gone' && bikes.some((b) => b.id === taskBike(x))));

  /* ---------- tube or tubeless per wheel (answer 12a) ---------- */
  const setTyre = (bike, wheel, value) => db.bikes.update(bike.id, { tyreSetup: { ...tyreSetup(bike, visits), ...(bike.tyreSetup ?? {}), [wheel]: value } });

  /* ---------- workshop visits (answers 7a, 8a) ---------- */
  let visitOpen = $state(null); // visit id
  let orderOpen = $state(null); // bike id
  const orderOf = $derived(Object.fromEntries(checks.map((c) => [c.bike.id, c])));
  const bikeNames = $derived(Object.fromEntries(bikes.map((b) => [b.id, b.name])));

  const PRIO = { high: 'High', medium: 'Medium', low: 'Low' };

  /* ---------- one bike open, the others closed (v0.31.0 accordion) ---------- */
  let openId = $state(undefined); // undefined: not chosen yet; null: all closed
  async function openBike(id) {
    openId = id;
    onbike?.(id);
    await tick();
    // V7: the bike is its own page now: back to the top of it (the path and the title).
    document.querySelector('.care')?.scrollIntoView({ block: 'start' });
  }
  $effect(() => {
    if (open && bikeId && bikes.some((b) => b.id === bikeId)) {
      openBike(bikeId);
      onopened?.();
    }
  });
  // At first the chosen bike (Setup and Care share it) or the first one is open.
  $effect(() => {
    // v0.48.0 (Pflege C): the overview is on top; a bike is open only when it was chosen.
    if (openId === undefined && bikes.length) openId = bikes.some((b) => b.id === bikeId) ? bikeId : null;
  });
  // Design-Refresh P7 (V6/V7): no bike chosen any more (the path «Pflege») → the overview again.
  // svelte-ignore state_referenced_locally
  let lastBikeId = bikeId;
  $effect(() => {
    const b = bikeId;
    if (b === lastBikeId) return;
    lastBikeId = b;
    if (!b) openId = null;
  });
  // V6: the overview page; V7: one bike's care page (the other bikes stay one row each below).
  const openC = $derived(openId ? checks.find((c) => c.bike.id === openId) ?? null : null);
  // v0.137.0 (DK1): the same count as Today and the menu: services, worn parts and the problems due (readiness.repairDue).
  const dueAll = $derived(checks.reduce((n, c) => n + c.care.rows.length, 0));
  const toggled = (id, isOpen) => {
    if (isOpen) openBike(id);
    else openId = null;
  };
  // V7: on one bike's page only the trips with that bike.
  const tripsShown = $derived(openC ? trips.filter((x) => x.trip.bikeId === openC.bike.id) : trips);
  const next = $derived(tripsShown[0] ?? null);
  const later = $derived(tripsShown.slice(1));
  // Impeccable (18.10.2026, Velopflege 1): a trip that starts in the next 7 days stands on top of the
  // page (above «Due now»), not after the whole overview.
  const soonDays = $derived(next ? daysFrom(today, next.trip.startDate) : null);
  const nextSoon = $derived(soonDays != null && soonDays <= 7);
  // v0.22.0 (AP06): #/bikes?tab=care&trip=<id> (Home, Pack) goes to that trip's preparation.
  let laterOpen = $state(false);
  let wentTo = null;
  $effect(() => {
    if (!tripId || wentTo === tripId || !trips.some((x) => x.trip.id === tripId)) return;
    wentTo = tripId;
    if (later.some((x) => x.trip.id === tripId)) laterOpen = true;
    tick().then(() => document.getElementById(`before-${tripId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  });
</script>

<!-- v0.31.0 (Velopflege redesign, mockup v3-pflege): a filter, the next trip as one folded row,
     then one bike open and the others as one row each. -->
<div class="care">
  {#if openC}
    <!-- Design-Refresh P7 (V7): one bike's care page: «‹ Velo › Pflege › Gravel Blau». -->
    <VeloHead
      crumbs={[{ label: t('Bike'), href: bikesHash({ tab: 'setup', bike: openC.bike.id }) }, { label: t('Care|tab'), href: bikesHash({ tab: 'care' }) }]}
      title={openC.bike.name}
      bike={openC.bike}
      sub={[t('Bike care'), typeof openC.bike.km === 'number' ? `${num(openC.bike.km)} km` : '', t('as of today')].filter(Boolean).join(' · ')}
    />
  {:else}
    <VeloHead
      title={t('Care|tab')}
      sub={[tn(bikes.length, '{n} bike', '{n} bikes'), dueAll ? tn(dueAll, '{n} due', '{n} due') : t('nothing due')].join(' · ')}
    />
    <!-- v0.137.0 (DK1, Noah 14.10.2026 «1-5 freigeben»): what «due» means, the same number everywhere. -->
    {#if bikes.length}<p class="why-due">{t('Due means: a service is due, or a problem has to be fixed before the next ride. Today, Bikes and the menu show the same number.')}</p>{/if}
    <!-- «Mehr Inhalt» (Noah 15.10.2026, 1a–5a): the tip of the day, at the end the fold -->
    <!-- Noah 19.10 «2a»: one card per page; the Einstieg lives in the card «Was hier steht» (its own card only while the page is empty) -->
    {#if bikes.length}<HintCard page="care" intro="pflege" />{:else if $bikesQ}<AreaIntro place="pflege" />{/if}
  {/if}
  {#if !bikes.length && $bikesQ}
    <!-- v0.127.0 A-U2: the one empty building block -->
    <Empty icon={BikeIcon} title={t('No bikes yet')} text={t('Add your bike, or bring your data along with a backup.')} action={{ label: t('Add bike'), href: '#/bikes', onclick: wantBike }}>{t('Or bring your data along from a backup:')} <a href="#/me/data">{t('Me › Data and backup')}</a>.</Empty>
  {:else}
    {#if next && nextSoon}{@render trip(next, soonDays)}{/if}
    {#if !openC}
    <CareOverview
      {checks}
      problems={allBikeProblems}
      {tasks}
      {visits}
      {today}
      bikeIdOf={taskBike}
      onopen={(id) => openBike(id)}
      ondone={(id, r) => doneRow(viewById[id], r)}
      onflow={(id, key, mode) => (partOpen = { bikeId: id, key, start: mode })}
      onorder={(id) => (orderOpen = id)}
      onrepair={repairResult}
      onwork={() => ((workBike = openId ?? bikes[0]?.id ?? null), (workOpen = true))}
    >
      {#snippet afterDue()}
        <!-- Gesamttest 20.10.2026 Design 2: the tip of the day right under «Due now», not above the page -->
        {#if bikes.length}<TipLine page="care" name={t('Bike care')} />{/if}
      {/snippet}
    </CareOverview>
    {/if}

    {#snippet trip(x, soon = null)}
      <TripCare {soon} trip={x.trip} rows={x.rows} rules={x.rules} care={x.care} prep={x.prep} wear={x.wear} focus={x.trip.id === tripId} bikeName={bikeById[x.trip.bikeId]?.name} {today} order={orderOf[x.trip.bikeId]?.order} onorder={() => (orderOpen = x.trip.bikeId)} onresult={(r, result) => prepResult(x.trip, r, result)} onall={() => prepAll(x.trip, x.rows)} onundo={(r) => undoPrep(x.trip, r)} onevent={(on) => db.trips.update(x.trip.id, { event: on })} />
    {/snippet}
    {#if next && !nextSoon}{@render trip(next)}{/if}
    {#if later.length}
      <div class="folds"><Fold label={t('Later trips')} summary={later.map((x) => x.trip.title).join(' · ')} bind:open={laterOpen}>{#each later as x (x.trip.id)}{@render trip(x)}{/each}</Fold></div>
    {/if}

    {#if reviewing && reviewQueue.length}
      {@const rv = reviewQueue[0]}
      <section class="review card" aria-labelledby="rev-h">
        <div class="rev-head">
          <h2 id="rev-h" class="title">{t('Go through the June tasks')}</h2>
          <span class="num">{t('{n} left', { n: review.length })}</span>
          <button type="button" class="btn" onclick={() => (reviewing = false)}>{t('Stop')}</button>
        </div>
        <p class="cat">{bikeById[taskBike(rv)]?.name ?? rv.subject} · {rv.category} · {PRIO[rv.priority] ? t(PRIO[rv.priority]) : ''}</p>
        <p class="name">{rv.task}</p>
        {#if rv.note}<p class="sub">{rv.note}</p>{/if}
        <div class="row">
          <button type="button" class="btn hi" onclick={() => repairResult(rv, 'done')}>{t('Done|task')}</button>
          <button type="button" class="btn" onclick={() => repairResult(rv, 'open')}>{t('Still open')}</button>
          <button type="button" class="btn" onclick={() => repairResult(rv, 'needed')} data-explain={t('Work needed soon')}>{t('Soon needed|work')}</button>
          <button type="button" class="btn" onclick={() => repairResult(rv, 'gone')} data-explain={t('Not needed any more')}>{t('Not needed|care')}</button>
          <button type="button" class="link" onclick={() => (skipped = [...skipped.filter((x) => x !== rv.id), rv.id])}>{t('Skip')}</button>
        </div>
      </section>
    {:else if review.length}
      <p class="rev-cta">{tn(review.length, '{n} task from the Excel (June) is not checked yet.', '{n} tasks from the Excel (June) are not checked yet.')} <button type="button" class="btn sm" onclick={() => (reviewing = true)}>{t('Go through them')}</button></p>
    {/if}

    {#snippet bikeCare(c)}
      <BikeCare
        {c}
        {tasks}
        {visits}
        {wished}
        {filter}
        {today}
        kmMsg={kmMsg?.bikeId === c.bike.id ? kmMsg : null}
        open={openId === c.bike.id}
        ontoggle={(isOpen) => toggled(c.bike.id, isOpen)}
        onkm={(text) => saveKm(c.bike, text)}
        oncheck={(keys, action, note) => checkAndSay(c.bike, keys, action, note)}
        ondone={(r) => doneRow(c.bike, r)}
        onpart={(key) => (partOpen = { bikeId: c.bike.id, key })}
        ontyre={(w, value) => setTyre(bikeById[c.bike.id], w, value)}
        onvisit={(id) => (visitOpen = id)}
        onorder={() => (orderOpen = c.bike.id)}
        onwish={(s) => wishTime(c.bike, s)}
        onrepair={repairResult}
        onstart={() => (startOpen = c.bike.id)}
        {kmEntries}
        {bikes}
        onstartpoint={(key, main) => (startPoint = { bikeId: c.bike.id, key, missing: main.filter((p) => !partStart(p)).map((p) => p.key) })}
        onq1={(on) => setQ1(c.bike.id, on)}
        stored={bikeById[c.bike.id] ?? null}
        oncare={(patch) => db.bikes.update(c.bike.id, patch)}
      />
    {/snippet}
    {#if openC}
      <!-- Design-Refresh P7 (V7): the open bike is the page; «Show parts» above it, the other bikes
           one row each below it (a tap opens that bike's page). -->
      <div class="chips pgchips" role="group" aria-label={t('Show parts')}>
        {#each FILTERS as [k, label] (k)}
          <button type="button" class="chip" aria-pressed={filter === k} onclick={() => setFilter(k)}>{t(label)}</button>
        {/each}
      </div>
      <!-- UI-Grundlagen (Noah 20.10.2026, idea 4 «Fällig direkt erledigen»): what is open on this bike comes first,
           so «3 fällig · Ansehen» on Heute lands on the work itself; km book and parts follow. -->
      {@const openHere = bikeProblems.some((x) => taskBike(x) === openC.bike.id)}
      {#if openHere}<ProblemList repairs={allBikeProblems.filter((x) => taskBike(x) === openC.bike.id)} bikes={[openC.bike]} {today} bikeIdOf={taskBike} onrepair={repairResult} />{/if}
      <!-- keyed: another bike is a fresh page (no part row left open from the bike before) -->
      <section class="per-bike" aria-label={t('Each bike')}>{#key openC.bike.id}{@render bikeCare(openC)}{/key}</section>
      <!-- The problems of this bike stay on its page (the overview lists those of every bike). -->
      {#if !openHere}<ProblemList repairs={allBikeProblems.filter((x) => taskBike(x) === openC.bike.id)} bikes={[openC.bike]} {today} bikeIdOf={taskBike} onrepair={repairResult} />{/if}
      {#if checks.length > 1}
        <section class="per-bike others" aria-labelledby="others-h">
          <h2 id="others-h" class="oh">{t('Other bikes')}</h2>
          <div class="card orows">
            {#each checks.filter((x) => x.bike.id !== openC.bike.id) as c (c.bike.id)}{@render bikeCare(c)}{/each}
          </div>
        </section>
      {/if}
    {/if}

    {#if otherRepairs.length}
      <div class="folds"><Fold label={t('Other')} summary={tn(otherRepairs.length, '{n} open task not on a bike', '{n} open tasks not on a bike')}>
        <ul class="rows">
          {#each otherRepairs as rp (rp.id)}
            <li class:need={rp.status === 'needed'}>
              <span class="when">{rp.subject}</span>
              <span class="txt">{rp.task}</span>
              <span class="acts">
                <button type="button" class="btn sm" onclick={() => repairResult(rp, 'done')}>{t('Done|task')}</button>
                <button type="button" class="x" aria-label={t('Not needed any more: {task}', { task: rp.task })} onclick={() => repairResult(rp, 'gone')}>×</button>
              </span>
            </li>
          {/each}
        </ul>
      </Fold></div>
    {/if}
  {/if}
  {#if !openC && bikes.length}<PageMore page="care" name={t('Bike care')} />{/if}
</div>

{#if notice}
  {#key notice.id}<p class="notice" role="status"><CheckIcon size={16} aria-hidden="true" /><span class="nt">{notice.text}</span>{#if notice.undo}<button type="button" class="undo" data-explain={explain('Undo')} onclick={undoSave}>{t('Undo')}</button>{/if}</p>{/key}
{/if}

{#if partOpen}
  {@const b = viewById[partOpen.bikeId]}
  {@const part = b?.parts.find((p) => p.key === partOpen.key)}
  {#if b && part}
    <PartDialog {part} bike={b} {by} onby={setBy} onlog={(entry) => savePart(b, part.key, entry)} onclose={() => (partOpen = null)}
      onflow={(x) => saveFlow(b, x)} onspec={(f, v) => saveSpec(b.id, part.key, f, v)} {shops} tyres={orderOf[b.id]?.tyres} ontyre={(w, v) => setTyre(bikeById[b.id], w, v)} start={partOpen.start ?? null} />
  {/if}
{/if}

{#if startPoint && viewById[startPoint.bikeId]}
  {@const sb = viewById[startPoint.bikeId]}
  {@const sp = sb.parts.find((p) => p.key === startPoint.key)}
  {#if sp}
    {#key startPoint.key}
      <StartPointDialog bike={sb} part={sp} {bikes} entries={kmEntries} missing={startPoint.missing} onsave={(e) => saveStartPoint(sb.id, sp.key, e)} onnext={(key) => (startPoint = { ...startPoint, key, missing: startPoint.missing.filter((k) => k !== startPoint.key) })} onclose={() => (startPoint = null)} />
    {/key}
  {/if}
{/if}

{#if startOpen && viewById[startOpen]}
  <StartValues bike={bikeById[startOpen]} onsave={(v) => saveStart(startOpen, v)} onclose={() => (startOpen = null)} />
{/if}

{#if workOpen}
  {@const wb = viewById[workBike] ?? views[0]}
  <!-- v0.48.0 (Pflege C): «Record work»: pick the bike and the part; the part then offers Replace and Service. -->
  <!-- Design-Refresh P7: «Record work» as a window of the bike pages (bike and part as chips). -->
  <dialog use:backClose class="sheet vdlg" bind:this={workDialog} onclose={() => (workOpen = false)} aria-labelledby="work-h">
    <div class="vd-head">
      <div class="vd-t"><h2 id="work-h" class="title">{t('Record work')}</h2><p class="vd-sub">{t('Pick the bike and the part')}</p></div>
      <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => workDialog.close()}><X size={20} aria-hidden="true" /></button>
    </div>
    {#if views.length > 1}
      <p class="lbl">{t('Bike')}</p>
      <div class="wchips vd-chips" role="group" aria-label={t('Bike')}>
        {#each views as v (v.id)}<button type="button" class="wchip vd-chip" aria-pressed={wb?.id === v.id} onclick={() => (workBike = v.id)}>{v.name}</button>{/each}
      </div>
    {/if}
    <p class="lbl">{t('Part')}</p>
    <div class="wchips vd-chips" role="group" aria-label={t('Part')}>
      {#each (wb?.parts ?? []).filter((p) => !isMore(p)) as p (p.key)}<button type="button" class="wchip vd-chip" onclick={() => ((partOpen = { bikeId: wb.id, key: p.key, start: null }), workDialog.close())}>{nameOfPart(p)}</button>{/each}
    </div>
    <div class="wfoot vd-foot"><button type="button" class="btn" onclick={() => workDialog.close()}>{t('Cancel')}</button></div>
  </dialog>
{/if}

{#if visitOpen}
  {@const v = visits.find((x) => x.id === visitOpen)}
  {#if v}
    <VisitDialog visit={v} bike={viewById[v.bikeId]} onclose={() => (visitOpen = null)} />
  {/if}
{/if}

{#if orderOpen && orderOf[orderOpen]?.order}
  {@const c = orderOf[orderOpen]}
  <OrderDialog order={c.order} bike={c.bike} trip={c.orderTrip} {bikeNames} onclose={() => (orderOpen = null)} />
{/if}

<style>
  /* v0.30.1 (D2): a short line after a save, above the bottom bar, so it is seen wherever the page is scrolled. */
  /* v0.117.0 «Knöpfe neu» (N2): a dark bar with a tick, the text and an underlined «Rückgängig». */
  .notice .undo {
    flex: none;
    min-height: 44px;
    padding: 0 6px;
    border: 0;
    background: none;
    color: var(--paper);
    font: 600 var(--fs-small) var(--font-body);
    text-decoration: underline;
    text-underline-offset: 3px;
    white-space: nowrap;
    cursor: pointer;
  }
  .notice {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: calc(16px + env(safe-area-inset-bottom));
    z-index: 30;
    display: flex;
    align-items: center;
    gap: 10px;
    width: max-content;
    max-width: min(560px, calc(100vw - 32px));
    box-sizing: border-box;
    margin: 0;
    padding: 6px 12px 6px 16px;
    min-height: 48px;
    border-radius: 12px;
    background: var(--ink);
    color: var(--paper);
    font-size: var(--fs-small);
    box-shadow: 0 4px 16px var(--shadow);
  }
  .notice .nt {
    flex: 1 1 auto;
    min-width: 0;
  }
  @media (max-width: 719px) {
    .notice {
      bottom: calc(84px + env(safe-area-inset-bottom));
      width: calc(100vw - 32px);
    }
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .txt {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .per-bike {
    margin: 8px 0 20px;
  }
  /* Design-Refresh P7 (V7): the other bikes as quiet rows in one card below the open bike. */
  .others {
    margin-top: 28px;
  }
  .oh {
    margin: 0 2px 10px;
    font: 600 var(--fs-sub) / 1.25 var(--font-body);
  }
  .orows {
    padding: 0 16px;
  }
  .wchips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 14px;
  }
  .wfoot {
    display: flex;
    justify-content: flex-end;
  }
  /* Design-Refresh P7 (V7): «Show parts» as the light pill chips of the bike pages; the chosen one dark. */
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 12px;
  }
  .chip {
    min-height: 44px;
    padding: 0 16px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    font: 500 var(--fs-small) var(--font-body);
    color: var(--ink);
    white-space: nowrap;
    cursor: pointer;
  }
  .chip:hover {
    background: var(--paper-2);
  }
  .chip[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .folds {
    margin-bottom: 20px;
  }
  .folds :global(.fold) {
    border-bottom: 1.5px solid var(--line);
  }
  .rows li {
    display: grid;
    grid-template-columns: 60px 1fr auto;
    gap: 6px 10px;
    align-items: center;
    padding: 7px 0;
    border-bottom: 1px solid var(--line);
  }
  .rows li.need .txt {
    border-left: 3px solid var(--hi);
    padding-left: 6px;
  }
  .when {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .acts {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: end;
  }
  @media (max-width: 640px) {
    .rows li {
      grid-template-columns: 52px 1fr;
    }
    .rows .acts {
      grid-column: 2;
      justify-content: start;
    }
  }
  .btn.sm {
    padding: 3px 10px;
    font-size: var(--fs-small);
  }
  .link {
    border: 0;
    background: none;
    padding: 0;
    font: inherit;
    font-size: var(--fs-small);
    color: var(--ink);
    text-decoration: underline;
    cursor: pointer;
  }
  .x {
    border: 0;
    background: none;
    font-size: var(--fs-section);
    line-height: 1;
    color: var(--ink-3);
    cursor: pointer;
    padding: 0 4px;
  }
  .review {
    margin-bottom: 24px;
  }
  .rev-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 8px 14px;
  }
  .rev-head .title {
    font-size: var(--fs-sub);
    margin: 0;
  }
  .review .cat {
    margin: 10px 0 0;
    font-size: var(--fs-small);
    font-weight: 700;
    color: var(--ink-3);
  }
  .review .name {
    font-size: var(--fs-section);
    font-weight: 700;
    margin: 4px 0;
  }
  .review .sub {
    color: var(--ink-2);
    margin: 0 0 8px;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .rev-cta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    margin: 0 0 16px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }

  /* v0.47.0 (Noah: one type scale for the care tab, style sheet «Gletscher»). */
  .review .cat {
    font-weight: 500;
    color: var(--ink-3);
  }
  .review .name {
    font-weight: 500;
  }
  .link {
    color: var(--accent);
    text-decoration: none;
    font-weight: 500;
  }
  .link:hover {
    text-decoration: underline;
  }
  .rev-cta {
    color: var(--ink-2);
  }
  .why-due {
    margin: -6px 0 14px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    max-width: 68ch;
  }
</style>
