<script>
  /**
   * Gruss B: one small window for one button of the greeting: its name and (for feelings) its emoji.
   * label, emoji: as they are now; withEmoji: the emoji field is there; onsave({ label, emoji }); onclose.
   */
  import { X } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { t } from '../i18n.svelte.js';
  import '../bikes/velo-dlg.css';

  let { title, label = '', emoji = '', withEmoji = false, onsave, onclose } = $props();
  // svelte-ignore state_referenced_locally
  let name = $state(label);
  // svelte-ignore state_referenced_locally
  let icon = $state(emoji);
  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  function save(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onsave?.({ label: name, emoji: icon });
    dialog.close();
  }
</script>

<dialog class="sheet vdlg bs" bind:this={dialog} use:backClose {onclose} aria-labelledby="bs-h" data-button-sheet>
  <div class="vd-head">
    <div class="vd-t"><h2 id="bs-h">{title}</h2></div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <form onsubmit={save}>
    <label class="bs-lbl" for="bs-name">{t('Name|button')}</label>
    <input id="bs-name" class="inp" bind:value={name} maxlength="24" data-button-name />
    {#if withEmoji}
      <label class="bs-lbl" for="bs-emoji">{t('Emoji (optional)')}</label>
      <input id="bs-emoji" class="inp emo" bind:value={icon} maxlength="8" data-button-emoji />
    {/if}
    <div class="vd-foot">
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      <button type="submit" class="btn hi" disabled={!name.trim()} data-button-save>{t('Save')}</button>
    </div>
  </form>
</dialog>

<style>
  .bs-lbl {
    display: block;
    margin: 10px 0 6px;
    font: 600 var(--fs-small) / 1.3 var(--font-body);
  }
  .emo {
    max-width: 8em;
  }
</style>
