<script>
  /** v0.72.0 «Feinschliff»: the toast of rename.svelte.js, «Renamed to "…" · Undo». */
  import { renamed, undoRename } from './rename.svelte.js';
  import { t } from '../i18n.svelte.js';
</script>

{#if renamed.v}
  <div class="rtoast" role="status">
    <span>{renamed.v.text}</span>
    {#if renamed.v.undo}<button type="button" class="undo" onclick={undoRename}>{t('Undo')}</button>{/if}
  </div>
{/if}

<style>
  .rtoast {
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
    font: 500 15px/1.35 var(--font-body);
  }
  .rtoast span {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .undo {
    flex: none;
    min-height: 44px;
    padding: 0 12px;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--hi-bright);
    font: 700 15px/1 var(--font-body);
    cursor: pointer;
  }
  @media (max-width: 719px) {
    .rtoast {
      bottom: calc(84px + env(safe-area-inset-bottom));
    }
  }
</style>
