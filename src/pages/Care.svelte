<script>
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { sortBikes } from '../lib/bikes.js';
  import { nextId } from '../lib/gear.js';
  import {
    PART, ensureParts, partInfo, wear, needsWork, lastValue, kmSince, lastReplace, checkState, serviceDue, logPart,
    taskBike, openRepairs, toReview, prepFor, prepRules, upcomingTrips, prepParts, prepService, wishFor, CHECK_KM, bikeLog, EXTRA,
  } from '../lib/care.js';
  import BikesNav from '../lib/care/BikesNav.svelte';
  import PartDialog from '../lib/care/PartDialog.svelte';
  import VisitDialog from '../lib/care/VisitDialog.svelte';
  import { withVisits, visitsOf, visitTotal, tyreSetup, timeDue, costByYear, costByPart, costPer1000, lastPrice, beforeTrip } from '../lib/workshop.js';

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
  const today = new Date().toISOString().slice(0, 10);
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
  // v0.18.0 (answers 9a, 10a): what the bike needs from the workshop before the trip, from 14 days before.
  const trips = $derived(
    upcomingTrips($tripsQ ?? [], today).map((t) => {
      const v = viewById[t.bikeId];
      const shop = v ? beforeTrip(v, t, tyreSetup(v, visits), today) : null;
      return { trip: t, rows: prepFor(t, tasks, today), rules: prepRules(t, tasks), shop: (shop?.rows ?? []).filter((r) => !r.late) };
    }),
  );
  const checks = $derived(
    views.map((b) => {
      const tyres = tyreSetup(b, visits);
      return { bike: b, check: checkState(b), services: serviceDue(b), tyres, time: timeDue(b, tyres, today), mine: visitsOf(visits, b.id) };
    }),
  );
  const overdue = $derived([
    ...trips.flatMap(({ trip, rows }) => rows.filter((r) => r.overdue).map((r) => ({ kind: 'prep', trip, row: r }))),
    ...checks.filter((c) => c.check.due).map((c) => ({ kind: 'check', bike: c.bike, n: c.check.due })),
    ...checks.flatMap((c) => c.services.map((s) => ({ kind: 'service', bike: c.bike, s }))),
    // Answer 17b: services by time show here in Bike care only, not on the start page.
    ...checks.flatMap((c) => c.time.filter((s) => s.overdue).map((s) => ({ kind: 'time', bike: c.bike, s }))),
  ]);

  /* ---------- parts ---------- */
  let partOpen = $state(null); // { bike, part }

  async function savePart(view, key, entry) {
    const bike = bikeById[view.id];
    await db.bikes.update(bike.id, { parts: logPart(bike.parts, key, entry) });
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
    wished = { ...wished, [`${view.id}.${s.key}`]: item ? 'On the wishlist' : 'Already on the wishlist' };
  }

  /** Several parts at once (a 1000 km check, or a preparation task that covers them). */
  async function checkParts(view, keys, action = 'check', note = '') {
    const bike = bikeById[view.id];
    let parts = bike.parts;
    const entry = { date: today, km: bike.km ?? null, value: null, action, result: action === 'check' ? 'ok' : 'done', by, model: null, note };
    for (const k of keys) parts = logPart(parts, k, entry);
    await db.bikes.update(bike.id, { parts });
  }

  let kmMsg = $state('');
  async function saveKm(bike, text) {
    const n = text.trim() === '' ? null : Math.round(Number(text.replace(/['’,\s]/g, '')));
    if (n !== null && !(n >= 0 && n <= 500000)) return (kmMsg = 'Type the km as a whole number, e.g. 12400.');
    kmMsg = '';
    await db.bikes.update(bike.id, { km: n, kmDate: today });
  }

  /* ---------- preparation tasks per trip ---------- */
  async function prepResult(trip, row, result) {
    const state = { result, date: today, by };
    await db.trips.update(trip.id, { prep: { ...(trip.prep ?? {}), [row.task.id]: state } });
    const bike = bikeById[trip.bikeId];
    if (bike && (result === 'ok' || result === 'done')) {
      // The check before the event also counts for the 1000 km check (answer 7).
      const keys = prepParts(row.task);
      if (keys.length) await checkParts(bikeById[trip.bikeId], keys, 'check', `Before ${trip.title}`);
      const svc = prepService(row.task);
      if (svc) await checkParts(bikeById[trip.bikeId], [svc], 'service', `Before ${trip.title}`);
    }
  }
  const undoPrep = (trip, row) => {
    const prep = { ...(trip.prep ?? {}) };
    delete prep[row.task.id];
    return db.trips.update(trip.id, { prep });
  };

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
  const chf = (n) => `CHF ${n.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const inDays = (d) => (d <= 0 ? (d === 0 ? 'due today' : `${-d} days overdue`) : d < 45 ? `in ${d} days` : `in ${Math.round(d / 30.4)} months`);

  const fmtKm = (n) => (n == null ? '–' : `${n.toLocaleString('en')} km`);
  const dueLabel = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const PRIO = { high: 'High', medium: 'Medium', low: 'Low' };
</script>

<div class="care">
  <header class="head">
    <div class="tt">
      <h1 class="title">Bike care</h1>
      <BikesNav current="care" />
    </div>
    <div class="by" role="group" aria-label="Work done by">
      <span class="lbl">Work done by</span>
      <button type="button" class="toggle" aria-pressed={by === 'self'} onclick={() => setBy('self')}>Me</button>
      <button type="button" class="toggle" aria-pressed={by === 'shop'} onclick={() => setBy('shop')}>Bike shop</button>
    </div>
  </header>

  {#if !bikes.length && $bikesQ}
    <p class="card">No bikes yet. Import your data on the <a href="#/">start page</a>.</p>
  {:else}
    {#if overdue.length}
      <section class="due" aria-labelledby="due-h">
        <h2 id="due-h" class="title">Due now <small>{overdue.length}</small></h2>
        <ul>
          {#each overdue as o, n (n)}
            <li>
              {#if o.kind === 'prep'}
                <span><b>{o.row.task.task}</b><small>{o.trip.title} · was due {dueLabel(o.row.due)}{o.row.needed ? ' · work needed' : ''}</small></span>
                <span class="acts">
                  <button type="button" class="btn sm hi" onclick={() => prepResult(o.trip, o.row, 'done')}>Done</button>
                  {@render more(o.row.task.task, [{ name: 'Checked, all OK', run: () => prepResult(o.trip, o.row, 'ok') }, { name: 'Work needed', run: () => prepResult(o.trip, o.row, 'needed') }])}
                </span>
              {:else if o.kind === 'check'}
                <span><b>{o.bike.name}: {CHECK_KM.toLocaleString('en')} km check</b><small>{o.n} points due, see the bike below</small></span>
                <button type="button" class="btn sm" onclick={() => document.getElementById(`care-${o.bike.id}`)?.scrollIntoView({ behavior: 'smooth' })}>Open</button>
              {:else if o.kind === 'time'}
                <span><b>{o.bike.name}: {o.s.name}</b><small>last {o.s.last} · {inDays(o.s.days)}</small></span>
                <span class="acts">
                  <button type="button" class="btn sm hi" onclick={() => checkParts(o.bike, [o.s.key], 'service', o.s.name)}>Done</button>
                  {@render more(o.s.name, [{ name: 'Add to wishlist', run: () => wishTime(o.bike, o.s) }])}
                </span>
              {:else}
                <span><b>{o.bike.name}: {o.s.name}</b><small>{o.s.since} km since the last time (every {o.s.every} km)</small></span>
                <button type="button" class="btn sm hi" onclick={() => checkParts(o.bike, [o.s.key], 'service')}>Done</button>
              {/if}
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <!-- Design audit C2: one main button per row, the other answers behind •••. -->
    {#snippet more(label, actions)}
      <details class="more">
        <summary aria-label="More answers for {label}">•••</summary>
        <div class="more-in">{#each actions as a (a.name)}<button type="button" class="btn sm" onclick={(ev) => (ev.currentTarget.closest('details').open = false, a.run())}>{a.name}</button>{/each}</div>
      </details>
    {/snippet}

    {#each trips as { trip, rules, rows, shop } (trip.id)}
      <section class="block" aria-labelledby="trip-{trip.id}">
        <h2 id="trip-{trip.id}" class="title">Before {trip.title} <small>{trip.startDate} · {bikeById[trip.bikeId]?.name ?? 'no bike'} · {rows.filter((r) => r.finished).length}/{rows.length}</small></h2>
        {#if rows.some((r) => r.overdue)}<p class="hint">{rows.filter((r) => r.overdue).length} overdue tasks are under "Due now".</p>{/if}
        {#if shop.length}
          <div class="shop">
            <span class="lbl">Workshop before the trip</span>
            <ul>{#each shop as r (r.key + r.when)}<li><b>{r.name}</b> <small>{r.detail}</small></li>{/each}</ul>
          </div>
        {/if}
        {#each rules as r (r.task.id)}
          <p class="rule"><span class="lbl">{r.from <= today ? 'Rule now' : `Rule from ${dueLabel(r.from)}`}</span>{r.task.task}</p>
        {/each}
        <ul class="rows">
          {#each rows.filter((r) => !r.overdue) as r (r.task.id)}
            <li class:done={r.finished} class:late={r.overdue} class:need={r.needed}>
              <span class="when num">{dueLabel(r.due)}</span>
              <span class="txt">{r.task.task}{#if r.state}<small>{r.needed ? 'Work needed' : r.state.result === 'ok' ? 'OK' : 'Done'} · {r.state.date}{r.state.by === 'shop' ? ' · bike shop' : ''}</small>{/if}</span>
              <span class="acts">
                {#if r.finished}
                  <button type="button" class="link" onclick={() => undoPrep(trip, r)}>Undo</button>
                {:else}
                  <button type="button" class="btn sm hi" onclick={() => prepResult(trip, r, 'done')}>Done</button>
                  {@render more(r.task.task, [{ name: 'Checked, all OK', run: () => prepResult(trip, r, 'ok') }, { name: 'Work needed', run: () => prepResult(trip, r, 'needed') }])}
                {/if}
              </span>
            </li>
          {/each}
        </ul>
      </section>
    {/each}

    {#if reviewing && reviewQueue.length}
      {@const t = reviewQueue[0]}
      <section class="review card" aria-labelledby="rev-h">
        <div class="rev-head">
          <h2 id="rev-h" class="title">Go through the June tasks</h2>
          <span class="num">{review.length} left</span>
          <button type="button" class="btn" onclick={() => (reviewing = false)}>Stop</button>
        </div>
        <p class="cat">{bikeById[taskBike(t)]?.name ?? t.subject} · {t.category} · {PRIO[t.priority] ?? ''}</p>
        <p class="name">{t.task}</p>
        {#if t.note}<p class="sub">{t.note}</p>{/if}
        <div class="row">
          <button type="button" class="btn hi" onclick={() => repairResult(t, 'done')}>Done</button>
          <button type="button" class="btn" onclick={() => repairResult(t, 'open')}>Still open</button>
          <button type="button" class="btn" onclick={() => repairResult(t, 'needed')}>Work needed soon</button>
          <button type="button" class="btn" onclick={() => repairResult(t, 'gone')}>Not needed any more</button>
          <button type="button" class="link" onclick={() => (skipped = [...skipped.filter((x) => x !== t.id), t.id])}>Skip</button>
        </div>
      </section>
    {:else if review.length}
      <p class="card rev-cta">{review.length} tasks from the Excel (June) are not checked yet. <button type="button" class="btn hi" onclick={() => (reviewing = true)}>Go through them</button></p>
    {/if}

    {#each checks as { bike, check, tyres, time, mine } (bike.id)}
      {@const log = bikeLog(bike, tasks)}
      {@const flags = check.due + bike.parts.filter(needsWork).length + repairsFor(bike.id).length}
      <details class="block bike" id="care-{bike.id}" open={flags > 0 || trips.some(({ trip }) => trip.bikeId === bike.id)}>
        <summary class="bike-h">
          <h2 class="title">{bike.name}{#if flags}<span class="pill red">{flags} open</span>{/if}</h2>
          <label class="km">
            <span class="lbl">km now</span>
            <input class="inp num" type="text" inputmode="numeric" value={bike.km ?? ''} placeholder="not set" onchange={(e) => saveKm(bike, e.currentTarget.value)} />
            {#if bike.kmDate}<small>set {bike.kmDate}</small>{/if}
          </label>
        </summary>
        {#if kmMsg}<p class="err">{kmMsg}</p>{/if}

        <div class="cols">
          <div>
            <h3>{CHECK_KM.toLocaleString('en')} km check {#if check.due}<span class="pill red">{check.due} due</span>{/if}</h3>
            <ul class="checks">
              {#each check.rows as r (r.key)}
                <li class:late={r.due}><span>{r.name}</span><span class="num m">{needsWork(bike.parts.find((p) => p.key === r.key)) ? 'work needed' : r.unknown ? (bike.km == null ? 'set km' : 'not recorded') : `${r.since.toLocaleString('en')} km ago`}</span></li>
              {/each}
            </ul>
            <button type="button" class="btn sm" onclick={() => checkParts(bike, check.rows.map((r) => r.key), 'check', `${CHECK_KM} km check`)}>All checked, OK</button>
            <p class="hint">Something not OK? Open the part on the right and tap "Replace or work needed".</p>
          </div>
          <div>
            <h3>Parts</h3>
            <ul class="parts">
              {#each bike.parts as part (part.key)}
                {@const info = partInfo(part)}
                {@const w = wear(part)}
                {@const v = lastValue(part)}
                {@const since = kmSince(bike, lastReplace(part))}
                <li>
                  <button type="button" class="part" onclick={() => (partOpen = { bikeId: bike.id, key: part.key })}>
                    <span class="pn">{info.name}{#if part.model}<small>{part.model}</small>{/if}</span>
                    <span class="pv num">
                      {#if needsWork(part)}<span class="pill red">work needed</span>{/if}
                      {#if w}<span class="pill {w}">{v.value} {info.unit}</span>{:else if v}{v.value} {info.unit}{/if}
                      {#if since != null && info.unit}<small>{since.toLocaleString('en')} km</small>{/if}
                      {#if !part.history?.length}<small class="m">–</small>{/if}
                    </span>
                  </button>
                </li>
              {/each}
            </ul>
          </div>
        </div>

        <div class="cols">
          <div>
            <h3>Coming up</h3>
            <ul class="checks">
              {#each time as s (s.key)}
                <li class:late={s.overdue}>
                  <span>{s.name}<small>every {s.every >= 365 ? 'year' : `${Math.round(s.every / 30.4)} months`}</small></span>
                  <span class="num m">{s.never ? 'not recorded' : `${s.next} · ${inDays(s.days)}`}</span>
                </li>
              {/each}
            </ul>
            {#each time.filter((s) => s.overdue || (s.days != null && s.days <= 30)) as s (s.key)}
              <p class="hint">{s.name}: <button type="button" class="link" onclick={() => wishTime(bike, s)}>add the parts to the wishlist</button>{#if wished[`${bike.id}.${s.key}`]} · {wished[`${bike.id}.${s.key}`]}{/if}</p>
            {/each}
            <div class="tyres" role="group" aria-label="Tube or tubeless">
              {#each [['front', 'Front'], ['rear', 'Rear']] as [w, label] (w)}
                <span class="tw">
                  <span class="lbl">{label}</span>
                  <button type="button" class="toggle" aria-pressed={tyres[w] === 'tubeless'} onclick={() => setTyre(bikeById[bike.id], w, 'tubeless')}>Tubeless</button>
                  <button type="button" class="toggle" aria-pressed={tyres[w] === 'tube'} onclick={() => setTyre(bikeById[bike.id], w, 'tube')}>Tube</button>
                </span>
              {/each}
            </div>
            <p class="hint">Sealant is only due for tubeless wheels. Brakes are bled when the lever feels soft.</p>
          </div>
          <div>
            <h3>Workshop {#if mine.length}<small>{mine.length} {mine.length === 1 ? 'visit' : 'visits'}</small>{/if}</h3>
            {#if mine.length}
              <ul class="visits">
                {#each mine as v (v.id)}
                  <li>
                    <button type="button" class="part" onclick={() => (visitOpen = v.id)}>
                      <span class="pn">{v.date} · {v.shop}<small>{v.invoice ? `${v.invoice} · ` : ''}{(v.parts ?? []).length} jobs{v.km != null ? ` · ${v.km.toLocaleString('en')} km` : ''}{v.photos?.length ? ` · ${v.photos.length} receipt ${v.photos.length === 1 ? 'photo' : 'photos'}` : ''}</small></span>
                      <span class="pv num">{visitTotal(v) == null ? 'cost unknown' : chf(visitTotal(v))}</span>
                    </button>
                  </li>
                {/each}
              </ul>
              {@const years = costByYear(mine)}
              {@const top = costByPart(mine, 3)}
              {@const per = costPer1000(mine, bike)}
              <p class="costs">
                {#each years as y (y.year)}<span><b>{y.year}</b> {y.unknown === y.visits ? 'cost unknown' : `${chf(y.chf)}${y.unknown ? ' + unknown' : ''}`}</span>{/each}
                <span>{per?.chf != null ? `${chf(per.chf)} per 1000 km` : per?.wait ? `Cost per 1000 km after ${per.wait.toLocaleString('en')} more km` : 'Cost per 1000 km: add the km at a visit'}</span>
              </p>
              <p class="hint">Most: {top.map((r) => `${r.name} ${chf(r.chf)}`).join(' · ')}</p>
            {:else}
              <p class="hint">No workshop visits yet. Send Claude a photo of the receipt; it comes back as a file to import.</p>
            {/if}
          </div>
        </div>

        {#if repairsFor(bike.id).length}
          <h3>Repairs</h3>
          <ul class="rows">
            {#each repairsFor(bike.id) as t (t.id)}
              <li class:need={t.status === 'needed'}>
                <span class="when">{PRIO[t.priority] ?? ''}</span>
                <span class="txt">{t.task}{#if t.note}<small>{t.note}</small>{/if}</span>
                <span class="acts">
                  <button type="button" class="btn sm hi" onclick={() => repairResult(t, 'done')}>Done</button>
                  {@render more(t.task, [{ name: 'Work needed', run: () => repairResult(t, 'needed') }, { name: 'Not needed any more', run: () => repairResult(t, 'gone') }])}
                </span>
              </li>
            {/each}
          </ul>
        {/if}

        <details class="log">
          <summary>What was done when <small>{log.length}</small></summary>
          {#if log.length}
            <ol>
              {#each log as h, n (n)}
                <li>
                  <span class="num when">{h.date}{h.km != null ? ` · ${h.km.toLocaleString('en')} km` : ''}</span>
                  <span><b>{h.what}</b>: {h.action === 'repair' ? 'done' : h.action === 'replace' ? (h.unit ? 'replaced' : 'done') : h.action === 'service' ? 'serviced' : h.result === 'needed' ? 'work needed' : 'checked, OK'}{h.value != null ? ` · ${h.value} ${h.unit}` : ''}{#each Object.keys(EXTRA).filter((k) => h[k] != null) as k (k)}{` · ${EXTRA[k].name.toLowerCase()} ${h[k]} ${EXTRA[k].unit}`}{/each}{h.by === 'shop' ? ' · bike shop' : ''}{h.note ? ` · ${h.note}` : ''}</span>
                </li>
              {/each}
            </ol>
          {:else}
            <p class="hint">Nothing recorded yet. The service photos will be the first entries.</p>
          {/if}
        </details>
      </details>
    {/each}

    {#if otherRepairs.length}
      <section class="block" aria-labelledby="other-h">
        <h2 id="other-h" class="title">Other</h2>
        <ul class="rows">
          {#each otherRepairs as t (t.id)}
            <li class:need={t.status === 'needed'}>
              <span class="when">{t.subject}</span>
              <span class="txt">{t.task}</span>
              <span class="acts">
                <button type="button" class="btn sm hi" onclick={() => repairResult(t, 'done')}>Done</button>
                <button type="button" class="x" aria-label="Not needed any more: {t.task}" onclick={() => repairResult(t, 'gone')}>×</button>
              </span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}
  {/if}
</div>

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

<style>
  .tyres {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
    margin-top: 10px;
  }
  .tw {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .tw .lbl {
    margin: 0 4px 0 0;
  }
  .visits {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .costs {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin: 8px 0 0;
    font-size: 15px;
  }
  .checks li small {
    margin-left: 6px;
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: end;
    gap: 12px 24px;
    margin-bottom: 16px;
  }
  .head .title {
    font-size: clamp(48px, 11vw, 88px);
    line-height: 0.95;
    margin: 0;
  }
  .tt {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 20px;
  }
  .by {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .by .lbl {
    margin: 0 4px 0 0;
  }
  .toggle {
    border: 1.5px solid var(--ink);
    background: var(--paper);
    border-radius: 999px;
    padding: 4px 12px;
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
    border: 2px solid var(--ink);
    border-left: 6px solid var(--hi);
    border-radius: 6px;
    background: var(--paper);
    padding: 10px 14px;
    margin-bottom: 20px;
  }
  .due .title {
    font-size: 24px;
    margin: 0 0 6px;
  }
  .rule {
    margin: 4px 0 8px;
    padding: 6px 10px;
    background: var(--paper-2);
    border-radius: 4px;
    font-size: 14px;
  }
  .rule .lbl {
    margin: 0 0 2px;
  }
  .more {
    position: relative;
  }
  .more > summary {
    list-style: none;
    cursor: pointer;
    padding: 2px 8px;
    border: 1.5px solid var(--line);
    border-radius: 4px;
    font-weight: 700;
    color: var(--ink-2);
  }
  .more > summary::-webkit-details-marker {
    display: none;
  }
  .more-in {
    position: absolute;
    right: 0;
    top: calc(100% + 4px);
    z-index: 4;
    display: grid;
    gap: 6px;
    min-width: 170px;
    padding: 8px;
    background: var(--paper);
    border: 2px solid var(--ink);
    border-radius: 6px;
    box-shadow: 0 6px 18px rgba(15, 46, 39, 0.18);
  }
  .due ul,
  .rows,
  .checks,
  .parts {
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
  small {
    font-size: 13px;
    color: var(--ink-3);
    font-weight: 400;
  }
  .block {
    margin-bottom: 28px;
  }
  .block > .title,
  .bike-h .title {
    font-size: 28px;
    margin: 0 0 8px;
    border-bottom: 3px solid var(--ink);
    padding-bottom: 4px;
  }
  .block > .title small {
    font-family: var(--font-body);
    font-size: 14px;
  }
  .rows li {
    display: grid;
    grid-template-columns: 60px 1fr auto;
    gap: 6px 10px;
    align-items: center;
    padding: 7px 0;
    border-bottom: 1px solid var(--line);
  }
  .rows li.done .txt {
    color: var(--ink-3);
    text-decoration: line-through;
  }
  .rows li.late .when,
  .late {
    color: var(--ink);
    font-weight: 700;
  }
  .rows li.need .txt {
    border-left: 3px solid var(--hi);
    padding-left: 6px;
  }
  .when {
    font-size: 13px;
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
    font-size: 13px;
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
  .bike-h {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: end;
    gap: 8px 16px;
    border-bottom: 3px solid var(--ink);
    margin-bottom: 10px;
  }
  .bike-h .title {
    border: 0;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  summary.bike-h {
    cursor: pointer;
    list-style: none;
  }
  summary.bike-h::-webkit-details-marker {
    display: none;
  }
  summary.bike-h .title::before {
    content: '▸';
    font-size: 20px;
  }
  details[open] > summary.bike-h .title::before {
    content: '▾';
  }
  .km {
    display: flex;
    align-items: center;
    gap: 6px;
    padding-bottom: 6px;
  }
  .km .lbl {
    margin: 0;
  }
  .km .inp {
    width: 110px;
  }
  .cols {
    display: grid;
    gap: 16px 28px;
  }
  @media (min-width: 900px) {
    .cols {
      grid-template-columns: 1fr 1.3fr;
    }
  }
  h3 {
    font-size: 16px;
    margin: 6px 0;
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .checks li {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 4px 0;
    border-bottom: 1px solid var(--line);
    font-size: 15px;
  }
  .m {
    color: var(--ink-3);
    font-size: 13px;
  }
  .checks + .btn {
    margin-top: 8px;
  }
  .hint {
    font-size: 13px;
    color: var(--ink-3);
    margin: 6px 0 0;
  }
  .part {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 6px 4px;
    border: 0;
    border-bottom: 1px solid var(--line);
    background: none;
    font: inherit;
    color: var(--ink);
    text-align: left;
    cursor: pointer;
  }
  @media (hover: hover) {
    .part:hover {
      background: var(--hi-soft);
    }
  }
  .pn {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .pv {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: wrap;
    justify-content: end;
  }
  .pill {
    padding: 1px 8px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    background: #d9eedf;
    color: #2f7a4f;
  }
  .pill.warn {
    background: var(--hi-soft);
    color: var(--ink);
  }
  .pill.red {
    background: var(--hi-soft);
    color: var(--ink);
  }
  /* Red stays for worn parts only: brakes, chain (safety). */
  .pill.worn {
    background: #f6d5d0;
    color: #b42318;
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
    font-size: 24px;
    margin: 0;
  }
  .review .cat {
    margin: 10px 0 0;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
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
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 24px;
  }
  .err {
    color: #b42318;
    font-size: 14px;
  }
  .log {
    margin-top: 14px;
  }
  .log summary {
    cursor: pointer;
    font-weight: 700;
  }
  .log ol {
    list-style: none;
    margin: 6px 0 0;
    padding: 0;
  }
  .log li {
    display: grid;
    grid-template-columns: 170px 1fr;
    gap: 2px 12px;
    padding: 5px 0;
    border-bottom: 1px solid var(--line);
    font-size: 14px;
  }
  @media (max-width: 640px) {
    .log li {
      grid-template-columns: 1fr;
    }
  }
  .shop {
    margin: 0 0 10px;
    padding: 8px 12px;
    border-left: 4px solid var(--ink);
    background: var(--paper-2);
    border-radius: 6px;
  }
  .shop ul {
    margin: 4px 0 0;
    padding-left: 18px;
  }
  .shop small {
    color: var(--ink-3);
  }
</style>
