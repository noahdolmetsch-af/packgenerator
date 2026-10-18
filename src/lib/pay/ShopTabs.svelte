<script>
  /**
   * «Produkte | Bestellungen» above the shop (mockups SHOP1 + SHOP3a), like «Rechnungen | Zu zahlen».
   * Bestellungen shows how many wait for Noah (to ship or to be paid).
   */
  import Seg from '../ui/Seg.svelte';
  import { t } from '../i18n.svelte.js';
  import { listOrders, ordersSummary } from './myshop.js';

  /** value: 'products' | 'orders'; refresh: changes when the orders changed */
  let { value, refresh = 0 } = $props();
  let n = $state(null);
  $effect(() => {
    refresh;
    listOrders().then((list) => {
      const s = ordersSummary(list);
      n = s.todo + s.open;
    });
  });
  const go = (k) => (location.hash = k === 'orders' ? '#/me/shop/orders' : '#/me/shop');
</script>

<div class="stabs">
  <Seg full={false} label={t('Shop')} {value} onchange={go} options={[{ key: 'products', name: t('Products') }, { key: 'orders', name: t('Orders'), n }]} />
</div>

<style>
  .stabs {
    margin: 0 0 16px;
  }
</style>
