<script>
  /**
   * Paket Q #148 (Noah 19.10.2026 «1a»): one small line on top of Today, only when something important
   * concerns you (news.js importantOf): an orange or red weather warning in your region, avalanche
   * danger 3+ in winter, the season start or end of a watched pass. A tap opens Ich › Hinweise.
   * «✕» hides it for today.
   */
  import { liveQuery } from 'dexie';
  import { TriangleAlert, X } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { ALERTS_KEY, alertsOf, importantOf } from './news.js';
  import { news, loadAlerts } from './news.svelte.js';

  const HIDE = 'pg-alertline-hidden';
  let hidden = $state('');
  try {
    hidden = localStorage.getItem(HIDE) ?? '';
  } catch {
    /* private mode */
  }
  const prefsQ = liveQuery(() => db.settings.get(ALERTS_KEY));
  const prefs = $derived(alertsOf($prefsQ?.value));
  $effect(() => {
    if (globalThis.navigator?.onLine !== false) loadAlerts();
  });
  const lines = $derived(importantOf({ warnings: news.alerts?.warnings ?? [], avalanche: news.alerts?.avalanche ?? null, prefs }));
  const today = localDay();
  function hide() {
    hidden = today;
    try {
      localStorage.setItem(HIDE, today);
    } catch {
      /* private mode */
    }
  }
</script>

{#if lines.length && hidden !== today}
  <p class="al" role="status" data-alert-line>
    <TriangleAlert size={16} aria-hidden="true" />
    <a href="#/me/hinweise">{t(lines[0].text, lines[0].vars)}{#if lines.length > 1}{' '}<small>{t('and {n} more', { n: lines.length - 1 })}</small>{/if}</a>
    <button type="button" class="al-x" aria-label={t('Hide for today')} onclick={hide}><X size={16} aria-hidden="true" /></button>
  </p>
{/if}

<style>
  .al {
    display: flex;
    gap: 8px;
    align-items: center;
    margin: 0 0 var(--sp-3);
    padding: 8px 12px;
    border-radius: var(--radius-card);
    background: var(--paper-2);
    font-size: var(--fs-small);
  }
  .al a {
    flex: 1;
    color: var(--ink);
  }
  .al-x {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
</style>
