<script>
  /**
   * Design-Refresh P7 «Velo» (V5–V14, Noah 12.10.2026): the head of a bike sub-page as in the mockups:
   * a quiet path back («‹ Velo › Pflege › Gravel Blau»), the page title, one quiet line, and the
   * page's buttons below (children). The last step of the path is the page itself (no link).
   * crumbs: [{ label, href }] — every step before the page; the first one gets the «‹».
   */
  import { ChevronLeft, ChevronRight } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';

  let { crumbs = [], here = '', title, sub = '', children = null } = $props();
</script>

<header class="vhead">
  {#if crumbs.length}
    <nav class="crumbs" aria-label={t('Path')}>
      {#each crumbs as c, n (n)}
        <a href={c.href}>{#if n === 0}<ChevronLeft size={14} aria-hidden="true" />{/if}{c.label}</a><ChevronRight class="sep" size={12} aria-hidden="true" />
      {/each}
      <span aria-current="page">{here || title}</span>
    </nav>
  {/if}
  <h1 class="title">{title}</h1>
  {#if sub}<p class="vsub">{sub}</p>{/if}
  {#if children}<div class="vacts">{@render children()}</div>{/if}
</header>

<style>
  .vhead {
    margin: 0 0 20px;
    min-width: 0;
  }
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
    min-width: 44px; /* a short word («Teile») still gets a full tap target */
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
  h1 {
    margin: 0;
    overflow-wrap: break-word;
  }
  .vsub {
    margin: 6px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-body);
    overflow-wrap: break-word;
  }
  .vacts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: 16px;
  }
  @media print {
    .vhead {
      display: none;
    }
  }
</style>
