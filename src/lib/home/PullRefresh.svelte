<script>
  /**
   * «Ziehen zum Aktualisieren mit Velorad» (Noah 03.11.2026 «b», Paket D, Idee 10): on Heute, at the very top, a finger
   * pulls the page down and a small drawn bike wheel comes down with it, turning with the finger. Let go far
   * enough and the weather and the Strava rides load fresh while the wheel spins; then «Up to date».
   * A touch screen only (a computer has the «Fetch now» buttons of the pages). Does not start with a window open, in
   * the middle of the page or on another page. Still wheel (no spinning) with «Bewegung reduzieren».
   */
  import { onMount } from 'svelte';
  import { Check } from '@lucide/svelte';
  import { db } from '../db.js';
  import { loadCore } from '../wetter/kern.js';
  import { fetchNow, readKey } from '../strava/client.svelte.js';
  import { THRESHOLD, BUSY_PULL, REFRESHED, MIN_SHOW, pullOf, arms, isHeute, refreshToday } from './refresh.js';
  import { t } from '../i18n.svelte.js';

  let pull = $state(0); // px the wheel hangs down while the finger pulls
  let phase = $state('idle'); // idle · pulling · busy · done
  let what = $state({ weather: false, strava: false });
  let mark = $state(null); // the empty marker span: its parent is the page that moves down with the finger
  let y0 = null;
  let x0 = 0;
  let drag = $state(false);

  const startOk = () => isHeute(globalThis.location?.hash) && (document.scrollingElement?.scrollTop ?? 0) <= 0 && !document.querySelector('dialog[open]') && phase === 'idle';

  function start(e) {
    if (e.touches.length !== 1 || !startOk()) return (y0 = null);
    y0 = e.touches[0].clientY;
    x0 = e.touches[0].clientX;
    drag = false;
  }
  function move(e) {
    if (y0 == null) return;
    const dy = e.touches[0].clientY - y0;
    if (!drag) {
      // a pull starts on a clear downward move; a sideways or upward one is not ours
      if (dy < -8 || Math.abs(e.touches[0].clientX - x0) > 24 || (document.scrollingElement?.scrollTop ?? 0) > 0) return (y0 = null);
      if (dy < 10) return;
      drag = true;
      phase = 'pulling';
    }
    pull = pullOf(dy);
  }
  async function end() {
    if (y0 == null && !drag) return;
    const go = drag && arms(pull);
    y0 = null;
    drag = false;
    if (!go) {
      phase = 'idle';
      pull = 0;
      return;
    }
    phase = 'busy';
    pull = BUSY_PULL;
    const began = Date.now();
    what = await refreshToday({ db, loadCore, fetchNow, hasStrava: !!readKey() });
    globalThis.dispatchEvent(new Event(REFRESHED));
    const wait = MIN_SHOW - (Date.now() - began);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    phase = 'done';
    setTimeout(() => {
      phase = 'idle';
      pull = 0;
    }, 1100);
  }
  onMount(() => {
    const o = { passive: true };
    document.addEventListener('touchstart', start, o);
    document.addEventListener('touchmove', move, o);
    document.addEventListener('touchend', end, o);
    document.addEventListener('touchcancel', end, o);
    return () => {
      document.removeEventListener('touchstart', start);
      document.removeEventListener('touchmove', move);
      document.removeEventListener('touchend', end);
      document.removeEventListener('touchcancel', end);
    };
  });
  // Today moves down with the finger, the wheel sits in the gap under the top bar
  $effect(() => {
    const host = mark?.parentElement;
    if (!host) return;
    const still = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    host.style.transition = drag || still ? 'none' : 'translate 220ms var(--ease-out)';
    host.style.translate = pull ? `0 ${pull}px` : '';
  });
  const label = $derived(
    phase === 'pulling' && arms(pull)
      ? t('Let go to refresh')
      : phase === 'busy'
        ? what.strava ? t('Refreshing weather and Strava …') : what.weather ? t('Refreshing the weather …') : t('Refreshing …')
        : phase === 'done'
          ? t('Up to date')
          : ''
  );
</script>

<span data-pull hidden bind:this={mark}></span>
{#if phase !== 'idle'}
  <div class="pr" class:busy={phase === 'busy'} class:done={phase === 'done'} class:drag style="--y:{pull}" data-pull-wheel={phase} role="status">
    <span class="bubble" aria-hidden="true">
      {#if phase === 'done'}<Check size={22} />
      {:else}
        <svg class="wheel" viewBox="-14 -14 28 28" width="30" height="30" style="--turn:{pull * 4}deg">
          <g class="rot"><circle r="11" /><circle class="hub" r="1.6" /><path d="M0 -11V11M-11 0H11M-7.8 -7.8L7.8 7.8M7.8 -7.8L-7.8 7.8" /></g>
        </svg>
      {/if}
    </span>
    {#if label}<span class="pr-lbl">{label}</span>{/if}
  </div>
{/if}

<style>
  /* the browser's own pull-down reload would fight with ours on Today */
  :global(html:has([data-pull])) {
    overscroll-behavior-y: contain;
  }
  .pr {
    /* the page (.home) is moved down by the pull, so this sits inside it and rides in the gap above the first card */
    position: absolute;
    z-index: 5;
    top: calc(var(--y) * -1px);
    left: 50%;
    display: grid;
    justify-items: center;
    gap: 4px;
    translate: -50% 0;
    opacity: clamp(0, calc((var(--y) - 20) / 24), 1);
    pointer-events: none;
  }
  .bubble {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--paper);
    box-shadow: 0 2px 8px var(--shadow);
    color: var(--hi);
  }
  .wheel {
    fill: none;
    stroke: currentColor;
    stroke-width: 2.2;
    stroke-linecap: round;
  }
  .wheel path {
    stroke-width: 1.1;
  }
  .wheel .hub {
    fill: currentColor;
    stroke: none;
  }
  .rot {
    rotate: var(--turn);
  }
  .pr-lbl {
    padding: 2px 10px;
    border-radius: 99px;
    background: var(--paper);
    box-shadow: 0 1px 4px var(--shadow);
    color: var(--ink-2);
    font-size: var(--fs-small);
    white-space: nowrap;
  }
  @media (prefers-reduced-motion: no-preference) {
    .pr:not(.drag) {
      transition: opacity 220ms var(--ease-out);
    }
    .busy .rot {
      animation: pr-spin 0.8s linear infinite;
    }
  }
  @keyframes pr-spin {
    from {
      rotate: 0deg;
    }
    to {
      rotate: 360deg;
    }
  }
</style>
