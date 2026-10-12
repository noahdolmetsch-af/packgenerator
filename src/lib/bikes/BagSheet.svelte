<script>
  /**
   * v0.31.0 (Noah 9a): choose the standard bag of one place. A list that comes up from below on a
   * phone (centred on a big screen) instead of a select box: one row per bag with its volume and
   * weight, "No bag" first, the chosen one ticked. A tap saves and closes.
   *
   * options: [{ id, name, sub, unweighed, others }] (name already in the current language).
   */
  import { Scale, Plus, X } from '@lucide/svelte';
  import './velo-dlg.css';
  import { t } from '../i18n.svelte.js';

  let { place, where = '', bikeName = '', current = null, options = [], onpick, onadd, onclose } = $props();
  let dialog;

  $effect(() => {
    dialog.showModal();
  });

  function pick(id) {
    onpick?.(id);
    dialog.close();
  }
</script>

<!-- Design-Refresh P7 (V4): a soft panel of choices with a round mark, «No bag» last, «Add bag» below, «Done». -->
<dialog class="sheet vdlg bagsheet" bind:this={dialog} onclose={onclose} aria-labelledby="bagsheet-h">
  <span class="grab" aria-hidden="true"></span>
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="bagsheet-h">{place}</h2>
      <p class="vd-sub meta">{[bikeName, where, t('choose one bag')].filter(Boolean).join(' · ')}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={18} aria-hidden="true" /></button>
  </div>
  <ul class="vd-panel opts" aria-label={t('Bags for this place')}>
    {#each options as o (o.id)}
      <li>
        <button type="button" class="opt" aria-pressed={current === o.id} onclick={() => pick(o.id)}>
          <span class="dot" aria-hidden="true"></span>
          <span class="nm"><b>{o.name}</b><small class="num">{[o.sub, o.others ? t('also on {bikes}', { bikes: o.others }) : ''].filter(Boolean).join(' · ')}{#if o.unweighed}<span class="nw" title={t('not weighed')}><Scale size={13} aria-hidden="true" /><span class="sr">{t('not weighed')}</span></span>{/if}</small></span>
        </button>
      </li>
    {:else}
      <li class="none">{t('No bag for this place yet.')}</li>
    {/each}
    <li>
      <button type="button" class="opt" aria-pressed={!current} onclick={() => pick(null)}>
        <span class="dot" aria-hidden="true"></span>
        <span class="nm"><b>{t('No bag')}</b><small>{t('The place stays empty')}</small></span>
      </button>
    </li>
  </ul>
  <button type="button" class="addrow" onclick={() => (dialog.close(), onadd?.())}><span class="ib"><Plus size={18} aria-hidden="true" /></span>{t('Add bag')}</button>
  <div class="vd-foot">
    <button type="button" class="btn hi" onclick={() => dialog.close()}>{t('Done')}</button>
  </div>
</dialog>

<style>
  .grab {
    display: block;
    width: 40px;
    height: 4px;
    border-radius: 4px;
    background: var(--line);
    margin: -6px auto 12px;
  }
  .opt {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    min-height: 60px;
    padding: 8px 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .dot {
    flex: none;
    width: 20px;
    height: 20px;
    box-sizing: border-box;
    border: 2px solid var(--line-strong);
    border-radius: 50%;
    background: var(--paper);
  }
  .opt[aria-pressed='true'] .dot {
    border: 6px solid var(--hi);
  }
  @media (hover: hover) {
    .opt:hover b {
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  }
  .nm {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow-wrap: break-word;
  }
  .nm b {
    font-weight: 500;
  }
  .nm small {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .nw {
    display: inline-flex;
  }
  .none {
    padding: 12px 0;
    color: var(--ink-3);
  }
  .addrow {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    min-height: 60px;
    margin-top: 8px;
    padding: 8px 0;
    border: 0;
    border-top: 1px solid var(--line);
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .addrow .ib {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: var(--radius);
    background: var(--paper-2);
    color: var(--ink-2);
  }
  /* A phone: the list comes up from below, full width. */
  @media (max-width: 719px) {
    .bagsheet {
      width: 100%;
      max-width: 100%;
      margin: auto 0 0;
      border-radius: 20px 20px 0 0;
      max-height: 85vh;
      padding-bottom: calc(16px + env(safe-area-inset-bottom));
    }
  }
  @media (min-width: 720px) {
    .grab {
      display: none;
    }
  }
</style>
