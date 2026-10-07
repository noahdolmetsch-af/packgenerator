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
  import { t } from './i18n.svelte.js';

  // v0.25.1 (Noah 3a): prefillBike = "Note on a bike" from Today, the bike already chosen.
  let { page = 'home', open = $bindable(false), prefill = '', prefillBike = null } = $props();

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
      if (prefillBike) bikeId = prefillBike;
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
      msg = err.message || t('This photo could not be read.');
    } finally {
      reading = false;
    }
  }

  async function save(event) {
    event.preventDefault();
    if (!text.trim() && !photo) return (msg = t('Write a few words or add a photo.'));
    const id = `note-${Date.now().toString(36)}`;
    await db.notes.put(newNote({ text: text.trim() || t('Photo'), photo, page, tripId: trip?.id ?? null, bikeId: bike }, { id, now: new Date().toISOString() }));
    saved = t('Saved in the Inbox.');
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

{#if saved}<p class="saved" role="status">{saved} <a href="#/inbox">{t('Open')}</a></p>{/if}

<dialog class="sheet" bind:this={dialog} onclose={closed} aria-labelledby="qn-h">
  <form onsubmit={save}>
    <h2 id="qn-h" class="title">{t('Quick note')}</h2>
    <!-- svelte-ignore a11y_autofocus -->
    <textarea class="inp" bind:value={text} rows="4" placeholder={t('e.g. Rear brake squeaks on the Spark')} aria-label={t('Note')} autofocus></textarea>
    <div class="row">
      <label class="btn sm">{reading ? t('Reading…') : photo ? t('Other photo') : `+ ${t('Photo')}`}<input type="file" accept="image/*" onchange={addPhoto} hidden disabled={reading} /></label>
      {#if photo}<img class="th" src={photo} alt={t('Photo of the note')} /><button type="button" class="link" onclick={() => (photo = null)}>{t('Remove photo')}</button>{/if}
    </div>
    <p class="ctx">
      <span>{PAGE_NAMES[page] ? t(PAGE_NAMES[page]) : page}</span>
      {#if trip}<span>{t('Next trip: {title}', { title: trip.title })}</span>{/if}
      <label>{t('Bike')}
        <select class="sel mini" value={bike ?? ''} onchange={(e) => (bikeId = e.currentTarget.value || null)}>
          <option value="">{t('none')}</option>
          {#each bikes as b (b.id)}<option value={b.id}>{b.name}</option>{/each}
        </select>
      </label>
    </p>
    {#if msg}<p class="err" role="alert">{msg}</p>{/if}
    <div class="foot">
      <button type="submit" class="btn hi">{t('Save')}</button>
      <button type="button" class="link" onclick={() => dialog.close()}>{t('Cancel')}</button>
      <a class="link inb" href="#/inbox" onclick={() => dialog.close()}>{t('Inbox')}{$openQ ? ` (${$openQ})` : ''}</a>
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
    font-size: var(--fs-section);
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
    font-size: var(--fs-small);
    color: var(--ink-3);
    margin: 4px 0 0;
  }
  .ctx label {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .err {
    color: var(--bad);
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
    .saved {
      display: none;
    }
  }
</style>
