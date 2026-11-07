<script>
  // Etappe 6 (Noah 06.11.2026 «3a»): the first stop for the keyboard. Tab shows «Zum Inhalt springen»; Enter moves the focus
  // to the page. A button and no link, because a link to «#main» would change the address (the app routes on the hash).
  import { t } from '../i18n.svelte.js';

  function go() {
    const main = document.querySelector('main');
    if (!main) return;
    if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
    main.focus({ preventScroll: false });
    main.scrollIntoView({ block: 'start' });
  }
</script>

<button type="button" class="skip" data-skip onclick={go}>{t('Skip to content')}</button>

<style>
  .skip {
    position: fixed;
    top: env(safe-area-inset-top, 0px);
    left: 8px;
    z-index: 1000;
    transform: translateY(-200%);
    padding: 10px 16px;
    border: 2px solid var(--ink);
    border-radius: 0 0 10px 10px;
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-body)/1.2 var(--font-body);
    cursor: pointer;
  }
  .skip:focus {
    transform: translateY(0);
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
  @media (prefers-reduced-motion: no-preference) {
    .skip {
      transition: transform 0.12s ease-out;
    }
  }
</style>
