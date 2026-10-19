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
  import { untrack } from 'svelte';
  import { ALERTS_KEY, alertsOf, importantOf, avalancheSeason } from './news.js';
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
  // ask the server only once you have set up Ich › Hinweise, and only when a line can come from it: a region
  // for the weather, or the avalanche in winter (passes need no server). Once per visit (untrack: the answer
  // must not start a new question). Without a setup Today talks to no one.
  const need = $derived(!!$prefsQ?.value && ((prefs.weather && !!prefs.region?.trim()) || (prefs.avalanche && avalancheSeason(new Date().getMonth() + 1))));
  $effect(() => {
    if (need && globalThis.navigator?.onLine !== false) untrack(() => loadAlerts());
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
