<script>
  /**
   * «Wochen-Abschluss am Sonntag» (Noah 05.11.2026 «Planen 2b»): on Sunday (and on request every other day) three
   * calm lines about the shown week: what is done, what stayed open, what can slide to next Monday. Each row to
   * slide has a box (ticked), one button moves the ticked ones; the page offers Undo. Rules: woche/abschluss.js.
   */
  import { CalendarCheck, ChevronRight } from '@lucide/svelte';
  import { t, tn } from '../i18n.svelte.js';
  import { dayName } from './words.js';

  /** close: the result of weekClose; onmove(ids), onnext(), onlater(): the page does the saving and the Undo. */
  let { close, onmove, onnext, onlater } = $props();
  let off = $state([]); // ids the person unticked: they stay where they are
  const chosen = $derived(close.move.filter((x) => !off.includes(x.id)));
  const parts = (c) => [c.sessions ? tn(c.sessions, '{n} session|week', '{n} sessions|week') : '', c.tasks ? tn(c.tasks, '{n} task', '{n} tasks') : ''].filter(Boolean).join(' · ');
  const toggle = (id) => (off = off.includes(id) ? off.filter((x) => x !== id) : [...off, id]);
  const nothing = $derived(!close.done.n && !close.open.n && !close.trips);
  // only the trip stood in the plan: say so, not «nothing was planned»
  const onlyTrip = $derived(!close.done.n && !close.open.n && close.trips > 0);
</script>

<section class="card wrap" data-week-wrap aria-label={t('Week wrap-up')}>
  <h2>{t('Week wrap-up')}</h2>
  {#if nothing}
    <p class="why" data-wrap-empty>{t('Nothing was planned or done this week. Plan the next one when you like.')}</p>
  {:else if onlyTrip}
    <p class="why" data-wrap-trip>{tn(close.trips, 'This week only the trip stood in the plan. Plan the next week when you like.', 'This week only the trips stood in the plan. Plan the next week when you like.')}</p>
  {:else}
    <p class="ln" data-wrap-done><b>{t('Done|wrap')}</b><span>{close.done.n ? parts(close.done) : t('nothing yet')}</span></p>
    <p class="ln" data-wrap-open><b>{t('Still open')}</b><span>{close.open.n ? parts(close.open) : t('nothing, all ticked')}</span></p>
    <div class="ln mv" data-wrap-move>
      <b>{t('Slides to next week')}</b>
      {#if close.move.length}
        <ul>
          {#each close.move as x (x.id)}
            <li><label><input type="checkbox" checked={!off.includes(x.id)} data-wrap-pick={x.id} onchange={() => toggle(x.id)} /><span>{x.title}<small>{dayName(x.day)}</small></span></label></li>
          {/each}
        </ul>
      {:else}
        <span>{t('nothing: no open to-do or bike job')}</span>
      {/if}
    </div>
    {#if close.move.length}<p class="why">{t('Your own open to-dos and bike jobs. Untick what should stay as it is.')}</p>{/if}
  {/if}
  <p class="acts">
    {#if close.move.length}<button type="button" class="btn hi" disabled={!chosen.length} data-wrap-move-btn onclick={() => onmove(chosen.map((x) => x.id))}>{tn(chosen.length, 'Move {n} task to Monday', 'Move {n} tasks to Monday')}</button>{/if}
    <a class="btn" href="#/week/plan" data-wrap-plan><CalendarCheck size={16} aria-hidden="true" />{t('Plan next week')}</a>
    <button type="button" class="btn" data-wrap-next onclick={onnext}>{t('Show next week')}<ChevronRight size={14} aria-hidden="true" /></button>
    <button type="button" class="btn" data-wrap-later onclick={onlater}>{t('Later')}</button>
  </p>
</section>

<style>
  .wrap {
    display: grid;
    gap: 8px;
    padding: 12px 16px;
    margin: 0 0 12px;
  }
  .wrap h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .ln {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    margin: 0;
  }
  .ln b {
    flex: 0 0 11em;
  }
  .ln span {
    color: var(--ink-2);
  }
  .mv ul {
    flex: 1 1 220px;
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 6px;
  }
  .mv label {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    color: var(--ink);
  }
  .mv label span {
    display: grid;
    color: var(--ink);
  }
  .mv small {
    color: var(--ink-2);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 4px 0 0;
  }
  .acts .btn {
    min-height: 44px;
  }
</style>
