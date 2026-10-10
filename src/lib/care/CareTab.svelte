<script>
  import { localDay } from '../localday.js';
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { sortBikes } from '../bikes.js';
  import { nextId } from '../gear.js';
  import { chainWish } from '../quickcare.js';
  import { tick } from 'svelte';
  import {
    ensureParts, isPrep, checkState, serviceDue, logPart, parseKm, PART, taskBike, openRepairs, toReview, prepFor, prepRules, upcomingTrips, wishFor, CHECK_KM,
  } from '../care.js';
  import TripCare from './TripCare.svelte';
  import { tickPrep, untickPrep } from './prep.js';
  import { shopSkip } from './last.js';
  import BikeCare from './BikeCare.svelte';
  import CareOverview from './CareOverview.svelte';
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
  import { withVisits, visitsOf, tyreSetup, timeDue, lastPrice, workshopOrder } from '../workshop.js';
  import { hasBike } from '../domains.js';
  import { t, tn, num, dateOf } from '../i18n.svelte.js';
  import { bikeCare, eventPrep } from '../readiness.js';

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
      return { trip: t, rows: prepFor(t, tasks, today), rules: prepRules(t, tasks), care, prep: eventPrep(t, tasks, today) };
    }),
  );
  const checks = $derived(
    views.map((b) => {
      const tyres = tyreSetup(b, visits);
      // N15: one order for the shop, for this bike's next trip (or what is due today).
      const trip = upcomingTrips($tripsQ ?? [], today).find((t) => t.bikeId === b.id) ?? null;
      // v0.31.0: only what I do not usually do myself (care/last.js shopSkip).
      const order = workshopOrder(b, trip, tasks, visits, tyres, today, { skip: shopSkip(b) });
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
  async function checkAndSay(view, keys, action, note, who = by) {
    const entry = await checkParts(view, keys, action, note, who);
    saved(view, keys, entry);
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
    document.getElementById(`care-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  const toggled = (id, isOpen) => {
    openId = isOpen ? id : null;
    if (isOpen) onbike?.(id);
  };
  const next = $derived(trips[0] ?? null);
  const later = $derived(trips.slice(1));
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
  {#if !bikes.length && $bikesQ}
    <p class="card">{t('No bikes yet. Import your data on the')} <a href="#/">{t('start page')}</a>.</p>
  {:else}
    <CareOverview
      {checks}
      problems={allBikeProblems}
      {tasks}
      {visits}
      {today}
      bikeIdOf={taskBike}
      onopen={(id) => openBike(id)}
      ondone={(id, r) => checkAndSay(viewById[id], [r.part], 'service', r.kind === 'time' ? r.name : '', 'self')}
      onflow={(id, key, mode) => (partOpen = { bikeId: id, key, start: mode })}
      onorder={(id) => (orderOpen = id)}
      onrepair={repairResult}
      onwork={() => ((workBike = openId ?? bikes[0]?.id ?? null), (workOpen = true))}
    />

    {#snippet trip(x)}
      <TripCare trip={x.trip} rows={x.rows} rules={x.rules} care={x.care} prep={x.prep} focus={x.trip.id === tripId} bikeName={bikeById[x.trip.bikeId]?.name} {today} order={orderOf[x.trip.bikeId]?.order} onorder={() => (orderOpen = x.trip.bikeId)} onresult={(r, result) => prepResult(x.trip, r, result)} onall={() => prepAll(x.trip, x.rows)} onundo={(r) => undoPrep(x.trip, r)} onevent={(on) => db.trips.update(x.trip.id, { event: on })} />
    {/snippet}
    {#if next}{@render trip(next)}{/if}
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
          <button type="button" class="btn" onclick={() => repairResult(rv, 'needed')}>{t('Work needed soon')}</button>
          <button type="button" class="btn" onclick={() => repairResult(rv, 'gone')}>{t('Not needed any more')}</button>
          <button type="button" class="link" onclick={() => (skipped = [...skipped.filter((x) => x !== rv.id), rv.id])}>{t('Skip')}</button>
        </div>
      </section>
    {:else if review.length}
      <p class="rev-cta">{tn(review.length, '{n} task from the Excel (June) is not checked yet.', '{n} tasks from the Excel (June) are not checked yet.')} <button type="button" class="btn sm" onclick={() => (reviewing = true)}>{t('Go through them')}</button></p>
    {/if}

    <div class="bhead">
      <h2 class="zlabel">{t('Each bike')}</h2>
      <div class="chips" role="group" aria-label={t('Show parts')}>
        {#each FILTERS as [k, label] (k)}
          <button type="button" class="chip" aria-pressed={filter === k} onclick={() => setFilter(k)}>{t(label)}</button>
        {/each}
      </div>
    </div>
    <section class="per-bike" aria-label={t('Each bike')}>
      {#each checks as c (c.bike.id)}
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
          ondone={(r) => checkAndSay(c.bike, [r.part], 'service', r.kind === 'time' ? r.name : '', 'self')}
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
        />
      {/each}
    </section>

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
</div>

{#if notice}
  {#key notice.id}<p class="notice" role="status"><span>{notice.text}</span>{#if notice.undo}<button type="button" class="undo" onclick={undoSave}>{t('Undo')}</button>{/if}</p>{/key}
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
  <dialog class="sheet" bind:this={workDialog} onclose={() => (workOpen = false)} aria-labelledby="work-h">
    <h2 id="work-h" class="title">{t('Record work')}</h2>
    {#if views.length > 1}
      <p class="lbl">{t('Bike')}</p>
      <div class="wchips" role="group" aria-label={t('Bike')}>
        {#each views as v (v.id)}<button type="button" class="wchip" aria-pressed={wb?.id === v.id} onclick={() => (workBike = v.id)}>{v.name}</button>{/each}
      </div>
    {/if}
    <p class="lbl">{t('Part')}</p>
    <div class="wchips" role="group" aria-label={t('Part')}>
      {#each (wb?.parts ?? []).filter((p) => !isMore(p)) as p (p.key)}<button type="button" class="wchip" onclick={() => ((partOpen = { bikeId: wb.id, key: p.key, start: null }), workDialog.close())}>{nameOfPart(p)}</button>{/each}
    </div>
    <div class="wfoot"><button type="button" class="btn" onclick={() => workDialog.close()}>{t('Cancel')}</button></div>
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
  .notice .undo {
    margin-left: 12px;
    min-height: 36px;
    padding: 0 10px;
    border: 1px solid rgb(255 255 255 / 0.5);
    border-radius: 6px;
    background: none;
    color: var(--paper);
    font: 600 14px var(--font-body);
    cursor: pointer;
  }
  .notice {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: calc(16px + env(safe-area-inset-bottom));
    z-index: 30;
    width: max-content;
    max-width: min(560px, calc(100vw - 32px));
    margin: 0;
    padding: 10px 14px;
    border-radius: 8px;
    background: var(--ink);
    color: var(--paper);
    font-size: 15px;
    box-shadow: 0 4px 16px var(--shadow);
  }
  @media (max-width: 719px) {
    .notice {
      bottom: calc(84px + env(safe-area-inset-bottom));
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
  .bhead {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 16px;
    margin: 18px 0 4px;
  }
  .bhead .zlabel {
    flex: 1 1 200px;
    margin: 0;
  }
  .bhead .chips {
    margin: 0;
  }
  .wchips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 14px;
  }
  .wchip {
    min-height: 44px;
    padding: 6px 14px;
    border: 1.5px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    font: 500 var(--fs-small) var(--font-body);
    color: var(--ink);
    cursor: pointer;
  }
  .wchip[aria-pressed='true'] {
    border-color: var(--hi);
    background: var(--hi-soft);
  }
  .wfoot {
    display: flex;
    justify-content: flex-end;
  }
  /* v0.31.0: the filter as chips (aria-pressed), 44 px high. */
  /* v0.38.0 (Noah 5a): a segmented toggle in one line. */
  .chips {
    display: grid;
    grid-template-columns: repeat(4, auto);
    gap: 2px;
    width: max-content;
    max-width: 100%;
    margin: 0 0 12px;
    padding: 3px;
    border-radius: 12px;
    background: var(--paper-2);
  }
  /* v0.47.0 (style sheet «Gletscher»): the soft segmented control of ui/Seg. */
  .chip {
    min-height: 44px;
    min-width: 0;
    padding: 4px 12px;
    border: 0;
    border-radius: 9px;
    background: transparent;
    font: 500 14px var(--font-body);
    color: var(--ink-2);
    white-space: nowrap;
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    background: var(--paper);
    color: var(--ink);
    font-weight: 600;
    box-shadow: 0 1px 3px var(--shadow);
  }
  @media (max-width: 400px) {
    .chips {
      width: 100%;
      grid-template-columns: repeat(4, minmax(0, auto));
    }
    .chip {
      padding: 4px 8px;
      font-size: 13px;
    }
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
    font-size: 14px;
    color: var(--ink);
    text-decoration: underline;
    cursor: pointer;
  }
  .x {
    border: 0;
    background: none;
    font-size: 20px;
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
    font-size: 20px;
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
    font-size: 14px;
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
</style>
