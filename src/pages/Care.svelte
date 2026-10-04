<script>
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { sortBikes } from '../lib/bikes.js';
  import { nextId } from '../lib/gear.js';
  import {
    PART, defaultParts, partInfo, wear, needsWork, lastValue, kmSince, lastReplace, checkState, serviceDue, logPart,
    taskBike, openRepairs, toReview, prepFor, upcomingTrips, prepParts, prepService, wishFor, CHECK_KM, bikeLog, EXTRA,
  } from '../lib/care.js';
  import BikesNav from '../lib/care/BikesNav.svelte';
  import PartDialog from '../lib/care/PartDialog.svelte';

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const tripsQ = liveQuery(() => db.trips.toArray());
  const tasksQ = liveQuery(() => db.maintenance.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());

  const bikes = $derived(sortBikes($bikesQ ?? []).map((b) => ({ ...b, parts: b.parts ?? defaultParts(b) })));
  const bikeById = $derived(Object.fromEntries(bikes.map((b) => [b.id, b])));
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
  const trips = $derived(upcomingTrips($tripsQ ?? [], today).map((t) => ({ trip: t, rows: prepFor(t, tasks, today) })));
  const checks = $derived(bikes.map((b) => ({ bike: b, check: checkState(b), services: serviceDue(b) })));
  const overdue = $derived([
    ...trips.flatMap(({ trip, rows }) => rows.filter((r) => r.overdue).map((r) => ({ kind: 'prep', trip, row: r }))),
    ...checks.filter((c) => c.check.due).map((c) => ({ kind: 'check', bike: c.bike, n: c.check.due })),
    ...checks.flatMap((c) => c.services.map((s) => ({ kind: 'service', bike: c.bike, s }))),
  ]);

  /* ---------- parts ---------- */
  let partOpen = $state(null); // { bike, part }

  async function savePart(bike, key, entry) {
    await db.bikes.update(bike.id, { parts: logPart(bike.parts, key, entry) });
    // "Replace needed" puts the part on the wishlist (answer 6).
    if (entry.result === 'needed') {
      const part = bike.parts.find((p) => p.key === key);
      const wish = wishFor({ ...part, model: entry.model ?? part.model }, bike, items, nextId(items, 'bike'));
      if (wish) await db.items.put(wish);
    }
  }

  /** Several parts at once (a 1000 km check, or a preparation task that covers them). */
  async function checkParts(bike, keys, action = 'check', note = '') {
    let parts = bike.parts;
    const entry = { date: today, km: bike.km ?? null, value: null, action, result: action === 'check' ? 'ok' : 'done', by, model: null, note };
    for (const k of keys) if (parts.some((p) => p.key === k)) parts = logPart(parts, k, entry);
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

  const fmtKm = (n) => (n == null ? '–' : `${n.toLocaleString('en')} km`);
  const dueLabel = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const PRIO = { high: 'High', medium: 'Medium', low: 'Low' };
</script>

<div class="care">
  <header class="head">
    <div>
      <BikesNav current="care" />
      <h1 class="title">Bike care</h1>
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
                  <button type="button" class="btn sm" onclick={() => prepResult(o.trip, o.row, 'ok')}>OK</button>
                  <button type="button" class="btn sm" onclick={() => prepResult(o.trip, o.row, 'needed')}>Work needed</button>
                  <button type="button" class="btn sm hi" onclick={() => prepResult(o.trip, o.row, 'done')}>Done</button>
                </span>
              {:else if o.kind === 'check'}
                <span><b>{o.bike.name}: {CHECK_KM.toLocaleString('en')} km check</b><small>{o.n} points due, see the bike below</small></span>
                <button type="button" class="btn sm" onclick={() => document.getElementById(`care-${o.bike.id}`)?.scrollIntoView({ behavior: 'smooth' })}>Open</button>
              {:else}
                <span><b>{o.bike.name}: {o.s.name}</b><small>{o.s.since} km since the last time (every {o.s.every} km)</small></span>
                <button type="button" class="btn sm hi" onclick={() => checkParts(o.bike, [o.s.key], 'service')}>Done</button>
              {/if}
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    {#each trips as { trip, rows } (trip.id)}
      <section class="block" aria-labelledby="trip-{trip.id}">
        <h2 id="trip-{trip.id}" class="title">Before {trip.title} <small>{trip.startDate} · {bikeById[trip.bikeId]?.name ?? 'no bike'} · {rows.filter((r) => r.finished).length}/{rows.length}</small></h2>
        {#if rows.some((r) => r.overdue)}<p class="hint">{rows.filter((r) => r.overdue).length} overdue tasks are under "Due now".</p>{/if}
        <ul class="rows">
          {#each rows.filter((r) => !r.overdue) as r (r.task.id)}
            <li class:done={r.finished} class:late={r.overdue} class:need={r.needed}>
              <span class="when num">{dueLabel(r.due)}</span>
              <span class="txt">{r.task.task}{#if r.state}<small>{r.needed ? 'Work needed' : r.state.result === 'ok' ? 'OK' : 'Done'} · {r.state.date}{r.state.by === 'shop' ? ' · bike shop' : ''}</small>{/if}</span>
              <span class="acts">
                {#if r.finished}
                  <button type="button" class="link" onclick={() => undoPrep(trip, r)}>Undo</button>
                {:else}
                  <button type="button" class="btn sm" onclick={() => prepResult(trip, r, 'ok')}>OK</button>
                  <button type="button" class="btn sm" onclick={() => prepResult(trip, r, 'needed')}>Work needed</button>
                  <button type="button" class="btn sm hi" onclick={() => prepResult(trip, r, 'done')}>Done</button>
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

    {#each checks as { bike, check } (bike.id)}
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

        {#if repairsFor(bike.id).length}
          <h3>Repairs</h3>
          <ul class="rows">
            {#each repairsFor(bike.id) as t (t.id)}
              <li class:need={t.status === 'needed'}>
                <span class="when">{PRIO[t.priority] ?? ''}</span>
                <span class="txt">{t.task}{#if t.note}<small>{t.note}</small>{/if}</span>
                <span class="acts">
                  <button type="button" class="btn sm" onclick={() => repairResult(t, 'needed')}>Work needed</button>
                  <button type="button" class="btn sm hi" onclick={() => repairResult(t, 'done')}>Done</button>
                  <button type="button" class="x" aria-label="Not needed any more: {t.task}" onclick={() => repairResult(t, 'gone')}>×</button>
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
  {@const b = bikeById[partOpen.bikeId]}
  {@const part = b?.parts.find((p) => p.key === partOpen.key)}
  {#if b && part}
    <PartDialog {part} bike={b} {by} onlog={(entry) => savePart(b, part.key, entry)} onclose={() => (partOpen = null)} />
  {/if}
{/if}

<style>
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
    margin: 12px 0 0;
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
  .due {
    border: 2px solid #b42318;
    background: #fbecea;
    padding: 10px 12px;
    margin-bottom: 20px;
  }
  .due .title {
    font-size: 24px;
    margin: 0 0 6px;
    color: #b42318;
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
    border-top: 1px solid rgba(180, 35, 24, 0.25);
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
    color: #b42318;
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
  .pill.worn,
  .pill.red {
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
</style>
