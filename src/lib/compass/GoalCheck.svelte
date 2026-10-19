<script>
  /**
   * Paket N #1047 (Noah 19.10.2026): «Wie läuft's?» once a week for each open goal with steps. Shown on
   * Ich › Mein Kompass and in the Wochenrückblick. One tap answers; nothing shows when every goal of
   * the week is answered. The answers are only for you (observation, never a rating).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { COMPASS_KEY, HOW, compassOf, goalsToCheck, answerCheck, goalProgress } from '../compass.js';
  import { localDay } from '../localday.js';
  import { t } from '../i18n.svelte.js';
  import { Compass } from '@lucide/svelte';

  let { link = false } = $props();
  const today = localDay();
  const q = liveQuery(() => db.settings.get(COMPASS_KEY));
  const c = $derived(compassOf($q?.value));
  const due = $derived(goalsToCheck(c, today));
  async function answer(goal, how) {
    const next = { ...c, goals: c.goals.map((g) => (g.id === goal.id ? answerCheck(g, how, today) : g)) };
    await db.settings.put({ key: COMPASS_KEY, value: $state.snapshot(next) });
  }
</script>

{#if due.length}
  <section class="card gcheck" aria-labelledby="gc-h" data-goal-check>
    <h2 id="gc-h"><Compass size={18} aria-hidden="true" /> {t('How is it going?')}</h2>
    <p class="gc-sub">{t('Once a week for each of your goals. Only for you.')}</p>
    <ul>
      {#each due as g (g.id)}
        {@const p = goalProgress(g, today)}
        <li data-goal={g.id}>
          <b>{g.title}</b>
          <small>{t('{done} of {total} steps', p)}{p.next ? ` · ${t('next: {step}', { step: p.next.text })}` : ''}</small>
          <span class="how" role="group" aria-label={t('How is it going with «{name}»?', { name: g.title })}>
            {#each HOW as h (h.key)}<button type="button" class="btn sm" onclick={() => answer(g, h.key)}>{t(h.name)}</button>{/each}
          </span>
        </li>
      {/each}
    </ul>
    {#if link}<a class="btn btn-link" href="#/me/compass">{t('Open My compass')}</a>{/if}
  </section>
{/if}

<style>
  .gcheck {
    padding: var(--sp-3) var(--sp-4);
    margin: 0 0 var(--sp-4);
  }
  h2 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: var(--fs-sub);
  }
  .gc-sub {
    margin: 2px 0 8px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  ul {
    display: grid;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: grid;
    gap: 4px;
  }
  small {
    color: var(--ink-2);
  }
  .how {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
</style>
