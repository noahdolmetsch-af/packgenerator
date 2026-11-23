<script>
  /**
   * «Dazu nötig» (Noah 23.11.2026 «G1»): the window behind the line «Dazu nötig: Ladekabel fehlt» of the card
   * «Bereit zur Abfahrt?». Each row is a thing that belongs with something on the list and is not on it yet:
   * «Hinzufügen» puts it on the list (into its usual bag, with Undo like every change of the list), «Nicht diesmal»
   * leaves it out for this trip only. Nothing is added by itself. rows: dazu.js dazuRows(); names: itemsById.
   */
  import { X, Plus, Link2, Sparkles } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { t, nameOf } from '../i18n.svelte.js';

  let { rows = [], itemsById = {}, onadd, onskip, onclose } = $props();
  let dialog;
  $effect(() => {
    if (!dialog.open) dialog.showModal();
  });
  // the window closes by itself when the last row is gone
  $effect(() => {
    if (!rows.length && dialog?.open) dialog.close();
  });
  const names = (r) => r.forIds.map((id) => (itemsById[id] ? nameOf(itemsById[id]) : id)).join(', ');
</script>

<dialog class="sheet from-below dazu" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="dz-h" data-dazu-sheet>
  <div class="head">
    <div>
      <p class="kick">{t('Ready to go?')}</p>
      <h2 id="dz-h">{t('Needed with something on your list')}</h2>
    </div>
    <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <ul class="rows">
    {#each rows as r (r.id)}
      <li data-dazu-row={r.id}>
        <span class="tx">
          <b>{nameOf(r.item)}</b>
          <small>
            {#if r.source === 'linked'}<Link2 size={13} aria-hidden="true" /> {t('For {names}', { names: names(r) })}
            {:else}<Sparkles size={13} aria-hidden="true" /> {t('Always with {names} on your last {n} trips', { names: names(r), n: r.of })}{/if}
          </small>
        </span>
        <span class="btns">
          <button type="button" class="btn sm hi" onclick={() => onadd?.(r.id)} data-dazu-add><Plus size={16} aria-hidden="true" />{t('Add')}</button>
          <button type="button" class="btn sm" onclick={() => onskip?.(r.id)} data-dazu-skip>{t('Not this time')}</button>
        </span>
      </li>
    {/each}
  </ul>
  <p class="fine">{t('Everything is a suggestion. What belongs together you set in the window of an item, in the row «Needed with this».')}</p>
  <div class="foot"><button type="button" class="btn hi" onclick={() => dialog.close()}>{t('Done')}</button></div>
</dialog>

<style>
  .dazu {
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
    letter-spacing: 0.06em;
    text-transform: uppercase;
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
