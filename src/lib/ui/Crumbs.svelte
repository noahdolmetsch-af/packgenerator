<script>
  /**
   * P3b «Bedienregeln», I2a (Noah 15.10.2026 «2a»): the path back is the full path everywhere
   * («‹ Ich › Darstellung»), the same look as VeloHead and PathHead; for pages that had only «‹ Ich»
   * or «← Vorlagen». crumbs: [{ label, href }], every step before the page; here: the page itself.
   */
  import { ChevronLeft, ChevronRight } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';

  let { crumbs = [], here = '' } = $props();
</script>

<nav class="crumbs back" aria-label={t('Path')}>
  {#each crumbs as c, n (n)}
    <a href={c.href}>{#if n === 0}<ChevronLeft size={14} aria-hidden="true" />{/if}{c.label}</a><ChevronRight class="sep" size={12} aria-hidden="true" />
  {/each}
  <span aria-current="page">{here}</span>
</nav>

<style>
  .crumbs {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 2px;
    margin: 0 0 4px;
    font-size: var(--fs-small);
    color: var(--ink);
  }
  .crumbs a {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    color: var(--ink-3);
    text-decoration: none;
  }
  .crumbs a:visited {
    color: var(--ink-3);
  }
  .crumbs a:hover {
    color: var(--ink);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  /* 44 px tap area around the small words, without moving the layout. */
  .crumbs a::after {
    content: '';
    position: absolute;
    left: -4px;
    right: -4px;
    top: 50%;
    height: 44px;
    transform: translateY(-50%);
  }
  .crumbs :global(.sep) {
    color: var(--ink-3);
  }
  .crumbs span {
    overflow-wrap: break-word;
    min-width: 0;
  }
  @media print {
    .crumbs {
      display: none;
    }
  }
</style>
