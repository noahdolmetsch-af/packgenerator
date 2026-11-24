<script>
  /**
   * «Velo-Countdown» (Noah 27.10.2026, idea 3 of the ultra analysis): on the page «Rennen detailliert planen»,
   * what to do with the bike 6, 5, 4 … weeks before this race, with its day and a tick. Your own list per
   * race (stored.countdown): add, change, delete with Undo, sort with arrows and dragging (EditList).
   * The suggestions come from countdown-lib.js.
   * «D Änderungsstopp» (Noah 24.11.2026): the days to the start, a band with today, the stop and the start,
   * the steps as cards and the step «nothing changes any more» as a dark band in the list.
   */
  import { Bike, Lock } from '@lucide/svelte';
  import EditList from './EditList.svelte';
  import { stepsOf, dueOf, stateOf, summary, daysTo } from './countdown-lib.js';
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
  const dayShort = (d) => new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
  const STATE = { late: 'overdue', now: 'this week', later: '', done: 'done|ticked', open: '' };
  // the stop: the step «nothing changes any more» (its own words and weeks count, so you can move it)
  const freezeAt = $derived(rows.findIndex((r) => r.id === 'cd-freeze'));
  const toStart = $derived(race ? daysTo(today, race) : null);
  const stopDay = $derived(race && freezeAt >= 0 ? dueOf(race, rows[freezeAt].weeks) : null);
  const toStop = $derived(stopDay ? daysTo(today, stopDay) : null);
  const stopPct = $derived(toStart > 0 && toStop != null ? Math.min(100, Math.max(0, (toStop / toStart) * 100)) : null);
</script>

