<script>
  /**
   * «Rückmeldungen» (Noah 19.10.2026 «1a 2a 3a 4b»): ONE question before deleting, the same in every
   * window, instead of the browser's grey confirm(). Opened by askDelete() in ask.js, never by hand.
   * On a phone it comes from below, on a computer it is a small window. Escape, back, ✕ and a tap
   * beside it mean «Cancel». A thing that is still used somewhere offers «Archive» first (1a).
   * After «Delete» the caller shows «"…" deleted. · Undo» for 4 s (rename.svelte.js offerDone).
   */
  import { tick } from 'svelte';
  import { X, Trash2, Archive } from '@lucide/svelte';
  import { backClose } from './backclose.js';
  import { t } from '../i18n.svelte.js';
  import './daumen.css';

  let { title, text = '', lines = [], label = '', archive = '', del = true, ondone } = $props();

  let dialog;
  let archBtn = $state();
  let cancelBtn = $state();
  let answer = null;

  $effect(() => {
    dialog.showModal();
    tick().then(() => (archBtn ?? cancelBtn)?.focus()); // the safe choice has the focus, never «Delete»
  });
  const pick = (a) => {
    answer = a;
    dialog.close();
  };
</script>

<dialog class="sheet from-below askdel" bind:this={dialog} use:backClose onclose={() => ondone?.(answer)} aria-labelledby="askdel-h" aria-describedby="askdel-t" data-testid="ask-delete">
  <div class="head">
    <h2 id="askdel-h">{title}</h2>
    <button type="button" class="ib" aria-label={t('Close')} onclick={() => pick(null)}><X size={20} aria-hidden="true" /></button>
  </div>
  <div id="askdel-t">
    {#if text}<p class="txt">{text}</p>{/if}
    {#if lines.length}<ul class="names">{#each lines as l, i (i)}<li>{l}</li>{/each}</ul>{/if}
  </div>
  <div class="foot daumen-foot">
    {#if archive}
      <button type="button" class="btn hi" bind:this={archBtn} onclick={() => pick('archive')}><Archive size={16} aria-hidden="true" />{archive}</button>
      {#if del}<button type="button" class="btn del" onclick={() => pick('delete')}><Trash2 size={16} aria-hidden="true" />{label || t('Delete')}</button>{/if}
    {:else}
      <button type="button" class="btn del" onclick={() => pick('delete')}><Trash2 size={16} aria-hidden="true" />{label || t('Delete')}</button>
    {/if}
    <button type="button" class="btn" bind:this={cancelBtn} onclick={() => pick(null)}>{t('Cancel')}</button>
  </div>
</dialog>

<style>
  .askdel {
    width: min(460px, calc(100vw - 24px));
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
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
  .txt {
    margin: 8px 0 0;
    line-height: 1.45;
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .names {
    margin: 8px 0 0;
    padding-left: 20px;
    max-height: 30vh;
    overflow: auto;
    color: var(--ink-2);
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .foot .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .btn.del {
    color: var(--bad);
    border-color: var(--bad);
  }
  @media (max-width: 719px) {
    .foot .btn {
      flex: 1 1 auto;
      justify-content: center;
    }
  }
</style>
