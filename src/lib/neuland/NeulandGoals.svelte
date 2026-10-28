<script>
  /**
   * «Herausforderungen mit Ende» (Träume und Neuland N5, Noah 27.10.2026 «1-5 a»), on Touren › Träume: your own
   * New ground goals with an end day, e.g. «5 new municipalities by 30 Nov» or «All lakes in canton Zurich by
   * 31 Dec». Each shows how far you are, how many days are left and a bar; it counts by itself from Neuland
   * (routes, rides, own ticks). Three ready ones to tap, or your own. Change and delete (with Undo) in the
   * window. A reached one stays with its day; one whose end passed shows «Time is up» and can be extended.
   * Data: settings GOALS_KEY (ziele.js), in every backup. Only the collections the goals use are loaded.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { readRaw, computeFrom } from './store.js';
  import { stateOf as nlState, collectionsOf, collectionName } from './neuland.js';
  import { loadBase } from './load.js';
  import { GOALS_KEY, goalsOf, newGoal, editGoal, progressOf, goalState, stepGoals, daysLeft, presets, sortGoals } from './ziele.js';
  import GoalSheet from './GoalSheet.svelte';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { localDay } from '../localday.js';
  import { dayShort } from '../flow/words.js';
  import { t, tn, num } from '../i18n.svelte.js';
  import { Trophy, Plus, Pencil, Check } from '@lucide/svelte';

  const today = localDay();
  const rawQ = liveQuery(() => readRaw(db));
  const goalsQ = liveQuery(() => db.settings.get(GOALS_KEY));
  const goals = $derived(goalsOf($goalsQ?.value));
  const all = $derived($rawQ ? collectionsOf(nlState($rawQ.value)) : []);

  // the collections the goals use, with what was reached (Neuland), and the home canton for the ready ones
  let res = $state.raw(null);
  const need = $derived([...new Set(goals.map((g) => g.cid))].sort().join(','));
  $effect(() => {
    const raw = $rawQ;
    const only = need ? need.split(',') : [];
    if (!raw) return;
    let live = true;
    computeFrom(raw, { only, today })
      .then((r) => live && (res = r))
      .catch((err) => console.error(err));
    return () => (live = false);
  });
  let cantons = $state.raw([]);
  loadBase('cantons')
    .then((list) => (cantons = list.map((k) => ({ id: k.id, name: k.name }))))
    .catch(() => {});
  const cantonName = (id) => cantons.find((k) => k.id === id)?.name ?? id;

  const cols = $derived(new Map((res?.collections ?? []).map((c) => [c.id, c])));
  const progs = $derived(new Map(goals.map((g) => [g.id, cols.has(g.cid) ? progressOf(g, cols.get(g.cid).items, cols.get(g.cid).visited) : null])));
  const states = $derived(new Map(goals.map((g) => [g.id, goalState(g, progs.get(g.id), today)])));
  const shown = $derived(sortGoals(goals, states));
  const ready = $derived(presets(today, res?.home));

  // a goal reached now keeps its day (once), with a short «Reached» line
  $effect(() => {
    if (!res || !goals.length) return;
    const { list, reached } = stepGoals(goals, new Map([...progs].filter(([, p]) => p)), today);
    if (!reached.length) return;
    saveAll(list).then(() => offerDone(t('Challenge reached: {name}', { name: lineOf(reached[0]) })));
  });

  const saveAll = (list) => db.settings.put({ key: GOALS_KEY, value: JSON.parse(JSON.stringify(list)) });

  /* words */
  const COUNT = {
    municipalities: ['{n} new municipality', '{n} new municipalities'],
    cantons: ['{n} new canton', '{n} new cantons'],
    countries: ['{n} new country', '{n} new countries'],
    passes: ['{n} new pass', '{n} new passes'],
    huts: ['{n} new hut', '{n} new huts'],
    peaks: ['{n} new peak', '{n} new peaks'],
    lakes: ['{n} new lake', '{n} new lakes'],
  };
  const ALL = { municipalities: 'All municipalities', cantons: 'All cantons', countries: 'All countries', passes: 'All passes', huts: 'All huts', peaks: 'All peaks', lakes: 'All lakes' };
  function whatText(g) {
    const c = all.find((x) => x.id === g.cid);
    const own = c ? collectionName(c) : g.cid;
    if (g.mode === 'all') {
      const head = c?.builtIn && !c.name ? t(ALL[g.cid]) : t('All of «{name}»', { name: own });
      return g.kt ? t('{all} in canton {canton}', { all: head, canton: cantonName(g.kt) }) : head;
    }
    return c?.builtIn && !c.name && COUNT[g.cid] ? tn(g.times, COUNT[g.cid][0], COUNT[g.cid][1]) : t('{n} new in «{name}»', { n: num(g.times), name: own });
  }
  const lineOf = (g) => g.name || whatText(g);
  function subOf(g) {
    const p = progs.get(g.id);
    const st = states.get(g.id);
    if (st === 'done') return t('Reached on {day}', { day: dayShort(g.doneOn ?? today) });
    const left = daysLeft(g, today);
    const when = st === 'over' ? t('Time is up since {day}', { day: dayShort(g.until) }) : left === 0 ? t('ends today') : tn(left, '{n} day left', '{n} days left');
    return p ? `${t('{n} of {m}', { n: num(p.have), m: num(p.need) })} · ${when}` : when;
  }

  /* the window */
  let sheet = $state(false);
  let draft = $state(null);
  const sheetCols = $derived(all.map((c) => ({ id: c.id, label: collectionName(c), cantons: ['municipalities', 'passes', 'huts', 'peaks', 'lakes'].includes(c.id) })));
  const openNew = (p = null) => ((draft = p ? { ...p, id: null, name: '' } : { id: null, cid: 'municipalities', mode: 'count', times: 5, kt: null, until: ready[0].until, name: '' }), (sheet = true));
  const openGoal = (g) => ((draft = { ...g }), (sheet = true));
  async function save(fields) {
    if (draft?.id) return saveAll(editGoal(goals, draft.id, fields, today));
    const g = newGoal({ ...fields, today });
    if (g) await saveAll([...goals, g]);
  }
  async function remove() {
    const g = goals.find((x) => x.id === draft?.id);
    if (!g) return;
    const name = lineOf(g);
    if ((await askDelete({ title: t('Delete «{name}»?', { name }), text: t('Only the challenge goes. What you reached stays in New ground.') })) !== 'delete') return;
    const before = goals;
    await deleteWithUndo({
      run: async () => (await saveAll(before.filter((x) => x.id !== g.id)), before),
      undo: (saved) => saveAll(saved),
      text: t('"{name}" deleted.', { name }),
      name,
    });
  }
  const PRESET = { muni: '5 new municipalities this month', lakes: 'All lakes in your canton this year', passes: '3 new passes this year' };
