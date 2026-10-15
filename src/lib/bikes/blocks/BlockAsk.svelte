<script>
  /**
   * «Bausteine»: one question with two or three answers (mockup BS6): «For all bikes or only for this
   * one?», «Delete on all bikes too?», «Switch off anyway?». A window from below on a phone.
   * options: [{ value, label, sub }]; onpick(value); closing without a pick changes nothing.
   */
  import { X } from '@lucide/svelte';
  import { backClose } from '../../ui/backclose.js';
  import { t } from '../../i18n.svelte.js';
  import '../velo-dlg.css';

  let { title, text = '', options = [], onpick, onclose } = $props();
  let dialog;
  let picked = null;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  const pick = (v) => {
    picked = v;
    dialog.close();
  };
  const closed = () => {
    if (picked != null) onpick?.(picked);
    onclose?.();
  };
</script>

<dialog class="sheet vdlg from-below bask" bind:this={dialog} use:backClose onclose={closed} aria-labelledby="bask-h" data-testid="block-ask">
  <div class="vd-head">
    <div class="vd-t"><h2 id="bask-h">{title}</h2>{#if text}<p class="vd-sub">{text}</p>{/if}</div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <div class="opts">
    {#each options as o (o.value)}
      <button type="button" class="opt" onclick={() => pick(o.value)}><b>{o.label}</b>{#if o.sub}<small>{o.sub}</small>{/if}</button>
    {/each}
  </div>
</dialog>

<style>
  dialog.bask {
    width: min(520px, calc(100vw - 24px));
  }
  .opts {
    display: grid;
    gap: 10px;
  }
  .opt {
    display: grid;
    gap: 4px;
    min-height: 56px;
    padding: 14px 16px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .opt:hover {
    border-color: var(--ink-3);
  }
  .opt b {
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .opt small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
