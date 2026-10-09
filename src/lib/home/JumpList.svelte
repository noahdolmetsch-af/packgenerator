<script>
  /**
   * v0.38.0 "Heute und Menü" (Noah 9a): "Jump to", a short list with the number on the right:
   * what is due, dead weight, a year ago, the weekend weather and what is new in the app. A row shows
   * only when it has something to say. Below it "Season {year} in numbers" (only with content).
   * Desktop: beside the bike buttons; phone: below them.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { dueAll, yearAgo, seasonNumbers } from '../quickcare.js';
  import { itemUsage, deadWeight } from '../insights.js';
  import { HOME_PLACE, HOME_FORECAST, usable, weekendWeather } from '../know.js';
  import { RAIN } from '../trips.js';
  import { formatWeight } from '../gear.js';
  import HomePlaceForm from '../know/HomePlaceForm.svelte';
  import { t, tn, num, locale } from '../i18n.svelte.js';
  import { ListChecks, ShoppingBag, CalendarHeart, CloudSun, Sparkles, ChevronRight, ChevronDown } from '@lucide/svelte';

  let { bikes = [], trips = [], items = [], debriefs = [], learnings = [], visits = [], tasks = [], today, news = 0 } = $props();

  const placeQ = liveQuery(async () => (await db.settings.get(HOME_PLACE))?.value ?? null);
  const fcQ = liveQuery(async () => (await db.meta.get(HOME_FORECAST)) ?? null);

  const due = $derived(dueAll(bikes, { tasks, visits, today }));
  const dead = $derived(deadWeight(items, itemUsage(trips, debriefs)));
  const ago = $derived(yearAgo(trips, debriefs, learnings, today));
  const weekend = $derived($placeQ && $fcQ && usable($placeQ, $fcQ) ? weekendWeather($fcQ, today) : null);
  const season = $derived(seasonNumbers(bikes, trips, debriefs, visits, tasks, today));
  let wkOpen = $state(false);
  let editPlace = $state(false);

  const weekday = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString(locale(), { weekday: 'short' });
  const range = (days) => {
    const lo = Math.min(...days.map((d) => d.max));
    const hi = Math.max(...days.map((d) => d.max));
    return lo === hi ? `${hi} °C` : t('{min} to {max} °C', { min: lo, max: hi });
  };
  const rows = $derived(
    [
      due.points ? { key: 'due', icon: ListChecks, label: t('What is due'), value: `${tn(due.points, '{n} point', '{n} points')} · ${tn(due.bikes, '{n} bike', '{n} bikes')}`, href: '#/bikes?tab=care' } : null,
      dead.dead.length ? { key: 'dead', icon: ShoppingBag, label: t('Dead weight'), value: `${tn(dead.dead.length, '{n} item', '{n} items')}${dead.deadG ? ` · ${formatWeight(dead.deadG)}` : ''}`, href: '#/gear?tab=dead' } : null,
      ago ? { key: 'ago', icon: CalendarHeart, label: t('A year ago'), value: ago.learnings ? t('{trip} + {n} learnings', { trip: ago.trip.title, n: ago.learnings }) : ago.trip.title, href: ago.debriefed ? `#/debrief/${encodeURIComponent(ago.trip.id)}` : '#/pack/past' } : null,
      weekend ? { key: 'weekend', icon: CloudSun, label: t('Weekend weather'), value: range(weekend), toggle: true } : null,
      news ? { key: 'news', icon: Sparkles, label: t('New in the app'), value: tn(news, '{n} update', '{n} updates'), href: '#/features' } : null,
    ].filter(Boolean),
  );
</script>

{#if rows.length || season}
  <div class="jumps-col">
    {#if rows.length}
      <section class="jumps" aria-labelledby="jump-h">
        <h2 id="jump-h" class="lbl">{t('Jump to')}</h2>
        <ul>
          {#each rows as r (r.key)}
            <li data-jump={r.key}>
              {#if r.toggle}
                <button type="button" class="jr" aria-expanded={wkOpen} onclick={() => (wkOpen = !wkOpen)}><r.icon size={20} aria-hidden="true" /><span class="jl">{r.label}</span><span class="jv num">{r.value}</span>{#if wkOpen}<ChevronDown size={18} aria-hidden="true" />{:else}<ChevronRight size={18} aria-hidden="true" />{/if}</button>
                {#if wkOpen}
                  <p class="more">{$placeQ.name.split(',')[0]}: {weekend.map((x) => t('{day} {max} °C {rain}', { day: weekday(x.date), max: x.max, rain: t(RAIN[x.rain]) })).join(' · ')} · <span class="src">Open-Meteo</span> · <button type="button" class="link" onclick={() => (editPlace = !editPlace)} aria-expanded={editPlace}>{t('Change place')}</button></p>
                  {#if editPlace}<HomePlaceForm onchosen={() => (editPlace = false)} />{/if}
                {/if}
              {:else}
                <a class="jr" href={r.href}><r.icon size={20} aria-hidden="true" /><span class="jl">{r.label}</span><span class="jv num">{r.value}</span></a>
              {/if}
            </li>
          {/each}
        </ul>
      </section>
    {/if}
    {#if season}
      <section class="season" aria-labelledby="season-h">
        <h2 id="season-h" class="lbl">{t('Season {year} in numbers', { year: season.year })}</h2>
        <dl>
          {#if season.km}<div><dt>{season.kmBikes > 1 ? tn(season.kmBikes, 'km, {n} bike', 'km, {n} bikes') : t('km')}</dt><dd class="num">{num(season.km)}</dd></div>{/if}
          <div><dt>{tn(season.trips, 'trip|count', 'trips|count')}</dt><dd class="num">{season.trips}</dd></div>
          <div><dt>{tn(season.days, 'trip day', 'trip days')}</dt><dd class="num">{season.days}</dd></div>
          <div><dt>{tn(season.jobs, 'care job', 'care jobs')}</dt><dd class="num">{season.jobs}</dd></div>
        </dl>
        {#if season.cost}<p class="cost">{t('Workshop {year}:', { year: season.year })} <b class="num">{season.cost.unknown === season.cost.visits ? t('cost unknown') : `CHF ${num(Math.round(season.cost.chf))}${season.cost.unknown ? ` + ${t('unknown')}` : ''}`}</b> ({tn(season.cost.visits, '{n} visit', '{n} visits')})</p>{/if}
      </section>
    {/if}
  </div>
{/if}

<style>
  .jumps-col {
    display: flex;
    flex-direction: column;
    gap: 22px;
    min-width: 0;
  }
  .lbl {
    margin: 0;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--line);
    font: 600 var(--fs-small) / 1.3 var(--font-body);
    color: var(--ink-3);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    border-bottom: 1px solid var(--line);
  }
  .jr {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 52px;
    padding: 6px 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: 400 16px var(--font-body);
    text-align: left;
    text-decoration: none;
    cursor: pointer;
  }
  .jr:hover .jl {
    text-decoration: underline;
  }
  .jr :global(svg) {
    flex: none;
    color: var(--ink-2);
  }
  .jl {
    flex: 1 1 auto;
    min-width: 0;
  }
  .jv {
    flex: 0 1 auto;
    min-width: 0;
    color: var(--ink-2);
    text-align: right;
    overflow-wrap: anywhere;
  }
  .more {
    margin: 0 0 10px 32px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .link {
    min-height: 32px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
  .cost {
    margin: 10px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  dl {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
    margin: 10px 0 0;
  }
  dl div {
    display: flex;
    flex-direction: column-reverse;
    min-width: 0;
  }
  dd {
    margin: 0;
    font: 800 30px/1.05 var(--font-brand);
  }
  dt {
    font-size: var(--fs-small);
    color: var(--ink-3);
    overflow-wrap: anywhere;
  }
</style>
