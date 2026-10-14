<script>
  /**
   * v0.48.0 «Ablegen als …» (Noah 6a, 7a): one sheet per entry. First the 7 targets (the app's
   * suggestion on top, marked), then one short form for the chosen target with ONE main button named
   * by where the entry lands. A receipt asks for bike, shop, date and amount (the work is optional)
   * and becomes a workshop visit with the photo. «Anderes Ziel wählen» goes back to the list.
   */
  import DateInput from '../ui/DateInput.svelte';
  import { TARGETS, TARGET, guessTarget, shopsOf, receiptName, TOPICS, guessTopic } from '../inbox.js';
  import { fileTo } from '../inboxdb.js';
  import { guessBike } from '../notes.js';
  import { parseChf } from '../hubs.js';
  import { choosable, parseGrams } from '../gear.js';
  import { localDay } from '../localday.js';
  import { t, locale } from '../i18n.svelte.js';
  import { ICONS } from './icons.js';
  import { ReceiptText, Check, X } from '@lucide/svelte';
  import '../bikes/velo-dlg.css';

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
  // Design-Refresh P9 (I4): the suggestion is chosen from the start; one tap on another tile changes it.
  let kind = $state(suggest);
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
  const when = (iso) => new Date(iso).toLocaleString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
</script>

<!-- Design-Refresh P9 (I4, Noah 12.10.2026 «Runde 19 freigegeben»): the window look of the new style: the
     entry under the title, the 7 targets as tiles (the suggestion first, marked and chosen), the fields of
     the chosen target right below, the main button bottom right, named by where the entry lands. -->
<dialog class="sheet fsheet vdlg" bind:this={dialog} onclose={onclose} aria-labelledby="file-h">
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="file-h" class="title">{t('File as …')}</h2>
      <p class="vd-sub">{short(note.text ?? '')}{#if note.at} · {when(note.at)}{/if}</p>
    </div>
    {#if note.photo}<img class="ph" src={note.photo} alt={t('Photo of the entry')} />{/if}
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  <ul class="targets" aria-label={t('Targets')}>
    {#each order as x (x.key)}
      {@const Icon = ICONS[x.key]}
      <li class:sug={x.key === suggest}>
        <button type="button" class="tile" data-target={x.key} aria-pressed={kind === x.key} onclick={() => ((kind = x.key), (msg = ''))}>
          <Icon size={18} aria-hidden="true" />
          <b>{t(x.name)}</b>
          {#if x.key === suggest}<small>{t('Suggestion')}</small>{/if}
        </button>
      </li>
    {/each}
  </ul>

  {#if kind}
    <p class="lands">{t(LANDS[kind])}</p>
    {#if ['receipt', 'problem', 'idea'].includes(kind)}
      <p class="lbl">{t('Bike')}</p>
      <div class="vd-chips chips" role="group" aria-label={t('Bike')}>
        {#each bikes as b (b.id)}<button type="button" class="vd-chip" aria-pressed={bike === b.id} onclick={() => (bike = b.id)}>{b.name}</button>{/each}
      </div>
    {/if}

    {#if kind === 'receipt'}
      <p class="lbl">{t('Bike shop')}{#if shops.length}<span class="q"> · {t('from earlier visits')}</span>{/if}</p>
      <div class="vd-chips chips" role="group" aria-label={t('Bike shop')}>
        {#each shops as s (s.shop)}<button type="button" class="vd-chip" aria-pressed={!newShop && shop === s.shop} onclick={() => ((shop = s.shop), (newShop = false))}>{s.shop}<small class="n">{s.n}×</small></button>{/each}
        <button type="button" class="vd-chip" aria-pressed={newShop || !shops.length} onclick={() => ((newShop = true), (shop = ''))}>+ {t('New shop')}</button>
      </div>
      {#if newShop || !shops.length}<label class="fld"><span class="sr">{t('Bike shop')}</span><input class="inp" type="text" bind:value={shop} placeholder={t('Name of the shop')} autocomplete="off" /></label>{/if}
      <div class="two">
        <label class="fld"><span class="lbl">{t('Date')}</span><DateInput bind:value={date} max={today} /></label>
        <label class="fld"><span class="lbl">{t('Amount CHF')}</span><input class="inp num" type="text" inputmode="decimal" bind:value={chf} placeholder={t('not known')} /></label>
      </div>
      <p class="lbl">{t('What was done?')} <span class="q">{t('optional')}</span></p>
      <div class="vd-chips chips" role="group" aria-label={t('What was done?')}>
        {#each JOBS as j (j.part)}{@const on = jobs.some((x) => x.part === j.part)}<button type="button" class="vd-chip" aria-pressed={on} onclick={() => toggleJob(j)}>{t(j.name)}</button>{/each}
      </div>
      <p class="name"><ReceiptText size={16} aria-hidden="true" /><span>{t('Name')}: {t('Receipt|target')} {receiptName(shop, date)}</span></p>
    {:else if kind === 'material' || kind === 'wish'}
      <label class="fld"><span class="lbl">{t('Name')}</span><input class="inp" type="text" bind:value={name} autocomplete="off" /></label>
      <div class="two">
        {#if kind === 'material'}
          <label class="fld"><span class="lbl">{t('Category')}</span><select class="sel" bind:value={category}>{#each choosable() as c (c.key)}<option value={c.key}>{t(c.name)}</option>{/each}</select></label>
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
      <div class="vd-chips chips" role="group" aria-label={t('Topic')}>
        {#each TOPICS as x (x.key)}<button type="button" class="vd-chip" aria-pressed={topic === x.key} onclick={() => (topic = x.key)}>{t(x.name)}</button>{/each}
      </div>
    {/if}

    {#if msg}<p class="err" role="alert">{msg}</p>{/if}
    <div class="vd-foot">
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      <button type="button" class="btn hi" disabled={busy} onclick={save}><Check size={16} aria-hidden="true" />{t(SAVE[kind])}</button>
    </div>
  {/if}
</dialog>

<style>
  .ph {
    flex: none;
    width: 44px;
    height: 56px;
    object-fit: cover;
    border-radius: var(--radius);
    border: 1px solid var(--line);
  }
  .targets {
    list-style: none;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(108px, 1fr));
    gap: 8px;
    margin: 0 0 14px;
    padding: 0;
  }
  .tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: 100%;
    height: 100%;
    min-height: 76px;
    padding: 10px 6px;
    box-sizing: border-box;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    text-align: center;
    cursor: pointer;
  }
  .tile b {
    font: 600 var(--fs-small) / 1.25 var(--font-body);
    overflow-wrap: break-word;
    max-width: 100%;
  }
  .tile small {
    color: var(--ok);
    font-size: var(--fs-tiny);
    font-weight: 500;
  }
  .tile :global(svg) {
    color: var(--ink-2);
  }
  .tile:hover {
    background: var(--paper-2);
  }
  .tile[aria-pressed='true'] {
    border: 2px solid var(--accent);
    background: var(--accent-soft);
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
    margin: 0 0 12px;
  }
  .n {
    margin-left: 6px;
    opacity: 0.75;
    font-size: var(--fs-tiny);
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
    margin: 0 0 4px;
    padding: 8px 12px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .name span {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .err {
    margin: 8px 0 0;
    color: var(--bad);
  }
</style>
