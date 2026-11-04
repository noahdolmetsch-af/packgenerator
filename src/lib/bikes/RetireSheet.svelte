<script>
  /**
   * «Velos ausmustern» (Noah 1.11.2026 «1-5 a»): one sheet to retire a bike: why (sold, given away, broken, other),
   * the day and an optional note. Nothing is deleted; the bike moves to «Retired bikes» and can come back.
   * onsave({ reason, at, note }) saves; the caller offers Undo.
   */
  import { X } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import OptionButton from '../ui/OptionButton.svelte';
  import { localDay } from '../localday.js';
  import { t } from '../i18n.svelte.js';
  import { RETIRE_REASONS } from '../bikeretire.js';
  import { bikesHash } from '../bikes.js';
  import '../ui/daumen.css';

  let { bike, onsave, onclose } = $props();
  const WORDS = { sold: 'Sold', given: 'Given away', broken: 'Broken|reason', other: 'Other reason' };
  let reason = $state('sold');
  let at = $state(localDay());
  let note = $state('');
  let dialog;
  let busy = false;
  $effect(() => {
    dialog.showModal();
  });
  /** «Sold»: the sale listing first (Noah 03.11.2026 «3a»); the sheet closes, the listing page opens. */
  function toListing() {
    dialog.close();
    location.hash = bikesHash({ tab: 'care', view: 'sell', bike: bike.id });
  }
  async function save(e) {
    e?.preventDefault();
    if (busy) return;
    busy = true;
    try {
      await onsave?.({ reason, at, note });
      dialog.close();
    } finally {
      busy = false;
    }
  }
</script>

<dialog class="sheet from-below retire" bind:this={dialog} use:backClose={() => dialog.close()} onclose={() => onclose?.()} aria-labelledby="rt-h" data-retire-sheet>
  <form onsubmit={save} novalidate>
    <div class="head">
      <div>
        <p class="kick">{t('Bike')}</p>
        <h2 id="rt-h">{t('Retire «{name}»', { name: bike.name })}</h2>
      </div>
      <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
    </div>
    <p class="hint">{t('Nothing is deleted: trips, km, services and reviews stay. The bike leaves the lists where you choose a bike and waits under «Retired bikes». You can bring it back any time.')}</p>
    <div class="opts" role="group" aria-label={t('Why')}>
      {#each RETIRE_REASONS as r (r)}<OptionButton pressed={reason === r} label={t(WORDS[r])} onclick={() => (reason = r)} data-retire-reason={r} />{/each}
    </div>
    {#if reason === 'sold'}
      <div class="sell" data-retire-listing>
        <p><b>{t('Before you retire it')}</b><br />{t('The sale listing turns km, services and parts into a text, with photos. Everything stays saved.')}</p>
        <button type="button" class="btn" onclick={toListing} data-retire-listing-go>{t('Write the sale listing')}</button>
      </div>
    {/if}
    <label class="rlbl" for="rt-at">{t('Day')}</label>
    <input id="rt-at" class="rinp" type="date" bind:value={at} />
    <label class="rlbl" for="rt-note">{t('Note (optional)')}</label>
    <input id="rt-note" class="rinp" bind:value={note} maxlength="200" enterkeyhint="done" autocomplete="off" />
    <div class="foot daumen-foot">
      <button type="submit" class="btn hi" data-retire-save>{t('Retire bike')}</button>
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
    </div>
  </form>
</dialog>

<style>
  .retire {
    width: min(460px, calc(100vw - 24px));
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
  .hint {
    margin: 0 0 12px;
    font-size: var(--fs-small);
    line-height: 1.4;
    color: var(--ink-2);
  }
  .opts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }
  .sell {
    display: grid;
    gap: 8px;
    margin: 0 0 4px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper-2);
    font-size: var(--fs-small);
    line-height: 1.4;
  }
  .sell p {
    margin: 0;
  }
  .sell .btn {
    justify-self: start;
  }
  .rlbl {
    display: block;
    margin: 10px 0 4px;
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .rinp {
    width: 100%;
    min-height: 48px;
    box-sizing: border-box;
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
