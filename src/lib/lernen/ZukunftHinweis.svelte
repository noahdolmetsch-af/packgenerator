<script>
  /**
   * Paket M #258: the messages you wrote to yourself in earlier debriefs, before the next trip. «Gelesen»
   * puts one away (settings 'zukunft' { seen }); nothing shows when there is none.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { FUTURE_KEY, futureFor } from './zusatzfragen.js';
  import { Mail, Check } from '@lucide/svelte';

  let { tripId } = $props();
  const dataQ = liveQuery(async () => ({ trips: await db.trips.toArray(), debriefs: await db.debriefs.toArray(), seen: (await db.settings.get(FUTURE_KEY))?.value?.seen ?? [] }));
  const list = $derived($dataQ ? futureFor(tripId, $dataQ.trips, $dataQ.debriefs, $dataQ.seen) : []);
  const read = (fromId) => db.settings.put({ key: FUTURE_KEY, value: { seen: [...new Set([...($dataQ?.seen ?? []), fromId])] } });
</script>

{#if list.length}
  <section class="tp-card zkh" aria-labelledby="zkh-h" data-zukunft-hint>
    <h2 id="zkh-h"><Mail size={18} aria-hidden="true" /> {t('A message from you')}</h2>
    <ul>
      {#each list as m (m.fromId)}
        <li>
          <p class="zkh-t">«{m.text}»</p>
          <p class="tp-muted tp-small">{t('written after «{trip}»', { trip: m.title || t('a trip') })}</p>
          <button type="button" class="btn k" onclick={() => read(m.fromId)}><Check size={16} aria-hidden="true" /><span class="kl">{t('Read|message')}</span></button>
        </li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .zkh h2 {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 6px;
    font-size: var(--fs-section, 1.1rem);
  }
  .zkh ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 12px;
  }
  .zkh-t {
    margin: 0;
    font-size: 1.05rem;
  }
</style>
