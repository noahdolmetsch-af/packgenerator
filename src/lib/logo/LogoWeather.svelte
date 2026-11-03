<script>
  /**
   * «Logo-Wetter» (Noah 03.11.2026, H9 aus dem Geheimmenü): a speech bubble at the logo with a small drawing of the
   * weather (sun, rain cloud, snow) and the sentence of Today. wx: { kind, text } from wetter.js. LogoRide.svelte takes
   * it away after 4.2 s. With «reduce motion» nothing moves.
   */
  let { wx } = $props();
</script>

<div class="pg-wx {wx.kind}" role="status" data-logo-weather={wx.kind}>
  <span class="tail" aria-hidden="true"></span>
  <svg viewBox="0 0 48 40" width="48" height="40" aria-hidden="true">
    {#if wx.kind === 'rain' || wx.kind === 'snow'}
      {#if wx.kind === 'rain'}<g class="rb"><path d="M5 37a19 19 0 0 1 38 0" stroke="var(--bad)" /><path d="M8 37a16 16 0 0 1 32 0" stroke="var(--warn)" /><path d="M11 37a13 13 0 0 1 26 0" stroke="var(--ok)" /></g>{/if}
      <path class="cloud" d="M13 26a6 6 0 0 1 1-11.9A8 8 0 0 1 29 11a7 7 0 0 1 8 7 5 5 0 0 1-1 8z" />
      {#if wx.kind === 'rain'}
        <g class="drops"><path d="M16 29l-2 5M24 29l-2 5M32 29l-2 5" /></g>
      {:else}
        <g class="flakes"><circle cx="16" cy="32" r="1.6" /><circle cx="24" cy="35" r="1.6" /><circle cx="32" cy="32" r="1.6" /></g>
      {/if}
    {:else}
      <g class="sun"><circle cx="24" cy="20" r="8" /><path d="M24 6v4M24 30v4M10 20h4M34 20h4M14 10l3 3M31 27l3 3M34 10l-3 3M17 27l-3 3" /></g>
    {/if}
  </svg>
  <p>{wx.text}</p>
</div>

<style>
  .pg-wx {
    position: fixed;
    z-index: 9000;
    top: calc(env(safe-area-inset-top, 0px) + 58px);
    left: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: min(320px, calc(100vw - 24px));
    padding: 8px 14px 8px 10px;
    border-radius: 16px;
    background: var(--paper);
    color: var(--ink);
    box-shadow: 0 2px 14px var(--shadow);
    pointer-events: none;
  }
  p {
    margin: 0;
    font-size: var(--fs-small);
    font-weight: 600;
    line-height: 1.3;
    overflow-wrap: break-word;
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
  .sun {
    stroke: var(--warn);
    stroke-width: 2.4;
    transform-box: view-box;
    transform-origin: 24px 20px;
  }
  .sun circle {
    fill: var(--warn);
  }
  .cloud {
    fill: var(--paper-2, var(--paper));
    stroke: var(--ink-3);
    stroke-width: 2;
  }
  .drops path {
    stroke: var(--hi);
    stroke-width: 2.2;
  }
  .flakes circle {
    fill: var(--ink-3);
  }
  .rb {
    stroke-width: 2.4;
    opacity: 0;
  }
  @media (prefers-reduced-motion: no-preference) {
    .pg-wx {
      animation: pg-wx 4.2s ease-out forwards;
    }
    .sun {
      animation: pg-spin 8s linear infinite;
    }
    .drops path {
      animation: pg-fall 0.8s linear infinite;
    }
    .flakes {
      animation: pg-fall 1.6s linear infinite;
    }
    .rb {
      animation: pg-rb 4.2s ease-out forwards;
    }
  }
  @keyframes pg-wx {
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
  @keyframes pg-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes pg-fall {
    from {
      transform: translateY(-3px);
    }
    to {
      transform: translateY(3px);
    }
  }
  @keyframes pg-rb {
    0%,
    50% {
      opacity: 0;
    }
    75%,
    100% {
      opacity: 1;
    }
  }
  /* the rainbow only shows with «reduce motion» off: a still picture needs no end of the rain */
</style>
