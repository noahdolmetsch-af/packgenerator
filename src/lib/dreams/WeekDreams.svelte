<script>
  /**
   * Paket N idea 5 (Noah 19.10.2026 «1-5 a»): what the dreams and races bring to a week, for «Woche
   * planen» (package F, src/pages/Woche.svelte). Registration deadlines of the week and up to two dreams
   * that fit this month, with the Saturday to plan them. Races with a date are trips and stand in the
   * days already. Shows nothing when there is nothing; «Hide» hides it (Touren › Träume brings it back).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { DREAMS_KEY, WEEK_HIDE_KEY, weekDreams } from '../dreams.js';
  import { t, locale } from '../i18n.svelte.js';
  import { Sparkles, Flag } from '@lucide/svelte';

  let { monday, today } = $props();

  const q = liveQuery(async () => {
    const [store, hidden, trips] = await Promise.all([db.settings.get(DREAMS_KEY), db.settings.get(WEEK_HIDE_KEY), db.trips.toArray()]);
    return { store: store?.value ?? null, hidden: hidden?.value === true, trips };
  });
  const w = $derived($q && !$q.hidden ? weekDreams({ store: $q.store, trips: $q.trips, monday, today }) : null);
  const dayText = (d) => new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' });
  const hide = () => db.settings.put({ key: WEEK_HIDE_KEY, value: true });
</script>

{#if w && (w.deadlines.length || w.dreams.length)}
  <section class="wd" aria-labelledby="wd-h" data-week-dreams>
    <h2 id="wd-h">{t('Dreams and races')}</h2>
    <ul>
      {#each w.deadlines as x (x.tripId)}
        <li data-wd="deadline"><Flag size={16} aria-hidden="true" /><span><b>{t('Sign up: {trip}', { trip: x.title })}</b><small>{t('Registration closes {day}', { day: dayText(x.day) })}</small></span><a class="btn sm" href="#/trips/dreams">{t('Open')}</a></li>
      {/each}
      {#each w.dreams as x (x.id)}
        <li data-wd="dream"><Sparkles size={16} aria-hidden="true" /><span><b>{x.title}</b><small>{t('Fits now · for example {day}', { day: dayText(x.day) })}</small></span><a class="btn sm" href="#/trips/dreams">{t('Plan|dream')}</a></li>
      {/each}
    </ul>
    <button type="button" class="btn btn-link" onclick={hide}>{t('Hide|week')}</button>
  </section>
{/if}

<style>
  .wd {
    background: var(--paper-2);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 14px 16px;
  }
  h2 {
    font-size: var(--fs-section);
    margin: 0 0 8px;
  }
  ul {
    list-style: none;
    margin: 0 0 4px;
    padding: 0;
    display: grid;
    gap: 10px;
  }
  li {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  li > span {
    flex: 1 1 auto;
    min-width: 0;
    display: grid;
  }
  b {
    overflow-wrap: break-word;
  }
  small {
    color: var(--ink-3);
  }
</style>
