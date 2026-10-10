<script>
  import { backClose } from '../ui/backclose.js';
  import { localDay } from '../localday.js';
  /**
   * "New" (v0.19.6, start page answers 4a and 8a): every way to create something, in one place.
   * Desktop: the orange "New" in the top bar; phone: the + in the middle of the bottom bar.
   * v0.30.0 (Noah, finding 2): "Plan a trip" opens the "New trip" window straight away with the
   * standard set; the area, a template or a copy of the last trip are chosen in that window.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { sortBikes } from '../bikes.js';
  import { newTrip, addItem, dayRide } from '../nav.js';
  import { t, num } from '../i18n.svelte.js';
  import { parseKm } from '../care.js';
  import { setReading } from '../kmbookdb.js';
  import ProblemForm from './ProblemForm.svelte';

  let { mode = $bindable(null), onnote } = $props();

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const bikes = $derived(sortBikes($bikesQ ?? []));

  let dialog = $state();
  $effect(() => {
    if (mode && dialog && !dialog.open) dialog.showModal();
    if (!mode && dialog?.open) dialog.close();
  });
  const close = () => (mode = null);
  const run = (fn) => {
    close();
    fn();
  };

  // km for a bike
  let bikeId = $state('');
  let km = $state('');
  let kmMsg = $state('');
  const kmBike = $derived(bikes.find((b) => b.id === bikeId) ?? bikes[0] ?? null);
  async function saveKm(event) {
    event.preventDefault();
    const n = parseKm(km); // v0.30.1 (D1): "2'287", "2.287", "2 287"
    if (!kmBike || n == null || Number.isNaN(n)) return (kmMsg = t('Type the km as a whole number, e.g. 12400.'));
    await setReading(db, kmBike.id, n, { date: localDay() }); // v0.68.0: a new entry in the ride ledger, nothing overwritten
    kmMsg = t('{bike}: {km} km saved.', { bike: kmBike.name, km: num(n) });
    km = '';
    setTimeout(close, 900);
  }
</script>

<dialog class="sheet new" bind:this={dialog} use:backClose onclose={() => ((mode = null), (kmMsg = ''))} aria-labelledby="new-h">
  <div class="top">
    <h2 id="new-h" class="title">{mode === 'km' ? t('km for a bike') : mode === 'problem' ? t('Problem with a bike') : t('New')}</h2>
    <button type="button" class="btn sm" onclick={close}>{t('Close')}</button>
  </div>

  {#if mode === 'problem'}
    <ProblemForm {bikes} ondone={close} />
  {:else if mode === 'km'}
    <form class="km" onsubmit={saveKm}>
      <label><span class="lbl">{t('Bike')}</span>
        <select class="sel" value={kmBike?.id ?? ''} onchange={(e) => (bikeId = e.currentTarget.value)}>
          {#each bikes as b (b.id)}<option value={b.id}>{b.name}{b.km != null ? ` · ${t('now {km} km', { km: num(b.km) })}` : ''}</option>{/each}
        </select>
      </label>
      <label><span class="lbl">{t('km on the counter')}</span>
        <!-- svelte-ignore a11y_autofocus -->
        <input class="inp num" type="text" inputmode="decimal" enterkeyhint="done" bind:value={km} placeholder={kmBike?.km != null ? String(kmBike.km) : t('e.g. 2400')} autofocus />
      </label>
      <button type="submit" class="btn hi">{t('Save km')}</button>
      {#if kmMsg}<p class="msg" role="status">{kmMsg}</p>{/if}
      <p class="small">{t('Or import your rides in Debrief: the km of a trip are added to its bike.')}</p>
    </form>
  {:else}
    <ul class="opts grid">
      <li><button type="button" class="opt hi" onclick={() => run(() => newTrip('standard'))}><b>{t('Plan a trip')}</b><span>{t('Name, date, bike and packing list')}</span></button></li>
      <!-- v0.45.2 (Noah on the bike): several problems with one bike at once, into Bike care -->
      {#if bikes.length}<li><button type="button" class="opt" onclick={() => (mode = 'problem')}><b>{t('Problem with a bike')}</b><span>{t('Air, saddle, battery: one per line')}</span></button></li>{/if}
      <!-- v0.38.0 (Noah 8a, E): the day ride and "Note + photo" here too; Plan a trip stays the one orange row. -->
      <li><button type="button" class="opt" onclick={() => run(dayRide)}><b>{t('Day ride now')}</b><span>{t('One tap, with Undo')}</span></button></li>
      <li><button type="button" class="opt" onclick={() => run(addItem)}><b>{t('Gear item')}</b><span>{t('Name, weight, bag')}</span></button></li>
      <li><button type="button" class="opt" onclick={() => run(() => onnote(''))}><b>{t('Note + photo')}</b><span>{t('"What was missing", "This is broken"')}</span></button></li>
      <!-- v0.41.0 (Noah 1): a recorded ride (GPX): pauses, planned vs real, learnings -->
      <li><a class="opt" href="#/debrief/ride" onclick={close}><b>{t('Upload ride')}</b><span>{t('GPX: pauses, planned vs real, learnings')}</span></a></li>
      <li><button type="button" class="opt" onclick={() => (mode = 'km')}><b>{t('km for a bike')}</b><span>{t('What the counter says')}</span></button></li>
      <li><button type="button" class="opt" onclick={() => run(() => onnote(t('Workshop receipt: ')))}><b>{t('Workshop visit')}</b><span>{t('Photo of the receipt into the Inbox')}</span></button></li>
      <li><a class="opt" href="#/pack/templates" onclick={close}><b>{t('Template')}</b><span>{t('From the open trip, in Templates')}</span></a></li>
    </ul>
  {/if}
</dialog>

<style>
  .new {
    width: min(640px, calc(100vw - 24px));
  }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }
  .top h2 {
    margin: 0;
  }
  .opts {
    list-style: none;
    margin: 0 0 10px;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  @media (min-width: 560px) {
    .opts.grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .opt {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 100%;
    min-height: 56px;
    padding: 10px 14px;
    border: 2px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
    box-sizing: border-box;
  }
  .opt:hover,
  .opt:focus-visible {
    border-color: var(--ink);
  }
  .opt.hi {
    border-color: var(--hi);
  }
  .opt span {
    color: var(--ink-3);
    font-size: 14px;
  }
  .km {
    display: grid;
    gap: 12px;
  }
  .km label {
    display: grid;
    gap: 4px;
  }
  .km .btn {
    justify-self: start;
  }
  .msg {
    margin: 0;
    color: var(--ink);
    font-weight: 600;
  }
  .small {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
</style>
