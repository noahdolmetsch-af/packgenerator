<script>
  import { backClose } from '../ui/backclose.js';
  import { offerRename } from '../ui/rename.svelte.js';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import { Pencil } from '@lucide/svelte';
  import { db } from '../db.js';
  import { SLOTS, SLOT, isWornSlot } from '../bikes.js';
  import { formatWeight, parseGrams } from '../gear.js';
  import { TRIP_DOMAINS } from '../domains.js';
  import { t, nameOf } from '../i18n.svelte.js';

  /** bag: the bag to edit, or null for "Add bag" (slot: the place it is for, v0.31.0). Weight comes from the linked gear item. */
  let { bag, slot = null, items, bags, bikes, onclose } = $props();

  // The dialog edits a copy of the bag as it was when it opened, so reading `bag` once is intended.
  // svelte-ignore state_referenced_locally
  const isNew = !bag;
  // svelte-ignore state_referenced_locally
  let draft = $state(bag ? { ...bag, volumeL: bag.volumeL ?? '', itemId: bag.itemId ?? '', grams: bag.weightG ?? '', domains: [...(bag.domains ?? [])] } : { id: '', name: '', slot: slot && SLOT[slot] ? slot : 'seat', volumeL: '', itemId: '', pieces: 1, note: '', grams: '', domains: [] });
  // v0.37.0 (Noah 1a): a worn bag (Back, Hip) has its areas and, without a gear item, its own weight.
  const worn = $derived(isWornSlot(draft.slot));
  const bikePlaces = SLOTS.filter((s) => !s.worn);
  const wornPlaces = SLOTS.filter((s) => s.worn);
  let error = $state('');
  let dialog;

  // Gear items that can hold the weight of a bag: bags first, then bike parts.
  // v0.23.0 (AP09): the item already linked stays in the list, also after its category changed,
  // so saving the bag never drops the link (and the weight) without being asked.
  const linkable = $derived(
    items
      .filter((i) => i.category === 'bags' || i.category === 'bike' || (bag?.itemId && i.id === bag.itemId))
      .sort((a, b) => (a.category ?? '').localeCompare(b.category ?? '') || a.name.localeCompare(b.name)),
  );
  const linked = $derived(items.find((i) => i.id === draft.itemId));

  $effect(() => {
    dialog.showModal();
  });

  function newId(name) {
    const base = 'bag-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24);
    let id = base;
    for (let n = 2; bags.some((b) => b.id === id); n++) id = `${base}-${n}`;
    return id;
  }

  async function save(event) {
    event.preventDefault();
    if (!draft.name.trim()) return (error = t('Give the bag a name.'));
    const vol = String(draft.volumeL).trim() === '' ? null : Number(String(draft.volumeL).replace(',', '.'));
    if (vol != null && !(vol > 0 && vol <= 100)) return (error = t('Volume: litres from 0.1 to 100, or leave it empty.'));
    let weightG = null;
    if (!draft.itemId && String(draft.grams ?? '').trim() !== '') {
      weightG = parseGrams(String(draft.grams));
      if (weightG == null) return (error = t('Weight: whole grams from 1 to 30,000, or leave it empty.'));
    }
    const { grams, ...d } = $state.snapshot(draft);
    const record = {
      ...d,
      id: isNew ? newId(d.name) : d.id,
      name: d.name.trim(),
      volumeL: vol,
      itemId: d.itemId || null,
      pieces: Math.max(1, Number(d.pieces) || 1),
      weightG: d.itemId ? (bag?.weightG ?? null) : weightG,
      domains: isWornSlot(d.slot) ? d.domains ?? [] : bag?.domains ?? [],
    };
    if (record.weightG == null) delete record.weightG;
    if (!record.domains.length) delete record.domains;
    await db.transaction('rw', db.containers, db.bikes, async () => {
      await db.containers.put(record);
      // A bag that moves to another place leaves the bikes where it sat at the old place.
      // v0.37.0: Back and Hip take every worn bag, so a move between them leaves it where it is.
      if (!isNew && bag.slot !== record.slot && !(isWornSlot(bag.slot) && isWornSlot(record.slot))) {
        for (const b of bikes) if (b.setup?.[bag.slot] === bag.id) await db.bikes.update(b.id, { [`setup.${bag.slot}`]: null });
      }
    });
    dialog.close();
  }

  // v0.72.0 «Feinschliff» (Umbenennen 2a, 4a): Android back and Escape keep what was typed (saved
  // like «Save»); untouched, or a new bag without a name, it only closes.
  // svelte-ignore state_referenced_locally
  const openedAs = JSON.stringify(draft);
  const keepOnBack = () => (JSON.stringify($state.snapshot(draft)) === openedAs || !draft.name.trim() ? dialog.close() : save({ preventDefault() {} }));

  // v0.72.0 (Umbenennen 1a): the pencil next to the name opens the one rename sheet.
  let renaming = $state(false);
  async function rename(name) {
    const old = bag.name;
    await db.containers.update(bag.id, { name });
    draft.name = name;
    shownName = name;
    offerRename(name, async () => {
      await db.containers.update(bag.id, { name: old });
      if (dialog?.open) (draft.name = old), (shownName = old);
    });
  }
  // svelte-ignore state_referenced_locally
  let shownName = $state(bag?.name ?? '');

  async function remove() {
    if (!confirm(t('Delete the bag "{name}"? It is taken off every bike. The gear item stays.', { name: bag.name }))) return;
    await db.transaction('rw', db.containers, db.bikes, async () => {
      await db.containers.delete(bag.id);
      // Off every place of every bike (a worn bag can sit on Back or Hip).
      for (const b of bikes) for (const [k, v] of Object.entries(b.setup ?? {})) if (v === bag.id) await db.bikes.update(b.id, { [`setup.${k}`]: null });
    });
    dialog.close();
  }
