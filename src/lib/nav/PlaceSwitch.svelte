<script>
  /**
   * AU1 «1b» (Noah 15.10.2026): on a phone Velos and Ausrüstung share one slot in the bottom bar; this
   * switch on top of both pages changes between them. On a computer each has its own row in the
   * sidebar, so the switch hides there.
   */
  import { t } from '../i18n.svelte.js';

  // N1 «Neue Leiste» (Noah 20.10.2026 «2a»): Material shares the slot of Velos too, so the switch has three ways.
  let { place } = $props();
</script>

<nav class="psw" aria-label={t('Bikes, equipment or gear')} data-place-switch>
  <a href="#/bikes" aria-current={place === 'bikes' ? 'page' : undefined}>{t('Bikes|place')}</a>
  <a href="#/equipment" aria-current={place === 'equipment' ? 'page' : undefined}>{t('Equipment|place')}</a>
  <a href="#/gear" aria-current={place === 'gear' ? 'page' : undefined}>{t('Gear|place')}</a>
</nav>

<style>
  .psw {
    display: none;
  }
  @media (max-width: 719px) {
    .psw {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 4px;
      margin: 0 0 var(--sp-3);
      padding: 4px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: var(--paper);
    }
  }
  a {
    display: grid;
    place-items: center;
    min-height: 44px;
    border-radius: 9px;
    color: var(--ink-2);
    font: 500 var(--fs-body) / 1.2 var(--font-body);
    text-decoration: none;
  }
  a[aria-current='page'] {
    background: var(--ink);
    color: var(--paper);
    font-weight: 600;
  }
</style>
