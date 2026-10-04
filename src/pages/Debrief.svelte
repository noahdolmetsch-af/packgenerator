<script>
  /**
   * Debrief (stage 1, 4.10.2026): after a trip, in about two minutes.
   * #/debrief            trips to debrief, finished debriefs, all learnings
   * #/debrief/<tripId>   the three steps for one trip (saved while you go)
   * #/debrief/learnings  the same overview, scrolled to the learnings
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { formatWeight, CATEGORY, isInventory } from '../lib/gear.js';
  import { ZONE } from '../lib/trips.js';
  import { TEMPLATES_KEY, saveTemplates } from '../lib/templates.js';
  import { WEATHER, AMOUNT, BAGS_OK, toDebrief, tripEnd, newDebrief, debriefCounts, suggestions, applyDebrief, unusedTimes, kmUpdate } from '../lib/debrief.js';
  import { parseActivitiesCsv, parseRideFile, ridesOnTrip } from '../lib/activities.js';

  let { param = '' } = $props();

  const tripsQ = liveQuery(() => db.trips.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const debriefsQ = liveQuery(() => db.debriefs.toArray());
  const learnQ = liveQuery(() => db.learnings.toArray());
  const bagsQ = liveQuery(() => db.containers.toArray());
  const tplQ = liveQuery(() => db.settings.get(TEMPLATES_KEY));
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const eventsQ = liveQuery(() => db.events.toArray());
  // Answer 9a: the trips before the app (Hope, Alpenbrevet …) as a logbook to read, newest first.
  const events = $derived([...($eventsQ ?? [])].sort((a, b) => (b.sortDate ?? '').localeCompare(a.sortDate ?? '')));

  const trips = $derived($tripsQ ?? []);
  const items = $derived($itemsQ ?? []);
  const debriefs = $derived($debriefsQ ?? []);
  const learnings = $derived($learnQ ?? []);
  const templates = $derived($tplQ?.value ?? []);
  const byId = $derived(Object.fromEntries(items.map((i) => [i.id, i])));

  const tripId = $derived(param && param !== 'learnings' ? decodeURIComponent(param) : null);
  const trip = $derived(tripId ? trips.find((t) => t.id === tripId) : null);
  const open = $derived(toDebrief(trips, debriefs));
  const done = $derived(
    debriefs
      .filter((d) => d.status === 'done')
      .map((d) => ({ d, t: trips.find((t) => t.id === d.tripId) }))
      .filter((x) => x.t)
      .sort((a, b) => b.t.startDate.localeCompare(a.t.startDate)),
  );
  const bike = $derived(trip ? ($bikesQ ?? []).find((b) => b.id === trip.bikeId) ?? null : null);
  // Answer 8b: how often each item was not used before (other trips), shown in step 2.
  const before = $derived(trip ? unusedTimes(debriefs, trip.id) : {});
  // Answer 6: rides from a Strava or Garmin export fill in the km (file import, no login).
  let rideMsg = $state('');
  async function importRides(event) {
    const files = [...event.currentTarget.files];
    event.currentTarget.value = '';
    if (!files.length) return;
    try {
      let rides = [];
      for (const f of files) {
        const text = await f.text();
        if (/\.csv$/i.test(f.name)) rides.push(...ridesOnTrip(parseActivitiesCsv(text), trip).rides);
        else {
          const r = parseRideFile(text, f.name);
          if (!r.date || ridesOnTrip([r], trip).rides.length) rides.push(r);
        }
      }
      if (!rides.length) return (rideMsg = `No rides from ${dateText(trip)} in ${files.length === 1 ? 'this file' : 'these files'}.`);
      const km = Math.round(rides.reduce((t, r) => t + r.km, 0));
      d.rides = rides.map(({ date, km: k, name }) => ({ date, km: k, name }));
      d.km = km;
      rideMsg = `${rides.length} ${rides.length === 1 ? 'ride' : 'rides'} imported: ${km} km.`;
      persist();
    } catch (err) {
      rideMsg = err.message || 'This file could not be read.';
    }
  }
  function setKm(value) {
    const n = Math.round(Number(String(value).replace(/[^0-9.]/g, '')));
    d.km = value === '' || !Number.isFinite(n) ? null : n;
    persist();
  }
  const drafts = $derived(new Set(debriefs.filter((d) => d.status === 'draft').map((d) => d.tripId)));

  /* ---------- one debrief: kept here while you work, saved on every change (autosave) ---------- */
  let d = $state(null);
  let step = $state(1);
  let ticks = $state({});
  let saved = $state(false);
  let loadedFor = null;
  $effect(() => {
    if (!trip || !$debriefsQ || loadedFor === trip.id) return;
    loadedFor = trip.id;
    const stored = debriefs.find((x) => x.tripId === trip.id);
    d = stored ? structuredClone($state.snapshot(stored)) : newDebrief(trip);
    step = stored?.status === 'done' ? 3 : 1;
    saved = stored?.status === 'done';
    ticks = {};
  });
  async function persist() {
    d.updatedAt = new Date().toISOString();
    await db.debriefs.put($state.snapshot(d));
  }
  const set = (field, value) => {
    d[field] = d[field] === value ? null : value;
    persist();
  };
  function mark(itemId, state) {
    if (state === 'used' || d.items[itemId] === state) delete d.items[itemId];
    else d.items[itemId] = state;
    persist();
  }

  // Step 2: the packed items by bag, in the order of the trip.
  const groups = $derived.by(() => {
    if (!trip) return [];
    const out = [];
    for (const e of trip.entries) {
      let g = out.find((x) => x.slot === e.slot);
      if (!g) {
        const bag = ($bagsQ ?? []).find((c) => c.id === trip.setup?.[e.slot]);
        g = { slot: e.slot, name: trip.purpose?.[e.slot] || bag?.name || ZONE[e.slot]?.name || e.slot, rows: [] };
        out.push(g);
      }
      if (byId[e.itemId]) g.rows.push({ e, item: byId[e.itemId] });
    }
    return out.filter((g) => g.rows.length);
  });

  let missName = $state('');
  const notOnTrip = $derived(trip ? items.filter((i) => isInventory(i) && !trip.entries.some((e) => e.itemId === i.id)) : []);
  function addMissing(event) {
    event.preventDefault();
    const name = missName.trim();
    if (!name) return;
    const match = notOnTrip.find((i) => i.name.toLowerCase() === name.toLowerCase());
    d.missing.push({ id: `m${Date.now().toString(36)}`, name: match?.name ?? name, itemId: match?.id ?? null });
    missName = '';
    persist();
  }
  function dropMissing(id) {
    d.missing = d.missing.filter((m) => m.id !== id);
    persist();
  }

  // Step 3: suggestions, all ticked to start with; ones applied in an earlier save are left out.
  const counts = $derived(d && trip ? debriefCounts(d, trip, items) : null);
  const sugg = $derived(d && trip ? suggestions(d, trip, items, learnings, templates, debriefs).filter((s) => !d.applied.includes(s.id)) : []);
  const GROUPS = [
    { key: 'home', name: 'Leave at home?' },
    { key: 'wish', name: 'Wishlist' },
    { key: 'learn', name: 'Learnings' },
    { key: 'template', name: 'Template' },
  ];
  const ticked = (s) => ticks[s.id] ?? true;

  let busy = $state(false);
  async function finish() {
    busy = true;
    const on = sugg.filter(ticked).map((s) => s.id);
    const stamp = Date.now().toString(36).toUpperCase();
    const out = applyDebrief($state.snapshot(d), trip, items, learnings, templates, on, { newItemId: (n) => `W${stamp}${n}` });
    const km = kmUpdate(bike, d);
    await db.transaction('rw', db.items, db.learnings, db.debriefs, db.trips, db.settings, db.bikes, async () => {
      if (out.items.length) await db.items.bulkPut(out.items);
      if (km) {
        await db.bikes.update(bike.id, { km: km.km, kmDate: new Date().toISOString().slice(0, 10) });
        d.kmApplied = km.kmApplied;
      }
      if (out.learnings.length) await db.learnings.bulkPut(out.learnings);
      if (out.templates) await saveTemplates(db, out.templates);
      d.applied = [...d.applied, ...on];
      d.status = 'done';
      d.doneAt = new Date().toISOString();
      await db.debriefs.put($state.snapshot(d));
      await db.trips.update(trip.id, { status: 'done' });
    });
    busy = false;
    saved = true;
  }
  async function reopen() {
    d.status = 'draft';
    saved = false;
    step = 1;
    await persist();
  }

  const dateText = (t) => {
    const f = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    return t.days > 1 ? `${f(t.startDate)} – ${f(tripEnd(t))}` : f(t.startDate);
  };

  /* ---------- learnings ---------- */
  let lq = $state('');
  const topics = $derived.by(() => {
    const q = lq.trim().toLowerCase();
    const list = learnings.filter((l) => !q || `${l.topic} ${l.rule} ${l.action ?? ''} ${l.source ?? ''}`.toLowerCase().includes(q));
    const map = new Map();
    for (const l of list) map.set(l.topic, [...(map.get(l.topic) ?? []), l]);
    const rank = { high: 0, medium: 1, low: 2 };
    return [...map].map(([topic, ls]) => ({ topic, ls: ls.sort((a, b) => (rank[a.priority] ?? 3) - (rank[b.priority] ?? 3)) })).sort((a, b) => b.ls.length - a.ls.length);
  });
  $effect(() => {
    if (param === 'learnings' && $learnQ) queueMicrotask(() => document.getElementById('learnings')?.scrollIntoView());
  });
