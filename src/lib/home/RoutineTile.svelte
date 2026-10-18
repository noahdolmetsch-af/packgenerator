<script>
  /**
   * Routine «Das tut mir gut» on Heute (mockup D1, Noah 12.10.2026 «d1-d5 freigeben», 1a: a wide tile at
   * the top). The items for today with a round tick (a tap ticks, a second tap takes it back), «3 of 7 ·
   * Thu» and a bar, days in a row from 2 on, the nearest milestone and «Change list ›» (#/routine).
   * «Meditated yet?» ticks itself when Im Flow has a meditation today. Everything is a suggestion: the
   * tile can leave the wall, every item can be deleted on the page.
   */
  import { Heart, Check, Flame, ChevronRight, Link2 } from '@lucide/svelte';
  import { routineQuery, saveRoutine, readRoutine } from '../routine-data.js';
  import { itemsFor, isDone, isAuto, toggleTick, countFor, streakOf, nextMilestone, weekdayOf, SHOW_STREAK } from '../routine.js';
  import { itemName, daysWords, dayShort, daysN } from '../routine-words.js';
  import { t, num } from '../i18n.svelte.js';

  let { today, isnew = false } = $props();
  const q = $derived(routineQuery(today));
  const data = $derived($q);
  const routine = $derived(data?.routine ?? null);
  const auto = $derived(data?.auto ?? {});
  const list = $derived(routine ? itemsFor(routine.items, today) : []);
  const count = $derived(routine ? countFor(routine, today, auto) : { n: 0, of: 0 });
  const ms = $derived(routine ? nextMilestone(routine, today, auto) : null);

  // a tap waits for the one before and toggles what is saved (never a lagging view)
  let busy = false;
  async function tap(id) {
    if (busy) return;
    busy = true;
    try {
      await saveRoutine(toggleTick(await readRoutine(), id, today));
    } finally {
      busy = false;
    }
  }
  const sub = (x) => {
    if (x.link === 'meditation') return isAuto(routine, x, today, auto) ? t('linked with Im Flow · {min} min', { min: num(data.medMin) }) : t('linked with Im Flow');
    return daysWords(x.days);
  };
</script>

<section class="rt surf" aria-labelledby="rt-h" data-routine>
  <div class="rt-head">
    <Heart size={18} aria-hidden="true" />
    <h2 id="rt-h">{t('What does me good')}</h2>
    {#if isnew}<span class="nw">{t('new|tile')}</span>{/if}
    <span class="rt-side num" data-routine-count>{t('{n} of {m}', { n: num(count.n), m: num(count.of) })} · {dayShort(weekdayOf(today))}</span>
  </div>
  <div class="rt-bar" role="progressbar" aria-label={t('What does me good')} aria-valuemin="0" aria-valuemax={count.of} aria-valuenow={count.n}><span style:width={`${count.of ? (100 * count.n) / count.of : 0}%`}></span></div>
  <p class="rt-hint" data-routine-hint>{t('Tick off what did you good today. No must, everything is a suggestion.')}</p>
  {#if routine && !list.length}
    <p class="rt-empty">{t('Nothing on your list for today.')}</p>
  {/if}
  <ul class="rt-list">
    {#each list as x (x.id)}
      {@const done = isDone(routine, x, today, auto)}
      {@const auto1 = isAuto(routine, x, today, auto)}
      {@const s = streakOf(routine, x, today, auto)}
      {@const line = sub(x)}
      <li data-item={x.id} class:done>
        <button type="button" class="rt-row" aria-pressed={done} disabled={auto1} title={auto1 ? t('Ticked by Im Flow') : undefined} onclick={() => tap(x.id)}>
          <span class="rt-tick" aria-hidden="true">{#if done}<Check size={16} strokeWidth={3} />{/if}</span>
          <span class="rt-txt">
            <span class="rt-name">{itemName(x)}</span>
            {#if line}<span class="rt-sub">{#if x.link}<Link2 size={12} aria-hidden="true" />{/if}<span>{line}</span></span>{/if}
          </span>
          {#if s >= SHOW_STREAK}<span class="rt-streak num" data-streak={s}><Flame size={14} aria-hidden="true" />{daysN(s)}</span>{/if}
        </button>
      </li>
    {/each}
  </ul>
  <div class="rt-foot">
    {#if ms}
      <p class="rt-ms" data-milestone>{ms.item ? t('Milestone: {left} more to «{name}: {goal} days in a row»', { left: daysN(ms.left), name: itemName(ms.item), goal: num(ms.goal) }) : t('Milestone: {goal} days in a row', { goal: num(ms.goal) })}</p>
    {/if}
    <a class="rt-link" href="#/routine" data-to="routine">{t('Change list')}<ChevronRight size={16} aria-hidden="true" /></a>
  </div>
</section>

<style>
  .rt {
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 100%;
    padding: 14px 18px;
    box-sizing: border-box;
  }
  .rt-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
  }
  .rt-head h2 {
    flex: 1 1 auto;
    margin: 0;
    font: 600 var(--fs-body)/1.3 var(--font-body);
  }
  .rt-side {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .nw {
    padding: 0 8px;
    border-radius: 10px;
    background: var(--hi-soft);
    color: var(--badge-ink);
    font: 600 var(--fs-tiny)/1.6 var(--font-body);
  }
  .rt-bar {
    height: 6px;
    border-radius: 3px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .rt-bar span {
    display: block;
    height: 100%;
    border-radius: 3px;
    background: var(--accent);
    transition: width 0.2s ease;
  }
  .rt-hint {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .rt-empty {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .rt-list {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .rt-list li + li {
    border-top: 1px solid var(--line);
  }
  .rt-row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 48px;
    padding: 6px 0;
    border: 0;
    background: transparent;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .rt-row:disabled {
    cursor: default;
    color: var(--ink);
  }
  .rt-row:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
    border-radius: 8px;
  }
  .rt-tick {
    display: grid;
    flex: none;
    place-items: center;
    width: 28px;
    height: 28px;
    border: 2px solid var(--line-strong);
    border-radius: 50%;
    box-sizing: border-box;
  }
  .done .rt-tick {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--paper);
  }
  .rt-txt {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-width: 0;
  }
  .rt-name {
    font-size: var(--fs-body);
    overflow-wrap: break-word;
  }
  .done .rt-name {
    color: var(--ink-2);
  }
  .rt-sub {
    display: flex;
    align-items: baseline;
    gap: 4px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .rt-sub :global(svg) {
    flex: none;
    align-self: center;
  }
  .rt-streak {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 3px;
    color: var(--warn);
    font: 600 var(--fs-small) var(--font-body);
  }
  .rt-foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px 16px;
    margin-top: auto;
  }
  .rt-ms {
    flex: 1 1 220px;
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .rt-link {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    color: var(--ink);
    font: 600 var(--fs-small) var(--font-body);
    text-decoration: none;
  }
  .rt-link:hover {
    text-decoration: underline;
  }
</style>
