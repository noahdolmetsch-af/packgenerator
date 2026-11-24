<script>
  /**
   * «Tasche lernen» (Noah 23.11.2026 «3a»): the window behind the line «Usual bag: …» of the card «Ready to go?». Each row is an
   * item you keep putting into another bag than its usual one: «In future in {bag}» makes that bag its usual one (with Undo),
   * «Do not ask again» keeps the question away. Nothing changes by itself. rows: taschelernen.js learnedBags().
   */
  import { X, Briefcase } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { t, nameOf } from '../i18n.svelte.js';
  import { BAG } from '../gear.js';

  let { rows = [], onapply, onoff, onclose } = $props();
  let dialog;
  $effect(() => {
    if (!dialog.open) dialog.showModal();
  });
  // the window closes by itself when the last row is gone
  $effect(() => {
    if (!rows.length && dialog?.open) dialog.close();
  });
  const bag = (key) => (BAG[key] ? t(BAG[key]) : '');
</script>

<dialog class="sheet from-below tl" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="tl-h" data-tasche-sheet>
  <div class="head">
    <div>
      <p class="kick">{t('Ready to go?')}</p>
      <h2 id="tl-h">{t('Where you keep putting things')}</h2>
    </div>
    <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <ul class="rows">
    {#each rows as r (r.id)}
      <li data-tasche-row={r.id}>
        <span class="tx">
          <b>{nameOf(r.item)}</b>
          <small><Briefcase size={14} aria-hidden="true" /> {t('On {n} of your last {of} trips in the {bag}', { n: r.n, of: r.of, bag: bag(r.slot) })}{r.item.defaultBag && BAG[r.item.defaultBag] ? ` · ${t('now usual: {bag}', { bag: bag(r.item.defaultBag) })}` : ''}</small>
        </span>
        <span class="btns">
          <button type="button" class="btn sm hi" onclick={() => onapply?.(r.id, r.slot)} data-tasche-apply>{t('In future in the {bag}', { bag: bag(r.slot) })}</button>
          <button type="button" class="btn sm" onclick={() => onoff?.(r.id)} data-tasche-off>{t('Do not ask again')}</button>
        </span>
      </li>
    {/each}
  </ul>
  <p class="fine">{t('Everything is a suggestion. You can change the usual bag of every item in its window, in the row «Usual bag».')}</p>
  <div class="foot"><button type="button" class="btn hi" onclick={() => dialog.close()}>{t('Done')}</button></div>
</dialog>

<style>
  .tl {
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
    letter-spacing: 0.02em;
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
    border-radius: var(--r-ctl);
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
