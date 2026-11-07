<script>
  /**
   * «Zahl mit Weg» (UI-Prüfung 07.11.2026, Rang 1): a number that leads to its value in Analyse. Wrap the number (or the whole
   * tile) in it. key: the value of the Analyse catalogue, range: its period ('d', 'w', 'm', 'm3', 'y', 'all'), or day:
   * 'YYYY-MM-DD' for the sheet of one day; src: the source key (fitbit, strava, check, aktiv) for a number without an analysis, it then leads to the source page (Noah «2b»); what: the name of the number (for people who hear the page). Without a way
   * (no key, no valid day) it is a plain span, so a page can use it for every number and add the way later.
   * Any data-* attribute passes through.
   */
  import { ChevronRight } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { numHref } from '../analyse/weg.js';

  let { key = null, range = null, day = null, src = null, what = '', children, ...rest } = $props();
  const href = $derived(numHref({ key, range, day, src }));
  const toSource = $derived(!key && !(day && href?.includes('?tag=')) && !!href);
</script>

{#if href}
  <a class="numlink" {href} {...rest}>{@render children?.()}<ChevronRight class="numlink-chev" size={12} aria-hidden="true" />{#if what}<span class="numlink-sr">{toSource ? t('Open «{what}» at its source', { what }) : t('Open «{what}» in Analyse', { what })}</span>{/if}</a>
{:else}
  <span class="numlink plain" {...rest}>{@render children?.()}</span>
{/if}

<style>
  .numlink {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px; /* a number is a small thing: the tap area is not */
    color: inherit;
    text-decoration: none;
  }
  .numlink:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .numlink :global(.numlink-chev) {
    flex: none;
    color: var(--ink-3);
  }
  .numlink.plain {
    min-height: 0;
  }
  .numlink-sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
