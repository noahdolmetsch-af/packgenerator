<script>
  import { localDay } from '../localday.js';
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { sortBikes } from '../bikes.js';
  import { nextId } from '../gear.js';
  import { tick } from 'svelte';
  import {
    ensureParts, checkState, serviceDue, logPart, parseKm, PART, taskBike, openRepairs, toReview, prepFor, prepRules, upcomingTrips, wishFor, CHECK_KM,
  } from '../care.js';
  import TripCare from './TripCare.svelte';
  import { tickPrep, untickPrep } from './prep.js';
  import BikeCare from './BikeCare.svelte';
  import Fold from '../ui/Fold.svelte';
  import PartDialog from './PartDialog.svelte';
  import VisitDialog from './VisitDialog.svelte';
  import OrderDialog from './OrderDialog.svelte';
  import { withVisits, visitsOf, tyreSetup, timeDue, lastPrice, workshopOrder } from '../workshop.js';
  import { hasBike } from '../domains.js';
  import { t, tn, num } from '../i18n.svelte.js';
  import { bikeCare, bikeCareWords, eventPrep } from '../readiness.js';

  // v0.21.0 (answer 7a): Bike care is the Care tab of Bikes. bikeId: the bike chosen on the page;
  // open: open that bike's section (a link "Bike care for the …").
  // tripId (v0.22.0, AP06): a link "Event preparation" opens that trip's preparation.
  let { bikeId = null, open = false, tripId = null, onbike, onopened } = $props();

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const tripsQ = liveQuery(() => db.trips.toArray());
  const tasksQ = liveQuery(() => db.maintenance.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const visitsQ = liveQuery(() => db.visits.toArray());

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
      const order = workshopOrder(b, trip, tasks, visits, tyres, today);
      const care = bikeCare(b, { tasks, visits, today });
      return { bike: b, check: checkState(b), services: serviceDue(b), tyres, time: timeDue(b, tyres, today), mine: visitsOf(visits, b.id), order, orderTrip: trip, care };
    }),
  );
  // v0.22.0 (AP06): "Due now" is Bike care of every bike, the same rows as Home and Pack count
  // (services by time and km, the 1000 km check, worn parts, open repairs). Answer 17b
  // ("services by time only here") is replaced: Home said "all fine" next to an overdue sealant.
  const overdue = $derived(checks.flatMap((c) => c.care.rows.map((r) => ({ ...r, bike: c.bike }))));
  const blind = $derived(checks.filter((c) => c.care.status === 'nodata'));

  /* ---------- parts ---------- */
  let partOpen = $state(null); // { bike, part }

  async function savePart(view, key, entry) {
    const bike = bikeById[view.id];
    await db.bikes.update(bike.id, { parts: logPart(bike.parts, key, entry) });
    saved(view, [key], entry);
    // "Replace needed" puts the part on the wishlist (answer 6), with the last price paid (answer 19a).
    if (entry.result === 'needed') await wish(view, key, entry.model);
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
  async function checkParts(view, keys, action = 'check', note = '') {
    const bike = bikeById[view.id];
    let parts = bike.parts;
    const entry = { date: today, km: bike.km ?? null, value: null, action, result: action === 'check' ? 'ok' : 'done', by, model: null, note };
    for (const k of keys) parts = logPart(parts, k, entry);
    await db.bikes.update(bike.id, { parts });
    return entry;
  }

  /* ---------- what was just saved (v0.30.1, D1 + D2: Noah did not see that it worked) ---------- */
  let notice = $state(null); // { id, text }
  let noticeTimer;
  function say(text) {
    clearTimeout(noticeTimer);
    notice = { id: Date.now(), text };
    noticeTimer = setTimeout(() => (notice = null), 6000);
  }
  const WHAT = (entry, key) =>
    entry.result === 'needed' ? t('work needed') : entry.action === 'check' ? t('checked, OK') : entry.action === 'service' ? t('serviced') : PART[key]?.unit ? t('replaced') : t('done');
  /** "Saved: Tyres + sealant, done, 2026-10-08 · 3'200 km. Next time 2027-01-06." */
  function saved(view, keys, entry) {
    const parts = keys.map((k) => (PART[k] ? t(PART[k].name) : k)).join(', ');
    const vars = { part: parts, what: WHAT(entry, keys[0]), date: entry.date, km: num(entry.km) };
    let text = entry.km != null ? t('Saved: {part}, {what}, {date} · {km} km.', vars) : t('Saved: {part}, {what}, {date}.', vars);
    // A service by time: say when it is due next (sealant every 90 days, fork once a year).
    const timed = keys.length === 1 && entry.result === 'done' && entry.action !== 'check' ? checks.find((c) => c.bike.id === view.id)?.time.find((s) => s.key === keys[0]) : null;
    if (timed) text += ` ${t('Next time {date}.', { date: new Date(Date.parse(`${entry.date}T00:00:00Z`) + timed.every * 864e5).toISOString().slice(0, 10) })}`;
    say(text);
  }
  async function checkAndSay(view, keys, action, note) {
    const entry = await checkParts(view, keys, action, note);
    saved(view, keys, entry);
  }

  // v0.30.1 (D1): km typed the Swiss or German way ("2'287", "2.287", "2 287") are saved and said.
  let kmMsg = $state(null); // { bikeId, text, error }
  async function saveKm(bike, text) {
    const n = parseKm(text);
    if (n === null) return null; // an empty field keeps the km: nothing is lost by clearing it by mistake
    if (Number.isNaN(n)) {
      kmMsg = { bikeId: bike.id, text: t('Type the km as a whole number, e.g. 12400.'), error: true };
      return null;
    }
    await db.bikes.update(bike.id, { km: n, kmDate: today });
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

  /* ---------- tube or tubeless per wheel (answer 12a) ---------- */
  const setTyre = (bike, wheel, value) => db.bikes.update(bike.id, { tyreSetup: { ...tyreSetup(bike, visits), ...(bike.tyreSetup ?? {}), [wheel]: value } });

  /* ---------- workshop visits (answers 7a, 8a) ---------- */
  let visitOpen = $state(null); // visit id
  let orderOpen = $state(null); // bike id
  const orderOf = $derived(Object.fromEntries(checks.map((c) => [c.bike.id, c])));
  const bikeNames = $derived(Object.fromEntries(bikes.map((b) => [b.id, b.name])));
  const inDays = (d) => (d <= 0 ? (d === 0 ? t('due today') : tn(-d, '{n} day overdue', '{n} days overdue')) : d < 45 ? tn(d, 'in {n} day', 'in {n} days') : tn(Math.round(d / 30.4), 'in {n} month', 'in {n} months'));

  const PRIO = { high: 'High', medium: 'Medium', low: 'Low' };

  /* ---------- one section per bike, closed until opened (v0.21.0) ---------- */
  let opened = $state({});
  async function openBike(id) {
    opened = { ...opened, [id]: true };
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
  const toggled = (id, isOpen) => {
    opened = { ...opened, [id]: isOpen };
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

<!-- v0.21.0 (answer 7a): first what is due on all bikes, then the next trip, then one closed line per bike. -->
<div class="care">
  <div class="by" role="group" aria-label={t('Work done by')}>
    <span class="lbl">{t('Work done by')}</span>
    <button type="button" class="toggle" aria-pressed={by === 'self'} onclick={() => setBy('self')}>{t('Me')}</button>
    <button type="button" class="toggle" aria-pressed={by === 'shop'} onclick={() => setBy('shop')}>{t('Bike shop')}</button>
  </div>

  {#if !bikes.length && $bikesQ}
    <p class="card">{t('No bikes yet. Import your data on the')} <a href="#/">{t('start page')}</a>.</p>
  {:else}
    <section class="due" class:calm={!overdue.length} aria-labelledby="due-h">
      <h2 id="due-h" class="title">{t('Bike care: due now')} <small>{overdue.length || ''}</small></h2>
      {#if overdue.length}
        <ul>
          {#each overdue as o (`${o.bike.id}:${o.key}`)}
            <li>
              <span><b>{o.bike.name}: {o.name}</b><small>{o.detail}</small></span>
              {#if o.kind === 'time' || o.kind === 'km'}
                <button type="button" class="btn sm" onclick={() => checkAndSay(o.bike, [o.part], 'service', o.kind === 'time' ? o.name : '')}>{t('Done|task')}</button>
              {:else}
                <button type="button" class="btn sm" onclick={() => openBike(o.bike.id)}>{t('Open')}</button>
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <p class="none">{blind.length ? t('Nothing due on the bikes with data.') : t('Nothing is due on your bikes right now.')}</p>
      {/if}
      {#if blind.length}
        <!-- Missing data is not "fine" (AP06): say which bikes the app cannot judge. -->
        <p class="none">{t('No data: {bikes}', { bikes: blind.map((c) => c.bike.name).join(', ') })} · {t('enter km and record a check or service')}</p>
      {/if}
      {#if checks.some((c) => c.order?.rows.length)}
        <p class="orders">
          <span class="lbl">{t('For the bike shop')}</span>
          {#each checks.filter((c) => c.order?.rows.length) as c (c.bike.id)}
            <button type="button" class="btn sm" onclick={() => (orderOpen = c.bike.id)}>{t('Workshop order {bike} · about CHF {chf}', { bike: c.bike.name, chf: c.order.total })}</button>
          {/each}
        </p>
      {/if}
    </section>

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

    <section class="per-bike" aria-label={t('Each bike')}>
      {#each checks as c (c.bike.id)}
        <BikeCare
          {c}
          {tasks}
          repairs={repairsFor(c.bike.id)}
          {wished}
          kmMsg={kmMsg?.bikeId === c.bike.id ? kmMsg : null}
          open={!!opened[c.bike.id]}
          ontoggle={(isOpen) => toggled(c.bike.id, isOpen)}
          onkm={(text) => saveKm(c.bike, text)}
          oncheck={(keys, action, note) => checkAndSay(c.bike, keys, action, note)}
          onpart={(key) => (partOpen = { bikeId: c.bike.id, key })}
          ontyre={(w, value) => setTyre(bikeById[c.bike.id], w, value)}
          onvisit={(id) => (visitOpen = id)}
          onorder={() => (orderOpen = c.bike.id)}
          onwish={(s) => wishTime(c.bike, s)}
          onrepair={repairResult}
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
  {#key notice.id}<p class="notice" role="status">{notice.text}</p>{/key}
{/if}

{#if partOpen}
  {@const b = viewById[partOpen.bikeId]}
  {@const part = b?.parts.find((p) => p.key === partOpen.key)}
  {#if b && part}
    <PartDialog {part} bike={b} {by} onlog={(entry) => savePart(b, part.key, entry)} onclose={() => (partOpen = null)} />
  {/if}
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
    box-shadow: 0 4px 16px rgb(0 0 0 / 0.25);
  }
  @media (max-width: 719px) {
    .notice {
      bottom: calc(84px + env(safe-area-inset-bottom));
    }
  }
  .by {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    margin: -4px 0 12px;
  }
  .by .lbl {
    margin: 0 4px 0 0;
  }
  /* v0.27.0 (AP21): 40 px high for a thumb (were 27 px). */
  .toggle {
    border: 1.5px solid var(--ink);
    background: var(--paper);
    border-radius: 999px;
    min-height: 40px;
    padding: 4px 14px;
    font: 600 14px var(--font-body);
    color: var(--ink);
    cursor: pointer;
  }
  .toggle[aria-pressed='true'] {
    background: var(--ink);
    color: var(--paper);
  }
  /* Design audit C1: calm card with an orange edge instead of a pink alarm. */
  .due {
    border: 1px solid var(--line);
    border-left: 6px solid var(--hi);
    border-radius: 6px;
    background: var(--paper);
    padding: 10px 14px;
    margin-bottom: 20px;
  }
  .due.calm {
    border-left-width: 2px;
  }
  .due .title {
    font-size: var(--fs-sub);
    margin: 0 0 6px;
  }
  .due ul,
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .due li {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 6px 12px;
    padding: 6px 0;
    border-top: 1px solid var(--line);
  }
  .due li > span:first-child,
  .txt {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .none {
    margin: 0;
    color: var(--ink-2);
  }
  small {
    font-size: var(--fs-small);
    color: var(--ink-3);
    font-weight: 400;
  }
  .orders {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 10px 0 0;
  }
  .orders .lbl {
    width: 100%;
  }
  .per-bike {
    margin: 8px 0 20px;
    border-top: 1.5px solid var(--line);
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
</style>
