<script>
  /**
   * «Mein Tag» step 3 (Noah 23.11.2026 «dreimal ja»): the to-dos as a tab of Mein Tag. One list of everything still open:
   * the own to-dos of Merken (settings «merken», src/lib/merkendb.js) and the to-dos you put on a day in Mein Tag
   * (settings «week.items»). Late · today · this week · later · without date, the groups of Merken (merken.js).
   * A tap on the circle ticks (Undo), the words open a small window (change, delete), «Today» moves it to today.
   * Nothing is copied: a to-do stays where it lives, this is the second door to it.
   */
  import { liveQuery } from 'dexie';
  import { Check, Plus } from '@lucide/svelte';
  import Empty from '../ui/Empty.svelte';
  import TodoSheet from './TodoSheet.svelte';
  import { db } from '../db.js';
  import { MERKEN_KEY, addTodo, updateTodo, tickTodo, removeTodo } from '../merkendb.js';
  import { groupTodos, GROUPS, doneTodos, addDays } from '../merken.js';
  import { notWaiting } from '../stand/stand.js';
  import { dayLabel } from '../merken/when.js';
  import { deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { t } from '../i18n.svelte.js';

  // today; weekTodos: the to-dos of week.items [{ id, title, day, done }]; ontick, onmove(item, day), onedit(item) change those
  let { today, weekTodos = [], ontick, onmove, onedit } = $props();

  const q = liveQuery(async () => (await db.settings.get(MERKEN_KEY))?.value ?? []);
  const todos = $derived($q ?? []);

  const HEAD = { late: 'Overdue', today: 'Today', week: 'This week', later: 'Later', none: 'Without date' };
  const groupOfDay = (day) => (!day ? 'none' : day < today ? 'late' : day === today ? 'today' : day <= addDays(today, 7) ? 'week' : 'later');

  // one row for each: { key, title, due, from: 'merken' | 'week', ref }
  const rows = $derived.by(() => {
    const g = groupTodos(notWaiting(todos), today);
    const out = Object.fromEntries(GROUPS.map((k) => [k, g[k].map((td) => ({ key: `m:${td.id}`, title: td.text, due: td.due ?? null, from: 'merken', ref: td }))]));
    for (const it of weekTodos) if (!it.done) out[groupOfDay(it.day)].push({ key: `w:${it.id}`, title: it.title, due: it.day ?? null, from: 'week', ref: it });
    for (const k of GROUPS) out[k].sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999') || a.title.localeCompare(b.title));
    return out;
  });
  const open = $derived(GROUPS.reduce((n, k) => n + rows[k].length, 0));
  const doneN = $derived(doneTodos(todos).length + weekTodos.filter((x) => x.done).length);

  let text = $state('');
  let editing = $state(null); // a to-do of Merken
  async function add(ev) {
    ev?.preventDefault();
    const r = await addTodo(db, { text });
    if (!r) return;
    text = '';
    offerDone(t('"{name}" added.', { name: r.todo.text }), r.undo);
  }
  async function tickRow(r) {
    if (r.from === 'week') return ontick?.(r.ref);
    const undo = await tickTodo(db, r.ref.id, { today });
    offerDone(t('«{name}» ticked off.', { name: r.title }), undo);
  }
  async function toToday(r) {
    if (r.from === 'week') return onmove?.(r.ref, today);
    const undo = await updateTodo(db, r.ref.id, { due: today });
    offerDone(t('«{name}» moved to {day}.', { name: r.title, day: t('Today') }), undo);
  }
  const openRow = (r) => (r.from === 'week' ? onedit?.(r.ref) : (editing = r.ref));
  async function saveTodo(f) {
    const before = editing;
    const undo = await updateTodo(db, before.id, { text: f.text, due: f.due });
    offerDone(t('«{name}» changed.', { name: f.text }), undo);
  }
  function deleteTodo() {
    const gone = editing;
    let back;
    return deleteWithUndo({
      run: async () => (back = await removeTodo(db, gone.id)),
      undo: () => back?.(),
      text: t('"{name}" deleted.', { name: gone.text }),
      name: gone.text,
    });
  }
</script>

<form class="quick" onsubmit={add}>
  <label class="vh" for="td-new">{t('New to-do')}</label>
  <input id="td-new" class="inp" bind:value={text} maxlength="200" autocomplete="off" enterkeyhint="done" placeholder={t('Write a to-do and press Enter')} data-todo-new />
  <button type="submit" class="btn hi" disabled={!text.trim()}><Plus size={16} aria-hidden="true" /> {t('Add')}</button>
</form>

{#if !open}
  <Empty title={t('No open to-dos')} text={t('Write one above. It waits in the list, and you can give it a day when it is time.')} />
{/if}

{#each GROUPS as k (k)}
  {#if rows[k].length}
    <section class="grp" data-todo-group={k} aria-labelledby="tg-{k}">
      <h2 id="tg-{k}">{t(HEAD[k])} <small class="n">{rows[k].length}</small></h2>
      <ul>
        {#each rows[k] as r (r.key)}
          <li>
            <button type="button" class="tick" aria-label={t('Tick off «{name}»', { name: r.title })} onclick={() => tickRow(r)}><Check size={14} aria-hidden="true" /></button>
            <button type="button" class="what" data-todo={r.key} onclick={() => openRow(r)}><b>{r.title}</b>{#if r.due}<small>{dayLabel(r.due, today)}</small>{/if}</button>
            {#if r.due !== today}<button type="button" class="tod" onclick={() => toToday(r)} aria-label={t('Move «{name}» to today', { name: r.title })}>{t('Today')}</button>{/if}
          </li>
        {/each}
      </ul>
    </section>
  {/if}
{/each}

<p class="more">
  {#if doneN}{t('{n} done are kept under «Remember».', { n: doneN })} {/if}<a href="#/calendar">{t('All to-dos, repeats and steps in Remember')}</a>
</p>

{#if editing}
  <TodoSheet todo={editing} onsave={saveTodo} ondelete={deleteTodo} onclose={() => (editing = null)} />
{/if}

<style>
  .quick {
    display: flex;
    gap: 8px;
    margin: 0 0 12px;
  }
  .quick .inp {
    flex: 1;
    min-width: 0;
  }
  .vh {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
  .grp {
    margin: 0 0 14px;
  }
  h2 {
    margin: 0 0 6px;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 8px 4px 6px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
  .tick {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: transparent;
    cursor: pointer;
  }
  .tick::before {
    content: '';
    position: absolute;
    width: 24px;
    height: 24px;
    border: 2px solid var(--ink-2);
    border-radius: 50%;
  }
  .tick {
    position: relative;
  }
  .tick :global(svg) {
    position: relative;
  }
  .what {
    flex: 1;
    min-width: 0;
    min-height: 44px;
    display: grid;
    align-content: center;
    gap: 1px;
    border: 0;
    background: none;
    text-align: left;
    color: var(--ink);
    cursor: pointer;
  }
  .what small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .tod {
    flex: none;
    min-height: 44px;
    padding: 0 10px;
    border: 0;
    background: none;
    color: var(--ink-2);
    text-decoration: underline;
    cursor: pointer;
  }
  .more {
    margin: 14px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
</style>
