<script>
  /**
   * Cooking mode of «Kochen» (Noah 28.10.2026 «5a»): one step per screen in big letters, «Back» and «Next»,
   * a timer where a step needs one, and the screen stays on while you cook. «All steps» shows the whole
   * order at a glance; a tap on a step jumps there. A timer keeps running when you go on to the next step;
   * when it ends, the phone rings and vibrates and a line says which step it was. The step lives in the
   * address (#/me/alltag/kochen/<id>?cook=2), so the phone's back key goes one step back.
   */
  import { onMount } from 'svelte';
  import { X, ChevronLeft, ChevronRight, Timer, List, Check, Pause, Play, RotateCcw } from '@lucide/svelte';
  import { clampStep, timerOf, secondsLeft, fmtClock, stepsMinutes } from '../kochen/kochen.js';
  import { playSound, vibrate, wakeSounds, DEFAULT_END_SOUND } from '../flowsounds.js';
  import { t } from '../i18n.svelte.js';

  /** recipe: the recipe; step: 1 … n; rows: the ingredient rows for the chosen portions. */
  let { recipe, step = 1, rows = [], onstep, onclose, ondone } = $props();

  const tx = (s) => (recipe.own ? s : t(s));
  const steps = $derived(recipe.steps);
  const n = $derived(steps.length);
  const at = $derived(clampStep(step, n));
  const cur = $derived(steps[at - 1]);
  const last = $derived(at >= n);

  // timers by step (index from 1): { endAt } running, { left } paused; they survive going to another step
  let timers = $state({});
  let now = $state(Date.now());
  let rung = $state([]);
  let overview = $state(false);

  const leftOf = (i) => {
    const tm = timers[i];
    if (!tm) return timerOf(steps[i - 1]);
    return tm.endAt ? secondsLeft(tm.endAt, now) : tm.left;
  };
  const running = $derived(Object.entries(timers).filter(([, tm]) => tm.endAt).map(([i]) => Number(i)));

  function startTimer(i) {
    wakeSounds();
    const sec = timers[i]?.left ?? timerOf(steps[i - 1]);
    timers = { ...timers, [i]: { endAt: Date.now() + sec * 1000 } };
    rung = rung.filter((x) => x !== i);
  }
  function pauseTimer(i) {
    timers = { ...timers, [i]: { left: secondsLeft(timers[i].endAt) } };
  }
  function resetTimer(i) {
    const { [i]: _, ...rest } = timers;
    timers = rest;
    rung = rung.filter((x) => x !== i);
  }
  function tick() {
    now = Date.now();
    for (const i of running) {
      if (secondsLeft(timers[i].endAt, now) > 0) continue;
      timers = { ...timers, [i]: { left: 0 } };
      rung = [...rung.filter((x) => x !== i), i];
      playSound(DEFAULT_END_SOUND);
      vibrate();
    }
  }

  // the screen stays on (and comes back after the phone was locked)
  let lock = null;
  async function keepScreen() {
    try {
      if (!lock && navigator.wakeLock && document.visibilityState === 'visible') {
        lock = await navigator.wakeLock.request('screen');
        lock.addEventListener?.('release', () => (lock = null));
      }
    } catch {
      lock = null;
    }
  }
  onMount(() => {
    keepScreen();
    const iv = setInterval(tick, 500);
    const vis = () => keepScreen();
    document.addEventListener('visibilitychange', vis);
    return () => {
      clearInterval(iv);
      document.removeEventListener('visibilitychange', vis);
      lock?.release?.().catch(() => {});
      lock = null;
    };
  });

  const go = (i) => {
    overview = false;
    onstep?.(clampStep(i, n));
  };
  function key(e) {
    if (e.target?.closest?.('input, textarea, select')) return;
    if (e.key === 'ArrowRight' && !last) go(at + 1);
    else if (e.key === 'ArrowLeft' && at > 1) go(at - 1);
    else if (e.key === 'Escape') overview ? (overview = false) : onclose?.();
  }
</script>

<svelte:window onkeydown={key} />