</script>

<dialog class="sheet" bind:this={dialog} use:backClose={keepOnBack} {onclose} aria-labelledby="bag-h">
  <form onsubmit={save} novalidate>
    <p class="meta">{t(SLOT[draft.slot]?.name ?? 'Bag')}</p>
    <h2 id="bag-h" class="title">{#if isNew}{t('Add bag')}{:else}<span>{shownName}</span><button type="button" class="pen" aria-label={t('Rename {name}', { name: shownName })} title={t('Rename')} onclick={() => (renaming = true)}><Pencil size={18} aria-hidden="true" /></button>{/if}</h2>
    <div class="grid">
      <label class="wide"><span class="lbl">{t('Name')}</span><input class="inp" bind:value={draft.name} required enterkeyhint="done" /></label>
      <label>
        <span class="lbl">{t('Place')}</span>
        <select class="sel" bind:value={draft.slot}>
          <optgroup label={t('On the bike|places')}>{#each bikePlaces as s (s.key)}<option value={s.key}>{t(s.name)} ({t(s.where)})</option>{/each}</optgroup>
          <optgroup label={t('On me')}>{#each wornPlaces as s (s.key)}<option value={s.key}>{t(s.name)} ({t(s.where)})</option>{/each}</optgroup>
        </select>
      </label>
      <label><span class="lbl">{t('Volume (L)')}</span><input class="inp num" type="text" inputmode="decimal" bind:value={draft.volumeL} placeholder={t('unknown')} /></label>
      <label>
        <span class="lbl">{t('Weight from gear item')}</span>
        <select class="sel" bind:value={draft.itemId}>
          <option value="">{t('None')}</option>
          {#each linkable as i (i.id)}<option value={i.id}>{nameOf(i)} · {i.id}</option>{/each}
        </select>
      </label>
      {#if draft.itemId}<label><span class="lbl">{t('Pieces of that item')}</span><input class="inp num" type="number" min="1" bind:value={draft.pieces} /></label>
      {:else}<label><span class="lbl">{t('Weight (g)')}</span><input class="inp num" type="text" inputmode="numeric" bind:value={draft.grams} placeholder={t('not weighed')} /></label>{/if}
      {#if worn}
        <!-- v0.37.0 (Noah 3a): the areas a worn bag is made for; trips of that area suggest it. -->
        <fieldset class="wide areas">
          <legend class="lbl">{t('For these areas')}</legend>
          {#each TRIP_DOMAINS as d (d.key)}
            {@const on = draft.domains.includes(d.key)}
            <label class="cb"><input type="checkbox" checked={on} onchange={(e) => (draft.domains = e.currentTarget.checked ? [...draft.domains, d.key] : draft.domains.filter((x) => x !== d.key))} /> {t(d.name)}</label>
          {/each}
        </fieldset>
      {/if}
      <label class="wide"><span class="lbl">{t('Note')}</span><input class="inp" bind:value={draft.note} /></label>
    </div>
    <!-- v0.26.1 (Noah 15b): litres are optional; Pack only talks about volume when everything has litres. -->
    <p class="note">{t('Litres are optional. Pack shows "used of litres" only when every bag in use and every item in it has litres.')}</p>
    <p class="note">
      {t('Weight:')} <b>{linked ? (linked.weightG == null ? t('not weighed yet (weigh it in Gear)') : formatWeight(linked.weightG * (Number(draft.pieces) || 1))) : String(draft.grams ?? '').trim() ? formatWeight(parseGrams(String(draft.grams))) : t('no gear item linked')}</b>
      {#if worn}<br /><span class="quiet">{t('Worn bags count to On me, not to the bike.')}</span>{/if}
    </p>
    <p class="err" role="alert">{error}</p>
    <div class="foot">
      <button type="submit" class="btn hi">{t('Save')}</button>
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      {#if !isNew}<button type="button" class="btn del" onclick={remove}>{t('Delete')}</button>{/if}
    </div>
  </form>
</dialog>

{#if renaming}
  <RenameSheet kicker={t('Bag')} title={t('Rename bag')} value={shownName} hint={t('Place, volume and weight stay as they are.')} onsave={rename} onclose={() => (renaming = false)} />
{/if}

<style>
  h2 .pen {
    display: inline-grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -8px 0 -8px 4px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    vertical-align: middle;
    cursor: pointer;
  }
  h2 .pen:hover {
    background: var(--paper-2);
  }
  .meta {
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
  .note {
    font-size: 14px;
    color: var(--ink-2);
    margin: 12px 0 0;
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
  .areas {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin: 0;
    padding: 0;
    border: 0;
  }
  .areas legend {
    margin-bottom: 4px;
  }
  .cb {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
  }
  .quiet {
    color: var(--ink-3);
  }
  .del {
    margin-left: auto;
    border-color: var(--bad);
    color: var(--bad);
  }
</style>
