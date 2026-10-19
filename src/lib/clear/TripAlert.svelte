<script>
  /**
   * Paket Q Zusatz 1 (Noah 19.10.2026 «1-3 alle a»): a calm line on a planned trip when a weather warning
   * touches its days and place, or the avalanche danger is high on a ski tour today or tomorrow
   * (news.js tripAlerts). Only for a trip from today up to 5 days ahead; nothing when all is calm.
   */
  import { liveQuery } from 'dexie';
  import { untrack } from 'svelte';
  import { TriangleAlert } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { ALERTS_KEY, alertsOf, tripAlerts, tripSoon } from './news.js';
  import { news, loadAlerts } from './news.svelte.js';

  let { trip } = $props();
  const today = localDay();
  const prefsQ = liveQuery(() => db.settings.get(ALERTS_KEY));
  // only once Ich › Hinweise is set up (opened once): before that a trip talks to no one
  const soon = $derived(!!$prefsQ?.value && tripSoon(trip, today));
  let asked = false;
  $effect(() => {
    if (soon && !asked) {
      asked = true;
      untrack(() => loadAlerts());
    }
  });
  const lines = $derived(soon ? tripAlerts({ trip, warnings: news.alerts?.warnings ?? [], avalanche: news.alerts?.avalanche ?? null, prefs: alertsOf($prefsQ?.value), today }) : []);
</script>

{#each lines as l (l.key)}
  <p class="trip-alert" role="status" data-trip-alert={l.key}>
    <TriangleAlert size={16} aria-hidden="true" />
    <span>{t(l.text, l.vars)}</span>
    <a href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel={l.href.startsWith('http') ? 'noopener' : undefined}>{t('Read more|alert')}</a>
  </p>
{/each}

<style>
  .trip-alert {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 var(--sp-2);
    padding: 8px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-card);
    background: var(--paper);
    font-size: var(--fs-small);
  }
  .trip-alert span {
    flex: 1;
  }
</style>
