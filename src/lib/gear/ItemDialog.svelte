<script>
  import { db } from '../db.js';
  import { RIDES, RAIN_ITEM } from '../layers.js';
  import { CATEGORIES, CATEGORY, BAGS, BAG, OWNERSHIP, formatWeight, itemWeight, itemDraft, itemRecord, parseGrams } from '../gear.js';
  import { liveQuery } from 'dexie';
  import { SETS_KEY, allSets } from '../sets.js';
  import { TEMPLATES_KEY } from '../templates.js';
  import { assignmentOf, currentTrip } from './assign.js';
  import { localDay } from '../localday.js';
  import { autoKeep, leaveWindow } from '../drafts.js';
  import AssignDialog from './AssignDialog.svelte';
  import { t, tn, nameOf } from '../i18n.svelte.js';
  import { DOMAINS, itemDomains, domainName } from '../domains.js';
  import { comesOf, setStandard, setPlace, clearOptional, blockKind } from './comes.js';
  import { inStandard, isWorn } from '../blocks2026.js';
  import { Check, Plus, UserRound, Briefcase, Info, Layers, Route, FileText, ChevronRight } from '@lucide/svelte';

  /**
   * item: the item to show, or null for "Add item".
   * readOnly: on the phone the inventory is for looking things up and weighing only,
   * so there the dialog shows the details plus a weight field.
   */
  // onkept (v0.35.0): called with the new item when the window closes without "Save" after it was
  // saved while typing (Pack puts it on the trip, a template takes it, like after "Save").
  let { item, items: allItems, readOnly = false, preset = {}, onsaved = null, onkept = null, onclose } = $props();

  // svelte-ignore state_referenced_locally
  const isNew = !item;
  /*
   * v0.35.0 (AP29, Noah 4b + 5a): nothing typed is lost. A new item is saved as soon as it has a
   * name (autoId) and every further field updates it; closing keeps it. "Discard" takes it back
   * (it was made in this window, nothing points to it yet). Until the window closes its ID follows
   * the category (the next free number of that category), as "Save" would give it.
   */
  let autoId = $state(null);
  let ended = false;
  const items = $derived(allItems.filter((i) => i.id !== autoId));
  // An existing item: a copy to edit; nothing is saved until "Save".
  // svelte-ignore state_referenced_locally
  let draft = $state(itemDraft(item, preset));
  let error = $state('');
  let dialog;
  // v0.23.0 (AP08): a new item asks only for name, category, status and weight; everything else
  // waits behind "More details". v0.32.0: an existing item shows where it goes and its building
  // blocks; the rest folds away row by row.
  let more = $state(false);
  // v0.23.0 (AP09): the category can change; the ID never does, so every link to the item stays.
  const moved = $derived(!isNew && draft.category !== item.category);
  // A new item is never "Gone"; an existing one keeps every status.
  const statuses = $derived(Object.entries(OWNERSHIP).filter(([k]) => !isNew || k !== 'gone'));

  $effect(() => {
    dialog.showModal();
  });

  // v0.26.0 (Noah 2a, 9a): every building block (built-in and own); templates and the current trip
  // fold away under "In templates" (v0.32.0), where "Assign …" changes them.
  const setsQ = liveQuery(() => db.settings.get(SETS_KEY));
  const tplQ = liveQuery(() => db.settings.get(TEMPLATES_KEY));
  const tripsQ = liveQuery(() => db.trips.toArray());
  const liveQ = liveQuery(() => (item ? db.items.get(item.id) : null));
  // v0.32.0 (finding 5): the blocks you add by hand first (Light, your own), then the ones of the night.
  const blocks = $derived(allSets($setsQ?.value).sort((a, b) => (blockKind(a.key) === 'night') - (blockKind(b.key) === 'night')));
  const chosenTrip = (() => {
    try {
      return localStorage.getItem('pack.currentTrip');
    } catch {
      return null;
    }
  })();
  // v0.32.0 (finding 5, stage 1): where the item is besides its building blocks: templates and the trip.
  const where = $derived.by(() => {
    if (!item) return { templates: [], trip: null };
    const trip = currentTrip($tripsQ ?? [], chosenTrip, localDay());
    const a = assignmentOf($liveQ ?? item, $tplQ?.value ?? [], trip);
    return { templates: a.templates, trip: a.trip ? trip : null };
  });
  // v0.32.0 (finding 5, stage 1): "Where it goes" and "Comes along · Building blocks". v0.33.0: the
  // buttons write the new fields (sets 'standard', leaveHome) and the old ones in step (comes.js).
  const comes = $derived(comesOf(draft));
  const blockLabel = (b) => (b.builtIn ? b.name.replace(/^(Night|Nacht): /, '') : b.name);
  const inBlock = (key) => !!draft.sets?.includes(key);
  const toggleBlock = (key) => (draft.sets = inBlock(key) ? draft.sets.filter((x) => x !== key) : [...(draft.sets ?? []), key]);
  const bagChoices = $derived(BAGS.filter((b) => b.key !== 'body' || draft.defaultBag === 'body'));
  const layerCount = $derived(['ride', 'coldBelow', 'rain', 'perHours', 'maxQty', 'replaces', 'altFor', 'waterL'].filter((k) => String(draft[k] ?? '').trim() !== '').length);
  const detailLine = $derived([draft.brand, draft.model].filter((x) => String(x ?? '').trim()).join(' · '));
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
    ended = true;
    clearTimeout(autoTimer);
    await autoBusy;
    if (autoId && autoId !== record.id) await db.items.delete(autoId);
    await db.items.put(record);
    await onsaved?.(record);
    dialog.close();
  }

  /* ---------- v0.35.0 (AP29): a new item is saved while it is typed ---------- */
  let autoTimer;
  let autoBusy = Promise.resolve();
  let kept = null; // the last record saved this way
  function autoSave() {
    autoBusy = autoBusy.then(async () => {
      if (readOnly || !autoKeep({ isNew, ended, name: draft.name })) return;
      const grams = String(draft.grams ?? '').trim();
      const record = itemRecord($state.snapshot(draft), { item: null, items, weightG: grams ? parseGrams(grams) : null });
      if (autoId && autoId !== record.id) await db.items.delete(autoId);
      await db.items.put(record);
      autoId = record.id;
      kept = record;
    });
    return autoBusy;
  }
  // svelte-ignore state_referenced_locally
  const startText = JSON.stringify(draft); // as the window opened (a name from the search counts only once changed)
  $effect(() => {
    if (!isNew || readOnly) return;
    const now = JSON.stringify(draft); // every field of the new item
    if (!autoKeep({ isNew, name: draft.name, changed: now !== startText || !!autoId })) return;
    clearTimeout(autoTimer);
    autoTimer = setTimeout(autoSave, 300);
    return () => clearTimeout(autoTimer);
  });
  async function closed() {
    const typed = autoKeep({ isNew, ended, name: draft.name, changed: JSON.stringify($state.snapshot(draft)) !== startText });
    if (!readOnly && !ended && leaveWindow('close', { made: !!autoId, typed }) === 'keep') {
      clearTimeout(autoTimer);
      await autoSave();
      ended = true;
      if (kept) await onkept?.(kept);
    }
    onclose?.();
  }
  async function discard() {
    ended = true;
    clearTimeout(autoTimer);
    await autoBusy;
    if (autoId) await db.items.delete(autoId);
    dialog.close();
  }

  async function remove() {
    if (!confirm(t('Delete "{name}" from your gear? A backup file can bring it back.', { name: nameOf(item) }))) return;
    await db.items.delete(item.id);
    dialog.close();
  }
