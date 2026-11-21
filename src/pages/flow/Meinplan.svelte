<script>
  /**
   * «Mein Trainingsplan» (Noah 21.11.2026 «ich möchte alle entwürfe 1-3 umsetzen», S6, draft m3):
   *   #/flow/trainingsplan   plan and what you did, on one page: the goal, the week in numbers, hours per week (bars: done,
   *                          line: plan), this week unit by unit, plan against what you did for the last 4 weeks.
   * Only to look at: it writes nothing and replaces nothing. Changing is done where it was done before (Wochenplan,
   * Training › Woche). The rules are pure and tested (lib/training/meinplan.js); TrainingPeaks comes later as one more source.
   */
  import { liveQuery } from 'dexie';
  import { CalendarRange, ChevronRight } from '@lucide/svelte';
  import VeloHead from '../../lib/bikes/VeloHead.svelte';
  import Empty from '../../lib/ui/Empty.svelte';
  import BarChart from '../../lib/charts/BarChart.svelte';
  import ChartSheet from '../../lib/charts/ChartSheet.svelte';
  import { db } from '../../lib/db.js';
  import { shiftDay, mondayOf, PLAN_KEY, GOAL_KEY, KIND_NAMES } from '../../lib/training.js';
  import { WEEKPLAN_KEY } from '../../lib/training/wochenplan.js';
  import { WEEKLOG_KEY } from '../../lib/training/wochenlog.js';
  import { UNIT_NAME } from '../../lib/training/wochenplan-text.js';
  import { meinPlan, LOW_PCT } from '../../lib/training/meinplan.js';
  import { localDay } from '../../lib/localday.js';
  import { t, tn, num, locale } from '../../lib/i18n.svelte.js';
  import { hoursMin } from '../../lib/charts/exact.js';
  import '../../lib/ich/ich.css';

  const today = localDay();
  const q = liveQuery(async () => {
    const mon = mondayOf(today);
    const [wp, wl, pl, gl, acts] = await Promise.all([
      db.settings.get(WEEKPLAN_KEY),
      db.settings.get(WEEKLOG_KEY),
      db.settings.get(PLAN_KEY),
      db.settings.get(GOAL_KEY),
      db.activities.where('day').between(shiftDay(mon, -28), shiftDay(mon, 27), true, true).toArray().catch(() => []),
    ]);
    return { stored: wp?.value ?? null, rawLog: wl?.value ?? null, rawPlan: pl?.value ?? null, rawGoal: gl?.value ?? null, acts };
  });
  const d = $derived($q);
  const m = $derived(d ? meinPlan({ ...d, today }) : null);

  /* numbers and days in words */
  const loc = $derived(locale());
  const hm = (mins) => {
    const r = Math.round(mins);
    return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`;
  };
  const hrs = (mins) => {
    const h = mins / 60;
    return h < 10 ? num(Math.round(h * 10) / 10) : num(Math.round(h));
  };
  const dayTxt = (day, o) => new Date(`${day}T12:00:00Z`).toLocaleDateString(loc, { ...o, timeZone: 'UTC' });
  const nameOf = (r) => (r.src === 'session' ? r.name || t(KIND_NAMES[r.kind] ?? 'Other|kind') : t(UNIT_NAME[r.type] ?? r.type));
  const srcOf = (r) => (r.src === 'session' ? t('My week|plan') : t('Weekly plan'));
  const status = (r, monday) => (r.released ? 'let' : r.done ? 'done' : shiftDay(monday, r.d) < today ? 'open' : 'planned');
  const STATUS = { done: 'done|mp', planned: 'planned|mp', open: 'open|mp', let: 'let go|mp' };
  const sources = $derived(m ? [m.sources.weekplan ? t('Weekly plan') : null, m.sources.sessions ? t('My week|plan') : null].filter(Boolean).join(' + ') : '');

  /* the chart: bars = done, line = plan */
  const cols = $derived(
    m
      ? m.weeks.map((w) => ({
          key: w.monday,
          x: String(w.kw),
          top: w.doneMins >= 30 ? hrs(w.doneMins) : '',
          parts: [{ v: w.doneMins / 60, color: 'var(--l1)' }],
        }))
      : [],
  );
  const line = $derived(m ? m.weeks.map((w) => (w.plannedMins > 0 ? w.plannedMins / 60 : null)) : null);
  const readout = (i) => {
    const w = m.weeks[i];
    return { title: t('Calendar week {n}', { n: w.kw }), items: [{ label: t('Done|mp'), value: hoursMin(w.doneMins) }, { label: t('Plan|mp'), value: w.plannedMins > 0 ? hoursMin(w.plannedMins) : '–' }] };
  };
  const table = $derived(
    m
      ? {
          head: [t('Week|mp'), t('Plan|mp'), t('Done|mp')],
          rows: [...m.weeks].reverse().map((w) => ({ key: w.monday, cells: [String(w.kw), w.plannedMins > 0 ? hm(w.plannedMins) : '–', hm(w.doneMins)] })),
        }
      : { head: [], rows: [] },
  );
  const aria = $derived(m ? m.weeks.map((w) => `${t('Calendar week {n}', { n: w.kw })}: ${hrs(w.doneMins)} h`).join(', ') : '');
  let open = $state(null);
  const sheet = $derived(open == null || !m ? null : m.weeks[open]);
</script>

{#snippet unitRows(rows, monday)}
  <ul class="mp-rows">
    {#each rows as r (r.id)}
      {@const st = status(r, monday)}
      <li data-mp-row={r.id} data-mp-status={st}>
        <span class="dy">{dayTxt(shiftDay(monday, r.d), { weekday: 'short' })}</span>
        <a class="nm" href={r.src === 'session' ? '#/flow/training' : '#/flow/wochenplan'}>{nameOf(r)}<small>{srcOf(r)}{r.t ? ` · ${r.t}` : ''}</small></a>
        <b class="num">{r.type === 'rest' ? '' : `${hm(r.done ? r.doneMins : r.mins)} h`}</b>
        <span class="pill" class:ok={st === 'done'}>{t(STATUS[st])}</span>
      </li>
    {/each}
  </ul>
{/snippet}

<div class="mp" data-meinplan>
  <VeloHead crumbs={[{ label: t('Active|place'), href: '#/flow' }, { label: t('Training|tab'), href: '#/flow/training' }]} here={t('My training plan')} title={t('My training plan')} sub={t('Plan and what you did, in one place. Everything is a suggestion, you can change it any time.')} />

  {#if !m}
    <p class="hint" aria-live="polite">{t('Loading…')}</p>
  {:else if !m.hasPlan}
    <Empty icon={CalendarRange} title={t('No plan yet')} text={t('Make a weekly plan or a week suggestion, and this page shows plan and what you did next to each other.')} action={{ label: t('Make a weekly plan'), href: '#/flow/wochenplan' }} action2={{ label: t('Set a goal'), href: '#/flow/training' }} />
  {:else}
    <section class="card mp-sec" aria-labelledby="mp-goal-h" data-mp-goal>
      <h2 id="mp-goal-h">{m.goal?.name ? t('Goal: {name}', { name: m.goal.name }) : t('Goal|mp')}</h2>
      {#if m.goal?.until}
        <p class="hs num">
          {dayTxt(m.goal.until, { day: 'numeric', month: 'long' })}{#if m.goal.passed}{' · '}{t('The goal day has passed. Set a new goal, or leave it as it is.')}{:else if m.goal.weeks != null}{' · '}{tn(m.goal.weeks, '{n} week to go', '{n} weeks to go')}{/if}
        </p>
      {:else if !m.goal}
        <p class="hs">{t('No goal set. A goal is optional, the plan works without it.')}</p>
      {/if}
      <p class="hs" data-mp-sources>{t('Plan from: {list}', { list: sources })}</p>
      <div class="mp-links">
        <a class="btn btn-link sm" href="#/flow/wochenplan" data-mp-change>{t('Change the plan')}<ChevronRight size={16} aria-hidden="true" /></a>
        <a class="btn btn-link sm" href="#/flow/training" data-mp-goal-edit>{m.goal ? t('Change the goal') : t('Set a goal')}<ChevronRight size={16} aria-hidden="true" /></a>
      </div>
      <ul class="kpis" data-mp-kpis>
        <li><b class="num" data-mp-kw>{t('Week {n}|mp', { n: m.kw })}</b><small>{t('Calendar week')}</small></li>
        <li><b class="num" data-mp-hours>{hm(m.week.doneMins)} h</b><small>{m.week.plannedMins > 0 ? t('of {h} h planned', { h: hm(m.week.plannedMins) }) : t('Nothing planned')}</small></li>
        <li><b class="num" data-mp-units>{t('{a} of {b}|mp', { a: m.week.doneUnits, b: m.week.units })}</b><small>{t('Units done')}</small></li>
        <li><b class="num" data-mp-pct>{m.soFar == null ? '–' : `${m.soFar} %`}</b><small>{t('of the plan hours so far')}</small></li>
      </ul>
    </section>

    <section class="card mp-sec" aria-labelledby="mp-chart-h" data-mp-chart>
      <h2 id="mp-chart-h">{t('Hours per week')}</h2>
      <p class="hs">{t('Bars: done · line: plan · under the bars the calendar week')}</p>
      <BarChart id="meinplan" {cols} {readout} {table} {line} onopen={(i) => (open = i)} unit="h" label={t('Hours per week: {list}', { list: aria })} hint={t('Point at a bar for its numbers, tap it for the week.')} />
    </section>

    <section class="card mp-sec" aria-labelledby="mp-week-h" data-mp-week>
      <h2 id="mp-week-h">{t('This week')}</h2>
      <p class="hs">{t('Planned and done. A tap opens the plan, where you can change the day.')}</p>
      {#if m.week.rows.length}
        {@render unitRows(m.week.rows, m.monday)}
      {:else}
        <p class="hint" data-mp-week-empty>{t('Nothing is planned this week.')} <a href="#/flow/wochenplan">{t('To the weekly plan')}</a></p>
      {/if}
    </section>

    <section class="card mp-sec" aria-labelledby="mp-last-h" data-mp-last>
      <h2 id="mp-last-h">{t('Plan against what you did, the last 4 weeks')}</h2>
      {#if m.last.length}
        <ul class="mp-last">
          {#each m.last as w (w.monday)}
            <li data-mp-last-week={w.monday}>
              <b class="num">{t('Week {n}|mp', { n: w.kw })}</b>
              <span class="num">{t('{plan} planned · {done} done', { plan: hm(w.plannedMins), done: hm(w.doneMins) })}</span>
              <span class="pc num" class:low={w.pct != null && w.pct < LOW_PCT}>{w.pct == null ? '–' : `${w.pct} %`}</span>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="hint" data-mp-last-empty>{t('No earlier week with a plan yet. After the first week it shows up here.')}</p>
      {/if}
      <p class="hint">{t('A missed unit can be moved or let go. No alarm, no grade.')}</p>
    </section>
  {/if}
</div>

{#if sheet}
  <ChartSheet kicker={t('My training plan')} title={t('Calendar week {n}', { n: sheet.kw })} onclose={() => (open = null)} onprev={open > 0 ? () => open-- : null} onnext={open < m.weeks.length - 1 ? () => open++ : null} prevLabel={t('Week before|mp')} nextLabel={t('Week after|mp')}>
    <p class="hs num" data-mp-sheet-sum>{sheet.plannedMins > 0 ? t('{plan} planned · {done} done', { plan: hm(sheet.plannedMins), done: hm(sheet.doneMins) }) : t('Nothing planned')}</p>
    {#if sheet.rows.length}
      {@render unitRows(sheet.rows, sheet.monday)}
    {:else}
      <p class="hint">{t('Nothing is planned this week.')}</p>
    {/if}
  </ChartSheet>
{/if}

<style>
  .mp {
    display: grid;
    gap: 16px;
    min-width: 0;
  }
  .mp-sec {
    display: grid;
    gap: 10px;
    min-width: 0;
    padding: 16px 18px;
  }
  .mp-sec h2 {
    margin: 0;
    font-size: var(--fs-sub);
    overflow-wrap: break-word;
  }
  .hs {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .mp-links {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
  }
  .kpis {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  @media (min-width: 900px) {
    .kpis {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
  .kpis li {
    display: grid;
    gap: 2px;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--paper-2);
    min-width: 0;
  }
  .kpis b {
    font-size: var(--fs-section);
    line-height: 1.1;
  }
  .kpis small {
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .mp-rows {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .mp-rows li {
    display: grid;
    grid-template-columns: 2.2rem minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 2px 10px;
    min-height: 48px;
    border-top: 1px solid var(--line);
  }
  .dy {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .mp-rows .nm {
    display: grid;
    min-width: 0;
    color: inherit;
    text-decoration: none;
    overflow-wrap: break-word;
  }
  .mp-rows .nm small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .mp-last {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .mp-last li {
    display: grid;
    grid-template-columns: 5.5rem minmax(0, 1fr) 3.5rem;
    align-items: baseline;
    gap: 8px;
    min-height: 44px;
    border-top: 1px solid var(--line);
  }
  .pc {
    text-align: right;
    color: var(--l1);
    font-weight: 700;
  }
  .pc.low {
    color: var(--l2);
  }
</style>