</script>

<section class="ich-sec" aria-labelledby="ng-h" data-neuland-goals>
  <div class="ich-h">
    <div>
      <h2 id="ng-h">{t('Challenges with an end')}</h2>
      <p class="ich-hs">{t('Set yourself a New ground goal with an end day. The app counts by itself.')}</p>
    </div>
  </div>
  {#if shown.length}
    <ul class="ng-list">
      {#each shown as g (g.id)}
        {@const p = progs.get(g.id)}
        {@const st = states.get(g.id)}
        <li class="card ng" class:done={st === 'done'} class:over={st === 'over'} data-goal={g.id} data-goal-state={st}>
          <span class="ic" aria-hidden="true">{#if st === 'done'}<Check size={16} />{:else}<Trophy size={16} />{/if}</span>
          <span class="tx">
            <b>{lineOf(g)}</b>
            {#if g.name}<small>{whatText(g)}</small>{/if}
            <small class="num" data-goal-sub>{subOf(g)}</small>
            {#if p}<span class="bar" role="img" aria-label={t('{n} of {m}', { n: num(p.have), m: num(p.need) })}><i style:width="{Math.round(Math.min(1, p.need ? p.have / p.need : 0) * 100)}%"></i></span>{/if}
          </span>
          <button type="button" class="btn sm ng-ed" onclick={() => openGoal(g)} aria-label={t('Change «{name}»', { name: lineOf(g) })} data-goal-edit><Pencil size={16} aria-hidden="true" /></button>
        </li>
      {/each}
    </ul>
  {/if}
  <div class="presets">
    {#each ready as p (p.key)}
      <button type="button" class="btn sm" onclick={() => openNew(p)} data-goal-preset={p.key}><Trophy size={14} aria-hidden="true" />{t(PRESET[p.key])}</button>
    {/each}
    <button type="button" class="btn sm dash" onclick={() => openNew()} data-goal-preset="own"><Plus size={14} aria-hidden="true" />{t('Own challenge|new ground')}</button>
  </div>
</section>
<GoalSheet bind:open={sheet} {draft} collections={sheetCols} {cantons} min={today} onsave={save} ondelete={remove} />

<style>
  .ng-list {
    margin: 0 0 10px;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 8px;
  }
  .ng {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
  }
  .ic {
    display: grid;
    place-items: center;
    flex: none;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--warn);
  }
  .ng.done .ic {
    color: var(--accent);
  }
  .ng.over .tx {
    color: var(--ink-2);
  }
  .tx {
    display: grid;
    gap: 3px;
    flex: 1;
    min-width: 0;
  }
  .tx small {
    color: var(--ink-2);
  }
  .bar {
    display: block;
    height: 6px;
    border-radius: 4px;
    background: var(--line);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    background: var(--accent);
  }
  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .presets .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .presets .dash {
    border-style: dashed;
  }
  .ng-ed {
    flex: none;
    min-width: 44px;
    min-height: 44px;
    padding: 0;
    display: grid;
    place-items: center;
  }
</style>
