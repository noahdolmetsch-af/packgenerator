<script>
  /**
   * «Freude als Auswertung» (Noah 04.11.2026 «3a», Persönliches Lernen Idee 6): Touren › Rückblick › Was hat es gut gemacht?
   * The four scales of the debriefs (riding fun, nature, flow, company) as means over everything you answered, and
   * the tours one by one. Observation only: it shows what you answered and never why. A few tours say little.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';
  import Empty from '../ui/Empty.svelte';
  import { Smile } from '@lucide/svelte';
  import { JOY, MAX, MIN_TOURS, means, perTour } from '../freude.js';

  const dataQ = liveQuery(async () => {
    const [debriefs, trips] = await Promise.all([db.debriefs.toArray(), db.trips.toArray()]);
    return { debriefs, names: Object.fromEntries(trips.map((x) => [x.id, x.title || ''])) };
  });
  const data = $derived($dataQ ?? { debriefs: [], names: {} });
  const rows = $derived(perTour(data.debriefs));
  const avg = $derived(means(data.debriefs));
  const nameOf = (k) => t(JOY.find((j) => j.key === k)?.name ?? k);
  const dayText = (d) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }) : '');
</script>

<div class="fr" data-freude>
  {#if !rows.length}
    <Empty icon={Smile} text={t('Nothing answered yet. In a debrief, tap a number under «What made it good?», and it shows up here.')} action={{ label: t('To the debriefs'), href: '#/debrief' }} />
  {:else}
    <section class="rv-sec" aria-labelledby="fr-m">
      <div class="rv-h"><div><h2 id="fr-m">{t('On average')}</h2><p class="rv-sub">{tn(rows.length, 'Over {n} tour with an answer', 'Over {n} tours with an answer')}</p></div></div>
      <ul class="rv-box pad ml">
        {#each avg as m (m.key)}
          <li data-joy-mean={m.key}>
            <span class="mn">{nameOf(m.key)}</span>
            <span class="bar" aria-hidden="true"><i style="width: {(m.mean / MAX) * 100}%"></i></span>
            <span class="mv num">{t('{mean} of 5', { mean: num(m.mean) })}</span>
          </li>
        {/each}
      </ul>
      {#if rows.length < MIN_TOURS}<p class="ws">{t('A few tours say little.')}</p>{/if}
    </section>
    <section class="rv-sec" aria-labelledby="fr-t">
      <div class="rv-h"><div><h2 id="fr-t">{t('Tour by tour')}</h2></div></div>
      <ul class="rv-box tl">
        {#each rows as r (r.tripId)}
          <li class="tr" data-joy-tour={r.tripId}>
            <b>{data.names[r.tripId] || t('Tour')}</b>
            <span class="ts">{dayText(r.day)}</span>
            <span class="tv">{JOY.filter((j) => r.joy[j.key] != null).map((j) => `${t(j.name)} ${r.joy[j.key]}`).join(' · ')}</span>
          </li>
        {/each}
      </ul>
    </section>
  {/if}
  <p class="ws">{t('This only counts what you answered.')}</p>
</div>

<style>
  .fr { display: grid; gap: 16px; min-width: 0; }
  .ml { list-style: none; margin: 0; display: grid; gap: 12px; }
  .ml li { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 12px; align-items: center; }
  .bar { grid-column: 1 / -1; grid-row: 2; height: 8px; border-radius: 999px; background: var(--line); overflow: hidden; }
  .bar i { display: block; height: 100%; background: var(--hi); border-radius: 999px; }
  .mn { font-weight: 600; }
  .mv { color: var(--ink-2); font-size: var(--fs-small); }
  .tl { list-style: none; margin: 0; padding: 0; display: grid; }
  .tr { display: grid; gap: 2px; padding: 12px 14px; border-top: 1px solid var(--line); min-width: 0; }
  .tr:first-child { border-top: 0; }
  .ts, .tv, .ws { color: var(--ink-2); font-size: var(--fs-small); margin: 0; }
</style>
