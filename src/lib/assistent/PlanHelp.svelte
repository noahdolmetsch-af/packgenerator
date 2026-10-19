<script>
  /*
   * «Hilf mir planen» (Noah 15.10.2026 «1 beides»): #/assistent/plan. Four short questions, then the
   * plan as a suggestion (plan.js planRows). «Create the trip» opens New trip with the answers filled
   * in; everything stays changeable there. Free, nothing leaves the device.
   */
  import { liveQuery } from 'dexie';
  import { Check, TriangleAlert } from '@lucide/svelte';
  import { db } from '../db.js';
  import { bikeCare } from '../readiness.js';
  import { withVisits } from '../workshop.js';
  import { newTrip } from '../nav.js';
  import { localDay } from '../localday.js';
  import { NIGHT_CHOICES } from '../context.js';
  import { DOMAIN } from '../domains.js';
  import { t } from '../i18n.svelte.js';
  import { PLAN_KEY, planKinds, cleanPlan, nextSaturday, planRows } from './plan.js';

  const today = localDay();
  const src = liveQuery(async () => {
    const [items, bikes, visits, tasks, learnings] = await Promise.all([db.items.toArray(), db.bikes.toArray(), db.visits.toArray(), db.maintenance.toArray(), db.learnings.toArray()]);
    return { items, bikes: bikes.filter((b) => !b.archived && !b.gone), visits, tasks, learnings };
  });
  const kinds = planKinds();
  let a = $state({ startDate: nextSaturday(today), days: 1, area: kinds[0]?.key, night: 'hotel', bikeId: '' });
  let shown = $state(false);
  const plan = $derived(cleanPlan(a, { today, bikes: $src?.bikes ?? [] }));
  const withBike = $derived(!!DOMAIN[plan.area]?.bike);
  const care = $derived.by(() => {
    const s = $src;
    const b = s?.bikes.find((x) => x.id === plan.bikeId);
    if (!b) return null;
    const trip = { id: 'plan', startDate: plan.startDate, days: plan.days, bikeId: b.id };
    return bikeCare(withVisits(b, s.visits), { tasks: s.tasks, visits: s.visits, trip, today });
  });
  const rows = $derived($src ? planRows(plan, { items: $src.items, bikes: $src.bikes, care, learnings: $src.learnings }) : []);

  function create() {
    try {
      localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
    } catch {
      /* private mode: New trip opens with its own defaults */
    }
    newTrip('standard', plan.area);
  }
</script>

<section class="card ph-card" aria-labelledby="ph-h">
  <h2 id="ph-h" class="ph-h">{t('Help me plan')}</h2>
  <p class="ph-sub">{t('Four short questions, then a plan. Everything is a suggestion you can change.')}</p>
  <ol class="ph-q">
    <li>
      <span class="ph-n">{t('When and how long?')}</span>
      <div class="ph-row">
        <label class="ph-f"><span class="lbl">{t('Start')}</span><input class="inp" type="date" bind:value={a.startDate} /></label>
        <label class="ph-f ph-days"><span class="lbl">{t('Days')}</span><input class="inp num" type="number" min="1" max="30" bind:value={a.days} /></label>
      </div>
    </li>
    <li>
      <span class="ph-n">{t('What kind of trip?')}</span>
      <div class="ph-chips" role="radiogroup" aria-label={t('What kind of trip?')}>
        {#each kinds as k (k.key)}<button type="button" class="chip" role="radio" aria-checked={plan.area === k.key} class:on={plan.area === k.key} onclick={() => (a.area = k.key)}>{t(k.name)}</button>{/each}
      </div>
    </li>
    <li>
      <span class="ph-n">{t('Where do you sleep?')}</span>
      {#if plan.days === 1}
        <p class="ph-sub">{t('One day: no night.')}</p>
      {:else}
        <div class="ph-chips" role="radiogroup" aria-label={t('Where do you sleep?')}>
          {#each NIGHT_CHOICES.filter((c) => c.key !== 'none') as c (c.key)}<button type="button" class="chip" role="radio" aria-checked={plan.night === c.key} class:on={plan.night === c.key} onclick={() => (a.night = c.key)}>{t(c.name)}</button>{/each}
        </div>
      {/if}
    </li>
    <li>
      <span class="ph-n">{t('Which bike?')}</span>
      {#if !withBike}
        <p class="ph-sub">{t('This kind of trip goes without a bike.')}</p>
      {:else if !$src?.bikes.length}
        <p class="ph-sub">{t('No bike yet.')}</p>
      {:else}
        <div class="ph-chips" role="radiogroup" aria-label={t('Which bike?')}>
          {#each $src.bikes as b (b.id)}<button type="button" class="chip" role="radio" aria-checked={plan.bikeId === b.id} class:on={plan.bikeId === b.id} onclick={() => (a.bikeId = b.id)}>{b.name}</button>{/each}
        </div>
      {/if}
    </li>
  </ol>
  <button type="button" class="btn hi" onclick={() => (shown = true)}>{t('Show my plan')}</button>
</section>

{#if shown}
  <section class="card ph-card ph-plan" aria-labelledby="ph-plan-h" data-ph="plan">
    <h2 id="ph-plan-h" class="ph-h">{t('Your plan')}</h2>
    <ul class="ph-rows">
      {#each rows as r (r.key)}
        <li data-ph-row={r.key}>
          <span class="ph-ic" class:due={r.tone === 'due'}>{#if r.tone === 'due'}<TriangleAlert size={16} aria-hidden="true" />{:else}<Check size={16} aria-hidden="true" />{/if}</span>
          <span class="ph-m"><b>{r.title}</b>{#each r.lines as l, i (i)}<small>{l}</small>{/each}</span>
        </li>
      {/each}
    </ul>
    <button type="button" class="btn hi" onclick={create}>{t('Create the trip')}</button>
  </section>
{/if}

<style>
  .ph-card {
    padding: var(--sp-3);
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .ph-plan {
    margin-top: var(--sp-3);
  }
  .ph-h {
    margin: 0 0 4px;
    font-size: var(--fs-section);
  }
  .ph-sub {
    margin: 0 0 var(--sp-2);
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .ph-q {
    margin: 0 0 var(--sp-3);
    padding-left: 1.3em;
  }
  .ph-q li {
    margin-bottom: var(--sp-3);
  }
  .ph-n {
    display: block;
    margin-bottom: 6px;
    font-weight: 600;
  }
  .ph-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .ph-f {
    display: grid;
    gap: 2px;
  }
  .ph-days .inp {
    width: 6em;
  }
  .ph-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    padding: 7px 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .chip.on {
    background: var(--hi);
    border-color: var(--hi);
    color: var(--hi-ink);
  }
  .ph-rows {
    list-style: none;
    margin: 0 0 var(--sp-3);
    padding: 0;
  }
  .ph-rows li {
    display: flex;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid var(--line);
  }
  .ph-ic {
    flex: none;
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .ph-ic.due {
    color: var(--warn);
  }
  .ph-m {
    display: grid;
    gap: 2px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .ph-m small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
