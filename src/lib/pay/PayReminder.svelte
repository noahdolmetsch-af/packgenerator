<script>
  /**
   * The Sunday card (mockup QR8, Noah 14.10.2026 04:00 «a», way D): from Sunday 18:00, while invoices
   * are open and no bank statement was checked since, a quiet card asks to check the payments.
   * «Später» hides it for today; the switch lives under Ich › Bezahlen › Rechnungen.
   * Shown nowhere when nothing is due, so it can sit on Heute without taking room.
   */
  import { t, tn } from '../i18n.svelte.js';
  import { Bell, Landmark } from '@lucide/svelte';
  import { listInvoices, openSummary, readReminder, writeReminder, reminderDue } from './invoices.js';
  import { formatAmount } from './qrbill.js';
  import { localDay } from '../localday.js';

  let due = $state(false);
  let sum = $state({ count: 0, sum: 0 });
  Promise.all([listInvoices(), readReminder()]).then(([list, rem]) => {
    sum = openSummary(list);
    due = reminderDue(rem, sum.count);
  });

  async function later() {
    await writeReminder({ snoozedDay: localDay() });
    due = false;
  }
</script>

{#if due}
  <section class="card prm" aria-labelledby="prm-h" data-testid="pay-reminder">
    <div class="prm-top">
      <span class="prm-ib"><Bell size={20} aria-hidden="true" /></span>
      <span><b id="prm-h">{t('Sunday: check payments')}</b><small>{tn(sum.count, '{n} invoice open', '{n} invoices open')} · {formatAmount(sum.sum)} CHF</small></span>
    </div>
    <div class="prm-btns">
      <a class="btn hi" href="#/me/pay/invoices"><Landmark size={18} aria-hidden="true" />{t('Upload a bank statement')}</a>
      <button class="btn" type="button" onclick={later}>{t('Later')}</button>
    </div>
  </section>
{/if}

<style>
  .prm {
    padding: 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .prm-top {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .prm-top b {
    display: block;
    font-weight: 600;
  }
  .prm-top small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .prm-ib {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: var(--paper-2);
    display: grid;
    place-items: center;
    flex: none;
  }
  .prm-btns {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
</style>
