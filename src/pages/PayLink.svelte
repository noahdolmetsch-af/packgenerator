<script>
  /**
   * The payer page (#/zahlen/<data>; mockup QR5, way A, Noah 14.10.2026 approved 04:00 «a»): the link
   * in an invoice opens it, no app or account needed. It shows how to pay (TWINT number and message,
   * or IBAN and reference) and «Ich habe bezahlt». The data sits in the link itself; the server only
   * gets { invoice number, way }.
   */
  import { t } from '../lib/i18n.svelte.js';
  import { Check, Landmark } from '@lucide/svelte';
  import { readLink, sendReport } from '../lib/pay/report.js';
  import { formatAmount, formatIban, formatReference } from '../lib/pay/qrbill.js';

  let { part = '' } = $props();
  const d = $derived(readLink(part));
  let sent = $state(''); // '' | 'busy' | 'twint' | 'qr' | 'error'

  async function report(way) {
    sent = 'busy';
    try {
      await sendReport(d.box, d.no, way);
      sent = way;
    } catch {
      sent = 'error';
    }
  }
</script>

<div class="ich-page plink">
  {#if !d}
    <h1>{t('Invoice')}</h1>
    <p class="ich-fine" role="alert">{t('This link is not complete. Please ask for the invoice again.')}</p>
  {:else}
    <p class="plink-from">{t('Invoice from {name}', { name: d.from })}</p>
    <h1>{d.purpose} · {formatAmount(d.amount)} CHF</h1>
    {#if d.twint}
      <div class="card plink-way">
        <span class="plink-tw" aria-hidden="true">TWINT</span>
        <span>{t('To|twint')} <b class="num">{d.twint}</b><br />{t('Message|twint')}: <b>{d.no}</b></span>
      </div>
    {/if}
    {#if d.iban}
      <div class="card plink-way">
        <span class="plink-ib"><Landmark size={20} aria-hidden="true" /></span>
        <span>IBAN <b class="num">{formatIban(d.iban)}</b>{#if d.ref}<br />{t('Reference')}: <b class="num">{formatReference(d.ref)}</b>{/if}</span>
      </div>
    {/if}
    {#if sent === 'twint' || sent === 'qr'}
      <p class="plink-done" role="status"><Check size={18} aria-hidden="true" /> {t('Thank you! {name} now knows. You get a confirmation once the money has arrived.', { name: d.from })}</p>
    {:else}
      <div class="plink-btns">
        {#if d.twint && d.iban}
          <button class="btn hi" type="button" disabled={sent === 'busy'} onclick={() => report('twint')}><Check size={18} aria-hidden="true" />{t('I have paid with TWINT')}</button>
          <button class="btn" type="button" disabled={sent === 'busy'} onclick={() => report('qr')}><Check size={18} aria-hidden="true" />{t('I have paid by bank')}</button>
        {:else}
          <button class="btn hi" type="button" disabled={sent === 'busy'} onclick={() => report(d.twint ? 'twint' : 'qr')}><Check size={18} aria-hidden="true" />{t('I have paid')}</button>
        {/if}
      </div>
      {#if sent === 'error'}<p class="plink-err" role="alert">{t('That did not work. Please tell {name} directly.', { name: d.from })}</p>{/if}
      <p class="ich-fine">{t('You get a confirmation once the money has arrived.')}</p>
    {/if}
  {/if}
</div>

<style>
  .plink {
    max-width: 620px;
  }
  .plink-from {
    color: var(--ink-3);
    margin: 8px 0 4px;
  }
  .plink-way {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 14px 16px;
    margin: 12px 0;
    overflow-wrap: break-word;
  }
  .plink-tw {
    display: grid;
    place-items: center;
    min-width: 44px;
    padding: 0 6px;
    letter-spacing: -0.02em;
    height: 44px;
    border-radius: 10px;
    background: var(--ink);
    color: var(--paper);
    font-weight: 800;
    font-size: var(--fs-small);
    flex: none;
  }
  .plink-ib {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: var(--paper-2);
    flex: none;
  }
  .plink-btns {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin: 16px 0 8px;
  }
  .plink-done {
    display: flex;
    gap: 8px;
    align-items: center;
    background: var(--ok-soft);
    border-radius: 14px;
    padding: 12px 16px;
    margin: 16px 0;
  }
  .plink-err {
    color: var(--bad);
    font-weight: 600;
  }
</style>
