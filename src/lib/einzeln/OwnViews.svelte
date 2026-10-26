<script>
  /**
   * Einzelidee 22 «Kategorien als Ansichten»: own views of Material (Repair, Winter, Always along …) as one
   * row of buttons in the head of Material. An item shows in several views without a copy (item.ownViews,
   * ticked in the item window). «Edit» opens a sheet: add, rename, sort (arrows and drag) and delete a view;
   * deleting asks where its items go («Without this view» first, the items always stay), then Undo.
   *
   * items: the inventory; mine: the open own view (id) or ''; onpick(id | ''): open or close a view.
   */
  import { liveQuery } from 'dexie';
  import { X, Pencil } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, tn } from '../i18n.svelte.js';
  import { backClose } from '../ui/backclose.js';
  import { saveFailed } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import KindsEdit from '../ruhig/KindsEdit.svelte';
  import { kindName } from '../ruhig/kinds.js';
  import { VIEWS_KEY, ownViewsOf, ownViewCounts, dropOwnView } from './material.js';

  let { items = [], mine = '', onpick = () => {}, edit = false } = $props();
  const q = liveQuery(() => db.settings.get(VIEWS_KEY));
  const views = $derived(ownViewsOf($q?.value));
  const counts = $derived(ownViewCounts(items, views));
  // svelte-ignore state_referenced_locally
  let editing = $state(edit);
  let dialog = $state();
  $effect(() => {
    if (editing && dialog && !dialog.open) dialog.showModal();
  });

  async function save(next) {
    try {
      await db.settings.put({ key: VIEWS_KEY, value: next });
    } catch (err) {
      offerDone(saveFailed(err));
    }
  }
  /** Delete a view: its items leave it (or go to `to`); returns the snapshot for Undo. */
  async function remove(id, to) {
    const before = { views: $state.snapshot(views), items: (await db.items.toArray()).filter((i) => (i.ownViews ?? []).includes(id)) };
    await db.transaction('rw', db.items, db.settings, async () => {
      const moved = dropOwnView(before.items, id, to);
      if (moved.length) await db.items.bulkPut(moved);
      await db.settings.put({ key: VIEWS_KEY, value: views.filter((v) => v.id !== id) });
    });
    if (mine === id) onpick('');
    return before;
  }
  async function undo(snap) {
    await db.transaction('rw', db.items, db.settings, async () => {
      if (snap.items.length) await db.items.bulkPut(snap.items);
      await db.settings.put({ key: VIEWS_KEY, value: snap.views });
    });
    offerDone(t('Changed back.'));
  }
</script>

<div class="ov" role="group" aria-labelledby="ov-h" data-own-views>
  <span class="ovh" id="ov-h">{t('Own views')}</span>
  {#each views as v (v.id)}
    <button type="button" class="ovb" aria-pressed={mine === v.id} onclick={() => onpick(mine === v.id ? '' : v.id)} data-own-view={v.id}>{kindName(v, t)} <small class="num">{counts[v.id] ?? 0}</small></button>
  {/each}
  <button type="button" class="ovb edit" onclick={() => (editing = true)} aria-label={t('Edit own views')} data-own-views-edit><Pencil size={14} aria-hidden="true" />{t('Edit|views')}</button>
</div>

{#if editing}
  <dialog class="sheet from-below ov-sheet" bind:this={dialog} use:backClose={() => dialog.close()} onclose={() => (editing = false)} aria-labelledby="ovs-h">
    <div class="head">
      <h2 id="ovs-h">{t('Own views')}</h2>
      <button type="button" class="x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
    </div>
    <p class="lead">{t('An item can be in several views, without a copy. Tick the views in the item window under «Name, brand, note».')}</p>
    <KindsEdit
      kinds={views}
      count={(id) => counts[id] ?? 0}
      what={(n) => tn(n, '{n} item', '{n} items')}
      none={t('Without this view')}
      noneHint={t('The items stay in Material, only the view goes.')}
      label={t('New view, e.g. Bike trip with the kids')}
      onsave={save}
      ondelete={remove}
      onundo={undo}
    />
  </dialog>
{/if}

<style>
  .ov {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 6px 0 0;
  }
  .ovh {
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
    margin-right: 2px;
  }
  .ovb {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 4px 12px;
    border-radius: 999px;
    border: 1px solid var(--line-strong);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .ovb[aria-pressed='true'] {
    background: var(--accent-soft);
    border-color: var(--accent);
    font-weight: 600;
  }
  .ovb small {
    color: var(--ink-2);
  }
  .ovb.edit {
    border-style: dashed;
    color: var(--ink-2);
  }
  .ov-sheet {
    max-width: 560px;
    padding: 20px;
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-section) / 1.25 var(--font-body);
  }
  .x {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink);
    cursor: pointer;
  }
  .lead {
    margin: 8px 0 12px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  /* the list of KindsEdit (its look lives in ruhig.css, which this page does not load) */
  .ov-sheet :global(.rh-list) {
    list-style: none;
    margin: 0 0 10px;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .ov-sheet :global(.rh-list > li) {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
  }
  .ov-sheet :global(.rh-grow) {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .ov-sheet :global(.rh-list small) {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ov-sheet :global(.rh-x) {
    flex: none;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
    border-radius: 50%;
  }
  .ov-sheet :global(.rh-row) {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .ov-sheet :global(.rh-row > .inp) {
    flex: 1 1 180px;
    min-width: 0;
  }
</style>
