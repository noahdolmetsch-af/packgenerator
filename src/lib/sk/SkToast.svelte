<script>
  /** SK: «„Wetter und Anreise" ausgeblendet · Rückgängig» (SK6 b), for 8 s. note: { text, undo } or null. */
  import { Undo2 } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';

  let { note = $bindable(null) } = $props();
  $effect(() => {
    if (!note) return;
    const id = setTimeout(() => (note = null), 8000);
    return () => clearTimeout(id);
  });
  function undo() {
    const n = note;
    note = null;
    n?.undo?.();
  }
</script>

{#if note}
  <div class="sk-toast" role="status" data-sk-toast>
    <span>{note.text}</span>
    {#if note.undo}<button type="button" class="sk-undo" onclick={undo}><Undo2 size={16} aria-hidden="true" />{t('Undo')}</button>{/if}
  </div>
{/if}

<style>
  .sk-toast {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: 24px;
    z-index: 40;
    width: min(520px, calc(100vw - 32px));
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 6px 6px 16px;
    background: var(--brand);
    color: var(--brand-ink);
    border-radius: 12px;
    box-shadow: 0 8px 24px var(--shadow);
    font: 500 var(--fs-body)/1.35 var(--font-body);
  }
  .sk-toast span {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .sk-undo {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex: none;
    min-height: 44px;
    padding: 0 12px;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--hi-bright);
    font: 700 var(--fs-body)/1 var(--font-body);
    cursor: pointer;
  }
  @media (max-width: 719px) {
    .sk-toast {
      bottom: calc(84px + env(safe-area-inset-bottom));
    }
  }
</style>
