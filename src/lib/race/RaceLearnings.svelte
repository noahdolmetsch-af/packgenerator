<script>
  /**
   * «Learnings aus vergangenen Rennen» (Noah 27.10.2026, idea 4): on top of a race on «Rennen detailliert
   * planen», what you learned in your earlier races: the learnings of every past race (learningsOf, like the
   * review) and the learnings with the topic «race». Newest first; six shown, the rest behind «Show all».
   * ctx.past = the past races (trips).
   */
  import { liveQuery } from 'dexie';
  import { Lightbulb } from '@lucide/svelte';
  import { db } from '../db.js';
  import { learningsOf } from '../review/rueckblick.js';
  import { t, tn } from '../i18n.svelte.js';

  let { ctx } = $props();
  const learnQ = liveQuery(() => db.learnings.toArray());
  const SHOW = 6;
  let all = $state(false);
  const rows = $derived.by(() => {
    const list = $learnQ ?? [];
    const out = new Map();
    for (const tr of (ctx.past ?? []).filter((x) => x.id !== ctx.trip.id)) {
      for (const l of learningsOf(tr, list)) if (!out.has(l.id)) out.set(l.id, { ...l, race: tr.title });
    }
    for (const l of list) if (l.topic === 'race' && !out.has(l.id) && l.tripId !== ctx.trip.id) out.set(l.id, { ...l, race: '' });
    return [...out.values()].filter((l) => String(l.rule ?? '').trim()).sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
  });
  const shown = $derived(all ? rows : rows.slice(0, SHOW));
</script>

<section class="rc-box" aria-labelledby="rlr-h" data-race-learnings>
  <h2 id="rlr-h" class="rc-h2"><Lightbulb size={18} aria-hidden="true" /> {t('Learned in earlier races')}</h2>
  {#if $learnQ === undefined}
    <p class="rc-note">{t('Loading…')}</p>
  {:else if !rows.length}
    <p class="rc-empty" data-race-learnings-empty>{t('No learnings from earlier races yet. They come from «After the race» and from your reviews.')}</p>
  {:else}
    <ul class="rlr-list">
      {#each shown as l (l.id)}
        <li data-race-learning={l.id}>
          <b>{l.rule}</b>
          {#if l.action}<span class="rlr-do">{l.action}</span>{/if}
          {#if l.race}<small>{l.race}</small>{/if}
        </li>
      {/each}
    </ul>
    {#if rows.length > SHOW}
      <button type="button" class="btn sm" onclick={() => (all = !all)} data-race-learnings-all>{all ? t('Show fewer') : tn(rows.length, 'Show all {n}', 'Show all {n}')}</button>
    {/if}
  {/if}
  <a class="rc-note" href="#/debrief/learnings">{t('All learnings')} ›</a>
</section>

<style>
  .rlr-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .rlr-list li {
    display: grid;
    gap: 2px;
    padding-left: 10px;
    border-left: 3px solid var(--accent);
  }
  .rlr-do {
    color: var(--ink-2);
  }
  .rlr-list small {
    color: var(--ink-3);
  }
</style>
