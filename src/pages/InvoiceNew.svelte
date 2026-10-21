<script>
  /**
   * Ich › Bezahlen › Rechnungen › Neue Rechnung (mockups QR1 + QR4, Noah 14.10.2026 04:00 «a»).
   * The app makes a Swiss QR bill from the account on this device, with TWINT as a second way to pay
   * (on by default, Noah 03:43 «1a mit auswahlmöglichkeit»; every way can be switched off per invoice).
   * Sending: «Per E-Mail senden» opens the mail program; «PDF teilen» makes the PDF on the device.
   * #/me/pay/invoices/new = new; #/me/pay/invoices/<id> = an invoice already made (send again).
   * The account is asked for once and stays only on this device.
   * Paket «Reste» 1041 (Einheitliche Formulare): the account is a ui/Form with ui/Field fields, the messages
   * stand at the field; the invoice fields are ui/Field too (its three buttons send, so no single «Save»).
   */
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import BillPreview from '../lib/pay/BillPreview.svelte';
  import Form from '../lib/ui/Form.svelte';
  import Field from '../lib/ui/Field.svelte';
  import { t, tn } from '../lib/i18n.svelte.js';
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
  let accErrors = $state({});

  let viewId = $state(idInHash());
  let saved = $state(null); // the invoice once made (or opened)
  let form = $state({ name: '', email: '', amount: '', purpose: '', qr: true, twint: true });
  let formErrors = $state({});
  let busy = $state(false);
  let note = $state('');

  $effect(() => {
    const on = () => {
      viewId = idInHash();
      if (!viewId) {
        saved = null;
        note = '';
        form = { name: '', email: '', amount: '', purpose: '', qr: true, twint: true };
        tried = false;
        formErrors = {};
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

  const twintOf = (v) => (String(v ?? '').trim() ? formatTwint(v) : '');
  const accNext = () => ({ iban: formatIban(cleanIban(acc.iban)), name: acc.name.trim(), street: acc.street.trim(), house: acc.house.trim(), zip: acc.zip.trim(), town: acc.town.trim(), twint: twintOf(acc.twint) });
  /** The account's wrong fields: { iban, name, town, twint } → message at the field. */
  function accCheck() {
    const p = accountProblems(accNext());
    const out = {};
    if (p.includes('iban')) out.iban = t('This IBAN is not right. Please check it (CH or LI, 21 characters).');
    if (p.includes('name')) out.name = t('Please enter the name the bill is payable to.');
    if (p.includes('town')) out.town = t('Please enter postcode and town.');
    if (acc.twint.trim() && !twintOf(acc.twint)) out.twint = t('This TWINT number is not right. Please enter a Swiss mobile number.');
    return out;
  }
  function saveAccount() {
    const next = accNext();
    writeAccount(next);
    account = next;
    acc = { ...next };
    accErrors = {};
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

  /** The invoice's wrong fields; after the first try every change checks again (like ui/Form). */
  function formCheck() {
    const out = {};
    if (!form.name.trim()) out.name = t('Please enter who the invoice is for.');
    if (!amount) out.amount = t('Please enter an amount, for example 80.00.');
    if (!form.purpose.trim()) out.purpose = t('Please enter what it is for.');
    if (!ways.qr && !ways.twint) out.ways = t('Switch on at least one way to pay.');
    return out;
  }
  let tried = $state(false);
  $effect(() => {
    if (tried && !saved) formErrors = formCheck();
  });
  async function make() {
    if (saved) return saved;
    tried = true;
    formErrors = formCheck();
    if (Object.keys(formErrors).length) {
      const el = document.querySelector('.inv-new [aria-invalid="true"], .inv-new [data-bad]');
      (el?.matches('input') ? el : el?.querySelector('input:not([disabled])'))?.focus();
      return null;
    }
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
    <section class="card inv-card" aria-labelledby="acc-h">
      <h2 id="acc-h">{t('Your account, once')}</h2>
      <p class="ich-fine">{t('Stays only on this device: not in the backup file, not online.')}</p>
      <Form class="inv-form" check={accCheck} bind:errors={accErrors} onsave={saveAccount} oncancel={account ? () => (editAcc = false) : null} saveLabel={t('Save account')}>
        <Field id="acc-iban" label="IBAN" example={t('CH or LI, 21 characters')} error={accErrors.iban}>
          {#snippet children(f)}<input class="inp" {...f.attrs} bind:value={acc.iban} autocomplete="off" placeholder="CH.. .... .... .... .... ." />{/snippet}
        </Field>
        <Field id="acc-name" label={t('Payable to (name)')} error={accErrors.name}>
          {#snippet children(f)}<input class="inp" {...f.attrs} bind:value={acc.name} autocomplete="name" />{/snippet}
        </Field>
        <div class="inv-row2">
          <Field id="acc-street" label={t('Street')} optional>
            {#snippet children(f)}<input class="inp" {...f.attrs} bind:value={acc.street} autocomplete="address-line1" />{/snippet}
          </Field>
          <Field id="acc-house" class="inv-short" label={t('No.')} optional>
            {#snippet children(f)}<input class="inp" {...f.attrs} bind:value={acc.house} />{/snippet}
          </Field>
        </div>
        <div class="inv-row2">
          <Field id="acc-zip" class="inv-short" label={t('Postcode')}>
            {#snippet children(f)}<input class="inp" {...f.attrs} bind:value={acc.zip} autocomplete="postal-code" inputmode="numeric" />{/snippet}
          </Field>
          <Field id="acc-town" label={t('Town')} error={accErrors.town}>
            {#snippet children(f)}<input class="inp" {...f.attrs} bind:value={acc.town} autocomplete="address-level2" />{/snippet}
          </Field>
        </div>
        <Field id="acc-twint" label={t('TWINT number')} optional example={t('A Swiss mobile number, e.g. 079 000 00 00')} error={accErrors.twint}>
          {#snippet children(f)}<input class="inp" {...f.attrs} bind:value={acc.twint} inputmode="tel" autocomplete="tel" placeholder="079 000 00 00" />{/snippet}
        </Field>
      </Form>
    </section>
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
          <Field id="inv-name" label={t('For whom?')} error={formErrors.name}>
            {#snippet children(f)}<input class="inp" {...f.attrs} bind:value={form.name} />{/snippet}
          </Field>
          <Field id="inv-mail" label={t('E-mail')} optional example={t('Only needed for «Send by e-mail».')}>
            {#snippet children(f)}<input class="inp" type="email" {...f.attrs} bind:value={form.email} autocomplete="off" />{/snippet}
          </Field>
          <div class="inv-row2">
            <Field id="inv-amount" label={t('Amount|money')} example={t('in CHF, e.g. 80.00')} error={formErrors.amount}>
              {#snippet children(f)}<input class="inp num" {...f.attrs} bind:value={form.amount} inputmode="decimal" placeholder="80.00" />{/snippet}
            </Field>
            <Field id="inv-purpose" label={t('What for?')} error={formErrors.purpose}>
              {#snippet children(f)}<input class="inp" {...f.attrs} bind:value={form.purpose} />{/snippet}
            </Field>
          </div>
          <fieldset class="inv-ways" data-bad={formErrors.ways ? '' : undefined} aria-describedby={formErrors.ways ? 'inv-ways-err' : undefined}>
            <legend class="lbl">{t('Ways to pay for this invoice')}</legend>
            <label class="inv-way"><input type="checkbox" bind:checked={form.qr} /> <span><b>{t('QR bill (bank)')}</b><small>{formatIban(account.iban)}</small></span></label>
            <label class="inv-way" class:off={!account.twint}>
              <input type="checkbox" bind:checked={form.twint} disabled={!account.twint} />
              <span><b>TWINT</b><small>{account.twint ? t('To your number {phone} · only on this device', { phone: account.twint }) : t('Add your TWINT number to the account to use it.')}</small></span>
            </label>
            {#if formErrors.ways}<p class="fieldmsg" id="inv-ways-err">{formErrors.ways}</p>{/if}
          </fieldset>
          <p class="ich-fine">{t('The reference and the TWINT message are made automatically. That is how you recognise the payment later.')}</p>
        {/if}
        {#if !saved && tried && Object.keys(formErrors).length}<p class="inv-err" role="alert">{tn(Object.keys(formErrors).length, '{n} entry is missing or wrong. It is marked in red.', '{n} entries are missing or wrong. They are marked in red.')}</p>{/if}
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
  .inv-card :global(.inv-form) {
    display: flex;
    flex-direction: column;
    gap: 12px;
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
