<script>
  /**
   * Inbox (v0.19.3, answers 4b, 5b): the quick notes from every page. Each open note gets the
   * place the app guesses as its first button; the others are behind •••. A sorted note writes a
   * repair (Bike care), a wishlist item (Gear), a learning, or a note in the trip's debrief, and
   * stays in "All notes" with where it went.
   * v0.47.1 (Noah): one list, newest first (open and sorted notes together, by when they were written);
   * a sorted note is a row that opens what it became (the repair in Bike care, the wish in Gear, …).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { KINDS, PAGE_NAMES, guessKind, guessBike, sortNote, nextNumber } from '../lib/notes.js';
  import { sortBikes } from '../lib/bikes.js';
  import { nextId } from '../lib/gear.js';
  import { addRideNote } from '../lib/ride.js';
  import Lightbox from '../lib/ui/Lightbox.svelte';
  import { t, tn, locale } from '../lib/i18n.svelte.js';
  import { flip } from 'svelte/animate';
  import { Check, Undo2, ChevronRight } from '@lucide/svelte';

  let { onnew } = $props();

  const notesQ = liveQuery(() => db.notes.toArray());
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const tripsQ = liveQuery(() => db.trips.toArray());
  const tasksQ = liveQuery(() => db.maintenance.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());

  const notes = $derived([...($notesQ ?? [])].sort((a, b) => b.at.localeCompare(a.at)));
  const open = $derived(notes.filter((n) => n.status === 'open'));
  const bikes = $derived(sortBikes($bikesQ ?? []));
  const bikeName = (id) => bikes.find((b) => b.id === id)?.name ?? '';
  const trips = $derived([...($tripsQ ?? [])].sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? '')));
  const tripTitle = (id) => trips.find((tr) => tr.id === id)?.title ?? '';
  const KIND = Object.fromEntries(KINDS.map((k) => [k.key, k]));

  // Per note what the user changed: { [noteId]: { bikeId, tripId } }; else the app's guess.
  let pick = $state({});
  const bikeOf = (n) => pick[n.id]?.bikeId ?? guessBike(n.text, bikes, n.bikeId);
  const tripOf = (n) => pick[n.id]?.tripId ?? n.tripId ?? trips[0]?.id ?? null;
  // v0.40.0 (Noah 5a): a bike or trip chosen under ••• stays with the note (and shows as a badge).
  function setPick(n, key, value) {
    pick = { ...pick, [n.id]: { ...pick[n.id], [key]: value || null } };
    db.notes.update(n.id, { [key]: value || null });
  }

  let msg = $state('');
  let assigning = $state(null); // the note whose bike and trip are open (••• → Bike or trip)
  let shown = $state(null); // photo src

  // v0.47.0 (Noah: "a to-do list empties itself"): a sorted note leaves the list at once with a short
  // calm exit, the next note moves up and gets the focus, and a toast offers Undo (everything the
  // note wrote is taken back, the note is open again at its place).
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MOVE = reduced ? 0 : 150;
  let last = $state.raw(null); // { text, back: async fn }
  let timer;
  $effect(() => () => clearTimeout(timer));
  async function undoLast() {
    const back = last?.back;
    clearTimeout(timer);
    last = null;
    if (back) await back();
  }
  function focusAfter(id) {
    const list = open.map((n) => n.id);
    const at = list.indexOf(id);
    const next = list[at + 1] ?? list[at - 1] ?? null;
    setTimeout(() => (next ? document.querySelector(`[data-note-id="${next}"] .acts > .btn`) : document.getElementById('inbox-done'))?.focus(), MOVE + 120);
  }
  async function file(note, kind) {
    msg = '';
    const before = { note: $state.snapshot(note), debrief: null, made: [] };
    const bikeId = bikeOf(note);
    const tripId = tripOf(note);
    if (kind === 'trip' && !tripId) return (msg = t('There is no trip to put this note on.'));
    try {
      await db.transaction('rw', db.notes, db.maintenance, db.items, db.learnings, db.debriefs, db.trips, async () => {
      const ids = {
        task: nextNumber(await db.maintenance.toArray()),
        item: nextId(await db.items.toArray(), 'lux'),
        learning: nextNumber(await db.learnings.toArray()),
      };
      const out = sortNote(note, kind, { bikeId, tripId, ids, now: new Date().toISOString(), bikeName: bikeName(bikeId) });
      if (out.repair) await db.maintenance.put(out.repair);
      if (out.item) await db.items.put(out.item);
      if (out.learning) await db.learnings.put(out.learning);
      before.made = [out.repair && ['maintenance', out.repair.id], out.item && ['items', out.item.id], out.learning && ['learnings', out.learning.id]].filter(Boolean);
      if (out.tripNote) {
        const trip = await db.trips.get(tripId);
        if (!trip) throw new Error(t('This trip is gone.'));
        const debrief = await db.debriefs.get(tripId);
        before.debrief = { tripId, rec: debrief ?? null };
        await db.debriefs.put(addRideNote(debrief ?? null, trip, note.text, note.day ?? 0, note.at)); // v0.26.1: keeps the day of a note on the way
      }
      await db.notes.put(out.note);
    });
    } catch (err) {
      msg = err.message || t('This note could not be sorted.');
      return;
    }
    focusAfter(note.id);
    clearTimeout(timer);
    last = {
      text: t('{text} → {where}', { text: note.text.length > 40 ? `${note.text.slice(0, 40)}…` : note.text, where: t(KIND[kind].name) }),
      back: () =>
        db.transaction('rw', db.notes, db.maintenance, db.items, db.learnings, db.debriefs, async () => {
          for (const [table, id] of before.made) await db.table(table).delete(id);
          if (before.debrief) before.debrief.rec ? await db.debriefs.put(before.debrief.rec) : await db.debriefs.delete(before.debrief.tripId);
          await db.notes.put(before.note);
        }),
    };
    timer = setTimeout(() => (last = null), 10000);
  }
  const remove = (n) => confirm(t('Delete the note "{text}"?', { text: n.text.slice(0, 40) })) && db.notes.delete(n.id);
  const reopen = (n) => db.notes.update(n.id, { status: 'open', to: null, sortedAt: null });

  const when = (iso) => new Date(iso).toLocaleString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  // The stored label is English (data); show it in the current language.
  const labelOf = (to) => (to?.kind === 'repair' && to.label?.startsWith('Repair') ? t('Repair') + to.label.slice(6) : to?.label ? t(to.label) : '');
  // v0.47.1 (Noah): where a sorted note lives now; null when it went nowhere (Done) or is gone.
  const enc = encodeURIComponent;
  function target(n) {
    const to = n.to;
    if (!to) return null;
    if (to.kind === 'repair') {
      const rec = ($tasksQ ?? []).find((x) => x.id === to.ref);
      if (!rec) return null;
      return rec.bikeId ? `#/bikes?tab=care&bike=${enc(rec.bikeId)}&open=1` : '#/bikes?tab=care';
    }
    if (to.kind === 'wish') return ($itemsQ ?? []).some((i) => i.id === to.ref) ? `#/gear?item=${enc(to.ref)}` : null;
    if (to.kind === 'learning') return '#/debrief/learnings';
    if (to.kind === 'trip') return trips.some((tr) => tr.id === to.ref) ? `#/debrief/${enc(to.ref)}` : null;
    return null;
  }
</script>

<div class="inbox">
  <!-- v0.40.0 (Noah 5a, 7a): one line under the title instead of the explanation; "+ Quick note"
       is light (orange stays on the + at the bottom). -->
  <header class="head">
    <div>
      <h1 class="title">{t('Inbox')}</h1>
      {#if $notesQ && open.length}<p class="page-sub">{tn(open.length, '{n} to sort', '{n} to sort')}</p>{/if}
    </div>
    <button type="button" class="btn" onclick={onnew}>+ {t('Quick note')}</button>
  </header>
  {#if msg}<p class="err" role="alert">{msg}</p>{/if}

  {#if $notesQ && !notes.length}
    <p class="card empty">{t('No notes yet. Tap + at the bottom right on any page when something comes up.')}</p>
  {/if}

  {#if $notesQ && !open.length && notes.length}
    <p class="card alldone" id="inbox-done" tabindex="-1"><Check size={18} aria-hidden="true" /><span>{t('All notes are sorted.')}</span><button type="button" class="btn sm" onclick={onnew}>+ {t('Quick note')}</button></p>
  {/if}

  {#if notes.length}
    <!-- v0.40.0 (Noah 5a): one light button per open note, the app's guess; the other places, bike or trip
         and Delete behind •••. A bike or trip that is set shows as a small neutral badge.
         v0.47.1 (Noah): open and sorted notes in one list, newest first. -->
    <ul class="rowlist list" aria-label={t('Notes, newest first')}>
      {#each notes as n (n.id)}
        <li class:note={n.status === 'open'} class:sorted={n.status !== 'open'} data-note-id={n.id} animate:flip={{ duration: MOVE }}>
          {#if n.status === 'open'}
            {@const kind = guessKind(n)}
            {@const others = KINDS.filter((k) => k.key !== kind)}
            {@const bk = pick[n.id]?.bikeId !== undefined ? pick[n.id].bikeId : n.bikeId}
            {@const tr = pick[n.id]?.tripId !== undefined ? pick[n.id].tripId : n.tripId}
            <div class="lrow">
              {#if n.photo}<button type="button" class="th" onclick={() => (shown = n.photo)} aria-label={t('Open photo')}><img src={n.photo} alt="" /></button>{/if}
              <div class="m">
                <span class="t">{n.text}</span>
                <span class="s">{when(n.at)}{PAGE_NAMES[n.page] && n.page !== 'inbox' ? ` · ${t(PAGE_NAMES[n.page])}` : ''}{n.day != null ? ` · ${t('Day {n}', { n: n.day + 1 })}` : ''}{#if bk}{' '}<i class="nbadge">{t('Bike: {name}', { name: bikeName(bk) })}</i>{/if}{#if tr}{' '}<i class="nbadge">{t('Trip: {name}', { name: tripTitle(tr) })}</i>{/if}</span>
              </div>
              <span class="row-acts acts">
                <button type="button" class="btn sm" onclick={() => file(n, kind)}>{t(KIND[kind].name)}</button>
                <details class="more">
                  <summary aria-label={t('More for this note: other places, bike or trip, delete')}>•••</summary>
                  <div class="more-in">
                    {#each others as k (k.key)}<button type="button" class="btn sm" onclick={(ev) => ((ev.currentTarget.closest('details').open = false), file(n, k.key))}>{t(k.name)}</button>{/each}
                    <button type="button" class="btn sm" aria-expanded={assigning === n.id} onclick={(ev) => ((ev.currentTarget.closest('details').open = false), (assigning = assigning === n.id ? null : n.id))}>{t('Bike or trip')}</button>
                    <button type="button" class="btn sm" onclick={() => remove(n)}>{t('Delete')}</button>
                  </div>
                </details>
              </span>
            </div>
            {#if assigning === n.id}
              <div class="ctx" role="group" aria-label={t('Bike or trip for this note')}>
                <label>{t('Bike')}
                  <select class="sel mini" value={bikeOf(n) ?? ''} onchange={(e) => setPick(n, 'bikeId', e.currentTarget.value)}>
                    <option value="">{t('none')}</option>
                    {#each bikes as b (b.id)}<option value={b.id}>{b.name}</option>{/each}
                  </select>
                </label>
                <label>{t('Trip')}
                  <select class="sel mini" value={tripOf(n) ?? ''} onchange={(e) => setPick(n, 'tripId', e.currentTarget.value)}>
                    <option value="">{t('none')}</option>
                    {#each trips as tr2 (tr2.id)}<option value={tr2.id}>{tr2.title}</option>{/each}
                  </select>
                </label>
                <button type="button" class="btn sm" onclick={() => (assigning = null)}>{t('Done')}</button>
              </div>
            {/if}
          {:else}
            {@const href = target(n)}
            {@const sub = `${when(n.at)} · ${labelOf(n.to)}${n.to?.kind === 'trip' && n.to.ref ? ` · ${tripTitle(n.to.ref)}` : ''}`}
            {#if href}
              <a class="lrow" {href}><span class="m"><span class="t">{n.text}</span><span class="s">{sub}</span></span><ChevronRight class="chev" size={18} aria-hidden="true" /></a>
            {:else}
              <div class="lrow"><span class="m"><span class="t">{n.text}</span><span class="s">{sub}</span></span>
                {#if n.to?.kind === 'done'}<span class="r"><button type="button" class="link" onclick={() => reopen(n)}>{t('Back to inbox')}</button></span>{/if}
              </div>
            {/if}
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

{#if last}
  <div class="toast" role="status">
    <Check size={18} aria-hidden="true" /><span>{last.text}</span>
    <button type="button" class="btn sm" onclick={undoLast}><Undo2 size={16} aria-hidden="true" />{t('Undo')}</button>
  </div>
{/if}

{#if shown}
  <Lightbox list={[{ src: shown, name: t('Quick note'), sub: '' }]} start={0} onclose={() => (shown = null)} />
{/if}

<style>
  .alldone {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    color: var(--ink-2);
  }
  .alldone :global(svg) {
    color: var(--accent);
  }
  .alldone span {
    flex: 1;
  }
  .toast {
    position: fixed;
    left: 50%;
    bottom: calc(16px + env(safe-area-inset-bottom));
    transform: translateX(-50%);
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 10px;
    width: min(520px, calc(100vw - 32px));
    padding: 6px 8px 6px 14px;
    border-radius: 12px;
    background: var(--ink);
    color: var(--paper);
    box-shadow: 0 8px 24px var(--shadow);
  }
  .toast span {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .toast .btn {
    flex: none;
    background: none;
    border-color: transparent;
    color: var(--paper);
    text-decoration: underline;
  }
  @media (max-width: 719px) {
    .toast {
      bottom: calc(84px + env(safe-area-inset-bottom));
    }
  }
  .inbox {
    max-width: 880px;
    margin: 0 auto;
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .err {
    color: var(--bad);
  }
  .note .lrow {
    flex-wrap: wrap;
  }
  .note .m {
    flex: 1 1 180px;
  }
  .th {
    flex: none;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .th img {
    display: block;
    width: 52px;
    height: 52px;
    object-fit: cover;
    border-radius: 6px;
  }
  .acts {
    flex: none;
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
  }
  .more {
    position: relative;
  }
  .more summary {
    list-style: none;
    display: grid;
    place-items: center;
    min-width: 44px;
    min-height: 44px;
    border-radius: 8px;
    color: var(--ink-2);
    font-weight: 700;
    letter-spacing: 1px;
    cursor: pointer;
  }
  .more summary:hover {
    background: var(--paper-2);
  }
  .more summary::-webkit-details-marker {
    display: none;
  }
  /* The menu opens to the left, so it never leaves a phone screen. */
  .more-in {
    position: absolute;
    z-index: 3;
    top: calc(100% + 4px);
    right: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    background: var(--paper);
    border: 1.5px solid var(--ink);
    border-radius: 8px;
    width: max-content;
    max-width: calc(100vw - 48px);
  }
  .ctx {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 14px;
    padding: 0 12px 12px;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .ctx label {
    display: flex;
    gap: 6px;
    align-items: center;
    min-width: 0;
  }
  .ctx .sel {
    max-width: 200px;
  }
  /* The list scrolls the open ••• menu into view instead of cutting it off. */
  .list {
    overflow: visible;
  }
  /* v0.47.1 (Noah): a sorted note stays in its place, quieter, and opens what it became. */
  .sorted .t {
    font-weight: 400;
    color: var(--ink-2);
  }
  .sorted :global(.chev) {
    flex: none;
    color: var(--ink-3);
  }
  .r {
    flex: none;
    display: flex;
    gap: 12px;
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
    min-height: 44px;
    display: inline-flex;
    align-items: center;
  }
  .empty {
    color: var(--ink-3);
  }
</style>
