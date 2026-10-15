<script>
  /**
   * Ich › Bezahlen › Rechnungen › Neue Rechnung (mockups QR1 + QR4, Noah 14.10.2026 04:00 «a»).
   * The app makes a Swiss QR bill from the account on this device, with TWINT as a second way to pay
   * (on by default, Noah 03:43 «1a mit auswahlmöglichkeit»; every way can be switched off per invoice).
   * Sending: «Per E-Mail senden» opens the mail program; «PDF teilen» makes the PDF on the device.
   * #/me/pay/invoices/new = new; #/me/pay/invoices/<id> = an invoice already made (send again).
   * The account is asked for once and stays only on this device.
   */
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import BillPreview from '../lib/pay/BillPreview.svelte';
  import { t } from '../lib/i18n.svelte.js';
  import { Landmark, Mail, Share2, Pencil, Link } from '@lucide/svelte';
  import { readKey, boxOf, payLink } from '../lib/pay/report.js';
  import { readAccount, writeAccount, createInvoice, listInvoices, formatTwint, invoiceMail, mailtoHref } from '../lib/pay/invoices.js';
  import { accountProblems, cleanIban, formatIban, parseAmount, referenceFor } from '../lib/pay/qrbill.js';
  import { invoicePdf } from '../lib/pay/billpdf.js';
  import { localDay } from '../lib/localday.js';
  import '../lib/ich/ich.css';

  const LIST = '#/me/pay/invoices';
  const idInHash = () => {
    const m = location.hash.match(/^#\/me\/pay\/invoices\/([^/?]+)/);
    return m && m[1] !== 'new' ? decodeURIComponent(m[1]) : null;
  };

  const first = readAccount();
  let account = $state(first);
  let editAcc = $state(!first || accountProblems(first).length > 0);
  let acc = $state({ iban: '', name: '', street: '', house: '', zip: '', town: '', twint: '', ...(first ?? {}) });
  let accError = $state('');

  let viewId = $state(idInHash());
  let saved = $state(null); // the invoice once made (or opened)
  let form = $state({ name: '', email: '', amount: '', purpose: '', qr: true, twint: true });
  let formError = $state('');
  let busy = $state(false);
  let note = $state('');

  $effect(() => {
    const on = () => {
      viewId = idInHash();
      if (!viewId) {
        saved = null;
        note = '';
        form = { name: '', email: '', amount: '', purpose: '', qr: true, twint: true };
      }
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  });
  $effect(() => {
    const id = viewId;
    if (!id) return;
    listInvoices().then((list) => (saved = list.find((x) => x.id === id) ?? null));
  });

  function saveAccount(e) {
    e?.preventDefault();
    const twint = acc.twint.trim() ? formatTwint(acc.twint) : '';
    const next = { iban: formatIban(cleanIban(acc.iban)), name: acc.name.trim(), street: acc.street.trim(), house: acc.house.trim(), zip: acc.zip.trim(), town: acc.town.trim(), twint };
    const p = accountProblems(next);
    if (p.includes('iban')) return (accError = t('This IBAN is not right. Please check it (CH or LI, 21 characters).'));
    if (p.includes('name')) return (accError = t('Please enter the name the bill is payable to.'));
    if (p.includes('town')) return (accError = t('Please enter postcode and town.'));
    if (acc.twint.trim() && !twint) return (accError = t('This TWINT number is not right. Please enter a Swiss mobile number.'));
    writeAccount(next);
    account = next;
    acc = { ...next };
    accError = '';
    editAcc = false;
  }

  const amount = $derived(parseAmount(form.amount));
  const ways = $derived({ qr: form.qr, twint: form.twint && !!account?.twint });
  /** What the preview shows before saving: the next number is only known when saved, so «R-…». */
  const draft = $derived(
    saved ?? {
      no: 'R-…',
      name: form.name.trim(),
      amount: amount ?? 0,
      purpose: form.purpose.trim(),
      ref: '',
      refType: referenceFor(account?.iban ?? '', '0').type,
      ways,
      createdAt: localDay(),
    },
  );

  async function make() {
    formError = '';
    if (!form.name.trim()) return (formError = t('Please enter who the invoice is for.'));
    if (!amount) return (formError = t('Please enter an amount, for example 80.00.'));
    if (!form.purpose.trim()) return (formError = t('Please enter what it is for.'));
    if (!ways.qr && !ways.twint) return (formError = t('Switch on at least one way to pay.'));
    if (saved) return saved;
    busy = true;
    try {
      saved = await createInvoice({ name: form.name, email: form.email, amount, purpose: form.purpose, ways }, account);
      history.replaceState(null, '', `#/me/pay/invoices/${encodeURIComponent(saved.id)}`);
      return saved;
    } finally {
      busy = false;
    }
  }

  async function sendMail() {
    const inv = saved ?? (await make());
    if (!inv) return;
    location.href = mailtoHref(inv.email, invoiceMail(inv, account, t, await linkOf(inv)));
    note = inv.ways.qr ? t('Your mail program opens. Attach the PDF from «Share PDF» if the person wants to pay by bank.') : t('Your mail program opens with the invoice text.');
  }

  /** The payer page with «Ich habe bezahlt» (mockup QR5); empty when this device cannot keep a key. */
  async function linkOf(inv) {
    const key = readKey();
    return key ? payLink(inv, account, await boxOf(key)) : '';
  }
  async function copyLink() {
    const inv = saved ?? (await make());
    if (!inv) return;
    const link = await linkOf(inv);
    try {
      await navigator.clipboard.writeText(link);
      note = t('Link copied. Send it with WhatsApp or SMS: the person sees how to pay and can tap «I have paid».');
    } catch {
      note = link;
    }
  }

  async function sharePdf() {
    const inv = saved ?? (await make());
    if (!inv) return;
    busy = true;
    try {
      const file = await invoicePdf(account, inv, t);
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: file.name }).catch(() => {});
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(file);
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        note = t('The PDF is saved in your downloads.');
      }
    } finally {
      busy = false;
    }
  }
