<script>
  /**
   * «Eigene Wochenziele» (Noah 05.11.2026, Ideen für alle Bereiche, Aktiv 4b): on Aktiv, a few goals of your own for the
   * calendar week Monday to Sunday (2× Meditation, 150 km …), a bar each. Add them with one tap or your own, change the
   * number, put them in another order (arrows and drag) and delete them (with Undo). Rules: weekgoals.js.
   */
  import { liveQuery } from 'dexie';
  import { Bike, Trash2, Plus, ChevronRight, Check } from '@lucide/svelte';
  import Sec from './kit/Sec.svelte';
  import ActIcon from './ActIcon.svelte';
  import Empty from '../ui/Empty.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { sortable } from '../ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { db } from '../db.js';
  import { putSetting } from '../flowdb.js';
  import { countedRidesSince } from '../kmbook.js';
  import { actName } from './ui.svelte.js';
  import { WEEK_GOALS_KEY, goalsOf, standsOf, weekRange, addGoal, setOf, typedOf, removeGoal, stepGoal, moveTo, suggestions } from './weekgoals.js';
  import { t, tn, num } from '../i18n.svelte.js';

  let { acts = [], log = [], tripDays = [], today } = $props();
  const goalsQ = liveQuery(() => db.settings.get(WEEK_GOALS_KEY));
  const goals = $derived(goalsOf($goalsQ?.value));
  const ridesQ = liveQuery(() => countedRidesSince(db, weekRange(today).from));
  const stands = $derived(standsOf(goals, { acts, log, tripDays, rides: $ridesQ ?? [], today }));
  const live = $derived(acts.filter((a) => !a.paused));
  const sugg = $derived(suggestions(acts, goals));
  const save = (list) => putSetting(db, WEEK_GOALS_KEY, list);

  let editing = $state(false);
  let adding = $state(false);
  let pick = $state('km');
  let amount = $state('');
  const nameOf = (g) => (g.kind === 'km' ? t('Bike km') : actName(acts.find((a) => a.id === g.actId)) || t('Activity'));
  const addable = $derived([{ value: 'km', label: t('Bike km'), off: goals.some((g) => g.kind === 'km') }, ...live.map((a) => ({ value: `act:${a.id}`, label: actName(a), off: goals.some((g) => g.actId === a.id) }))].filter((o) => !o.off));
  const unit = (g, n) => (g.kind === 'km' ? `${num(n)} km` : `${num(n)}×`);
  const line = (s) => (s.missing ? t('This sport is gone. Change or delete the goal.') : s.met ? t('Reached') : t('{have} of {of}', { have: unit(s.goal, s.have), of: unit(s.goal, s.of) }));

  function add(spec) {
    save(addGoal(goals, spec));
  }
  function addOwn(e) {
    e.preventDefault();
    const of = typedOf(amount);
    const o = addable.find((x) => x.value === pick) ?? addable[0];
    if (!of || !o) return;
    add(o.value === 'km' ? { kind: 'km', of } : { kind: 'act', actId: o.value.slice(4), of });
    amount = '';
    pick = '';
    adding = false;
  }
  async function drop(s) {
    const before = $state.snapshot(goals);
    const name = nameOf(s.goal);
    const answer = await askDelete({ title: t('Delete the week goal «{name}»?', { name }), text: t('Only the goal goes. Your ticks and rides stay.') });
    if (answer !== 'delete') return;
    await deleteWithUndo({ run: () => save(removeGoal(goals, s.goal.id)), undo: () => save(before), text: t('«{name}» deleted.', { name }), name });
  }
  const allMet = $derived(stands.length > 0 && stands.every((s) => s.met));
</script>

