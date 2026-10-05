<script>
  /**
   * "New" (v0.19.6, start page answers 4a and 8a): every way to create something, in one place.
   * Desktop: the orange "New" in the top bar; phone: the + in the middle of the bottom bar.
   * A packing list asks first how to start: from a template, a copy of the last trip, or the
   * standard set.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { sortBikes } from '../bikes.js';
  import { TEMPLATES_KEY } from '../templates.js';
  import { newTrip, addItem } from '../nav.js';
  import { t, tn, num } from '../i18n.svelte.js';

  let { mode = $bindable(null), onnote } = $props();

  const tplQ = liveQuery(() => db.settings.get(TEMPLATES_KEY));
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const templates = $derived($tplQ?.value ?? []);
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
    const n = Math.round(Number(String(km).replace(/['’,\s]/g, '')));
    if (!kmBike || !(n >= 0 && n <= 500000) || km === '') return (kmMsg = t('Type the km as a whole number, e.g. 12400.'));
    await db.bikes.update(kmBike.id, { km: n, kmDate: new Date().toISOString().slice(0, 10) });
    kmMsg = t('{bike}: {km} km saved.', { bike: kmBike.name, km: num(n) });
    km = '';
    setTimeout(close, 900);
  }
</script>

<dialog class="sheet new" bind:this={dialog} onclose={() => ((mode = null), (kmMsg = ''))} aria-labelledby="new-h">
  <div class="top">
    <h2 id="new-h" class="title">{mode === 'list' ? t('New packing list') : mode === 'km' ? t('km for a bike') : t('New')}</h2>
    <button type="button" class="btn sm" onclick={close}>{t('Close')}</button>
  </div>

  {#if mode === 'list'}
    <ul class="opts">
      {#each templates as tp (tp.id)}
        <li><button type="button" class="opt" onclick={() => run(() => newTrip(tp.id))}><b>{t('From template')}</b><span>{tp.name} · {tn(tp.entries?.length ?? 0, '{n} item', '{n} items')}</span></button></li>
      {/each}
      <li><button type="button" class="opt" onclick={() => run(() => newTrip('last'))}><b>{t('Copy the last trip')}</b><span>{t('The last trip on the bike you choose, with its bags and ready check')}</span></button></li>
      <li><button type="button" class="opt" onclick={() => run(() => newTrip('standard'))}><b>{t('Standard set')}</b><span>{t('Worn, standard pack and the items "On every trip"')}</span></button></li>
    </ul>
    <button type="button" class="link" onclick={() => (mode = 'all')}>{t('Something else to create')}</button>
  {:else if mode === 'km'}
    <form class="km" onsubmit={saveKm}>
      <label><span class="lbl">{t('Bike')}</span>
        <select class="sel" value={kmBike?.id ?? ''} onchange={(e) => (bikeId = e.currentTarget.value)}>
          {#each bikes as b (b.id)}<option value={b.id}>{b.name}{b.km != null ? ` · ${t('now {km} km', { km: num(b.km) })}` : ''}</option>{/each}
        </select>
      </label>
      <label><span class="lbl">{t('km on the counter')}</span>
        <!-- svelte-ignore a11y_autofocus -->
        <input class="inp num" type="text" inputmode="numeric" bind:value={km} placeholder={kmBike?.km != null ? String(kmBike.km) : t('e.g. 2400')} autofocus />
      </label>
      <button type="submit" class="btn hi">{t('Save km')}</button>
      {#if kmMsg}<p class="msg" role="status">{kmMsg}</p>{/if}
      <p class="small">{t('Or import your rides in Debrief: the km of a trip are added to its bike.')}</p>
    </form>
  {:else}
    <ul class="opts grid">
      <li><button type="button" class="opt hi" onclick={() => (mode = 'list')}><b>{t('Packing list')}</b><span>{t('Template, copy or standard set')}</span></button></li>
      <li><button type="button" class="opt" onclick={() => run(addItem)}><b>{t('Gear item')}</b><span>{t('Name, weight, bag')}</span></button></li>
      <li><button type="button" class="opt" onclick={() => run(() => onnote(''))}><b>{t('Quick note')}</b><span>{t('Text or photo, sorted later')}</span></button></li>
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
    font-size: 13px;
    color: var(--ink-3);
  }
</style>
