<script>
  /**
   * Quick note (v0.19.3, Noah 4.10.2026, answers 1a-3a). Since v0.19.6 (answer 4a) it opens from
   * "New" in the top bar (phone: the + in the bottom bar); the Inbox count sits in the top bar. Write down a
   * problem or an idea in a few seconds, with a photo if you like; the app adds the date, the page,
   * the next trip and the bike. Sort it later on the Inbox page (#/inbox).
   */
  import { liveQuery } from 'dexie';
  import { db } from './db.js';
  import { newNote, guessBike, PAGE_NAMES, rideContext } from './notes.js';
  import { localDay } from './localday.js';
  import { autoKeep, leaveWindow } from './drafts.js';
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
  // v0.26.1 (AP20, Noah 19a): while a trip runs, the note belongs to that trip and its day (and
  // stays in the Inbox); the debrief shows it under "Notes on the way".
  const riding = $derived(rideContext($tripsQ ?? [], localDay()));
  const trip = $derived(($tripsQ ?? []).find((x) => x.id === riding?.tripId) ?? nextTrip($tripsQ ?? []));

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

  /*
   * v0.35.0 (AP29, Noah 4b + 5a): nothing typed is lost. The note is saved as soon as it has text
   * (or a photo) and every further key updates it; closing keeps it. "Discard" takes it back.
   */
  let autoId = $state(null);
  let autoAt = null;
  let ended = false;
  let autoTimer;
  let autoBusy = Promise.resolve();
  /** The note as it is now; its id and time are fixed by the first save. */
  function record() {
    autoId ??= `note-${Date.now().toString(36)}`;
    autoAt ??= new Date().toISOString();
    return newNote({ text: text.trim() || t('Photo'), photo: $state.snapshot(photo), page, tripId: trip?.id ?? null, bikeId: bike, day: riding?.day ?? null }, { id: autoId, now: autoAt });
  }
  const typed = () => autoKeep({ name: text.trim() || (photo ? 'photo' : '') });
  /** Saves r (default: the note now) after the saves before it. */
  function autoSave(r = null) {
    if (!r && (ended || !typed())) return autoBusy;
    const rec = r ?? record();
    autoBusy = autoBusy.then(() => db.notes.put(rec));
    return autoBusy;
  }
  $effect(() => {
    if (!open) return;
    void [text, photo, bikeId];
    if (!typed()) return;
    clearTimeout(autoTimer);
    autoTimer = setTimeout(() => autoSave(), 400);
    return () => clearTimeout(autoTimer);
  });
  const savedText = () => (riding ? t('Saved in the Inbox and on {trip}.', { trip: trip?.title ?? '' }) : t('Saved in the Inbox.'));
  function showSaved(text = savedText()) {
    saved = text;
    setTimeout(() => (saved = ''), 3000);
  }

  async function save(event) {
    event.preventDefault();
    if (!text.trim() && !photo) return (msg = t('Write a few words or add a photo.'));
    clearTimeout(autoTimer);
    const r = record();
    ended = true;
    await autoSave(r);
    showSaved();
    dialog.close();
  }
  async function discard() {
    ended = true;
    clearTimeout(autoTimer);
    const id = autoId;
    await autoBusy;
    if (id) await db.notes.delete(id);
    dialog.close();
  }

  // Closing (Escape, the Inbox link) keeps what was typed.
  function closed() {
    clearTimeout(autoTimer);
    if (!ended && leaveWindow('close', { made: !!autoId, typed: typed() }) === 'keep') {
      if (typed()) {
        const r = record();
        const note = savedText();
        autoSave(r).then(() => showSaved(note));
      } else {
        // everything erased again: the note made here goes too
        const id = autoId;
        autoBusy = autoBusy.then(() => db.notes.delete(id));
      }
    }
    ended = false;
    autoId = null;
    autoAt = null;
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
      {#if riding && trip}<span>{t('On the way: {title}, day {n}', { title: trip.title, n: riding.day + 1 })}</span>
      {:else if trip}<span>{t('Next trip: {title}', { title: trip.title })}</span>{/if}
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
      <button type="button" class="link" onclick={discard}>{autoId ? t('Discard') : t('Cancel')}</button>{#if autoId}<span class="kept" role="status">✓ {t('Saved')}</span>{/if}
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
  .kept {
    font-size: 13px;
    color: var(--ink-3);
  }
  @media print {
    .saved {
      display: none;
    }
  }
</style>
