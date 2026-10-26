<script>
  /**
   * «Verschleiss» (Noah 20.10.2026, answer 2b): the short view in Bike care. The three most worn parts
   * with a bar and «X km left», the km since the last service, and the way to the page «Wear».
   * bike: the bike with its workshop jobs (withVisits) and km; entries: its km book (for the date).
   */
  import { Gauge, ChevronRight } from '@lucide/svelte';
  import { t, tn, num, dateOf, locale } from '../i18n.svelte.js';
  import { bikesHash } from '../bikes.js';
  import { localDay } from '../localday.js';
  import { wearRows, wearSummary, servicePeriods } from '../wear.js';
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { nextTrip } from '../debrief.js';
  import { chainPlan } from '../chainplan.js';
  import { stepTitle } from './chaintext.js';

  let { bike, entries = [] } = $props();

  const today = localDay();
  const rows = $derived(wearRows(bike, { entries, today }));
  const sum = $derived(wearSummary(rows));
  // «Verschleiss immer im Griff» (Noah 20.10.2026): the chain always first, then the most worn parts
  const known = $derived(rows.filter((r) => r.state !== 'unknown'));
  const top = $derived([...known.filter((r) => r.key === 'chain'), ...known.filter((r) => r.key !== 'chain')].slice(0, 3));
  const now = $derived(servicePeriods(bike, today).find((p) => p.now) ?? null);
  // «Kette vorausschauend» (25.10.2026): the chain's most urgent next step, one line
  const tripsQ = liveQuery(() => db.trips.toArray());
  const chainStep = $derived(chainPlan(bike, { entries, today, trip: nextTrip(($tripsQ ?? []).filter((x) => x.bikeId === bike.id), today) })?.steps[0] ?? null);
  const month = (day) => new Date(`${day}T00:00:00Z`).toLocaleDateString(locale(), { month: 'short', year: 'numeric', timeZone: 'UTC' });
</script>

<section class="wcard" aria-labelledby="wc-h-{bike.id}" data-wear-card={sum.state}>
  <a class="head" href={bikesHash({ tab: 'care', view: 'wear', bike: bike.id })}>
    <Gauge size={18} aria-hidden="true" />
    <span class="m">
      <b id="wc-h-{bike.id}">{t('Wear|page')}</b>
      <small>{sum.n ? tn(sum.n, '{n} part soon to replace', '{n} parts soon to replace') : sum.state === 'ok' ? t('All parts fine') : t('Set start points, then the app can tell')}{#if now?.km != null}{' · '}{t('{km} km since the service on {date}', { km: num(now.km), date: dateOf(now.from) })}{/if}</small>
    </span>
    <ChevronRight size={18} aria-hidden="true" />
  </a>
  {#if chainStep}
    <a class="next {chainStep.tone}" href={bikesHash({ tab: 'care', view: 'wear', bike: bike.id })} data-chain-next={chainStep.kind}>{t('Next|chain')}: {stepTitle(chainStep)}</a>
  {/if}
  {#if top.length}
    <ul>
      {#each top as r (r.key)}
        <li class={r.state} data-wear-mini={r.key}>
          <span class="n">{r.name}</span>
          <span class="bar" aria-hidden="true"><span style:width="{Math.min(100, Math.round((r.frac ?? 0) * 100))}%"></span></span>
          <small class="num">{r.left == null ? t(r.state === 'due' ? 'replace now' : 'soon') : r.left > 0 ? t('{km} km left', { km: num(r.left) }) : t('{km} km over', { km: num(-r.left) })}{#if r.due && r.left > 0}{' · '}{month(r.due)}{/if}</small>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .wcard {
    margin: 0 0 14px;
    padding: 10px 14px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    min-width: 0;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    color: inherit;
    text-decoration: none;
  }
  .m {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-width: 0;
  }
  .m small {
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .next {
    display: flex;
    align-items: center;
    min-height: 44px;
    font-size: var(--fs-small);
    font-weight: 600;
    color: inherit;
  }
  .next.due {
    color: var(--bad);
  }
  ul {
    list-style: none;
    margin: 6px 0 0;
    padding: 0;
  }
  li {
    display: grid;
    grid-template-columns: minmax(0, 9rem) minmax(60px, 1fr) auto;
    align-items: center;
    gap: 10px;
    min-height: 32px;
    font-size: var(--fs-small);
  }
  .n {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .bar {
    height: 6px;
    border-radius: 3px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .bar span {
    display: block;
    height: 100%;
    background: var(--ok);
  }
  .soon .bar span {
    background: var(--warn);
  }
  .due .bar span {
    background: var(--bad);
  }
  small.num {
    color: var(--ink-2);
    white-space: nowrap;
  }
  @media (max-width: 420px) {
    li {
      grid-template-columns: minmax(0, 1fr) auto;
    }
    .bar {
      grid-column: 1 / -1;
      grid-row: 2;
    }
  }
</style>