<div class="cm" data-ko-cook>
  <div class="cm-top">
    <button type="button" class="btn sm" onclick={() => onclose?.()} data-ko-cook-close><X size={16} aria-hidden="true" />{t('Stop cooking')}</button>
    <h1 class="cm-title" tabindex="-1" data-page-title>{tx(recipe.title)}</h1>
    <button type="button" class="btn sm" aria-expanded={overview} onclick={() => (overview = !overview)} data-ko-cook-all><List size={16} aria-hidden="true" />{t('All steps')}</button>
  </div>

  {#each rung as i (i)}
    <p class="cm-rung" role="alert" data-ko-cook-rung={i}>
      <Timer size={18} aria-hidden="true" />{t('The timer of step {n} is done.', { n: i })}
      <button type="button" class="btn sm" onclick={() => resetTimer(i)}>{t('OK')}</button>
    </p>
  {/each}
  {#each running.filter((i) => i !== at) as i (i)}
    <button type="button" class="cm-run" onclick={() => go(i)} data-ko-cook-running={i}>
      <Timer size={16} aria-hidden="true" />{t('Step {n}', { n: i })}{' · '}{fmtClock(leftOf(i))}
    </button>
  {/each}

  {#if overview}
    <section class="fz-box cm-all" aria-labelledby="cm-all-h" data-ko-cook-overview>
      <h2 class="fz-h2" id="cm-all-h">{t('All steps')}{#if stepsMinutes(recipe)}{' · '}{t('{n} min', { n: stepsMinutes(recipe) })}{/if}</h2>
      {#if rows.length}
        <p class="fz-note">{t('Ingredients')}: {rows.map((r) => (r.amount ? `${r.amount} ${r.unit} ${r.name}` : r.name)).join(' · ')}</p>
      {/if}
      <ol class="cm-ol">
        {#each steps as s, i (i)}
          <li>
            <button type="button" class="cm-li" class:done={i + 1 < at} class:now={i + 1 === at} aria-current={i + 1 === at ? 'step' : undefined} onclick={() => go(i + 1)} data-ko-cook-jump={i + 1}>
              <span class="cm-num" aria-hidden="true">{#if i + 1 < at}<Check size={14} />{:else}{i + 1}{/if}</span>
              <span>{tx(s.text)}<small>{#if timerOf(s)}{t('Timer {n} min', { n: s.min })}{:else if s.min}{t('about {n} min', { n: s.min })}{/if}{#if i + 1 === at}{' · '}{t('you are here')}{/if}</small></span>
            </button>
          </li>
        {/each}
      </ol>
    </section>
  {:else}
    <section class="fz-box cm-step" aria-live="polite" data-ko-cook-step={at}>
      <p class="cm-of">{t('Step {n} of {m}', { n: at, m: n })}</p>
      <p class="cm-big">{tx(cur.text)}</p>
      {#if timerOf(cur)}
        <div class="cm-timer" data-ko-timer>
          <Timer size={22} aria-hidden="true" />
          <span class="cm-clock" data-ko-timer-left>{fmtClock(leftOf(at))}</span>
          {#if timers[at]?.endAt}
            <button type="button" class="btn sm" onclick={() => pauseTimer(at)} data-ko-timer-pause><Pause size={16} aria-hidden="true" />{t('Pause')}</button>
          {:else}
            <button type="button" class="btn sm hi" onclick={() => startTimer(at)} disabled={leftOf(at) <= 0} data-ko-timer-start><Play size={16} aria-hidden="true" />{timers[at] ? t('Go on') : t('Start')}</button>
          {/if}
          {#if timers[at]}
            <button type="button" class="btn sm" onclick={() => resetTimer(at)} aria-label={t('Timer back to the start')} data-ko-timer-reset><RotateCcw size={16} aria-hidden="true" /></button>
          {/if}
        </div>
      {:else if cur.min}
        <p class="cm-about">{t('about {n} min', { n: cur.min })}</p>
      {/if}
      <div class="cm-dots" aria-hidden="true">
        {#each steps as _, i (i)}<i class:done={i + 1 < at} class:on={i + 1 === at}></i>{/each}
      </div>
      <div class="cm-nav">
        <button type="button" class="btn" onclick={() => go(at - 1)} disabled={at <= 1} data-ko-cook-back><ChevronLeft size={18} aria-hidden="true" />{t('Back')}</button>
        {#if last}
          <button type="button" class="btn hi" onclick={() => ondone?.()} data-ko-cook-done><Check size={18} aria-hidden="true" />{t('Done')}</button>
        {:else}
          <button type="button" class="btn hi" onclick={() => go(at + 1)} data-ko-cook-next>{t('Next|cook')}<ChevronRight size={18} aria-hidden="true" /></button>
        {/if}
      </div>
    </section>
    <p class="fz-note">{t('Tip: a timer keeps running when you go on to the next step. The screen stays on while you cook.')}</p>
  {/if}
</div>

<style>
  .cm {
    max-width: 720px;
    margin: 0 auto;
  }
  .cm-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }
  .cm-title {
    font-size: var(--fs-sub);
    margin: 0;
    flex: 1 1 160px;
    text-align: center;
    min-width: 0;
  }
  .cm-step {
    text-align: center;
    padding: 24px 16px;
  }
  .cm-of {
    margin: 0;
    color: var(--brand);
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-size: var(--fs-small);
  }
  .cm-big {
    font-size: var(--fs-title);
    font-weight: 700;
    line-height: 1.25;
    margin: 12px 0 16px;
  }
  .cm-about {
    color: var(--ink-2);
    margin: 0 0 12px;
  }
  .cm-timer {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 999px;
    background: var(--paper-2);
    margin-bottom: 16px;
  }
  .cm-clock {
    font-size: var(--fs-section);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    min-width: 4ch;
  }
  .cm-dots {
    display: flex;
    justify-content: center;
    gap: 6px;
    margin: 4px 0 20px;
  }
  .cm-dots i {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--line);
  }
  .cm-dots i.done {
    background: var(--ink-3);
  }
  .cm-dots i.on {
    background: var(--brand);
  }
  .cm-nav {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }
  .cm-rung {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--paper-2);
    font-weight: 600;
    margin: 0 0 8px;
  }
  .cm-run {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 12px;
    margin: 0 8px 8px 0;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .cm-ol {
    list-style: none;
    margin: 8px 0 0;
    padding: 0;
  }
  .cm-li {
    display: flex;
    gap: 12px;
    width: 100%;
    text-align: left;
    padding: 10px 4px;
    min-height: 44px;
    border: 0;
    border-bottom: 1px solid var(--line);
    background: none;
    color: var(--ink);
    font: inherit;
    cursor: pointer;
    align-items: flex-start;
  }
  .cm-li.done {
    color: var(--ink-2);
  }
  .cm-li.now {
    font-weight: 700;
  }
  .cm-li small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 400;
  }
  .cm-num {
    flex: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--paper-2);
    display: grid;
    place-items: center;
    font-weight: 700;
    font-size: var(--fs-small);
  }
  .cm-li.now .cm-num {
    background: var(--brand);
    color: var(--paper);
  }
</style>
