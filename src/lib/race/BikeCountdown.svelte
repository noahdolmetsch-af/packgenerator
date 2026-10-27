<script>
  /**
   * «Velo-Countdown» (Noah 27.10.2026, idea 3 of the ultra analysis): on the page «Rennen detailliert planen»,
   * what to do with the bike 6, 5, 4 … weeks before this race, with its day and a tick. Your own list per
   * race (stored.countdown): add, change, delete with Undo, sort with arrows and dragging (EditList).
   * The suggestions come from countdown-lib.js.
   */
  import { Bike } from '@lucide/svelte';
  import EditList from './EditList.svelte';
  import { stepsOf, dueOf, stateOf, summary } from './countdown-lib.js';
  import { localDay } from '../localday.js';
  import { t, tn, locale } from '../i18n.svelte.js';

  let { ctx } = $props();
  const today = localDay();
  const race = $derived(ctx.trip.startDate ?? '');
  const rows = $derived(stepsOf(ctx.stored, t));
  const sum = $derived(summary(rows, race, today));
  const save = (list) => ctx.save({ countdown: list.map((r) => ({ id: r.id, text: r.text, weeks: Math.max(0, Math.round(Number(r.weeks) || 0)), done: r.done === true })) });
  const tick = (id, done) => save(rows.map((r) => (r.id === id ? { ...r, done } : r)));
  const day = (d) => new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' });
  const STATE = { late: 'overdue', now: 'this week', later: '', done: 'done|ticked', open: '' };
</script>

<section class="rc-box" aria-labelledby="bc-h" data-race-countdown>
  <h2 id="bc-h" class="rc-h2"><Bike size={18} aria-hidden="true" /> {t('Bike countdown')}</h2>
  <p class="rc-note">{t('What to do with the bike in the weeks before the race. Change the weeks and the steps as they fit you.')}</p>
  {#if !race}
    <p class="rc-warn" data-countdown-nodate>{t('The race has no date yet, so the steps have no day. Set the date under Route, strategy and race mode.')}</p>
  {:else if rows.length}
    <p class="bc-sum" role="status" data-countdown-sum>
      {t('{done} of {of} done', sum)}{#if sum.late}{' '}· <span class="bc-late">{tn(sum.late, '{n} overdue', '{n} overdue')}</span>{/if}{#if sum.now}{' '}· {tn(sum.now, '{n} this week', '{n} this week')}{/if}
    </p>
  {/if}
  {#if rows.length}
    <ul class="bc-list" data-countdown-list>
      {#each rows as r (r.id)}
        {@const st = stateOf(r, race, today)}
        <li class="bc-row" class:bc-done={r.done}>
          <label class="bc-tick">
            <input type="checkbox" checked={r.done} onchange={(e) => tick(r.id, e.currentTarget.checked)} data-countdown-done={r.id} />
            <span class="bc-text">
              <b>{r.text}</b>
              <small class="bc-when" class:bc-late={st === 'late'} data-countdown-state={st}>{tn(r.weeks, '{n} week before', '{n} weeks before')}{#if race}{' '}· {day(dueOf(race, r.weeks))}{/if}{#if STATE[st] && st !== 'done'}{' '}· {t(STATE[st])}{/if}</small>
            </span>
          </label>
        </li>
      {/each}
    </ul>
  {/if}
  <details class="bc-more">
    <summary data-countdown-edit>{t('Change the steps')}</summary>
    <EditList {rows} onchange={save} label={t('Step')} addLabel={t('Add')} placeholder={t('e.g. Bring the bike to the shop')} name={t('Step')} testid="countdown" blank={{ weeks: 3, done: false }}>
      {#snippet sub(r)}
        <small class="bc-when">{tn(r.weeks, '{n} week before', '{n} weeks before')}</small>
      {/snippet}
      {#snippet fields(edit)}
        <label class="rc-lab">{t('Weeks before the race')}<input class="inp" type="number" inputmode="numeric" min="0" max="52" step="1" bind:value={edit.weeks} data-countdown-weeks /></label>
      {/snippet}
    </EditList>
  </details>
</section>

<style>
  .bc-sum {
    margin: 0;
    font-weight: 600;
  }
  .bc-when {
    color: var(--ink-2);
  }
  .bc-late {
    color: var(--warn);
    font-weight: 600;
  }
  .bc-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 2px;
  }
  .bc-tick {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    min-height: 44px;
    padding: 6px 0;
    cursor: pointer;
  }
  .bc-tick input {
    flex: none;
    width: 20px;
    height: 20px;
    margin-top: 2px;
  }
  .bc-text {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .bc-done b {
    color: var(--ink-2);
    font-weight: 500;
  }
  .bc-more summary {
    cursor: pointer;
    min-height: 44px;
    display: flex;
    align-items: center;
    font-weight: 600;
  }
</style>
