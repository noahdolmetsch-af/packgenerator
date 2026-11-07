<script>
  /**
   * Bereich «Tennis» (Noah 05.11.2026 «ok Mockup», Mockup «Bereich Tennis mit Flyer»): one row of tabs on top of
   * the offers and the customers, so the booking work is one place. Later pieces add «Flyer» and «Sign-ups».
   * The old addresses #/me/offers and #/me/offers/customers keep working and show the same pages.
   */
  import Seg from '../ui/Seg.svelte';
  import { t } from '../i18n.svelte.js';

  let { current = 'offers' } = $props();
  const options = $derived([
    { key: 'offers', name: t('Offers') },
    { key: 'customers', name: t('Customers') },
  ]);
  function go(key) {
    location.hash = key === 'customers' ? '#/me/tennis/customers' : '#/me/tennis';
  }
</script>

<nav class="tennis-tabs" aria-label={t('Tennis')} data-tennis-tabs>
  <Seg {options} value={current} onchange={go} label={t('Tennis')} />
</nav>

<style>
  .tennis-tabs { margin: 0 0 16px; }
</style>
