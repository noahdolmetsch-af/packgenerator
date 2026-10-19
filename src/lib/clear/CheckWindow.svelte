<script>
  /**
   * Paket Q (rule 19, Noah 19.10.2026): the one window for check-ins that come by themselves
   * (Wiedereinstieg, «Stimmt das noch?»). «Später» = in one hour again, «Heute nicht» = from tomorrow;
   * ✕, Escape and back count as «Später», nothing is lost. `main` is the button that finishes it.
   */
  import { X } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { t } from '../i18n.svelte.js';
  import '../bikes/velo-dlg.css';

  let { id, title, sub = '', main = null, onlater, onnottoday, children, section = '' } = $props();
  let dialog = $state();
  let done = false;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  function close(fn) {
    done = true;
    fn?.();
    dialog?.close();
  }
  // ✕, Escape and back: «Später»
  const away = () => {
    if (!done) {
      done = true;
      onlater?.();
    }
  };
</script>

<dialog class="sheet vdlg from-below cw" bind:this={dialog} use:backClose={away} onclose={away} aria-labelledby={`${id}-h`} data-section={section}>
  <div class="vd-head">
    <div class="vd-t">
      <h2 id={`${id}-h`}>{title}</h2>
      {#if sub}<p class="vd-sub">{sub}</p>{/if}
    </div>
    <button type="button" class="vd-x" aria-label={t('Later|window')} onclick={() => close(onlater)}><X size={20} aria-hidden="true" /></button>
  </div>
  <div class="cw-body">{@render children?.()}</div>
  <div class="vd-foot cw-foot">
    <button type="button" class="btn" onclick={() => close(onnottoday)} data-cw-nottoday>{t('Not today|window')}</button>
    <button type="button" class="btn" onclick={() => close(onlater)} data-cw-later>{t('Later|window')}</button>
    {#if main}<button type="button" class="btn hi" onclick={() => close(main.onclick)} data-cw-main>{main.label}</button>{/if}
  </div>
</dialog>

<style>
  .cw-body {
    display: grid;
    gap: var(--sp-3);
  }
  .cw-foot {
    flex-wrap: wrap;
  }
</style>
