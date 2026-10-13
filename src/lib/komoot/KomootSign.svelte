<script>
  /**
   * SN1d «In komoot öffnen» (Noah 13.10.2026, answer 3b): the trip's komoot link, quiet, with the
   * «opens elsewhere» sign. In the trip's head line and as a small sign in the Touren row. It shows
   * only when the trip's route has a komoot link (route.komoot, komoot.js); it opens in a new tab and
   * sends nothing along.
   * small: the short sign «komoot» for a list row (the label still says «In komoot öffnen: <trip>»).
   */
  import { ExternalLink } from '@lucide/svelte';
  import { komootLink } from '../komoot.js';
  import { t } from '../i18n.svelte.js';

  let { trip = null, small = false } = $props();
  const href = $derived(komootLink(trip?.route?.komoot));
</script>

{#if href}
  <a class="kms" class:small {href} target="_blank" rel="noopener noreferrer" data-komoot-open aria-label={small ? t('Open in komoot: {name}', { name: trip.title ?? '' }) : undefined}>{small ? 'komoot' : t('Open in komoot')}<ExternalLink size={14} aria-hidden="true" /><span class="sr">{t('(opens elsewhere)')}</span></a>
{/if}

<style>
  .kms {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 32px;
    color: var(--ink-2);
    text-decoration: underline;
    text-underline-offset: 3px;
    overflow-wrap: break-word;
  }
  .kms:hover {
    color: var(--ink);
  }
  .kms.small {
    min-height: 28px;
    padding: 0 8px;
    border: 1px solid var(--line);
    border-radius: 999px;
    font-size: var(--fs-tiny);
    text-decoration: none;
  }
  @media (pointer: coarse) {
    .kms,
    .kms.small {
      min-height: 44px;
    }
  }
</style>
