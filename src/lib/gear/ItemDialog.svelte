<script>
  import { db } from '../db.js';
  import { RIDES, RAIN_ITEM } from '../layers.js';
  import { CATEGORIES, CATEGORY, BAGS, BAG, OWNERSHIP, ROLES, formatWeight, itemWeight, itemDraft, itemRecord, parseGrams } from '../gear.js';
  import { liveQuery } from 'dexie';
  import { SETS_KEY, allSets, setName } from '../sets.js';
  import { TEMPLATES_KEY } from '../templates.js';
  import { assignmentOf, currentTrip } from './assign.js';
  import { localDay } from '../localday.js';
  import AssignDialog from './AssignDialog.svelte';
  import { t, nameOf } from '../i18n.svelte.js';
  import { DOMAINS, itemDomains, domainName } from '../domains.js';

  /**
   * item: the item to show, or null for "Add item".
   * readOnly: on the phone the inventory is for looking things up and weighing only,
   * so there the dialog shows the details plus a weight field.
   */
  let { item, items, readOnly = false, preset = {}, onsaved = null, onclose } = $props();

  // svelte-ignore state_referenced_locally
  const isNew = !item;
  // A copy to edit; nothing is saved until "Save".
  // svelte-ignore state_referenced_locally
  let draft = $state(itemDraft(item, preset));
  let error = $state('');
  let dialog;
  // v0.23.0 (AP08): a new item asks only for name, category, status and weight; everything else
  // waits behind "More details". An existing item opens with its details shown, nothing hidden.
  // svelte-ignore state_referenced_locally
  let more = $state(!isNew);
  // v0.23.0 (AP09): the category can change; the ID never does, so every link to the item stays.
  const moved = $derived(!isNew && draft.category !== item.category);
  // A new item is never "Gone"; an existing one keeps every status.
  const statuses = $derived(Object.entries(OWNERSHIP).filter(([k]) => !isNew || k !== 'gone'));

  $effect(() => {
    dialog.showModal();
  });

  // v0.26.0 (Noah 2a, 9a): every building block (built-in and own) and the line "In: …" with the
  // item's building blocks, templates and the current trip; "Assign …" changes them.
  const setsQ = liveQuery(() => db.settings.get(SETS_KEY));
  const tplQ = liveQuery(() => db.settings.get(TEMPLATES_KEY));
  const tripsQ = liveQuery(() => db.trips.toArray());
  const liveQ = liveQuery(() => (item ? db.items.get(item.id) : null));
  const blocks = $derived(allSets($setsQ?.value));
  const chosenTrip = (() => {
    try {
      return localStorage.getItem('pack.currentTrip');
    } catch {
      return null;
    }
  })();
  const inLine = $derived.by(() => {
    if (!item) return '';
    const trip = currentTrip($tripsQ ?? [], chosenTrip, localDay());
    const a = assignmentOf($liveQ ?? item, $tplQ?.value ?? [], trip);
    const parts = [...a.sets.map((k) => setName(blocks, k)), ...a.templates.map((n) => t('Template "{name}"', { name: n })), ...(a.trip ? [t('Trip "{name}"', { name: trip.title })] : [])];
    return parts.length ? parts.join(' · ') : t('nothing yet');
  });
  let assigning = $state(false);
  // What "Assign …" wrote (building blocks, default bag) comes into the open form, so "Save" keeps it.
  async function assigned() {
    assigning = false;
    const live = await db.items.get(item.id);
    if (live) Object.assign(draft, { sets: [...(live.sets ?? [])], defaultBag: live.defaultBag });
  }

  async function save(event) {
    event.preventDefault();
    if (!draft.name.trim()) return (error = t('Give the item a name.'));
    if (!CATEGORY[draft.category] && (isNew || draft.category !== item.category)) return (error = t('Choose a category.'));
    let weightG = null;
    if (String(draft.grams).trim() !== '') {
      weightG = parseGrams(draft.grams);
      if (weightG == null) return (error = t('Weight: whole grams from 1 to 30,000, or leave it empty.'));
    }
    // v0.23.0 (AP09): the record is built in gear.js (itemRecord), tested there; the ID never changes.
    const record = itemRecord($state.snapshot(draft), { item, items, weightG });
    await db.items.put(record);
    await onsaved?.(record);
    dialog.close();
  }

  async function remove() {
    if (!confirm(t('Delete "{name}" from your gear? A backup file can bring it back.', { name: nameOf(item) }))) return;
    await db.items.delete(item.id);
    dialog.close();
  }
</script>

