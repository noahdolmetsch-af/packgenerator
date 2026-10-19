<script>
  /**
   * «Neuland» › «Sammlungen wählen»: every collection with its switch (on: it shows and the app looks
   * for it), the order (arrows and drag), rename (all, also the built-in ones) and delete (own ones; a
   * built-in one is switched off instead). «Eigene Sammlung» adds one, e.g. «Lieblingscafés».
   * list: collectionsOf(); counts: { id: n items }; the page does the saving.
   */
  import { X, Pencil, Trash2, Plus } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { sortable } from '../ui/sortable.js';
  import { collectionName } from './neuland.js';
  import { t, tn } from '../i18n.svelte.js';
  import '../bikes/velo-dlg.css';

  let { list = [], counts = {}, onswitch, onmove, onstep, onrename, ondelete, onadd, onclose } = $props();

  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
</script>

<dialog class="sheet vdlg nl-cols" bind:this={dialog} use:backClose {onclose} aria-labelledby="nlc-h">
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="nlc-h">{t('Choose collections')}</h2>
      <p class="vd-sub">{t('Switch on what you want to collect. Drag or use the arrows to change the order.')}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  <ul class="rows" aria-label={t('Collections')} use:sortable={{ onmove: (from, to) => onmove?.(from, to) }}>
    {#each list as c, i (c.id)}
      {@const name = collectionName(c)}
      <li class="row" class:off={!c.on} data-sort-id={c.id}>
        <SortGrip {name} onstep={(dir) => onstep?.(c.id, dir)} />
        <SortArrows {name} {i} n={list.length} onstep={(dir) => onstep?.(c.id, dir)} />
        <span class="nm">
          <b>{name}</b>
          <small>{c.builtIn ? (c.name ? t('Own name · built in') : t('Built in')) : tn(counts[c.id] ?? 0, 'Own · {n} entry', 'Own · {n} entries')}</small>
        </span>
        <button type="button" class="ib" aria-label={t('Rename: {name}', { name })} onclick={() => onrename?.(c)}><Pencil size={18} aria-hidden="true" /></button>
        {#if !c.builtIn}<button type="button" class="ib" aria-label={t('Delete: {name}', { name })} onclick={() => ondelete?.(c)}><Trash2 size={18} aria-hidden="true" /></button>{/if}
        <label class="nl-sw"><span class="nl-sr">{t('Collect {name}', { name })}</span><input type="checkbox" role="switch" checked={c.on} onchange={(e) => onswitch?.(c.id, e.currentTarget.checked)} /></label>
      </li>
    {/each}
  </ul>
  <button type="button" class="add" onclick={() => onadd?.()}><Plus size={18} aria-hidden="true" />{t('Own collection')}</button>
  <p class="hint">{t('Own collection: e.g. «Favourite cafés». Add places with a name; with a place the app finds them on your routes.')}</p>
  <div class="vd-foot"><button type="button" class="btn hi" onclick={() => dialog.close()}>{t('Done')}</button></div>
</dialog>

<style>
  .nl-cols {
    width: min(560px, calc(100vw - 24px));
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 56px;
    padding: 4px 0;
    background: var(--paper);
  }
  .row + .row {
    border-top: 1px solid var(--line);
  }
  .nm {
    flex: 1;
    min-width: 0;
    display: grid;
  }
  .nm b {
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .nm small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .off .nm b {
    color: var(--ink-3);
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: var(--r-ctl);
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .ib:hover {
    background: var(--paper-2);
  }
  .nl-sw {
    flex: none;
    display: grid;
    place-items: center;
    min-width: 56px;
    min-height: 44px;
    cursor: pointer;
  }
  .nl-sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
  .nl-sw input {
    width: 48px;
    height: 28px;
    margin: 0;
    appearance: none;
    border-radius: 99px;
    background: var(--line-strong);
    position: relative;
    cursor: pointer;
  }
  .nl-sw input::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--paper);
    transition: transform 0.15s;
  }
  .nl-sw input:checked {
    background: var(--accent);
  }
  .nl-sw input:checked::after {
    transform: translateX(20px);
  }
  .nl-sw input:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
  .add {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-height: 48px;
    margin: 10px 0 0;
    padding: 0 16px;
    border: 1px dashed var(--line-strong);
    border-radius: var(--r-ctl);
    background: none;
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .hint {
    margin: 8px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  @media (max-width: 719px) {
    .row {
      gap: 0;
    }
  }
</style>
