<script>
  /**
   * SN3/SN5 «Seiten neu» (Noah 13.10.2026 «ich gebe alle bild mockups frei»): the head of a page as in the
   * mockups: a quiet path back («‹ Touren › Vorlagen»), the title, one quiet line, and the page's buttons
   * (`children`: at most one main button) right of the title on a computer, under it on a phone.
   * crumbs: [{ label, href }], every step before the page; the first gets the «‹». The last step of the
   * path is the page itself (`here`, else the title). `title` may be replaced by the snippet `heading`
   * (e.g. an inline rename field); `extra` is a snippet under the quiet line (a pill, a status).
   */
  import { ChevronLeft, ChevronRight } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';

  let { crumbs = [], here = '', title, sub = '', heading = null, extra = null, children = null } = $props();
</script>

<header class="phead">
  {#if crumbs.length}
    <nav class="pcrumbs" aria-label={t('Path')}>
      {#each crumbs as c, n (n)}
        <a href={c.href}>{#if n === 0}<ChevronLeft size={14} aria-hidden="true" />{/if}{c.label}</a><ChevronRight class="psep" size={12} aria-hidden="true" />
      {/each}
      <span aria-current="page">{here || title}</span>
    </nav>
  {/if}
  <div class="prow">
    <div class="pleft">
      {#if heading}{@render heading()}{:else}<h1 class="title ptitle" tabindex="-1" data-page-title>{title}</h1>{/if}
      {#if sub}<p class="psub">{sub}</p>{/if}
      {@render extra?.()}
    </div>
    {#if children}<div class="pacts">{@render children()}</div>{/if}
  </div>
</header>

<style>
  .phead {
    margin: 0 0 var(--sp-5);
    min-width: 0;
  }
  .pcrumbs {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 2px;
    margin: 0 0 4px;
    font-size: var(--fs-small);
    color: var(--ink);
  }
  .pcrumbs a {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    color: var(--ink-3);
    text-decoration: none;
  }
  .pcrumbs a:visited {
    color: var(--ink-3);
  }
  .pcrumbs a:hover {
    color: var(--ink);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  /* 44 px tap area around the small words, without moving the layout */
  .pcrumbs a::after {
    content: '';
    position: absolute;
    left: -4px;
    right: -4px;
    top: 50%;
    height: 44px;
    transform: translateY(-50%);
  }
  .pcrumbs :global(.psep) {
    color: var(--ink-3);
  }
  .pcrumbs span {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .prow {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--sp-3) var(--sp-4);
  }
  .pleft {
    flex: 1 1 320px;
    min-width: 0;
  }
  .ptitle {
    margin: 0;
  }
  .psub {
    margin: 4px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-body);
    overflow-wrap: break-word;
  }
  .pacts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2);
  }
  @media (max-width: 719px) {
    .prow {
      flex-direction: column;
      align-items: stretch;
    }
    .pleft {
      flex: none;
    }
  }
  @media print {
    .pcrumbs,
    .pacts {
      display: none;
    }
  }
</style>
