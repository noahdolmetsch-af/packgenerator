<script>
  /**
   * «Kette vorausschauend» (Noah 25.10.2026): the chain's next steps on the page «Wear», before it is too
   * late. Up to three steps (replace, before the trip, soon, measure, lube) each with its own button, and
   * folded «History and forecast»: the values since the new chain, the stretch per 1000 km and when it
   * reaches 0.4 % and its limit. The rules are in lib/chainplan.js. Everything is a suggestion.
   * bike: the bike as stored (for «Oiled» with Undo).
   */
  import { liveQuery } from 'dexie';
  import { Link2, Ruler, Droplet, Wrench, CalendarClock, ChevronRight } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, num, dateOf, locale } from '../i18n.svelte.js';
  import { bikesHash } from '../bikes.js';
  import { localDay } from '../localday.js';
  import { withVisits } from '../workshop.js';
  import { nextTrip } from '../debrief.js';
  import { quickLog } from '../quickcare.js';
  import { chainPlan, openRides, MEASURE_EVERY } from '../chainplan.js';
  import { stepTitle as title } from './chaintext.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import MessenDialog from '../bikes/MessenDialog.svelte';

  let { bike } = $props();

  const today = localDay();
  const visitsQ = liveQuery(() => db.visits.toArray());
  const kmQ = liveQuery(() => db.kmBook.toArray());
  const tripsQ = liveQuery(() => db.trips.toArray());
  const view = $derived(bike ? withVisits(bike, $visitsQ ?? []) : null);
  const trip = $derived(bike ? nextTrip(($tripsQ ?? []).filter((x) => x.bikeId === bike.id), today) : null);
  const plan = $derived(view ? chainPlan(view, { entries: $kmQ ?? [], today, trip, visits: $visitsQ ?? [] }) : null);
  const fc = $derived(plan?.fc ?? null);
  const waiting = $derived(bike ? openRides($kmQ ?? [], bike.id) : 0);
  let measuring = $state(false);

  const month = (day) => new Date(`${day}T00:00:00Z`).toLocaleDateString(locale(), { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const pct = (v) => `${num(Math.round(v * 100) / 100)} %`;
  const ICON = { replace: Wrench, trip: CalendarClock, soon: Link2, measure: Ruler, lube: Droplet };
  function line(s) {
    if (s.kind === 'replace') return s.value != null ? (s.cassette ? t('Measured {v}: over the limit. Over 0.75 %, have the cassette and chainring checked too.', { v: pct(s.value) }) : t('Measured {v}: at or over the limit. A new chain now saves the cassette.', { v: pct(s.value) })) : t('Work needed is noted on the chain.');
    if (s.kind === 'trip') return t('By your values it reaches {limit} around {date}. A new chain needs about 100 km to settle in: mount it a week before.', { limit: pct(fc.limit), date: fc.limitDay ? dateOf(fc.limitDay) : '–' });
    if (s.kind === 'soon') return s.km > 0 ? (s.day ? t('About {km} km left to {limit}, about in {month}.', { km: num(s.km), limit: pct(fc.limit), month: month(s.day) }) : t('About {km} km left to {limit}.', { km: num(s.km), limit: pct(fc.limit) })) : t('By the forecast it has reached {limit}. Measure to be sure.', { limit: pct(fc.limit) });
    if (s.kind === 'measure') return s.never ? t('Not measured since the new chain ({km} km). One measurement is enough for a first forecast.', { km: num(s.since) }) : t('{km} km since the last measurement. Measured often, the app sees early when it is time.', { km: num(s.since) });
    return s.left > 0 ? t('In {km} km.', { km: num(s.left) }) : t('{km} km over the interval.', { km: num(-s.left) });
  }

  async function oiled() {
    const fresh = await db.bikes.get(bike.id);
    const res = fresh ? quickLog(fresh, 'chain', { today }) : null;
    if (!res) return;
    await db.bikes.update(bike.id, res.changes);
    offerDone(t('Chain oiled: saved in Bike care.'), () => db.bikes.update(bike.id, { parts: fresh.parts }));
  }
</script>

{#if plan}
  <section class="wcard cp" aria-labelledby="cp-h" data-chain-plan={plan.steps.length ? plan.steps[0].tone : 'ok'}>
    <h2 id="cp-h"><Link2 size={18} aria-hidden="true" />{t('Chain: what comes next')}</h2>
    {#if plan.steps.length}
      <ul class="steps">
        {#each plan.steps as s (s.kind)}
          {@const Icon = ICON[s.kind]}
          <li class={s.tone} data-chain-step={s.kind}>
            <Icon size={18} aria-hidden="true" />
            <div class="grow">
              <b>{title(s)}</b>
              <p class="quiet">{line(s)}</p>
            </div>
            {#if s.kind === 'measure' || s.kind === 'soon'}
              <button type="button" class="btn sm" onclick={() => (measuring = true)} data-chain-measure>{t('Measure now')}</button>
            {:else if s.kind === 'lube'}
              <button type="button" class="btn sm" onclick={oiled} data-chain-oiled>{t('Done: chain oiled')}</button>
            {:else}
              <a class="btn sm" href={bikesHash({ tab: 'shop', bike: bike.id })} data-chain-shop>{t('Plan a workshop visit')}</a>
            {/if}
          </li>
        {/each}
      </ul>
    {:else}
      <p class="quiet" data-chain-fine>{fc?.kmToLimit != null ? (fc.limitDay ? t('Nothing to do. About {km} km left to {limit}, about in {month}.', { km: num(fc.kmToLimit), limit: pct(fc.limit), month: month(fc.limitDay) }) : t('Nothing to do. About {km} km left to {limit}.', { km: num(fc.kmToLimit), limit: pct(fc.limit) })) : t('Nothing to do right now. Measure the chain every {km} km, then the app tells you early when it is time.', { km: num(MEASURE_EVERY) })}</p>
    {/if}

    {#if waiting}
      <p class="quiet" data-chain-open>{t('{n} rides wait in «To check». Their km count for the chain only after «Fits».', { n: num(waiting) })} <a class="lnk" href="#/bikes?tab=care&view=strava-check">{t('To check')}<ChevronRight size={14} aria-hidden="true" /></a></p>
    {/if}
    <details class="fold" data-chain-history>
      <summary>{t('History and forecast')}</summary>
      {#if fc?.values.length}
        <ul class="vals">
          {#each [...fc.values].reverse() as v, i (`${v.date}-${i}`)}
            <li class="num"><span>{dateOf(v.date)}{v.km != null ? ` · ${t('{km} km', { km: num(v.km) })}` : ''}</span><b>{pct(v.value)}</b></li>
          {/each}
        </ul>
        {#if fc.rate}
          <p class="quiet num" data-chain-rate>
            {t('It gets about {rate} longer per 1000 km.', { rate: pct(fc.rate) })}
            {#if fc.kmToWarn > 0}{t('{warn} in about {km} km.', { warn: pct(fc.warnAt), km: num(fc.kmToWarn) })}{/if}
            {#if fc.kmToLimit > 0}{t('{limit} in about {km} km.', { limit: pct(fc.limit), km: num(fc.kmToLimit) })}{#if fc.limitDay}{' '}{t('About in {month} at your pace.', { month: month(fc.limitDay) })}{/if}{/if}
          </p>
          {#if fc.estimated}<p class="quiet">{t('Estimated from one measurement and the new chain at 0 %. With every measurement it gets more exact.')}</p>{/if}
        {:else}
          <p class="quiet">{t('One more measurement with km, then the app can tell when the chain reaches its limit.')}</p>
        {/if}
      {:else}
        <p class="quiet">{t('No measurement since the new chain yet.')}</p>
      {/if}
      <p class="quiet">{t('Warning at {warn}, replace at {limit} (change the limit in Bike care).', { warn: pct(fc?.warnAt ?? 0.4), limit: pct(fc?.limit ?? 0.5) })}</p>
      {#if plan.measure && !plan.steps.some((s) => s.kind === 'measure')}<p class="quiet num">{plan.measure.left > 0 ? t('Next measurement in {km} km.', { km: num(plan.measure.left) }) : ''}</p>{/if}
      <a class="lnk" href={bikesHash({ tab: 'care', bike: bike.id, open: true })}>{t('Chain in Bike care')}<ChevronRight size={14} aria-hidden="true" /></a>
    </details>
  </section>
  {#if measuring}<MessenDialog kind="chain" bikeId={bike.id} onclose={() => (measuring = false)} />{/if}
{/if}

<style>
  .cp h2 {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .steps,
  .vals {
    list-style: none;
    margin: 6px 0 0;
    padding: 0;
  }
  .steps li {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  .steps li:first-child {
    border-top: 0;
  }
  .steps li.due > :global(svg) {
    color: var(--bad);
  }
  .steps li.soon > :global(svg) {
    color: var(--warn);
  }
  .grow {
    flex: 1 1 14rem;
    min-width: 0;
  }
  .grow p {
    margin: 2px 0 0;
  }
  .vals li {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 4px 0;
    font-variant-numeric: tabular-nums;
  }
  .fold p {
    margin: 6px 0;
  }
</style>
