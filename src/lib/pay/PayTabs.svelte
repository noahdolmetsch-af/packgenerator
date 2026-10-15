<script>
  /**
   * «Rechnungen | Zu zahlen» above both lists (mockup QR9, Noah 14.10.2026 05:10 «1a»: a tab next to
   * Rechnungen). Each shows how many are open. Switching goes to the other page.
   */
  import Seg from '../ui/Seg.svelte';
  import { t } from '../i18n.svelte.js';
  import { listInvoices, openSummary } from './invoices.js';
  import { listBills, billsSummary } from './bills.js';

  /** value: 'invoices' | 'bills'; refresh: changes when a list changed, so the numbers follow */
  let { value, refresh = 0 } = $props();
  let n = $state({ invoices: null, bills: null });
  $effect(() => {
    refresh;
    Promise.all([listInvoices(), listBills()]).then(([inv, bills]) => (n = { invoices: openSummary(inv).count, bills: billsSummary(bills).count }));
  });
  const go = (k) => (location.hash = k === 'bills' ? '#/me/pay/bills' : '#/me/pay/invoices');
</script>

<div class="ptabs">
  <Seg full={false} label={t('Payments')} {value} onchange={go} options={[{ key: 'invoices', name: t('Invoices'), n: n.invoices }, { key: 'bills', name: t('To pay'), n: n.bills }]} />
</div>

<style>
  .ptabs {
    margin: 0 0 16px;
  }
</style>
