<script>
  /**
   * «Deine Gewohnheiten» (Noah 27.10.2026 «1a 2a und b 3b»): one chosen habit on top of Heute, built like
   * the meditation card (MedCard.svelte): the symbol, the name with today's state and the goal, the last
   * 7 days as dots, the days in a row, one button. An activity of Aktiv (2a) ticks with one tap (the same
   * tick as on Aktiv, a second tap takes it back with Undo); «With stopwatch» opens its sheet with the
   * stopwatch. An item of «Das tut mir gut» (2b) ticks for today, a second tap takes it back.
   * The pencil opens «Which habits on top?» (1a). Meditation keeps its own card (MedCard.svelte).
   */
  import { Check, Heart, Pencil, Timer as TimerIcon } from '@lucide/svelte';
  import ActIcon from '../flow/ActIcon.svelte';
  import { ui, tapAct, actName } from '../flow/ui.svelte.js';
  import { actGoalText, wd } from '../flow/words.js';
  import { streaks } from '../flowmed.js';
  import { readRoutine, saveRoutine } from '../routine-data.js';
  import { doneDays, isFor, streakOf, toggleTick, addDays } from '../routine.js';
  import { itemName } from '../routine-words.js';
  import { lastSeven } from './habits.js';
  import { t, tn } from '../i18n.svelte.js';

  /** kind 'act': st = the state of the activity, log = Aktiv's log; kind 'routine': item, routine, auto */
  let { kind, today, st = null, log = [], item = null, routine = null, auto = {}, onpick = null } = $props();

  const isAct = $derived(kind === 'act');
  const id = $derived(isAct ? st?.act.id : item?.id);
  const name = $derived(isAct ? actName(st?.act) : item ? itemName(item) : '');
  const done = $derived(isAct ? new Set(log.filter((e) => e.actId === id && e.day).map((e) => e.day)) : routine && item ? doneDays(routine, item, auto) : new Set());
  const week = $derived(lastSeven(done, today, addDays));
  const doneToday = $derived(done.has(today));
  const row = $derived(isAct ? streaks(log, id, today).now : routine && item ? streakOf(routine, item, today, auto) : 0);
  const free = $derived(!isAct && item && !isFor(item, today));
  const line = $derived(doneToday ? t('done today ✓') : free ? t('not planned for today') : t('still open today'));
  const goal = $derived(isAct && st ? actGoalText(st.act, today) : '');
  const href = $derived(isAct ? `#/flow/act/${encodeURIComponent(id ?? '')}` : '#/routine');

  let busy = false;
  async function tickIt() {
    if (busy) return;
    busy = true;
    try {
      if (isAct) await tapAct(st, today);
      else await saveRoutine(toggleTick(await readRoutine(), id, today));
    } finally {
      busy = false;
    }
  }
</script>

<section class="mc" aria-labelledby="hc-{kind}-{id}" data-habit-card="{kind}:{id}">
  <span class="mi" aria-hidden="true">{#if isAct}<ActIcon icon={st?.act.icon} ring={st?.act.ring} box={false} size={20} />{:else}<Heart size={20} />{/if}</span>
  <span class="mt">
    <a id="hc-{kind}-{id}" {href}>{name}</a>
    <small>{line}{#if goal}{` · ${t('Goal|flow')} ${goal}`}{/if}</small>
  </span>
  {#if onpick}<button type="button" class="pen" aria-label={t('Choose other habits')} title={t('Choose other habits')} onclick={onpick} data-habit-pick><Pencil size={16} aria-hidden="true" /></button>{/if}
  <span class="dots" role="img" aria-label={t('{n} of 7 days', { n: week.filter((g) => g.on).length })}>
    {#each week as g (g.day)}<span><i class:ok={g.on} aria-hidden="true">{#if g.on}<Check size={11} strokeWidth={3} />{/if}</i>{wd(g.day)}</span>{/each}
  </span>
  {#if row > 1}<span class="ser">{tn(row, '{n} day in a row', '{n} days in a row')}</span>{/if}
  <span class="acts">
    <button type="button" class="btn" class:hi={!doneToday} aria-pressed={doneToday} onclick={tickIt} data-habit-tick>
      <Check size={16} aria-hidden="true" />
      {doneToday ? t('Ticked · take back') : t('Tick off|habit')}
    </button>
    {#if isAct}<button type="button" class="l" onclick={() => (ui.tick = id)} data-habit-watch><TimerIcon size={14} aria-hidden="true" />{t('With stopwatch')}</button>{/if}
  </span>
</section>

<style>
  .mc {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 16px;
    padding: 12px 16px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
    color: var(--ink);
    min-width: 0;
  }
  .mi {
    flex: none;
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: var(--accent);
    color: var(--paper);
  }
  .mi :global(svg) {
    color: var(--paper);
  }
  .mt {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .mt a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    margin: -10px 0 -8px;
    color: var(--ink);
    text-decoration: none;
    font: 650 var(--fs-body)/1.25 var(--font-body);
    overflow-wrap: break-word;
  }
  .mt small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .pen {
    flex: none;
    order: 9;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .dots {
    display: flex;
    gap: 8px;
    margin-left: auto;
  }
  .dots > span {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .dots i {
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border: 2px solid var(--line-strong);
    border-radius: 50%;
    color: var(--paper);
  }
  .dots i.ok {
    border-color: var(--accent);
    background: var(--accent);
  }
  .ser {
    padding: 3px 10px;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
    white-space: nowrap;
  }
  .acts {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .l {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--accent);
    font: 600 var(--fs-small)/1.2 var(--font-body);
    text-decoration: underline;
    white-space: nowrap;
    cursor: pointer;
  }
  @media (max-width: 719px) {
    .mc {
      padding: 12px;
    }
    .mt {
      flex: 1 1 0;
    }
    .pen {
      order: 0;
      margin: -6px -6px -6px 0;
    }
    .dots {
      width: 100%;
      margin-left: 0;
      justify-content: space-between;
    }
    .acts {
      width: 100%;
      flex-wrap: wrap;
      gap: 4px 12px;
    }
    .acts .btn {
      flex: 1 1 auto;
      justify-content: center;
      white-space: nowrap;
    }
  }
</style>
