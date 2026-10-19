<script>
  /**
   * «Zahlungen erkennen» beside the invoice list (mockups QR2 + QR8, Noah 14.10.2026 04:00 «a»):
   * upload a QR bill from the e-banking (image with the QR code) or a bank statement (camt.054/053),
   * a TWINT screenshot (QR6; here since Noah 19.10.2026 «2b», sharing a picture goes to Dokumente)
   * and the Sunday reminder switch. Files are read on this device and not kept.
   */
  import { t } from '../i18n.svelte.js';
  import { QrCode, Landmark, Bell, Smartphone } from '@lucide/svelte';
  import { isCamt, readCamt } from './camt.js';
  import { readQrImage } from './qrread.js';
  import { readReminder, writeReminder } from './invoices.js';

  /** onstatement({ payments, file }) · onqr(parsed QR bill) · onshot(picture file) */
  let { onstatement, onqr, onshot } = $props();

  let problem = $state('');
  let rem = $state({ on: true });
  readReminder().then((r) => (rem = r));

  async function toggle() {
    rem = { ...rem, on: !rem.on };
    await writeReminder({ on: rem.on });
  }

  async function pickStatement(e) {
    problem = '';
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;
    const xml = await file.text();
    if (!isCamt(xml)) return (problem = t('This is not a camt file. In the e-banking, export the account statement or the credit notification as camt.054 or camt.053 (XML).'));
    onstatement?.({ payments: readCamt(xml), file: file.name });
  }

  function pickShot(e) {
    problem = '';
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;
    if (!/^image\//.test(file.type || '')) return (problem = t('Please choose a picture (a screenshot from TWINT).'));
    onshot?.(file);
  }

  async function pickBill(e) {
    problem = '';
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;
    try {
      onqr?.(await readQrImage(file));
    } catch (err) {
      problem = err.message;
    }
  }
</script>

<section aria-labelledby="det-h">
  <h2 id="det-h" class="det-h">{t('Recognise payments')}</h2>
  <label class="card det-up">
    <span class="det-ib"><QrCode size={20} aria-hidden="true" /></span>
    <span><b>{t('Upload a bill from the e-banking')}</b><small>{t('Picture with the QR code. The app reads amount and reference.')}</small></span>
    <input class="det-file" type="file" accept="image/*" onchange={pickBill} />
  </label>
  <label class="card det-up">
    <span class="det-ib"><Landmark size={20} aria-hidden="true" /></span>
    <span><b>{t('Upload a bank statement')}</b><small>{t('File from the e-banking (camt.054 or camt.053). The app recognises payments by the reference.')}</small></span>
    <input class="det-file" type="file" accept=".xml,.camt,.053,.054,application/xml,text/xml" onchange={pickStatement} />
  </label>
  {#if onshot}
    <label class="card det-up">
      <span class="det-ib"><Smartphone size={20} aria-hidden="true" /></span>
      <span><b>{t('Choose a TWINT screenshot')}</b><small>{t('Screenshot of a received payment. The app reads it on your phone and suggests the paid invoice.')}</small></span>
      <input class="det-file" type="file" accept="image/*" data-testid="twint-shot" onchange={pickShot} />
    </label>
  {/if}
  {#if problem}<p class="det-err" role="alert">{problem}</p>{/if}
  <div class="card ich-row det-rem">
    <span class="det-ib"><Bell size={18} aria-hidden="true" /></span>
    <span class="ich-m"><b id="det-rem">{t('Reminder to check payments')}</b><small>{t('Every Sunday, 18:00 · only when invoices are open')}</small></span>
    <button class="btn sm" type="button" role="switch" aria-labelledby="det-rem" aria-checked={rem.on} onclick={toggle}>{rem.on ? t('on|switch') : t('off|switch')}</button>
  </div>
</section>

<style>
  .det-h {
    margin: 0 0 10px;
    font-size: var(--fs-sub);
  }
  .det-up {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    margin-bottom: 10px;
    border: 1.5px dashed var(--line-strong);
    cursor: pointer;
    position: relative;
  }
  .det-up:focus-within {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
  .det-up b {
    display: block;
    font-weight: 600;
  }
  .det-up small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .det-ib {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: var(--paper-2);
    display: grid;
    place-items: center;
    flex: none;
  }
  .det-file {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
  }
  .det-err {
    margin: 0 0 10px;
    color: var(--bad);
    font-weight: 600;
  }
  .det-rem {
    margin-top: 4px;
  }
</style>
