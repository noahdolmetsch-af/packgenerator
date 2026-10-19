<script>
  import { askDelete, deleteWithUndo } from '../lib/ui/ask.js'; // «Rückmeldungen» 19.10.2026: the app's own question, then 4 s «Undo»
  /**
   * Ich › Bezahlen › Zu zahlen (#/me/pay/bills; mockup QR9, Noah 14.10.2026 05:02 «a», 05:10 «1-4a»
   * and «a»): bills Noah gets. Upload a photo or screenshot of the QR bill; the app reads recipient,
   * amount and reference (on the device), Noah sets the due date (30 days when none, 4a) and when the
   * reminder comes (3 days before, changeable, 2a). He pays in the e-banking: «Zahlteil» shows IBAN,
   * amount and reference to copy. «Bezahlt» marks it; the photo stays as a receipt (3a).
   * No picture reader in this browser, or no QR code in it: the same form, filled by hand.
   */
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import PayTabs from '../lib/pay/PayTabs.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import { t, tn, dateOf } from '../lib/i18n.svelte.js';
  import { Upload, Check, QrCode, RotateCcw, Copy, Trash2, PenLine } from '@lucide/svelte';
  import { listBills, addBill, markBillPaid, markBillOpen, deleteBill, restoreBill, billsSummary, daysLeft, isDueSoon, addDays, DUE_DAYS, REMIND_DAYS } from '../lib/pay/bills.js';
  import { formatAmount, parseAmount, formatIban, formatReference } from '../lib/pay/qrbill.js';
  import { readQrImage } from '../lib/pay/qrread.js';
  import { shrinkImage } from '../lib/photo.js';
  import PhotoPick from '../lib/ui/PhotoPick.svelte';
  import { localDay } from '../lib/localday.js';
  import '../lib/ich/ich.css';

  let list = $state([]);
  let loaded = $state(false);
  let tab = $state('open');
  let done = $state('');
  let problem = $state('');
  let form = $state(null); // { read, to, iban, amount, ref, refType, purpose, due, remindDays, photo }
  let formError = $state('');
  let opened = $state(null); // id whose «Zahlteil» shows
  let copied = $state('');
  let refresh = $state(0);

  async function load() {
    list = await listBills();
    loaded = true;
    refresh++;
  }
  load();

  const sum = $derived(billsSummary(list));
  const paidCount = $derived(list.filter((x) => x.status === 'paid').length);
  const shown = $derived(tab === 'open' ? list.filter((x) => x.status !== 'paid') : tab === 'paid' ? list.filter((x) => x.status === 'paid') : list);

  const blank = (extra = {}) => ({ read: false, to: '', iban: '', amount: '', ref: '', refType: 'NON', purpose: '', due: addDays(localDay(), DUE_DAYS), remindDays: REMIND_DAYS, photo: null, ...extra });

  let reading = $state(false);
  async function pick(file) {
    problem = '';
    done = '';
    if (!file) return;
    reading = true;
    try {
      await readBill(file);
    } finally {
      reading = false;
    }
  }
  async function readBill(file) {
    let photo = null;
    try {
      photo = await shrinkImage(file);
    } catch (err) {
      return (problem = err.message);
    }
    try {
      const b = await readQrImage(file);
      form = blank({ read: true, to: b.name, iban: formatIban(b.iban), amount: b.amount ? formatAmount(b.amount) : '', ref: b.ref, refType: b.refType, purpose: b.message, photo });
    } catch (err) {
      // the photo is kept; the rest by hand
      form = blank({ photo });
      problem = err.message + ' ' + t('Please fill in the rest by hand.');
    }
  }

  async function save() {
    const amount = parseAmount(form.amount);
    if (!form.to.trim()) return (formError = t('Please enter who gets the money.'));
    if (!amount) return (formError = t('Please enter an amount, for example 80.00.'));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.due)) return (formError = t('Please choose the due date.'));
    const bill = await addBill({ ...$state.snapshot(form), amount, purpose: form.purpose || t('Bill') });
    form = null;
    formError = '';
    problem = '';
    tab = 'open';
    done = t('{to} is in «To pay».', { to: bill.to });
    await load();
  }

  async function paid(b) {
    await markBillPaid(b.id);
    opened = null;
    done = t('{to} is marked as paid.', { to: b.to });
    await load();
  }
  async function reopen(b) {
    await markBillOpen(b.id);
    done = t('{to} is open again.', { to: b.to });
    await load();
  }
  async function remove(b) {
    const name = b.to || t('Bill');
    if ((await askDelete({ title: t('Delete the bill to "{name}"?', { name }), text: t('Its photo goes too. You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    const ok = await deleteWithUndo({ run: () => deleteBill(b.id), undo: async (rec) => (await restoreBill(rec), await load()), text: t('"{name}" deleted.', { name }), name });
    if (!ok) return;
    opened = null;
    await load();
  }
  async function copy(text, what) {
    try {
      await navigator.clipboard.writeText(text);
      copied = what;
    } catch {
      copied = '';
    }
  }

  /** «fällig in 3 Tagen · 17.10.», «heute fällig», «2 Tage überfällig», «fällig 31.10.» */
  function dueLine(b) {
    if (b.status === 'paid') return t('paid {date}', { date: dateOf(b.paidAt) });
    const n = daysLeft(b);
    if (n < 0) return tn(-n, '{n} day overdue', '{n} days overdue') + ' · ' + dateOf(b.due);
    if (n === 0) return t('due today');
    if (isDueSoon(b)) return tn(n, 'due in {n} day', 'due in {n} days') + ' · ' + dateOf(b.due);
    return t('due {date}', { date: dateOf(b.due) });
  }
  const tail = (ref) => (ref ? '…' + formatReference(ref).split(' ').pop() : '');
</script>

<div class="ich-page bills">
  <VeloHead
    crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Payments'), href: '#/me/pay' }]}
    title={t('To pay')}
    sub={loaded ? (sum.count ? `${tn(sum.count, '{n} open', '{n} open')} · ${formatAmount(sum.sum)} CHF · ${t('next due {date}', { date: dateOf(sum.next) })}` : t('Nothing to pay.')) : ''}
  />
  <PayTabs value="bills" {refresh} />

  <div class="bills-two" class:one={!form}>
    <div class="bills-main">
      <div class="card bills-up">
        <div class="bills-uptop">
          <span class="bills-ib"><Upload size={20} aria-hidden="true" /></span>
          <span><b>{t('Upload a bill')}</b><small>{t('Photo or screenshot with the QR code. The app reads recipient, amount and reference.')}</small></span>
        </div>
        <!-- Kamera-Knopf (0.131.3): on the phone the camera opens at once, the gallery for a screenshot -->
        <PhotoPick onfile={pick} busy={reading} has={false} camera="Photograph the bill" big />
      </div>
      {#if !form}<button class="btn btn-link sm bills-hand" type="button" onclick={() => ((form = blank()), (problem = ''), (done = ''))}><PenLine size={15} aria-hidden="true" />{t('Enter by hand')}</button>{/if}
      {#if problem}<p class="bills-err" role="alert">{problem}</p>{/if}
      {#if done}<p class="bills-done" role="status">{done}</p>{/if}

      {#if list.length}
        <div class="bills-tabs">
          <Seg full={false} label={t('Show')} value={tab} onchange={(v) => (tab = v)} options={[{ key: 'open', name: t('Open|invoices'), n: sum.count }, { key: 'paid', name: t('Paid'), n: paidCount }, { key: 'all', name: t('All') }]} />
        </div>
        {#if shown.length}
          <ul class="card ich-list bills-list">
            {#each shown as b (b.id)}
              <li class="bills-row" data-testid="bill-row">
                <span class="bills-who">
                  <b>{b.to}</b>
                  <small>{b.purpose}{#if b.ref}{' · '}{t('Ref.')} {tail(b.ref)}{/if}</small>
                  <small class:warn={b.status !== 'paid' && isDueSoon(b)}>{dueLine(b)}</small>
                </span>
                <span class="num bills-amt">{formatAmount(b.amount)} CHF</span>
                {#if b.status !== 'paid'}
                  <span class="bills-acts">
                    <button class="btn sm" type="button" aria-expanded={opened === b.id} onclick={() => ((opened = opened === b.id ? null : b.id), (copied = ''))}><QrCode size={16} aria-hidden="true" />{t('Payment part')}</button>
                    <button class="btn sm" type="button" onclick={() => paid(b)}><Check size={16} aria-hidden="true" />{t('Paid')}</button>
                  </span>
                {:else}
                  <span class="bills-acts">
                    <span class="pill ok">{t('paid|invoice')}</span>
                    {#if b.photo}<button class="btn btn-link sm" type="button" onclick={() => (opened = opened === b.id ? null : b.id)} aria-expanded={opened === b.id}>{t('Receipt|bill')}</button>{/if}
                    <button class="btn btn-link sm" type="button" onclick={() => reopen(b)} aria-label={t('Open {to} again', { to: b.to })}><RotateCcw size={15} aria-hidden="true" />{t('Open again')}</button>
                  </span>
                {/if}
                {#if opened === b.id}
                  <div class="bills-part" data-testid="bill-part">
                    <dl>
                      {#if b.iban}<div><dt>IBAN</dt><dd class="num">{b.iban}</dd><button class="btn btn-link sm" type="button" onclick={() => copy(b.iban.replace(/\s+/g, ''), 'iban')}><Copy size={14} aria-hidden="true" />{copied === 'iban' ? t('Copied') : t('Copy')}</button></div>{/if}
                      <div><dt>{t('Amount|money')}</dt><dd class="num">{formatAmount(b.amount)} CHF</dd><button class="btn btn-link sm" type="button" onclick={() => copy(formatAmount(b.amount), 'amount')}><Copy size={14} aria-hidden="true" />{copied === 'amount' ? t('Copied') : t('Copy')}</button></div>
                      {#if b.ref}<div><dt>{t('Reference')}</dt><dd class="num">{formatReference(b.ref)}</dd><button class="btn btn-link sm" type="button" onclick={() => copy(b.ref, 'ref')}><Copy size={14} aria-hidden="true" />{copied === 'ref' ? t('Copied') : t('Copy')}</button></div>{/if}
                    </dl>
                    {#if b.photo}<a class="bills-photo" href={b.photo} target="_blank" rel="noopener"><img src={b.photo} alt={t('Photo of the bill')} /></a>{/if}
                    <button class="btn btn-link sm bills-del" type="button" onclick={() => remove(b)}><Trash2 size={14} aria-hidden="true" />{t('Delete')}</button>
                  </div>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
        <p class="ich-fine">{t('You pay in your e-banking as always. «Payment part» shows what to copy.')}</p>
      {:else if loaded && !form}
        <p class="ich-fine">{t('No bills yet. Upload the first one above.')}</p>
      {/if}
    </div>

    {#if form}
      <section class="card bills-form" aria-labelledby="bf-h">
        <h2 id="bf-h" class="bills-h">{form.read ? t('Bill read from the photo') : t('Enter a bill')}</h2>
        {#if form.read}<p class="bills-read"><Check size={18} aria-hidden="true" /> {t('Please check the fields.')}</p>{/if}
        <label class="field"><span class="lbl">{t('To|payee')}</span><input class="inp" bind:value={form.to} autocomplete="off" /></label>
        <label class="field"><span class="lbl">IBAN</span><input class="inp num" bind:value={form.iban} autocomplete="off" /></label>
        <div class="bills-pair">
          <label class="field"><span class="lbl">{t('Amount|money')}</span><input class="inp num" bind:value={form.amount} inputmode="decimal" placeholder="80.00" /></label>
          <label class="field"><span class="lbl">{t('Due on')}</span><input class="inp" type="date" bind:value={form.due} /></label>
        </div>
        <label class="field"><span class="lbl">{t('What for?')}</span><input class="inp" bind:value={form.purpose} /></label>
        <label class="field"><span class="lbl">{t('Reminder')}</span>
          <select class="sel" bind:value={form.remindDays}>
            <option value={0}>{t('On the due day, on Today')}</option>
            <option value={1}>{t('1 day before, on Today')}</option>
            <option value={3}>{t('3 days before, on Today')}</option>
            <option value={7}>{t('1 week before, on Today')}</option>
          </select>
        </label>
        {#if formError}<p class="bills-err" role="alert">{formError}</p>{/if}
        <div class="bills-btns">
          <button class="btn hi" type="button" onclick={save}>{t('Add to «To pay»')}</button>
          <button class="btn" type="button" onclick={() => ((form = null), (formError = ''), (problem = ''))}>{t('Cancel')}</button>
        </div>
        <p class="ich-fine">{t('The photo stays only on this device. You pay in your e-banking as always.')}</p>
      </section>
    {/if}
  </div>
</div>

<style>
  .bills-two {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
    gap: 24px;
    align-items: start;
  }
  .bills-two.one {
    grid-template-columns: minmax(0, 820px);
  }
  @media (max-width: 1099px) {
    .bills-two,
    .bills-two.one {
      grid-template-columns: 1fr;
    }
  }
  .bills-main {
    min-width: 0;
  }
  .bills-up {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px 16px;
    margin-bottom: 8px;
    border: 1.5px dashed var(--line-strong);
  }
  .bills-uptop {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .bills-up b {
    display: block;
    font-weight: 600;
  }
  .bills-up small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .bills-ib {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: var(--paper-2);
    display: grid;
    place-items: center;
    flex: none;
  }
  .bills-hand {
    margin: 0 0 12px;
  }
  .bills-err {
    margin: 0 0 10px;
    color: var(--bad);
    font-weight: 600;
  }
  .bills-done {
    margin: 0 0 12px;
    color: var(--ok);
    font-weight: 600;
  }
  .bills-tabs {
    margin: 8px 0 12px;
  }
  .bills-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 6px 14px;
    align-items: center;
    padding: 12px 16px;
  }
  .bills-who {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .bills-who b {
    font-weight: 600;
  }
  .bills-who small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .bills-who small.warn {
    color: var(--warn);
    font-weight: 600;
  }
  .bills-amt {
    font-weight: 600;
    white-space: nowrap;
    text-align: right;
  }
  .bills-acts {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .bills-part {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    gap: 12px 20px;
    align-items: start;
    background: var(--paper-2);
    border-radius: 12px;
    padding: 12px 14px;
  }
  .bills-part dl {
    margin: 0;
    flex: 1 1 260px;
    min-width: 0;
  }
  .bills-part dl div {
    display: grid;
    grid-template-columns: 76px minmax(0, 1fr) auto;
    gap: 2px 10px;
    align-items: baseline;
    padding: 4px 0;
  }
  .bills-part dt {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .bills-part dd {
    margin: 0;
    font-weight: 600;
    overflow-wrap: break-word;
    min-width: 0;
  }
  .bills-photo img {
    display: block;
    max-width: 140px;
    max-height: 180px;
    border-radius: 8px;
    border: 1px solid var(--line);
  }
  .bills-del {
    align-self: end;
  }
  @media (max-width: 600px) {
    .bills-row {
      grid-template-columns: minmax(0, 1fr) auto;
    }
    .bills-acts {
      grid-column: 1 / -1;
      justify-content: flex-start;
    }
  }
  .bills-form {
    padding: 18px 20px;
    min-width: 0;
  }
  .bills-h {
    margin: 0 0 10px;
    font-size: var(--fs-sub);
  }
  .bills-read {
    display: flex;
    gap: 8px;
    align-items: center;
    background: var(--ok-soft);
    border-radius: 12px;
    padding: 10px 14px;
    margin: 0 0 12px;
  }
  .bills-pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .bills-btns {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin: 4px 0 10px;
  }
  @media (max-width: 600px) {
    .bills-part dl div {
      grid-template-columns: minmax(0, 1fr) auto;
    }
    .bills-part dt {
      grid-column: 1 / -1;
    }
  }
</style>
