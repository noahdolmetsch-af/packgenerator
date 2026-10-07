<script>
  /**
   * v0.25.1 (Noah 2b, 3a): the small dialogs behind the Bikes tile on Today.
   * - 'problem': what is wrong with a bike (+ photo) → an open repair in Bike care, written exactly as
   *   the Inbox does when a note is sorted as "Repair" (notes.js newNote + sortNote): the note stays
   *   in "All notes" as sorted, the repair lands in db.maintenance.
   * - 'idea': "Was geil wäre", the bike's own idea list (bike.ideas, hubs.js).
   * - 'visit': a workshop visit typed in by hand (date, shop, km, cost, receipt photo) → db.visits.
   */
  import { db } from '../db.js';
  import { newNote, sortNote, nextNumber } from '../notes.js';
  import { addIdea, newVisit, parseChf } from '../hubs.js';
  import { shrinkImage } from '../photo.js';
  import { t } from '../i18n.svelte.js';

  let { kind, bikes = [], bikeId = null, tripId = null, onclose, onsaved } = $props();

  let dialog;
  // svelte-ignore state_referenced_locally
  let bike = $state(bikeId ?? bikes[0]?.id ?? '');
  let text = $state('');
  let photo = $state(null);
  let reading = $state(false);
  let msg = $state('');
  let busy = $state(false);
  const today = new Date().toLocaleDateString('sv-SE');
  let date = $state(today);
  let shop = $state('');
  let km = $state('');
  let chf = $state('');

  const TITLE = { problem: 'Log a problem', idea: 'Idea for a bike', visit: 'Log a workshop visit' };
  const bikeName = (id) => bikes.find((b) => b.id === id)?.name ?? '';

  $effect(() => {
    dialog.showModal();
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

  async function saveProblem() {
    if (!text.trim() && !photo) return t('Write a few words or add a photo.');
    const now = new Date().toISOString();
    const note = newNote({ text: text.trim() || t('Photo'), photo, page: 'home', tripId, bikeId: bike }, { id: `note-${Date.now().toString(36)}`, now });
    await db.transaction('rw', db.notes, db.maintenance, async () => {
      const ids = { task: nextNumber(await db.maintenance.toArray()) };
      const out = sortNote(note, 'repair', { bikeId: bike, ids, now, bikeName: bikeName(bike) });
      await db.maintenance.put(out.repair);
      await db.notes.put(out.note);
    });
    return null;
  }

  async function saveIdea() {
    if (!text.trim()) return t('Write a few words.');
    await db.transaction('rw', db.bikes, async () => {
      const b = await db.bikes.get(bike);
      if (!b) throw new Error(t('This bike is gone.'));
      await db.bikes.update(bike, { ideas: addIdea(b.ideas ?? [], text, { id: `idea-${Date.now().toString(36)}` }) });
    });
    return null;
  }

  async function saveVisit() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return t('Choose the date of the visit.');
    if (!shop.trim()) return t('Name the bike shop.');
    const kmN = km.trim() === '' ? null : Math.round(Number(km.replace(/['’,\s]/g, '')));
    if (kmN !== null && !(kmN >= 0 && kmN <= 500000)) return t('Type the km as a whole number, e.g. 8200.');
    const cost = parseChf(chf);
    if (Number.isNaN(cost)) return t('Type the cost in CHF, e.g. 120.50.');
    await db.visits.put(newVisit({ bikeId: bike, date, shop, km: kmN, chf: cost, photo }, { id: `visit-${Date.now().toString(36)}` }));
    return null;
  }

  async function save(event) {
    event.preventDefault();
    if (!bike) return (msg = t('Choose a bike.'));
    busy = true;
    try {
      const err = await (kind === 'problem' ? saveProblem() : kind === 'idea' ? saveIdea() : saveVisit());
      if (err) return (msg = err);
      onsaved?.({ kind, bikeId: bike });
      dialog.close();
    } catch (err) {
      msg = err.message || t('This could not be saved.');
    } finally {
      busy = false;
    }
  }
</script>

<dialog class="sheet" bind:this={dialog} onclose={onclose} aria-labelledby="bq-h">
  <form onsubmit={save}>
    <h2 id="bq-h" class="title">{t(TITLE[kind])}</h2>
    {#if kind === 'idea'}<p class="hint">{t('What would be great: your own list of ideas for this bike, not the Gear wishlist.')}</p>{/if}
    <label class="field">
      <span class="lbl">{t('Bike')}</span>
      <select class="sel" bind:value={bike}>
        {#each bikes as b (b.id)}<option value={b.id}>{b.name}</option>{/each}
      </select>
    </label>

    {#if kind === 'visit'}
      <div class="grid">
        <label class="field"><span class="lbl">{t('Date')}</span><input class="inp" type="date" bind:value={date} max={today} /></label>
        <label class="field"><span class="lbl">{t('Bike shop')}</span><input class="inp" type="text" bind:value={shop} autocomplete="off" /></label>
        <label class="field"><span class="lbl">{t('km at the visit')}</span><input class="inp num" type="text" inputmode="numeric" bind:value={km} placeholder={t('not known')} /></label>
        <label class="field"><span class="lbl">{t('Cost CHF (optional)')}</span><input class="inp num" type="text" inputmode="decimal" bind:value={chf} placeholder={t('not known')} /></label>
      </div>
    {:else}
      <label class="field">
        <span class="lbl">{kind === 'problem' ? t('What is wrong?') : t('What would be great?')}</span>
        <!-- svelte-ignore a11y_autofocus -->
        <textarea class="inp" bind:value={text} rows="3" placeholder={kind === 'problem' ? t('e.g. Rear brake squeaks') : t('e.g. Dropper post, lighter wheels')} autofocus></textarea>
      </label>
    {/if}

    {#if kind !== 'idea'}
      <div class="row">
        <label class="btn sm">{reading ? t('Reading…') : photo ? t('Other photo') : kind === 'visit' ? `+ ${t('Photo of the receipt')}` : `+ ${t('Photo')}`}<input type="file" accept="image/*" onchange={addPhoto} hidden disabled={reading} /></label>
        {#if photo}<img class="th" src={photo} alt={kind === 'visit' ? t('Photo of the receipt') : t('Photo of the problem')} /><button type="button" class="link" onclick={() => (photo = null)}>{t('Remove photo')}</button>{/if}
      </div>
    {/if}
    {#if kind === 'problem'}<p class="hint">{t('Lands in Bike care as an open repair.')}</p>{/if}
    {#if msg}<p class="err" role="alert">{msg}</p>{/if}
    <div class="foot">
      <button type="submit" class="btn hi" disabled={busy || reading}>{t('Save')}</button>
      <button type="button" class="link" onclick={() => dialog.close()}>{t('Cancel')}</button>
    </div>
  </form>
</dialog>

<style>
  h2 {
    font-size: var(--fs-section);
    margin: 0 0 8px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 8px 0;
    min-width: 0;
  }
  .lbl {
    font: 600 var(--fs-small)/1.3 var(--font-body);
    color: var(--ink-3);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0 12px;
  }
  .grid .inp {
    width: 100%;
    box-sizing: border-box;
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
  .hint {
    margin: 4px 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
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
</style>
