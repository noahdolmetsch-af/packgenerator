<script>
  /**
   * Inbox (v0.19.3, answers 4b, 5b): the quick notes from every page. Each open note gets the
   * place the app guesses as its first button; the others are behind •••. A sorted note writes a
   * repair (Bike care), a wishlist item (Gear), a learning, or a note in the trip's debrief, and
   * stays in "All notes" with where it went.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { KINDS, PAGE_NAMES, guessKind, guessBike, sortNote, nextNumber } from '../lib/notes.js';
  import { sortBikes } from '../lib/bikes.js';
  import { nextId } from '../lib/gear.js';
  import { addRideNote } from '../lib/ride.js';
  import Lightbox from '../lib/ui/Lightbox.svelte';

  let { onnew } = $props();

  const notesQ = liveQuery(() => db.notes.toArray());
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const tripsQ = liveQuery(() => db.trips.toArray());

  const notes = $derived([...($notesQ ?? [])].sort((a, b) => b.at.localeCompare(a.at)));
  const open = $derived(notes.filter((n) => n.status === 'open'));
  const sorted = $derived(notes.filter((n) => n.status !== 'open'));
  const bikes = $derived(sortBikes($bikesQ ?? []));
  const bikeName = (id) => bikes.find((b) => b.id === id)?.name ?? '';
  const trips = $derived([...($tripsQ ?? [])].sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? '')));
  const tripTitle = (id) => trips.find((t) => t.id === id)?.title ?? '';
  const KIND = Object.fromEntries(KINDS.map((k) => [k.key, k]));

  // Per note what the user changed: { [noteId]: { bikeId, tripId } }; else the app's guess.
  let pick = $state({});
  const bikeOf = (n) => pick[n.id]?.bikeId ?? guessBike(n.text, bikes, n.bikeId);
  const tripOf = (n) => pick[n.id]?.tripId ?? n.tripId ?? trips[0]?.id ?? null;
  const setPick = (n, key, value) => (pick = { ...pick, [n.id]: { ...pick[n.id], [key]: value || null } });

  let msg = $state('');
  let shown = $state(null); // photo src

  async function file(note, kind) {
    msg = '';
    const bikeId = bikeOf(note);
    const tripId = tripOf(note);
    if (kind === 'trip' && !tripId) return (msg = 'There is no trip to put this note on.');
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
      if (out.tripNote) {
        const trip = await db.trips.get(tripId);
        if (!trip) throw new Error('This trip is gone.');
        const debrief = await db.debriefs.get(tripId);
        await db.debriefs.put(addRideNote(debrief ?? null, trip, note.text, 0, note.at));
      }
      await db.notes.put(out.note);
    });
    } catch (err) {
      msg = err.message || 'This note could not be sorted.';
    }
  }
  const remove = (n) => confirm(`Delete the note "${n.text.slice(0, 40)}"?`) && db.notes.delete(n.id);
  const reopen = (n) => db.notes.update(n.id, { status: 'open', to: null, sortedAt: null });

  const when = (iso) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const LINK = { repair: '#/care', wish: '#/gear', learning: '#/debrief', trip: '#/debrief' };
</script>

<div class="inbox">
  <header class="head">
    <h1 class="title">Inbox</h1>
    <button type="button" class="btn hi" onclick={onnew}>+ Quick note</button>
  </header>
  <p class="intro">Notes from the + button on every page. Put each one where it belongs.</p>
  {#if msg}<p class="err" role="alert">{msg}</p>{/if}

  {#if !open.length}
    <p class="card empty">{notes.length ? 'All notes are sorted.' : 'No notes yet. Tap + at the bottom right on any page when something comes up.'}</p>
  {/if}

  <ul class="list">
    {#each open as n (n.id)}
      {@const kind = guessKind(n)}
      {@const others = KINDS.filter((k) => k.key !== kind)}
      <li class="note">
        <div class="body">
          {#if n.photo}<button type="button" class="th" onclick={() => (shown = n.photo)} aria-label="Open photo"><img src={n.photo} alt="" /></button>{/if}
          <div class="txt">
            <p class="t">{n.text}</p>
            <p class="meta">{when(n.at)} · {PAGE_NAMES[n.page] ?? n.page}{n.tripId ? ` · ${tripTitle(n.tripId)}` : ''}</p>
          </div>
        </div>
        <div class="ctx">
          <label>Bike
            <select class="sel mini" value={bikeOf(n) ?? ''} onchange={(e) => setPick(n, 'bikeId', e.currentTarget.value)}>
              <option value="">none</option>
              {#each bikes as b (b.id)}<option value={b.id}>{b.name}</option>{/each}
            </select>
          </label>
          <label>Trip
            <select class="sel mini" value={tripOf(n) ?? ''} onchange={(e) => setPick(n, 'tripId', e.currentTarget.value)}>
              <option value="">none</option>
              {#each trips as t (t.id)}<option value={t.id}>{t.title}</option>{/each}
            </select>
          </label>
        </div>
        <div class="acts">
          <button type="button" class="btn sm hi" onclick={() => file(n, kind)}>{KIND[kind].name}</button>
          <details class="more">
            <summary aria-label="Other places for this note">•••</summary>
            <div class="more-in">
              {#each others as k (k.key)}<button type="button" class="btn sm" onclick={(ev) => ((ev.currentTarget.closest('details').open = false), file(n, k.key))}>{k.name}</button>{/each}
              <button type="button" class="btn sm" onclick={() => remove(n)}>Delete</button>
            </div>
          </details>
          <small class="where">→ {KIND[kind].where}</small>
        </div>
      </li>
    {/each}
  </ul>

  {#if sorted.length}
    <details class="all">
      <summary><span class="title">All notes</span> <small>{sorted.length}</small></summary>
      <ul class="done">
        {#each sorted as n (n.id)}
          <li>
            <span class="txt"><b>{n.text}</b><small>{when(n.at)} · {n.to?.label ?? ''}{n.to?.kind === 'trip' && n.to.ref ? ` · ${tripTitle(n.to.ref)}` : ''}</small></span>
            <span class="r">
              {#if LINK[n.to?.kind]}<a class="link" href={LINK[n.to.kind]}>Open</a>{/if}
              {#if n.to?.kind === 'done'}<button type="button" class="link" onclick={() => reopen(n)}>Back to inbox</button>{/if}
            </span>
          </li>
        {/each}
      </ul>
    </details>
  {/if}
</div>

{#if shown}
  <Lightbox list={[{ src: shown, name: 'Quick note', sub: '' }]} start={0} onclose={() => (shown = null)} />
{/if}

<style>
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .intro {
    color: var(--ink-3);
    margin: 4px 0 12px;
  }
  .err {
    color: #b42318;
  }
  .list,
  .done {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .note {
    border: 1.5px solid var(--line);
    border-radius: 8px;
    background: var(--paper);
    padding: 10px 12px;
    margin-bottom: 10px;
  }
  .body {
    display: flex;
    gap: 10px;
  }
  .th {
    flex: none;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .th img {
    width: 64px;
    height: 64px;
    object-fit: cover;
    border-radius: 6px;
  }
  .txt {
    min-width: 0;
  }
  .t {
    margin: 0;
    font-size: 16px;
    overflow-wrap: anywhere;
  }
  .meta {
    margin: 2px 0 0;
    font-size: 13px;
    color: var(--ink-3);
  }
  .ctx {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
    margin: 8px 0;
    font-size: 13px;
    color: var(--ink-3);
  }
  .ctx label {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .ctx .sel {
    max-width: 180px;
  }
  .acts {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .where {
    color: var(--ink-3);
    font-size: 13px;
  }
  .more {
    position: relative;
  }
  .more summary {
    list-style: none;
    cursor: pointer;
    padding: 4px 10px;
    border: 1.5px solid var(--line);
    border-radius: 6px;
    font-weight: 700;
  }
  .more summary::-webkit-details-marker {
    display: none;
  }
  .more-in {
    position: absolute;
    z-index: 3;
    top: calc(100% + 4px);
    left: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    background: var(--paper);
    border: 1.5px solid var(--ink);
    border-radius: 8px;
    min-width: 190px;
  }
  .all {
    margin-top: 18px;
  }
  .all summary {
    cursor: pointer;
  }
  .all .title {
    font-size: 20px;
  }
  .done li {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
    font-size: 14px;
  }
  .done .txt {
    display: flex;
    flex-direction: column;
  }
  .done small {
    color: var(--ink-3);
    font-size: 13px;
  }
  .r {
    flex: none;
    display: flex;
    gap: 10px;
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
  .empty {
    color: var(--ink-3);
  }
</style>
