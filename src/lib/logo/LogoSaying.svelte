<script>
  /**
   * «Velo-Weisheit» (Noah 03.11.2026, H6 aus dem Geheimmenü): a speech bubble at the logo with one short saying.
   * text: the saying as it is shown. LogoRide.svelte takes it away again after 4.6 s. With «reduce motion» it just
   * stands there, without fading.
   */
  let { text, note = '' } = $props(); // note: a second, quieter line (e.g. «New logo found»)
</script>

<div class="pg-saying" role="status" data-logo-saying>
  <span class="tail" aria-hidden="true"></span>
  <p>«{text}»</p>
  {#if note}<small>{note}</small>{/if}
</div>

<style>
  .pg-saying {
    position: fixed;
    z-index: 9000;
    top: calc(env(safe-area-inset-top, 0px) + 58px);
    left: 12px;
    max-width: min(300px, calc(100vw - 24px));
    padding: 10px 14px;
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
    line-height: 1.35;
    overflow-wrap: break-word;
  }
  small {
    display: block;
    margin-top: 4px;
    font-size: var(--fs-small);
    color: var(--ink-2);
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
  @media (prefers-reduced-motion: no-preference) {
    .pg-saying {
      animation: pg-saying 4.6s ease-out forwards;
    }
  }
  @keyframes pg-saying {
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
</style>
