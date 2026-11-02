<script>
  /**
   * «Bereit für den Traum?» (Träume und Neuland N16, Noah 27.10.2026 «1-5 a»), in the window of a dream: what you
   * already have (longest ride, most climb in one ride, days in a row, sleeping gear) and what is still missing,
   * against what the dream asks per day. Only a hint; shows nothing when the dream tells no km, climb or days.
   * Rules in bereit.js (pure, tests/bereit.test.js).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { readiness, needOf } from './bereit.js';
  import { localDay } from '../localday.js';
  import { t, num } from '../i18n.svelte.js';
  import { CircleCheck, CircleDashed } from '@lucide/svelte';

  let { dream } = $props();
  const today = localDay();
  const q = liveQuery(async () => {
    const [activities, rides, items] = await Promise.all([db.activities ? db.activities.toArray() : [], db.rides.toArray(), db.items.toArray()]);
    return { activities, rides, items };
  });
  const checks = $derived($q ? readiness(dream, { ...$q, today }) : []);
  const need = $derived(needOf(dream));
  const text = (c) => {
    if (c.key === 'km') return { have: t('Longest ride in 12 months: {km} km', { km: num(c.have) }), need: t('needs about {km} km a day', { km: num(c.need) }), gap: t('{km} km still missing', { km: num(c.missing) }) };
    if (c.key === 'gain') return { have: t('Most climb in one ride: {m} m', { m: num(c.have) }), need: t('needs about {m} m a day', { m: num(c.need) }), gap: t('{m} m still missing', { m: num(c.missing) }) };
    if (c.key === 'days') return { have: t('Most days in a row: {n}', { n: c.have }), need: t('a tour of {n} days', { n: need.days }), gap: t('Try {n} days in a row first', { n: c.need }) };
    return { have: c.ok ? t('Sleeping gear: {n} in your gear', { n: c.have }) : t('No sleeping gear in your gear yet'), need: t('for the nights'), gap: t('Or sleep in a hotel: that is fine too') };
  };
</script>

{#if checks.length}
  <div class="rdy" data-dream-ready>
    <p class="lbl">{t('Ready for it?')}</p>
    <ul>
      {#each checks as c (c.key)}
        {@const x = text(c)}
        <li class:ok={c.ok} data-ready={c.key} data-ok={c.ok}>
          {#if c.ok}<CircleCheck size={18} aria-label={t('ready')} />{:else}<CircleDashed size={18} aria-label={t('still missing')} />{/if}
          <span><b>{x.have}</b><small>{x.need}{#if !c.ok}{' · '}{x.gap}{/if}</small></span>
        </li>
      {/each}
    </ul>
    <p class="rdy-h">{t('Only a hint: what your rides of the last 12 months show.')}</p>
  </div>
{/if}

<style>
  .rdy {
    margin: 0 0 12px;
  }
  .rdy-h {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .rdy ul {
    list-style: none;
    margin: 0 0 4px;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .rdy li {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    color: var(--ink-3);
  }
  .rdy li.ok {
    color: var(--accent);
  }
  .rdy li :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .rdy span {
    display: grid;
    min-width: 0;
    overflow-wrap: break-word;
    color: var(--ink);
  }
  .rdy small {
    color: var(--ink-3);
  }
</style>
