<script>
  /**
   * v0.163.x «Pfeile und Ziehen»: ↑ and ↓ for a row of a sortable list, one place up or down. Stacked on
   * a computer, side by side with 44 px each on a phone. Goes together with SortGrip (drag).
   * i: the row's place, n: the number of rows, onstep(dir): -1 up, +1 down.
   */
  import { ChevronUp, ChevronDown } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';

  let { name = '', i = 0, n = 0, onstep } = $props();
</script>

<span class="sort-arrows">
  <button type="button" class="sort-ar" aria-label={t('Move {name} up', { name })} disabled={i === 0} onclick={() => onstep?.(-1)}><ChevronUp size={16} aria-hidden="true" /></button>
  <button type="button" class="sort-ar" aria-label={t('Move {name} down', { name })} disabled={i >= n - 1} onclick={() => onstep?.(1)}><ChevronDown size={16} aria-hidden="true" /></button>
</span>

<style>
  .sort-arrows {
    flex: none;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .sort-ar {
    display: grid;
    place-items: center;
    width: 32px;
    height: 24px; /* Klick-Rundgang 2: at least 24 px on a computer (WCAG 2.2 target size) */
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .sort-ar:disabled {
    opacity: 0.3;
    cursor: default;
  }
  @media (max-width: 719px) {
    .sort-arrows {
      flex-direction: row;
      gap: 0;
    }
    .sort-ar {
      width: 44px; /* 44 px to hit (Wächter target) */
      height: 44px;
      border: 0;
      background: none;
    }
    .sort-ar:disabled {
      opacity: 0.2;
    }
  }
</style>
