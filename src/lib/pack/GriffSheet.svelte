<script>
  /**
   * «Griffbereit» (Noah 23.11.2026 «G3»): the window behind the line «Within reach: …» of the card «Bereit zur
   * Abfahrt?». Each row is a thing you reach for while riding (food, rain gear, or one you marked) that lies deep
   * in a bag: «Move» puts it into a bag a hand reaches (Undo like every change of the list), «Nicht diesmal» leaves
   * it where it is for this trip only. Nothing moves by itself. rows: griff.js griffRows(); the move is Pack's applyRows.
   */
  import { X, ArrowRight, Hand } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { t, nameOf } from '../i18n.svelte.js';
  import { placeKey } from '../bagsuggest.js';

  let { rows = [], itemsById = {}, bags = [], onapply, onskip, onclose } = $props();
  let dialog;
  $effect(() => {
    if (!dialog.open) dialog.showModal();
  });
  // the window closes by itself when the last row is gone
  $effect(() => {
    if (!rows.length && dialog?.open) dialog.close();
  });
  const bagName = (r) => bags.find((b) => b.id === r.bagId)?.name ?? t(placeKey(r.to));
  const fromName = (r) => t(placeKey(r.from));
  const WHY = { marked: 'You marked it as «Within reach»', food: 'Food is eaten on the way', rain: 'Rain gear is needed fast' };
</script>

<dialog class="sheet from-below griff" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="gr-h" data-griff-sheet>
  <div class="head">
    <div>
      <p class="kick">{t('Ready to go?')}</p>
      <h2 id="gr-h">{t('Within reach while riding')}</h2>
    </div>
    <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <ul class="rows">
    {#each rows as r (r.itemId)}
      <li data-griff-row={r.itemId}>
        <span class="tx">
          <b>{itemsById[r.itemId] ? nameOf(itemsById[r.itemId]) : r.itemId}</b>
          <small><Hand size={13} aria-hidden="true" /> {t(WHY[r.why] ?? WHY.marked)} · {fromName(r)} <ArrowRight size={13} aria-hidden="true" /> {bagName(r)}</small>
        </span>
        <span class="btns">
          <button type="button" class="btn sm hi" onclick={() => onapply?.([r])} data-griff-move>{t('Move to {bag}', { bag: bagName(r) })}</button>
          <button type="button" class="btn sm" onclick={() => onskip?.(r.itemId)} data-griff-skip>{t('Not this time')}</button>
        </span>
      </li>
    {/each}
  </ul>
  <p class="fine">{t('Everything is a suggestion. What you reach for you set in the window of an item, in the row «Within reach».')}</p>
  <div class="foot"><button type="button" class="btn hi" onclick={() => dialog.close()}>{t('Done')}</button></div>
</dialog>

<style>
  .griff {
    width: min(480px, calc(100vw - 24px));
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin: 0 0 10px;
  }
  .kick {
    margin: 0;
    font-size: var(--fs-small);
    font-weight: 700;
    color: var(--ink-3);
  }
  h2 {
    margin: 2px 0 0;
    font-size: var(--fs-section);
    overflow-wrap: break-word;
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -6px -6px 0 0;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .rows li {
    display: grid;
    gap: 8px;
    padding: 12px 0;
    border-top: 1px solid var(--line);
    overflow-wrap: break-word;
  }
  .rows li:first-child {
    border-top: 0;
  }
  .tx {
    display: grid;
    gap: 2px;
  }
  small {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .btns {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .btns .btn {
    min-height: 44px;
  }
  .fine {
    margin: 8px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .foot {
    display: flex;
    gap: 8px;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  @media (max-width: 719px) {
    .foot .btn.hi {
      flex: 1;
    }
  }
</style>
