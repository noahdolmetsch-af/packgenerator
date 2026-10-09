<script>
  /**
   * v0.51.0 «Im Flow»: «Ziele × Tage». One row per activity, one column per day (7 on a phone, 14 on
   * a computer, the older week left of a thin line), a dot where something was ticked, a dashed ring
   * where a daily goal is still open today. Right: the goal (computer) and the stand of its own
   * rolling window («6/7», «4/3 ✓»). Resting activities: pale rows on a computer, folded on a phone.
   */
  import { Pencil, Snowflake, ChevronDown } from '@lucide/svelte';
  import ActIcon from './ActIcon.svelte';
  import { gridRow, lastDays } from '../flow.js';
  import { actName } from './ui.svelte.js';
  import { actGoalText, standText, standTone, dayShort, wd, dnum } from './words.js';
  import { t } from '../i18n.svelte.js';

  let { states = [], log = [], today, tripDays = [], wide = false } = $props();
  const n = $derived(wide ? 14 : 7);
  const days = $derived(lastDays(today, n));
  const active = $derived(states.filter((s) => !s.resting));
  const resting = $derived(states.filter((s) => s.resting));
  const restGroups = $derived.by(() => {
    const by = new Map();
    for (const s of resting) by.set(s.restUntil ?? '', [...(by.get(s.restUntil ?? '') ?? []), s]);
    return [...by.entries()];
  });
  // the phone's goal line under the name: «täglich», «10 täglich», «3× / 7 Tage» (sub-goals added up)
  const shortGoal = (s) => {
    const gs = s.goals.map((r) => r.goal);
    if (gs.every((q) => q.days === 1)) return actGoalText(s.act, today, { season: false, min: false });
    return t('{n}× / {d} days', { n: gs.reduce((a, q) => a + q.count, 0), d: gs[0].days });
  };
  const WORD = { done: 'done', open: 'open today', none: 'nothing' };
</script>

