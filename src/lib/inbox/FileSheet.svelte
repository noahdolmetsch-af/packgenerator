<script>
  /**
   * v0.48.0 «Ablegen als …» (Noah 6a, 7a): one sheet per entry. First the 7 targets (the app's
   * suggestion on top, marked), then one short form for the chosen target with ONE main button named
   * by where the entry lands. A receipt asks for bike, shop, date and amount (the work is optional)
   * and becomes a workshop visit with the photo. «Anderes Ziel wählen» goes back to the list.
   */
  import { TARGETS, TARGET, guessTarget, shopsOf, receiptName, TOPICS, guessTopic } from '../inbox.js';
  import { fileTo } from '../inboxdb.js';
  import { guessBike } from '../notes.js';
  import { parseChf } from '../hubs.js';
  import { CATEGORIES, parseGrams } from '../gear.js';
  import { localDay } from '../localday.js';
  import { t } from '../i18n.svelte.js';
  import { ICONS } from './icons.js';
  import { ReceiptText, ChevronRight, ChevronLeft, Check, X } from '@lucide/svelte';

  let { note, bikes = [], trips = [], visits = [], onclose, onfiled } = $props();

  /** Where each target lands, one line (German in de/pflege.js). */
  const LANDS = {
    receipt: 'Workshop visit with photo',
    problem: 'Open work in the care of the bike',
    material: 'New item in Gear',
    wish: 'Gear › Wishlist',
    idea: 'Bike › What would be great',
    tour: 'Into the debrief of a trip',
    keep: 'Becomes a note in «Notes», topic to choose',
  };
  /** The main button of each form, named by where the entry lands (U1). */
  const SAVE = { receipt: 'File as workshop visit', problem: 'Into bike care', material: 'Into Gear', wish: 'Onto the wishlist', idea: 'Save as idea', tour: 'Into the debrief', keep: 'Keep as note' };
  /** Jobs a receipt often lists (optional). */
  const JOBS = [
    { part: 'chain', action: 'replace', name: 'Chain replaced' },
    { part: 'cassette', action: 'replace', name: 'Cassette replaced' },
    { part: 'padsF', action: 'replace', name: 'Front pads replaced' },
    { part: 'padsR', action: 'replace', name: 'Rear pads replaced' },
    { part: 'tyres', action: 'replace', name: 'Tyres replaced' },
    { part: 'brakeR', action: 'service', name: 'Brakes bled' },
    { part: 'fork', action: 'service', name: 'Fork serviced' },
  ];

  let dialog;
  // svelte-ignore state_referenced_locally
  const suggest = guessTarget(note);
  let kind = $state(null);
  // svelte-ignore state_referenced_locally
  let bike = $state(guessBike(note.text ?? '', bikes, note.bikeId ?? null) ?? bikes[0]?.id ?? null);
  const today = localDay();
  let shop = $state('');
  let newShop = $state(false);
  let date = $state(today);
  let chf = $state('');
  let jobs = $state([]);
  // svelte-ignore state_referenced_locally
  let name = $state(note.text ?? '');
  let category = $state('tools');
  let grams = $state('');
  // svelte-ignore state_referenced_locally
  let trip = $state(note.tripId ?? null);
  // svelte-ignore state_referenced_locally
  let topic = $state(guessTopic(note.text ?? ''));
  let msg = $state('');
  let busy = $state(false);

  const shops = $derived(shopsOf(visits));
  const tripList = $derived([...trips].filter((x) => !x.skipped).sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? '')).slice(0, 8));
  $effect(() => {
    if (!trip && tripList[0]) trip = tripList[0].id;
  });
  $effect(() => {
    if (!shop && shops[0]) shop = shops[0].shop;
  });
  const order = [TARGET[suggest], ...TARGETS.filter((x) => x.key !== suggest)];

  $effect(() => {
    dialog.showModal();
  });

  const toggleJob = (j) => (jobs = jobs.some((x) => x.part === j.part) ? jobs.filter((x) => x.part !== j.part) : [...jobs, j]);

  async function save() {
    msg = '';
    const b = bikes.find((x) => x.id === bike) ?? null;
    let opts = {};
    if (kind === 'receipt') {
      if (!b) return (msg = t('Choose a bike.'));
      if (!shop.trim()) return (msg = t('Name the bike shop.'));
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return (msg = t('Choose the date of the visit.'));
      const c = parseChf(chf);
      if (Number.isNaN(c)) return (msg = t('Type the cost in CHF, e.g. 120.50.'));
      opts = { bike: b, shop: shop.trim(), date, chf: c, jobs: jobs.map((j) => ({ part: j.part, action: j.action })) };
    } else if (kind === 'problem' || kind === 'idea') {
      if (!b) return (msg = t('Choose a bike.'));
      opts = { bike: b };
    } else if (kind === 'material' || kind === 'wish') {
      if (!name.trim()) return (msg = t('Give it a name.'));
      const g = grams.trim() ? parseGrams(grams) : null;
      if (grams.trim() && g == null) return (msg = t('Grams: a whole number, e.g. 250.'));
      opts = { name: name.trim(), category, grams: g };
    } else if (kind === 'tour') {
      const tr = trips.find((x) => x.id === trip);
      if (!tr) return (msg = t('There is no trip to put this note on.'));
      opts = { trip: tr };
    } else opts = { topic };
    busy = true;
    try {
      const stored = await fileTo($state.snapshot(note), kind, opts);
      onfiled?.(stored);
      dialog.close();
    } catch (err) {
      msg = t(err.message) || t('This note could not be sorted.');
    } finally {
      busy = false;
    }
  }
  const short = (s) => (s.length > 70 ? `${s.slice(0, 69)}…` : s);
