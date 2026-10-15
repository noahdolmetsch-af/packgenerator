<script>
  /**
   * «Woche planen» WP1 (mockup, Noah 15.10.2026 21:11 «1a 2a 3b 4a 5a»): #/week, the place «Woche».
   * Monday to Sunday with sport and the training plan, dates, to-dos, holidays and bike service, each
   * kind in its colour and deselectable (chips). Right: «Still to plan», the suggestions (take or skip),
   * the button «Plan the week» and a small form to add a date or a to-do. On a phone the days fold to
   * one line each (Noah «2a»), today open. Rules: lib/woche.js; data: lib/woche/load.js.
   */
  import { Plus, CalendarCheck, ChevronRight, Palmtree } from '@lucide/svelte';
  import PageHead from '../lib/ui/PageHead.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import Entry from '../lib/woche/Entry.svelte';
  import { weekQuery, putWeek } from '../lib/woche/load.js';
  import { titleOf, subOf, dayName, shortDate, hours } from '../lib/woche/words.js';
  import { ITEMS_KEY, HIDE_KEY, NO_KEY, TRAIN_NOTE, KINDS, KIND_NAMES, buildWeek, cleanItem, pruneItems, skipFor, planMonday, dotsOf } from '../lib/woche.js';
  import { PLAN_KEY as TRAIN_KEY, mondayOf, shiftDay, isoWeek, prunePlan } from '../lib/training.js';
  import { actName } from '../lib/flow/ui.svelte.js';
  import { localDay } from '../lib/localday.js';
  import { phone } from '../lib/media.svelte.js';
  import { t, tn } from '../lib/i18n.svelte.js';

  const today = localDay();
  const q = weekQuery(today);
  const src = $derived($q);
  let next = $state(false);
  const monday = $derived(shiftDay(mondayOf(today), next ? 7 : 0));
  const actOf = $derived(new Map((src?.flowActs ?? []).map((a) => [a.id, a])));
  const week = $derived(src ? buildWeek({ ...src, monday, today, goalHours: src.goal?.hours ?? null, actName: (id) => actName(actOf.get(id)) || id }) : null);
  const range = $derived(`${shortDate(monday)}–${shortDate(shiftDay(monday, 6))}`);
  const due = $derived(src && src.planned !== planMonday(today));

  async function saveItems(list) {
    await putWeek(ITEMS_KEY, pruneItems(list, today));
  }
  const items = () => src?.rawItems ?? [];
  const toggleDone = (e) => saveItems(items().map((x) => (x.id === e.id ? { ...x, done: !x.done } : x)));
  const remove = (e) => saveItems(items().filter((x) => x.id !== e.id));
  const toggleKind = (k) => putWeek(HIDE_KEY, src.hide.includes(k) ? src.hide.filter((x) => x !== k) : [...src.hide, k]);

  async function take(s) {
    if (s.kind === 'todo') return saveItems(items().map((x) => (x.id === s.id ? { ...x, day: s.day } : x)));
    if (s.kind === 'bike') return saveItems([...items(), cleanItem({ kind: 'bike', title: s.title, day: s.day, bikeId: s.bikeId, part: s.part })]);
  }
  async function drop(s) {
    // a session paused by holidays: «leave it out» takes it out of the training plan
    const id = s.ref.slice('drop:'.length);
    await putWeek(TRAIN_KEY, { sessions: prunePlan(src.sessions.filter((x) => x.id !== id), today) });
  }
  const skip = (s) => putWeek(NO_KEY, skipFor(src.no, s.ref, monday));

  /* add a date or a to-do */
  let form = $state(null);
  const startAdd = (kind) => (form = { kind, title: '', day: kind === 'date' ? (today >= monday ? today : monday) : '', time: '' });
  async function add(ev) {
    ev.preventDefault();
    const it = cleanItem(form);
    if (!it || (it.kind === 'date' && !it.day)) return;
    await saveItems([...items(), it]);
    form = null;
  }
  const hidden = (k) => src?.hide.includes(k);
</script>

