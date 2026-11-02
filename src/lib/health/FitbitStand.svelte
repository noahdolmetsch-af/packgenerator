<script>
  /**
   * Noah 2.11.2026 «3a 5a»: under the Fitbit tiles of Heute, when the last fetch worked («Stand 07:42», with
   * the day if it is not today) and, when it failed, the button «Try again now». Observation only.
   */
  import { health, fetchNow } from './client.svelte.js';
  import { fitbitStand } from './emptyline.js';
  import { localDay } from '../localday.js';
  import { t, locale } from '../i18n.svelte.js';

  const st = $derived(fitbitStand(health));
  const when = $derived.by(() => {
    if (!st?.at) return '';
    const d = new Date(st.at);
    const hm = d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
    return localDay(d) === localDay() ? hm : `${d.toLocaleDateString(locale(), { weekday: 'short' })} ${hm}`;
  });
</script>

{#if st}
  <p class="stand" data-fitbit-stand>
    {#if when}<span>{t('As of {time}', { time: when })}</span>{:else}<span>{t('No fetch yet')}</span>{/if}
    {#if st.failed || health.busy}
      <button type="button" class="again" disabled={health.busy} onclick={() => fetchNow()} data-fitbit-again>{health.busy ? t('Fetching …') : t('Try again now')}</button>
    {/if}
  </p>
{/if}

<style>
  .stand {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .again {
    border: 0;
    background: transparent;
    padding: 0;
    min-height: 44px;
    color: var(--hi);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
</style>
