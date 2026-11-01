<script>
  /**
   * F07 (robot test 1.11.2026): when the map pictures do not load (no internet, or the map server does not answer)
   * the ground stayed empty and nothing said why. After 3 failed tiles and none loaded, one quiet line says so;
   * the lines and places on top are still there. bad / ok: counted by the map from the tiles' error and load events.
   */
  import { t } from '../i18n.svelte.js';
  let { bad = 0, ok = 0 } = $props();
  const off = $derived(bad >= 3 && ok === 0);
</script>

{#if off}
  <p class="tile-note" role="status" data-tile-note>{t('The map picture is not loading right now. Your lines and places are still here.')}</p>
{/if}

<style>
  .tile-note {
    position: absolute;
    left: 8px;
    right: 8px;
    bottom: 28px;
    margin: 0;
    padding: 6px 10px;
    border-radius: 8px;
    background: var(--paper);
    color: var(--ink-2);
    font: 500 var(--fs-small) / 1.3 var(--font-body);
    box-shadow: var(--card-shadow);
    pointer-events: none;
    z-index: 3;
  }
</style>
