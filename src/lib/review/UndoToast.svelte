<script>
  /**
   * SN2+ SN2f: the short note at the bottom after «Aus Vorlage», with «Rückgängig» (the same look as the
   * template pages' note, tpl/Toast.svelte). text: the sentence; onundo: puts it back.
   */
  import { Check, Undo2 } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';

  let { text, onundo } = $props();
</script>

<div class="toast" role="status">
  <Check size={18} aria-hidden="true" />
  <span>{text}</span>
  <button type="button" class="undo" onclick={onundo}><Undo2 size={16} aria-hidden="true" />{t('Undo')}</button>
</div>

<style>
  .toast {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: 24px;
    z-index: 30;
    width: min(520px, calc(100vw - 32px));
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 8px 8px 16px;
    background: var(--brand);
    color: var(--brand-ink);
    border-radius: 12px;
    box-shadow: 0 8px 24px var(--shadow);
    box-sizing: border-box;
  }
  .toast span {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
    font-size: var(--fs-body);
  }
  .undo {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 10px;
    border: 0;
    border-radius: var(--r-ctl);
    background: transparent;
    color: var(--hi-bright);
    font: 600 var(--fs-body) var(--font-body);
    cursor: pointer;
  }
  .undo:focus-visible {
    outline: 3px solid var(--focus-on-dark);
    outline-offset: 0;
  }
  @media (max-width: 719px) {
    .toast {
      bottom: calc(84px + env(safe-area-inset-bottom));
    }
  }
</style>
