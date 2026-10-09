<script>
  /**
   * v0.47.2 «Material-Ansichten» (Noah 9a): one dot per debriefed trip of the last 12 months, oldest
   * first: filled = used, ring = along but not used, pale = at home. The row is a picture; the label
   * says the same in words for a screen reader.
   */
  import { t } from '../i18n.svelte.js';

  let { dots = [], size = 'sm' } = $props();
  const used = $derived(dots.filter((d) => d === 'used').length);
  const unused = $derived(dots.filter((d) => d === 'unused').length);
</script>

{#if dots.length}
  <span class="dots {size}" role="img" aria-label={t('Last 12 months: used on {a}, along but not used on {b}, at home on {c} trips', { a: used, b: unused, c: dots.length - used - unused })}>
    {#each dots as d, k (k)}<i class={d}></i>{/each}
  </span>
{/if}

<style>
  .dots {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 3px;
    align-items: center;
    min-width: 0;
  }
  i {
    width: 8px;
    height: 8px;
    border-radius: 2px;
    box-sizing: border-box;
  }
  .lg {
    gap: 4px;
  }
  .lg i {
    width: 14px;
    height: 14px;
    border-radius: 3px;
  }
  .used {
    background: var(--accent);
  }
  .unused {
    border: 1.5px solid var(--accent);
    background: var(--paper);
  }
  .home {
    background: var(--paper-2);
  }
</style>
