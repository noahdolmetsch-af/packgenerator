<script>
  import { leftOutToAsk } from '../lib/pack/leftout.js';
  import AskClaude from '../lib/assistent/AskClaude.svelte';
  import SpeakButton from '../lib/ui/SpeakButton.svelte'; // «Diktat» (Noah 19.10.2026 «5a»)
  import { appendSpoken } from '../lib/speak.js';
  import { longPress } from '../lib/ui/longpress.js';
  import PageMore from '../lib/pageinfo/PageMore.svelte';
  import TipLine from '../lib/pageinfo/TipLine.svelte';
  import { localDay } from '../lib/localday.js';
  import Skeleton from '../lib/ui/Skeleton.svelte';
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
  import { offerDone } from '../lib/ui/rename.svelte.js'; // Tote Knöpfe 9
  import { db } from '../lib/db.js';
  import { makeEntry, tripSpan, tripRidesIn } from '../lib/kmbook.js';
  import { syncBikes } from '../lib/kmbookdb.js';
  import { formatWeight, CATEGORY, isInventory, matches } from '../lib/gear.js';
  import { tripNotes, noteToDebrief } from '../lib/notes.js';
  import { isOver } from '../lib/debrief.js';
  import { parseKm } from '../lib/care.js';
  import TripBand from '../lib/trip/TripBand.svelte';
  import QuickLinks from '../lib/ui/QuickLinks.svelte';
  import { DEBRIEF_JUMPS } from '../lib/tourlernen/jumps.js';
  import SpurRow from '../lib/spur/SpurRow.svelte'; // Paket S «Reise-Spur»: the tour's map and days
  import { openTrip } from '../lib/nav.js';
  import { planAgain } from '../lib/trip/ending.js';
  import { endedTooEarly } from '../lib/tripstate.js';
  import { PLAY_WISH } from '../lib/play.js';
  import '../lib/trip/trip.css';
  import { Check, Minus, X, Plus, ChevronRight, Star, ArrowRight, ArrowLeft, Briefcase, Upload, Route, Sun, NotebookPen, ChevronLeft, ArrowDown } from '@lucide/svelte';
  import '../lib/review/review.css';
  import { ZONE, touched } from '../lib/trips.js';
  import { TEMPLATES_KEY, saveTemplates } from '../lib/templates.js';
  import { WEATHER, AMOUNT, BAGS_OK, toDebrief, tripEnd, newDebrief, debriefCounts, suggestions, applyDebrief, unusedTimes, kmUpdate, similarItems, templateOffer, templateName } from '../lib/debrief.js';
  import Pace from '../lib/debrief/Pace.svelte';
  import Hub from '../lib/review/Hub.svelte';
  import Logbook from '../lib/review/Logbook.svelte';
  import Learned from '../lib/review/Learned.svelte';
  import TripSaved from '../lib/review/TripSaved.svelte';
  import UndoToast from '../lib/review/UndoToast.svelte';
  import { packedList } from '../lib/review/ganz.js';
  import PageTiles from '../lib/sk/PageTiles.svelte'; // SK: the tile row at the page end
  import { mainStep, betweenHref, isDayTrip } from '../lib/phase.js';
  import TemplateOffer from '../lib/debrief/TemplateOffer.svelte';
  import DebriefPlanNotes from '../lib/debrief/DebriefPlanNotes.svelte';
  import FeelScale from '../lib/tourenc/FeelScale.svelte'; // Touren c 70
  import ReachChips from '../lib/tourenc/ReachChips.svelte'; // Touren c 65
  import VoiceDebrief from '../lib/tourenc/VoiceDebrief.svelte'; // Touren c 68
  import LearnCard from '../lib/tourlernen/LearnCard.svelte'; // Paket Z
  import DebriefLernen from '../lib/lernen/DebriefLernen.svelte'; // Paket M «Aus Touren lernen»
  import TodoButton from '../lib/lernen/TodoButton.svelte';
  import TodoPlace from '../lib/lernen/TodoPlace.svelte';
  import { domainOf, domainName, hasBike } from '../lib/domains.js';
  import Seg from '../lib/ui/Seg.svelte';
  import { CLOTHING, CLOTHING_OFFSET, offsetRecord, chooseKit, tempKits, coldest, tempRange } from '../lib/wardrobe.js';
  import { SETS_KEY } from '../lib/sets.js';
  import { Sparkles } from '@lucide/svelte';
  import DebriefDraft from '../lib/helper/DebriefDraft.svelte';
  import { ask, errorText, helper, isOn, isPaused } from '../lib/helper/client.svelte.js';
  import { debriefPayload } from '../lib/helper/payload.js';
  import { helperLearning } from '../lib/helper/logic.js';
  import { isDe } from '../lib/i18n.svelte.js';
  import { tick, onDestroy } from 'svelte';
  import '../lib/helper/helper.css';

  let { param = '', spot = '' } = $props();

  const tripsQ = liveQuery(() => db.trips.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const debriefsQ = liveQuery(() => db.debriefs.toArray());
  const learnQ = liveQuery(() => db.learnings.toArray());
  const bagsQ = liveQuery(() => db.containers.toArray());
  const tplQ = liveQuery(() => db.settings.get(TEMPLATES_KEY));
  const bikesQ = liveQuery(() => db.bikes.toArray());
  // v0.26.1 (AP20, Noah 19b): notes written on the way (QuickNote or Ride day) with this trip and a day.
  const notesQ = liveQuery(() => db.notes.toArray());
  // v0.41.0 (Noah 1): uploaded rides (GPX), for the row "Upload ride" and a trip's "Planned vs real".
  const ridesQ = liveQuery(() => db.rides.toArray());
  // v0.42.0 (Noah 6): the clothing row names the kit of this trip; its answers shift the kit borders.
  const setsQ = liveQuery(() => db.settings.get(SETS_KEY));
  const offsetQ = liveQuery(() => db.settings.get(CLOTHING_OFFSET));
  const tripRides = $derived(trip ? ($ridesQ ?? []).filter((r) => r.tripId === trip.id) : []);
  const trips = $derived($tripsQ ?? []);
  const items = $derived($itemsQ ?? []);
  const debriefs = $derived($debriefsQ ?? []);
  const learnings = $derived($learnQ ?? []);
  const templates = $derived($tplQ?.value ?? []);
  const byId = $derived(Object.fromEntries(items.map((i) => [i.id, i])));

  // v0.25.1 (Noah 3a): 'compare' scrolls to "Your trips compared".
  // v0.49.0 R1: pace, learnings and logbook are pages one level below the Rückblick; compare is its section.
  const SPOTS = ['learnings', 'pace', 'compare', 'logbook'];
  const SUBS = ['pace', 'learnings', 'logbook'];
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
  // L7: the debrief opens on the trip's last day (local date); before it, a placeholder with "Trip is off"
  // (the same skipped switch as Plan's "Not riding"). Ended early (finished) or over: the whole debrief.
  const early = $derived(!!trip && !isOver(trip) && !!tripEnd(trip) && localDay() < tripEnd(trip));
  const byBike = $derived(trip ? hasBike(trip) : true);
  // v0.88.0 (Noah 0.88 4a/5a, mockup H): a trip ended before its start date asks first, before a
  // debrief teaches the app something that has not happened: «Wieder planen», «Trotzdem Rückblick»,
  // or try it in the playground (Ich › Ausprobieren). «Trotzdem» holds until the page is left.
  const tooEarly = $derived(!!trip && endedTooEarly(trip, localDay()));
  let anyway = $state(null);
  function toPlay() {
    try {
      localStorage.setItem(PLAY_WISH, '1');
    } catch {
      /* private mode: Ich opens without the sheet */
    }
    location.hash = '#/me';
  }
  const longDate = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'long' });
  const toggleSkip = () => db.trips.update(trip.id, touched({ skipped: !trip.skipped }));
  // Answer 8b: how often each item was not used before (other trips), shown in step 2.
  const before = $derived(trip ? unusedTimes(debriefs, trip.id) : {});
  function setKm(value) {
    // v0.30.1 (D1): "45,3" is 45 km, not 453; "1'204" and "1.204" are 1204.
    const n = parseKm(value);
    d.km = n == null || Number.isNaN(n) ? null : n;
    persist();
  }
  const tripKit = $derived.by(() => {
    const c = trip ? coldest(trip) : null;
    return c ? chooseKit(tempKits($setsQ?.value ?? []), c.c, Number($offsetQ?.value) || 0) : null;
  });
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
    x.applied ??= []; // v0.40.0: an imported debrief may come without it
    // 0.116.1 (UI-Prüfung A1): an old backup's debrief can lack the item list; the page stayed empty
    x.items ??= {};
    x.missing ??= [];
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
    const before = Object.fromEntries(rows.map(({ e }) => [e.itemId, d.items[e.itemId]]));
    for (const { e } of rows) {
      if (state === 'used') delete d.items[e.itemId];
      else d.items[e.itemId] = state;
    }
    persist();
    // Tote Knöpfe 9 («Alles fertig»): «Alles gebraucht» on rows that were all «used» already changed nothing visible; say it, with Undo
    if (state === 'used') offerDone(tn(rows.length, '{n} item counts as used.', '{n} items count as used.'), () => {
      for (const [id, v] of Object.entries(before)) if (v == null) delete d.items[id]; else d.items[id] = v;
      persist();
    });
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
  // Touren-Ideen 43 «Was hätte gefehlt?»: what was taken off the list before the trip, one tap = was missing
  const leftAsk = $derived(trip && d ? leftOutToAsk(trip, items, d.missing) : []);
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
  /* ---------- v0.77.0 (answer 3a): «Entwurf holen» → «Entwurf vom Helfer» ---------- */
  let draft = $state(null);
  let draftBusy = $state(false);
  let draftMsg = $state('');
  async function getDraft() {
    if (draftBusy) return;
    if (isPaused()) return (draftMsg = errorText('paused', { capChf: helper.capChf }));
    draftBusy = true;
    draftMsg = '';
    const r = await ask('debrief', debriefPayload(trip, { notes: $state.snapshot(freeNotes), debrief: $state.snapshot(d), items, learnings, lang: isDe() ? 'de' : 'en' }));
    draftBusy = false;
    if (!r.ok) return (draftMsg = errorText(r.error, { capChf: helper.capChf }));
    if (!r.result.learnings.length && !r.result.summary) return (draftMsg = t('The helper found nothing to suggest this time.'));
    draft = r.result;
  }
  /** «Übernehmen» on a learning: saved like the app's own; its note on the way counts as answered. */
  async function learnFromDraft(s) {
    const now = new Date().toISOString();
    const note = wayNotes.find((n) => n.key === s.noteKey);
    await db.transaction('rw', [db.learnings, db.debriefs, db.notes], async () => {
      const rec = helperLearning(s, trip, await db.learnings.toArray(), now);
      await db.learnings.put(rec);
      if (note?.noteId) await db.notes.update(note.noteId, { status: 'sorted', to: { kind: 'learning', label: 'Learning', ref: rec.id }, sortedAt: now });
      if (note && !d.applied.includes(note.key)) d.applied = [...d.applied, note.key];
      d.updatedAt = now;
      await db.debriefs.put($state.snapshot(d));
    });
  }
  /** «Übernehmen» / «Bearbeiten» on the summary: it becomes the sentence for next time (the field opens for «Bearbeiten»). */
  async function summaryFromDraft(text, edit) {
    d.note = text;
    await persist();
    if (edit) {
      await tick();
      const area = document.querySelector('.sentence textarea');
      area?.scrollIntoView({ block: 'center' });
      area?.focus();
    }
  }
  const noteWhen = (iso) => new Date(iso).toLocaleString(locale(), { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  function dropMissing(id) {
    d.missing = d.missing.filter((m) => m.id !== id);
    persist();
  }

  // Step 3: suggestions; ones applied in an earlier save are left out.
  // v0.144.0 RE «Rückblick: nichts vorangekreuzt» (Noah 3a): nothing is ticked to start with.
  const counts = $derived(d && trip ? debriefCounts(d, trip, items) : null);
  // v0.29.0 (Noah 8a): a quick note that is already an answer ("not needed", "was missing") is not a learning of its own.
  const freeNotes = $derived(wayNotes.filter((n) => !n.kind));
  const sugg = $derived(d && trip ? suggestions({ ...d, rideNotes: freeNotes }, trip, items, learnings, templates, debriefs).filter((s) => !d.applied.includes(s.id)) : []);
  // The one suggestion for next time, with its reason: leave at home first, then the learnings.
  const RANK = { home: 0, learn: 1, wish: 2, template: 3 };
  // v0.30.1 (Noah C3): a suggestion answered "No" makes room for the next one (it stays unticked under "More").
  const top = $derived([...sugg].filter((s) => ticks[s.id] !== false).sort((a, b) => RANK[a.group] - RANK[b.group])[0] ?? null);
  const more = $derived(sugg.filter((x) => x !== top));
  const used = $derived(d && trip ? trip.entries.filter((e) => byId[e.itemId] && !d.items[e.itemId]).length : 0);
  // v0.92.0 (Noah 4a): one chip per packed item, in the order of the trip; the tally counts what stayed in the bag.
  // v0.109.0 Design-Refresh P6 (T15): the chips by bag, in the order of the trip, each item once.
  const chipGroups = $derived.by(() => {
    const seen = new Set();
    return groups.map((g) => ({ ...g, rows: g.rows.filter(({ e }) => !seen.has(e.itemId) && seen.add(e.itemId)) })).filter((g) => g.rows.length);
  });
  const chips = $derived(trip ? trip.entries.filter((e, i, all) => byId[e.itemId] && all.findIndex((x) => x.itemId === e.itemId) === i).map((e) => ({ e, item: byId[e.itemId] })) : []);
  const unusedN = $derived(d ? chips.filter(({ e }) => d.items[e.itemId] === 'unused').length : 0);
  const unusedG = $derived(d ? chips.reduce((g, { e, item }) => g + (d.items[e.itemId] === 'unused' && item.weightG != null ? item.weightG * (e.qty || 1) : 0), 0) : 0);
  const fromNote = (id) => wayNotes.find((n) => n.noteId === id) ?? null;
  const STATE = { used: 'Used', unused: 'Not used', broken: 'Broken' };
  const GROUPS = [
    { key: 'home', name: 'Leave at home?' },
    { key: 'wish', name: 'Wishlist' },
    { key: 'learn', name: 'Learnings' },
    { key: 'template', name: 'Template' },
  ];
  const ticked = (s) => ticks[s.id] ?? false;
  // RE 3a: the one button «Fertig · N von M übernehmen» counts the ticked ones of «Weitere Vorschläge».
  const moreOn = $derived(more.filter(ticked).length);
  const doneLabel = $derived(!more.length ? t('Done|debrief') : moreOn ? t('Done · take over {n} of {m}', { n: moreOn, m: more.length }) : t('Done · take over nothing'));

  // v0.30.1 (Noah C3): "Yes, remember" saved nothing (the suggestion was ticked already, so the tap
  // changed nothing). Now it applies this one suggestion at once, the way "Save debrief" applies the
  // ticked ones, and the next suggestion takes its place. A quick second tap does nothing.
  let rememberMsg = $state('');
  let remembering = $state(false);
  // Impeccable: one suggestion applied at once (shared by «Ja, merken» and «Übernehmen» on the saved debrief)
  let applyN = 0;
  async function applyOne(s) {
    if (!s || d.applied.includes(s.id)) return;
    const stamp = `${Date.now().toString(36).toUpperCase()}${(applyN++).toString(36).toUpperCase()}`;
    const out = applyDebrief({ ...$state.snapshot(d), rideNotes: $state.snapshot(freeNotes) }, trip, items, learnings, templates, [s.id], { newItemId: (n) => `W${stamp}${n}` });
    const now = new Date().toISOString();
    await db.transaction('rw', [db.items, db.learnings, db.debriefs, db.settings, db.notes], async () => {
      for (const n of out.notes) await db.notes.update(n.id, { status: 'sorted', to: { kind: 'learning', label: 'Learning', ref: n.learningId }, sortedAt: now });
      if (out.items.length) await db.items.bulkPut(out.items);
      if (out.learnings.length) await db.learnings.bulkPut(out.learnings);
      if (out.templates) await saveTemplates(db, out.templates);
      d.applied = [...d.applied, s.id];
      d.updatedAt = now;
      await db.debriefs.put($state.snapshot(d));
    });
  }
  async function remember(s) {
    if (remembering || !s || d.applied.includes(s.id)) return;
    remembering = true;
    try {
      await applyOne(s);
      rememberMsg = t('Remembered: {label}', { label: s.label });
    } catch {
      rememberMsg = t('Could not save. Please try again.');
    } finally {
      // The next suggestion takes this place: a second tap of a double tap must not answer it.
      setTimeout(() => (remembering = false), 700);
    }
  }

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
    await db.transaction('rw', [db.items, db.learnings, db.debriefs, db.trips, db.settings, db.bikes, db.notes, db.kmBook], async () => {
      // v0.26.1 (Noah 19b): an Inbox note that became a learning here is sorted there too (no second learning later).
      for (const n of out.notes) await db.notes.update(n.id, { status: 'sorted', to: { kind: 'learning', label: 'Learning', ref: n.learningId }, sortedAt });
      if (out.items.length) await db.items.bulkPut(out.items);
      if (km) {
        // v0.68.0 (Q1): the trip's km are one entry in the ride ledger (its days as span), unless the
        // rides of these days are in the ledger already (imported): then nothing is counted twice.
        const mine = await db.kmBook.where('bikeId').equals(bike.id).toArray();
        const span = tripSpan(trip, tripEnd(trip));
        if (!tripRidesIn(mine, bike.id, span).length) {
          const diff = km.km - (bike.km ?? 0);
          const had = mine.find((e) => e.tripId === trip.id && e.kind === 'ride');
          if (had) await db.kmBook.update(had.id, { km: Math.round((had.km + diff) * 10) / 10 });
          else await db.kmBook.put(makeEntry({ bikeId: bike.id, date: span?.[0] ?? localDay(), km: diff, kind: 'ride', source: 'hand', name: trip.title, by: 'user', sure: 'user', span, tripId: trip.id, note: 'From the debrief' }));
          await syncBikes(db, [bike.id]);
        }
        d.kmApplied = km.kmApplied;
      }
      if (out.learnings.length) await db.learnings.bulkPut(out.learnings);
      if (out.templates) await saveTemplates(db, out.templates);
      d.applied = [...d.applied, ...on];
      // SN2x U5 «Packliste, wie gepackt»: the list as it was packed, kept fixed on the debrief
      d.packed = packedList(trip, items, $bagsQ ?? []);
      d.status = 'done';
      d.doneAt = new Date().toISOString();
      await db.debriefs.put($state.snapshot(d));
      // v0.42.0 (Noah 6): the clothing answers of all saved debriefs shift the kit borders (±3 °C at most).
      // v0.45.0 (decision 8): after a reset in the wardrobe only the debriefs saved since then count.
      await db.settings.put(offsetRecord(await db.settings.get(CLOTHING_OFFSET), await db.debriefs.toArray(), d.doneAt));
      // v0.29.0: a debrief saved before the last day ends the trip (as "Next: Debrief" on the way does).
      await db.trips.update(trip.id, isOver(trip) ? { status: 'done' } : { status: 'done', finished: localDay() });
    });
    busy = false;
    saved = true;
    // v0.67.0 «Übergänge 1» (U006, Ü5a): a trip of several days closes with the interstitial «Rückblick
    // fertig»; a day ride stays here (its saved view offers the template).
    if (!isDayTrip(trip)) location.hash = betweenHref(trip, 'debriefed');
  }
  // SN2x: a change on the saved Rückblick («Für nächstes Mal») goes onto the debrief kept here, so a later
  // «Antworten ändern» does not write an older copy over it.
  async function patchSaved(patch) {
    Object.assign(d, patch);
    await persist();
  }
  // Impeccable (Noah 18.10.2026, Rückblick einer Tour 1): the saved debrief shows its open suggestions, each
  // with «Übernehmen» and «Nein, danke». A tap hides the row at once and «Rückgängig» stays for 4 s; only
  // then is it applied (or stored as «Nein, danke» on the debrief). «Antworten ändern» still shows every one.
  let held = $state({});
  let heldNote = $state(null);
  const heldT = {};
  let heldChain = Promise.resolve();
  const openSugg = $derived(sugg.filter((s) => !(d?.dismissed ?? []).includes(s.id) && !held[s.id]));
  function commitHeld(id) {
    const kind = held[id];
    clearTimeout(heldT[id]);
    delete heldT[id];
    if (heldNote?.id === id) heldNote = null;
    if (!kind) return;
    const s = sugg.find((x) => x.id === id);
    heldChain = heldChain.then(async () => {
      try {
        if (kind === 'take') await applyOne(s);
        else if (!(d.dismissed ?? []).includes(id)) {
          d.dismissed = [...(d.dismissed ?? []), id];
          await persist();
        }
      } catch {
        rememberMsg = t('Could not save. Please try again.');
      } finally {
        const { [id]: _gone, ...rest } = held;
        held = rest;
      }
    });
  }
  function holdSugg(s, kind) {
    for (const id of Object.keys(heldT)) commitHeld(id);
    held = { ...held, [s.id]: kind };
    heldNote = { id: s.id, text: kind === 'take' ? t('Taken over: {label}', { label: s.label }) : t('No, thanks: {label}', { label: s.label }) };
    heldT[s.id] = setTimeout(() => commitHeld(s.id), 4000);
  }
  function undoHeld() {
    const id = heldNote?.id;
    if (!id) return;
    clearTimeout(heldT[id]);
    delete heldT[id];
    const { [id]: _gone, ...rest } = held;
    held = rest;
    heldNote = null;
  }
  // leaving the page within the 4 s keeps the answer
  onDestroy(() => {
    for (const id of Object.keys(heldT)) commitHeld(id);
  });
  function showSugg() {
    window.dispatchEvent(new CustomEvent('rv-suggestions'));
  }
  async function reopen() {
    d.status = 'draft';
    saved = false;
    offer = null;
    await persist();
  }


</script>

{#if tripId}
  {#if !$tripsQ}
    <Skeleton rows={3} />
  {:else if !trip}
    <p class="card">{t('This trip does not exist any more.')} <a href="#/debrief">{t('Back to Debrief')}</a></p>
  {:else if early}
    <!-- L7: before the last day there is nothing to look back on yet: a calm placeholder, no save.
         A trip ended early (finished) or over keeps the whole debrief. -->
    <!-- The page's one orange button leads back to where the trip stands: On the way once it has started, else Pack. -->
    <!-- v0.67.0 «Übergänge 1» (U002, U013): the page's one button follows the phase (phase.js): packed and
         waiting «Zur Startseite», not packed «Weiter zu Packen», under way «Weiter zu Unterwegs». -->
    {@const m = mainStep(trip, localDay(), 'debrief')}
    {#snippet back()}<a class="btn hi go" href={m.href} onclick={() => openTrip(trip.id)}>{t(m.label)}<ArrowRight size={20} aria-hidden="true" /></a>{/snippet}
    <div class="flow trip-page">
      <TripBand {trip} tab="debrief" kicker={t('Debrief')} action={back} />
      <section class="tp-card early" aria-labelledby="early-h">
        <h2 id="early-h">{t('Debrief from {date}', { date: longDate(tripEnd(trip)) })}</h2>
        {#if trip.skipped}<p class="tp-status">{byBike ? t('Not riding') : t('Not going')}</p>{:else}<p class="tp-muted">{t('Notes you write on the way will wait here.')}</p>{/if}
        <p><button type="button" class="btn" onclick={toggleSkip}>{trip.skipped ? (byBike ? t('Riding it after all') : t('Going after all')) : t('Trip is off')}</button></p>
      </section>
    </div>
  {:else if tooEarly && anyway !== trip.id}
    <div class="flow trip-page">
      <section class="tp-card early ahead" aria-labelledby="ahead-h">
        <h2 id="ahead-h">{t('{name} is still to come', { name: trip.title || t('This trip') })}</h2>
        <p class="tp-muted">{t('It starts on {date}. A debrief now ends the trip, and the app learns from it.', { date: longDate(trip.startDate) })}</p>
        <div class="ahead-acts">
          <button type="button" class="btn hi" onclick={() => planAgain($state.snapshot(trip))}>{t('Plan again')}<ArrowRight size={18} aria-hidden="true" /></button>
          <button type="button" class="btn" onclick={() => (anyway = trip.id)}>{t('Debrief anyway')}</button>
          <button type="button" class="tp-link" onclick={toPlay}>{t('Rather try it in the playground')}</button>
        </div>
      </section>
    </div>
  {:else if d}
    {#snippet go()}{#if saved && openSugg.length}<button type="button" class="btn go" onclick={showSugg} data-show-sugg>{tn(openSugg.length, 'See {n} suggestion', 'See {n} suggestions')}<ArrowDown size={18} aria-hidden="true" /></button>{:else if saved}<button type="button" class="btn go" onclick={reopen}>{t('Change answers')}<ChevronRight size={18} aria-hidden="true" /></button>{:else}<button type="button" class="btn hi go" disabled={busy} onclick={finish} data-done-take>{doneLabel}<ArrowRight size={20} aria-hidden="true" /></button>{/if}{/snippet}
    {@const end = tripEnd(trip)}
    {@const back = end ? Math.round((Date.parse(`${localDay()}T00:00:00Z`) - Date.parse(`${end}T00:00:00Z`)) / 864e5) : null}
    <div class="flow trip-page">
      <TripBand {trip} tab="debrief" kicker={[t('Debrief'), back === 1 ? t('back yesterday') : back > 1 ? t('back {n} days ago', { n: back }) : ''].filter(Boolean).join(' · ')} action={go} />
      <!-- «Mehr Inhalt» (Noah 15.10.2026, 1a–5a): the tip of the day, at the end the fold and the example «Nächstes Mal anders» -->
      <SpurRow {trip} />
      <!-- «Touren sichtbar» (Noah 24.10.2026 «2b 3a»): a long page, so its parts as one row of chips right under the band;
           a chip scrolls to its part, and shows only while that part is on the page -->
      <QuickLinks label={t('On this page')} links={DEBRIEF_JUMPS.map((x) => ({ ...x, label: t(x.label) }))} />
      {#if saved}
        <TipLine page="debrief" name={t('Debrief')} />
        <!-- v0.49.0 R1 (drei «A»): the saved Rückblick tells what the trip was (TripSaved.svelte). -->
        <!-- SN2x «SN2 extra»: the whole Rückblick in five groups; «Für nächstes Mal» is stored on the debrief (onpatch) -->
        <TripSaved {trip} {d} {bike} {trips} {debriefs} rides={$ridesQ ?? []} {learnings} {items} containers={$bagsQ ?? []} bikes={$bikesQ ?? []} {counts} {sugg} {openSugg} ontake={(s) => holdSugg(s, 'take')} onno={(s) => holdSugg(s, 'no')} onreopen={reopen} {offer} notes={$notesQ ?? []} onpatch={patchSaved} />
        {#if heldNote}<UndoToast text={heldNote.text} onundo={undoHeld} />{/if}
        <!-- Paket M: Tour-Tagebuch, Was war neu, Zusatzfragen, Nachricht an dich -->
        <DebriefLernen {trip} {d} {persist} notes={wayNotes} rides={tripRides} />
        <!-- Paket Z «Aus jeder Tour lernen»: breakdown, where you slept, the tour postcard (below the answers, so the chips stay first) -->
        <LearnCard {trip} {bike} />
        <PageMore page="debrief" name={t('Debrief')} />
        <PageTiles page="debrief" extrasHint />
      {:else}
      <!-- v0.109.0 Design-Refresh P6 (T15 «Rückblick ausfüllen», approved 12.10.2026): two columns as in the
           mockup. Left: what stayed in the bag (chips by bag, «Alle ✓ · Alle –»), what was missing with the
           suggestion for next time and the one sentence. Right: the notes on the way, upload a ride, «Mehr»
           (how it was, all items by bag). Everything the page could do stays; nothing is new. -->
      <div class="rv-lay dbf">
        <div class="rv-col">
          <section class="rv-sec unneeded" aria-labelledby="unneeded-h">
            <div class="rv-h"><div><h2 id="unneeded-h">{t('What did you not need?')}</h2><p class="rv-sub">{t('Tap what stayed in the bag. The app learns it for next time.')} {t('Press long on an item: broken.')}</p></div></div>
            <div class="rv-box pad">
              <div class="bags" role="group" aria-labelledby="unneeded-h">
                {#each chipGroups as g (g.slot)}
                  <div class="cbag">
                    {#if chipGroups.length > 1 || g.name}<p class="cbh"><b>{t(g.name)}</b>
                      <span class="alls">
                        <button type="button" class="tp-link" onclick={() => markAll(g.rows, 'used')} aria-label={t('All used: {bag}', { bag: t(g.name) })}>{t('All used|short')}</button>
                        <button type="button" class="tp-link" onclick={() => markAll(g.rows, 'unused')} aria-label={t('None used: {bag}', { bag: t(g.name) })}>{t('None used|short')}</button>
                      </span></p>{/if}
                    <div class="chips">
                      {#each g.rows as { e, item } (e.itemId)}
                        {@const st = d.items[e.itemId] ?? 'used'}
                        <button type="button" class="chip {st}" aria-pressed={st !== 'used'} aria-label={t('{name}: {state}. Tap to change, long press: broken.', { name: nameOf(item), state: t(STATE[st]) })} title={before[e.itemId] ? tn(before[e.itemId], 'not used on {n} trip before', 'not used on {n} trips before') : undefined} onclick={() => mark(e.itemId, st === 'used' ? 'unused' : 'used')} use:longPress={() => mark(e.itemId, st === 'broken' ? 'used' : 'broken')}>{#if st === 'used'}<Check size={14} aria-hidden="true" />{:else if st === 'unused'}<Minus size={14} aria-hidden="true" />{:else}<X size={14} aria-hidden="true" />{/if}{nameOf(item)}{#if e.qty > 1}<small> × {e.qty}</small>{/if}{#if st === 'broken'}<small class="br"> · {t('Broken')}</small>{/if}</button>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>
              <p class="tally" role="status">{#if unusedN}<b>{tn(unusedN, '{n} not used', '{n} not used')}</b>{#if unusedG > 0}{' · '}{t('{weight} less next time?', { weight: formatWeight(unusedG) })}{/if}{:else}{t('Nothing tapped: everything counts as used.')}{/if}</p>
              <ReachChips rows={chips} {d} onchange={(list) => set('reach', list)} />
            </div>
          </section>

          <section class="rv-sec miss-fold next-fold" aria-labelledby="miss-h">
            <div class="rv-h"><div><h2 id="miss-h">{t('What was missing?')}</h2>{#if d.missing.length}<p class="rv-sub">{d.missing.map((m) => m.name).join(', ')}</p>{/if}</div></div>
            <div class="rv-box pad">
              {#if rememberMsg}<p class="remembered" role="status"><Check size={16} aria-hidden="true" />{rememberMsg}</p>{/if}
              {#if top}
                <!-- Noah 9a: one suggestion for next time, with its reason; «Ja, merken» saves it at once. -->
                <section class="learn" aria-labelledby="learn-h1">
                  <span class="rv-ic" aria-hidden="true"><Star size={18} /></span>
                  <span class="rv-m"><span class="rv-t" id="learn-h1">{top.label}</span><span class="rv-s">{top.detail}</span></span>
                  <span class="yn">
                    <button type="button" class="btn sm yes" disabled={remembering} onclick={() => remember(top)}>{t('Yes, remember')}</button>
                    <button type="button" class="btn sm" disabled={remembering} onclick={() => ((ticks[top.id] = false), (rememberMsg = ''))}>{t('No')}</button>
                  </span>
                </section>
              {/if}
              {#if d.missing.length}
                <ul class="exc">
                  {#each d.missing as m (m.id)}
                    {@const n = m.noteId ? fromNote(m.noteId) : null}
                    <li><span class="nm">{m.name}<small>{n ? t('from your note on the way, {time}', { time: noteWhen(n.at) }) : m.itemId ? (trip.templateId ? t('in your gear · goes into the template') : t('in your gear')) : t('not in your gear · goes to the wishlist')}</small></span>
                      <span class="state miss"><Plus size={16} aria-hidden="true" />{t('Was missing')}</span>
                      <button type="button" class="x" aria-label={t('Remove {name}', { name: m.name })} onclick={() => dropMissing(m.id)}><X size={18} aria-hidden="true" /></button></li>
                  {/each}
                </ul>
              {/if}
              {#if leftAsk.length}
                <div class="similar leftout" data-leftout>
                  <span>{t('You left these at home. Was one of them missing?')}</span>
                  {#each leftAsk as i (i.id)}<button type="button" class="btn sm" onclick={() => addItem(i)} data-leftout-item>+ {nameOf(i)}</button>{/each}
                </div>
              {/if}
              <form class="miss" onsubmit={addMissing}>
                <input class="inp" list="gear-names" placeholder={t('What you missed, e.g. Headlamp')} bind:value={missName} aria-label={t('What you missed')} />
                <button type="submit" class="btn">{t('Add')}</button>
              </form>
              {#if similar.length}<p class="similar"><span>{t('In your gear:')}</span>{#each similar as i (i.id)}<button type="button" class="btn sm" onclick={() => addItem(i)}>{nameOf(i)}</button>{/each}</p>{/if}
              {#if missQ && !exactMiss}<p class="similar"><button type="button" class="btn sm" onclick={addMissing}>+ {t('Add "{q}" as new (not in your gear)', { q: missQ })}</button></p>{/if}
              <datalist id="gear-names">{#each notOnTrip as i (i.id)}<option value={i.name}></option>{/each}</datalist>
              <label class="sentence"><span>{t('One sentence for next time')}</span>
                <textarea class="inp" rows="2" bind:value={d.note} oninput={persist} placeholder={t('e.g. Heatwave, the rain gear was never used')}></textarea></label>
              <div class="tall"><SpeakButton wrap onsaid={(w) => ((d.note = appendSpoken(d.note ?? '', w)), persist())} /></div>
              {#if more.length}
                <!-- the other suggestions stay in sight: what is ticked is applied with «Fertig»; RE 3a: nothing is ticked to start with -->
                <div class="moresugs">
                  <p class="mh"><span>{t('More suggestions')}</span><span class="rv-v num">{t('{n} of {m} ticked', { n: moreOn, m: more.length })}</span></p>
                  {#each GROUPS as grp (grp.key)}
                    {@const list = more.filter((x) => x.group === grp.key)}
                    {#if list.length}
                      <p class="lbl">{t(grp.name)}</p>
                      {#each list as x (x.id)}<label class="chk"><input type="checkbox" checked={ticked(x)} onchange={(ev) => (ticks[x.id] = ev.currentTarget.checked)} /><span>{x.label}<small>{x.detail}</small></span></label>{/each}
                    {/if}
                  {/each}
                  <p class="hint tp-small">{t('Nothing is ticked to start with. Tick what you want to take over; the rest stays as it is.')}</p>
                </div>
              {/if}
            </div>
          </section>
        </div>

        <div class="rv-col">
          <!-- Touren c 70 «Gefühl vor den Zahlen»: how hard it was, before the numbers (they come after «Fertig») -->
          <section class="rv-sec" aria-labelledby="dfeel-h" data-debrief-feel>
            <div class="rv-h"><div><h2 id="dfeel-h">{t('How hard was it?')}</h2><p class="rv-sub">{t('First your feeling; the numbers come after «Done».')}</p></div></div>
            <div class="rv-box pad"><FeelScale value={d.feel ?? null} onpick={(n) => set('feel', n)} /></div>
          </section>
          <!-- Touren c 68 «Rückblick als Sprachnachricht» -->
          <VoiceDebrief {trip} {d} {items} {persist} />
          <!-- Planungs-Notizen (IS 246–249): «Hat es geholfen?» -->
          <DebriefPlanNotes {trip} />
          {#if freeNotes.length}
            <section class="rv-sec ridenotes" aria-labelledby="notes-h">
              <div class="rv-h"><div><h2 id="notes-h">{t('Notes on the way')}</h2><p class="rv-sub">{tn(freeNotes.length, '{n} · waiting here', '{n} · waiting here')}</p></div></div>
              <ul class="rv-box">
                {#each freeNotes as n (n.key)}<li class="rv-row"><span class="rv-ic" aria-hidden="true"><NotebookPen size={18} /></span><span class="rv-m"><span class="rv-t">{n.text}</span><span class="rv-s num">{trip.days > 1 ? `${t('Day {n}', { n: n.day + 1 })} · ` : ''}{noteWhen(n.at)}</span></span><TodoButton note={n} {trip} /></li>{/each}
              </ul>
              <!-- Paket M #88 (Noah «1 b und a oder andere Ablageorte»): where «Als To-do» puts a note -->
              <TodoPlace tripId={trip.id} />
            </section>
          {/if}

          <!-- Paket M: Tour-Tagebuch, Was war neu, Zusatzfragen, Nachricht an dich -->
          <DebriefLernen {trip} {d} {persist} notes={wayNotes} rides={tripRides} />

          <section class="rv-sec" aria-labelledby="upload-h">
            <div class="rv-h"><div><h2 id="upload-h">{t('Upload ride')}</h2><p class="rv-sub">{t('optional: pauses, plan and reality')}</p></div></div>
            <ul class="rv-box ridelink">
              <!-- GPX-Weg R3 (Noah 15.10.2026 «5a»): one way for every ride file (GPX, TCX, CSV): «Upload ride» -->
              <li><a class="rv-row" href="#/debrief/ride" data-upload-row><span class="rv-ic" aria-hidden="true"><Upload size={18} /></span><span class="rv-m"><span class="rv-t">{t('Upload ride')}</span><span class="rv-s">{bike ? t('GPX, TCX or CSV from Strava or Garmin: the km of this trip, pauses, planned vs real') : t('GPX: pauses, planned vs real, learnings')}</span></span>{#if bike && d.rides?.length}<span class="rv-v">{tn(d.rides.length, '{n} ride', '{n} rides')}</span>{/if}<ChevronRight class="rv-chev" size={18} aria-hidden="true" /></a></li>
              <!-- v0.41.0 (Noah 1, 3): the recorded ride of this trip: planned vs real and its learnings -->
              {#each tripRides as r (r.id)}
                <li><a class="rv-row" href={`#/debrief/ride/${encodeURIComponent(r.id)}`}><span class="rv-ic" aria-hidden="true"><Route size={18} /></span><span class="rv-m"><span class="rv-t">{t('Planned vs real')}</span><span class="rv-s">{r.name}</span></span><span class="rv-v">{num(r.km)} km</span><ChevronRight class="rv-chev" size={18} aria-hidden="true" /></a></li>
              {/each}
            </ul>
          </section>

          <section class="rv-sec" aria-labelledby="more-h">
            <div class="rv-h"><div><h2 id="more-h">{t('More')}</h2></div></div>
            <div class="rv-box">
              <!-- Noah 9a: filled in; change only what was not so. -->
              <details class="how-fold">
                <summary class="rv-row"><span class="rv-ic" aria-hidden="true"><Sun size={18} /></span><span class="rv-m"><span class="rv-t">{t('How was it?')}</span><span class="rv-s">{byBike ? t('Weather, clothing, food, km') : t('Weather, clothing, food, bags')}</span></span><ChevronRight class="rv-chev" size={18} aria-hidden="true" /></summary>
                <div class="in">
                  <!-- v0.40.0 (Noah 4a): segmented toggles instead of drop-downs: one tap, the answer in sight. -->
                  <div class="qa">
                    <div class="segq"><span class="lbl" id="q-wx">{t('Weather')}</span><Seg labelledby="q-wx" value={d.weather} options={WEATHER.map((o) => ({ key: o.key, name: t(o.name) }))} onchange={(v) => set('weather', v)} /></div>
                    <!-- v0.42.0 (Noah 6): how the clothing was; it slowly shifts the borders of the temperature kits. -->
                    <div class="segq"><span class="lbl" id="q-cloth">{t('Clothing')}</span><Seg labelledby="q-cloth" value={d.clothing ?? null} options={CLOTHING.map((o) => ({ key: o.key, name: t(o.name) }))} onchange={(v) => set('clothing', v)} />
                      <p class="tp-muted tp-small clothhint">{tripKit ? t('Slowly shifts the borders of your temperature kits (here kit {range}).', { range: tempRange(tripKit.minC, tripKit.maxC, t) }) : t('Slowly shifts the borders of your temperature kits.')}</p></div>
                    <div class="segq"><span class="lbl" id="q-amount">{t('Amount of food and drink')}</span><Seg labelledby="q-amount" value={d.amount} options={AMOUNT.map((o) => ({ key: o.key, name: t(o.name) }))} onchange={(v) => set('amount', v)} /></div>
                    <div class="segq"><span class="lbl" id="q-bags">{Array.isArray(trip.packs) ? t('Bags') : t('Bags and bike')}</span><Seg labelledby="q-bags" value={d.bags} options={BAGS_OK.map((o) => ({ key: o.key, name: t(o.name) }))} onchange={(v) => set('bags', v)} /></div>
                    {#if bike}
                      <label><span>{t('km for {bike}', { bike: bike.name })} <small>{bike.km != null ? t('now {km} km', { km: num(bike.km) }) : ''}</small></span><span class="kmin"><input class="inp num" type="text" inputmode="numeric" value={d.km ?? ''} onchange={(e) => setKm(e.currentTarget.value)} placeholder={t('e.g. 303')} aria-label={t('km of this trip')} /> km</span></label>
                    {/if}
                  </div>
                  {#if bike}<p class="tp-muted tp-small kmsrc">{trip.route?.km && d.km === Math.round(trip.route.km) ? t('km from the route.') : ''}</p>{/if}
                </div>
              </details>
              <!-- Noah 9a: every item counts as used; a tap on an item changes it: used → not used → broken. -->
              <details class="items-fold">
                <summary class="rv-row"><span class="rv-ic" aria-hidden="true"><Briefcase size={18} /></span><span class="rv-m"><span class="rv-t">{tn(used, '{n} item used', '{n} items used')}</span><span class="rv-s">{t('All items by bag, also broken')}</span></span><ChevronRight class="rv-chev" size={18} aria-hidden="true" /></summary>
                <div class="in">
                  <p class="tp-muted tp-small cyc">{t('used → not used → broken')}</p>
                  {#each groups as g (g.slot)}
                    <section class="bag" aria-label={t(g.name)}>
                      <h3>{t(g.name)} <span class="tp-muted">{tn(g.rows.length, '{n} item', '{n} items')}</span>
                        <span class="alls">
                          <button type="button" class="tp-link" onclick={() => markAll(g.rows, 'used')} aria-label={t('All used: {bag}', { bag: t(g.name) })}>{t('All used|short')}</button>
                          <button type="button" class="tp-link" onclick={() => markAll(g.rows, 'unused')} aria-label={t('None used: {bag}', { bag: t(g.name) })}>{t('None used|short')}</button>
                        </span></h3>
                      <ul class="exc">
                        {#each g.rows as { e, item } (e.itemId)}
                          {@const st = d.items[e.itemId] ?? 'used'}
                          <li><span class="nm">{nameOf(item)}{#if e.qty > 1}<small class="q">{' '}× {e.qty}</small>{/if}{#if before[e.itemId]}<small>{tn(before[e.itemId], 'not used on {n} trip before', 'not used on {n} trips before')}</small>{/if}</span>
                            <button type="button" class="state {st}" aria-label={t('{name}: {state}. Tap to change.', { name: nameOf(item), state: t(STATE[st]) })} onclick={() => cycle(e.itemId)}>{#if st === 'used'}<Check size={16} aria-hidden="true" />{:else if st === 'unused'}<Minus size={16} aria-hidden="true" />{:else}<X size={16} aria-hidden="true" />{/if}{t(STATE[st])}</button></li>
                        {/each}
                      </ul>
                    </section>
                  {/each}
                </div>
              </details>
              {#if isOn() && freeNotes.length && !draft}
                <!-- v0.77.0 (answer 3a): the helper's draft only on request -->
                <button type="button" class="rv-row kh-getdraft" disabled={draftBusy} onclick={getDraft}><span class="rv-ic" aria-hidden="true"><Sparkles size={18} /></span><span class="rv-m"><span class="rv-t">{draftBusy ? t('The helper is thinking …') : t('With the helper')}</span><span class="rv-s">{t('Get a draft, optional')}</span></span><ChevronRight class="rv-chev" size={18} aria-hidden="true" /></button>
              {/if}
            </div>
            {#if draftMsg}<p class="kh-msg" role="status">{draftMsg}</p>{/if}
          </section>
          <!-- «Mit Claude besprechen» (Noah 19.10.2026 «1a»): the notes of the way, only with the tick -->
          <div class="tall"><AskClaude name="debrief" ask={t('These are my notes from the trip «{trip}». Help me with a short look back and learnings for next time.', { trip: trip.title })} lines={[d?.note ?? '', ...freeNotes.map((n) => n.text)].filter(Boolean).slice(0, 40)} /></div>
          {#if draft}<DebriefDraft {draft} notes={freeNotes} days={trip.days ?? 1} onlearn={learnFromDraft} onsummary={summaryFromDraft} onclose={() => (draft = null)} />{/if}
        </div>
      </div>
      <!-- The tip of the day changes length every day; below the form, the chips stay on the first phone screen every day -->
      <TipLine page="debrief" name={t('Debrief')} />
      <!-- Paket Z «Aus jeder Tour lernen»: below the form, so «What did you not need?» stays the first thing on the page -->
      <LearnCard {trip} {bike} />
      <PageMore page="debrief" name={t('Debrief')} />
      {/if}
    </div>
  {/if}
{:else if SUBS.includes(param)}
  <!-- v0.49.0 R1 (Noah 4a): Dein Tempo, Logbuch and Gelernt are one level below the Rückblick, each
       its own page; v0.61.0 R2 rebuilt all three. -->
  <!-- v0.109.0 Design-Refresh P6 (T18–T20): the quiet path «‹ Touren › Rückblick › Gelernt» and the title -->
  {@const here = param === 'pace' ? t('Your pace') : param === 'logbook' ? t('Logbook') : t('Learned|review')}
  <div class="over rv-page">
    <nav class="crumb" aria-label={t('Path')}><a href="#/trips"><ChevronLeft size={14} aria-hidden="true" />{t('Trips|place')}</a><ChevronRight size={12} aria-hidden="true" /><a href="#/debrief">{t('Look back|page')}</a><ChevronRight size={12} aria-hidden="true" /><span aria-current="page">{here}</span></nav>
    <h1 class="title">{here}</h1>
    {#if param === 'pace'}
      <Pace />
    {:else if param === 'logbook'}
      <!-- v0.61.0 R2 (Noah ★a): a diary of all trips, newest first; filter by year and area. -->
      <Logbook />
    {:else}
      <!-- v0.61.0 R2 (Noah ★a): every learning flat by topic. -->
      <Learned />
    {/if}
  </div>
{:else}
  <!-- v0.49.0 R1 (Noah 4a): one page «Rückblick»: the last ride, the 12 months, trips compared. -->
  <Hub {spot} />
  <PageMore page="debrief" name={t('Look back|page')} />
  <PageTiles page="debrief" extrasHint />
{/if}

<style>
  .ahead-acts {
    display: grid;
    gap: 10px;
    max-width: 420px;
    margin-top: 14px;
  }
  .ahead-acts .btn {
    min-height: 48px;
    justify-content: center;
  }
  /* v0.109.0 Design-Refresh P6 (T15): the debrief in two columns, as in the mockup */
  .dbf {
    margin-top: 6px;
  }
  .bags {
    display: grid;
    gap: 4px;
  }
  .cbag + .cbag {
    padding-top: 10px;
    border-top: 1px solid var(--line);
  }
  .cbh {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 8px;
    margin: 0 0 6px;
  }
  .cbh b {
    flex: 1 1 auto;
    min-width: 0;
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding-bottom: 6px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 6px 14px;
    border: 1px solid transparent;
    border-radius: 999px;
    background: var(--ok-soft);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
    max-width: 100%;
    overflow-wrap: break-word;
    text-align: left;
  }
  .chip :global(svg) {
    flex: none;
    color: var(--ink-3);
  }
  .chip small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .chip.unused {
    background: var(--paper);
    border-color: var(--line-strong);
    color: var(--ink-3);
    text-decoration: line-through;
  }
  .chip.broken {
    background: var(--warn-soft);
    color: var(--ink);
  }
  .chip.broken small.br {
    color: var(--ink-2);
  }
  .tally {
    margin: 10px 0 0;
    padding: 10px 12px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .tally b {
    color: var(--ink);
  }
  .learn {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    padding: 2px 0 12px;
  }
  .learn .rv-m {
    flex: 1 1 14em;
  }
  .yn {
    display: flex;
    gap: 8px;
    margin-left: auto;
  }
  .yn .btn {
    min-height: 44px;
  }
  .yn .btn.yes {
    background: var(--hi);
    border-color: var(--hi);
    color: var(--hi-ink);
    font-weight: 600;
  }
  .remembered {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 10px;
    padding: 10px 12px;
    border-radius: var(--r-ctl);
    background: var(--ok-soft);
    color: var(--ink);
    font-size: var(--fs-small);
  }
  .sentence {
    display: grid;
    gap: 6px;
    margin-top: 14px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .moresugs {
    margin-top: 12px;
    border-top: 1px solid var(--line);
  }
  .moresugs .mh {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    padding: 12px 0 4px;
    font-weight: 500;
  }
  .moresugs .mh > span:first-child {
    flex: 1;
    min-width: 0;
  }
  details[open] > summary :global(.rv-chev) {
    transform: rotate(90deg);
  }
  .rv-box > details + details,
  .rv-box > details + .rv-row {
    border-top: 1px solid var(--line);
  }
  summary.rv-row {
    list-style: none;
    cursor: pointer;
  }
  summary.rv-row::-webkit-details-marker {
    display: none;
  }
  details > .in {
    padding: 0 0 14px;
  }
  button.rv-row:disabled {
    cursor: default;
    opacity: 0.6;
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
  .learn + .exc li:first-child {
    border-top: 1px solid var(--line);
  }
  .nm {
    flex: 1;
    min-width: 0;
    line-height: 1.25;
    overflow-wrap: break-word;
  }
  .nm small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
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
    font: 500 var(--fs-small) var(--font-body);
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
    background: var(--bad-soft);
    border-color: transparent;
    color: var(--bad);
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
  .qa label > span:first-child {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .qa small {
    color: var(--ink-3);
  }
  .segq {
    display: grid;
    gap: 4px;
    padding: 8px 0 6px;
  }
  .num {
    font-variant-numeric: tabular-nums;
  }
  .clothhint {
    margin: 2px 0 0;
  }
  .segq .lbl {
    margin: 0;
    font-weight: 500;
    color: var(--ink-3);
  }
  .cyc {
    margin: 0 0 4px;
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
  /* Diktat and «Mit Claude besprechen»: 44 px touch targets like the rest of the debrief */
  .tall {
    display: contents;
  }
  .tall :global(.btn.speak),
  .tall :global(.acl-go) {
    min-height: 44px;
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
    font-size: var(--fs-small);
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
  .bag {
    margin-top: 10px;
  }
  .bag h3 {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px 8px;
    margin: 0;
    font-size: var(--fs-body);
    font-weight: 600;
  }
  .bag h3 .tp-muted {
    font-weight: 400;
    font-size: var(--fs-small);
  }
  .alls {
    margin-left: auto;
    display: flex;
    gap: 14px;
  }
  /* v0.44.1 (AP21): "All ✓" and "All –" are 44 px wide targets, not only 44 px high */
  .alls .tp-link {
    min-width: 44px;
    min-height: 44px;
    justify-content: center;
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
    font-size: var(--fs-small);
  }
  .kh-msg {
    margin: 8px 2px 0;
  }
  .over .title {
    margin: 0 0 14px;
  }
  .over :global(.sec-head) {
    margin-top: 16px;
  }
  .crumb {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 2px;
    color: var(--ink);
    font-size: var(--fs-small);
  }
  .crumb a {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    min-width: 44px;
    color: var(--ink-3);
    text-decoration: none;
  }
  .crumb a:hover {
    color: var(--ink);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .crumb :global(svg) {
    color: var(--ink-3);
  }
  .muted {
    color: var(--ink-3);
  }
</style>
