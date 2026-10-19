<script>
  /**
   * Ich › Bezahlen › Rechnungen (#/me/pay/invoices; mockups QR2 + QR7, Noah 14.10.2026 04:00 «a»;
   * place 03:39 «1a»). The list of invoices, open and paid. By hand: «Bezahlt» only marks,
   * «Bezahlt + Mail» also prepares the confirmation in the mail program (03:39 «2a und b»).
   * «Geld erhalten»: type the amount, tap the open invoice with exactly that amount (way C, 03:52).
   * Everything can be undone («Wieder offen»).
   * Step 1b (mockups QR2 + QR3 + QR8): beside the list «Zahlungen erkennen»: a bill from the e-banking
   * (picture with the QR code) goes into the list; a bank statement (camt) marks the payments it
   * recognises and shows the result («Kontoauszug geprüft») in place of the list.
   */
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import { t, tn, dateOf } from '../lib/i18n.svelte.js';
  import { Plus, Check, Mail, HandCoins, RotateCcw, ChevronRight } from '@lucide/svelte';
  import { listInvoices, markPaid, markOpen, openWithAmount, openSummary, readAccount, paidMail, mailtoHref, createInvoice } from '../lib/pay/invoices.js';
  import { formatAmount, parseAmount, formatIban, formatReference } from '../lib/pay/qrbill.js';
  import PayDetect from '../lib/pay/PayDetect.svelte';
  import StatementResult from '../lib/pay/StatementResult.svelte';
  import PayTabs from '../lib/pay/PayTabs.svelte';
  import PayReports from '../lib/pay/PayReports.svelte';
  import ShotResult from '../lib/pay/ShotResult.svelte';
  import '../lib/ich/ich.css';

  let list = $state([]);
  let loaded = $state(false);
  let tab = $state('all');
  let receiving = $state(false);
  let got = $state('');
  let done = $state(''); // one line after an action
  let check = $state(null); // { payments, file, invoices } while a statement result shows
  let qrBill = $state(null); // a bill read from the e-banking, before it goes into the list
  let qrForm = $state({ name: '', purpose: '', amount: '' });

  async function load() {
    list = await listInvoices();
    loaded = true;
  }
  load();

  // A TWINT screenshot (mockup QR6): chosen here under «Recognise payments» (Noah 19.10.2026 «2b»: sharing a
  // picture goes to Dokumente), read on the phone; ShotResult suggests the paid invoice.
  let shot = $state(null);
  function onshot(file) {
    done = '';
    shot = file;
    window.scrollTo?.(0, 0);
  }

  const sum = $derived(openSummary(list));
  const paidCount = $derived(list.filter((x) => x.status === 'paid').length);
  const shown = $derived(tab === 'open' ? list.filter((x) => x.status === 'open') : tab === 'paid' ? list.filter((x) => x.status === 'paid') : list);
  const gotCents = $derived(parseAmount(got));
  const matches = $derived(gotCents ? openWithAmount(list, gotCents) : []);

  async function paid(inv, via = 'hand') {
    await markPaid(inv.id, via);
    done = t('{no} is marked as paid.', { no: inv.no });
    await load();
  }
  async function paidAndMail(inv) {
    await paid(inv);
    location.href = mailtoHref(inv.email, paidMail(inv, readAccount(), t));
  }
  async function reopen(inv) {
    await markOpen(inv.id);
    done = t('{no} is open again.', { no: inv.no });
    await load();
  }
  function onstatement({ payments, file }) {
    done = '';
    check = { payments, file, invoices: $state.snapshot(list) };
    window.scrollTo?.(0, 0);
  }
  function onqr(bill) {
    done = '';
    qrBill = bill;
    qrForm = { name: bill.debtor, purpose: bill.message, amount: bill.amount ? formatAmount(bill.amount) : '' };
  }
  let qrError = $state('');
  async function addQrBill() {
    const amount = parseAmount(qrForm.amount);
    if (!qrForm.name.trim()) return (qrError = t('Please enter who the invoice is for.'));
    if (!amount) return (qrError = t('Please enter an amount, for example 80.00.'));
    const inv = await createInvoice({ name: qrForm.name, amount, purpose: qrForm.purpose || t('Bill from the e-banking'), ref: qrBill.ref, refType: qrBill.refType, ways: { qr: true, twint: false } }, readAccount());
    qrBill = null;
    qrError = '';
    done = t('{no} is in the list.', { no: inv.no });
    await load();
  }

  async function pick(inv) {
    await paid(inv, 'amount');
    got = '';
    receiving = false;
  }