</script>

<div class="ich-page inv-new">
  <VeloHead
    crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Payments'), href: '#/me/pay' }, { label: t('Invoices'), href: LIST }]}
    title={saved ? t('Invoice {no}', { no: saved.no }) : t('New invoice')}
    sub={t('Made from your account, free. The person pays the way they like.')}
  />

  {#if viewId && !saved}
    <p class="ich-fine">{t('This invoice was not found.')} <a href={LIST}>{t('To the invoices')}</a></p>
  {:else if editAcc}
    <form class="card inv-card" onsubmit={saveAccount} aria-labelledby="acc-h">
      <h2 id="acc-h">{t('Your account, once')}</h2>
      <p class="ich-fine">{t('Stays only on this device: not in the backup file, not online.')}</p>
      <label class="field"><span class="lbl">IBAN</span><input class="inp" bind:value={acc.iban} autocomplete="off" placeholder="CH.. .... .... .... .... ." /></label>
      <label class="field"><span class="lbl">{t('Payable to (name)')}</span><input class="inp" bind:value={acc.name} autocomplete="name" /></label>
      <div class="inv-row2">
        <label class="field"><span class="lbl">{t('Street')}</span><input class="inp" bind:value={acc.street} autocomplete="address-line1" /></label>
        <label class="field inv-short"><span class="lbl">{t('No.')}</span><input class="inp" bind:value={acc.house} /></label>
      </div>
      <div class="inv-row2">
        <label class="field inv-short"><span class="lbl">{t('Postcode')}</span><input class="inp" bind:value={acc.zip} autocomplete="postal-code" inputmode="numeric" /></label>
        <label class="field"><span class="lbl">{t('Town')}</span><input class="inp" bind:value={acc.town} autocomplete="address-level2" /></label>
      </div>
      <label class="field"><span class="lbl">{t('TWINT number (optional)')}</span><input class="inp" bind:value={acc.twint} inputmode="tel" autocomplete="tel" placeholder="079 000 00 00" /></label>
      {#if accError}<p class="inv-err" role="alert">{accError}</p>{/if}
      <div class="inv-btns">
        <button class="btn hi" type="submit">{t('Save account')}</button>
        {#if account}<button class="btn" type="button" onclick={() => (editAcc = false)}>{t('Cancel')}</button>{/if}
      </div>
    </form>
  {:else}
    <div class="inv-two">
      <div class="card inv-card">
        <div class="inv-acc">
          <Landmark size={18} aria-hidden="true" />
          <span>{t('Your account')}: <b>{account.iban.slice(0, 9)} …{cleanIban(account.iban).slice(-4)}</b> · {t('only stored on this device')}</span>
          {#if !saved}<button class="btn btn-link inv-edit" type="button" onclick={() => (editAcc = true)} aria-label={t('Change account')}><Pencil size={15} aria-hidden="true" /></button>{/if}
        </div>
        {#if saved}
          <dl class="inv-dl">
            <dt>{t('For whom?')}</dt><dd>{saved.name}{#if saved.email}{' · '}{saved.email}{/if}</dd>
            <dt>{t('Amount|money')}</dt><dd class="num">{(saved.amount / 100).toFixed(2)} CHF</dd>
            <dt>{t('What for?')}</dt><dd>{saved.purpose}</dd>
            <dt>{t('Message for TWINT')}</dt><dd>{saved.no}</dd>
          </dl>
        {:else}
          <label class="field"><span class="lbl">{t('For whom?')}</span><input class="inp" bind:value={form.name} /></label>
          <label class="field"><span class="lbl">{t('E-mail (optional)')}</span><input class="inp" type="email" bind:value={form.email} autocomplete="off" /></label>
          <div class="inv-row2">
            <label class="field"><span class="lbl">{t('Amount|money')}</span><input class="inp num" bind:value={form.amount} inputmode="decimal" placeholder="80.00" /></label>
            <label class="field"><span class="lbl">{t('What for?')}</span><input class="inp" bind:value={form.purpose} /></label>
          </div>
          <fieldset class="inv-ways">
            <legend class="lbl">{t('Ways to pay for this invoice')}</legend>
            <label class="inv-way"><input type="checkbox" bind:checked={form.qr} /> <span><b>{t('QR bill (bank)')}</b><small>{formatIban(account.iban)}</small></span></label>
            <label class="inv-way" class:off={!account.twint}>
              <input type="checkbox" bind:checked={form.twint} disabled={!account.twint} />
              <span><b>TWINT</b><small>{account.twint ? t('To your number {phone} · only on this device', { phone: account.twint }) : t('Add your TWINT number to the account to use it.')}</small></span>
            </label>
          </fieldset>
          <p class="ich-fine">{t('The reference and the TWINT message are made automatically. That is how you recognise the payment later.')}</p>
        {/if}
        {#if formError}<p class="inv-err" role="alert">{formError}</p>{/if}
        <div class="inv-btns">
          <button class="btn hi" type="button" onclick={sendMail} disabled={busy}><Mail size={18} aria-hidden="true" />{t('Send by e-mail')}</button>
          <button class="btn" type="button" onclick={sharePdf} disabled={busy}><Share2 size={18} aria-hidden="true" />{t('Share PDF')}</button>
          <button class="btn" type="button" onclick={copyLink} disabled={busy}><Link size={18} aria-hidden="true" />{t('Copy pay link')}</button>
        </div>
        {#if note}<p class="ich-fine" role="status">{note}</p>{/if}
        <p class="ich-fine">{t('Free, nobody in between. TWINT is free between private people; whoever sells regularly needs a TWINT business account, which costs fees.')}</p>
      </div>
      <div>
        <BillPreview {account} bill={draft} />
        {#if !saved}<p class="ich-fine">{t('The invoice number comes when you send it.')}</p>{/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .inv-two {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
    gap: 18px;
    align-items: start;
  }
  @media (max-width: 899px) {
    .inv-two {
      grid-template-columns: 1fr;
    }
  }
  .inv-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 18px 20px;
  }
  .inv-card h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .inv-acc {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--paper-2);
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .inv-acc span {
    flex: 1;
    min-width: 0;
  }
  .inv-edit {
    padding: 4px;
  }
  .field {
    display: block;
  }
  .inv-row2 {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 12px;
  }
  .inv-row2:has(.inv-short) {
    grid-template-columns: minmax(0, 1fr) 110px;
  }
  .inv-row2 .inv-short:first-child {
    order: 0;
  }
  .inv-row2:has(.inv-short:first-child) {
    grid-template-columns: 110px minmax(0, 1fr);
  }
  .inv-ways {
    border: 0;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .inv-way {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
    cursor: pointer;
  }
  .inv-way input {
    width: 20px;
    height: 20px;
    accent-color: var(--hi);
    flex: none;
  }
  .inv-way span {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .inv-way small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .inv-way.off {
    opacity: 0.7;
  }
  .inv-btns {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .inv-err {
    margin: 0;
    color: var(--bad);
    font-weight: 600;
  }
  .inv-dl {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 6px 14px;
    margin: 0;
  }
  .inv-dl dt {
    color: var(--ink-3);
  }
  .inv-dl dd {
    margin: 0;
    font-weight: 600;
    overflow-wrap: break-word;
  }
</style>
