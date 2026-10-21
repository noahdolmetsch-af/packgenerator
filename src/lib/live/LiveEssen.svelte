<script>
  /**
   * Paket X (Noah 20.10.2026 «2a»): «Zeit zu essen» on the map itself, while the eat reminder of the
   * sheet runs (every 45 minutes by default, switchable there, with the soft tone). Two taps: «Gegessen»
   * or «In 10 Minuten». Live.svelte mounts it with one line among its alerts (owner: Live-Karte).
   */
  import { liveQuery } from 'dexie';
  import { Utensils } from '@lucide/svelte';
  import { db } from '../db.js';
  import { EAT_KEY, eatOf, isDue, eaten, snooze, SNOOZE_MIN } from '../unterwegs/essen.js';
  import { t } from '../i18n.svelte.js';

  const eatQ = liveQuery(() => db.settings.get(EAT_KEY));
  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => (now = Date.now()), 15000);
    return () => clearInterval(id);
  });
  const e = $derived(eatOf($eatQ?.value, now));
  const due = $derived(isDue(e, now));
  const save = (v) => db.settings.put({ key: EAT_KEY, value: v });
</script>

{#if due}
  <p class="lvf-alert" role="status" data-live-eat>
    <Utensils size={18} aria-hidden="true" /><span>{t('Time to eat')}</span>
    <button type="button" class="btn sm" onclick={() => save(eaten(e, Date.now()))} data-live-eat-done>{t('Eaten')}</button>
    <button type="button" class="btn sm" onclick={() => save(snooze(e, Date.now()))}>{t('In {n} minutes', { n: SNOOZE_MIN })}</button>
  </p>
{/if}

<style>
  /* the look of the other alerts of the live map (Live.svelte .lvf-alert) */
  .lvf-alert {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 0;
    padding: 6px 10px;
    border-radius: 8px;
    background: var(--paper);
    color: var(--ink);
    font-size: var(--fs-small);
    box-shadow: 0 1px 4px var(--shadow);
    pointer-events: auto;
    overflow-wrap: break-word;
    border-left: 4px solid var(--ok);
  }
</style>
