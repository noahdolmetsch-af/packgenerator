<script>
  /**
   * Paket M #258 «Nachricht ans zukünftige Ich» (Noah 19.10.2026 «2 an anderer sinnvoller Stelle, lustig»):
   * on the way of the next trip a closed envelope «Post von dir!» waits; a tap opens it and shows what you
   * wrote yourself after an earlier trip. «Gelesen» puts it away (settings 'zukunft' { seen }).
   * Nothing shows when there is no message.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t, locale } from '../i18n.svelte.js';
  import { FUTURE_KEY, futureFor } from './zusatzfragen.js';
  import { Mail, MailOpen, Check } from '@lucide/svelte';

  let { tripId } = $props();
  const dataQ = liveQuery(async () => ({ trips: await db.trips.toArray(), debriefs: await db.debriefs.toArray(), seen: (await db.settings.get(FUTURE_KEY))?.value?.seen ?? [] }));
  const list = $derived($dataQ ? futureFor(tripId, $dataQ.trips, $dataQ.debriefs, $dataQ.seen) : []);
  let opened = $state(false);
  const when = (iso) => (iso ? new Date(iso).toLocaleDateString(locale(), { month: 'long', year: 'numeric' }) : '');
  const read = (fromId) => db.settings.put({ key: FUTURE_KEY, value: { seen: [...new Set([...($dataQ?.seen ?? []), fromId])] } });
</script>

{#if list.length}
  <section class="tp-card zkh" class:opened aria-labelledby="zkh-h" data-zukunft-hint>
    {#if !opened}
      <button type="button" class="zkh-env" onclick={() => (opened = true)} data-zukunft-open>
        <span class="zkh-ic" aria-hidden="true"><Mail size={30} /></span>
        <span><b id="zkh-h">{t('Mail from you!')}</b><small>{t('Your earlier self left you a message. Open it?')}</small></span>
      </button>
    {:else}
      <h2 id="zkh-h"><MailOpen size={20} aria-hidden="true" /> {t('Mail from you!')}</h2>
      <ul>
        {#each list as m (m.fromId)}
          <li>
            <p class="zkh-t">«{m.text}»</p>
            <p class="tp-muted tp-small">{t('Sincerely, you · after «{trip}», {when}', { trip: m.title || t('a trip'), when: when(m.at) })}</p>
            <button type="button" class="btn k" onclick={() => read(m.fromId)}><Check size={16} aria-hidden="true" /><span class="kl">{t('Read|message')}</span></button>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
{/if}

<style>
  .zkh-env {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    min-height: 56px;
    padding: 0;
    border: 0;
    background: none;
    text-align: left;
    font: inherit;
    color: inherit;
    cursor: pointer;
  }
  .zkh-env small {
    display: block;
    color: var(--ink-2);
  }
  .zkh-ic {
    display: grid;
    place-items: center;
    animation: zkh-wiggle 2.4s ease-in-out infinite;
  }
  @keyframes zkh-wiggle {
    0%, 80%, 100% { transform: rotate(0); }
    85% { transform: rotate(-10deg); }
    90% { transform: rotate(10deg); }
    95% { transform: rotate(-6deg); }
  }
  @media (prefers-reduced-motion: reduce) {
    .zkh-ic {
      animation: none;
    }
  }
  .zkh h2 {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 6px;
    font-size: var(--fs-section);
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
    font-size: var(--fs-sub);
    font-style: italic;
  }
</style>
