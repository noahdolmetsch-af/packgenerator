<script>
  /**
   * What the payer sees (mockups QR1 + QR4, Noah 14.10.2026 04:00 «a»): TWINT first when it is on,
   * then the payment part of the Swiss QR bill. Black on white also in dark mode, like paper:
   * a phone camera reads that best. The same layout goes into the PDF (billpdf.js).
   */
  import { t } from '../i18n.svelte.js';
  import { qrMatrix, modulesPath, swissCross } from './qrmatrix.js';
  import { payload, formatIban, formatReference, formatAmount } from './qrbill.js';

  /** account: { iban, name, street, house, zip, town, twint }; bill: { no, name, amount, purpose, ref, refType, ways } */
  /** heading: the line above (the shop link shows its own) */
  let { account, bill, heading = null } = $props();

  const text = $derived(payload(account, { amount: bill.amount, ref: bill.ref, refType: bill.refType, message: [bill.purpose, bill.no].filter(Boolean).join(' · ') }));
  let code = $state(null);
  let failed = $state(false);
  $effect(() => {
    const value = text;
    let gone = false;
    qrMatrix(value)
      .then((m) => !gone && (code = { n: m.n, d: modulesPath(m), x: swissCross(m.n) }))
      .catch(() => !gone && (failed = true));
    return () => (gone = true);
  });
  const street = $derived([account.street, account.house].filter(Boolean).join(' '));
  const place = $derived([account.zip, account.town].filter(Boolean).join(' '));
</script>

<div class="bp" data-testid="bill-preview">
  <h3>{heading ?? t('This is what {name} sees in the invoice', { name: bill.name || t('the payer') })}</h3>
  {#if bill.ways?.twint && account.twint}
    <div class="bp-way">
      <span class="bp-twint" aria-hidden="true">TWINT</span>
      <span><b>{t('Pay with TWINT')}</b><br />{t('To')} <b>{account.twint}</b> · <b>{formatAmount(bill.amount)} CHF</b><br />{t('Message')}: <b>{bill.no}</b></span>
    </div>
  {/if}
  {#if bill.ways?.qr}
    <div class="bp-part">
      <div class="bp-title">{t('Payment part')} · {t('QR bill')}</div>
      <div class="bp-grid">
        {#if code}
          <svg class="bp-qr" viewBox="-1 -1 {code.n + 2} {code.n + 2}" role="img" aria-label={t('QR code of the bill')} shape-rendering="crispEdges">
            <rect x="-1" y="-1" width={code.n + 2} height={code.n + 2} fill="white" />
            <path d={code.d} fill="black" />
            <rect x={code.x.edge.x} y={code.x.edge.y} width={code.x.edge.w} height={code.x.edge.w} fill="white" />
            <rect x={code.x.box.x} y={code.x.box.y} width={code.x.box.w} height={code.x.box.w} fill="black" />
            <rect x={code.x.crossV.x} y={code.x.crossV.y} width={code.x.crossV.w} height={code.x.crossV.h} fill="white" />
            <rect x={code.x.crossH.x} y={code.x.crossH.y} width={code.x.crossH.w} height={code.x.crossH.h} fill="white" />
          </svg>
        {:else if failed}
          <p class="bp-miss">{t('The code could not be drawn.')}</p>
        {:else}
          <div class="bp-qr bp-wait" aria-hidden="true"></div>
        {/if}
        <dl>
          <dt>{t('Account / Payable to')}</dt>
          <dd>{formatIban(account.iban)}<br />{account.name}{#if street}<br />{street}{/if}{#if place}<br />{place}{/if}</dd>
          <dt>{t('Reference')}</dt>
          <dd>{bill.ref ? formatReference(bill.ref) : t('Made when you send it')}</dd>
          {#if bill.purpose}<dt>{t('Additional information')}</dt><dd>{bill.purpose} · {bill.no}</dd>{/if}
          <div class="bp-amt">
            <div><dt>{t('Currency')}</dt><dd>CHF</dd></div>
            <div><dt>{t('Amount|money')}</dt><dd>{formatAmount(bill.amount)}</dd></div>
          </div>
        </dl>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Theme colours like the rest of the app; the code itself stays black on white (own white field). */
  .bp {
    background: var(--paper);
    color: var(--ink);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: var(--fs-small);
  }
  h3 {
    margin: 0;
    font-size: var(--fs-label);
    font-weight: 600;
    padding-bottom: 8px;
    border-bottom: 1px dashed var(--line-strong);
  }
  .bp-way {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
    line-height: 1.45;
  }
  .bp-twint {
    display: inline-grid;
    place-items: center;
    min-width: 40px;
    height: 40px;
    padding: 0 6px;
    border-radius: 10px;
    background: var(--ink);
    color: var(--paper);
    font-weight: 800;
    font-size: var(--fs-small);
    flex: none;
  }
  .bp-part {
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 12px;
  }
  .bp-title {
    font-weight: 700;
    margin-bottom: 10px;
  }
  .bp-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 14px;
    align-items: start;
  }
  .bp-qr {
    width: 150px;
    height: 150px;
    display: block;
  }
  .bp-wait {
    background: var(--paper-2);
    border-radius: 6px;
  }
  .bp-miss {
    margin: 0;
    width: 150px;
    color: var(--ink-3);
  }
  dl {
    margin: 0;
    line-height: 1.4;
    min-width: 0;
    overflow-wrap: break-word;
  }
  dt {
    font-weight: 700;
    color: var(--ink-2);
    margin-top: 6px;
  }
  dt:first-child {
    margin-top: 0;
  }
  dd {
    margin: 0;
  }
  .bp-amt {
    display: flex;
    gap: 18px;
  }
  @media (max-width: 420px) {
    .bp-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