{#snippet chips()}
  {#if sugg.length}
    <p class="sg" data-wg-sugg>
      {#each sugg as s (s.kind + (s.actId ?? ''))}
        <button type="button" class="chip" data-wg-add={s.kind === 'km' ? 'km' : s.actId} onclick={() => add(s)}><Plus size={14} aria-hidden="true" />{nameOf(s)} · {unit(s, s.of)}</button>
      {/each}
    </p>
  {/if}
{/snippet}

<Sec id="wg-h" title={t('My week goals')} sub={t('Monday to Sunday, your own, change them any time')} more={goals.length ? { label: editing ? t('Done') : t('Change'), onclick: () => (editing = !editing), expanded: editing } : null}>
  {#if !goals.length && !adding}
    <div data-wg-empty>
      <Empty icon={Bike} text={t('No week goals yet. A small goal for the week, like 2× meditation or 150 km, shows how far you are.')} action={{ label: t('Add a week goal'), onclick: () => (adding = true) }} />
      {@render chips()}
    </div>
  {:else if goals.length}
    {#if editing}
      <p class="hint">{t('Move with the arrows or the handle. Tap a number to change it.')}</p>
      <ul class="card wg ed" data-wg-list use:sortable={{ onmove: (from, to) => save(moveTo(goals, from, to)) }}>
        {#each stands as s, i (s.goal.id)}
          <li data-sort-id={s.goal.id} data-wg={s.goal.id}>
            <SortGrip name={nameOf(s.goal)} onstep={(dir) => save(stepGoal(goals, s.goal.id, dir))} />
            <span class="nm">{nameOf(s.goal)}</span>
            <input class="inp sm num" type="text" inputmode="numeric" value={s.goal.of} aria-label={t('Goal for {name}', { name: nameOf(s.goal) })} onchange={(e) => { const v = typedOf(e.currentTarget.value); if (v) save(setOf(goals, s.goal.id, v)); else e.currentTarget.value = s.goal.of; }} />
            <SortArrows name={nameOf(s.goal)} {i} n={stands.length} onstep={(dir) => save(stepGoal(goals, s.goal.id, dir))} />
            <button type="button" class="btn sm" data-wg-del onclick={() => drop(s)} aria-label={t('Delete the week goal «{name}»?', { name: nameOf(s.goal) })}><Trash2 size={16} aria-hidden="true" /></button>
          </li>
        {/each}
      </ul>
    {:else}
      <ul class="card wg" data-wg-list>
        {#each stands as s (s.goal.id)}
          <li data-wg={s.goal.id} class:met={s.met}>
            <div class="r">
              {#if s.goal.kind === 'km'}<span class="ib" aria-hidden="true"><Bike size={18} /></span>{:else}{@const a = acts.find((x) => x.id === s.goal.actId)}<ActIcon icon={a?.icon ?? 'heart'} ring={a?.ring ?? 'move'} />{/if}
              <span class="m"><b>{nameOf(s.goal)}</b><small class="num" data-wg-line>{line(s)}</small></span>
              {#if s.met}<span class="ok" aria-hidden="true"><Check size={18} /></span>{/if}
            </div>
            {#if !s.missing}<span class="bar" role="img" aria-label="{Math.round(s.fill * 100)} %"><i style="width:{s.fill ? Math.max(2, Math.round(s.fill * 100)) : 0}%"></i></span>{/if}
          </li>
        {/each}
      </ul>
      {#if allMet}
        <p class="next" data-wg-next>{t('All week goals reached.')} <a href="#/flow/review">{t('See the week in review')}<ChevronRight size={16} aria-hidden="true" /></a></p>
      {:else}
        <p class="hint">{tn(stands[0].left, 'Today is the last day of the week.', '{n} days left in this week.')}</p>
      {/if}
    {/if}
    {#if !adding}
      {#if !editing}{@render chips()}{/if}
      <button type="button" class="btn sm add" data-wg-new onclick={() => { adding = true; pick = addable[0]?.value ?? ''; }} disabled={!addable.length}><Plus size={16} aria-hidden="true" />{t('Add a week goal')}</button>
    {/if}
  {/if}

  {#if adding}
    <form class="card form" data-wg-form onsubmit={addOwn}>
      <label class="fl"><span>{t('What')}</span>
        <select class="inp" bind:value={pick} data-wg-pick>
          {#each addable as o (o.value)}<option value={o.value}>{o.label}</option>{/each}
        </select>
      </label>
      <label class="fl"><span>{pick === 'km' ? t('Kilometres per week') : t('Times per week')}</span>
        <input class="inp sm num" type="text" inputmode="numeric" bind:value={amount} data-wg-amount placeholder={pick === 'km' ? '150' : '2'} />
      </label>
      <span class="fa">
        <button type="submit" class="btn hi sm" data-wg-save disabled={!typedOf(amount) || !addable.length}>{t('Add')}</button>
        <button type="button" class="btn sm" onclick={() => (adding = false)}>{t('Cancel')}</button>
      </span>
      {#if !addable.length}<small>{t('Every sport and the kilometres already have a week goal.')}</small>{/if}
    </form>
  {/if}
</Sec>

<style>
  .wg {
    display: grid;
    gap: 14px;
    margin: 0;
    padding: 14px 16px;
    list-style: none;
  }
  .wg li {
    display: grid;
    gap: 6px;
  }
  .wg.ed li {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .wg.ed li {
    flex-wrap: wrap;
  }
  .wg.ed .nm {
    flex: 1 1 110px;
    min-width: 90px;
    font-weight: 600;
  }
  .wg.ed .inp.sm {
    flex: none;
    width: 64px;
    max-width: 64px;
    padding-inline: 8px;
    text-align: center;
  }
  .r {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .m {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }
  .ib {
    display: grid;
    flex: none;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: var(--hi-soft);
    color: var(--hi);
  }
  .ok {
    color: var(--hi);
  }
  small,
  .hint {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .hint {
    margin: var(--sp-2) 2px 0;
  }
  .bar {
    display: block;
    height: 8px;
    border-radius: 99px;
    background: var(--paper-2);
  }
  .bar i {
    display: block;
    height: 100%;
    border-radius: 99px;
    background: var(--hi);
  }
  .inp.sm {
    max-width: 8ch;
  }
  .add {
    margin-top: var(--sp-3);
  }
  .next {
    margin: var(--sp-2) 2px 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .next a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
  }
  .sg {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    margin: var(--sp-2) 0 0;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 var(--sp-3);
    border: 1px solid var(--line);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .form {
    display: grid;
    gap: var(--sp-3);
    margin-top: var(--sp-3);
    padding: 14px 16px;
  }
  .fl {
    display: grid;
    gap: 4px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .fa {
    display: flex;
    gap: var(--sp-2);
  }
</style>
