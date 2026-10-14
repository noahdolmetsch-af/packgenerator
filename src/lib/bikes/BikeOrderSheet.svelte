<script>
  /**
   * VS3 (Noah 14.10.2026 «1a 2b»): «Standard-Velo und Reihenfolge». The bikes in their order, the
   * first one is the standard bike (★); arrows move a bike up or down, «Make standard» puts it on
   * top. Below: what a new trip brings, the standard bike or the one ridden last.
   */
  import { backClose } from '../ui/backclose.js';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { sortBikes } from '../bikes.js';
  import { tourBike, setTourBike, moveBike, makeStandard, saveOrder } from '../tourbike.svelte.js';
  import { Star, ChevronUp, ChevronDown, Check, X } from '@lucide/svelte';
  import './velo-dlg.css';
  import './standardvelo.css';

  let { bikes, onclose } = $props();
  // svelte-ignore state_referenced_locally
  let list = $state(sortBikes(bikes));
  // svelte-ignore state_referenced_locally
  let mode = $state(tourBike.mode ?? 'standard');
  let dialog;
  $effect(() => {
    dialog.showModal();
  });
  const move = (id, dir) => (list = moveBike(list.map((b, i) => ({ ...b, order: i + 1 })), id, dir));
  const top = (id) => (list = makeStandard(list.map((b, i) => ({ ...b, order: i + 1 })), id));
  async function save() {
    await saveOrder(db, bikes, list);
    if (mode !== tourBike.mode) await setTourBike(db, mode);
    dialog.close();
  }
</script>

<dialog class="sheet vdlg bo-dlg" bind:this={dialog} use:backClose={() => dialog.close()} {onclose} aria-labelledby="bo-h">
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="bo-h">{t('Standard bike and order')}</h2>
      <p class="vd-sub">{t('This is how your bikes stand everywhere in the app.')}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={18} aria-hidden="true" /></button>
  </div>
  <ol class="vd-panel bo-list">
    {#each list as b, i (b.id)}
      <li class="bo-row">
        <span class="bo-n num">{i + 1}</span>
        <span class="bo-name">{b.name}</span>
        {#if i === 0}
          <span class="sv-pill"><Star size={13} class="sv-star" aria-hidden="true" />{t('Standard')}</span>
        {:else}
          <button type="button" class="btn sm bo-mk" onclick={() => top(b.id)}>{t('Make standard')}</button>
        {/if}
        <span class="bo-arrows">
          <button type="button" class="bo-ar" disabled={i === 0} onclick={() => move(b.id, -1)} aria-label={t('Move {name} up', { name: b.name })}><ChevronUp size={20} aria-hidden="true" /></button>
          <button type="button" class="bo-ar" disabled={i === list.length - 1} onclick={() => move(b.id, 1)} aria-label={t('Move {name} down', { name: b.name })}><ChevronDown size={20} aria-hidden="true" /></button>
        </span>
      </li>
    {/each}
  </ol>
  <h3 class="bo-h3" id="bo-mode">{t('A new trip brings')}</h3>
  <div class="bo-seg" role="group" aria-labelledby="bo-mode">
    <button type="button" aria-pressed={mode === 'standard'} onclick={() => (mode = 'standard')}>{#if mode === 'standard'}<Check size={15} aria-hidden="true" />{/if}{t('The standard bike')}</button>
    <button type="button" aria-pressed={mode === 'last'} onclick={() => (mode = 'last')}>{#if mode === 'last'}<Check size={15} aria-hidden="true" />{/if}{t('The one ridden last')}</button>
  </div>
  <div class="vd-foot">
    <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
    <button type="button" class="btn hi" onclick={save}><Check size={17} aria-hidden="true" />{t('Save')}</button>
  </div>
</dialog>

<style>
  .bo-list {
    margin: 0;
  }
  .bo-row {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 56px;
    padding: 6px 0;
  }
  .bo-n {
    flex: none;
    width: 18px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .bo-name {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .bo-mk {
    flex: none;
  }
  .bo-arrows {
    flex: none;
    display: flex;
    gap: 2px;
  }
  .bo-ar {
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
  .bo-ar:hover:not(:disabled) {
    background: var(--line);
  }
  .bo-ar:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .bo-h3 {
    margin: 18px 0 8px;
    font: 600 var(--fs-body) var(--font-body);
  }
  .bo-seg {
    display: flex;
    gap: 2px;
    padding: 3px;
    border-radius: 12px;
    background: var(--paper-2);
  }
  .bo-seg button {
    flex: 1;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
    min-height: 44px;
    padding: 6px 10px;
    border: 0;
    border-radius: 9px;
    background: none;
    color: var(--ink-2);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .bo-seg button[aria-pressed='true'] {
    background: var(--paper);
    color: var(--ink);
    box-shadow: 0 1px 3px var(--shadow);
  }
</style>
