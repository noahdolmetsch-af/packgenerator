<script>
  /**
   * «Woche planen» WP2 (Noah 15.10.2026 «2a»): #/week/plan, about 10 minutes on Sunday. Four steps:
   * 1 what is fixed (dates, holidays) · 2 training (the training plan, «like last week» when empty,
   * sessions on holidays left out) · 3 to-dos · 4 bike service. The app suggests, each suggestion is
   * taken, moved to another day or left out; every step can be skipped. From Saturday on it plans the
   * next week (planMonday). Sessions are written into the training plan (Aktiv › Training), the rest
   * into the week's own list; nothing is kept twice.
   */
  import { Check, X, ArrowRight, Plus, Palmtree, Info } from '@lucide/svelte';
  import PageHead from '../lib/ui/PageHead.svelte';
  import Entry from '../lib/woche/Entry.svelte';
  import { weekQuery, putWeek } from '../lib/woche/load.js';
  import { titleOf, subOf, dayName, shortDate, hours, hintText, reviewLine } from '../lib/woche/words.js';
  import { ITEMS_KEY, NO_KEY, PLANNED_KEY, buildWeek, cleanItem, pruneItems, skipFor, planMonday, daysOf, awayOn, takeSuggestion } from '../lib/woche.js';
  import { homeForecast } from '../lib/home-weather.js';
  import { db } from '../lib/db.js';
  import { PLAN_KEY as TRAIN_KEY, KIND_NAMES as TRAIN_KINDS, shiftDay, copyWeek, cleanSession, prunePlan } from '../lib/training.js';
  import { actName } from '../lib/flow/ui.svelte.js';
  import { localDay } from '../lib/localday.js';
  import { t } from '../lib/i18n.svelte.js';

  const today = localDay();
  const monday = planMonday(today);
  const week7 = daysOf(monday);
  const q = weekQuery(today);
  const src = $derived($q);
  const actOf = $derived(new Map((src?.flowActs ?? []).map((a) => [a.id, a])));
  let forecast = $state(null);
  $effect(() => {
    homeForecast(db)
      .then((f) => (forecast = f))
      .catch(() => (forecast = null));
  });
  const week = $derived(src ? buildWeek({ ...src, forecast, hide: [], monday, today, goalHours: src.goal?.hours ?? null, actName: (id) => actName(actOf.get(id)) || id }) : null);

  const STEPS = [
    { n: 1, name: 'What is fixed' },
    { n: 2, name: 'Training|step' },
    { n: 3, name: 'To-dos' },
    { n: 4, name: 'Bike|step' },
  ];
  let step = $state(1);
  let finished = $state(false);
  const go = (n) => {
    step = n;
    window.scrollTo(0, 0);
  };
  async function finish() {
    await putWeek(PLANNED_KEY, monday);
    finished = true;
    window.scrollTo(0, 0);
  }

  /* step 1: dates and holidays of the week */
  const fixedDays = $derived(week ? week.days.map((d) => ({ ...d, entries: d.entries.filter((e) => e.kind === 'date' || e.kind === 'away') })).filter((d) => d.entries.length) : []);
  let form = $state(null);
  async function addDate(ev) {
    ev.preventDefault();
    const it = cleanItem({ ...form, kind: 'date' });
    if (!it?.day) return;
    await putWeek(ITEMS_KEY, pruneItems([...(src?.rawItems ?? []), it], today));
    form = null;
  }

  /* step 2: training. Planned sessions of the week, and last week's as proposals (those not planned yet) */
  const inWeek = (s) => s.day >= monday && s.day < shiftDay(monday, 7);
  const sessions = $derived((src?.sessions ?? []).filter(inWeek).sort((a, b) => a.day.localeCompare(b.day)));
  let gone = $state([]); // proposals left out (ids)
  const proposals = $derived(copyWeek(src?.sessions ?? [], monday).filter((s) => !gone.includes(keyOf(s)) && !sessions.some((x) => x.day === s.day && x.kind === s.kind)));
  const pausedOn = (day) => awayOn(src?.away ?? [], day)?.pause;
  const plannedMins = $derived(sessions.filter((s) => !pausedOn(s.day)).reduce((n, s) => n + s.mins, 0));
  const nextDay = (day) => week7[(week7.indexOf(day) + 1) % 7];
  const saveTrain = (list) => putWeek(TRAIN_KEY, { sessions: prunePlan(list, today) });
  const keyOf = (s) => `${s.day}|${s.kind}|${s.mins}`;
  const takeProp = (s) => saveTrain([...(src?.sessions ?? []), cleanSession({ ...s, id: '' })]);
  const takeAll = () => saveTrain([...(src?.sessions ?? []), ...proposals.filter((s) => !pausedOn(s.day)).map((s) => cleanSession({ ...s, id: '' }))]);
  const moveSession = (s) => saveTrain((src?.sessions ?? []).map((x) => (x.id === s.id ? { ...x, day: nextDay(x.day) } : x)));
  const removeSession = (s) => saveTrain((src?.sessions ?? []).filter((x) => x.id !== s.id));
  const sessName = (s) => s.name || t(TRAIN_KINDS[s.kind] ?? 'Other|kind');

  /* steps 3 and 4: to-dos and bike service from the suggestions */
  let moved = $state({}); // ref → another day
  const dayFor = (s) => moved[s.ref] ?? s.day ?? week7.find((d) => d >= today) ?? monday;
  const sugg = (kind) => (week?.suggestions ?? []).filter((s) => s.kind === kind);
  async function take(s) {
    const ch = takeSuggestion(s, { items: src?.rawItems ?? [], sessions: src?.sessions ?? [] }, dayFor(s), titleOf(s));
    if (ch.items) await putWeek(ITEMS_KEY, pruneItems(ch.items, today));
    if (ch.sessions) await saveTrain(ch.sessions);
  }
  const other = (s) => (moved = { ...moved, [s.ref]: nextDay(dayFor(s)) });
  const skip = (s) => putWeek(NO_KEY, skipFor(src?.no ?? [], s.ref, monday));
  const plannedOf = (kind) => (week ? week.days.flatMap((d) => d.entries.filter((e) => e.kind === kind && e.own).map((e) => ({ ...e, day: d.day }))) : []);
  let todo = $state('');
  async function addTodo(ev) {
    ev.preventDefault();
    const it = cleanItem({ kind: 'todo', title: todo });
    if (!it) return;
    await putWeek(ITEMS_KEY, [...(src?.rawItems ?? []), it]);
    todo = '';
  }
