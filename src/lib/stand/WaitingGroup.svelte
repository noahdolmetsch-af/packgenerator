<script>
  /**
   * Paket A part 1, UC-255-I1 «Warten ist eine eigene Liste»: in Merken, under the date groups, the to-dos that
   * wait on something, with the reason and the day to check again. «Check now» when that day has come.
   * Per row: «Still waiting» (3 more days), «Not waiting any more» (back to its date), tick done. Each with Undo.
   */
  import { Hourglass } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { updateTodo } from '../merkendb.js';
  import { dayLabel } from '../merken/when.js';
  import { WAIT_ON, waitingRows, stillWaiting } from './stand.js';

  let { todos = [], today, ontick, onopen, say } = $props();
  const rows = $derived(waitingRows(todos, today));
  const onName = (k) => t(WAIT_ON.find((w) => w.key === k)?.name ?? '');

  async function again(r) {
    const undo = await updateTodo(db, r.todo.id, { wait: stillWaiting(r.wait, today) });
    say?.(t('{name} · still waiting', { name: r.todo.text }), undo);
  }
  async function stop(r) {
    const undo = await updateTodo(db, r.todo.id, { wait: null });
    say?.(t('{name} · not waiting any more', { name: r.todo.text }), undo);
  }
</script>

{#if rows.length}
  <h2 class="gh" data-waiting-h>{t('Waiting')}</h2>
  <ul class="wl" data-waiting>
    {#each rows as r (r.todo.id)}
      <li class="td" data-waiting-row={r.todo.id} class:now={r.now}>
        <button type="button" class="bx" onclick={() => ontick?.(r.todo)} aria-label={t('Done: {name}', { name: r.todo.text })}></button>
        <span class="main">
          <button type="button" class="tx" onclick={() => onopen?.(r.todo)}>
            <b>{r.todo.text}</b>
            <small><Hourglass size={13} aria-hidden="true" />{[t('Waits on: {what}', { what: onName(r.wait.on) }), r.wait.note].filter(Boolean).join(' · ')}</small>
          </button>
          <span class="acts">
            <button type="button" class="lk" onclick={() => again(r)}>{t('Still waiting')}</button>
            <button type="button" class="lk" onclick={() => stop(r)}>{t('Not waiting any more')}</button>
          </span>
        </span>
        {#if r.wait.check}<span class="due" class:late={r.now}>{r.now ? t('Check now') : t('check {day}', { day: dayLabel(r.wait.check, today) })}</span>{/if}
      </li>
    {/each}
  </ul>
{/if}

<style>
  .gh {
    margin: 16px 0 2px;
    color: var(--ink-2);
    font: 600 var(--fs-tiny) / 1.4 var(--font-body);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .wl {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .td {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  .bx {
    position: relative;
    flex: none;
    width: 26px;
    height: 26px;
    margin: 9px 0 0;
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
  .main {
    display: grid;
    flex: 1;
    min-width: 0;
  }
  .tx {
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
    overflow-wrap: break-word;
  }
  .tx b {
    display: block;
    font-weight: 500;
  }
  .tx small {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--ink-2);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 0 16px;
  }
  .lk {
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    text-decoration: underline;
    cursor: pointer;
  }
  .due {
    flex: none;
    margin-top: 10px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .due.late {
    color: var(--warn);
    font-weight: 600;
  }
</style>
