<script>
  import { db } from '../db.js';
  import { SLOTS, SLOT } from '../bikes.js';
  import { formatWeight } from '../gear.js';
  import { t, nameOf } from '../i18n.svelte.js';

  /** bag: the bag to edit, or null for "Add bag". Weight comes from the linked gear item. */
  let { bag, items, bags, bikes, onclose } = $props();

  // The dialog edits a copy of the bag as it was when it opened, so reading `bag` once is intended.
  // svelte-ignore state_referenced_locally
  const isNew = !bag;
  // svelte-ignore state_referenced_locally
  let draft = $state(bag ? { ...bag, volumeL: bag.volumeL ?? '', itemId: bag.itemId ?? '' } : { id: '', name: '', slot: 'seat', volumeL: '', itemId: '', pieces: 1, note: '' });
  let error = $state('');
  let dialog;

  // Gear items that can hold the weight of a bag: bags first, then bike parts.
  const linkable = $derived(items.filter((i) => i.category === 'bags' || i.category === 'bike').sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)));
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
    const d = $state.snapshot(draft);
    const record = {
      ...d,
      id: isNew ? newId(d.name) : d.id,
      name: d.name.trim(),
      volumeL: vol,
      itemId: d.itemId || null,
      pieces: Math.max(1, Number(d.pieces) || 1),
    };
    await db.transaction('rw', db.containers, db.bikes, async () => {
      await db.containers.put(record);
      // A bag that moves to another place leaves the bikes where it sat at the old place.
      if (!isNew && bag.slot !== record.slot) {
        for (const b of bikes) if (b.setup?.[bag.slot] === bag.id) await db.bikes.update(b.id, { [`setup.${bag.slot}`]: null });
      }
    });
    dialog.close();
  }

  async function remove() {
    if (!confirm(t('Delete the bag "{name}"? It is taken off every bike. The gear item stays.', { name: bag.name }))) return;
    await db.transaction('rw', db.containers, db.bikes, async () => {
      await db.containers.delete(bag.id);
      for (const b of bikes) if (b.setup?.[bag.slot] === bag.id) await db.bikes.update(b.id, { [`setup.${bag.slot}`]: null });
    });
    dialog.close();
  }
</script>

<dialog class="sheet" bind:this={dialog} {onclose} aria-labelledby="bag-h">
  <form onsubmit={save} novalidate>
    <p class="meta">{t(SLOT[draft.slot]?.name ?? 'Bag')}</p>
    <h2 id="bag-h" class="title">{isNew ? t('Add bag') : bag.name}</h2>
    <div class="grid">
      <label class="wide"><span class="lbl">{t('Name')}</span><input class="inp" bind:value={draft.name} required /></label>
      <label>
        <span class="lbl">{t('Place on the bike')}</span>
        <select class="sel" bind:value={draft.slot}>
          {#each SLOTS as s (s.key)}<option value={s.key}>{t(s.name)} ({t(s.where)})</option>{/each}
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
      <label><span class="lbl">{t('Pieces of that item')}</span><input class="inp num" type="number" min="1" bind:value={draft.pieces} /></label>
      <label class="wide"><span class="lbl">{t('Note')}</span><input class="inp" bind:value={draft.note} /></label>
    </div>
    <p class="note">
      {t('Weight:')} <b>{linked ? (linked.weightG == null ? t('not weighed yet (weigh it in Gear)') : formatWeight(linked.weightG * (Number(draft.pieces) || 1))) : t('no gear item linked')}</b>
    </p>
    <p class="err" role="alert">{error}</p>
    <div class="foot">
      <button type="submit" class="btn hi">{t('Save')}</button>
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      {#if !isNew}<button type="button" class="btn del" onclick={remove}>{t('Delete')}</button>{/if}
    </div>
  </form>
</dialog>

<style>
  .meta {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  h2 {
    font-size: 32px;
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
    color: #b42318;
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
    border-color: #b42318;
    color: #b42318;
  }
</style>
