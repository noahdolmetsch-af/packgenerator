<script>
  /**
   * AB1 «Deine Abfragen»: tapping a question's interval opens this small choice (from below on a
   * phone): how often and when. «Speichern» keeps it, «Abbrechen» leaves it as it was.
   */
  import { X } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { t } from '../i18n.svelte.js';
  import { everyOf } from '../abfragen.js';
  import IntervalPick from './IntervalPick.svelte';
  import '../bikes/velo-dlg.css';
  import './ab.css';

  let { title, every, onsave, onclose } = $props();
  let dialog;
  // svelte-ignore state_referenced_locally
  let draft = $state(everyOf(every));
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  function save() {
    onsave?.(everyOf(draft));
    dialog.close();
  }
</script>

<dialog class="sheet vdlg from-below" bind:this={dialog} use:backClose {onclose} aria-labelledby="ivs-h">
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="ivs-h">{t('How often to ask?')}</h2>
      <p class="vd-sub">{title}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <IntervalPick bind:every={draft} idp="ivs" />
  <div class="vd-foot">
    <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
    <button type="button" class="btn hi" onclick={save} data-iv-save>{t('Save')}</button>
  </div>
</dialog>

