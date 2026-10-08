<script>
  /**
   * v0.31.0 (Noah 9a): choose the standard bag of one place. A list that comes up from below on a
   * phone (centred on a big screen) instead of a select box: one row per bag with its volume and
   * weight, "No bag" first, the chosen one ticked. A tap saves and closes.
   *
   * options: [{ id, name, sub, unweighed, others }] (name already in the current language).
   */
  import { Check, Scale, Plus } from '@lucide/svelte';
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

<dialog class="sheet bagsheet" bind:this={dialog} onclose={onclose} aria-labelledby="bagsheet-h">
  <span class="grab" aria-hidden="true"></span>
  <p class="meta">{bikeName}{where ? ` · ${where}` : ''}</p>
  <h2 id="bagsheet-h" class="title">{place}</h2>
  <ul class="opts" aria-label={t('Bags for this place')}>
    <li>
      <button type="button" class="opt" aria-pressed={!current} onclick={() => pick(null)}>
        <span class="nm"><b>{t('No bag')}</b><small>{t('The place stays empty')}</small></span>
        {#if !current}<Check class="ok" size={20} aria-hidden="true" />{/if}
      </button>
    </li>
    {#each options as o (o.id)}
      <li>
        <button type="button" class="opt" aria-pressed={current === o.id} onclick={() => pick(o.id)}>
          <span class="nm"><b>{o.name}</b>{#if o.others}<small>{t('also on {bikes}', { bikes: o.others })}</small>{/if}</span>
          <span class="w num">{o.sub}{#if o.unweighed}<span class="nw" title={t('not weighed')}><Scale size={14} aria-hidden="true" /><span class="sr">{t('not weighed')}</span></span>{/if}</span>
          {#if current === o.id}<Check class="ok" size={20} aria-hidden="true" />{/if}
        </button>
      </li>
    {:else}
      <li class="none">{t('No bag for this place yet.')}</li>
    {/each}
  </ul>
  <div class="foot">
    <button type="button" class="btn" onclick={() => (dialog.close(), onadd?.())}><Plus size={16} aria-hidden="true" />{t('Add bag')}</button>
    <button type="button" class="btn" onclick={() => dialog.close()}>{t('Close')}</button>
  </div>
</dialog>

<style>
  .bagsheet {
    padding: 10px 16px 16px;
  }
  .grab {
    display: block;
    width: 40px;
    height: 4px;
    border-radius: 4px;
    background: var(--line);
    margin: 0 auto 10px;
  }
  .meta {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--ink-3);
    overflow-wrap: anywhere;
  }
  h2 {
    font-size: var(--fs-section);
    margin: 2px 0 8px;
  }
  .opts {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .opts li + li {
    border-top: 1px solid var(--line);
  }
  .opt {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 56px;
    padding: 8px 6px;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .opt[aria-pressed='true'] {
    background: var(--paper-2);
  }
  @media (hover: hover) {
    .opt:hover {
      background: var(--paper-2);
    }
  }
  .nm {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow-wrap: anywhere;
  }
  .nm b {
    font-weight: 600;
  }
  .nm small {
    font-size: 13px;
    color: var(--ink-3);
  }
  .w {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--ink-3);
    font-size: 14px;
    white-space: nowrap;
  }
  .nw {
    display: inline-flex;
    color: var(--ink-3);
  }
  .opt :global(.ok) {
    flex: none;
    color: var(--ok);
  }
  .none {
    padding: 12px 6px;
    color: var(--ink-3);
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 8px;
    margin-top: 12px;
  }
  .foot .btn {
    min-height: 44px;
  }
  /* A phone: the list comes up from below, full width. */
  @media (max-width: 719px) {
    .bagsheet {
      width: 100%;
      max-width: 100%;
      margin: auto 0 0;
      border-radius: 16px 16px 0 0;
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
