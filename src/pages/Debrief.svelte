<script>
  import { localDay } from '../lib/localday.js';
  /**
   * Debrief (stage 1, 4.10.2026): after a trip, in about two minutes.
   * #/debrief            trips to debrief, finished debriefs, all learnings
   * #/debrief/<tripId>   one trip's debrief on one page (v0.29.0, Noah 9a; was three steps), saved while you go
   * #/debrief/learnings  the same overview, scrolled to the learnings
   * #/debrief/pace       the same overview, scrolled to "Your pace" (v0.19.0)
   * #/debrief/compare    the same overview, scrolled to "Your trips compared" (v0.25.1, Today's Trips tile and weight trend)
   */
  import { liveQuery } from 'dexie';
  import { t, tn, num, locale, nameOf } from '../lib/i18n.svelte.js';
  import { db } from '../lib/db.js';
  import { formatWeight, knownWeight, CATEGORY, isInventory, matches } from '../lib/gear.js';
  import { tripNotes, noteToDebrief } from '../lib/notes.js';
  import { isOver } from '../lib/debrief.js';
  import TripBand from '../lib/trip/TripBand.svelte';
  import '../lib/trip/trip.css';
  import { Check, Minus, X, Plus, ChevronRight, Star, ArrowRight, Briefcase, Upload } from '@lucide/svelte';
  import { ZONE } from '../lib/trips.js';
  import { TEMPLATES_KEY, saveTemplates } from '../lib/templates.js';
  import { WEATHER, AMOUNT, BAGS_OK, toDebrief, tripEnd, newDebrief, debriefCounts, suggestions, applyDebrief, unusedTimes, kmUpdate, similarItems, templateOffer, templateName } from '../lib/debrief.js';
  import { parseActivitiesCsv, parseRideFile, ridesOnTrip } from '../lib/activities.js';
  import Pace from '../lib/debrief/Pace.svelte';
  import Compare from '../lib/debrief/Compare.svelte';
  import TemplateOffer from '../lib/debrief/TemplateOffer.svelte';
  import { domainOf, domainName } from '../lib/domains.js';
  import { phone } from '../lib/media.svelte.js';

  let { param = '' } = $props();

  const tripsQ = liveQuery(() => db.trips.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const debriefsQ = liveQuery(() => db.debriefs.toArray());
  const learnQ = liveQuery(() => db.learnings.toArray());
  const bagsQ = liveQuery(() => db.containers.toArray());
  const tplQ = liveQuery(() => db.settings.get(TEMPLATES_KEY));
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const eventsQ = liveQuery(() => db.events.toArray());
  // v0.26.1 (AP20, Noah 19b): notes written on the way (QuickNote or Ride day) with this trip and a day.
  const notesQ = liveQuery(() => db.notes.toArray());
  // Answer 9a: the trips before the app (Hope, Alpenbrevet …) as a logbook to read, newest first.
  const events = $derived([...($eventsQ ?? [])].sort((a, b) => (b.sortDate ?? '').localeCompare(a.sortDate ?? '')));

  const trips = $derived($tripsQ ?? []);
  const items = $derived($itemsQ ?? []);
  const debriefs = $derived($debriefsQ ?? []);
  const learnings = $derived($learnQ ?? []);
  const templates = $derived($tplQ?.value ?? []);
  const byId = $derived(Object.fromEntries(items.map((i) => [i.id, i])));

  // v0.25.1 (Noah 3a): 'compare' scrolls to "Your trips compared".
  const SPOTS = ['learnings', 'pace', 'compare'];
  const tripId = $derived(param && !SPOTS.includes(param) ? decodeURIComponent(param) : null);
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
  let ticks = $state({});
  let saved = $state(false);
  let loadedFor = null;
  // v0.29.0 (Noah 9a): one page, everything filled in: weather as planned, amount right, bags fine,
  // the km from the route, every item used; the quick notes on the way are already the exceptions.
  $effect(() => {
    if (!trip || !$debriefsQ || !$notesQ || !$bikesQ || loadedFor === trip.id) return;
    loadedFor = trip.id;
    const stored = debriefs.find((x) => x.tripId === trip.id);
    let x = stored ? structuredClone($state.snapshot(stored)) : newDebrief(trip);
    if (!stored) for (const n of $notesQ.filter((n) => n.tripId === trip.id && n.debrief?.kind)) x = noteToDebrief(x, n);
    x.weather ??= 'planned';
    x.amount ??= 'right';
    x.bags ??= 'fine';
    if (x.km == null && bike && trip.route?.km) x.km = Math.round(trip.route.km);
    d = x;
    saved = stored?.status === 'done';
    offer = null;
    ticks = {};
  });
  async function persist() {
    d.updatedAt = new Date().toISOString();
    await db.debriefs.put($state.snapshot(d));
  }
  const set = (field, value) => {
    d[field] = value;
    persist();
  };
  // v0.29.0 (Noah 9a): one tap per exception: used → not used → broken → used.
  const NEXT = { used: 'unused', unused: 'broken', broken: 'used' };
  function cycle(itemId) {
    const now = d.items[itemId] ?? 'used';
    mark(itemId, NEXT[now]);
  }
  function mark(itemId, state) {
    if (state === 'used') delete d.items[itemId];
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
  // v0.26.1 (Noah 20a): the search of v0.24.0: gear that matches what you type (name, brand, German
  // name), then similar things; "Add … as new" when it is not in your gear.
  const missQ = $derived(missName.trim());
  const exactMiss = $derived(notOnTrip.find((i) => i.name.toLowerCase() === missQ.toLowerCase() || (i.nameDe ?? '').toLowerCase() === missQ.toLowerCase()) ?? null);
  const similar = $derived.by(() => {
    if (missQ.length < 2) return [];
    const hit = notOnTrip.filter((i) => !d?.missing.some((m) => m.itemId === i.id) && matches(i, { q: missQ }));
    const more = missQ.length >= 4 ? similarItems(missQ, notOnTrip).filter((i) => !hit.includes(i)) : [];
    return [...hit, ...more].slice(0, 6);
  });
  // v0.26.1 (Noah 19b): the notes on the way, from the debrief and from the Inbox (notes.js).
  const wayNotes = $derived(trip && d ? tripNotes(d, $notesQ ?? [], trip.id) : []);
  function addItem(item) {
    d.missing.push({ id: `m${Date.now().toString(36)}`, name: item.name, itemId: item.id });
    missName = '';
    persist();
  }
  function addMissing(event) {
    event.preventDefault();
    const name = missName.trim();
    if (!name) return;
    const match = exactMiss;
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
  // v0.29.0 (Noah 8a): a quick note that is already an answer ("not needed", "was missing") is not a learning of its own.
  const freeNotes = $derived(wayNotes.filter((n) => !n.kind));
  const sugg = $derived(d && trip ? suggestions({ ...d, rideNotes: freeNotes }, trip, items, learnings, templates, debriefs).filter((s) => !d.applied.includes(s.id)) : []);
  // The one suggestion for next time, with its reason: leave at home first, then the learnings.
  const RANK = { home: 0, learn: 1, wish: 2, template: 3 };
  const top = $derived([...sugg].sort((a, b) => RANK[a.group] - RANK[b.group])[0] ?? null);
  const more = $derived(sugg.filter((x) => x !== top));
  // The exceptions: what was not used or broke, and what was missing.
  const exceptions = $derived(d && trip ? trip.entries.filter((e) => d.items[e.itemId] && byId[e.itemId]) : []);
  const used = $derived(d && trip ? trip.entries.filter((e) => byId[e.itemId] && !d.items[e.itemId]).length : 0);
  const fromNote = (id) => wayNotes.find((n) => n.noteId === id) ?? null;
  const zoneOf = (slot) => groups.find((g) => g.slot === slot)?.name ?? slot;
  const STATE = { used: 'Used', unused: 'Not used', broken: 'Broken' };
  const GROUPS = [
    { key: 'home', name: 'Leave at home?' },
    { key: 'wish', name: 'Wishlist' },
    { key: 'learn', name: 'Learnings' },
    { key: 'template', name: 'Template' },
  ];
  const ticked = (s) => ticks[s.id] ?? true;
  // Open on a big screen when shown; afterwards it stays as you leave it (an attribute would shut it on every change).
  const openOnce = (node, open) => { node.open = open; };

  let busy = $state(false);
  // v0.24.1 (Noah 4a): the template name offered right after saving a day trip's debrief, else null.
  let offer = $state(null);
  async function finish() {
    busy = true;
    offer = templateOffer(trip, templates, trips) ? templateName(trip, bike, templates) : null;
    const on = sugg.filter(ticked).map((s) => s.id);
    const stamp = Date.now().toString(36).toUpperCase();
    const out = applyDebrief({ ...$state.snapshot(d), rideNotes: $state.snapshot(freeNotes) }, trip, items, learnings, templates, on, { newItemId: (n) => `W${stamp}${n}` });
    const km = kmUpdate(bike, d);
    const sortedAt = new Date().toISOString();
    await db.transaction('rw', [db.items, db.learnings, db.debriefs, db.trips, db.settings, db.bikes, db.notes], async () => {
      // v0.26.1 (Noah 19b): an Inbox note that became a learning here is sorted there too (no second learning later).
      for (const n of out.notes) await db.notes.update(n.id, { status: 'sorted', to: { kind: 'learning', label: 'Learning', ref: n.learningId }, sortedAt });
      if (out.items.length) await db.items.bulkPut(out.items);
      if (km) {
        await db.bikes.update(bike.id, { km: km.km, kmDate: localDay() });
        d.kmApplied = km.kmApplied;
      }
      if (out.learnings.length) await db.learnings.bulkPut(out.learnings);
      if (out.templates) await saveTemplates(db, out.templates);
      d.applied = [...d.applied, ...on];
      d.status = 'done';
      d.doneAt = new Date().toISOString();
      await db.debriefs.put($state.snapshot(d));
      // v0.29.0: a debrief saved before the last day ends the trip (as "Next: Debrief" on the way does).
      await db.trips.update(trip.id, isOver(trip) ? { status: 'done' } : { status: 'done', finished: localDay() });
    });
    busy = false;
    saved = true;
  }
  async function reopen() {
    d.status = 'draft';
    saved = false;
    offer = null;
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
    if (SPOTS.includes(param) && $learnQ && $tripsQ && $debriefsQ && $itemsQ) queueMicrotask(() => document.getElementById(param)?.scrollIntoView());
  });
</script>

{#if tripId}
  {#if !$tripsQ}
    <p class="muted">{t('Loading…')}</p>
  {:else if !trip}
    <p class="card">{t('This trip does not exist any more.')} <a href="#/debrief">{t('Back to Debrief')}</a></p>
  {:else if d}
    {#snippet go()}{#if saved}<a class="btn hi go" href="#/">{t('Done')}<ArrowRight size={20} aria-hidden="true" /></a>{:else}<button type="button" class="btn hi go" disabled={busy} onclick={finish}>{t('Save debrief')}<ArrowRight size={20} aria-hidden="true" /></button>{/if}{/snippet}
    {@const end = tripEnd(trip)}
    {@const back = end ? Math.round((Date.parse(`${localDay()}T00:00:00Z`) - Date.parse(`${end}T00:00:00Z`)) / 864e5) : null}
    <div class="flow trip-page">
      <TripBand {trip} tab="debrief" kicker={[t('Debrief'), back === 1 ? t('back yesterday') : back > 1 ? t('back {n} days ago', { n: back }) : ''].filter(Boolean).join(' · ')} action={go} hint={saved ? '' : t('Everything else counts as used.')} />
      {#if saved}
        <section class="tp-card saved-card" aria-labelledby="saved-h">
          <h2 id="saved-h" class="title">{t('Saved')}</h2>
          <div class="kpi">
            <div><b class="num">{counts.unused}</b><span class="lbl">{t('not used')}</span></div>
            <div><b class="num">{counts.unusedG ? knownWeight(counts.unusedG, counts.unusedUnweighed, (g) => `−${formatWeight(g)}`) : '–'}</b><span class="lbl">{t('possible')}{#if counts.unusedUnweighed}{' · '}{t('{n} not weighed', { n: counts.unusedUnweighed })}{/if}</span></div>
            <div><b class="num">{counts.missing}</b><span class="lbl">{t('missing')}</span></div>
            <div><b class="num">{counts.broken}</b><span class="lbl">{t('broken')}</span></div>
          </div>
          <p class="card ok">{t('Debrief saved')}{d.applied.length ? `, ${tn(d.applied.length, '{n} change made', '{n} changes made')}` : ''}{d.kmApplied ? `, ${bike?.name ? t('{km} km added to {bike}', { km: num(d.kmApplied), bike: bike.name }) : t('{km} km added to the bike', { km: num(d.kmApplied) })}` : ''}. {t('The learnings now show up on the start page and when you pack.')}</p>
          {#if sugg.length}<p class="hint">{tn(sugg.length, '{n} more suggestion is open. Change your answers to see it.', '{n} more suggestions are open. Change your answers to see them.')}</p>{/if}
          {#if offer}<TemplateOffer {trip} name={offer} />{/if}
          <p><button type="button" class="btn" onclick={reopen}>{t('Change answers')}</button></p>
        </section>
      {:else}
      <div class="tp-grid2 r">
        <div class="col">
          <!-- Noah 9a: only what was different; everything else counts as used. -->
          <section class="tp-card" aria-labelledby="diff-h">
            <h2 id="diff-h">{t('What was different?')}<span class="r">{t('tap only the exceptions')}</span></h2>
            {#if exceptions.length || d.missing.length}
              <ul class="exc">
                {#each exceptions as e (e.itemId)}
                  {@const st = d.items[e.itemId]}
                  {@const n = fromNote(d.itemNotes?.[e.itemId])}
                  <li><span class="nm">{nameOf(byId[e.itemId])}<small>{n ? t('from your note on the way, {time}', { time: noteWhen(n.at) }) : `${t(zoneOf(e.slot))}${byId[e.itemId].weightG != null ? ` · ${formatWeight(byId[e.itemId].weightG * (e.qty || 1))}` : ''}`}</small></span>
                    <button type="button" class="state {st}" aria-label={t('{name}: {state}. Tap to change.', { name: nameOf(byId[e.itemId]), state: t(STATE[st]) })} onclick={() => cycle(e.itemId)}>{#if st === 'unused'}<Minus size={16} aria-hidden="true" />{:else}<X size={16} aria-hidden="true" />{/if}{t(STATE[st])}</button></li>
                {/each}
                {#each d.missing as m (m.id)}
                  {@const n = m.noteId ? fromNote(m.noteId) : null}
                  <li><span class="nm">{m.name}<small>{n ? t('from your note on the way, {time}', { time: noteWhen(n.at) }) : m.itemId ? (trip.templateId ? t('in your gear · goes into the template') : t('in your gear')) : t('not in your gear · goes to the wishlist')}</small></span>
                    <span class="state miss"><Plus size={16} aria-hidden="true" />{t('Was missing')}</span>
                    <button type="button" class="x" aria-label={t('Remove {name}', { name: m.name })} onclick={() => dropMissing(m.id)}><X size={18} aria-hidden="true" /></button></li>
                {/each}
              </ul>
            {:else}<p class="tp-muted tp-small">{t('Nothing yet. Tap an item below when you did not use it or it broke.')}</p>{/if}
            <form class="miss" onsubmit={addMissing}>
              <input class="inp" list="gear-names" placeholder={t('What you missed, e.g. Headlamp')} bind:value={missName} aria-label={t('What you missed')} />
              <button type="submit" class="btn">{t('Add')}</button>
            </form>
            {#if similar.length}<p class="similar"><span>{t('In your gear:')}</span>{#each similar as i (i.id)}<button type="button" class="btn sm" onclick={() => addItem(i)}>{nameOf(i)}</button>{/each}</p>{/if}
            {#if missQ && !exactMiss}<p class="similar"><button type="button" class="btn sm" onclick={addMissing}>+ {t('Add "{q}" as new (not in your gear)', { q: missQ })}</button></p>{/if}
            <datalist id="gear-names">{#each notOnTrip as i (i.id)}<option value={i.name}></option>{/each}</datalist>
            {#if freeNotes.length}
              <div class="ridenotes">
                <span class="lbl">{t('Notes on the way')}</span>
                <ul>{#each freeNotes as n (n.key)}<li><small class="num">{trip.days > 1 ? `${t('Day {n}', { n: n.day + 1 })} · ` : ''}{noteWhen(n.at)}</small> {n.text}</li>{/each}</ul>
              </div>
            {/if}
          </section>

          <!-- Noah 9a: filled in; change only what was not so. -->
          <section class="tp-card" aria-labelledby="how-h">
            <h2 id="how-h">{t("How it was")}<span class="r">{t('filled in')}</span></h2>
            <div class="qa">
              <label><span>{t('Weather')}</span><select class="sel pill" value={d.weather} onchange={(e) => set('weather', e.currentTarget.value)}>{#each WEATHER as o (o.key)}<option value={o.key}>{t(o.name)}</option>{/each}</select></label>
              <label><span>{t('Amount')}</span><select class="sel pill" value={d.amount} onchange={(e) => set('amount', e.currentTarget.value)}>{#each AMOUNT as o (o.key)}<option value={o.key}>{t(o.name)}</option>{/each}</select></label>
              <label><span>{Array.isArray(trip.packs) ? t('Bags') : t('Bags and bike')}</span><select class="sel pill" value={d.bags} onchange={(e) => set('bags', e.currentTarget.value)}>{#each BAGS_OK as o (o.key)}<option value={o.key}>{t(o.name)}</option>{/each}</select></label>
              {#if bike}
                <label><span>{t('km for {bike}', { bike: bike.name })} <small>{bike.km != null ? t('now {km} km', { km: num(bike.km) }) : ''}</small></span><span class="kmin"><input class="inp num" type="text" inputmode="numeric" value={d.km ?? ''} onchange={(e) => setKm(e.currentTarget.value)} placeholder={t('e.g. 303')} aria-label={t('km of this trip')} /> km</span></label>
              {/if}
            </div>
            {#if bike}
              <p class="tp-muted tp-small kmsrc">{trip.route?.km && d.km === Math.round(trip.route.km) ? t('km from the route.') : ''}</p>
              {#if rideMsg}<p class="hint ride" role="status">{rideMsg}</p>{/if}
              <details class="howto">
                <summary>{t('Import from Strava or Garmin')}</summary>
                <span class="btn sm imp"><Upload size={16} aria-hidden="true" />{t('Choose files')}<input type="file" accept=".csv,.gpx,.tcx,text/csv,application/gpx+xml" multiple onchange={importRides} aria-label={t('Import from Strava or Garmin')} /></span>
                <p><b>Strava:</b> {t('on a ride → ••• → Export GPX (one ride), or Settings → My Account → Download your data → activities.csv (all rides).')}</p>
                <p><b>Garmin Connect:</b> {t('on a ride → ⚙ → Export to GPX or TCX, or Activities → Export CSV (the list).')}</p>
                <p>{t('Several files at once are fine (one per day). Only rides on the days of this trip count.')}</p>
              </details>
            {/if}
            <label class="note">
              <span>{t('One sentence for next time')} <small>({t('optional')})</small></span>
              <textarea class="inp" rows="2" bind:value={d.note} oninput={persist} placeholder={t('e.g. Heatwave, the rain gear was never used')}></textarea>
            </label>
          </section>
        </div>
        <div class="col">
          {#if top}
            <!-- Noah 9a: one suggestion for next time, with its reason. -->
            <section class="tp-card learn" aria-labelledby="learn-h1">
              <h2 id="learn-h1"><Star size={18} aria-hidden="true" />{t('For next time')}</h2>
              <p><b>{top.label}</b><br />{top.detail}</p>
              <div class="tp-chips" role="group" aria-label={top.label}>
                <button type="button" class="btn" class:on={ticked(top)} aria-pressed={ticked(top)} onclick={() => (ticks[top.id] = true)}>{t('Yes, remember')}</button>
                <button type="button" class="btn" class:on={!ticked(top)} aria-pressed={!ticked(top)} onclick={() => (ticks[top.id] = false)}>{t('No')}</button>
              </div>
            </section>
          {/if}
          {#if more.length}
            <details class="tp-fold">
              <summary><Star size={20} aria-hidden="true" /><span>{t('More suggestions')}</span><span class="r"><i class="tp-badge">{tn(more.filter(ticked).length, '{n} ticked', '{n} ticked')}</i><ChevronRight class="chev" size={18} aria-hidden="true" /></span></summary>
              <div class="in">
                {#each GROUPS as grp (grp.key)}
                  {@const list = more.filter((x) => x.group === grp.key)}
                  {#if list.length}
                    <p class="lbl">{t(grp.name)}</p>
                    {#each list as x (x.id)}<label class="chk"><input type="checkbox" checked={ticked(x)} onchange={(ev) => (ticks[x.id] = ev.currentTarget.checked)} /><span>{x.label}<small>{x.detail}</small></span></label>{/each}
                  {/if}
                {/each}
                <p class="hint tp-small">{t('Nothing changes without a tick.')}</p>
              </div>
            </details>
          {/if}
          <!-- Noah 9a: every item counts as used; a tap on an item changes it: used → not used → broken. -->
          <details class="tp-fold items-fold" use:openOnce={!phone.matches}>
            <summary><span class="tp-okdot"><Check size={16} aria-hidden="true" /></span><span class="two"><b>{tn(used, '{n} item used', '{n} items used')}</b><small>{t('Tap an item to change it: used → not used → broken')}</small></span><span class="r"><ChevronRight class="chev" size={18} aria-hidden="true" /></span></summary>
            <div class="in">
              {#each groups as g (g.slot)}
                <section class="bag" aria-label={t(g.name)}>
                  <h3><Briefcase size={16} aria-hidden="true" />{t(g.name)} <span class="tp-muted">{tn(g.rows.length, '{n} item', '{n} items')}</span>
                    <span class="alls">
                      <button type="button" class="tp-link" onclick={() => markAll(g.rows, 'used')} aria-label={t('All used: {bag}', { bag: t(g.name) })}>{t('All ✓')}</button>
                      <button type="button" class="tp-link" onclick={() => markAll(g.rows, 'unused')} aria-label={t('None used: {bag}', { bag: t(g.name) })}>{t('All –')}</button>
                    </span></h3>
                  <ul class="exc">
                    {#each g.rows as { e, item } (e.itemId)}
                      {@const st = d.items[e.itemId] ?? 'used'}
                      <li><span class="nm">{nameOf(item)}{#if e.qty > 1}<small class="q"> × {e.qty}</small>{/if}{#if before[e.itemId]}<small>{tn(before[e.itemId], 'not used on {n} trip before', 'not used on {n} trips before')}</small>{/if}</span>
                        <button type="button" class="state {st}" aria-label={t('{name}: {state}. Tap to change.', { name: nameOf(item), state: t(STATE[st]) })} onclick={() => cycle(e.itemId)}>{#if st === 'used'}<Check size={16} aria-hidden="true" />{:else if st === 'unused'}<Minus size={16} aria-hidden="true" />{:else}<X size={16} aria-hidden="true" />{/if}{t(STATE[st])}</button></li>
                    {/each}
                  </ul>
                </section>
              {/each}
            </div>
          </details>
        </div>
      </div>
      {/if}
    </div>
  {/if}
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
  .flow .tp-card > h2 {
    margin-bottom: 10px;
  }
  .flow .tp-card > h2 .r {
    white-space: normal;
    text-align: right;
  }
  .exc {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .exc li {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 52px;
    padding: 4px 0;
    border-top: 1px solid var(--line);
  }
  .exc li:first-child {
    border-top: 0;
  }
  .nm {
    flex: 1;
    min-width: 0;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }
  .nm small {
    display: block;
    color: var(--ink-3);
    font-size: 13px;
  }
  .nm small.q {
    display: inline;
  }
  .state {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-height: 44px;
    padding: 6px 12px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink-2);
    font: 500 14px var(--font-body);
    white-space: nowrap;
    cursor: pointer;
    flex: none;
  }
  .state.used {
    background: var(--ok-soft);
    border-color: transparent;
    color: var(--ok);
  }
  .state.unused {
    background: var(--warn-soft);
    border-color: transparent;
    color: var(--warn);
  }
  .state.broken {
    background: #fbe3df;
    border-color: transparent;
    color: #a3301f;
  }
  .state.miss {
    background: var(--hi-soft);
    border-color: transparent;
    color: var(--hi);
    cursor: default;
  }
  .x {
    display: inline-grid;
    place-items: center;
    width: 44px;
    height: 44px;
    flex: none;
    border: 0;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  .miss {
    display: flex;
    gap: 6px;
    margin-top: 10px;
  }
  .miss .inp {
    flex: 1;
    min-width: 0;
  }
  .qa {
    display: grid;
    gap: 0;
  }
  .qa label {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 6px 12px;
    min-height: 52px;
    padding: 4px 0;
    border-top: 1px solid var(--line);
  }
  .qa label:first-child {
    border-top: 0;
  }
  .qa label > span:first-child {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .qa small {
    color: var(--ink-3);
  }
  .pill {
    min-height: 44px;
    width: auto;
    max-width: 52vw;
    font-weight: 600;
    border-radius: 999px;
    padding: 6px 12px;
  }
  .kmin {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .kmin .inp {
    width: 110px;
    text-align: right;
  }
  .kmsrc:empty {
    display: none;
  }
  .kmsrc {
    margin: 2px 0 0;
  }
  .imp {
    position: relative;
    overflow: hidden;
    min-height: 44px;
  }
  .imp input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }
  .ride {
    margin: 6px 0;
  }
  .howto {
    margin: 0 0 8px;
    font-size: 14px;
    color: var(--ink-2);
  }
  .howto summary {
    cursor: pointer;
    text-decoration: underline;
    padding: 11px 0;
  }
  .howto p {
    margin: 6px 0;
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
    margin: 12px 0 0;
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
    margin-top: 8px;
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
  .hint {
    color: var(--ink-2);
    margin: 0 0 8px;
  }
  .learn {
    background: var(--brand);
    border-color: var(--brand);
    color: var(--brand-ink);
  }
  .learn h2 {
    color: var(--brand-ink);
  }
  .learn h2 :global(svg) {
    color: var(--hi-bright);
  }
  .learn p {
    margin: 10px 0 12px;
    color: var(--brand-ink-2);
  }
  .learn p b {
    color: var(--brand-ink);
  }
  .learn .btn {
    min-height: 44px;
    background: transparent;
    border-color: rgba(255, 255, 255, 0.35);
    color: var(--brand-ink);
  }
  .learn .btn.on {
    background: var(--brand-ink);
    border-color: var(--brand-ink);
    color: var(--brand);
  }
  .learn :global(:focus-visible) {
    outline-color: var(--focus-on-dark);
  }
  .items-fold .two {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .items-fold .two small {
    font-size: 13px;
    font-weight: 400;
    color: var(--ink-3);
  }
  .bag {
    margin-top: 10px;
  }
  .bag h3 {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px 8px;
    margin: 0;
    font-size: 15px;
    font-weight: 600;
  }
  .bag h3 .tp-muted {
    font-weight: 400;
    font-size: 13px;
  }
  .alls {
    margin-left: auto;
    display: flex;
    gap: 14px;
  }
  .saved-card .title {
    margin: 0 0 10px;
  }
  .kpi {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }
  .kpi div {
    background: var(--paper-2);
    border-radius: 8px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .kpi b {
    font: 700 20px/1.2 var(--font-body);
    white-space: nowrap;
  }
  @media (max-width: 479px) {
    .kpi {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  .chk {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    min-height: 44px;
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
