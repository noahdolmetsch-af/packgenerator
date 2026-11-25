<script>
  /**
   * «Neue Liste» of the summit book (Noah 24.11.2026 «alle 1-5 zusammen», idea 4): an own list to collect: a name and the
   * places in it, one name per line. Nothing is a goal; the book only counts how many of them you have. list: the list to
   * change (or null for a new one); onsave({ name, items }) saves; ondelete() removes the list (the page offers Undo).
   */
  import { tick } from 'svelte';
  import { X } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { t } from '../i18n.svelte.js';
  import '../ui/daumen.css';

  let { list = null, onsave, ondelete = null, onclose } = $props();

  // svelte-ignore state_referenced_locally
  let name = $state(list?.name ?? '');
  // svelte-ignore state_referenced_locally
  let text = $state((list?.items ?? []).join('\n'));
  let error = $state('');
  let dialog;
  let input;
  $effect(() => {
    dialog.showModal();
    tick().then(() => input?.focus());
  });

  async function save(e) {
    e?.preventDefault();
    if (!name.trim()) {
      error = t('Give it a name.');
      input?.focus();
      return;
    }
    await onsave?.({ name: name.trim(), items: text });
    dialog.close();
  }
</script>

<dialog class="sheet from-below gbl" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="gbl-h" data-list-sheet>
  <form onsubmit={save} novalidate>
    <div class="head">
      <h2 id="gbl-h">{list ? t('Change list') : t('New list')}</h2>
      <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
    </div>
    <p class="hint">{t('A list to collect, for example «My Bündner passes». The book only counts how many you have, there is no goal.')}</p>
    <label class="fld"><span class="lbl">{t('Name')}</span><input class="inp" bind:this={input} bind:value={name} maxlength="60" autocomplete="off" oninput={() => (error = '')} data-gbl-name /></label>
    <label class="fld"><span class="lbl">{t('Places, one per line')}</span><textarea class="inp" rows="6" bind:value={text} placeholder={t('e.g. the name of the pass')} data-gbl-items></textarea></label>
    {#if error}<p class="err" role="alert">{error}</p>{/if}
    <div class="foot daumen-foot">
      <button type="submit" class="btn hi" data-gbl-save>{t('Save')}</button>
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      {#if list && ondelete}<button type="button" class="btn del" onclick={() => { ondelete(); dialog.close(); }} data-gbl-delete>{t('Delete list')}</button>{/if}
    </div>
  </form>
</dialog>

<style>
  .gbl {
    width: min(480px, calc(100vw - 24px));
  }
  form {
    display: grid;
    gap: 12px;
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  h2 {
    margin: 0;
    font-size: var(--fs-section);
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
  .fld {
    display: grid;
    gap: 4px;
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }
  .fld .inp {
    width: 100%;
    min-height: 48px;
  }
  .hint,
  .err {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .err {
    color: var(--bad);
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .del {
    margin-left: auto;
  }
</style>
