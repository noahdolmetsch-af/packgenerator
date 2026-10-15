<script>
  /**
   * «Mia sagt: 80.00 CHF per TWINT bezahlt» (mockup QR5, way A, Noah 14.10.2026 approved 04:00 «a»):
   * what payers reported through the invoice link. A quick look in the TWINT app or the bank, then
   * «Stimmt, bezahlt» (marks it paid; «+ Mail» also prepares the confirmation) or «Noch nicht da».
   * Shown nowhere when there is nothing to check. Reports of invoices already paid are cleared quietly.
   */
  import { t, tn } from '../i18n.svelte.js';
  import { Check, Mail, Landmark } from '@lucide/svelte';
  import { fetchReports, forgetReports, reportsForOpen } from './report.js';
  import { markPaid, readAccount, paidMail, mailtoHref } from './invoices.js';
  import { formatAmount } from './qrbill.js';

  /** invoices: the list now; onchange(): reload it */
  let { invoices, onchange } = $props();
  let reports = $state([]);
  let handled = $state([]);

  fetchReports().then((r) => (reports = r));
  const items = $derived(reportsForOpen(reports, invoices).filter((x) => !handled.includes(x.report.id)));
  // Reports of invoices that are paid or gone: nothing to ask, clear them on the server.
  $effect(() => {
    if (!reports.length || !invoices.length) return;
    const stale = reports.filter((r) => !handled.includes(r.id) && !invoices.some((x) => x.no === r.no && x.status === 'open')).map((r) => r.id);
    if (stale.length) {
      handled = [...handled, ...stale];
      forgetReports(stale);
    }
  });

  function ago(at) {
    const min = Math.max(0, Math.round((Date.now() / 1000 - at) / 60));
    if (min < 60) return tn(min, '{n} minute ago', '{n} minutes ago');
    const h = Math.round(min / 60);
    if (h < 48) return tn(h, '{n} hour ago', '{n} hours ago');
    return tn(Math.round(h / 24), '{n} day ago', '{n} days ago');
  }

  async function yes(x, mail = false) {
    await markPaid(x.inv.id, 'report');
    handled = [...handled, x.report.id];
    forgetReports([x.report.id]);
    onchange?.();
    if (mail) location.href = mailtoHref(x.inv.email, paidMail(x.inv, readAccount(), t));
  }
  function notYet(x) {
    handled = [...handled, x.report.id];
    forgetReports([x.report.id]);
  }
</script>

{#each items as x (x.report.id)}
  <section class="card prep" data-testid="pay-report" aria-label={t('{name} says: paid', { name: x.inv.name })}>
    <div class="prep-top">
      {#if x.report.way === 'twint'}<span class="prep-tw" aria-hidden="true">TWINT</span>{:else}<span class="prep-ib"><Landmark size={20} aria-hidden="true" /></span>{/if}
      <span>
        <b>{x.report.way === 'twint' ? t('{name} says: {amount} CHF paid with TWINT', { name: x.inv.name, amount: formatAmount(x.inv.amount) }) : t('{name} says: {amount} CHF paid by bank', { name: x.inv.name, amount: formatAmount(x.inv.amount) })}</b>
        <small>{x.inv.purpose} · {x.inv.no} · {ago(x.report.at)}</small>
      </span>
    </div>
    <div class="prep-btns">
      <button class="btn hi" type="button" onclick={() => yes(x)}><Check size={18} aria-hidden="true" />{t('Right, paid')}</button>
      {#if x.inv.email}<button class="btn" type="button" onclick={() => yes(x, true)}><Mail size={18} aria-hidden="true" />{t('Right + mail')}</button>{/if}
      <button class="btn" type="button" onclick={() => notYet(x)}>{t('Not there yet')}</button>
    </div>
    <p class="ich-fine">{x.report.way === 'twint' ? t('Take a quick look in your TWINT app, then one tap.') : t('Take a quick look in your e-banking, then one tap.')}</p>
  </section>
{/each}

<style>
  .prep {
    padding: 16px 18px;
    margin-bottom: 14px;
    max-width: 820px;
  }
  .prep-top {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .prep-top b {
    display: block;
    font-weight: 600;
  }
  .prep-top small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .prep-tw {
    display: grid;
    place-items: center;
    min-width: 38px;
    padding: 0 6px;
    letter-spacing: -0.02em;
    height: 38px;
    border-radius: 10px;
    background: var(--ink);
    color: var(--paper);
    font-weight: 800;
    font-size: var(--fs-small);
    flex: none;
  }
  .prep-ib {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: var(--paper-2);
    flex: none;
  }
  .prep-btns {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin: 12px 0 0;
  }
</style>