</script>

<dialog class="sheet fsheet" bind:this={dialog} onclose={onclose} aria-labelledby="file-h">
  <div class="top">
    <h2 id="file-h" class="title">{kind ? t(TARGET[kind].name) : t('File as …')}</h2>
    <button type="button" class="x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <div class="what">
    {#if note.photo}<img src={note.photo} alt={t('Photo of the entry')} />{/if}
    <p>{short(note.text ?? '')}</p>
  </div>

  {#if !kind}
    <ul class="rowlist targets" aria-label={t('Targets')}>
      {#each order as x (x.key)}
        {@const Icon = ICONS[x.key]}
        <li class:sug={x.key === suggest}>
          <button type="button" class="lrow" data-target={x.key} onclick={() => (kind = x.key)}>
            <span class="ic tg-{x.key}"><Icon size={18} aria-hidden="true" /></span>
            <span class="m"><span class="t">{t(x.name)}</span><span class="s">{t(LANDS[x.key])}</span></span>
            {#if x.key === suggest}<span class="pill act">{t('Suggestion')}</span>{/if}
            <ChevronRight class="chev" size={18} aria-hidden="true" />
          </button>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="lands">{t(LANDS[kind])}</p>
    {#if ['receipt', 'problem', 'idea'].includes(kind)}
      <p class="lbl">{t('Bike')}</p>
      <div class="chips" role="group" aria-label={t('Bike')}>
        {#each bikes as b (b.id)}<button type="button" class="chip" aria-pressed={bike === b.id} onclick={() => (bike = b.id)}>{#if bike === b.id}<Check size={14} aria-hidden="true" />{/if}{b.name}</button>{/each}
      </div>
    {/if}

    {#if kind === 'receipt'}
      <p class="lbl">{t('Bike shop')}{#if shops.length}<span class="q"> · {t('from earlier visits')}</span>{/if}</p>
      <div class="chips" role="group" aria-label={t('Bike shop')}>
        {#each shops as s (s.shop)}<button type="button" class="chip" aria-pressed={!newShop && shop === s.shop} onclick={() => ((shop = s.shop), (newShop = false))}>{#if !newShop && shop === s.shop}<Check size={14} aria-hidden="true" />{/if}{s.shop}<small>{s.n}×</small></button>{/each}
        <button type="button" class="chip" aria-pressed={newShop || !shops.length} onclick={() => ((newShop = true), (shop = ''))}>+ {t('New shop')}</button>
      </div>
      {#if newShop || !shops.length}<label class="fld"><span class="sr">{t('Bike shop')}</span><input class="inp" type="text" bind:value={shop} placeholder={t('Name of the shop')} autocomplete="off" /></label>{/if}
      <div class="two">
        <label class="fld"><span class="lbl">{t('Date')}</span><input class="inp" type="date" bind:value={date} max={today} /></label>
        <label class="fld"><span class="lbl">{t('Amount CHF')}</span><input class="inp num" type="text" inputmode="decimal" bind:value={chf} placeholder={t('not known')} /></label>
      </div>
      <p class="lbl">{t('What was done?')} <span class="q">{t('optional')}</span></p>
      <div class="chips" role="group" aria-label={t('What was done?')}>
        {#each JOBS as j (j.part)}{@const on = jobs.some((x) => x.part === j.part)}<button type="button" class="chip" aria-pressed={on} onclick={() => toggleJob(j)}>{#if on}<Check size={14} aria-hidden="true" />{/if}{t(j.name)}</button>{/each}
      </div>
      <p class="name"><ReceiptText size={16} aria-hidden="true" /><span>{t('Name')}: {t('Receipt|target')} {receiptName(shop, date)}</span></p>
    {:else if kind === 'material' || kind === 'wish'}
      <label class="fld"><span class="lbl">{t('Name')}</span><input class="inp" type="text" bind:value={name} autocomplete="off" /></label>
      <div class="two">
        {#if kind === 'material'}
          <label class="fld"><span class="lbl">{t('Category')}</span><select class="sel" bind:value={category}>{#each CATEGORIES as c (c.key)}<option value={c.key}>{t(c.name)}</option>{/each}</select></label>
        {/if}
        <label class="fld"><span class="lbl">{t('Weight g')} <span class="q">{t('optional')}</span></span><input class="inp num" type="text" inputmode="numeric" bind:value={grams} /></label>
      </div>
    {:else if kind === 'tour'}
      {#if tripList.length}
        <label class="fld"><span class="lbl">{t('Trip')}</span><select class="sel" bind:value={trip}>{#each tripList as tr (tr.id)}<option value={tr.id}>{tr.title}</option>{/each}</select></label>
      {:else}
        <p class="q">{t('There is no trip to put this note on.')}</p>
      {/if}
    {:else if kind === 'keep'}
      <p class="lbl">{t('Topic')}</p>
      <div class="chips" role="group" aria-label={t('Topic')}>
        {#each TOPICS as x (x.key)}<button type="button" class="chip" aria-pressed={topic === x.key} onclick={() => (topic = x.key)}>{#if topic === x.key}<Check size={14} aria-hidden="true" />{/if}{t(x.name)}</button>{/each}
      </div>
    {/if}

    {#if msg}<p class="err" role="alert">{msg}</p>{/if}
    <button type="button" class="btn hi wide" disabled={busy} onclick={save}>{t(SAVE[kind])}</button>
    <button type="button" class="lnk" onclick={() => ((kind = null), (msg = ''))}><ChevronLeft size={16} aria-hidden="true" />{t('Choose another target')}</button>
  {/if}
</dialog>

<style>
  .fsheet {
    padding: 16px;
  }
  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .top .title {
    margin: 0;
    font-size: var(--fs-section);
  }
  .x {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 10px;
    background: var(--paper-2);
    color: var(--ink-2);
    cursor: pointer;
  }
  .what {
    display: flex;
    gap: 12px;
    align-items: center;
    margin: 10px 0 12px;
  }
  .what img {
    width: 56px;
    height: 72px;
    object-fit: cover;
    border-radius: 6px;
    border: 1px solid var(--line);
    flex: none;
  }
  .what p {
    margin: 0;
    color: var(--ink-2);
    overflow-wrap: break-word;
    min-width: 0;
  }
  .targets .sug {
    background: var(--hi-soft);
  }
  .targets .ic {
    background: var(--paper-2);
  }
  .tg-receipt,
  .tg-problem {
    color: var(--hi);
  }
  .tg-material,
  .tg-tour {
    color: var(--accent);
  }
  .lands {
    margin: 0 0 10px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .q {
    font-weight: 400;
    color: var(--ink-3);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 12px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 6px 12px;
    border: 1.5px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    font: 500 var(--fs-body) var(--font-body);
    color: var(--ink);
    cursor: pointer;
  }
  .chip small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .chip[aria-pressed='true'] {
    border-color: var(--hi);
    background: var(--hi-soft);
  }
  .fld {
    display: block;
    margin: 0 0 10px;
    min-width: 0;
  }
  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .name {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 12px;
    padding: 8px 12px;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .name span {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .wide {
    width: 100%;
    min-height: 44px;
  }
  .lnk {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: 100%;
    min-height: 44px;
    margin-top: 4px;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: inherit;
    cursor: pointer;
  }
  .err {
    color: var(--bad);
  }
</style>
