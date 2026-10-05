<script>
  /**
   * Quick note (v0.19.3, Noah 4.10.2026, answers 1a-3a). Since v0.19.6 (answer 4a) it opens from
   * "New" in the top bar (phone: the + in the bottom bar); the Inbox count sits in the top bar. Write down a
   * problem or an idea in a few seconds, with a photo if you like; the app adds the date, the page,
   * the next trip and the bike. Sort it later on the Inbox page (#/inbox).
   */
  import { liveQuery } from 'dexie';
  import { db } from './db.js';
  import { newNote, guessBike, PAGE_NAMES } from './notes.js';
  import { nextTrip } from './debrief.js';
  import { sortBikes } from './bikes.js';
  import { shrinkImage } from './photo.js';

  let { page = 'home', open = $bindable(false), prefill = '' } = $props();

  const openQ = liveQuery(() => db.notes.where('status').equals('open').count());
  const tripsQ = liveQuery(() => db.trips.toArray());
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const bikes = $derived(sortBikes($bikesQ ?? []));
  const trip = $derived(nextTrip($tripsQ ?? []));

  let dialog = $state();
  let text = $state('');
  let photo = $state(null);
  let bikeId = $state(null); // null: the app's guess
  let reading = $state(false);
  let msg = $state('');
  let saved = $state('');
  const guess = $derived(guessBike(text, bikes, trip?.bikeId ?? null));
  const bike = $derived(bikeId ?? guess);

  $effect(() => {
    if (open && dialog && !dialog.open) {
      if (prefill) text = prefill;
      dialog.showModal();
    }
  });

  async function addPhoto(event) {
    const file = event.currentTarget.files[0];
    event.currentTarget.value = '';
    if (!file) return;
    reading = true;
    msg = '';
    try {
      photo = await shrinkImage(file, 1200, 0.8);
    } catch (err) {
      msg = err.message || 'This photo could not be read.';
    } finally {
      reading = false;
    }
  }

  async function save(event) {
    event.preventDefault();
    if (!text.trim() && !photo) return (msg = 'Write a few words or add a photo.');
    const id = `note-${Date.now().toString(36)}`;
    await db.notes.put(newNote({ text: text.trim() || 'Photo', photo, page, tripId: trip?.id ?? null, bikeId: bike }, { id, now: new Date().toISOString() }));
    saved = 'Saved in the Inbox.';
    setTimeout(() => (saved = ''), 3000);
    dialog.close();
  }

  function closed() {
    open = false;
    text = '';
    photo = null;
    bikeId = null;
    msg = '';
  }
</script>

{#if saved}<p class="saved" role="status">{saved} <a href="#/inbox">Open</a></p>{/if}

<dialog class="sheet" bind:this={dialog} onclose={closed} aria-labelledby="qn-h">
  <form onsubmit={save}>
    <h2 id="qn-h" class="title">Quick note</h2>
    <!-- svelte-ignore a11y_autofocus -->
    <textarea class="inp" bind:value={text} rows="4" placeholder="e.g. Rear brake squeaks on the Spark" aria-label="Note" autofocus></textarea>
    <div class="row">
      <label class="btn sm">{reading ? 'Reading…' : photo ? 'Other photo' : '+ Photo'}<input type="file" accept="image/*" onchange={addPhoto} hidden disabled={reading} /></label>
      {#if photo}<img class="th" src={photo} alt="Photo of the note" /><button type="button" class="link" onclick={() => (photo = null)}>Remove photo</button>{/if}
    </div>
    <p class="ctx">
      <span>{PAGE_NAMES[page] ?? page}</span>
      {#if trip}<span>Next trip: {trip.title}</span>{/if}
      <label>Bike
        <select class="sel mini" value={bike ?? ''} onchange={(e) => (bikeId = e.currentTarget.value || null)}>
          <option value="">none</option>
          {#each bikes as b (b.id)}<option value={b.id}>{b.name}</option>{/each}
        </select>
      </label>
    </p>
    {#if msg}<p class="err" role="alert">{msg}</p>{/if}
    <div class="foot">
      <button type="submit" class="btn hi">Save</button>
      <button type="button" class="link" onclick={() => dialog.close()}>Cancel</button>
      <a class="link inb" href="#/inbox" onclick={() => dialog.close()}>Inbox{$openQ ? ` (${$openQ})` : ''}</a>
    </div>
  </form>
</dialog>

<style>
  .saved {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: calc(96px + env(safe-area-inset-bottom));
    z-index: 21;
    margin: 0;
    background: var(--ink);
    color: var(--paper);
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 14px;
  }
  .saved a {
    color: var(--hi);
  }
  h2 {
    font-size: 26px;
    margin: 0 0 8px;
  }
  textarea {
    width: 100%;
    box-sizing: border-box;
    font: 16px/1.4 var(--font-body);
    resize: vertical;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 8px 0;
    flex-wrap: wrap;
  }
  .th {
    width: 56px;
    height: 56px;
    object-fit: cover;
    border-radius: 6px;
  }
  .ctx {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    align-items: center;
    font-size: 13px;
    color: var(--ink-3);
    margin: 4px 0 0;
  }
  .ctx label {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .err {
    color: #b42318;
    font-size: 14px;
    margin: 6px 0 0;
  }
  .foot {
    display: flex;
    gap: 12px;
    align-items: center;
    margin: 12px 0 4px;
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
  .inb {
    margin-left: auto;
  }
  @media print {
    .qn,
    .saved {
      display: none;
    }
  }
</style>