{#snippet movedNote()}
  <p class="wide moved" role="status">{t('New category: {cat}. The ID {id} stays the same, so trips, templates, kits, bags and favourites keep this item.', { cat: t(CATEGORY[draft.category]?.name ?? draft.category), id: draft.id })}</p>
{/snippet}

<dialog class="sheet" bind:this={dialog} onclose={onclose} aria-labelledby="item-h">
  <form onsubmit={save} novalidate>
    <p class="meta">
      <span class="sw" style:background={CATEGORY[draft.category]?.color}></span>
      {t(CATEGORY[draft.category]?.name ?? '')}{draft.id ? ` · ${draft.id}` : ''}
    </p>
    <h2 id="item-h" class="title">{isNew ? t('Add item') : nameOf(item)}</h2>
    {#if !isNew}
      <!-- v0.26.0 (Noah 9a, AP11): where the item is now, and "Assign …" to change it. -->
      <p class="inline"><span><span class="lbl">{t('In:')}</span> {inLine}</span> <button type="button" class="btn sm" onclick={() => (assigning = true)}>{t('Assign …')}</button></p>
    {/if}

    {#if readOnly}
      <dl class="facts">
        {#if item.brand}<div><dt>{t('Brand')}</dt><dd>{item.brand}</dd></div>{/if}
        {#if item.model}<div><dt>{t('Model')}</dt><dd>{item.model}</dd></div>{/if}
        <div><dt>{t('Default bag')}</dt><dd>{BAG[item.defaultBag] ? t(BAG[item.defaultBag]) : '–'}</dd></div>
        <div><dt>{t('Status')}</dt><dd>{t(OWNERSHIP[item.ownership] ?? '')}</dd></div>
        {#if item.role}<div><dt>{t('Role')}</dt><dd>{t(ROLES[item.role] ?? '')}</dd></div>{/if}
        {#if item.always}<div><dt>{t('Trips')}</dt><dd>{t('On every trip')}</dd></div>{/if}
        {#if item.favorite}<div><dt>{t('Favourite')}</dt><dd>★ {item.favNote || t('Tested, one of my best items')}</dd></div>{/if}
        <div><dt>{t('Areas')}</dt><dd>{itemDomains(item).map((d) => t(domainName(d))).join(', ')}</dd></div>
        {#if item.ride}<div><dt>{t('Layer')}</dt><dd>{t(RIDES.find((r) => r.key === item.ride)?.name ?? '')}</dd></div>{/if}
        {#if item.coldBelow != null}<div><dt>{t('Add when colder than')}</dt><dd>{item.coldBelow} °C</dd></div>{/if}
        {#if item.rain}<div><dt>{t('Rain')}</dt><dd>{t(RAIN_ITEM[item.rain] ?? '')}</dd></div>{/if}
        {#if item.perHours}<div><dt>{t('Amount')}</dt><dd>{t('1 per {n} h', { n: item.perHours })}{item.maxQty ? `, ${t('at most {n}', { n: item.maxQty })}` : ''}</dd></div>{/if}
        {#if item.replaces}<div><dt>{t('When worn, instead of')}</dt><dd>{nameOf(items.find((i) => i.id === item.replaces)) || item.replaces}</dd></div>{/if}

        {#if item.qty > 1}<div><dt>{t('Quantity')}</dt><dd>{item.qty} × {formatWeight(item.weightG)} = {formatWeight(itemWeight(item))}</dd></div>{/if}
      </dl>
      {#if item.learning}<p class="note"><b>{t('Learning:')}</b> {item.learning}</p>{/if}
      {#if item.note}<p class="note">{item.note}</p>{/if}
      <!-- v0.23.1 (Noah 5b): on the phone too the category can change, next to the weight; the ID stays. -->
      <div class="grid pair">
        <label>
          <span class="lbl">{t('Category')}</span>
          <select class="sel" bind:value={draft.category}>
            {#if !CATEGORY[draft.category]}<option value={draft.category} disabled>{draft.category ? draft.category : t('Choose a category')}</option>{/if}
            {#each CATEGORIES as c (c.key)}<option value={c.key}>{t(c.name)}</option>{/each}
          </select>
        </label>
        <label><span class="lbl">{t('Weight of one piece (g)')}</span><input class="inp num" type="text" inputmode="numeric" bind:value={draft.grams} placeholder={t('not weighed')} /></label>
        {#if moved}{@render movedNote()}{/if}
      </div>
    {:else}
      <!-- v0.23.0 (AP08): the four main fields first; the rest folds away under "More details". -->
      <div class="grid">
        <label class="wide"><span class="lbl">{t('Name')} <small class="req">{t('required')}</small></span><input class="inp" bind:value={draft.name} required /></label>
        <label>
          <span class="lbl">{t('Category')} <small class="req">{t('required')}</small></span>
          <select class="sel" bind:value={draft.category} required>
            {#if !CATEGORY[draft.category]}<option value={draft.category} disabled>{draft.category ? draft.category : t('Choose a category')}</option>{/if}
            {#each CATEGORIES as c (c.key)}<option value={c.key}>{t(c.name)}</option>{/each}
          </select>
        </label>
        <label>
          <span class="lbl">{t('Status')} <small class="req">{t('required')}</small></span>
          <select class="sel" bind:value={draft.ownership}>
            {#each statuses as [k, v] (k)}<option value={k}>{t(v)}</option>{/each}
          </select>
        </label>
        <label class="wide"><span class="lbl">{t('Weight of one piece (g)')} <small class="req">{t('optional')}</small></span><input class="inp num" type="text" inputmode="numeric" bind:value={draft.grams} placeholder={t('not weighed')} /></label>
        {#if moved}{@render movedNote()}{/if}
      </div>
      <details class="more" bind:open={more}>
        <summary>{t('More details')} <small>{t('brand, quantity, bag, role, areas, overnight sets, layers, note')}</small></summary>
        <div class="grid">
        <label><span class="lbl">{t('Brand')}</span><input class="inp" bind:value={draft.brand} placeholder={t('e.g. {x}', { x: 'Garmin' })} /></label>
        <label><span class="lbl">{t('Model / colour')}</span><input class="inp" bind:value={draft.model} placeholder={t('e.g. {x}', { x: 'Edge 1040 Solar' })} /></label>
        <label><span class="lbl">{t('Quantity')}</span><input class="inp num" type="number" min="1" bind:value={draft.qty} /></label>
        <label>
          <span class="lbl">{t('Default bag')}</span>
          <select class="sel" bind:value={draft.defaultBag}>
            {#each BAGS as b (b.key)}<option value={b.key}>{t(b.name)}</option>{/each}
          </select>
        </label>
        <label>
          <span class="lbl">{t('Role on every ride')}</span>
          <select class="sel" bind:value={draft.role}>
            <option value="">{t('No role')}</option>
            {#each Object.entries(ROLES) as [k, v] (k)}<option value={k}>{t(v)}</option>{/each}
          </select>
        </label>
        <label class="cb wide always"><input type="checkbox" bind:checked={draft.always} /> {t('On every trip (always with me: every new trip gets it)')}</label>
        <label class="cb wide always"><input type="checkbox" bind:checked={draft.favorite} /> ★ {t('Favourite (tested, one of my best items)')}</label>
        {#if draft.favorite}
          <label class="wide"><span class="lbl">{t('Why it is a favourite')}</span><input class="inp" bind:value={draft.favNote} placeholder={t('e.g. Warm, packs small, never let me down')} /></label>
        {/if}
        <!-- v0.21.0 (package 5): one inventory, an item can belong to several areas. -->
        <fieldset class="wide sets">
          <legend class="lbl">{t('Areas (new trips of an area suggest its items)')}</legend>
          {#each DOMAINS as d (d.key)}
            {@const on = draft.domains?.includes(d.key)}
            <label class="cb"><input type="checkbox" checked={on} disabled={on && draft.domains.length === 1} onchange={(e) => (draft.domains = e.currentTarget.checked ? [...(draft.domains ?? []), d.key] : (draft.domains ?? []).filter((x) => x !== d.key))} /> {t(d.name)}</label>
          {/each}
        </fieldset>
        <fieldset class="wide sets">
          <legend class="lbl">{t('Building blocks (Pack adds a whole block with one tap)')}</legend>
          {#each blocks as b (b.key)}
            <label class="cb"><input type="checkbox" checked={draft.sets?.includes(b.key)} onchange={(e) => (draft.sets = e.currentTarget.checked ? [...(draft.sets ?? []), b.key] : (draft.sets ?? []).filter((x) => x !== b.key))} /> {b.builtIn ? b.name.replace(/^(Night|Nacht): /, '') : b.name}</label>
          {/each}
        </fieldset>
        <fieldset class="wide layers">
          <legend class="lbl">{t('Layers (Pack adds them for the ride and the weather)')}</legend>
          <label><span class="lbl">{t('From this ride on')}</span>
            <select class="sel" bind:value={draft.ride}>
              <option value="">–</option>
              {#each RIDES.filter((r) => r.key !== 'every') as r (r.key)}<option value={r.key}>{t(r.name)}</option>{/each}
            </select>
          </label>
          <label><span class="lbl">{t('Add when colder than (°C)')}</span><input class="inp num" type="text" inputmode="numeric" bind:value={draft.coldBelow} placeholder={t('e.g. {x}', { x: '10' })} /></label>
          <label><span class="lbl">{t('When it rains')}</span>
            <select class="sel" bind:value={draft.rain}>
              <option value="">–</option>
              {#each Object.entries(RAIN_ITEM) as [k, v] (k)}<option value={k}>{v === 'Rain' ? t('Always take it') : t('Offer it')}</option>{/each}
            </select>
          </label>
          <label><span class="lbl">{t('1 piece per … riding hours')}</span><input class="inp num" type="text" inputmode="decimal" bind:value={draft.perHours} placeholder={t('e.g. {x}', { x: '3' })} /></label>
          <label><span class="lbl">{t('At most … pieces')}</span><input class="inp num" type="text" inputmode="numeric" bind:value={draft.maxQty} placeholder={t('e.g. {x}', { x: '2' })} /></label>
          <label><span class="lbl">{t('When worn, instead of')}</span>
            <select class="sel" bind:value={draft.replaces}>
              <option value="">–</option>
              {#each items.filter((i) => (i.role === 'worn' || i.role === 'standard') && i.id !== draft.id) as i (i.id)}<option value={i.id}>{nameOf(i)}</option>{/each}
            </select>
          </label>
          <label><span class="lbl">{t('Can be taken instead of')}</span>
            <select class="sel" bind:value={draft.altFor}>
              <option value="">–</option>
              {#each items.filter((i) => i.ride && i.id !== draft.id) as i (i.id)}<option value={i.id}>{nameOf(i)}</option>{/each}
            </select>
          </label>
          <label><span class="lbl">{t('Water in it (L)')}</span><input class="inp num" type="text" inputmode="decimal" bind:value={draft.waterL} placeholder={t('e.g. {x}', { x: '0.75' })} /></label>
        </fieldset>
        <label class="wide"><span class="lbl">{t('Note')}</span><textarea class="inp" rows="2" bind:value={draft.note}></textarea></label>
        </div>
      </details>
      {#if item?.learning}<p class="note"><b>{t('Learning:')}</b> {item.learning}</p>{/if}
    {/if}

    <p class="err" role="alert">{error}</p>
    <div class="foot">
      <button type="submit" class="btn hi">{t('Save')}</button>
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      {#if !isNew && !readOnly}<button type="button" class="btn del" onclick={remove}>{t('Delete')}</button>{/if}
    </div>
  </form>
</dialog>

{#if assigning}<AssignDialog ids={[item.id]} {item} onclose={assigned} />{/if}

<style>
  .inline {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    margin: -8px 0 12px;
    font-size: 14px;
    overflow-wrap: anywhere;
  }
  .inline > span {
    flex: 1 1 180px;
    min-width: 0;
  }
  .meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: var(--fs-small);
    font-weight: 700;
    color: var(--ink-3);
  }
  h2 {
    font-size: var(--fs-section);
    margin: 4px 0 14px;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .wide {
    grid-column: 1 / -1;
  }
  @media (max-width: 480px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
  /* v0.23.1 (Noah 5b): category and weight side by side, also on a phone; stacked when very narrow */
  .grid.pair {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
  .pair label {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    min-width: 0;
  }
  .pair .sel {
    width: 100%;
    min-width: 0;
  }
  @media (max-width: 359px) {
    .grid.pair {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .sets {
    border: 0;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
  }
  .layers {
    border: 0;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px 12px;
  }
  .layers legend {
    margin-bottom: 4px;
  }
  .sets legend {
    margin-bottom: 4px;
  }
  /* v0.23.0 (AP08) */
  .req {
    font-weight: 400;
    color: var(--ink-3);
  }
  .moved {
    margin: 0;
    font-size: 14px;
    color: var(--ink-2);
    border-left: 3px solid var(--hi);
    padding-left: 8px;
  }
  .more {
    margin-top: 14px;
    border-top: 1px solid var(--line);
    padding-top: 8px;
  }
  .more summary {
    list-style: none;
    cursor: pointer;
    font-weight: 600;
    min-height: 40px;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 8px;
    padding-top: 8px;
  }
  .more summary::-webkit-details-marker {
    display: none;
  }
  .more summary::before {
    content: '▸';
    transition: transform 0.15s;
  }
  .more[open] summary::before {
    transform: rotate(90deg);
  }
  .more summary small {
    font-weight: 400;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .more .grid {
    margin-top: 10px;
  }
  .cb {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .facts {
    display: grid;
    gap: 6px;
    margin: 0 0 12px;
  }
  .facts div {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    border-bottom: 1px solid var(--line);
    padding-bottom: 4px;
  }
  dt {
    color: var(--ink-3);
  }
  dd {
    margin: 0;
    font-weight: 600;
    text-align: right;
  }
  .note {
    font-size: 14px;
    color: var(--ink-2);
    margin: 10px 0;
  }
  .err {
    color: var(--bad);
    min-height: 1.2em;
    font-size: 14px;
  }
  .foot {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .del {
    margin-left: auto;
    border-color: var(--bad);
    color: var(--bad);
  }
</style>
