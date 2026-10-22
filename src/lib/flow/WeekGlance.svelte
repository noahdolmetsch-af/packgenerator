<script>
  /**
   * «Aktiv neu» (Noah 22.10.2026, spec «Startseite Aktiv», part 2 «Diese Woche»): Monday to Sunday with what
   * you ticked (a tick per sport, the first by name) and the fixed or planned dates still to come, plus
   * «n Ziele offen». The whole card opens the week page (#/flow/week: plan, fixed dates, Wochenrückblick).
   * acts, states, log: from flowQuery / flowStates; the plan comes from lib/flowweek.js (no suggestions here).
   */
  import { liveQuery } from 'dexie';
  import { Check, Clock, ChevronRight } from '@lucide/svelte';
  import { db } from '../db.js';
  import { FIXED_KEY, PLAN_KEY, fixedList, weekPlan, weekGoals } from '../flowweek.js';
  import { actName } from './ui.svelte.js';
  import { tileName } from './hobby/words.js';
  import { t, tn, locale } from '../i18n.svelte.js';

  let { acts = [], states = [], log = [], today } = $props();
  const setQ = liveQuery(async () => {
    const [f, p] = await Promise.all([db.settings.get(FIXED_KEY), db.settings.get(PLAN_KEY)]);
    return { fixed: fixedList(f?.value), plans: Array.isArray(p?.value) ? p.value : [] };
  });
  const sets = $derived($setQ ?? { fixed: [], plans: [] });
  const week = $derived(weekPlan({ acts, states, log, today, fixed: sets.fixed, plans: sets.plans, no: [], forecast: null }));
  const open = $derived(weekGoals(states).filter((g) => !g.met).length);
  const byId = $derived(new Map(acts.map((a) => [a.id, a])));
  const wd = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', timeZone: 'UTC' }).replace('.', '');
  const name = (id) => {
    const a = byId.get(id);
    return a ? tileName(a) || actName(a) : '';
  };
  const done = (d) => d.items.filter((x) => x.kind === 'done');
  const ahead = (d) => d.items.filter((x) => x.kind === 'fix' || x.kind === 'plan');
  const dayLabel = (d) =>
    [
      new Date(`${d.day}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'long', timeZone: 'UTC' }),
      done(d).length ? tn(done(d).length, '{n} ticked', '{n} ticked') : '',
      ...ahead(d).map((x) => (x.time ? `${name(x.actId)} ${x.time}` : name(x.actId))),
    ]
      .filter(Boolean)
      .join(', ');
</script>

<a class="card wg" href="#/flow/week" data-week-glance>
  <span class="top">
    <span class="wgl">{open ? tn(open, '{n} goal open', '{n} goals open') : t('All goals on track this week')}</span>
    <span class="go">{t('Plan the week')}<ChevronRight size={16} aria-hidden="true" /></span>
  </span>
  <ol class="days">
    {#each week as d (d.day)}
      {@const dn = done(d)}
      {@const ah = ahead(d)}
      <li class:now={d.today} class:past={d.past} aria-label={dayLabel(d)} data-week-day={d.day}>
        <b>{wd(d.day)}</b>
        {#if dn.length}
          <span class="ticks" aria-hidden="true"><Check size={14} strokeWidth={3} />{#if dn.length > 1}<small class="num">{dn.length}</small>{/if}</span>
          <small class="nm">{name(dn[0].actId)}</small>
        {:else if ah.length}
          <span class="fix" aria-hidden="true"><Clock size={14} /></span>
          <small class="nm">{ah[0].time ?? name(ah[0].actId)}</small>
        {:else}
          <span class="none" aria-hidden="true"></span>
        {/if}
      </li>
    {/each}
  </ol>
</a>

<style>
  .wg {
    display: grid;
    gap: var(--sp-3);
    padding: var(--sp-3) var(--sp-4) var(--sp-4);
    color: var(--ink);
    text-decoration: none;
  }
  .top {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px var(--sp-3);
    min-height: 32px;
  }
  .wgl {
    font-weight: 600;
  }
  .go {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    color: var(--accent);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .days {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: grid;
    justify-items: center;
    align-content: start;
    gap: 4px;
    min-width: 0;
    min-height: 72px;
    padding: 8px 2px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    text-align: center;
  }
  li.now {
    border: 2px solid var(--hi);
  }
  b {
    font-size: var(--fs-small);
  }
  .ticks {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    color: var(--hi);
  }
  .ticks small {
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .fix {
    color: var(--ink-3);
  }
  .none {
    width: 8px;
    height: 8px;
    margin-top: 4px;
    border-radius: 50%;
    background: var(--paper-2);
  }
  .nm {
    max-width: 100%;
    overflow: hidden;
    color: var(--ink-3);
    font-size: var(--fs-label);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
