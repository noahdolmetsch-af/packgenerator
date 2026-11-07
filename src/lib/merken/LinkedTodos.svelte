<script>
  /**
   * N3 «Gehört zu» (Noah 05.11.2026): the open to-dos that belong to this trip, bike or note, as a small card with a
   * tick, the steps and «Open ›» to Kalender › Merken. Nothing shows where no to-do belongs here (the
   * to-do is linked from its own window). kind: 'trip' | 'bike' | 'note'; ref: its id.
   */
  import { liveQuery } from 'dexie';
  import { ChevronRight, ListChecks } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { MERKEN_KEY, tickTodo, changeTodo } from '../merkendb.js';
  import { todosFor } from './links.js';
  import { stepsOf, stepProgress, toggleStep } from './steps.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { dayLabel } from './when.js';

  let { kind, ref, compact = false } = $props();
  const q = liveQuery(async () => (await db.settings.get(MERKEN_KEY))?.value ?? []);
  const rows = $derived(ref ? todosFor($q ?? [], kind, ref) : []);
  const today = localDay();
  async function tick(x) {
    const undo = await tickTodo(db, x.id, { today });
    offerDone(t('{name} · done', { name: x.text }), undo);
  }
  async function tickStep(x, st) {
    const undo = await changeTodo(db, x.id, (td) => toggleStep(td, st.id));
    offerDone(st.done ? t('Saved.') : t('{name} · done', { name: st.text }), undo);
  }
</script>

{#if rows.length}
  <section class="lt card" aria-label={t('To-dos that belong here')} data-linked-todos={kind}>
    <div class="ph">
      <ListChecks size={18} aria-hidden="true" />
      <h2>{t('To-dos that belong here')}</h2>
      <span class="n">{t('{n} open', { n: rows.length })}</span>
      <a class="open" href="#/calendar">{t('Open')}<ChevronRight size={16} aria-hidden="true" /></a>
    </div>
    <ul>
      {#each rows as x (x.id)}
        {@const pr = stepProgress(x)}
        <li>
          <button type="button" class="bx" onclick={() => tick(x)} aria-label={t('Done: {name}', { name: x.text })}></button>
          <span class="tx"><b>{x.text}</b>{#if x.due || pr.total}<small>{[x.due ? dayLabel(x.due, today) : '', pr.total ? t('{done} of {total} done', pr) : ''].filter(Boolean).join(' · ')}</small>{/if}
            {#if !compact && stepsOf(x).length}
              <span class="st">{#each stepsOf(x) as st (st.id)}<button type="button" class="sb" class:done={st.done} aria-pressed={!!st.done} onclick={() => tickStep(x, st)}>{st.text}</button>{/each}</span>
            {/if}
          </span>
        </li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .lt {
    margin: 16px 0;
    padding: 12px 16px;
  }
  .ph {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ph h2 {
    flex: 1;
    margin: 0;
    font-size: var(--fs-body);
  }
  .n {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .open {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--ink-2);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    display: flex;
    gap: 12px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .bx {
    position: relative;
    flex: none;
    width: 26px;
    height: 26px;
    margin-top: 2px;
    border: 1.5px solid var(--line-strong, var(--ink-2));
    border-radius: 7px;
    background: var(--paper);
    cursor: pointer;
  }
  .bx::before {
    content: '';
    position: absolute;
    inset: -9px;
  }
  .tx {
    flex: 1;
    min-width: 0;
  }
  .tx b {
    display: block;
    font-weight: 500;
  }
  .tx small {
    display: block;
    color: var(--ink-2);
  }
  .st {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }
  .sb {
    min-height: 44px;
    padding: 0 12px;
    border: 1.5px solid var(--line);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .sb.done {
    background: var(--ok-soft, var(--paper-2));
    border-color: var(--ok, var(--line));
    color: var(--ink-2);
    text-decoration: line-through;
  }
</style>
