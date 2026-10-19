<script>
  /**
   * Tour-Seite (19.10.2026): the small window of the page (correct values, choose the key figures, name a
   * joined tour). A sheet from below on a phone, a small window on a computer; ✕, Escape, back and a tap
   * beside it close it. body: the content; foot: the buttons.
   */
  import { X } from '@lucide/svelte';
  import { t } from '../../i18n.svelte.js';
  import { backClose } from '../../ui/backclose.js';

  let { title, text = '', id = 'ts-h', onclose, body, foot, data = '' } = $props();
  let dlg = $state();
  $effect(() => {
    if (dlg && !dlg.open) dlg.showModal();
  });
  export const close = () => dlg?.close();
</script>

<dialog class="sheet from-below tsheet" bind:this={dlg} use:backClose onclose={() => onclose?.()} onclick={(e) => e.target === dlg && dlg.close()} aria-labelledby={id} data-tour-sheet={data}>
  <div class="th">
    <div class="tt"><h2 {id}>{title}</h2>{#if text}<p>{text}</p>{/if}</div>
    <button type="button" class="x" aria-label={t('Close')} onclick={() => dlg.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <div class="tb">{@render body?.()}</div>
  {#if foot}<div class="tf">{@render foot()}</div>{/if}
</dialog>

<style>
  .tsheet {
    width: min(520px, calc(100vw - 24px));
    padding: 20px 22px;
  }
  .tsheet[open] {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .th {
    display: flex;
    flex: none;
    align-items: flex-start;
    gap: 12px;
  }
  .tt {
    flex: 1;
    min-width: 0;
  }
  .tt h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .tt p {
    margin: 2px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .x {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: var(--paper-2);
    color: var(--ink);
    cursor: pointer;
  }
  .tb {
    flex: 1 1 auto;
    min-height: 0;
    margin-top: 12px;
    overflow: auto;
  }
  .tf {
    display: flex;
    flex: none;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px 12px;
    margin-top: 14px;
  }
</style>
