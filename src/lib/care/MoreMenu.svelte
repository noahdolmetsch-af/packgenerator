<script>
  /** Design audit C2: one main button per row, the other answers behind •••. (v0.21.0: own component.) */
  import { t } from '../i18n.svelte.js';

  let { label, actions } = $props();
</script>

<details class="more">
  <summary aria-label={t('More answers for {label}', { label })}>•••</summary>
  <div class="more-in">{#each actions as a (a.name)}<button type="button" class="btn sm" onclick={(ev) => (ev.currentTarget.closest('details').open = false, a.run())}>{a.name}</button>{/each}</div>
</details>

<style>
  .more {
    position: relative;
  }
  .more > summary {
    list-style: none;
    cursor: pointer;
    padding: 2px 8px;
    border: 1.5px solid var(--line);
    border-radius: 4px;
    font-weight: 700;
    color: var(--ink-2);
  }
  /* v0.31.0: 44 px for a thumb. */
  @media (pointer: coarse) {
    .more > summary {
      display: grid;
      place-items: center;
      min-width: 44px;
      min-height: 44px;
    }
  }
  .more > summary::-webkit-details-marker {
    display: none;
  }
  .more-in {
    position: absolute;
    right: 0;
    top: calc(100% + 4px);
    z-index: 4;
    display: grid;
    gap: 6px;
    min-width: 170px;
    padding: 8px;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 6px;
    box-shadow: 0 6px 18px rgba(15, 46, 39, 0.18);
  }
  .btn.sm {
    padding: 3px 10px;
    font-size: var(--fs-small);
  }
</style>
