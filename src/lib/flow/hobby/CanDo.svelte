<script>
  /** Hobby pages: «Diese Seite kann» at the bottom, 6–8 short lines (instead of «Was neu ist»). items: English keys. */
  import { Check } from '@lucide/svelte';
  import { t } from '../../i18n.svelte.js';
  let { items = [] } = $props();
</script>

<section class="surf cando" aria-labelledby="cando-h">
  <h2 id="cando-h" class="zlabel ch">{t('This page can')}</h2>
  <ul>
    {#each items as k (k)}<li><Check size={16} aria-hidden="true" /><span>{t(k)}</span></li>{/each}
  </ul>
</section>

<style>
  .cando {
    padding: 16px 18px;
  }
  .ch {
    margin-top: 0;
    color: var(--pc);
  }
  ul {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 6px 24px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  li :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--accent);
  }
</style>
