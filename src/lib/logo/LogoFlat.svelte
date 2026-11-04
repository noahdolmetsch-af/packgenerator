<script>
  /**
   * «Platten im Logo» (Noah 03.11.2026, H8 aus dem Geheimmenü): the «PG» mark gets a flat tyre (LogoRide.svelte squashes
   * the mark itself), and this bubble beside it says «Pssssst …» and «Lucky it's only in the logo.». LogoRide.svelte
   * takes it away again after 4.2 s. With «reduce motion» it just stands there, without fading.
   */
  import { t } from '../i18n.svelte.js';
</script>

<div class="pg-flat" role="status" data-logo-flat>
  <span class="tail" aria-hidden="true"></span>
  <p class="psst">{t('Pssssst …')}</p>
  <p>{t('Lucky it is only in the logo.')}</p>
</div>

<style>
  .pg-flat {
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
  .psst {
    color: var(--accent);
    letter-spacing: 0.04em;
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
    .pg-flat {
      animation: pg-flat 4.2s ease-out forwards;
    }
  }
  @keyframes pg-flat {
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