</script>

<div class="wpl">
  <PageHead title={t('Plan the week')} text={t('Week of {from}–{to} · about 10 minutes · the app suggests, you decide', { from: shortDate(monday), to: shortDate(shiftDay(monday, 6)) })} />

  {#if finished}
    <section class="card wc fin" data-plan-done>
      <h2><Check size={22} aria-hidden="true" />{t('Your week is planned')}</h2>
      <p class="why">{t('Everything stays changeable. Heute shows what is on today.')}</p>
      <a class="btn hi" href="#/week">{t('To the week')}</a>
    </section>
  {:else if week}
    <ol class="steps" aria-label={t('Steps')}>
      {#each STEPS as s (s.n)}
        <li><button type="button" class:ok={s.n < step} aria-current={s.n === step ? 'step' : undefined} onclick={() => go(s.n)}>{#if s.n < step}<Check size={14} aria-hidden="true" />{/if}{s.n} {t(s.name)}</button></li>
      {/each}
    </ol>

    <section class="card wc st" data-step={step} aria-labelledby="wpl-h">
      {#if step === 1}
        <h2 id="wpl-h">{t('What is fixed')}</h2>
        <p class="why">{t('Dates and holidays first, so the rest finds its place.')}</p>
        {#each fixedDays as d (d.day)}
          <div class="row"><span class="d">{dayName(d.day)}</span><div class="ens">{#each d.entries as e (e.id)}<Entry {e} />{/each}</div></div>
        {:else}
          <p class="none">{t('No dates and no holidays this week yet.')}</p>
        {/each}
        {#if form}
          <form class="fx" onsubmit={addDate} data-plan-date>
            <label>{t('Date|week')}<input type="text" bind:value={form.title} required maxlength="80" placeholder={t('e.g. Dentist')} /></label>
            <label>{t('Day')}<select bind:value={form.day}>{#each week7 as d (d)}<option value={d}>{dayName(d, true)}</option>{/each}</select></label>
            <label>{t('Time')}<input type="time" bind:value={form.time} /></label>
            <div class="fb"><button type="submit" class="btn">{t('Save')}</button><button type="button" class="btn" onclick={() => (form = null)}>{t('Cancel')}</button></div>
          </form>
        {:else}
          <div class="fb">
            <button type="button" class="btn" onclick={() => (form = { title: '', day: week7.find((d) => d >= today) ?? monday, time: '' })}><Plus size={16} aria-hidden="true" />{t('Date|week')}</button>
            <a class="btn" href="#/week/away"><Palmtree size={16} aria-hidden="true" />{t('Enter holidays')}</a>
          </div>
        {/if}
        <p class="why sm">{t('Dates from Google Calendar come here by themselves once it is connected (Google part 2).')}</p>
      {:else if step === 2}
        <h2 id="wpl-h">{t('Spread the training')}</h2>
        <p class="why">
          {#if src.goal?.hours}{t('Training plan: {goal} a week · planned {have}', { goal: hours(Math.round(src.goal.hours * 60)), have: hours(plannedMins) })}{:else}{t('Planned this week: {have}', { have: hours(plannedMins) })}{/if}
        </p>
        <ul class="rows">
          {#each sessions as s (s.id)}
            {@const off = pausedOn(s.day)}
            <li data-session={s.id}>
              <span class="d">{dayName(s.day)}</span>
              <span class="tx k-sport"><b>{sessName(s)}</b><small>{hours(s.mins)}{#if off}{' · '}{t('falls on holidays')}{/if}</small></span>
              <span class="acts">
                {#if !off}<button type="button" class="ib" aria-label={t('Move {name} to the next day', { name: sessName(s) })} onclick={() => moveSession(s)}><ArrowRight size={18} aria-hidden="true" /></button>{/if}
                <button type="button" class="ib" aria-label={t('Leave out {name}', { name: sessName(s) })} onclick={() => removeSession(s)}><X size={18} aria-hidden="true" /></button>
              </span>
            </li>
          {/each}
          {#each proposals as s (keyOf(s))}
            {@const off = pausedOn(s.day)}
            <li class="prop" data-proposal={keyOf(s)}>
              <span class="d">{dayName(s.day)}</span>
              <span class="tx k-sport"><b>{sessName(s)}</b><small>{hours(s.mins)} · {off ? t('falls on holidays') : t('like last week')}</small></span>
              <span class="acts">
                <button type="button" class="ib" aria-label={t('Leave out {name}', { name: sessName(s) })} onclick={() => (gone = [...gone, keyOf(s)])}><X size={18} aria-hidden="true" /></button>
                {#if !off}<button type="button" class="ib ok" aria-label={t('Take {name}', { name: sessName(s) })} onclick={() => takeProp(s)}><Check size={18} aria-hidden="true" /></button>{/if}
              </span>
            </li>
          {/each}
        </ul>
        {#if sugg('sport').some((s) => s.act === 'move')}
          <h3 class="sub">{t('The weather')}</h3>
          <ul class="rows">{#each sugg('sport').filter((s) => s.act === 'move') as s (s.ref)}{@render suggRow(s)}{/each}</ul>
        {/if}
        {#each week.hints as h (h.key + (h.day ?? ''))}<p class="why hint" data-load-hint={h.key}><Info size={15} aria-hidden="true" /><span>{hintText(h)}</span></p>{/each}
        {#if reviewLine(week.review)}<p class="why sm" data-review>{reviewLine(week.review)}</p>{/if}
        {#if !sessions.length && !proposals.length}<p class="none">{t('No sessions planned and none last week. Plan them in Aktiv › Training.')}</p>{/if}
        <div class="fb">
          {#if proposals.length}<button type="button" class="btn" onclick={takeAll} data-take-all>{t('Take all')}</button>{/if}
          <a class="btn" href="#/flow/training">{t('Open the training plan')}</a>
        </div>
      {:else if step === 3}
        <h2 id="wpl-h">{t('Spread the to-dos')}</h2>
        <p class="why">{t('To-dos without a day get a day with room.')}</p>
        <ul class="rows">
          {#each sugg('todo') as s (s.ref)}{@render suggRow(s)}{/each}
          {#each plannedOf('todo') as e (e.id)}<li><span class="d">{dayName(e.day)}</span><span class="tx k-todo"><b>{e.title}</b><small>{t('planned')}</small></span></li>{/each}
        </ul>
        {#if !sugg('todo').length && !plannedOf('todo').length}<p class="none">{t('No to-dos yet.')}</p>{/if}
        <form class="fx one" onsubmit={addTodo} data-plan-todo>
          <label>{t('New to-do')}<input type="text" bind:value={todo} maxlength="80" placeholder={t('e.g. Order a tube')} /></label>
          <button type="submit" class="btn"><Plus size={16} aria-hidden="true" />{t('Add')}</button>
        </form>
      {:else}
        <h2 id="wpl-h">{t('Bike service')}</h2>
        <p class="why">{t('What Velos › Care shows as due. Before holidays with a bike it comes first.')}</p>
        <ul class="rows">
          {#each sugg('bike') as s (s.ref)}{@render suggRow(s)}{/each}
          {#each plannedOf('bike') as e (e.id)}<li><span class="d">{dayName(e.day)}</span><span class="tx k-bike"><b>{e.title}</b><small>{t('planned')}</small></span></li>{/each}
        </ul>
        {#if !sugg('bike').length && !plannedOf('bike').length}<p class="none">{t('Nothing due at the bike.')}</p>{/if}
      {/if}

      <div class="nav">
        {#if step > 1}<button type="button" class="btn" onclick={() => go(step - 1)}>{t('Back')}</button>{/if}
        {#if step < 4}<button type="button" class="btn hi" onclick={() => go(step + 1)} data-next>{t('Next|week')}</button>
        {:else}<button type="button" class="btn hi" onclick={finish} data-finish>{t('Finish|week')}</button>{/if}
      </div>
      <p class="why sm">{t('✓ take · → another day · ✕ leave out. Every step can be skipped.')}</p>
    </section>
  {/if}
</div>

{#snippet suggRow(s)}
  <li data-sugg={s.ref}>
    <span class="d">{dayName(dayFor(s))}</span>
    <span class="tx k-{s.kind}"><b>{titleOf(s)}</b>{#if subOf(s)}<small>{subOf(s)}</small>{/if}</span>
    <span class="acts">
      <button type="button" class="ib" aria-label={t('Leave out {name}', { name: titleOf(s) })} onclick={() => skip(s)}><X size={18} aria-hidden="true" /></button>
      <button type="button" class="ib" aria-label={t('Move {name} to the next day', { name: titleOf(s) })} onclick={() => other(s)}><ArrowRight size={18} aria-hidden="true" /></button>
      <button type="button" class="ib ok" aria-label={t('Take {name}', { name: titleOf(s) })} onclick={() => take(s)}><Check size={18} aria-hidden="true" /></button>
    </span>
  </li>
{/snippet}

<style>
  .sub {
    margin: 14px 0 4px;
    font-size: var(--fs-small);
  }
  .hint {
    display: flex;
    align-items: flex-start;
    gap: 6px;
  }
  .hint :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .wpl {
    max-width: 760px;
  }
  .steps {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0 0 16px;
    padding: 0;
    list-style: none;
  }
  .steps button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 14px;
    border: 0;
    border-radius: 99px;
    background: var(--paper-2);
    color: var(--ink-2);
    font: 500 var(--fs-small) / 1.2 var(--font-body);
    cursor: pointer;
  }
  .steps button.ok {
    background: var(--hi-soft);
    color: var(--ink);
  }
  .steps button[aria-current='step'] {
    background: var(--ink);
    color: var(--paper);
  }
  .wc {
    padding: 18px 20px;
  }
  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 4px;
    font-size: var(--fs-section);
  }
  .why {
    margin: 0 0 12px;
    color: var(--ink-2);
  }
  .why.sm {
    margin: 12px 0 0;
    font-size: var(--fs-small);
  }
  .none {
    color: var(--ink-2);
  }
  .rows {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .rows li,
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  .d {
    flex: none;
    width: 70px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .ens {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .tx {
    --k: var(--wk-sport);
    flex: 1;
    min-width: 0;
    padding-left: 10px;
    border-left: 3px solid var(--k);
  }
  .tx.k-todo {
    --k: var(--wk-todo);
  }
  .tx.k-bike {
    --k: var(--wk-bike);
  }
  .tx b {
    display: block;
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .tx small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .prop .tx {
    border-left-style: dashed;
  }
  .acts {
    display: flex;
    gap: 6px;
  }
  .ib {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink-2);
    cursor: pointer;
  }
  .ib.ok {
    border-color: var(--hi);
    background: var(--hi);
    color: var(--hi-ink);
  }
  .fb,
  .nav {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
  }
  .nav {
    margin-top: 20px;
  }
  .fx {
    display: grid;
    grid-template-columns: 2fr 1.4fr 1fr;
    gap: 10px;
    margin-top: 12px;
    align-items: end;
  }
  .fx .fb {
    grid-column: 1 / -1;
    margin: 0;
  }
  .fx.one {
    grid-template-columns: 1fr auto;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: var(--fs-small);
    font-weight: 600;
  }
  input,
  select {
    min-height: 44px;
    font: inherit;
    font-weight: 400;
  }
  .fin .btn.hi {
    margin-top: 8px;
  }
  @media (max-width: 719px) {
    .rows li,
    .row {
      flex-wrap: wrap;
    }
    .d {
      width: 100%;
    }
    .fx {
      grid-template-columns: 1fr;
    }
    .fx.one {
      grid-template-columns: 1fr;
    }
  }
</style>
