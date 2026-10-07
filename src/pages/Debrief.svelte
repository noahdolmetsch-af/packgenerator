<script>
  /**
   * Debrief (stage 1, 4.10.2026): after a trip, in about two minutes.
   * #/debrief            trips to debrief, finished debriefs, all learnings
   * #/debrief/<tripId>   the three steps for one trip (saved while you go)
   * #/debrief/learnings  the same overview, scrolled to the learnings
   * #/debrief/pace       the same overview, scrolled to "Your pace" (v0.19.0)
   */
  import { liveQuery } from 'dexie';
  import { t, tn, num, locale, nameOf } from '../lib/i18n.svelte.js';
  import { db } from '../lib/db.js';
  import { formatWeight, knownWeight, CATEGORY, isInventory } from '../lib/gear.js';
  import { ZONE } from '../lib/trips.js';
  import { TEMPLATES_KEY, saveTemplates } from '../lib/templates.js';
  import { WEATHER, AMOUNT, BAGS_OK, toDebrief, tripEnd, newDebrief, debriefCounts, suggestions, applyDebrief, unusedTimes, kmUpdate, similarItems } from '../lib/debrief.js';
  import { parseActivitiesCsv, parseRideFile, ridesOnTrip } from '../lib/activities.js';
  import Pace from '../lib/debrief/Pace.svelte';
  import Compare from '../lib/debrief/Compare.svelte';
  import { domainOf, domainName } from '../lib/domains.js';

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

  const tripId = $derived(param && param !== 'learnings' && param !== 'pace' ? decodeURIComponent(param) : null);
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
      if (!rides.length) return (rideMsg = files.length === 1 ? t('No rides from {dates} in this file.', { dates: dateText(trip) }) : t('No rides from {dates} in these files.', { dates: dateText(trip) }));
      const km = Math.round(rides.reduce((t, r) => t + r.km, 0));
      d.rides = rides.map(({ date, km: k, name }) => ({ date, km: k, name }));
      d.km = km;
      rideMsg = tn(rides.length, '{n} ride imported: {km} km.', '{n} rides imported: {km} km.', { km: num(km) });
      persist();
    } catch (err) {
      rideMsg = err.message || t('This file could not be read.');
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
  // v0.24.0 (Noah, "select all"): a whole bag used or not used in one tap.
  function markAll(rows, state) {
    for (const { e } of rows) {
      if (state === 'used') delete d.items[e.itemId];
      else d.items[e.itemId] = state;
    }
    persist();
  }
  // v0.24.0 (Noah, fewer clicks): "All as planned" answers the three questions and goes straight to
  // the summary, where the suggestions are still shown before anything is saved.
  function allFine() {
    d.weather = 'planned';
    d.amount = 'right';
    d.bags = 'fine';
    persist();
    step = 3;
  }

  // Step 2: the packed items by bag, in the order of the trip.
  const groups = $derived.by(() => {
    if (!trip) return [];
    const out = [];
    for (const e of trip.entries) {
      let g = out.find((x) => x.slot === e.slot);
      if (!g) {
        const bag = ($bagsQ ?? []).find((c) => c.id === trip.setup?.[e.slot]);
        // v0.21.0: a trip without a bike names its own bags (trip.packs)
        const own = trip.packs?.find((p) => p.key === e.slot);
        // v0.24.0: the same bag names as on the Pack page (the zone, e.g. "Frame bag"), not the bag's own name.
        g = { slot: e.slot, name: trip.purpose?.[e.slot] || own?.name || ZONE[e.slot]?.name || bag?.name || e.slot, rows: [] };
        out.push(g);
      }
      if (byId[e.itemId]) g.rows.push({ e, item: byId[e.itemId] });
    }
    return out.filter((g) => g.rows.length);
  });

  let missName = $state('');
  const notOnTrip = $derived(trip ? items.filter((i) => isInventory(i) && !trip.entries.some((e) => e.itemId === i.id)) : []);
  // v0.18.1: gear that may be what you mean, before it goes to the wishlist as something new.
  const similar = $derived(missName.trim().length >= 4 && !notOnTrip.some((i) => i.name.toLowerCase() === missName.trim().toLowerCase()) ? similarItems(missName, notOnTrip) : []);
  function addItem(item) {
    d.missing.push({ id: `m${Date.now().toString(36)}`, name: item.name, itemId: item.id });
    missName = '';
    persist();
  }
  function addMissing(event) {
    event.preventDefault();
    const name = missName.trim();
    if (!name) return;
    const match = notOnTrip.find((i) => i.name.toLowerCase() === name.toLowerCase());
    d.missing.push({ id: `m${Date.now().toString(36)}`, name: match?.name ?? name, itemId: match?.id ?? null });
    missName = '';
    persist();
  }
  const noteWhen = (iso) => new Date(iso).toLocaleString(locale(), { weekday: 'short', hour: '2-digit', minute: '2-digit' });
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
    const f = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
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
    if ((param === 'learnings' || param === 'pace') && $learnQ) queueMicrotask(() => document.getElementById(param)?.scrollIntoView());
  });