</script>

<div class="ich-page invs">
  <VeloHead
    crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Payments'), href: '#/me/pay' }]}
    here={check ? t('Bank statement checked') : ''}
    title={check ? t('Bank statement checked') : t('Invoices')}
    sub={check ? tn(check.payments.length, '{file} · {n} booking read', '{file} · {n} bookings read', { file: check.file }) : loaded ? (list.length ? `${tn(sum.count, '{n} open', '{n} open')} · ${t('{amount} CHF outstanding', { amount: formatAmount(sum.sum) })}` : t('No invoices yet.')) : ''}
  >
    {#if !check}
      <a class="btn hi" href="#/me/pay/invoices/new"><Plus size={18} aria-hidden="true" />{t('New QR invoice')}</a>
      <button class="btn" type="button" aria-expanded={receiving} onclick={() => (receiving = !receiving)}><HandCoins size={18} aria-hidden="true" />{t('Money received')}</button>
    {/if}
  </VeloHead>

  {#if !check}<PayTabs value="invoices" refresh={list} />{/if}

  {#if check}
    <StatementResult payments={check.payments} invoices={check.invoices} onchange={load} ondone={() => (check = null)} />
  {:else}

  {#if receiving}
    <section class="card invs-got" aria-labelledby="got-h">
      <h2 id="got-h" class="invs-h">{t('Money received')}</h2>
      <label class="field"><span class="lbl">{t('How much has arrived?')}</span><input class="inp num invs-big" bind:value={got} inputmode="decimal" placeholder="80.00" /></label>
      {#if gotCents}
        {#if matches.length}
          <p class="invs-sub">{tn(matches.length, 'Open invoice of {amount} CHF', 'Open invoices of {amount} CHF', { amount: formatAmount(gotCents) })}</p>
          <ul class="ich-list card invs-in">
            {#each matches as m (m.id)}
              <li class="ich-row">
                <span class="ich-m"><b>{m.name}</b><small>{m.purpose} · <span class="nw">{m.no}</span> · <span class="nw">{dateOf(m.createdAt)}</span></small></span>
                <button class="btn sm" type="button" onclick={() => pick(m)}><Check size={16} aria-hidden="true" />{t('This one')}</button>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="ich-fine">{t('No open invoice has exactly this amount. Mark the right one by hand below.')}</p>
        {/if}
      {/if}
    </section>
  {/if}

  {#if qrBill}
    <section class="card invs-got" aria-labelledby="qr-h">
      <h2 id="qr-h" class="invs-h">{t('Bill from the e-banking')}</h2>
      <p class="ich-fine">{t('Payable to')}: <b>{qrBill.name}</b> · {formatIban(qrBill.iban)}{#if qrBill.ref}{' · '}{t('Reference')}: {formatReference(qrBill.ref)}{/if}</p>
      <label class="field"><span class="lbl">{t('For whom?')}</span><input class="inp" bind:value={qrForm.name} /></label>
      <label class="field"><span class="lbl">{t('Amount|money')}</span><input class="inp num" bind:value={qrForm.amount} inputmode="decimal" /></label>
      <label class="field"><span class="lbl">{t('What for?')}</span><input class="inp" bind:value={qrForm.purpose} /></label>
      {#if qrError}<p class="invs-err" role="alert">{qrError}</p>{/if}
      <div class="invs-btns">
        <button class="btn hi" type="button" onclick={addQrBill}>{t('Add to the list')}</button>
        <button class="btn" type="button" onclick={() => (qrBill = null)}>{t('Cancel')}</button>
      </div>
    </section>
  {/if}

  <div class="invs-two">
    <div class="invs-main">
      {#if done}<p class="invs-done" role="status">{done}</p>{/if}
      {#if shot && loaded}{#key shot}<ShotResult file={shot} invoices={list} onchange={load} ondone={(line) => ((shot = null), (done = line))} />{/key}{/if}
      {#if loaded}<PayReports invoices={list} onchange={load} />{/if}

      {#if list.length}
        <div class="invs-tabs">
          <Seg full={false} label={t('Show')} value={tab} onchange={(v) => (tab = v)} options={[{ key: 'all', name: t('All') }, { key: 'open', name: t('Open|invoices'), n: sum.count }, { key: 'paid', name: t('Paid'), n: paidCount }]} />
        </div>
        <ul class="card ich-list invs-list">
          {#each shown as inv (inv.id)}
            <li class="invs-row" data-testid="invoice-row">
              <a class="invs-who" href="#/me/pay/invoices/{encodeURIComponent(inv.id)}">
                <b>{inv.name}</b><small>{inv.purpose} · <span class="nw">{inv.no}</span> · <span class="nw">{dateOf(inv.createdAt)}</span></small>
              </a>
              <span class="num invs-amt">{formatAmount(inv.amount)} CHF</span>
              {#if inv.status === 'open'}
                <span class="invs-acts">
                  <button class="btn sm" type="button" onclick={() => paid(inv)}><Check size={16} aria-hidden="true" />{t('Paid')}</button>
                  <button class="btn sm" type="button" onclick={() => paidAndMail(inv)}><Mail size={16} aria-hidden="true" />{t('Paid + mail')}</button>
                </span>
              {:else}
                <span class="invs-acts">
                  <span class="pill ok">{t('paid|invoice')}</span>
                  <button class="btn btn-link sm" type="button" onclick={() => reopen(inv)} aria-label={t('Open {no} again', { no: inv.no })}><RotateCcw size={15} aria-hidden="true" />{t('Open again')}</button>
                </span>
              {/if}
            </li>
          {/each}
        </ul>
        <p class="ich-fine">{t('By hand: «Paid» only marks it. «Paid + mail» also prepares the confirmation for you to send.')}</p>
      {:else if loaded}
        <a class="card ich-row invs-empty" href="#/me/pay/invoices/new">
          <span class="ich-m"><b>{t('Write your first QR invoice')}</b><small>{t('With TWINT and the bank QR code. Free, nobody in between.')}</small></span>
          <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
        </a>
      {/if}
    </div>
    <PayDetect {onstatement} {onqr} {onshot} />
  </div>
  {/if}
</div>

<style>
  .invs-h {
    margin: 0 0 10px;
    font-size: var(--fs-sub);
  }
  .invs-got {
    padding: 18px 20px;
    margin-bottom: 16px;
    max-width: 620px;
  }
  .invs-big {
    font-size: var(--fs-sub);
    font-weight: 600;
  }
  .invs-sub {
    margin: 12px 0 8px;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-3);
  }
  .invs-in {
    box-shadow: none;
    border: 1px solid var(--line);
  }
  .invs-done {
    margin: 0 0 12px;
    color: var(--ok);
    font-weight: 600;
  }
  .invs-tabs {
    margin-bottom: 12px;
  }
  .invs-list {
    max-width: 820px;
  }
  .invs-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 6px 14px;
    align-items: center;
    padding: 12px 16px;
  }
  .invs-who {
    display: flex;
    flex-direction: column;
    min-width: 0;
    color: inherit;
    text-decoration: none;
  }
  .invs-who b {
    font-weight: 600;
  }
  .invs-who small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .invs-amt {
    font-weight: 600;
    white-space: nowrap;
    text-align: right;
  }
  .invs-acts {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  @media (max-width: 600px) {
    .invs-row {
      grid-template-columns: minmax(0, 1fr) auto;
    }
    .invs-acts {
      grid-column: 1 / -1;
      justify-content: flex-start;
    }
  }
  .invs-two {
    display: grid;
    grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
    gap: 24px;
    align-items: start;
  }
  @media (max-width: 1099px) {
    .invs-two {
      grid-template-columns: 1fr;
    }
  }
  .invs-main {
    min-width: 0;
  }
  .invs-err {
    margin: 0 0 10px;
    color: var(--bad);
    font-weight: 600;
  }
  .invs-btns {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .invs-empty {
    max-width: 620px;
  }
  /* 0.136.0: the invoice number and the date never break inside («R-0003») */
  .nw {
    white-space: nowrap;
  }
</style>