</script>

{#if tripId}
  <div class="flow">
    {#if !$tripsQ}
      <p class="muted">Loading…</p>
    {:else if !trip}
      <p class="card">This trip does not exist any more. <a href="#/debrief">Back to Debrief</a></p>
    {:else if d}
      <div class="bar">
        <a class="back" href="#/debrief" aria-label="Back to Debrief">←</a>
        <b>Debrief</b>
        <ol class="steps" aria-label="Steps">
          {#each [1, 2, 3] as n (n)}<li class:on={step >= n} aria-current={step === n ? 'step' : undefined}><span class="sr">Step {n}</span></li>{/each}
        </ol>
      </div>
      <p class="lbl trip">{trip.title} · {dateText(trip)} · {trip.bike ?? ''}</p>

      {#if step === 1}
        <h1 class="title">How did it go?</h1>
        <fieldset>
          <legend>Weather, compared to what you packed for</legend>
          <div class="seg">{#each WEATHER as o (o.key)}<button type="button" aria-pressed={d.weather === o.key} onclick={() => set('weather', o.key)}>{o.name}</button>{/each}</div>
        </fieldset>
        <fieldset>
          <legend>How much did you take?</legend>
          <div class="seg">{#each AMOUNT as o (o.key)}<button type="button" aria-pressed={d.amount === o.key} onclick={() => set('amount', o.key)}>{o.name}</button>{/each}</div>
        </fieldset>
        <fieldset>
          <legend>Bags and bike</legend>
          <div class="seg">{#each BAGS_OK as o (o.key)}<button type="button" aria-pressed={d.bags === o.key} onclick={() => set('bags', o.key)}>{o.name}</button>{/each}</div>
        </fieldset>
        {#if bike}
          <label class="km">
            <span>km of this trip <small>(goes onto {bike.name}{bike.km != null ? `, now ${bike.km.toLocaleString('en')} km` : ''})</small></span>
            <span class="kmrow">
              <input class="inp num" type="text" inputmode="numeric" value={d.km ?? ''} onchange={(e) => setKm(e.currentTarget.value)} placeholder="e.g. 303" />
              <span class="or">or</span>
              <span class="btn sm imp">Import from Strava or Garmin<input type="file" accept=".csv,.gpx,.tcx,text/csv,application/gpx+xml" multiple onchange={importRides} /></span>
            </span>
          </label>
          {#if rideMsg}<p class="hint ride" role="status">{rideMsg}</p>{/if}
          <details class="howto">
            <summary>How to get the file</summary>
            <p><b>Strava:</b> on a ride → ••• → Export GPX (one ride), or Settings → My Account → Download your data → activities.csv (all rides).</p>
            <p><b>Garmin Connect:</b> on a ride → ⚙ → Export to GPX or TCX, or Activities → Export CSV (the list).</p>
            <p>Several files at once are fine (one per day). Only rides on the days of this trip count.</p>
          </details>
        {/if}
        {#if d.rideNotes?.length}
          <div class="ridenotes">
            <span class="lbl">Notes from the ride</span>
            <ul>{#each d.rideNotes as n (n.at)}<li>{#if trip.days > 1}<small>Day {n.day + 1}</small> {/if}{n.text}</li>{/each}</ul>
          </div>
        {/if}
        <label class="note">
          <span>One sentence for next time <small>(optional)</small></span>
          <textarea class="inp" rows="3" bind:value={d.note} oninput={persist} placeholder="e.g. Heatwave, the rain gear was never used"></textarea>
        </label>
        <div class="foot"><button type="button" class="btn hi wide" onclick={() => (step = 2)}>Next: go through the items</button></div>
      {:else if step === 2}
        <h1 class="title">What did you use?</h1>
        <p class="hint">Everything counts as used. Tap only what you did not use or what broke. <span class="num">{counts.looked} of {trip.entries.length} marked.</span></p>
        <div class="legend" aria-hidden="true"><span>✓ used</span><span>– not used</span><span>✕ broken</span></div>
        {#each groups as g (g.slot)}
          <section class="bag">
            <h2><span class="title">{g.name}</span> <span class="lbl">{g.rows.length} {g.rows.length === 1 ? 'item' : 'items'}</span></h2>
            <ul>
              {#each g.rows as { e, item } (e.itemId)}
                {@const st = d.items[e.itemId] ?? 'used'}
                <li class="it" class:unused={st === 'unused'} class:broken={st === 'broken'}>
                  <span class="nm">{item.name}{#if e.qty > 1}<small> × {e.qty}</small>{/if}<small class="sub">{CATEGORY[item.category]?.name ?? ''}{item.weightG != null ? ` · ${formatWeight(item.weightG * (e.qty || 1))}` : ''}{#if before[e.itemId]}<span class="before"> · not used on {before[e.itemId]} {before[e.itemId] === 1 ? 'trip' : 'trips'} before</span>{/if}</small></span>
                  <span class="acts" role="group" aria-label="{item.name}">
                    <button type="button" class="c" aria-pressed={st === 'used'} aria-label="Used" onclick={() => mark(e.itemId, 'used')}>✓</button>
                    <button type="button" class="c no" aria-pressed={st === 'unused'} aria-label="Not used" onclick={() => mark(e.itemId, 'unused')}>–</button>
                    <button type="button" class="c br" aria-pressed={st === 'broken'} aria-label="Broken" onclick={() => mark(e.itemId, 'broken')}>✕</button>
                  </span>
                </li>
              {/each}
            </ul>
          </section>
        {/each}
        <section class="bag">
          <h2><span class="title">Missing something?</span></h2>
          <form class="miss" onsubmit={addMissing}>
            <input class="inp" list="gear-names" placeholder="What you missed, e.g. Headlamp" bind:value={missName} aria-label="What you missed" />
            <button type="submit" class="btn">Add</button>
          </form>
          <datalist id="gear-names">{#each notOnTrip as i (i.id)}<option value={i.name}></option>{/each}</datalist>
          {#if d.missing.length}
            <ul>
              {#each d.missing as m (m.id)}
                <li class="it"><span class="nm">{m.name}<small class="sub">{m.itemId ? 'in your gear · goes into the template' : 'not in your gear · goes to the wishlist'}</small></span><button type="button" class="c" aria-label="Remove {m.name}" onclick={() => dropMissing(m.id)}>×</button></li>
              {/each}
            </ul>
          {/if}
        </section>
        <div class="foot two"><button type="button" class="btn" onclick={() => (step = 1)}>Back</button><button type="button" class="btn hi wide" onclick={() => (step = 3)}>Next: summary</button></div>
      {:else}
        <h1 class="title">{saved ? 'Saved' : 'Next time'}</h1>
        <div class="kpi">
          <div><b class="num">{counts.unused}</b><span class="lbl">not used</span></div>
          <div><b class="num">{counts.unusedG ? `−${formatWeight(counts.unusedG)}` : '–'}</b><span class="lbl">possible</span></div>
          <div><b class="num">{counts.missing}</b><span class="lbl">missing</span></div>
          <div><b class="num">{counts.broken}</b><span class="lbl">broken</span></div>
        </div>
        {#if saved}
          <p class="card ok">Debrief saved{d.applied.length ? `, ${d.applied.length} ${d.applied.length === 1 ? 'change' : 'changes'} made` : ''}{d.kmApplied ? `, ${d.kmApplied} km added to ${bike?.name ?? 'the bike'}` : ''}. The learnings now show up on the start page and when you pack.</p>
          {#if sugg.length}<p class="hint">{sugg.length} more {sugg.length === 1 ? 'suggestion is' : 'suggestions are'} open. Change your answers to see {sugg.length === 1 ? 'it' : 'them'}.</p>{/if}
          <div class="foot two"><button type="button" class="btn" onclick={reopen}>Change answers</button><a class="btn ink wide" href="#/">Done</a></div>
        {:else}
          {#if !sugg.length}<p class="card">Nothing to change. Everything you took was used and nothing was missing.</p>{/if}
          {#each GROUPS as grp (grp.key)}
            {@const list = sugg.filter((s) => s.group === grp.key)}
            {#if list.length}
              <section class="sum">
                <h2 class="title">{grp.name}</h2>
                {#each list as s (s.id)}
                  <label class="chk"><input type="checkbox" checked={ticked(s)} onchange={(ev) => (ticks[s.id] = ev.currentTarget.checked)} /><span>{s.label}<small>{s.detail}</small></span></label>
                {/each}
              </section>
            {/if}
          {/each}
          {#if sugg.length}<p class="hint">Nothing changes without a tick.</p>{/if}
          <div class="foot two"><button type="button" class="btn" onclick={() => (step = 2)}>Back</button><button type="button" class="btn hi wide" disabled={busy} onclick={finish}>Save debrief</button></div>
        {/if}
      {/if}
    {/if}
  </div>
{:else}
  <div class="over">
    <h1 class="title big">Debrief</h1>
    <p class="lead">After a trip: two minutes on what you used, missed or did not need. The app turns it into tips for the next trip.</p>

    <section aria-labelledby="todo-h">
      <h2 id="todo-h" class="title h">To debrief</h2>
      {#each open as t (t.id)}
        <div class="card trip-row">
          <div><b>{t.title}</b><span class="muted">{dateText(t)} · {t.entries.length} items</span></div>
          <a class="btn hi" href="#/debrief/{encodeURIComponent(t.id)}">{drafts.has(t.id) ? 'Continue' : 'Start debrief'}</a>
        </div>
      {:else}
        <p class="muted">No trip is waiting. A trip shows up here the day after it ends.</p>
      {/each}
    </section>

    {#if done.length}
      <section aria-labelledby="done-h">
        <h2 id="done-h" class="title h">Done</h2>
        {#each done as { d: x, t } (t.id)}
          {@const c = debriefCounts(x, t, items)}
          <a class="card trip-row link" href="#/debrief/{encodeURIComponent(t.id)}">
            <div><b>{t.title}</b><span class="muted">{dateText(t)} · {c.unused} not used · {c.missing} missing</span></div>
            <span aria-hidden="true">→</span>
          </a>
        {/each}
      </section>
    {/if}

    {#if events.length}
      <section id="logbook" aria-labelledby="log-h">
        <h2 id="log-h" class="title h">Logbook <small class="muted">{events.length} earlier trips</small></h2>
        {#each events as ev (ev.id)}
          <details class="topic ev">
            <summary><span class="title">{ev.name}</span> <span class="muted">{ev.dateText ?? ev.sortDate ?? ''}{ev.type ? ` · ${ev.type}` : ''}</span></summary>
            <dl>
              {#if ev.bike && ev.bike !== '–'}<dt>Bike</dt><dd>{ev.bike}</dd>{/if}
              {#if ev.bags && ev.bags !== '–'}<dt>Bags</dt><dd>{ev.bags}</dd>{/if}
              {#if ev.result}<dt>What worked</dt><dd>{ev.result}</dd>{/if}
              {#if ev.learnings}<dt>Learnings</dt><dd>{ev.learnings}</dd>{/if}
            </dl>
          </details>
        {/each}
      </section>
    {/if}

    <section id="learnings" aria-labelledby="learn-h">
      <h2 id="learn-h" class="title h">Learnings <small class="muted">{learnings.length}</small></h2>
      <input class="inp q" type="search" placeholder="Search learnings" bind:value={lq} aria-label="Search learnings" />
      {#each topics as g (g.topic)}
        <details class="topic" open={!!lq.trim()}>
          <summary><span class="title">{g.topic}</span> <span class="muted">{g.ls.length}</span></summary>
          <ul>
            {#each g.ls as l (l.id)}
              <li>
                <span class="prio p-{l.priority}">{l.priority ?? '–'}</span>
                <span>{l.rule}{#if l.action}<small>→ {l.action}</small>{/if}<small class="muted">{l.source ?? ''}{l.confirmed ? ` · confirmed ${l.confirmed}×` : ''}</small></span>
              </li>
            {/each}
          </ul>
        </details>
      {:else}
        <p class="muted">{learnings.length ? 'Nothing matches.' : 'No learnings yet. They come from your Excel import and from every debrief.'}</p>
      {/each}
    </section>
  </div>
{/if}

<style>
  .flow {
    max-width: 640px;
    margin: 0 auto;
    padding-bottom: 90px;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
  }
  .bar b {
    font: 900 22px var(--font-title);
    text-transform: uppercase;
  }
  .back {
    color: var(--ink);
    text-decoration: none;
    font-size: 22px;
    line-height: 1;
  }
  .steps {
    display: flex;
    gap: 4px;
    list-style: none;
    margin: 0 0 0 auto;
    padding: 0;
  }
  .steps li {
    width: 26px;
    height: 6px;
    border-radius: 3px;
    background: var(--line);
  }
  .steps li.on {
    background: var(--hi);
  }
  .trip {
    margin: 0;
  }
  .flow .title {
    font-size: 40px;
    margin: 4px 0 12px;
  }
  fieldset {
    border: 0;
    padding: 0;
    margin: 0 0 16px;
  }
  legend {
    font-weight: 600;
    margin-bottom: 6px;
    padding: 0;
  }
  .seg {
    display: flex;
    border: 2px solid var(--ink);
    border-radius: 6px;
    overflow: hidden;
  }
  .seg button {
    flex: 1;
    padding: 11px 4px;
    border: 0;
    border-left: 1.5px solid var(--ink);
    background: var(--paper);
    color: var(--ink);
    font: 600 14px var(--font-body);
    cursor: pointer;
  }
  .seg button:first-child {
    border-left: 0;
  }
  .seg button[aria-pressed='true'] {
    background: var(--ink);
    color: var(--paper);
  }
  .km {
    display: grid;
    gap: 6px;
    margin: 0 0 16px;
    font-weight: 700;
  }
  .km small {
    font-weight: 400;
    color: var(--ink-3);
  }
  .km .inp {
    max-width: 160px;
    font-size: 18px;
  }
  .kmrow {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    font-weight: 400;
  }
  .kmrow .or {
    color: var(--ink-3);
  }
  .imp {
    position: relative;
    overflow: hidden;
  }
  .imp input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }
  .ride {
    margin: -8px 0 10px;
  }
  .howto {
    margin: -6px 0 16px;
    font-size: 14px;
    color: var(--ink-2);
  }
  .howto summary {
    cursor: pointer;
    text-decoration: underline;
  }
  .howto p {
    margin: 6px 0;
  }
  .before {
    color: var(--ink);
  }
  .ridenotes {
    margin: 12px 0;
    padding: 8px 12px;
    border-radius: 6px;
    background: var(--paper-2);
  }
  .ridenotes ul {
    margin: 4px 0 0;
    padding-left: 18px;
  }
  .ridenotes small {
    color: var(--ink-3);
  }
  .note {
    display: grid;
    gap: 6px;
    font-weight: 600;
  }
  .note small {
    font-weight: 400;
    color: var(--ink-3);
  }
  textarea {
    width: 100%;
    font: inherit;
    font-weight: 400;
    resize: vertical;
  }
  .foot {
    position: sticky;
    bottom: 0;
    display: flex;
    gap: 8px;
    padding: 14px 0 calc(14px + env(safe-area-inset-bottom));
    background: linear-gradient(transparent, var(--ground) 30%);
    margin-top: 16px;
  }
  .wide {
    flex: 1;
    justify-content: center;
    text-align: center;
    padding: 12px;
    font-size: 15px;
  }
  .hint {
    color: var(--ink-2);
    margin: 0 0 8px;
  }
  .legend {
    display: flex;
    gap: 14px;
    font-size: 13px;
    color: var(--ink-3);
    margin-bottom: 4px;
  }
  .bag {
    margin-top: 14px;
  }
  .bag h2 {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin: 0 0 4px;
    border-bottom: 2px solid var(--ink);
    padding-bottom: 3px;
  }
  .bag h2 .title {
    font-size: 20px;
    margin: 0;
  }
  .bag ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .it {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--paper);
    border: 1.5px solid var(--line);
    border-radius: 6px;
    padding: 6px 8px;
    margin-top: 5px;
  }
  .it.unused .nm {
    color: var(--ink-3);
    text-decoration: line-through;
  }
  .nm {
    flex: 1;
    min-width: 0;
    line-height: 1.25;
  }
  .nm .sub {
    display: block;
    color: var(--ink-3);
    font-size: 12px;
  }
  .acts {
    display: flex;
    gap: 4px;
  }
  .c {
    width: 38px;
    height: 34px;
    border: 1.5px solid var(--line);
    border-radius: 5px;
    background: var(--paper);
    color: var(--ink-3);
    font-size: 15px;
    cursor: pointer;
  }
  .c[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .c.no[aria-pressed='true'] {
    background: #8a6a00;
    border-color: #8a6a00;
  }
  .c.br[aria-pressed='true'] {
    background: #b03a2e;
    border-color: #b03a2e;
  }
  .miss {
    display: flex;
    gap: 6px;
    margin-top: 6px;
  }
  .miss .inp {
    flex: 1;
    min-width: 0;
  }
  .kpi {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }
  .kpi div {
    background: var(--paper);
    border: 1.5px solid var(--line);
    border-radius: 6px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .kpi b {
    font: 900 24px/1 var(--font-title);
    white-space: nowrap;
  }
  @media (max-width: 479px) {
    .kpi {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  .sum {
    background: var(--paper);
    border: 2px solid var(--ink);
    border-radius: 6px;
    padding: 10px 12px;
    margin-top: 10px;
  }
  .sum .title {
    font-size: 20px;
    margin: 0 0 4px;
  }
  .chk {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin-top: 6px;
    cursor: pointer;
  }
  .chk input {
    width: 18px;
    height: 18px;
    margin-top: 2px;
    accent-color: var(--ink);
    flex: none;
  }
  .chk small {
    display: block;
    color: var(--ink-3);
    font-size: 12.5px;
  }
  .card.ok {
    border-color: #2e8b57;
    margin-top: 12px;
  }
  .over {
    max-width: 880px;
    margin: 0 auto;
  }
  .big {
    font-size: clamp(52px, 12vw, 88px);
  }
  .lead {
    color: var(--ink-2);
    margin: 4px 0 20px;
    font-size: 17px;
  }
  .ev summary .muted {
    font-size: 14px;
  }
  .ev dl {
    display: grid;
    grid-template-columns: 110px 1fr;
    gap: 6px 12px;
    margin: 8px 0 4px;
  }
  .ev dt {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--ink-3);
    padding-top: 2px;
  }
  .ev dd {
    margin: 0;
  }
  @media (max-width: 519px) {
    .ev dl {
      grid-template-columns: 1fr;
      gap: 2px;
    }
    .ev dd {
      margin-bottom: 8px;
    }
  }
  .h {
    font-size: 26px;
    margin: 22px 0 8px;
  }
  .h small {
    font: 400 15px var(--font-body);
  }
  .trip-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }
  .trip-row div {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .trip-row.link {
    color: inherit;
    text-decoration: none;
  }
  .muted {
    color: var(--ink-3);
  }
  .q {
    width: 100%;
    margin-bottom: 8px;
  }
  .topic {
    border-bottom: 2px solid var(--ink);
    padding: 6px 0;
  }
  .topic summary {
    cursor: pointer;
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .topic summary .title {
    font-size: 20px;
  }
  .topic ul {
    list-style: none;
    margin: 6px 0 4px;
    padding: 0;
  }
  .topic li {
    display: flex;
    gap: 10px;
    align-items: baseline;
    padding: 6px 0;
    border-top: 1px solid var(--line);
  }
  .topic li small {
    display: block;
    font-size: 13px;
    color: var(--ink-2);
  }
  .topic li small.muted {
    color: var(--ink-3);
  }
  .prio {
    flex: none;
    width: 56px;
    font: 700 10px var(--font-body);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-3);
    border: 1px solid var(--line);
    border-radius: 3px;
    padding: 1px 4px;
    text-align: center;
  }
  .p-high {
    color: var(--ink);
    border-color: var(--ink);
  }
</style>
