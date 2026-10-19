<script>
  /**
   * Paket T «Freie Zeit»: the one window to add or change something on its pages (an impulse, an entry,
   * a big maybe …). On a phone it comes from below. title: the heading; onsave(): saves and may return
   * false to stay open or a text to show as the error; ondelete: shows «Delete» (asks first, the caller
   * offers Undo); children: the fields. Escape, back and ✕ close without saving (nothing is half saved).
   */
  import { X, Trash2, Check } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { t } from '../i18n.svelte.js';
  import '../bikes/velo-dlg.css';

  let { title, sub = '', saveLabel = '', onsave, ondelete = null, onclose, children } = $props();
  let dialog;
  let error = $state('');
  let busy = $state(false);
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  async function save(e) {
    e?.preventDefault();
    if (busy) return;
    busy = true;
    try {
      const r = await onsave?.();
      if (r === false) return;
      if (typeof r === 'string') {
        error = r;
        return;
      }
      dialog.close();
    } finally {
      busy = false;
    }
  }
  async function del() {
    const gone = await ondelete?.();
    if (gone !== false) dialog.close();
  }
</script>

<dialog class="sheet vdlg fzs" bind:this={dialog} use:backClose {onclose} aria-labelledby="fzs-h">
  <form class="fzs-form" onsubmit={save}>
    <div class="vd-head">
      <div class="vd-t">
        <h2 id="fzs-h">{title}</h2>
        {#if sub}<p class="vd-sub">{sub}</p>{/if}
      </div>
      <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
    </div>
    <div class="fzs-body">{@render children?.()}</div>
    {#if error}<p class="fzs-err" role="alert">{error}</p>{/if}
    <div class="vd-foot">
      {#if ondelete}<button type="button" class="btn del" onclick={del} data-sheet-delete><Trash2 size={16} aria-hidden="true" />{t('Delete')}</button>{/if}
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      <button type="submit" class="btn hi" disabled={busy} data-sheet-save><Check size={16} aria-hidden="true" />{saveLabel || t('Save')}</button>
    </div>
  </form>
</dialog>

<style>
  .fzs-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .fzs-body {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 62vh;
    overflow-y: auto;
  }
  .fzs-err {
    margin: 0;
    color: var(--bad);
    font-size: var(--fs-small);
  }
</style>
