<script>
  /**
   * «Kuhglocken» (Noah 03.11.2026, H1 aus dem Geheimmenü): two cow bells swing at the logo and say «Ding, dong, ding!».
   * The sound is rung by LogoRide.svelte, and only when the switch «Cow bells» is on (`sound`); otherwise a quiet line
   * tells where to switch it on. LogoRide.svelte takes it away after 3.8 s. With «reduce motion» the bells hang still.
   */
  import { t } from '../i18n.svelte.js';
  let { sound = false } = $props();
</script>

<div class="pg-bells" role="status" data-logo-bells={sound ? 'sound' : 'quiet'}>
  <span class="tail" aria-hidden="true"></span>
  <div class="row">
    <svg viewBox="0 0 70 46" width="70" height="46" aria-hidden="true">
      <g class="bell b1"><path class="strap" d="M16 2v8" /><path class="body" d="M7 34c0-9 3-18 9-18s9 9 9 18z" /><circle class="clap" cx="16" cy="38" r="2.4" /></g>
      <g class="bell b2"><path class="strap" d="M50 2v8" /><path class="body" d="M42 36c0-8 3-16 8-16s8 8 8 16z" /><circle class="clap" cx="50" cy="40" r="2.2" /></g>
    </svg>
    <p>{t('Ding, dong, ding!')}</p>
  </div>
  {#if !sound}<small>{t('Want to hear it? Switch on «Cow bells» in Me › Appearance › Handling.')}</small>{/if}
</div>

<style>
  .pg-bells {
    position: fixed;
    z-index: 9000;
    top: calc(env(safe-area-inset-top, 0px) + 58px);
    left: 12px;
    max-width: min(300px, calc(100vw - 24px));
    padding: 8px 14px 8px 10px;
    border-radius: 16px;
    background: var(--paper);
    color: var(--ink);
    box-shadow: 0 2px 14px var(--shadow);
    pointer-events: none;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  p {
    margin: 0;
    font-size: var(--fs-small);
    font-weight: 600;
    line-height: 1.3;
    overflow-wrap: break-word;
  }
  small {
    display: block;
    margin-top: 4px;
    font-size: var(--fs-small);
    color: var(--ink-2);
    line-height: 1.3;
  }
  .tail {
    position: absolute;
    top: -7px;
    left: 22px;
    width: 14px;
    height: 14px;
    background: var(--paper);
    transform: rotate(45deg);
    border-radius: 3px;
  }
  svg {
    flex: none;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .strap {
    stroke: var(--accent);
    stroke-width: 2.4;
  }
  .body {
    fill: var(--warn);
    stroke: var(--ink-3);
    stroke-width: 1.6;
  }
  .clap {
    fill: var(--ink-3);
  }
  .bell {
    transform-box: view-box;
  }
  .b1 {
    transform-origin: 16px 2px;
  }
  .b2 {
    transform-origin: 50px 2px;
  }
  @media (prefers-reduced-motion: no-preference) {
    .pg-bells {
      animation: pg-bells 3.8s ease-out forwards;
    }
    .b1 {
      animation: pg-swing 0.62s ease-in-out infinite alternate;
    }
    .b2 {
      animation: pg-swing 0.6s ease-in-out infinite alternate-reverse;
    }
  }
  @keyframes pg-bells {
    0% {
      opacity: 0;
      transform: translateY(-6px);
    }
    8%,
    88% {
      opacity: 1;
      transform: translateY(0);
    }
    100% {
      opacity: 0;
    }
  }
  @keyframes pg-swing {
    from {
      transform: rotate(-16deg);
    }
    to {
      transform: rotate(16deg);
    }
  }
</style>
