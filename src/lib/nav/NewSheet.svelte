<script>
  import { lastBikeChoice } from '../lastchoice.js';
  import { backClose } from '../ui/backclose.js';
  import { localDay } from '../localday.js';
  /**
   * "New" (v0.19.6, start page answers 4a and 8a): every way to create something, in one place.
   * Desktop: the orange "New" in the top bar; phone: the + in the middle of the bottom bar.
   * v0.30.0 (Noah, finding 2): "Plan a trip" opens the "New trip" window straight away with the
   * standard set; the area, a template or a copy of the last trip are chosen in that window.
   * v0.125.0 A-J1 (mockup, Noah «aj-aj5 ok», answer 1a): «Workshop visit» opens the real visit window
   * (BikeQuickDialog 'visit', km and last workshop filled in), no note any more. After saving: the bike's
   * «Workshop & receipts» with «Workshop visit saved. · Undo».
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { sortBikes } from '../bikes.js';
  import { newTrip, addItem, quickRide } from '../nav.js';
  import { t, num } from '../i18n.svelte.js';
  import { parseKm } from '../care.js';
  import { setReading } from '../kmbookdb.js';
  import ProblemForm from './ProblemForm.svelte';
  import BikeQuickDialog from '../hubs/BikeQuickDialog.svelte';
  import { startBike } from '../problems.js';
  import { bikesHash } from '../bikes.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { Route, Bike, Activity, Backpack, Package, Plus, TriangleAlert, Receipt, StickyNote, X, ScanLine } from '@lucide/svelte';

  let { mode = $bindable(null), onnote } = $props();
  let visitOpen = $state(false);
  const lastBike = lastBikeChoice; // P3b 4a
  function visitSaved({ bikeId, id }) {
    location.hash = bikesHash({ tab: 'shop', bike: bikeId });
    offerDone(t('Workshop visit saved.'), id ? () => db.visits.delete(id) : null);
  }

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const bikes = $derived(sortBikes($bikesQ ?? []));

  let dialog = $state();
  $effect(() => {
    if (mode === 'visit') return void ((mode = null), (visitOpen = true)); // openNew('visit')
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
    <div>
      <h2 id="new-h" class="title">{mode === 'km' ? t('km for a bike') : mode === 'problem' ? t('Problem with a bike') : t('New')}</h2>
      {#if mode !== 'km' && mode !== 'problem'}<p class="lead">{t('What would you like to add?')}</p>{/if}
    </div>
    <button type="button" class="x" onclick={close} aria-label={t('Close')}><X size={20} aria-hidden="true" /></button>
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
    <!-- v0.101.0 Design-Refresh P2 (H7): the same 9 ways, in groups by area, «Plan a trip» on top -->
    <h3 class="ngrp">{t('Trips|place')}</h3>
    <ul class="opts">
      <li class="wide"><button type="button" class="opt hi" onclick={() => run(() => newTrip('standard'))}><span class="ic" aria-hidden="true"><Route size={20} /></span><span class="tx"><b>{t('Plan a trip')}</b><span>{t('Name, date, bike and packing list')}</span></span></button></li>
      <li><button type="button" class="opt" onclick={() => run(quickRide)}><span class="ic" aria-hidden="true"><Bike size={20} /></span><span class="tx"><b>{t('Quick start')}</b><span>{t('today, 2.5 h, the bike ridden last')}</span></span></button></li>
      <li><a class="opt" href="#/debrief/ride" onclick={close}><span class="ic" aria-hidden="true"><Activity size={20} /></span><span class="tx"><b>{t('Upload ride')}</b><span>{t('GPX: pauses, planned vs real, learnings')}</span></span></a></li>
      <li><a class="opt" href="#/pack/templates" onclick={close}><span class="ic" aria-hidden="true"><Backpack size={20} /></span><span class="tx"><b>{t('Template')}</b><span>{t('From the open trip, in Templates')}</span></span></a></li>
    </ul>
    <h3 class="ngrp">{t('Gear|place')}</h3>
    <ul class="opts">
      <li><button type="button" class="opt" onclick={() => run(addItem)}><span class="ic" aria-hidden="true"><Package size={20} /></span><span class="tx"><b>{t('Gear item')}</b><span>{t('Name, weight, bag')}</span></span></button></li>
    </ul>
    <h3 class="ngrp">{t('Bikes|place')}</h3>
    <ul class="opts">
      <!-- v0.125.0 A-J1: the visit first (the real window, no note), then the problem, then the km -->
      {#if bikes.length}<li><button type="button" class="opt" onclick={() => run(() => (visitOpen = true))}><span class="ic" aria-hidden="true"><Receipt size={20} /></span><span class="tx"><b>{t('Workshop visit')}</b><span>{t('Opens the visit, km already filled in')}</span></span></button></li>{/if}
      <!-- v0.45.2 (Noah on the bike): several problems with one bike at once, into Bike care -->
      {#if bikes.length}<li><button type="button" class="opt" onclick={() => (mode = 'problem')}><span class="ic" aria-hidden="true"><TriangleAlert size={20} /></span><span class="tx"><b>{t('Problem with a bike')}</b><span>{t('Air, saddle, battery: one per line')}</span></span></button></li>{/if}
      <li><button type="button" class="opt" onclick={() => (mode = 'km')}><span class="ic" aria-hidden="true"><Plus size={20} /></span><span class="tx"><b>{t('km for a bike')}</b><span>{t('What the counter says')}</span></span></button></li>
    </ul>
    <h3 class="ngrp">{t('Note|group')}</h3>
    <ul class="opts">
      <li><button type="button" class="opt" onclick={() => run(() => onnote(''))}><span class="ic" aria-hidden="true"><StickyNote size={20} /></span><span class="tx"><b>{t('Note + photo')}</b><span>{t('"What was missing", "This is broken"')}</span></span></button></li>
      <!-- Dokumente-PDF (Noah 15.10.2026): photograph a document, it becomes a PDF in Ich › Dokumente -->
      <li><a class="opt" href="#/me/docs/scan" onclick={close}><span class="ic" aria-hidden="true"><ScanLine size={20} /></span><span class="tx"><b>{t('Photograph document')}</b><span>{t('Becomes a PDF in «Imported PDFs»')}</span></span></a></li>
    </ul>
  {/if}
</dialog>
{#if visitOpen}
  <BikeQuickDialog kind="visit" {bikes} bikeId={startBike(bikes, { last: lastBike() })} cameraFirst onsaved={visitSaved} onclose={() => (visitOpen = false)} />
{/if}

<style>
  .new {
    width: min(760px, calc(100vw - 24px));
  }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 8px;
  }
  .top h2 {
    margin: 0;
  }
  .lead {
    margin: 2px 0 0;
    color: var(--ink-2);
  }
  .x {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--ink);
    cursor: pointer;
  }
  .x:hover {
    background: var(--paper-2);
  }
  /* v0.101.0 Design-Refresh P2 (H7): small group heads, the ways as cards with an icon */
  .ngrp {
    margin: 14px 0 6px;
    color: var(--ink-2);
    font: 600 var(--fs-tiny)/1.4 var(--font-body);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .opts {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  @media (min-width: 560px) {
    .opts {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .opts .wide {
      grid-column: 1 / -1;
    }
  }
  .opt {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    height: 100%;
    min-height: 64px;
    padding: 10px 14px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
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
    border-color: var(--ink-3);
    background: var(--paper-2);
  }
  .opt.hi {
    border-color: transparent;
    background: var(--hi-soft);
  }
  .ic {
    display: grid;
    flex: none;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .opt.hi .ic {
    background: var(--hi);
    color: var(--hi-ink);
  }
  .tx {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .tx b {
    font-weight: 600;
  }
  .tx span {
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
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
