<script>
  /**
   * Routine «Das tut mir gut» on Heute (mockup D1, Noah 12.10.2026 «d1-d5 freigeben», 1a: a wide tile at
   * the top). The items for today with a round tick (a tap ticks, a second tap takes it back), days in a
   * row from 2 on, the nearest milestone and «Change list ›» (#/routine). «Meditated yet?» ticks itself
   * when Im Flow has a meditation today. Everything is a suggestion: the tile can leave the wall, every
   * item can be deleted on the page.
   *
   * Noah 19.10.2026 «1a 2a 3a 4a 5a» (design rules B, design/gestaltungsrichtungen/gestaltungsregeln.md):
   * 1a the head as on the other tiles, a small ring «x of y» and one personal sentence; 2a ticked items
   * slide down under «Already done · n» (latersort: 1 s after the last tap, 250 ms); 3a two columns on a
   * wide tile; 4a seven dots per item for this week; 5a after a tick «Did it do you good?» (yes, a little,
   * no; optional), read on Me › What is good for me. The explanation follows the list (rule 9).
   */
  import { Heart, Check, Flame, ChevronRight, Link2 } from '@lucide/svelte';
  import { routineQuery, saveRoutine, readRoutine } from '../routine-data.js';
  import { itemsFor, isDone, isAuto, toggleTick, countFor, streakOf, nextMilestone, weekdayOf, weekDots, setFelt, feltOf, FELT, FELT_WORDS, SHOW_STREAK } from '../routine.js';
  import { itemName, daysWords, dayShort, daysN } from '../routine-words.js';
  import { flip } from '../ui/flip.js';
  import { laterSort, glide } from '../ui/latersort.svelte.js';
  import { t, tn, num } from '../i18n.svelte.js';

  let { today, isnew = false } = $props();
  const q = $derived(routineQuery(today));
  const data = $derived($q);
  const routine = $derived(data?.routine ?? null);
  const auto = $derived(data?.auto ?? {});
  const list = $derived(routine ? itemsFor(routine.items, today) : []);
  const count = $derived(routine ? countFor(routine, today, auto) : { n: 0, of: 0 });
  const ms = $derived(routine ? nextMilestone(routine, today, auto) : null);
  const left = $derived(count.of - count.n);

  // 2a: open first, the done ones below; the order waits 1 s after the last tap
  const doneOf = (x) => !!routine && isDone(routine, x, today, auto);
  const sort = laterSort((x) => x.id, doneOf);
  const shown = $derived(sort.order(list));
  // «Already done · n» stands before the first done row once all done rows are together at the end
  const rows = $derived.by(() => {
    const i = shown.findIndex(doneOf);
    if (i < 0 || !shown.slice(i).every(doneOf)) return shown;
    return [...shown.slice(0, i), { id: '__done', sep: true }, ...shown.slice(i)];
  });

  // 5a: the item ticked last by hand asks once «Did it do you good?» (no answer is fine)
  let asked = $state(null);
  const askItem = $derived(asked && routine ? (list.find((x) => x.id === asked && isDone(routine, x, today, auto) && feltOf(routine, x.id, today) == null) ?? null) : null);

  // a tap waits for the one before and toggles what is saved (never a lagging view)
  let busy = false;
  async function tap(id) {
    if (busy) return;
    busy = true;
    try {
      sort.tap(list);
      const before = await readRoutine();
      const was = (before.ticks[id] ?? []).includes(today);
      await saveRoutine(toggleTick(before, id, today));
      asked = was ? null : id;
    } finally {
      busy = false;
    }
  }
  async function felt(id, v) {
    await saveRoutine(setFelt(await readRoutine(), id, today, v));
    asked = null;
  }
  const sub = (x) => {
    if (x.link === 'meditation') return isAuto(routine, x, today, auto) ? t('linked with Im Flow · {min} min', { min: num(data.medMin) }) : t('linked with Im Flow');
    return daysWords(x.days);
  };
  // 1a: one personal sentence with the real count; none without items
  const sentence = $derived(!count.of ? '' : !left ? t('All ticked off for today.') : tn(left, 'One more small thing for you today.', '{n} more small things for you today.'));
  // the ring: 36 px, the done part in sage
  const R = 15;
  const C = 2 * Math.PI * R;
  const dotWord = { done: 'done|routine', open: 'not done|routine', today: 'today|routine', later: 'still to come|routine', off: 'not planned|routine' };
</script>

