<script>
  /**
   * «Timer» (Z4 «Klein machen: der Timer schwebt unten rechts und läuft auf jeder Seite weiter»): the
   * running timer, small, on every page but the timer page (App.svelte). A tap opens the timer page;
   * at the end it says «Fertig» and opens the page with the note (Z4).
   * It sits above the flow stopwatch when both run.
   */
  import { Timer as TimerIcon, Pause, Play, Check } from '@lucide/svelte';
  import { timer, togglePause, loadPrefs } from './run.svelte.js';
  import { position, digits, modeOf } from '../timer.js';
  import { clockState } from '../flow/ui.svelte.js';
  import { t } from '../i18n.svelte.js';

  $effect(() => {
    loadPrefs();
  });
  const run = $derived(timer.run);
  const pos = $derived(run ? position(run, timer.now) : null);
  const name = $derived(run ? run.why || run.label || t(modeOf(run.setup.mode).label) : ''); // Paket A part 4: what it runs for first
</script>

{#if run && pos}
  <div class="tfl" class:up={!!clockState.tm} role="group" aria-label={t('Timer')} data-timer-float>
    <a class="open" href="#/timer" aria-label={t('Open the timer')}>
      <TimerIcon size={18} aria-hidden="true" />
      <span class="mt"><small>{name}</small><b class="num">{digits(pos.show, timer.prefs.fmt)}</b></span>
    </a>
    <button type="button" class="pp" onclick={togglePause} aria-label={run.pausedAt ? t('Go on') : t('Pause')}>{#if run.pausedAt}<Play size={18} aria-hidden="true" />{:else}<Pause size={18} aria-hidden="true" />{/if}</button>
  </div>
{:else if timer.done}
  <a class="tfl done" class:up={!!clockState.tm} href="#/timer" data-timer-float="done"><Check size={18} aria-hidden="true" />{t('Timer done · add a note')}</a>
{/if}

<style>
  .tfl {
    position: fixed;
    right: max(16px, env(safe-area-inset-right));
    bottom: 24px;
    z-index: 7;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px;
    border-radius: 999px;
    background: var(--brand);
    color: var(--brand-ink);
    box-shadow: 0 8px 24px var(--shadow);
  }
  @media (max-width: 719px) {
    .tfl {
      bottom: calc(86px + env(safe-area-inset-bottom));
    }
  }
  .tfl.up {
    transform: translateY(-64px);
  }
  .tfl :focus-visible,
  .tfl.done:focus-visible {
    outline-color: var(--focus-on-dark);
  }
  .tfl.done {
    gap: 8px;
    min-height: 48px;
    padding: 0 18px;
    font-weight: 500;
    text-decoration: none;
  }
  .open {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    padding: 0 8px 0 14px;
    color: var(--brand-ink);
    text-decoration: none;
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
</style>
