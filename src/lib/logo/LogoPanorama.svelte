<script>
  /**
   * «Alpenpanorama» (Noah 03.11.2026, H7 aus dem Geheimmenü): three rows of mountains pull through the picture from right
   * to left, the far ones slower than the near ones, with «Nice view!» in the middle. LogoRide.svelte takes it away
   * after 4.8 s. With «reduce motion» the mountains stand still at the bottom for the same time.
   */
  import { t } from '../i18n.svelte.js';
</script>

<div class="pg-pan" role="status" aria-label={t('Nice view!')} data-logo-panorama>
  <svg class="far" viewBox="0 0 1200 100" preserveAspectRatio="none" aria-hidden="true">
    <path class="r" d="M0 100V62L90 38L160 58L260 24L350 60L450 34L560 64L660 30L760 58L860 20L960 56L1070 36L1200 60V100Z" />
    <path class="snow" d="M240 36L260 24L282 38L268 33L258 40ZM642 40L660 30L680 42L666 38L656 44ZM842 32L860 20L880 34L866 29L856 36Z" />
  </svg>
  <svg class="mid" viewBox="0 0 1200 100" preserveAspectRatio="none" aria-hidden="true">
    <path class="r" d="M0 100V70L120 46L210 66L330 40L430 68L540 44L650 72L770 42L880 70L990 48L1100 68L1200 52V100Z" />
  </svg>
  <svg class="near" viewBox="0 0 1200 100" preserveAspectRatio="none" aria-hidden="true">
    <path class="r" d="M0 100V80L100 62L190 78L300 58L400 80L520 60L630 82L740 64L850 80L960 62L1080 82L1200 70V100Z" />
  </svg>
  <p>{t('Nice view!')}</p>
</div>

<style>
  .pg-pan {
    position: fixed;
    z-index: 9000;
    left: 0;
    right: 0;
    bottom: env(safe-area-inset-bottom, 0px);
    height: 120px;
    overflow: hidden;
    pointer-events: none;
  }
  svg {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    fill: none;
  }
  .far {
    height: 110px;
    color: var(--ink-3);
    opacity: 0.55;
  }
  .mid {
    height: 80px;
    color: var(--ink-2);
    opacity: 0.75;
  }
  .near {
    height: 52px;
    color: var(--accent);
  }
  .r {
    fill: currentColor;
  }
  .snow {
    fill: var(--paper);
  }
  p {
    position: absolute;
    top: 4px;
    left: 50%;
    transform: translateX(-50%);
    margin: 0;
    padding: 4px 14px;
    border-radius: 14px;
    background: var(--paper);
    color: var(--ink);
    box-shadow: 0 2px 10px var(--shadow);
    font-size: var(--fs-small);
    font-weight: 600;
    white-space: nowrap;
  }
  @media (prefers-reduced-motion: no-preference) {
    /* each row is wider than the screen and pulls through it: the far one covers the shortest way, so it looks slower */
    svg {
      left: 100vw;
      width: 170vw;
      animation: pg-pan-far 4.8s linear forwards;
    }
    .mid {
      width: 220vw;
      animation-name: pg-pan-mid;
    }
    .near {
      width: 290vw;
      animation-name: pg-pan-near;
    }
    p {
      animation: pg-pan-text 4.8s ease-out forwards;
    }
  }
  @keyframes pg-pan-far {
    to {
      transform: translateX(-270vw);
    }
  }
  @keyframes pg-pan-mid {
    to {
      transform: translateX(-320vw);
    }
  }
  @keyframes pg-pan-near {
    to {
      transform: translateX(-390vw);
    }
  }
  @keyframes pg-pan-text {
    0%,
    10% {
      opacity: 0;
    }
    25%,
    80% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
</style>