</script>

{#snippet movedNote()}
  <p class="wide moved" role="status">{t('New category: {cat}. The ID {id} stays the same, so trips, templates, bags and favourites keep this item.', { cat: t(CATEGORY[draft.category]?.name ?? draft.category), id: draft.id })}</p>
{/snippet}

<!-- v0.32.0 (finding 5, stage 1): one question, "Does it come along?", in two words: the place
     "On me" and building blocks. The role field and the tick "On every trip" are gone from view. -->
{#snippet comesAlong()}
  <section class="ca" aria-labelledby="where-h">
    <h3 class="sh" id="where-h">{t('Where it goes')}</h3>
    <div class="seg" role="group" aria-labelledby="where-h">
      <button type="button" class="segb" aria-pressed={comes.body} onclick={() => Object.assign(draft, setPlace(draft, 'body'))}><UserRound size={18} aria-hidden="true" /> {t('On me')}</button>
      <button type="button" class="segb" aria-pressed={!comes.body} onclick={() => Object.assign(draft, setPlace(draft, 'bag'))}><Briefcase size={18} aria-hidden="true" /> {t('In a bag')}</button>
    </div>
    {#if !comes.body && !readOnly}
      <label class="bagsel"><span class="lbl">{t('Usual bag')}</span>
        <select class="sel" bind:value={draft.defaultBag}>
          {#each bagChoices as b (b.key)}<option value={b.key}>{t(b.name)}</option>{/each}
        </select>
      </label>
    {:else if !comes.body && BAG[draft.defaultBag]}
      <p class="quiet">{t('Usual bag')}: {t(BAG[draft.defaultBag])}</p>
    {/if}
    <p class="quiet">{t('"On me" replaces the old word "Worn". On me is always part of Standard.')}</p>
  </section>
  <section class="ca" aria-labelledby="blocks-h">
    <h3 class="sh" id="blocks-h">{t('Comes along')} · {t('Building blocks')}</h3>
    <div class="chips" role="group" aria-labelledby="blocks-h">
      <button type="button" class="chip" aria-pressed={comes.standard} onclick={() => Object.assign(draft, setStandard(draft, !comes.standard))}>
        {#if comes.standard}<Check size={16} aria-hidden="true" />{:else}<Plus size={16} aria-hidden="true" />{/if}
        {t('Standard|block')} <small>{t('every trip')}</small>
      </button>
      {#each blocks as b (b.key)}
        <button type="button" class="chip" aria-pressed={inBlock(b.key)} onclick={() => toggleBlock(b.key)}>
          {#if inBlock(b.key)}<Check size={16} aria-hidden="true" />{:else}<Plus size={16} aria-hidden="true" />{/if}
          {blockLabel(b)}{#if blockKind(b.key) === 'night'}{' '}<small>{t('with a night')}</small>{/if}
        </button>
      {/each}
    </div>
    {#if comes.optional}
      <p class="mark"><span class="badge">{t('Stays at home')}</span> <span class="quiet">{t('Marked in a debrief.')}</span> <button type="button" class="btn sm" onclick={() => Object.assign(draft, clearOptional(draft))}>{t('Take it along again')}</button></p>
    {/if}
    <p class="info"><Info size={16} aria-hidden="true" /><span>{t('A building block is a group of items that comes along together. Standard is on every new trip. The blocks "with a night" come by themselves when the trip has a night; the others you add with one tap when you make a trip.')}</span></p>
  </section>
{/snippet}

<!-- v0.32.0: the rest folds away (progressive disclosure), each row says what is inside. -->
{#snippet inTemplates()}
  <details class="fold">
    <summary><Layers size={18} aria-hidden="true" /><span class="ft">{t('In templates')}</span><span class="fv num">{where.templates.length}{#if where.trip}{' · '}{t('on the current trip')}{/if}</span><ChevronRight class="chev" size={18} aria-hidden="true" /></summary>
    <div class="fbody">
      {#if where.templates.length || where.trip}
        <ul class="wl">
          {#each where.templates as n (n)}<li>{t('Template "{name}"', { name: n })}</li>{/each}
          {#if where.trip}<li>{t('Trip "{name}"', { name: where.trip.title })}</li>{/if}
        </ul>
      {:else}<p class="quiet">{t('In no template and not on the current trip.')}</p>{/if}
      <button type="button" class="btn sm" onclick={() => (assigning = true)}>{t('Assign …')}</button>
    </div>
  </details>
{/snippet}

{#snippet folds()}
  {#if !isNew}{@render inTemplates()}{/if}
  <details class="fold">
    <summary><Route size={18} aria-hidden="true" /><span class="ft">{t('For weather and riding time')}</span><span class="fv">{layerCount ? tn(layerCount, '{n} rule', '{n} rules') : t('not set')}</span><ChevronRight class="chev" size={18} aria-hidden="true" /></summary>
    <div class="fbody layers">
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
      <label><span class="lbl">{t('On me, instead of')}</span>
        <select class="sel" bind:value={draft.replaces}>
          <option value="">–</option>
          {#each items.filter((i) => (isWorn(i) || inStandard(i)) && i.id !== draft.id) as i (i.id)}<option value={i.id}>{nameOf(i)}</option>{/each}
        </select>
      </label>
      <label><span class="lbl">{t('Can be taken instead of')}</span>
        <select class="sel" bind:value={draft.altFor}>
          <option value="">–</option>
          {#each items.filter((i) => i.ride && i.id !== draft.id) as i (i.id)}<option value={i.id}>{nameOf(i)}</option>{/each}
        </select>
      </label>
      <label><span class="lbl">{t('Water in it (L)')}</span><input class="inp num" type="text" inputmode="decimal" bind:value={draft.waterL} placeholder={t('e.g. {x}', { x: '0.75' })} /></label>
    </div>
  </details>
  <details class="fold">
    <summary><FileText size={18} aria-hidden="true" /><span class="ft">{t('Brand, model, note')}</span><span class="fv">{detailLine}</span><ChevronRight class="chev" size={18} aria-hidden="true" /></summary>
    <div class="fbody grid">
      <label><span class="lbl">{t('Brand')}</span><input class="inp" bind:value={draft.brand} placeholder={t('e.g. {x}', { x: 'Garmin' })} /></label>
      <label><span class="lbl">{t('Model / colour')}</span><input class="inp" bind:value={draft.model} placeholder={t('e.g. {x}', { x: 'Edge 1040 Solar' })} /></label>
      <label><span class="lbl">{t('Quantity')}</span><input class="inp num" type="number" min="1" bind:value={draft.qty} /></label>
      <label class="cb wide"><input type="checkbox" bind:checked={draft.favorite} /> ★ {t('Favourite (tested, one of my best items)')}</label>
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
      <label class="wide"><span class="lbl">{t('Note')}</span><textarea class="inp" rows="2" bind:value={draft.note}></textarea></label>
    </div>
  </details>
{/snippet}

<dialog class="sheet" bind:this={dialog} onclose={closed} aria-labelledby="item-h">
  <form onsubmit={save} novalidate>
    <p class="meta">
      <span class="sw" style:background={CATEGORY[draft.category]?.color}></span>
      {t(CATEGORY[draft.category]?.name ?? '')}{draft.id ? ` · ${draft.id}` : ''}
    </p>
    <h2 id="item-h" class="title">{isNew ? t('Add item') : nameOf(item)}</h2>

    {#if readOnly}
      <dl class="facts">
        {#if item.brand}<div><dt>{t('Brand')}</dt><dd>{item.brand}</dd></div>{/if}
        {#if item.model}<div><dt>{t('Model')}</dt><dd>{item.model}</dd></div>{/if}
        <div><dt>{t('Status')}</dt><dd>{t(OWNERSHIP[item.ownership] ?? '')}</dd></div>
        {#if item.favorite}<div><dt>{t('Favourite')}</dt><dd>★ {item.favNote || t('Tested, one of my best items')}</dd></div>{/if}
        <div><dt>{t('Areas')}</dt><dd>{itemDomains(item).map((d) => t(domainName(d))).join(', ')}</dd></div>
        {#if item.ride}<div><dt>{t('Layer')}</dt><dd>{t(RIDES.find((r) => r.key === item.ride)?.name ?? '')}</dd></div>{/if}
        {#if item.coldBelow != null}<div><dt>{t('Add when colder than')}</dt><dd>{item.coldBelow} °C</dd></div>{/if}
        {#if item.rain}<div><dt>{t('Rain')}</dt><dd>{t(RAIN_ITEM[item.rain] ?? '')}</dd></div>{/if}
        {#if item.perHours}<div><dt>{t('Amount')}</dt><dd>{t('1 per {n} h', { n: item.perHours })}{item.maxQty ? `, ${t('at most {n}', { n: item.maxQty })}` : ''}</dd></div>{/if}
        {#if item.replaces}<div><dt>{t('On me, instead of')}</dt><dd>{nameOf(items.find((i) => i.id === item.replaces)) || item.replaces}</dd></div>{/if}

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
      {@render comesAlong()}
      {@render inTemplates()}
    {:else}
      <!-- v0.23.0 (AP08): the four main fields first; for a new item the rest folds away under "More details". -->
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
      {#if isNew}
        <details class="more" bind:open={more}>
          <summary>{t('More details')} <small>{t('where it goes, building blocks, weather, brand, note')}</small></summary>
          {@render comesAlong()}
          {@render folds()}
        </details>
      {:else}
        {@render comesAlong()}
        {@render folds()}
      {/if}
      {#if item?.learning}<p class="note"><b>{t('Learning:')}</b> {item.learning}</p>{/if}
    {/if}

    <p class="err" role="alert">{error}</p>
    <div class="foot">
      <button type="submit" class="btn hi">{t('Save')}</button>
      {#if isNew && autoId}<button type="button" class="btn" onclick={discard}>{t('Discard')}</button><span class="kept" role="status"><Check size={14} aria-hidden="true" />{t('Saved')}</span>
      {:else}<button type="button" class="btn" onclick={() => (isNew ? discard() : dialog.close())}>{t('Cancel')}</button>{/if}
      {#if !isNew && !readOnly}<button type="button" class="btn del" onclick={remove}>{t('Delete')}</button>{/if}
    </div>
  </form>
</dialog>

{#if assigning}<AssignDialog ids={[item.id]} {item} onclose={assigned} />{/if}

<style>
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
    min-width: 0;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
  }
  .layers {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px 12px;
  }
  .sets legend {
    margin-bottom: 4px;
  }
  /* v0.32.0 (finding 5, stage 1): "Where it goes" and "Comes along · Building blocks".
     Light section headers, a segmented toggle for the place, chips for the blocks. */
  .ca {
    margin-top: 16px;
  }
  .sh {
    font-size: var(--fs-label);
    font-weight: 600;
    color: var(--ink-2);
    margin: 0 0 6px;
  }
  .seg {
    display: inline-flex;
    max-width: 100%;
    border: 1.5px solid var(--line-strong);
    border-radius: 999px;
    padding: 2px;
    background: var(--paper);
  }
  .segb {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 4px 16px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--ink);
    font: 600 15px var(--font-body);
    cursor: pointer;
    min-width: 0;
  }
  .segb[aria-pressed='true'] {
    background: var(--ink);
    color: var(--paper);
  }
  .bagsel {
    display: grid;
    margin-top: 8px;
    max-width: 320px;
  }
  .quiet {
    font-size: var(--fs-small);
    color: var(--ink-3);
    margin: 6px 0 0;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 4px 14px 4px 10px;
    border: 1.5px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 600 15px var(--font-body);
    cursor: pointer;
    max-width: 100%;
    text-align: left;
  }
  .chip:hover {
    border-color: var(--line-strong);
  }
  .chip small {
    font-weight: 500;
    font-size: 13px;
    color: var(--ink-3);
  }
  .chip[aria-pressed='true'] {
    background: var(--ok-soft);
    border-color: var(--ok);
  }
  .chip[aria-pressed='true'] small {
    color: var(--ok);
  }
  .mark {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 8px;
    margin: 10px 0 0;
  }
  .mark .quiet {
    margin: 0;
  }
  .badge {
    font-size: 13px;
    font-weight: 600;
    border-radius: 99px;
    padding: 2px 10px;
    background: var(--warn-soft);
    color: var(--warn);
  }
  .info {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 12px 0 0;
    padding: 10px 12px;
    border-radius: var(--radius);
    background: var(--paper-2);
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .info :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .fold {
    margin-top: 8px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--paper);
  }
  .ca + .fold,
  .ca + :global(.fold) {
    margin-top: 16px;
  }
  .fold summary {
    list-style: none;
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    padding: 6px 12px;
    cursor: pointer;
  }
  .fold summary::-webkit-details-marker {
    display: none;
  }
  .ft {
    font-weight: 600;
    flex: none;
    white-space: nowrap;
  }
  .fv {
    flex: 1 1 0;
    margin-left: auto;
    color: var(--ink-3);
    font-size: var(--fs-small);
    text-align: right;
    font-variant-numeric: tabular-nums;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .fold :global(.chev) {
    flex: none;
    color: var(--ink-3);
    transition: transform 0.15s;
  }
  .fold[open] :global(.chev) {
    transform: rotate(90deg);
  }
  .fbody {
    padding: 4px 12px 12px;
  }
  .wl {
    margin: 0 0 8px;
    padding-left: 18px;
    font-size: 15px;
  }
  .wl li {
    overflow-wrap: anywhere;
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
    content: '▸' / ''; /* v0.27.0 (AP21): only a picture, screen readers skip it */
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
  .kept {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: var(--ink-3);
  }
  .del {
    margin-left: auto;
    border-color: var(--bad);
    color: var(--bad);
  }
</style>
