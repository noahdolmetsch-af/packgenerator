<script>
  /**
   * «Haken und Rhythmus» (Noah 22.11.2026 «a, aber sicherstellen, dass keine vergangenen daten verloren gehen», S5):
   * what the old page «Haken ausgewertet» showed, now at the bottom of the Sports year. Every tick of every activity
   * (also meditation, sauna, the ride to work, counted amounts) with the same key tiles and the same analyses, for the
   * period of the page; all activities or one (the old address …?act=<id> leads here). Strava units without a tick of
   * their own count as well (that is new, nothing is left out). Only looking; the rules are in flow/auswertung.js.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../../db.js';
  import TickAnalyses from './TickAnalyses.svelte';
  import { tilesOf } from '../auswertung.js';
  import { normAct, entriesFor, tripDays } from '../../flow.js';
  import { homeTrips } from '../../home/heute.js';
  import { looseLabel } from '../einheiten.js';
  import { looseSports, rhythmList } from '../rhythmus.js';
  import { actName } from '../ui.svelte.js';
  import { t, tn, num } from '../../i18n.svelte.js';

  /* units: ALL units (einheiten(), not only movement); log: the ticks; acts: flowActs; from/to: the window of the page */
  let { units = [], log = [], acts = [], from, to, today, act0 = '' } = $props();

  const tq = liveQuery(() => db.trips.toArray());
  const days = $derived(tripDays(homeTrips($tq ?? []), today));
  const nacts = $derived(acts.map(normAct).sort((a, b) => a.order - b.order));
  const byId = $derived(new Map(nacts.map((a) => [a.id, a])));

  let actId = $state(act0);
  const act = $derived(byId.get(actId) ?? null);

  const loose = $derived(looseSports(units, nacts).map((l) => ({ id: l.id, name: t(looseLabel(l.type)) })));
  const names = $derived(new Map([...nacts.map((a) => [a.id, actName(a) || a.id]), ...loose.map((l) => [l.id, l.name])]));
  const picked = $derived(!act && loose.some((l) => l.id === actId) ? actId : '');
  const list = $derived(rhythmList({ units, log, acts, days, pick: act ? act.id : picked }));
  const k = $derived(tilesOf(list, from, to, today));
  const d = $derived({
    list,
    from,
    to,
    today,
    ids: [...nacts.map((a) => a.id), ...loose.map((l) => l.id)],
    ringOf: (id) => byId.get(id)?.ring ?? 'move',
    nameOf: (id) => names.get(id) ?? id,
  });
</script>

<section class="rh" aria-labelledby="rh-h" data-sj-rhythm>
  <div class="card pick">
    <h2 id="rh-h">{t('Ticks and rhythm')}</h2>
    <p class="hs">{t('Everything you tick off, also meditation, sauna and the ride to work, and every Strava unit. Only to look at, nothing is rated.')}</p>
    <label class="pr">
      <span class="pl">{t('Activity|tk')}</span>
      <select class="inp" bind:value={actId} data-tk-act>
        <option value="">{t('All activities|tk')}</option>
        {#each nacts as a (a.id)}<option value={a.id}>{names.get(a.id)}</option>{/each}
        {#each loose as l (l.id)}<option value={l.id}>{l.name}</option>{/each}
      </select>
    </label>
  </div>

  <div class="card vals num" data-section="values">
    <span data-val="days"><b>{num(k.days)}</b><small>{t('Days with a tick')}</small></span>
    <span data-val="ticks"><b>{num(k.ticks)}</b><small>{t('Ticks')}</small></span>
    {#if act && act.perTap > 1}<span data-val="amount"><b>{num(k.amount)}</b><small>{t('Amount|tk')}</small></span>{/if}
    <span data-val="week"><b>{num(k.perWeek)}</b><small>{t('Ø per week|tk')}</small></span>
    {#if k.min > 0}<span data-val="min"><b>{t('{n} min', { n: num(k.min) })}</b><small>{t('Minutes|tk')}</small></span>{/if}
    <span data-val="longest"><b>{tn(k.longest, '{n} day', '{n} days')}</b><small>{t('Longest run|tk')}</small></span>
    <span data-val="current"><b>{tn(k.current, '{n} day', '{n} days')}</b><small>{t('Current run|tk')}</small></span>
    {#if !act && !picked}<span data-val="acts"><b>{num(k.acts)}</b><small>{t('Activities|tk')}</small></span>{/if}
  </div>
  <p class="hint">{t('A run counts the days in a row with at least one tick; today still counts when it is not ticked yet.')}</p>

  {#if k.ticks}
    <TickAnalyses {d} />
  {:else}
    <p class="hint" role="status">{t('No tick in this period. Choose a longer period or another activity.')}</p>
  {/if}
</section>

<style>
  .rh {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    min-width: 0;
  }
  .pick {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 24px;
    padding: 14px 16px;
  }
  .pick h2 {
    flex: 1 1 100%;
    margin: 0;
    font-size: var(--fs-sub);
  }
  .hs {
    flex: 1 1 100%;
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .pr {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .pl {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .pick select {
    min-width: 220px;
    max-width: 100%;
  }
  .vals {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
    padding: 16px;
  }
  .vals span {
    display: flex;
    flex-direction: column;
    padding: 10px 12px;
    border-radius: var(--radius);
    background: var(--paper-2);
  }
  .vals b {
    font: 700 var(--fs-sub) / 1.25 var(--font-body);
  }
  .vals small {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .hint {
    margin: -8px 2px 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
