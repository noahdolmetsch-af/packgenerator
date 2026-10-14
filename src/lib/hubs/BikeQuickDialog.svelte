<script>
  /**
   * v0.25.1 (Noah 2b, 3a): the small dialogs behind the Bikes tile on Today.
   * - 'problem': what is wrong with a bike (+ photo) → an open repair in Bike care, written exactly as
   *   the Inbox does when a note is sorted as "Repair" (notes.js newNote + sortNote): the note stays
   *   in "All notes" as sorted, the repair lands in db.maintenance.
   * - 'idea': "Was geil wäre", the bike's own idea list (bike.ideas, hubs.js).
   * - 'visit': a workshop visit typed in by hand (date, shop, km, cost, receipt photo) → db.visits.
   *   v0.125.0 A-J1 (mockup, Noah «aj-aj5 ok», 1a): also the window of «New › Workshop visit». The km
   *   (km book) and the last workshop are filled in, on a green field with where they come from; one
   *   tap on a known shop or a job chip («What was done?», optional) fills the rest. All can be changed.
   */
  import DateInput from '../ui/DateInput.svelte';
  import { db } from '../db.js';
  import '../bikes/velo-dlg.css';
  import { newNote, sortNote, nextNumber } from '../notes.js';
  import { addIdea, newVisit, parseChf } from '../hubs.js';
  import { shrinkImage } from '../photo.js';
  import { liveQuery } from 'dexie';
  import { localDay } from '../localday.js';
  import { visitPrefill } from '../visitprefill.js';
  import { VISIT_JOBS } from '../inbox.js';
  import Btn from '../ui/Btn.svelte';
  import { explain } from '../ui/explain.js';
  import { t, dateOf } from '../i18n.svelte.js';
  import '../ui/daumen.css'; // FE1: Save stays at the bottom edge of the window on a phone
  import { weiter } from '../daumen.js'; // FE16: «Weiter» to the next field, the number keyboard

  let { kind, bikes = [], bikeId = null, tripId = null, onclose, onsaved } = $props();

  let dialog;
  // svelte-ignore state_referenced_locally
  let bike = $state(bikeId ?? bikes[0]?.id ?? '');
  let text = $state('');
  let photo = $state(null);
  let reading = $state(false);
  let msg = $state('');
  let busy = $state(false);
  const today = localDay();
  let date = $state(today);
  let shop = $state('');
  let km = $state('');
  let chf = $state('');
  let jobs = $state([]);
  // A-J1: what the window suggests (km book, last visit); a field typed in by hand keeps its value.
  // svelte-ignore state_referenced_locally
  const kmQ = kind === 'visit' ? liveQuery(() => db.kmBook.toArray()) : null;
  // svelte-ignore state_referenced_locally
  const visitsQ = kind === 'visit' ? liveQuery(() => db.visits.toArray()) : null;
  const pre = $derived(kind === 'visit' ? visitPrefill({ bike: bikes.find((b) => b.id === bike) ?? null, date, today, entries: $kmQ ?? [], visits: $visitsQ ?? [] }) : null);
  let kmOwn = $state(false);
  let shopOwn = $state(false);
  $effect(() => {
    if (pre && !kmOwn) km = pre.km != null ? String(pre.km) : '';
  });
  $effect(() => {
    if (pre && !shopOwn) shop = pre.shop;
  });
  const kmPre = $derived(!!pre && !kmOwn && pre.km != null && km === String(pre.km));
  const shopPre = $derived(!!pre && !shopOwn && !!pre.shop && shop === pre.shop);
  const toggleJob = (j) => (jobs = jobs.some((x) => x.part === j.part) ? jobs.filter((x) => x.part !== j.part) : [...jobs, j]);

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
    const id = `visit-${Date.now().toString(36)}`;
    const parts = jobs.map((j) => ({ part: j.part, action: j.action, what: '' }));
    await db.visits.put({ ...newVisit({ bikeId: bike, date, shop, km: kmN, chf: cost, photo }, { id }), parts });
    savedId = id;
    return null;
  }

  let savedId = null;
  async function save(event) {
    event.preventDefault();
    if (!bike) return (msg = t('Choose a bike.'));
    busy = true;
    try {
      const err = await (kind === 'problem' ? saveProblem() : kind === 'idea' ? saveIdea() : saveVisit());
      if (err) return (msg = err);
      onsaved?.({ kind, bikeId: bike, id: savedId });
      dialog.close();
    } catch (err) {
      msg = err.message || t('This could not be saved.');
    } finally {
      busy = false;
    }
  }