<div class="gg" class:wide>
  <table>
    <thead>
      <tr>
        <th scope="col" class="an">{wide ? t('Activity') : t('rolling · {n} days', { n: 7 })}</th>
        {#each days as d, i (d)}
          <th scope="col" class="d" class:today={d === today} class:split={wide && i === 7}><span class="wd">{wd(d)}</span><span class="num">{dnum(d)}</span></th>
        {/each}
        {#if wide}<th scope="col" class="gl">{t('Goal (rolling)')}</th>{/if}
        <th scope="col" class="st">{t('Stand|flow')}</th>
        {#if wide}<th scope="col" class="ed"><span class="sr">{t('Edit')}</span></th>{/if}
      </tr>
    </thead>
    <tbody>
      {#each active as s (s.act.id)}
        {@const cells = gridRow(s, log, days, today, tripDays)}
        <tr data-row={s.act.id}>
          <th scope="row" class="an">
            <span class="nmw">
              {#if wide}<ActIcon icon={s.act.icon} ring={s.act.ring} size={17} />{:else}<ActIcon icon={s.act.icon} ring={s.act.ring} box={false} size={17} />{/if}
              <span class="nm"><b>{actName(s.act)}</b>{#if !wide}<small>{shortGoal(s)}</small>{/if}</span>
            </span>
          </th>
          {#each cells as c, i (days[i])}
            <td class="d {c} {s.act.ring}" class:today={days[i] === today} class:split={wide && i === 7}><span class="dot" aria-hidden="true"></span><span class="sr">{dayShort(days[i])}: {t(WORD[c])}</span></td>
          {/each}
          {#if wide}<td class="gl">{actGoalText(s.act, today)}{#if s.act.counts.includes('commute')}{' · '}{t('commuting counts')}{/if}</td>{/if}
          <td class="st num {standTone(s)}">{standText(s)}</td>
          {#if wide}<td class="ed"><a class="pen row-acts" href="#/flow/edit/{s.act.id}" aria-label={t('Edit {name}', { name: actName(s.act) })}><Pencil size={16} aria-hidden="true" /></a></td>{/if}
        </tr>
      {/each}
      {#if wide}
        {#each resting as s (s.act.id)}
          <tr class="rest" data-row={s.act.id}>
            <th scope="row" class="an"><span class="nmw"><ActIcon icon={s.act.icon} ring={s.act.ring} size={17} dim /><span class="nm"><b>{actName(s.act)}</b></span></span></th>
            <td class="rt" colspan={n}><Snowflake size={14} aria-hidden="true" /> {t('rests until {date}', { date: dayShort(s.restUntil) })}</td>
            <td class="gl">{actGoalText(s.act, s.restUntil ?? today)}</td>
            <td class="st"></td>
            <td class="ed"><a class="pen row-acts" href="#/flow/edit/{s.act.id}" aria-label={t('Edit {name}', { name: actName(s.act) })}><Pencil size={16} aria-hidden="true" /></a></td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
  <p class="legend"><span class="li"><span class="dot k-done" aria-hidden="true"></span>{t('done')}</span><span class="li"><span class="dot k-open" aria-hidden="true"></span>{t('open today')}</span><span class="li"><span class="dot k-none" aria-hidden="true"></span>{t('nothing')}</span></p>
  {#if !wide && resting.length}
    {#each restGroups as [until, list] (until)}
      <details class="rested">
        <summary><Snowflake size={16} aria-hidden="true" /><span>{t('Rests until {date}:', { date: dayShort(until) })} {list.map((s) => actName(s.act)).join(' · ')}</span><ChevronDown size={18} class="chev" aria-hidden="true" /></summary>
        <ul>
          {#each list as s (s.act.id)}
            <li><a href="#/flow/edit/{s.act.id}"><ActIcon icon={s.act.icon} ring={s.act.ring} size={16} dim /><span>{actName(s.act)}</span><small>{actGoalText(s.act, s.restUntil ?? today)}</small></a></li>
          {/each}
        </ul>
      </details>
    {/each}
  {/if}
</div>

<style>
  .gg {
    min-width: 0;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: auto;
  }
  th,
  td {
    padding: 0;
    font-weight: 400;
    text-align: left;
  }
  thead th {
    padding-bottom: 6px;
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 400;
    vertical-align: bottom;
    border-bottom: 1px solid var(--line);
  }
  thead th.d {
    text-align: center;
    line-height: 1.1;
  }
  thead th.d span {
    display: block;
  }
  thead th.d.today {
    color: var(--hi);
    font-weight: 600;
  }
  tbody tr {
    border-bottom: 1px solid var(--line);
  }
  tbody tr:last-child {
    border-bottom: 0;
  }
  .an {
    padding: 6px 6px 6px 0;
  }
  .nmw :global(svg) {
    flex: none;
  }
  .nmw {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .nm {
    min-width: 0;
    line-height: 1.2;
  }
  .nm b {
    display: block;
    font-weight: 500;
  }
  .nm small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .wide .an {
    padding-block: 8px;
  }
  td.d {
    position: relative;
    width: 28px;
    height: 46px;
    text-align: center;
  }
  .d.today {
    background: var(--paper-2);
  }
  .split {
    border-left: 1px solid var(--line);
  }
  .dot {
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--line);
    vertical-align: middle;
  }
  .done .dot {
    width: 14px;
    height: 14px;
  }
  .done.move .dot {
    background: var(--hi);
  }
  .done.mind .dot {
    background: var(--accent);
  }
  .done.rest .dot {
    background: var(--l3);
  }
  .open .dot {
    width: 14px;
    height: 14px;
    background: none;
    border: 2px dashed var(--ink-3);
  }
  .st {
    padding-left: 8px;
    text-align: right;
    white-space: nowrap;
    font-weight: 500;
  }
  thead .st {
    text-align: right;
  }
  .st.ok {
    color: var(--ok);
  }
  .st.warn {
    color: var(--warn);
  }
  .gl {
    padding-left: 16px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ed {
    width: 44px;
    text-align: right;
  }
  .pen {
    display: inline-grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    color: var(--ink-2);
  }
  .pen:hover {
    background: var(--paper-2);
  }
  tr.rest .an,
  tr.rest .gl {
    color: var(--ink-3);
  }
  .rt {
    color: var(--ink-3);
    font-size: var(--fs-small);
    text-align: center;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin: 10px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .k-done {
    width: 12px;
    height: 12px;
    background: var(--hi);
  }
  .k-open {
    width: 12px;
    height: 12px;
    background: none;
    border: 2px dashed var(--ink-3);
  }
  .rested {
    margin-top: 10px;
    border-top: 1px solid var(--line);
  }
  .rested summary {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    color: var(--ink-2);
    cursor: pointer;
    list-style: none;
  }
  .rested summary::-webkit-details-marker {
    display: none;
  }
  .rested summary span {
    flex: 1;
    min-width: 0;
  }
  .rested[open] :global(.chev) {
    transform: rotate(180deg);
  }
  .rested ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .rested a {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    color: var(--ink);
    text-decoration: none;
  }
  .rested small {
    margin-left: auto;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  @media (max-width: 359px) {
    td.d {
      width: 22px;
    }
    thead th.d .wd {
      display: none;
    }
    .done .dot,
    .open .dot {
      width: 11px;
      height: 11px;
    }
  }
</style>
