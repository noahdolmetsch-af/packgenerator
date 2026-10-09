<script>
  /**
   * v0.51.0 «Im Flow»: the flow windows over every page (App.svelte): the tick sheet of a long press,
   * the countdown and its small floating version (bottom right, it keeps running on every page), the
   * daily check and the «Rückgängig» toast. The «Stoppuhr» button floats on Today and on Im Flow.
   */
  import { Timer, Pause, Play, Check, Bell } from '@lucide/svelte';
  import TickSheet from './TickSheet.svelte';
  import TimerSheet from './TimerSheet.svelte';
  import CheckDialog from './CheckDialog.svelte';
  import { flowQuery } from './data.svelte.js';
  import { ui, clockState, togglePause, openTimer, runUndo, actName } from './ui.svelte.js';
  import { flowStates } from '../flow.js';
  import { remainingSec, isDone, clock } from '../flowtimer.js';
  import { localDay } from '../localday.js';
  import { t } from '../i18n.svelte.js';
  import { phone } from '../media.svelte.js';

  let { page = 'home' } = $props();
  let today = $state(localDay());
  $effect(() => {
    const id = setInterval(() => (today = localDay()), 60_000);
    return () => clearInterval(id);
  });
  const q = $derived(flowQuery(today));
  const data = $derived($q);
  const states = $derived(data ? flowStates(data.acts, data.log, today, data.tripDays) : []);
  const tickState = $derived(ui.tick ? (states.find((s) => s.act.id === ui.tick) ?? null) : null);
  const tm = $derived(clockState.tm);
  const tmAct = $derived(tm ? data?.acts.find((a) => a.id === tm.actId) : null);
  const done = $derived(tm && isDone(tm, clockState.now));
  // the «Stoppuhr» button floats on Im Flow on a phone (a computer has it in the page head)
  const launcher = $derived(!tm && page === 'flow' && phone.matches && states.length > 0);
</script>

{#if data}
  <TickSheet st={tickState} />
  <TimerSheet {states} bowl={data.bowl} />
  <CheckDialog checks={data.checks} pool={data.pool} {today} />
{/if}

{#if tm && !ui.timerOpen}
  <div class="fmini" class:done class:lift={!!ui.toast} role="group" aria-label={t('Stopwatch')}>
    <button type="button" class="open" onclick={() => openTimer()} aria-label={t('Open the stopwatch')}>
      <Bell size={18} aria-hidden="true" />
      <span class="mt"><small>{actName(tmAct)}</small><b class="num">{done ? t('done ✓') : clock(remainingSec(tm, clockState.now))}</b></span>
    </button>
    {#if done}
      <button type="button" class="pp" onclick={() => openTimer()} aria-label={t('Done · tick off')}><Check size={18} aria-hidden="true" /></button>
    {:else}
      <button type="button" class="pp" onclick={togglePause} aria-label={tm.pausedAt ? t('Continue') : t('Pause')}>{#if tm.pausedAt}<Play size={18} aria-hidden="true" />{:else}<Pause size={18} aria-hidden="true" />{/if}</button>
    {/if}
  </div>
{:else if launcher && !ui.timerOpen}
  <button type="button" class="fmini launch" class:lift={!!ui.toast} onclick={() => openTimer()}><Timer size={18} aria-hidden="true" />{t('Stopwatch')}</button>
{/if}

{#if ui.toast}
  {#key ui.toast.id}
    <div class="ftoast" role="status">
      <Check size={18} aria-hidden="true" />
      <span>{ui.toast.text}</span>
      {#if ui.toast.undo}<button type="button" class="undo" onclick={runUndo}>{t('Undo')}</button>{/if}
    </div>
  {/key}
{/if}

<style>
  .fmini {
    position: fixed;
    right: max(16px, env(safe-area-inset-right));
    bottom: 24px;
    z-index: 7;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px;
    border: 0;
    border-radius: 999px;
    background: var(--brand);
    color: var(--brand-ink);
    box-shadow: 0 8px 24px var(--shadow);
  }
  @media (max-width: 719px) {
    .fmini {
      bottom: calc(86px + env(safe-area-inset-bottom));
    }
  }
  .fmini.lift {
    transform: translateY(-64px);
  }
  .fmini :focus-visible {
    outline-color: var(--focus-on-dark);
  }
  .launch {
    gap: 8px;
    min-height: 48px;
    padding: 0 18px;
    font: inherit;
    font-weight: 500;
    cursor: pointer;
  }
  .launch:focus-visible {
    outline-color: var(--focus-on-dark);
  }
  .open {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    padding: 0 8px 0 14px;
    border: 0;
    background: none;
    color: var(--brand-ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .mt {
    display: flex;
    flex-direction: column;
    line-height: 1.1;
  }
  .mt small {
    max-width: 150px;
    overflow: hidden;
    color: var(--brand-ink-2);
    font-size: var(--fs-small);
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .mt b {
    font-family: var(--font-brand);
    font-weight: 800;
    font-size: var(--fs-section);
  }
  .pp {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: var(--brand-ink-2);
    color: var(--brand);
    cursor: pointer;
  }
  .done .pp {
    background: var(--accent);
    color: var(--paper);
  }
  .ftoast {
    position: fixed;
    left: 50%;
    bottom: 24px;
    z-index: 30;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 10px;
    width: min(520px, calc(100vw - 32px));
    padding: 6px 8px 6px 16px;
    border-radius: 12px;
    background: var(--brand);
    color: var(--brand-ink);
    box-shadow: 0 8px 24px var(--shadow);
  }
  .ftoast :global(svg) {
    flex: none;
    color: var(--accent-soft);
  }
  .ftoast span {
    flex: 1;
    min-width: 0;
    font-weight: 500;
  }
  .undo {
    min-height: 44px;
    padding: 0 10px;
    border: 0;
    background: none;
    color: var(--hi-bright);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  .undo:focus-visible {
    outline-color: var(--focus-on-dark);
  }
  @media (max-width: 719px) {
    .ftoast {
      bottom: calc(84px + env(safe-area-inset-bottom));
    }
  }
</style>
