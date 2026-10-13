<script>
  /**
   * v0.127.0 A-U1 «Update-Hinweis als Banner statt Fenster» (mockup A-U1, Noah 13.10.2026 «A-U1–A-U5
   * freigeben», answer 3a): after an update a calm banner on top of Today instead of a window, so Today can
   * be used at once. «New in 0.127», the titles of the versions since the last visit, «View» opens Ich ›
   * Was ist neu (the whole news stay there), × closes it until the next update; after BANNER_DAYS days it
   * goes by itself (wasneu.js messageOn). It replaces the window of W1 (0.118.0, know/NewsSheet.svelte).
   */
  import { shortVersion } from '../whatsnew.js';
  import { NEWS_HREF } from './wasneu.js';
  import { writeMute } from './wasneuStore.js';
  import { t } from '../i18n.svelte.js';
  import { X } from '@lucide/svelte';

  let { entries = [], onclose } = $props();
  const e = $derived(entries[0] ?? null);
  const titles = $derived(entries.slice(0, 3).map((x) => t(x.title)).filter(Boolean).join(' · '));
  // × and «View» both close it for this version (until the next update; back on under Ich › Was ist neu)
  function done() {
    if (e) writeMute(e.version);
    onclose?.();
  }
</script>

{#if e}
  <aside class="nbanner" aria-labelledby="nb-h" data-news-banner>
    <div class="nb-t">
      <h2 id="nb-h">{t('New in {v}|banner', { v: shortVersion(e.version) })}</h2>
      {#if titles}<p>{titles}{entries.length > 3 ? ' …' : ''}</p>{/if}
    </div>
    <a class="nb-go" href={NEWS_HREF} onclick={done}>{t('View|news')}</a>
    <button type="button" class="nb-x" aria-label={t('Close the hint')} onclick={done}><X size={20} aria-hidden="true" /></button>
  </aside>
{/if}

<style>
  .nbanner {
    display: flex;
    align-items: center;
    gap: var(--sp-2) var(--sp-3);
    margin: 0 0 var(--sp-4);
    padding: 10px 6px 10px var(--sp-4);
    border-radius: var(--radius-card);
    background: var(--ok-soft);
    color: var(--ink);
  }
  .nb-t {
    flex: 1 1 auto;
    min-width: 0;
  }
  h2 {
    margin: 0;
    font-size: var(--fs-body);
    font-weight: 600;
  }
  p {
    margin: 2px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .nb-go {
    flex: none;
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 6px;
    color: var(--ink);
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .nb-x {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .nb-x:hover {
    background: color-mix(in srgb, var(--ink) 8%, transparent);
  }
</style>
