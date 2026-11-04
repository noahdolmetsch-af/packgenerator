<script>
  /**
   * «Geheimnis im Logo» (Noah 03.11.2026, Idee 29): five quick taps on the «PG» mark (top bar on a phone, side
   * bar on a computer) and a small bike rides across the screen with «Have a good ride!». The tap still opens the
   * start page as before. With «reduce motion» the bike does not ride: it stands in the middle for a moment.
   * «Geheimmenü» (Noah 03.11.2026): more surprises share the five taps. The host picks one by chance, never the same
   * one twice in a row (`surprises.js`); each surprise is its own block below.
   */
  import { onMount } from 'svelte';
  import { t } from '../i18n.svelte.js';
  import { makeTapCounter } from './taps.js';
  import { SURPRISES, pickSurprise } from './surprises.js';
  import { pickSaying, sayingText, sayingsOffered } from './sayings.js';
  import LogoSaying from './LogoSaying.svelte';
  import LogoFlat from './LogoFlat.svelte';

  let kind = $state(null); // the surprise on screen: 'bike' | 'saying' | 'flat' | null
  let saying = $state(''); // the text of the saying on screen
  let last = null; // the one before, so it never repeats
  let lastSaying = null; // the saying before, so it never repeats either
  let timer;
  const counter = makeTapCounter();

  // «Platten im Logo» (H8): the mark loses its air and is pumped up again. Not with «reduce motion»: then only the bubble.
  function flatTyre(mark) {
    if (!mark?.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    mark.style.transformOrigin = '50% 100%';
    const flat = 'scale(1.18, 0.42)';
    const a = mark.animate(
      [
        { transform: 'scale(1)', offset: 0 },
        { transform: flat, offset: 0.14 },
        { transform: flat, offset: 0.55 },
        { transform: 'scale(1.06, 0.62)', offset: 0.63 },
        { transform: 'scale(1.14, 0.5)', offset: 0.7 },
        { transform: 'scale(1.03, 0.8)', offset: 0.78 },
        { transform: 'scale(1.08, 0.7)', offset: 0.84 },
        { transform: 'scale(1)', offset: 1 },
      ],
      { duration: 3600, easing: 'ease-in-out' },
    );
    a.onfinish = a.oncancel = () => (mark.style.transformOrigin = '');
  }

  function onClick(e) {
    if (kind || !e.target?.closest?.('.brand .mark, .logo .mark')) return;
    if (!counter(performance.now())) return;
    // the sayings only count while at least one is left (the person may have hidden them all in «Listen und Typen»)
    const id = pickSaying(sayingsOffered(), lastSaying);
    kind = last = pickSurprise(id ? SURPRISES : SURPRISES.filter((s) => s !== 'saying'), last);
    if (kind === 'saying') {
      lastSaying = id;
      saying = sayingText(id, t);
    }
    clearTimeout(timer);
    if (kind === 'flat') flatTyre(e.target.closest('.mark'));
    timer = setTimeout(() => (kind = null), kind === 'saying' ? 4600 : kind === 'flat' ? 4200 : 3200);
  }

  onMount(() => {
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('click', onClick);
      clearTimeout(timer);
    };
  });
</script>

{#if kind === 'saying'}
  <LogoSaying text={saying} />
{:else if kind === 'flat'}
  <LogoFlat />
{:else if kind === 'bike'}
  <div class="pg-ride" role="status" data-logo-ride>
    <svg viewBox="0 0 84 52" width="84" height="52" aria-hidden="true">
      <g class="wheel" style="--cx:16px;--cy:36px">
        <circle cx="16" cy="36" r="11" />
        <path d="M16 25v22M5 36h22M8.2 28.2l15.6 15.6M23.8 28.2L8.2 43.8" />
      </g>
      <g class="wheel" style="--cx:66px;--cy:36px">
        <circle cx="66" cy="36" r="11" />
        <path d="M66 25v22M55 36h22M58.2 28.2l15.6 15.6M73.8 28.2L58.2 43.8" />
      </g>
      <path class="frame" d="M16 36H36L30 18ZM30 18H56L36 36M56 18L66 36M56 18L59 11H66M30 18L28 13M24 13H33" />
    </svg>
    <span class="say">{t('Have a good ride!')}</span>
  </div>
{/if}

<style>
  .pg-ride {
    position: fixed;
    z-index: 9000;
    top: 40vh;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px 6px 6px;
    border-radius: 999px;
    background: var(--paper);
    color: var(--accent);
    box-shadow: 0 2px 12px var(--shadow);
    pointer-events: none;
  }
  svg {
    fill: none;
    stroke: currentColor;
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .wheel path {
    stroke-width: 1;
  }
  .say {
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink);
    white-space: nowrap;
  }
  @media (prefers-reduced-motion: no-preference) {
    .pg-ride {
      left: 0;
      transform: translateX(-110%);
      animation: pg-ride 3s linear forwards;
    }
    .wheel {
      transform-box: view-box;
      transform-origin: var(--cx) var(--cy);
      animation: pg-spin 0.6s linear infinite;
    }
    .frame {
      animation: pg-bob 0.3s ease-in-out infinite alternate;
    }
  }
  @keyframes pg-ride {
    to {
      transform: translateX(calc(100vw + 10%));
    }
  }
  @keyframes pg-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes pg-bob {
    to {
      transform: translateY(-1px);
    }
  }
</style>