</script>

{#if tripId}
  <div class="flow">
    {#if !$tripsQ}
      <p class="muted">{t('Loading…')}</p>
    {:else if !trip}
      <p class="card">{t('This trip does not exist any more.')} <a href="#/debrief">{t('Back to Debrief')}</a></p>
    {:else if d}
      <div class="bar">
        <a class="back" href="#/debrief" aria-label={t('Back to Debrief')}>←</a>
        <b>{t('Debrief')}</b>
        <ol class="steps" aria-label={t('Steps')}>
          {#each [1, 2, 3] as n (n)}<li class:on={step >= n} aria-current={step === n ? 'step' : undefined}><span class="sr">{t('Step {n}', { n })}</span></li>{/each}
        </ol>
      </div>
      <p class="lbl trip">{trip.title} · {dateText(trip)} · {Array.isArray(trip.packs) ? t(domainName(domainOf(trip))) : (trip.bike ?? '')}</p>

      {#snippet rideNotes()}
        {#if d.rideNotes?.length}
          <div class="ridenotes">
            <span class="lbl">{t('Notes from the ride')}</span>
            <ul>{#each d.rideNotes as n (n.at)}<li><small class="num">{noteWhen(n.at)}</small> {n.text}</li>{/each}</ul>
          </div>
        {/if}
      {/snippet}
      {#if step === 1}
        <h1 class="title">{t('How did it go?')}</h1>
        {#if !d.weather && !d.amount && !d.bags}
          <button type="button" class="btn fine" onclick={allFine}>{t('All as planned: weather, amount, bags')}<small>{t('Then only the summary is left; everything counts as used.')}</small></button>
        {/if}
        <fieldset>
          <legend>{t('Weather, compared to what you packed for')}</legend>
          <div class="seg">{#each WEATHER as o (o.key)}<button type="button" aria-pressed={d.weather === o.key} onclick={() => set('weather', o.key)}>{t(o.name)}</button>{/each}</div>
        </fieldset>
        <fieldset>
          <legend>{t('How much did you take?')}</legend>
          <div class="seg">{#each AMOUNT as o (o.key)}<button type="button" aria-pressed={d.amount === o.key} onclick={() => set('amount', o.key)}>{t(o.name)}</button>{/each}</div>
        </fieldset>
        <fieldset>
          <legend>{Array.isArray(trip.packs) ? t('Bags') : t('Bags and bike')}</legend>
          <div class="seg">{#each BAGS_OK as o (o.key)}<button type="button" aria-pressed={d.bags === o.key} onclick={() => set('bags', o.key)}>{t(o.name)}</button>{/each}</div>
        </fieldset>
        {#if bike}
          <label class="km">
            <span>{t('km of this trip')} <small>({bike.km != null ? t('goes onto {bike}, now {km} km', { bike: bike.name, km: num(bike.km) }) : t('goes onto {bike}', { bike: bike.name })})</small></span>
            <span class="kmrow">
              <input class="inp num" type="text" inputmode="numeric" value={d.km ?? ''} onchange={(e) => setKm(e.currentTarget.value)} placeholder={t('e.g. 303')} />
              <span class="or">{t('or')}</span>
              <span class="btn sm imp">{t('Import from Strava or Garmin')}<input type="file" accept=".csv,.gpx,.tcx,text/csv,application/gpx+xml" multiple onchange={importRides} /></span>
            </span>
          </label>
          {#if rideMsg}<p class="hint ride" role="status">{rideMsg}</p>{/if}
          <details class="howto">
            <summary>{t('How to get the file')}</summary>
            <p><b>Strava:</b> {t('on a ride → ••• → Export GPX (one ride), or Settings → My Account → Download your data → activities.csv (all rides).')}</p>
            <p><b>Garmin Connect:</b> {t('on a ride → ⚙ → Export to GPX or TCX, or Activities → Export CSV (the list).')}</p>
            <p>{t('Several files at once are fine (one per day). Only rides on the days of this trip count.')}</p>
          </details>
        {/if}
        {@render rideNotes()}
        <label class="note">
          <span>{t('One sentence for next time')} <small>({t('optional')})</small></span>
          <textarea class="inp" rows="3" bind:value={d.note} oninput={persist} placeholder={t('e.g. Heatwave, the rain gear was never used')}></textarea>
        </label>
        <div class="foot"><button type="button" class="btn hi wide" onclick={() => (step = 2)}>{t('Next: go through the items')}</button></div>
      {:else if step === 2}
        <h1 class="title">{t('What did you use?')}</h1>
        {@render rideNotes()}
        <p class="hint">{t('Everything counts as used. Tap only what you did not use or what broke.')} <span class="num">{t('{n} of {total} marked.', { n: counts.looked, total: trip.entries.length })}</span></p>
        <div class="legend" aria-hidden="true"><span>✓ {t('used')}</span><span>– {t('not used')}</span><span>✕ {t('broken')}</span></div>
        {#each groups as g (g.slot)}
          <section class="bag">
            <h2><span class="title">{t(g.name)}</span> <span class="lbl">{tn(g.rows.length, '{n} item', '{n} items')}</span>
              <span class="alls">
                <button type="button" class="link" onclick={() => markAll(g.rows, 'used')} aria-label={t('All used: {bag}', { bag: t(g.name) })}>{t('All ✓')}</button>
                <button type="button" class="link" onclick={() => markAll(g.rows, 'unused')} aria-label={t('None used: {bag}', { bag: t(g.name) })}>{t('All –')}</button>
              </span></h2>
            <ul>
              {#each g.rows as { e, item } (e.itemId)}
                {@const st = d.items[e.itemId] ?? 'used'}
                <li class="it" class:unused={st === 'unused'} class:broken={st === 'broken'}>
                  <span class="nm">{nameOf(item)}{#if e.qty > 1}<small> × {e.qty}</small>{/if}<small class="sub">{CATEGORY[item.category]?.name ? t(CATEGORY[item.category].name) : ''}{item.weightG != null ? ` · ${formatWeight(item.weightG * (e.qty || 1))}` : ''}{#if before[e.itemId]}<span class="before"> · {tn(before[e.itemId], 'not used on {n} trip before', 'not used on {n} trips before')}</span>{/if}</small></span>
                  <span class="acts" role="group" aria-label={nameOf(item)}>
                    <button type="button" class="c" aria-pressed={st === 'used'} aria-label={t('Used')} onclick={() => mark(e.itemId, 'used')}>✓</button>
                    <button type="button" class="c no" aria-pressed={st === 'unused'} aria-label={t('Not used')} onclick={() => mark(e.itemId, 'unused')}>–</button>
                    <button type="button" class="c br" aria-pressed={st === 'broken'} aria-label={t('Broken')} onclick={() => mark(e.itemId, 'broken')}>✕</button>
                  </span>
                </li>
              {/each}
            </ul>
          </section>
        {/each}
        <section class="bag">
          <h2><span class="title">{t('Missing something?')}</span></h2>
          <form class="miss" onsubmit={addMissing}>
            <input class="inp" list="gear-names" placeholder={t('What you missed, e.g. Headlamp')} bind:value={missName} aria-label={t('What you missed')} />
            <button type="submit" class="btn">{t('Add')}</button>
          </form>
          {#if similar.length}
            <p class="similar"><span>{t('In your gear:')}</span>{#each similar as i (i.id)}<button type="button" class="btn sm" onclick={() => addItem(i)}>{nameOf(i)}</button>{/each}</p>
          {/if}
          <datalist id="gear-names">{#each notOnTrip as i (i.id)}<option value={i.name}></option>{/each}</datalist>
          {#if d.missing.length}
            <ul>
              {#each d.missing as m (m.id)}
                <li class="it"><span class="nm">{m.name}<small class="sub">{m.itemId ? t('in your gear · goes into the template') : t('not in your gear · goes to the wishlist')}</small></span><button type="button" class="c"  aria-label={t('Remove {name}', { name: m.name })} onclick={() => dropMissing(m.id)}>×</button></li>
              {/each}
            </ul>
          {/if}
        </section>
        <div class="foot two"><button type="button" class="btn" onclick={() => (step = 1)}>{t('Back')}</button><button type="button" class="btn hi wide" onclick={() => (step = 3)}>{t('Next: summary')}</button></div>
      {:else}
        <h1 class="title">{saved ? t('Saved') : t('Next time')}</h1>
        <div class="kpi">
          <div><b class="num">{counts.unused}</b><span class="lbl">{t('not used')}</span></div>
          <div><b class="num">{counts.unusedG ? knownWeight(counts.unusedG, counts.unusedUnweighed, (g) => `−${formatWeight(g)}`) : '–'}</b><span class="lbl">{t('possible')}{#if counts.unusedUnweighed}{' · '}{t('{n} not weighed', { n: counts.unusedUnweighed })}{/if}</span></div>
          <div><b class="num">{counts.missing}</b><span class="lbl">{t('missing')}</span></div>
          <div><b class="num">{counts.broken}</b><span class="lbl">{t('broken')}</span></div>
        </div>
        {#if saved}
          <p class="card ok">{t('Debrief saved')}{d.applied.length ? `, ${tn(d.applied.length, '{n} change made', '{n} changes made')}` : ''}{d.kmApplied ? `, ${bike?.name ? t('{km} km added to {bike}', { km: num(d.kmApplied), bike: bike.name }) : t('{km} km added to the bike', { km: num(d.kmApplied) })}` : ''}. {t('The learnings now show up on the start page and when you pack.')}</p>
          {#if sugg.length}<p class="hint">{tn(sugg.length, '{n} more suggestion is open. Change your answers to see it.', '{n} more suggestions are open. Change your answers to see them.')}</p>{/if}
          <div class="foot two"><button type="button" class="btn" onclick={reopen}>{t('Change answers')}</button><a class="btn ink wide" href="#/">{t('Done')}</a></div>
        {:else}
          {#if !sugg.length}<p class="card">{t('Nothing to change. Everything you took was used and nothing was missing.')}</p>{/if}
          {#each GROUPS as grp (grp.key)}
            {@const list = sugg.filter((s) => s.group === grp.key)}
            {#if list.length}
              <section class="sum">
                <h2 class="title">{t(grp.name)}</h2>
                {#each list as s (s.id)}
                  <label class="chk"><input type="checkbox" checked={ticked(s)} onchange={(ev) => (ticks[s.id] = ev.currentTarget.checked)} /><span>{s.label}<small>{s.detail}</small></span></label>
                {/each}
              </section>
            {/if}
          {/each}
          {#if sugg.length}<p class="hint">{t('Nothing changes without a tick.')}</p>{/if}
          <div class="foot two"><button type="button" class="btn" onclick={() => (step = 2)}>{t('Back')}</button><button type="button" class="btn hi wide" disabled={busy} onclick={finish}>{t('Save debrief')}</button></div>
        {/if}
      {/if}
    {/if}
  </div>
{:else}
  <div class="over">
    <h1 class="title big">{t('Debrief')}</h1>
    <p class="lead">{t('After a trip: two minutes on what you used, missed or did not need. The app turns it into tips for the next trip.')}</p>

    <section aria-labelledby="todo-h">
      <h2 id="todo-h" class="title h">{t('To debrief')}</h2>
      {#each open as tr (tr.id)}
        <div class="card trip-row">
          <div><b>{tr.title}</b><span class="muted">{dateText(tr)} · {tn(tr.entries.length, '{n} item', '{n} items')}</span></div>
          <a class="btn" href="#/debrief/{encodeURIComponent(tr.id)}">{drafts.has(tr.id) ? t('Continue') : t('Start debrief')}</a>
        </div>
      {:else}
        <p class="muted">{t('No trip is waiting. A trip shows up here the day after it ends.')}</p>
      {/each}
    </section>

    {#if done.length}
      <section aria-labelledby="done-h">
        <h2 id="done-h" class="title h">{t('Done')}</h2>
        {#each done as { d: x, t: tr } (tr.id)}
          {@const c = debriefCounts(x, tr, items)}
          <a class="card trip-row link" href="#/debrief/{encodeURIComponent(tr.id)}">
            <div><b>{tr.title}</b><span class="muted">{dateText(tr)} · {t('{n} not used', { n: c.unused })} · {t('{n} missing', { n: c.missing })}</span></div>
            <span aria-hidden="true">→</span>
          </a>
        {/each}
      </section>
    {/if}

    <Compare {trips} {debriefs} {items} />

    <Pace />

    {#if events.length}
      <section id="logbook" aria-labelledby="log-h">
        <h2 id="log-h" class="title h">{t('Logbook')} <small class="muted">{tn(events.length, '{n} earlier trip', '{n} earlier trips')}</small></h2>
        {#each events as ev (ev.id)}
          <details class="topic ev">
            <summary><span class="title">{ev.name}</span> <span class="muted">{ev.dateText ?? ev.sortDate ?? ''}{ev.type ? ` · ${ev.type}` : ''}</span></summary>
            <dl>
              {#if ev.bike && ev.bike !== '–'}<dt>{t('Bike')}</dt><dd>{ev.bike}</dd>{/if}
              {#if ev.bags && ev.bags !== '–'}<dt>{t('Bags')}</dt><dd>{ev.bags}</dd>{/if}
              {#if ev.result}<dt>{t('What worked')}</dt><dd>{ev.result}</dd>{/if}
              {#if ev.learnings}<dt>{t('Learnings')}</dt><dd>{ev.learnings}</dd>{/if}
            </dl>
          </details>
        {/each}
      </section>
    {/if}

    <section id="learnings" aria-labelledby="learn-h">
      <h2 id="learn-h" class="title h">{t('Learnings')} <small class="muted">{learnings.length}</small></h2>
      <input class="inp q" type="search" placeholder={t('Search learnings')} bind:value={lq} aria-label={t('Search learnings')} />
      {#each topics as g (g.topic)}
        <details class="topic" open={!!lq.trim()}>
          <summary><span class="title">{t(g.topic)}</span> <span class="muted">{g.ls.length}</span></summary>
          <ul>
            {#each g.ls as l (l.id)}
              <li>
                <span class="prio p-{l.priority}">{l.priority ? t(l.priority) : '–'}</span>
                <span>{l.rule}{#if l.action}<small>→ {l.action}</small>{/if}<small class="muted">{l.source ?? ''}{l.confirmed ? ` · ${t('confirmed {n}×', { n: l.confirmed })}` : ''}</small></span>
              </li>
            {/each}
          </ul>
        </details>
      {:else}
        <p class="muted">{learnings.length ? t('Nothing matches.') : t('No learnings yet. They come from your Excel import and from every debrief.')}</p>
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
    font: 900 var(--fs-sub) var(--font-title);
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
    font-size: var(--fs-page);
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
    border: 1.5px solid var(--line-strong);
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
  .similar {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    margin: 8px 0 0;
  }
  .similar span {
    color: var(--ink-3);
    font-size: 14px;
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
    font-size: var(--fs-small);
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
    border-bottom: 1px solid var(--line-strong);
    padding-bottom: 3px;
  }
  .alls {
    margin-left: auto;
    display: flex;
    gap: 10px;
  }
  .alls .link {
    min-height: 32px;
    padding: 0 2px;
    border: 0;
    background: none;
    color: var(--ink);
    font: 600 14px var(--font-body);
    text-decoration: underline;
    cursor: pointer;
  }
  .fine {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    width: 100%;
    margin: 4px 0 14px;
    padding: 10px 14px;
    text-align: left;
  }
  .fine small {
    font-weight: 400;
    color: var(--ink-2);
  }
  .bag h2 .title {
    font-size: var(--fs-sub);
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
    font-size: var(--fs-small);
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
    font: 900 var(--fs-sub)/1.2 var(--font-title);
    white-space: nowrap;
  }
  @media (max-width: 479px) {
    .kpi {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  .sum {
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 10px 12px;
    margin-top: 10px;
  }
  .sum .title {
    font-size: var(--fs-sub);
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
    font-size: var(--fs-page);
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
    font-size: var(--fs-small);
    font-weight: 700;
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
    border-bottom: 1px solid var(--line-strong);
    padding: 6px 0;
  }
  .topic summary {
    cursor: pointer;
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .topic summary .title {
    font-size: var(--fs-sub);
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
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .topic li small.muted {
    color: var(--ink-3);
  }
  .prio {
    flex: none;
    min-width: 56px;
    font: 600 12px var(--font-body);
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
