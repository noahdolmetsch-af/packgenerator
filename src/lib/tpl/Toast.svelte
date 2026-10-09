<script>
  import { toast, undo } from './toast.svelte.js';
  import { t } from '../i18n.svelte.js';
</script>

{#if toast.v}
  <div class="toast" role="status">
    <span>{toast.v.text}</span>
    {#if toast.v.undo}<button type="button" class="btn sm" onclick={undo}>{t('Undo')}</button>{/if}
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
    padding: 10px 12px 10px 16px;
    background: var(--brand);
    color: var(--brand-ink);
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(15, 46, 39, 0.3);
  }
  .toast span {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
    font-size: 15px;
  }
  .toast .btn {
    background: transparent;
    color: var(--brand-ink);
    border-color: var(--brand-ink-2);
    min-height: 44px;
  }
  @media (max-width: 719px) {
    .toast {
      bottom: calc(84px + env(safe-area-inset-bottom));
    }
  }
</style>