<section class="rt surf" aria-labelledby="rt-h" data-routine>
  <div class="rt-head">
    <span class="rt-ico" aria-hidden="true"><Heart size={16} /></span>
    <h2 id="rt-h">{t('What does me good')}</h2>
    {#if isnew}<span class="nw">{t('new|tile')}</span>{/if}
    <span class="rt-side num" data-routine-count>{t('{n} of {m}', { n: num(count.n), m: num(count.of) })} · {dayShort(weekdayOf(today))}</span>
    <svg class="rt-ring" viewBox="0 0 36 36" width="36" height="36" role="progressbar" aria-label={t('What does me good')} aria-valuemin="0" aria-valuemax={count.of} aria-valuenow={count.n}>
      <circle cx="18" cy="18" r={R} class="bg" />
      <circle cx="18" cy="18" r={R} class="fg" stroke-dasharray={C} stroke-dashoffset={count.of ? C * (1 - count.n / count.of) : C} transform="rotate(-90 18 18)" />
    </svg>
  </div>
  {#if sentence}<p class="rt-say" data-routine-say>{sentence}</p>{/if}
  {#if routine && !list.length}
    <p class="rt-empty">{t('Nothing on your list for today.')}</p>
  {/if}
  <ul class="rt-list">
    {#each rows as x (x.id)}
      <li class:rt-sep={x.sep} class:done={!x.sep && doneOf(x)} data-item={x.sep ? undefined : x.id} data-routine-done={x.sep ? '' : undefined} animate:flip={glide()}>
        {#if x.sep}
          {t('Already done · {n}', { n: num(count.n) })}
        {:else}
          {@const done = isDone(routine, x, today, auto)}
          {@const auto1 = isAuto(routine, x, today, auto)}
          {@const s = streakOf(routine, x, today, auto)}
          {@const line = sub(x)}
          {@const dots = weekDots(routine, x, today, auto)}
          <button type="button" class="rt-row" aria-pressed={done} disabled={auto1} title={auto1 ? t('Ticked by Im Flow') : undefined} onclick={() => tap(x.id)}>
            <span class="rt-tick" aria-hidden="true">{#if done}<Check size={15} strokeWidth={3} />{/if}</span>
            <span class="rt-txt">
              <span class="rt-name">{itemName(x)}</span>
              {#if line}<span class="rt-sub">{#if x.link}<Link2 size={12} aria-hidden="true" />{/if}<span>{line}</span></span>{/if}
              <span class="rt-week" role="img" aria-label={t('This week: {list}', { list: dots.filter((d) => d.state !== 'off').map((d) => `${dayShort(weekdayOf(d.day))} ${t(dotWord[d.state])}`).join(', ') })} data-week>
                {#each dots as d (d.day)}<span class="dot {d.state}" data-dot={d.state}></span>{/each}
              </span>
            </span>
            {#if s >= SHOW_STREAK}<span class="rt-streak num" data-streak={s}><Flame size={14} aria-hidden="true" />{daysN(s)}</span>{/if}
          </button>
        {/if}
      </li>
    {/each}
  </ul>
  {#if askItem}
    <div class="rt-ask" role="group" aria-label={t('Did «{name}» do you good?', { name: itemName(askItem) })} data-routine-felt={askItem.id}>
      <span>{t('Did «{name}» do you good?', { name: itemName(askItem) })}</span>
      <span class="rt-pills">
        {#each FELT as v (v)}<button type="button" class="rt-pill" onclick={() => felt(askItem.id, v)} data-felt={v}>{t(FELT_WORDS[v])}</button>{/each}
      </span>
    </div>
  {/if}
  <p class="rt-hint" data-routine-hint>{t('Tick off what did you good today. No must, everything is a suggestion.')}</p>
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
    container-type: inline-size;
  }
  /* 1a: the head as on the other tiles (TileHead): the icon in a grey square, the name, the count, a ring */
  .rt-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    min-width: 0;
  }
  .rt-ico {
    display: grid;
    flex: none;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .rt-head h2 {
    flex: 1 1 0;
    min-width: min-content;
    margin: 0;
    font: 600 var(--fs-body)/1.3 var(--font-body);
    overflow-wrap: break-word;
  }
  .rt-side {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .rt-ring {
    flex: none;
  }
  .rt-ring circle {
    fill: none;
    stroke-width: 4;
  }
  .rt-ring .bg {
    stroke: var(--paper-2);
  }
  .rt-ring .fg {
    stroke: var(--accent);
    stroke-linecap: round;
    transition: stroke-dashoffset 0.25s ease;
  }
  .nw {
    padding: 0 8px;
    border-radius: 10px;
    background: var(--hi-soft);
    color: var(--badge-ink);
    font: 600 var(--fs-tiny)/1.6 var(--font-body);
  }
  .rt-say {
    margin: 0;
    color: var(--ink);
    font: 600 var(--fs-sub)/1.35 var(--font-body);
    overflow-wrap: break-word;
  }
  .rt-hint,
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
    column-gap: 32px;
  }
  /* 3a: two columns on a wide tile (a computer) */
  @container (min-width: 720px) {
    .rt-list {
      grid-template-columns: 1fr 1fr;
    }
  }
  .rt-list li {
    border-top: 1px solid var(--line);
    min-width: 0;
  }
  /* 2a: «Already done · n», a quiet line over the whole width */
  .rt-list li.rt-sep {
    grid-column: 1 / -1;
    padding: 10px 0 4px;
    color: var(--ink-3);
    font: 600 var(--fs-small) var(--font-body);
  }
  .rt-row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 56px;
    padding: 6px 0;
    border: 0;
    background: transparent;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  @media (min-width: 720px) {
    .rt-row {
      min-height: 48px;
    }
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
    width: 26px;
    height: 26px;
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
    gap: 2px;
    min-width: 0;
  }
  .rt-name {
    font-size: var(--fs-body);
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .done .rt-name {
    color: var(--ink-2);
    font-weight: 400;
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
  /* 4a: seven dots Monday to Sunday; the word is in the label, colour is never alone */
  .rt-week {
    display: flex;
    gap: 5px;
    margin-top: 2px;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    box-sizing: border-box;
    border: 1.5px solid var(--line-strong);
  }
  .dot.done {
    border-color: var(--accent);
    background: var(--accent);
  }
  .dot.today {
    border-color: var(--ink-2);
  }
  .dot.later {
    border-style: dotted;
  }
  .dot.off {
    border-color: transparent;
    background: var(--paper-2);
    transform: scale(0.6);
  }
  .rt-streak {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 3px;
    color: var(--warn);
    font: 600 var(--fs-small) var(--font-body);
  }
  /* 5a: «Did it do you good?», one line with three pills, optional */
  .rt-ask {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    padding: 10px 12px;
    border-radius: 14px;
    background: var(--accent-soft);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .rt-ask > span:first-child {
    flex: 1 1 200px;
    font-weight: 600;
  }
  .rt-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .rt-pill {
    min-height: 44px;
    padding: 0 16px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .rt-pill:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
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
