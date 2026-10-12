<script>
  /**
   * v0.99.0 Design-Refresh R3 (G3 «Rückgängig-Hinweis»): a dark note at the bottom with a tick, the
   * sentence and «Rückgängig» as a light word with its arrow, not a framed button.
   */
  import { Check, Undo2 } from '@lucide/svelte';
  import { toast, undo } from './toast.svelte.js';
  import { t } from '../i18n.svelte.js';
</script>

{#if toast.v}
  <div class="toast" role="status">
    <Check size={18} aria-hidden="true" />
    <span>{toast.v.text}</span>
    {#if toast.v.undo}<button type="button" class="undo" onclick={undo}><Undo2 size={16} aria-hidden="true" />{t('Undo')}</button>{/if}
  </div>
{/if}

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
  .undo:hover {
    background: color-mix(in srgb, var(--brand-ink) 10%, transparent);
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