</script>

<dialog class="sheet" bind:this={dialog} onclose={onclose} aria-labelledby="bq-h">
  <form onsubmit={save} use:weiter>
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
        <label class="field"><span class="lbl">{t('Date')}</span><DateInput bind:value={date} max={today} /></label>
        <div class="field">
          <label class="field in"><span class="lbl">{t('km at the visit')}</span><input class="inp num" class:pre={kmPre} type="text" inputmode="numeric" bind:value={km} oninput={() => (kmOwn = true)} placeholder={t('not known')} aria-describedby={kmPre ? 'bq-kmfrom' : undefined} /></label>
          {#if kmPre}<small class="prefrom" id="bq-kmfrom">{pre.kmFrom === 'book' ? t('from the km book · you can change it') : t("from the bike's counter · you can change it")}</small>{/if}
        </div>
      </div>
      <div class="field">
        <label class="field in"><span class="lbl">{t('Bike shop')}</span><input class="inp" class:pre={shopPre} type="text" bind:value={shop} oninput={() => (shopOwn = true)} autocomplete="off" placeholder={t('Name of the shop')} aria-describedby={shopPre ? 'bq-shopfrom' : undefined} /></label>
        {#if shopPre}<small class="prefrom" id="bq-shopfrom">{t('from your last visit on {date} · you can change it', { date: dateOf(pre.shopDate) })}</small>{/if}
        {#if pre?.shops.length > 1}
          <div class="vd-chips chips" role="group" aria-label={t('Known bike shops')}>
            {#each pre.shops as s (s.shop)}<button type="button" class="vd-chip" aria-pressed={shop === s.shop} onclick={() => ((shop = s.shop), (shopOwn = true))}>{s.shop}{#if s.last}<small class="n">{t('(last)')}</small>{/if}</button>{/each}
          </div>
        {/if}
      </div>
      <p class="lbl">{t('What was done?')} <span class="q">{t('optional')}</span></p>
      <div class="vd-chips chips" role="group" aria-label={t('What was done?')}>
        {#each VISIT_JOBS as j (j.part)}<button type="button" class="vd-chip" aria-pressed={jobs.some((x) => x.part === j.part)} onclick={() => toggleJob(j)}>{t(j.name)}</button>{/each}
      </div>
      <label class="field"><span class="lbl">{t('Cost CHF (optional)')}</span><input class="inp num cost" type="text" inputmode="decimal" bind:value={chf} placeholder={t('not known')} /></label>
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
    <div class="foot daumen-foot">
      <Btn type="submit" kind="hi" label={t('Save')} explain={explain('Save')} disabled={busy || reading} />
      <Btn kind="quiet" label={t('Cancel')} explain={explain('Cancel')} onclick={() => dialog.close()} />
    </div>
  </form>
</dialog>

<style>
  /* A-J1: the green field with its origin (.inp.pre, .prefrom) is the shared rule in app.css since v0.127.0 A-U5 */
  .field.in {
    margin: 0;
  }
  .cost {
    max-width: 220px;
  }
  .q {
    font-weight: 400;
    color: var(--ink-3);
  }
  p.lbl {
    margin: 10px 0 4px;
  }
  .vd-chips {
    margin-top: 4px;
  }
  .n {
    margin-left: 6px;
    opacity: 0.75;
    font-size: var(--fs-tiny);
  }
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