<section class="rc-box" aria-labelledby="bc-h" data-race-countdown>
  <h2 id="bc-h" class="rc-h2"><Bike size={18} aria-hidden="true" /> {t('Bike countdown')}</h2>
  <p class="rc-note">{t('What to do with the bike in the weeks before the race. Change the weeks and the steps as they fit you.')}</p>
  {#if !race}
    <p class="rc-warn" data-countdown-nodate>{t('The race has no date yet, so the steps have no day. Set the date under Route, strategy and race mode.')}</p>
  {:else if rows.length}
    <div class="bc-head" data-countdown-head>
      <div class="bc-top">
        {#if toStart != null && toStart >= 0}<div class="bc-days"><b class="num">{toStart}</b><small>{tn(toStart, 'day to the start', 'days to the start')}</small></div>{/if}
        {#if toStop != null}
          <span class="bc-stop" class:over={toStop < 0} data-countdown-stop><Lock size={13} aria-hidden="true" />{toStop > 0 ? tn(toStop, 'Stop in {n} day', 'Stop in {n} days') : toStop === 0 ? t('Stop today') : t('Nothing changes any more')}</span>
        {/if}
      </div>
      {#if stopPct != null}
        <div class="bc-tl" aria-hidden="true">
          <span class="bc-ax"></span>
          <span class="bc-zone" style:left="{stopPct}%"></span>
          <span class="bc-pt now" style:left="0%"></span>
          <span class="bc-pt" style:left="{stopPct}%"></span>
          <span class="bc-pt end"></span>
          <small class="bc-lb up" style:left="{stopPct}%" class:flip={stopPct > 62}>{t('Stop')} · {dayShort(stopDay)}</small>
          <small class="bc-lb up right">{t('Start')} · {dayShort(race)}</small>
          <small class="bc-lb down">{t('Today')}</small>
          <small class="bc-lb down mid" style:left="{(stopPct + 100) / 2}%">{t('nothing changes')}</small>
        </div>
      {/if}
      <p class="bc-sum" role="status" data-countdown-sum>
        {t('{done} of {of} done', sum)}{#if sum.late}{' '}· <span class="bc-late">{tn(sum.late, '{n} overdue', '{n} overdue')}</span>{/if}{#if sum.now}{' '}· {tn(sum.now, '{n} this week', '{n} this week')}{/if}
      </p>
      <span class="bc-bar" aria-hidden="true"><span style:width="{Math.round((sum.done / Math.max(sum.of, 1)) * 100)}%"></span></span>
    </div>
  {/if}
  {#if rows.length}
    <div class="bc-list" data-countdown-list>
      {#each rows as r, i (r.id)}
        {@const st = stateOf(r, race, today)}
        {#if freezeAt > 0 && i === 0}<h3 class="bc-ph">{t('Until the stop')}</h3>{/if}
        {#if freezeAt >= 0 && i === freezeAt + 1}<h3 class="bc-ph">{t('Until the start')}</h3>{/if}
        <label class="bc-row bc-s-{st}" class:bc-done={r.done} class:bc-lock={i === freezeAt}>
          <span class="bc-wk num" aria-hidden="true">{#if i === freezeAt}<Lock size={14} aria-hidden="true" />{/if}{r.weeks}<small>{t('wk|countdown')}</small></span>
          <span class="bc-text">
            <b>{r.text}</b>
            <small class="bc-when" class:bc-late={st === 'late'} data-countdown-state={st}>{tn(r.weeks, '{n} week before', '{n} weeks before')}{#if race}{' '}· {day(dueOf(race, r.weeks))}{/if}</small>
            {#if STATE[st] && st !== 'done'}<small class="bc-chip">{t(STATE[st])}</small>{/if}
          </span>
          <input class="bc-cb" type="checkbox" checked={r.done} onchange={(e) => tick(r.id, e.currentTarget.checked)} aria-label={r.text} data-countdown-done={r.id} />
        </label>
      {/each}
    </div>
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
  .bc-head {
    display: grid;
    gap: 10px;
    padding: 14px 16px;
    border-radius: var(--radius-card);
    background: var(--accent-soft);
  }
  .bc-top {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 8px;
  }
  .bc-days {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    line-height: 1;
  }
  .bc-days b {
    font-size: var(--fs-num);
    letter-spacing: -0.02em;
  }
  .bc-days small {
    padding-bottom: 4px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.2;
  }
  .bc-stop {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 999px;
    background: var(--paper);
    color: var(--accent);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .bc-stop.over {
    background: var(--accent);
    color: var(--paper);
  }
  .bc-tl {
    position: relative;
    height: 62px;
    margin: 0 8px;
  }
  .bc-ax,
  .bc-zone {
    position: absolute;
    top: 22px;
    height: 10px;
    border-radius: 6px;
  }
  .bc-ax {
    left: 0;
    right: 0;
    background: var(--paper);
  }
  .bc-zone {
    right: 0;
    background: var(--accent);
    opacity: 0.35;
  }
  .bc-pt {
    position: absolute;
    top: 16px;
    width: 22px;
    height: 22px;
    margin-left: -11px;
    box-sizing: border-box;
    border: 3px solid var(--accent);
    border-radius: 50%;
    background: var(--paper);
  }
  .bc-pt.now {
    background: var(--ink);
    border-color: var(--paper);
    box-shadow: 0 0 0 2px var(--ink);
  }
  .bc-pt.end {
    left: 100%;
  }
  .bc-lb {
    position: absolute;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    font-weight: 600;
    white-space: nowrap;
  }
  .bc-lb.up {
    top: -2px;
    margin-left: -4px;
  }
  .bc-lb.up.flip {
    transform: translateX(-100%);
    margin-left: 4px;
  }
  .bc-lb.up.right {
    left: auto;
    right: -8px;
    margin: 0;
    transform: none;
  }
  .bc-lb.down {
    top: 42px;
    left: -8px;
  }
  .bc-lb.down.mid {
    transform: translateX(-50%);
    color: var(--accent);
  }
  .bc-sum {
    margin: 0;
    font-weight: 600;
  }
  .bc-bar {
    display: block;
    height: 8px;
    border-radius: 4px;
    background: var(--paper);
    overflow: hidden;
  }
  .bc-bar span {
    display: block;
    height: 100%;
    background: var(--accent);
  }
  .bc-when {
    color: var(--ink-2);
  }
  .bc-late {
    color: var(--warn);
    font-weight: 600;
  }
  .bc-list {
    display: grid;
    gap: 8px;
  }
  .bc-ph {
    margin: 8px 2px 0;
    font-size: var(--fs-small);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  .bc-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    min-height: 44px;
    padding: 12px 14px;
    border: 1px solid var(--card-line);
    border-radius: 16px;
    background: var(--paper);
    cursor: pointer;
  }
  .bc-s-late {
    border-color: var(--warn);
    background: var(--warn-soft);
  }
  .bc-wk {
    display: grid;
    flex: none;
    justify-items: center;
    align-content: center;
    width: 50px;
    padding: 5px 0;
    border-radius: 12px;
    background: var(--paper-2);
    font-size: var(--fs-sub);
    font-weight: 700;
    line-height: 1;
  }
  .bc-wk small {
    margin-top: 2px;
    font-size: var(--fs-tiny);
    font-weight: 500;
    color: var(--ink-3);
  }
  .bc-s-now .bc-wk {
    background: var(--accent-soft);
  }
  .bc-text {
    display: grid;
    flex: 1;
    gap: 2px;
    min-width: 0;
  }
  .bc-text b {
    font-weight: 650;
    line-height: 1.3;
  }
  .bc-chip {
    justify-self: start;
    margin-top: 2px;
    padding: 1px 9px;
    border-radius: 999px;
    background: var(--accent-soft);
    color: var(--accent);
    font-weight: 600;
  }
  .bc-s-late .bc-chip {
    background: var(--paper);
    color: var(--warn);
  }
  .bc-done {
    opacity: 0.7;
  }
  .bc-done b {
    color: var(--ink-2);
    font-weight: 500;
  }
  .bc-lock {
    border-color: var(--brand);
    background: var(--brand);
    color: var(--brand-ink);
  }
  .bc-lock .bc-wk {
    background: color-mix(in srgb, var(--brand-ink) 16%, transparent);
    color: var(--brand-ink);
  }
  .bc-lock .bc-wk small,
  .bc-lock .bc-when {
    color: var(--brand-ink-2);
  }
  .bc-lock .bc-chip {
    background: color-mix(in srgb, var(--brand-ink) 18%, transparent);
    color: var(--brand-ink);
  }
  .bc-cb {
    appearance: none;
    display: grid;
    place-items: center;
    flex: none;
    width: 26px;
    height: 26px;
    margin: 0;
    border: 2px solid var(--line-strong);
    border-radius: 50%;
    background: var(--paper);
    cursor: pointer;
  }
  .bc-cb:checked {
    border-color: var(--accent);
    background: var(--accent);
  }
  .bc-cb:checked::after {
    content: '';
    width: 6px;
    height: 11px;
    margin-top: -2px;
    border: solid var(--paper);
    border-width: 0 2.5px 2.5px 0;
    transform: rotate(45deg);
  }
  .bc-cb:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
  .bc-more summary {
    cursor: pointer;
    min-height: 44px;
    display: flex;
    align-items: center;
    font-weight: 600;
  }
</style>
