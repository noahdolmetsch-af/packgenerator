<script>
  /**
   * «Weg zum Ziel» (Idee G, Noah 05.11.2026 «1b 2b 3a 4a 5a»): Touren › Weg zum Ziel (#/trips/weg, #/trips/weg?g=<id>).
   * A big goal with a start day; the app counts back from the start day and lays out steps on a timeline. Everything
   * is a suggestion: every step can be renamed, moved to another day, ticked, deleted (with Undo); own steps can be
   * added; goals can be renamed, moved and deleted. The kinds of steps (training, bike ready …) live in lib/weg/types/;
   * what the app already knows ticks a step by itself (never takes a tick back).
   * Data: settings WEG_KEY (lib/weg/weg.js), in every backup. Nothing is fetched online.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { RACES_KEY, racesOf } from '../lib/race/race.js';
  import { raceChoices } from '../lib/training/plans.js';
  import { WEG_KEY, KINDS, PHASE_NAMES, wegOf, newGoal, addGoal, renameGoal, removeGoal, moveGoal, setStart, addSteps, addOwnStep, renameStep, removeStep, setDone, setDue, timeline, progress, untilStart, applyAuto } from '../lib/weg/weg.js';
  import { TYPES, typeOf, suggestions } from '../lib/weg/types/index.js';
  import { localDay } from '../lib/localday.js';
  import { askDelete, deleteWithUndo } from '../lib/ui/ask.js';
  import { offerDone } from '../lib/ui/rename.svelte.js';
  import Empty from '../lib/ui/Empty.svelte';
  import DateInput from '../lib/ui/DateInput.svelte';
  import RenameSheet from '../lib/ui/RenameSheet.svelte';
  import SortArrows from '../lib/ui/SortArrows.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import { t, tn, num, locale } from '../lib/i18n.svelte.js';
  import { Flag, Plus, Check, Pencil, Trash2, ChevronRight, CalendarClock } from '@lucide/svelte';
  import '../lib/ich/ich.css';

  const today = localDay();
  const storeQ = liveQuery(() => db.settings.get(WEG_KEY));
  const racesQ = liveQuery(() => db.settings.get(RACES_KEY));
  const w = $derived(wegOf($storeQ?.value));
  const tripsQ = liveQuery(() => db.trips.toArray());
  const raceMap = $derived(racesOf($racesQ?.value)); // the race notes by trip, for the kinds of steps
  const races = $derived(raceChoices($tripsQ ?? [], $racesQ?.value ?? null, today)); // the races ahead to choose from

  let hash = $state(location.hash);
  $effect(() => {
    const on = () => (hash = location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  });
  const wanted = $derived(new URLSearchParams(hash.split('?')[1] ?? '').get('g') ?? '');
  const goal = $derived(w.goals.find((g) => g.id === wanted) ?? w.goals[0] ?? null);
  const gi = $derived(goal ? w.goals.findIndex((g) => g.id === goal.id) : -1);

  async function save(next) {
    await db.settings.put({ key: WEG_KEY, value: { goals: next.goals, onToday: next.onToday } });
  }
  const putGoal = (g) => save({ ...w, goals: w.goals.map((x) => (x.id === g.id ? g : x)) });
  const pick = (id) => (location.hash = `#/trips/weg?g=${encodeURIComponent(id)}`);

  // ---- what the kinds of steps know: ctx for applyAuto (each type may bring its own part with load(db))
  let ctx = $state({});
  $effect(() => {
    void $storeQ;
    const g = goal; // a kind of step may need to know the goal (its trip, its start day)
    let live = true;
    (async () => {
      const own = {};
      for (const ty of TYPES) {
        try {
          if (ty.load) own[ty.type] = await ty.load(db, g);
        } catch {
          /* a type that cannot load adds nothing; its steps stay for you to tick */
        }
      }
      if (live) ctx = own;
    })();
    return () => (live = false);
  });
  let ticking = false;
  $effect(() => {
    if (!goal || ticking) return;
    const next = applyAuto(goal, TYPES, { ...ctx, races: raceMap, today });
    if (next === goal) return;
    ticking = true;
    putGoal(next).finally(() => (ticking = false));
  });

  const rows = $derived(goal ? timeline(goal, today) : []);
  const prog = $derived(goal ? progress(goal, today) : null);
  const until = $derived(goal ? untilStart(goal, today) : null);
  const groups = $derived.by(() => {
    const out = [];
    for (const r of rows) {
      const last = out.at(-1);
      if (last && last.phase === r.phase) last.rows.push(r);
      else out.push({ phase: r.phase, rows: [r] });
    }
    return out;
  });
  const dayText = (d) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }) : t('No day yet'));
  const KIND_NAMES = { race: 'Race', trip: 'Trip', free: 'Free goal' };
  const kindName = (k) => t(KIND_NAMES[k] ?? 'Free goal');

  // ---- new way
  let adding = $state(false);
  let nTitle = $state('');
  let nKind = $state('race');
  let nStart = $state('');
  let nPick = $state({});
  let nRace = $state('');
  const openRaces = $derived(races);
  function pickRace(id) {
    nRace = id;
    const r = races.find((x) => x.id === id);
    if (r) {
      if (!nTitle.trim()) nTitle = r.title;
      if (r.day) nStart = r.day;
    }
  }
  const nGoal = $derived(newGoal({ title: nTitle || ' ', kind: nKind, start: nStart, tripId: nKind === 'race' ? nRace : ''}, { id: 'draft', now: '' }));
  const sugg = $derived(suggestions(nGoal));
  const suggKey = (s, i) => `${s.type}:${s.key ?? i}`;
  function openAdd() {
    adding = true;
    nTitle = '';
    nKind = 'race';
    nStart = '';
    nPick = {};
    nRace = '';
  }
  async function create(e) {
    e.preventDefault();
    if (!nTitle.trim()) return;
    let g = newGoal({ title: nTitle, kind: nKind, start: nStart, tripId: nKind === 'race' ? nRace : '' });
    g = addSteps(g, sugg.filter((s, i) => nPick[suggKey(s, i)] !== false).map((s) => ({ ...s, title: t(s.title), note: s.note ? t(s.note) : s.note }))); // the titles are English keys: stored in your language, then yours to change
    await save(addGoal(w, g));
    adding = false;
    pick(g.id);
  }

  // ---- goal: rename, delete, order
  let renaming = $state(null); // { kind: 'goal' } | { kind: 'step', id }
  async function removeThisGoal() {
    const g = goal;
    if (!g || (await askDelete({ title: t('Delete the way "{name}"?', { name: g.title }), text: t('You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    const before = $state.snapshot(w);
    await deleteWithUndo({ run: async () => (await save(removeGoal(w, g.id)), before), undo: (snap) => save(snap), text: t('"{name}" deleted.', { name: g.title }), name: g.title });
  }
  const stepGoal = (dir) => goal && save(moveGoal(w, gi, gi + dir));

  // ---- steps
  let sTitle = $state('');
  let sDue = $state('');
  async function addOwn(e) {
    e.preventDefault();
    if (!goal || !sTitle.trim()) return;
    const next = addOwnStep(goal, { title: sTitle, due: sDue });
    sTitle = ''; // clear at once, so what you type next is not wiped when the save ends
    sDue = '';
    await putGoal(next);
  }
  async function removeThisStep(r) {
    const g = goal;
    if ((await askDelete({ title: t('Delete the step "{name}"?', { name: r.step.title }), text: t('You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    const before = $state.snapshot(g);
    await deleteWithUndo({ run: async () => (await putGoal(removeStep(g, r.step.id)), before), undo: (snap) => putGoal(snap), text: t('"{name}" deleted.', { name: r.step.title }), name: r.step.title });
  }
  const linkOf = (r) => {
    try {
      return typeOf(r.step.type).link?.(goal, r.step) || '';
    } catch {
      return '';
    }
  };
  const renameValue = $derived(renaming?.kind === 'goal' ? goal?.title : goal?.steps.find((s) => s.id === renaming?.id)?.title);
</script>

<div class="ich-page weg" data-page="weg">
  <VeloHead crumbs={[{ label: t('Trips|place'), href: '#/trips' }]} title={t('Way to the goal')} sub={t('Count back from a big day: the app lays out the steps')} />
  <p class="wg-intro">{t('Name a big goal and its start day. The app counts back and suggests steps. Everything is a suggestion: change, move or delete any step.')}</p>

  {#if !goal && !adding}
    <Empty icon={Flag} text={t('No way yet. Name a big goal with a start day, for example a race in May.')} action={{ label: t('New way'), onclick: openAdd }} />
  {/if}

  {#if w.goals.length > 1 && !adding}
    <div class="wg-goals" role="group" aria-label={t('Your ways')}>
      {#each w.goals as g (g.id)}
        <button type="button" class="chip" class:on={g.id === goal?.id} aria-pressed={g.id === goal?.id} onclick={() => pick(g.id)}>{g.title}</button>
      {/each}
    </div>
  {/if}

  {#if adding}
    <form class="card pad wg-new" onsubmit={create} data-weg-new>
      <h2>{t('New way')}</h2>
      <label class="wg-f"><span>{t('What are you aiming at?')}</span><input class="inp" bind:value={nTitle} maxlength="80" placeholder={t('For example: Race in May')} data-weg-title /></label>
      <div class="wg-f"><span id="wg-kind">{t('Kind')}</span><Seg labelledby="wg-kind" options={KINDS.map((k) => ({ key: k, name: kindName(k) }))} value={nKind} onchange={(v) => (nKind = v)} /></div>
      {#if nKind === 'race' && openRaces.length}
        <label class="wg-f"><span>{t('One of your races (optional)')}</span><select class="inp" value={nRace} onchange={(e) => pickRace(e.currentTarget.value)}><option value="">{t('No race chosen')}</option>{#each openRaces as r (r.id)}<option value={r.id}>{r.title}</option>{/each}</select></label>
      {/if}
      <div class="wg-f"><span>{t('Start day')}</span><DateInput bind:value={nStart} data-weg-start /><small class="ich-help">{t('Leave it empty if the day is still open. You can set it later.')}</small></div>
      {#if sugg.length}
        <div class="wg-f"><span>{t('Steps to suggest (untick what you do not want)')}</span>
          {#each sugg as s, i (suggKey(s, i))}
            <label class="wg-pick"><input type="checkbox" checked={nPick[suggKey(s, i)] !== false} onchange={(e) => (nPick = { ...nPick, [suggKey(s, i)]: e.currentTarget.checked })} /> {t(s.title)}</label>
          {/each}
        </div>
      {:else}
        <p class="ich-help">{t('You add the steps yourself. More kinds of steps (training, bike, packing) come in later versions.')}</p>
      {/if}
      <div class="wg-acts"><button type="submit" class="btn hi" disabled={!nTitle.trim()}>{t('Create way')}</button><button type="button" class="btn" onclick={() => (adding = false)}>{t('Cancel')}</button></div>
    </form>
  {/if}

  {#if goal && !adding}
    <section class="card pad wg-hero" aria-label={goal.title} data-weg-goal>
      <div class="wg-top">
        <div>
          <p class="wg-kicker">{kindName(goal.kind)}</p>
          <h2>{goal.title}</h2>
          <p class="wg-when">
            {#if until && until.days >= 0}{tn(until.weeks, 'Start in {n} week', 'Start in {n} weeks')}
            {:else if until}{t('The start day is over.')}
            {:else}{t('The start day is still open.')}{/if}
          </p>
        </div>
        <div class="wg-tools">
          {#if w.goals.length > 1}<SortArrows name={goal.title} i={gi} n={w.goals.length} onstep={stepGoal} />{/if}
          <button type="button" class="btn" onclick={() => (renaming = { kind: 'goal' })} aria-label={t('Rename {name}', { name: goal.title })}><Pencil size={16} aria-hidden="true" /></button>
          <button type="button" class="btn" onclick={removeThisGoal} aria-label={t('Delete {name}', { name: goal.title })} data-weg-delete><Trash2 size={16} aria-hidden="true" /></button>
        </div>
      </div>
      <label class="wg-f wg-startf"><span><CalendarClock size={14} aria-hidden="true" /> {t('Start day')}</span><DateInput value={goal.start} onchange={(v) => putGoal(setStart({ goals: [goal] }, goal.id, v).goals[0])} data-weg-start-edit /></label>
      {#if prog?.total}
        <div class="wg-bar" role="progressbar" aria-valuemin="0" aria-valuemax={prog.total} aria-valuenow={prog.done} aria-label={t('Steps done')}><i style:width="{Math.round((prog.done / prog.total) * 100)}%"></i></div>
        <p class="ich-help">{t('{done} of {total} steps done', { done: num(prog.done), total: num(prog.total) })}{#if prog.late}{' · '}{tn(prog.late, '{n} late', '{n} late')}{/if}</p>
      {/if}
    </section>

    {#if !rows.length}
      <Empty icon={Flag} text={t('No steps yet. Add your first step below: it stays a suggestion, you can change it any time.')} />
    {/if}

    {#each groups as grp (grp.phase + grp.rows[0].step.id)}
      <section class="card pad wg-phase" aria-label={t(PHASE_NAMES[grp.phase])}>
        <h3>{t(PHASE_NAMES[grp.phase])}</h3>
        <ul class="wg-steps">
          {#each grp.rows as r (r.step.id)}
            <li class:done={r.state === 'done'} class:late={r.state === 'late'} data-weg-step>
              <button type="button" class="wg-check" class:on={r.step.done} aria-pressed={r.step.done} aria-label={t('Done: {name}', { name: r.step.title })} onclick={() => putGoal(setDone(goal, r.step.id, !r.step.done))}>{#if r.step.done}<Check size={16} aria-hidden="true" />{/if}</button>
              <div class="wg-body">
                <b>{r.step.title}</b>
                <span class="wg-sub">{dayText(r.due)}{#if r.state === 'late'}{' · '}<em>{t('Late|step')}</em>{/if}{#if r.step.by === 'auto'}{' · '}{t('ticked by the app')}{/if}</span>
                {#if linkOf(r)}<a class="wg-go" href={linkOf(r)}>{t('Open')} <ChevronRight size={14} aria-hidden="true" /></a>{/if}
              </div>
              <div class="wg-row-tools">
                <DateInput value={r.step.due || r.due} onchange={(v) => putGoal(setDue(goal, r.step.id, v))} aria-label={t('Day of {name}', { name: r.step.title })} />
                <button type="button" class="btn" onclick={() => (renaming = { kind: 'step', id: r.step.id })} aria-label={t('Rename {name}', { name: r.step.title })}><Pencil size={16} aria-hidden="true" /></button>
                <button type="button" class="btn" onclick={() => removeThisStep(r)} aria-label={t('Delete {name}', { name: r.step.title })}><Trash2 size={16} aria-hidden="true" /></button>
              </div>
            </li>
          {/each}
        </ul>
      </section>
    {/each}

    <form class="card pad wg-own" onsubmit={addOwn} data-weg-own>
      <h3>{t('Add your own step')}</h3>
      <div class="wg-own-row">
        <input class="inp" bind:value={sTitle} maxlength="120" placeholder={t('For example: book the train')} aria-label={t('Step')} data-weg-step-title />
        <DateInput bind:value={sDue} aria-label={t('Day (optional)')} />
        <button type="submit" class="btn hi" disabled={!sTitle.trim()}><Plus size={16} aria-hidden="true" /> {t('Add')}</button>
      </div>
    </form>
  {/if}

  {#if w.goals.length && !adding}
    <p class="wg-more"><button type="button" class="btn" onclick={openAdd} data-weg-add><Plus size={16} aria-hidden="true" /> {t('New way')}</button></p>
  {/if}
</div>

{#if renaming && goal}
  <RenameSheet
    kicker={renaming.kind === 'goal' ? t('Way|kicker') : t('Step')}
    title={renaming.kind === 'goal' ? t('Rename way') : t('Rename step')}
    value={renameValue}
    onsave={async (name) => {
      await putGoal(renaming.kind === 'goal' ? renameGoal({ goals: [goal] }, goal.id, name).goals[0] : renameStep(goal, renaming.id, name));
      offerDone(t('Renamed to "{name}".', { name }));
    }}
    onclose={() => (renaming = null)}
  />
{/if}

<style>
  .wg-intro { max-width: 65ch; margin: 0 0 var(--sp-4); }
  .wg-goals { display: flex; flex-wrap: wrap; gap: var(--sp-2); margin-bottom: var(--sp-3); }
  .wg-top { display: flex; justify-content: space-between; gap: var(--sp-3); align-items: flex-start; flex-wrap: wrap; }
  .wg-top h2 { margin: 0; }
  .wg-kicker { margin: 0; font-size: var(--fs-small); font-weight: 600; color: var(--ink-3); }
  .wg-when { margin: var(--sp-1) 0 0; font-weight: 600; }
  .wg-tools { display: flex; gap: var(--sp-2); align-items: center; }
  .wg-f { display: grid; gap: var(--sp-1); margin: var(--sp-3) 0; }
  .wg-f > span { font-size: var(--fs-small); font-weight: 600; }
  .wg-pick { display: flex; gap: var(--sp-2); align-items: center; min-height: 44px; }
  .wg-acts { display: flex; gap: var(--sp-2); flex-wrap: wrap; }
  .wg-bar { height: 10px; border-radius: 6px; background: var(--paper-2); overflow: hidden; margin-top: var(--sp-3); }
  .wg-bar i { display: block; height: 100%; background: var(--accent); border-radius: 6px; }
  .wg-phase, .wg-hero, .wg-own, .wg-new { margin-bottom: var(--sp-4); }
  .wg-phase h3, .wg-own h3 { margin: 0 0 var(--sp-2); font-size: var(--fs-small); text-transform: uppercase; letter-spacing: 0.04em; color: var(--ink-3); }
  .wg-steps { list-style: none; margin: 0; padding: 0; }
  .wg-steps li { display: flex; gap: var(--sp-3); align-items: flex-start; padding: var(--sp-3) 0; border-top: 1px solid var(--line); flex-wrap: wrap; }
  .wg-steps li:first-child { border-top: 0; }
  .wg-steps li.done .wg-body b { text-decoration: line-through; color: var(--ink-3); }
  .wg-steps li.late .wg-sub em { color: var(--warn); font-style: normal; font-weight: 600; }
  .wg-check { flex: none; width: 44px; height: 44px; border-radius: 12px; border: 2px solid var(--line); background: var(--paper); display: grid; place-items: center; cursor: pointer; }
  .wg-check.on { background: var(--accent); border-color: var(--accent); color: var(--brand-ink); }
  .wg-body { flex: 1; min-width: 12ch; display: grid; gap: 2px; }
  .wg-sub { font-size: var(--fs-small); color: var(--ink-3); }
  .wg-go { display: inline-flex; align-items: center; font-weight: 600; min-height: 32px; }
  .wg-row-tools { display: flex; gap: var(--sp-2); align-items: center; flex-wrap: wrap; }
  .wg-own-row { display: flex; gap: var(--sp-2); flex-wrap: wrap; align-items: center; }
  .wg-own-row .inp { flex: 1; min-width: 14ch; }
  .wg-more { margin: var(--sp-3) 0 var(--sp-6); }
</style>
