<script>
  /**
   * Noah 26.10.2026 «3a» «Velo-Jahresrückblick»: Bikes › Care › «Year in review» (#/bikes?tab=care&view=year).
   * Choose a year: all bikes together on top, then per bike the km, the rides, the parts changed (how long
   * the old one lasted), the services, what it cost, what lasted longest and the chain care after rain.
   */
  import { liveQuery } from 'dexie';
  import { CalendarRange, Trophy } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, tn, num, dateOf } from '../i18n.svelte.js';
  import { sortBikes } from '../bikes.js';
  import { localDay } from '../localday.js';
  import { withVisits } from '../workshop.js';
  import { yearsWith, bikeYear, allYear } from '../veloyear.js';
  import GriffHead from './GriffHead.svelte';
  import './griff.css';

  let { bikeId = null } = $props();
  const today = localDay();
  const dataQ = liveQuery(async () => {
    const [bikes, visits, entries] = await Promise.all([db.bikes.toArray(), db.visits.toArray(), db.kmBook.toArray()]);
    return { bikes, visits, entries };
  });
  const bikes = $derived(sortBikes(($dataQ?.bikes ?? []).filter((b) => !b.archived)));
  const bike = $derived(bikes.find((b) => b.id === bikeId) ?? bikes[0] ?? null);
  const views = $derived(bikes.map((b) => withVisits(b, $dataQ?.visits ?? [])));
  const years = $derived.by(() => {
    const ys = yearsWith(views, $dataQ?.entries ?? [], $dataQ?.visits ?? []);
    return ys.includes(today.slice(0, 4)) ? ys : [today.slice(0, 4), ...ys];
  });
  let chosen = $state(null);
  const year = $derived(chosen ?? years[0]);
  const list = $derived(views.map((v) => ({ id: v.id, name: v.name, year: bikeYear(v, { entries: $dataQ?.entries ?? [], visits: $dataQ?.visits ?? [], year }) })));
  const sum = $derived(allYear(list));
  // the chosen bike first, then the others with km in that year
  const shown = $derived([...list].sort((a, b) => (a.id === bike?.id ? -1 : b.id === bike?.id ? 1 : b.year.km - a.year.km)).filter((x) => x.id === bike?.id || x.year.km > 0 || x.year.changed.length || x.year.visits));
  const chf = (n) => t('CHF {chf}', { chf: num(n) });
</script>

<div class="gp">
  <GriffHead {bikes} {bike} view="year" title={t('Year in review')} sub={t('Your bikes in one year: km, changes, services and costs')} />
  {#if !bike}
    <p class="quiet">{t('No bike yet. Add a bike under Bikes first.')}</p>
  {:else}
    <div class="chips" role="tablist" aria-label={t('Choose a year')}>
      {#each years as y (y)}<button type="button" class="chip" role="tab" aria-selected={y === year} onclick={() => (chosen = y)} data-year-pick={y}>{y}</button>{/each}
    </div>
    {#if bikes.length > 1}
      <section class="gcard" aria-labelledby="yr-all" data-year-all>
        <h2 id="yr-all"><CalendarRange size={18} aria-hidden="true" />{t('All bikes in {year}', { year })}</h2>
        <p class="num">{t('{km} km', { km: num(sum.km) })} · {tn(sum.rides, '{n} ride', '{n} rides')} · {tn(sum.changed, '{n} part changed', '{n} parts changed')} · {chf(sum.chf)}</p>
        {#if sum.top}<p class="quiet">{t('Most km: {bike}', { bike: sum.top })}</p>{/if}
      </section>
    {/if}
    {#each shown as x (x.id)}
      {@const y = x.year}
      <section class="gcard" aria-labelledby="yr-{x.id}" data-year-bike={x.id}>
        <h2 id="yr-{x.id}">{x.name}</h2>
        <dl class="facts">
          <div><dt>{t('km')}</dt><dd class="num" data-year-km>{num(y.km)}</dd></div>
          <div><dt>{t('Rides')}</dt><dd class="num">{num(y.rides)}</dd></div>
          <div><dt>{t('Longest ride')}</dt><dd class="num">{y.longest ? t('{km} km', { km: num(y.longest) }) : '–'}</dd></div>
          <div><dt>{t('Costs')}</dt><dd class="num" data-year-chf>{chf(y.chf)}</dd></div>
        </dl>
        {#if y.unknown}<p class="quiet">{tn(y.unknown, '{n} workshop visit without a price', '{n} workshop visits without a price')}</p>{/if}
        <p class="quiet">{tn(y.visits, '{n} workshop visit', '{n} workshop visits')} · {tn(y.services, '{n} service by yourself', '{n} services by yourself')} · {tn(y.oiled, 'chain cared for {n} time', 'chain cared for {n} times')}</p>
        {#if y.changed.length}
          <h3>{t('Parts changed')}</h3>
          <ul class="list" data-year-changed>
            {#each y.changed as c (c.key + c.date)}
              <li><span class="grow"><b>{c.name}</b>{#if c.model}{' · '}{c.model}{/if}</span><span class="quiet num">{dateOf(c.date)}{#if c.lasted}{' · '}{t('the old one lasted {km} km', { km: num(c.lasted) })}{/if}</span></li>
            {/each}
          </ul>
        {:else}
          <p class="quiet">{t('No part changed this year.')}</p>
        {/if}
        {#if y.best}<p data-year-best><Trophy size={14} aria-hidden="true" /> {t('Lasted longest: {part}, {km} km', { part: y.best.model ? `${y.best.name} (${y.best.model})` : y.best.name, km: num(y.best.km) })}</p>{/if}
      </section>
    {/each}
  {/if}
</div>

<style>
  .facts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
    gap: 8px;
    margin: 0 0 8px;
  }
  .facts div {
    min-width: 0;
  }
  .facts dt {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .facts dd {
    margin: 0;
    font-weight: 600;
  }
  h3 {
    margin: 10px 0 4px;
    font-size: var(--fs-small);
  }
</style>
