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
  import { unlockLogo } from './logo.svelte.js';
  import LogoSaying from './LogoSaying.svelte';
  import LogoFlat from './LogoFlat.svelte';
  import LogoWeather from './LogoWeather.svelte';
  import LogoPanorama from './LogoPanorama.svelte';
  import { loadLogoWeather } from './wetter.js';
  import { db } from '../db.js';
  import Murmeltier from '../murmeltier/Murmeltier.svelte'; // the one drawn marmot of the app (Idee 28)
  import { ops } from '../bedienung.svelte.js';
  import { partOfDay } from '../dayclock.js';

  let kind = $state(null); // the surprise on screen: 'bike' | 'saying' | 'flat' | 'marmot' | 'weather' | 'panorama' | 'wait' (weather is loading) | null
  let wx = $state({ kind: 'none', text: '' }); // the weather on screen
  let night = $state(false); // the marmot sleeps at night instead of whistling
  let saying = $state(''); // the text of the saying on screen
  let fresh = $state(false); // the secret was found for the first time: the logo changes (Idee 30)
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
    fresh = unlockLogo(); // «Das Logo zieht sich der Jahreszeit an» (Idee 30): the first find turns the logo into the bike sign
    // the sayings only count while at least one is left (the person may have hidden them all in «Listen und Typen»)
    const id = pickSaying(sayingsOffered(), lastSaying);
    // the marmot only while its switch in Bedienung is on (Idee 28)
    const pool = SURPRISES.filter((s) => (s !== 'saying' || id) && (s !== 'marmot' || ops.murmeltier));
    kind = last = pickSurprise(pool, last);
    night = partOfDay(new Date().getHours()) === 'night';
    if (kind === 'saying') {
      lastSaying = id;
      saying = sayingText(id, t);
    }
    clearTimeout(timer);
    if (kind === 'weather') return showWeather();
    if (kind === 'flat') flatTyre(e.target.closest('.mark'));
    timer = setTimeout(() => (kind = null), kind === 'saying' ? 4600 : kind === 'flat' ? 4200 : kind === 'panorama' ? 4800 : 3200);
  }

  // the weather comes from the forecast Today keeps; a slow answer is not waited for longer than 1.5 s
  async function showWeather() {
    kind = 'wait'; // taps meanwhile do nothing
    const w = await Promise.race([loadLogoWeather(db), new Promise((r) => setTimeout(() => r(null), 1500))]);
    wx = w ?? { kind: 'none', text: t('No weather loaded.') };
    kind = 'weather';
    timer = setTimeout(() => (kind = null), 4200);
  }

  onMount(() => {
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('click', onClick);
      clearTimeout(timer);
    };
  });
</script>

{#if kind === 'marmot'}
  <div class="pg-marmot" role="status" aria-label={night ? t('Sleeping marmot') : t('Peeep!')} data-logo-marmot>
    <Murmeltier state={night ? 'sleep' : 'whistle'} size={150} say={night ? '' : t('Peeep!')} />
  </div>
{:else if kind === 'weather'}
  <LogoWeather {wx} />
{:else if kind === 'panorama'}
  <LogoPanorama />
{:else if kind === 'saying'}
  <LogoSaying text={saying} note={fresh ? t('New logo found: the bike sign. Change it in Me › Appearance.') : ''} />
{:else if kind === 'flat'}
  <LogoFlat note={fresh ? t('New logo found: the bike sign. Change it in Me › Appearance.') : ''} />
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
    <span class="say">{t('Have a good ride!')}{#if fresh}<small>{t('New logo found: the bike sign. Change it in Me › Appearance.')}</small>{/if}</span>
  </div>
{/if}

<style>
  .pg-marmot {
    position: fixed;
    z-index: 9000;
    bottom: env(safe-area-inset-bottom, 0px);
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
    line-height: 0;
  }
  @media (prefers-reduced-motion: no-preference) {
    .pg-marmot {
      animation: pg-marmot 3.2s ease-out forwards;
    }
  }
  @keyframes pg-marmot {
    0% {
      transform: translate(-50%, 100%);
    }
    18%,
    80% {
      transform: translate(-50%, 0);
    }
    100% {
      transform: translate(-50%, 100%);
    }
  }
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
    border-radius: 24px;
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
    display: grid;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink);
  }
  .say small {
    max-width: 190px;
    font-weight: 400;
    color: var(--ink-2);
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