<div class="wkp">
  <PageHead title={next ? t('Next week') : t('This week')} text={t('Week {n} · {range} · everything here is a suggestion and can be hidden', { n: isoWeek(monday), range })} />

  {#if week}
    <div class="top">
      <Seg label={t('Which week')} full={false} options={[{ key: 'now', name: t('This week') }, { key: 'next', name: t('Next week') }]} value={next ? 'next' : 'now'} onchange={(k) => (next = k === 'next')} />
      <div class="chips" role="group" aria-label={t('Show in the week')}>
        {#each KINDS as k (k)}
          <button type="button" class="chip k-{k}" aria-pressed={!hidden(k)} data-filter={k} onclick={() => toggleKind(k)}><span class="dot" aria-hidden="true"></span>{t(KIND_NAMES[k])}</button>
        {/each}
      </div>
    </div>

    <p class="sum" data-week-sum>
      <span>{tn(week.sums.sessions, '{n} session|week', '{n} sessions|week')}{#if week.sums.mins}{' · '}<b class="num">{hours(week.sums.mins)}</b>{/if}{#if week.sums.goalMins}{' '}{t('(plan: {h})', { h: hours(week.sums.goalMins) })}{/if}</span>
      <span>{tn(week.sums.dates, '{n} date', '{n} dates')}</span>
      <span>{tn(week.sums.todos, '{n} to-do', '{n} to-dos')}</span>
      {#if week.sums.away.length}<span><Palmtree size={14} aria-hidden="true" /> {week.sums.away.length === 1 ? dayName(week.sums.away[0]) : `${dayName(week.sums.away[0])}–${dayName(week.sums.away.at(-1))}`}</span>{/if}
      {#if week.sums.bike}<span>{tn(week.sums.bike, '{n} bike job', '{n} bike jobs')}</span>{/if}
    </p>

    <div class="lay">
      <section class="days" aria-label={t('The days of the week')}>
        {#each week.days as d (d.day)}
          {#if phone.matches}
            <details class="dr" class:today={d.today} open={d.today || undefined} data-day={d.day}>
              <summary>
                <b>{dayName(d.day)}</b>
                <span class="dots" aria-hidden="true">{#each dotsOf(d) as k (k)}<i class="k-{k}"></i>{/each}</span>
                <span class="cnt">{d.today ? t('today') : tn(d.entries.length, '{n} entry', '{n} entries')}</span>
                <ChevronRight size={18} aria-hidden="true" />
              </summary>
              <div class="ens">
                {#each d.entries as e (e.id)}<Entry {e} ondone={toggleDone} onremove={remove} />{:else}<p class="none">{t('Nothing planned')}</p>{/each}
              </div>
            </details>
          {:else}
            <div class="dc" class:today={d.today} class:past={d.past} data-day={d.day}>
              <h3><span>{dayName(d.day).split(' ')[0]}</span> <b class="num">{dayName(d.day).split(' ').slice(1).join(' ')}</b></h3>
              {#each d.entries as e (e.id)}<Entry {e} ondone={toggleDone} onremove={remove} />{/each}
            </div>
          {/if}
        {/each}
      </section>

      <aside class="side">
        <section class="card wc sg" aria-labelledby="wk-sg">
          <h2 id="wk-sg">{t('Still to plan')}</h2>
          <p class="why">{t('The app suggests, you decide. Take puts it on the day shown.')}</p>
          <ul>
            {#each week.suggestions as s (s.ref)}
              <li class="k-{s.kind}" data-sugg={s.ref}>
                <span class="dot" aria-hidden="true"></span>
                <span class="st"><b>{titleOf({ ...s, sessionKind: s.sessionKind })}</b><small>{[subOf(s), s.day && s.act === 'take' ? t('suggested: {day}', { day: dayName(s.day) }) : ''].filter(Boolean).join(' · ')}</small></span>
                <span class="sb">
                  {#if s.act === 'drop'}<button type="button" class="btn sm" onclick={() => drop(s)}>{t('Leave out')}</button>
                  {:else if s.day}<button type="button" class="btn sm" onclick={() => take(s)}>{t('Take')}</button>{/if}
                  <button type="button" class="btn sm" onclick={() => skip(s)}>{t('Not this week')}</button>
                </span>
              </li>
            {:else}
              <li class="none">{t('Nothing left to plan.')}</li>
            {/each}
          </ul>
          <a class="btn hi" href="#/week/plan" data-plan-week><CalendarCheck size={18} aria-hidden="true" />{due ? t('Plan the week (10 min)') : t('Plan the week again')}</a>
        </section>

        <section class="card wc add" aria-labelledby="wk-add">
          <h2 id="wk-add">{t('Add')}</h2>
          {#if form}
            <form onsubmit={add} data-week-form>
              <label>{form.kind === 'date' ? t('Date|week') : t('To-do')}<input type="text" bind:value={form.title} required maxlength="80" placeholder={form.kind === 'date' ? t('e.g. Dentist') : t('e.g. Order a tube')} /></label>
              <div class="two">
                <label>{t('Day')}<input type="date" bind:value={form.day} required={form.kind === 'date'} /></label>
                {#if form.kind === 'date'}<label>{t('Time')}<input type="time" bind:value={form.time} /></label>{/if}
              </div>
              {#if form.kind === 'todo'}<p class="why">{t('Without a day it waits under «Still to plan».')}</p>{/if}
              <div class="fb"><button type="submit" class="btn">{t('Save')}</button><button type="button" class="btn" onclick={() => (form = null)}>{t('Cancel')}</button></div>
            </form>
          {:else}
            <div class="fb">
              <button type="button" class="btn" onclick={() => startAdd('date')} data-add="date"><Plus size={16} aria-hidden="true" />{t('Date|week')}</button>
              <button type="button" class="btn" onclick={() => startAdd('todo')} data-add="todo"><Plus size={16} aria-hidden="true" />{t('To-do')}</button>
              <a class="btn" href="#/week/away"><Palmtree size={16} aria-hidden="true" />{t('Holidays|tab')}</a>
            </div>
          {/if}
          <p class="why">{t(TRAIN_NOTE)}</p>
        </section>
      </aside>
    </div>
  {/if}
</div>

<style>
  .wkp {
    max-width: 1240px;
  }
  .top {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 16px;
    margin: 0 0 12px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    --k: var(--wk-sport);
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 40px;
    padding: 6px 12px;
    border: 1px solid var(--line-strong);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.2 var(--font-body);
    cursor: pointer;
  }
  .chip[aria-pressed='false'] {
    border-style: dashed;
    color: var(--ink-2);
  }
  .chip[aria-pressed='false'] .dot {
    background: transparent;
    box-shadow: inset 0 0 0 2px var(--k);
  }
  .k-date {
    --k: var(--wk-date);
  }
  .k-todo {
    --k: var(--wk-todo);
  }
  .k-away {
    --k: var(--wk-away);
  }
  .k-bike {
    --k: var(--wk-bike);
  }
  .k-sport {
    --k: var(--wk-sport);
  }
  .dot,
  .dots i {
    display: inline-block;
    flex: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--k);
  }
  .sum {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 18px;
    margin: 0 0 16px;
    color: var(--ink-2);
  }
  .sum span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .sum b {
    color: var(--ink);
  }
  /* the seven days take the full width; «Still to plan» and «Add» sit beneath them, beside only on very wide screens */
  .lay {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
    align-items: start;
  }
  .days {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 8px;
  }
  .dc {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    min-height: 320px;
    padding: 10px 8px;
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .dc.today {
    outline: 2px solid var(--pc);
    outline-offset: 1px;
  }
  .dc.past {
    opacity: 0.8;
  }
  .dc h3 {
    display: flex;
    justify-content: space-between;
    margin: 0 2px 4px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .dc h3 b {
    color: var(--ink);
    font-size: var(--fs-body);
  }
  .side {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    align-items: start;
  }
  @media (min-width: 1800px) {
    .lay {
      grid-template-columns: minmax(0, 1fr) 300px;
    }
    .side {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .wc {
    padding: 16px;
  }
  h2 {
    margin: 0 0 4px;
    font-size: var(--fs-section);
  }
  .why {
    margin: 0 0 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .sg ul {
    margin: 0 0 14px;
    padding: 0;
    list-style: none;
  }
  .sg li {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  .sg li .dot {
    margin-top: 6px;
  }
  .st {
    flex: 1;
    min-width: 0;
  }
  .st b {
    display: block;
    font-weight: 600;
  }
  .st small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .sb {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    width: 100%;
    padding-left: 18px;
  }
  .none {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .sg .btn.hi {
    width: 100%;
    justify-content: center;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: var(--fs-small);
    font-weight: 600;
  }
  input {
    min-height: 44px;
    font: inherit;
    font-weight: 400;
  }
  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .fb {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 6px 0 10px;
  }
  /* phone: one line per day (summary), today open */
  .dr {
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .dr.today {
    outline: 2px solid var(--pc);
  }
  summary {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 52px;
    padding: 0 14px;
    cursor: pointer;
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary b {
    width: 64px;
    flex: none;
  }
  summary .dots {
    display: flex;
    gap: 4px;
  }
  summary .cnt {
    flex: 1;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .dr[open] summary :global(svg) {
    transform: rotate(90deg);
  }
  .ens {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 0 14px 14px;
  }
  @media (max-width: 1100px) {
    .side {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  @media (max-width: 719px) {
    .days {
      grid-template-columns: minmax(0, 1fr);
    }
    .chip {
      min-height: 44px;
    }
  }
</style>
