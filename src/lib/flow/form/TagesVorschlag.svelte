<script>
  /**
   * «Tagesvorschlag» (Noah 24.11.2026 «1-5a», Impeccable ganze App, Auswerten F2): one line under the answer of the day,
   * what fits to it: rest → recovery, easy → trip tips, normal → the weekly plan, hard → which mountain. It sits outside
   * the link of the card (no link in a link) and can be switched off with «Performance tips» (suggest.on.performance).
   */
  import { ChevronRight } from '@lucide/svelte';
  import { suggest, watchSuggest } from '../../clear/suggest.svelte.js';
  import { t } from '../../i18n.svelte.js';

  let { level } = $props();
  watchSuggest();
  const tv = $derived(
    level === 'rest'
      ? { text: t('Rest today?'), link: t('Tick off recovery'), href: '#/flow/rest' }
      : level === 'easy'
        ? { text: t('Fancy an easy ride?'), link: t('Trip tips'), href: '#/trips/dreams' }
        : level === 'normal'
          ? { text: t('What is in the plan today'), link: t('Weekly plan'), href: '#/flow/wochenplan' }
          : level === 'hard'
            ? { text: t('Today feels good. Which mountain calls?'), link: t('Trip tips'), href: '#/trips/dreams' }
            : null,
  );
</script>

{#if tv && suggest.on.performance}
  <p class="tv" data-day-suggest={level}>
    <span>{tv.text}</span>
    <a href={tv.href} data-day-suggest-link>{tv.link}<ChevronRight size={16} aria-hidden="true" /></a>
  </p>
{/if}

<style>
  .tv {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0 var(--sp-3);
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.4;
  }
  .tv a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--ink);
    font-weight: 500;
    text-decoration: none;
  }
</style>
