<script>
  /**
   * The reminder card for bills to pay (mockup QR9, Noah 14.10.2026 05:10 «1-4a», «a»): from the reminder
   * day (3 days before the due date unless changed) until it is paid. «Bezahlt» marks it, «Zahlteil»
   * opens it under Ich › Bezahlen › Zu zahlen, «Später» hides it for today. Hidden when nothing
   * is due; otherwise it sits on top of Ich › Bezahlen (not on Heute, Noah 15.10.2026 21:07 «4b»). One card: the most urgent bill.
   */
  import { t, tn, dateOf } from '../i18n.svelte.js';
  import { Bell, Check, QrCode } from '@lucide/svelte';
  import { listBills, billsToRemind, daysLeft, markBillPaid, snoozeBill } from './bills.js';
  import { formatAmount } from './qrbill.js';

  let due = $state([]);
  const load = () => listBills().then((list) => (due = billsToRemind(list)));
  load();
  const b = $derived(due[0]);
  const title = $derived(b ? (daysLeft(b) < 0 ? t('Bill overdue') : daysLeft(b) === 0 ? t('Bill due today') : tn(daysLeft(b), 'Bill due in {n} day', 'Bill due in {n} days')) : '');

  async function paid() {
    await markBillPaid(b.id);
    await load();
  }
  async function later() {
    await snoozeBill(b.id);
    await load();
  }
</script>

{#if b}
  <section class="card brm" aria-labelledby="brm-h" data-testid="bill-reminder">
    <div class="brm-top">
      <span class="brm-ib"><Bell size={20} aria-hidden="true" /></span>
      <span><b id="brm-h">{title}</b><small>{b.to} · {formatAmount(b.amount)} CHF · {dateOf(b.due)}{#if due.length > 1} · {t('{n} more', { n: due.length - 1 })}{/if}</small></span>
    </div>
    <div class="brm-btns">
      <button class="btn hi" type="button" onclick={paid}><Check size={18} aria-hidden="true" />{t('Paid')}</button>
      <a class="btn" href="#/me/pay/bills"><QrCode size={18} aria-hidden="true" />{t('Payment part')}</a>
      <button class="btn" type="button" onclick={later}>{t('Later')}</button>
    </div>
  </section>
{/if}

<style>
  .brm {
    padding: 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .brm-top {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .brm-top b {
    display: block;
    font-weight: 600;
  }
  .brm-top small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .brm-ib {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: var(--warn-soft);
    color: var(--warn);
    display: grid;
    place-items: center;
    flex: none;
  }
  .brm-btns {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
</style>
