<script>
  /**
   * Paket J #311 (Noah 19.10.2026 «4a») and #1001: the emergency card and its lock-screen image.
   * - The card: contact, phone, blood group, allergies, medicines, other; every line optional, changed
   *   or cleared here; stored only on this device (settings 'sos.card', in your backup).
   * - «Take a contact (.vcf)»: a contact shared from the phone's contacts fills name and number (#1001).
   * - The QR code holds plain text: any phone camera shows it, without an app or the internet.
   * - «Save the lock-screen image»: a PNG for the phone's lock screen (share sheet on a phone, a
   *   download on a computer), with a short how-to.
   * - #1158 «Print a wallet card» (Noah 28.10.2026 «a) bauen»): a card in credit-card size (85.6 × 54 mm) with
   *   the lines and the QR code, printed by the browser; cut it out for the wallet, for when the phone is
   *   empty or broken. Only the card is printed (body.print-wallet hides the rest).
   */
  import { liveQuery } from 'dexie';
  import { ChevronLeft, FileUp, Download, Eraser, Printer } from '@lucide/svelte';
  import { db } from '../../lib/db.js';
  import Form from '../../lib/ui/Form.svelte';
  import Field from '../../lib/ui/Field.svelte';
  import { askDelete, deleteWithUndo } from '../../lib/ui/ask.js';
  import { offerDone } from '../../lib/ui/rename.svelte.js';
  import { qrMatrix, modulesPath } from '../../lib/pay/qrmatrix.js';
  import { CARD_KEY, CARD_FIELDS, cleanCard, hasCard, cardText, parseVcf, walletLines } from '../../lib/mountain/sos.js';
  import { t } from '../../lib/i18n.svelte.js';

  const cardQ = liveQuery(async () => (await db.settings.get(CARD_KEY)) ?? null);
  let draft = $state(null);
  let errors = $state({});
  let vcfMsg = $state('');
  let imgMsg = $state('');
  let busy = $state(false);
  $effect(() => {
    if (draft === null && $cardQ !== undefined) draft = { ...($cardQ?.value ?? {}) }; // null: no card yet
  });
  const saved = $derived(cleanCard($cardQ?.value ?? {}));
  const title = $derived(t('EMERGENCY / ICE'));
  const text = $derived(cardText(saved, (k) => t(k), title));

  let code = $state(null);
  $effect(() => {
    const value = text;
    if (!hasCard(saved)) {
      code = null;
      return;
    }
    let gone = false;
    qrMatrix(value).then((m) => !gone && (code = { n: m.n + 8, d: modulesPath(m, 4) }));
    return () => (gone = true);
  });

  async function save() {
    await db.settings.put({ key: CARD_KEY, value: cleanCard(draft) });
    offerDone(t('Emergency card saved.'));
  }

  async function pickVcf(event) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    vcfMsg = '';
    const found = parseVcf(await file.text());
    if (!found) {
      vcfMsg = t('No contact found in this file. Share a contact from your phone’s contacts as .vcf.');
      return;
    }
    const slot = draft.contact || draft.phone ? (draft.contact2 || draft.phone2 ? 'contact' : 'contact2') : 'contact';
    const phoneKey = slot === 'contact' ? 'phone' : 'phone2';
    draft = { ...draft, [slot]: found.name || draft[slot] || '', [phoneKey]: found.phone || draft[phoneKey] || '' };
    vcfMsg = t('«{name}» taken over. Tap «Save card» to keep it.', { name: found.name || found.phone });
  }

  async function clear() {
    const answer = await askDelete({ title: t('Delete the emergency card?'), text: t('Contact, allergies and the rest are cleared on this device. The lock-screen image you saved stays on your phone.') });
    if (answer !== 'delete') return;
    const before = $cardQ?.value ?? {};
    await deleteWithUndo({
      run: async () => {
        await db.settings.delete(CARD_KEY);
        draft = {};
        return before;
      },
      undo: async (value) => {
        await db.settings.put({ key: CARD_KEY, value });
        draft = { ...value };
      },
      text: t('Emergency card deleted.'),
      name: t('Emergency card'),
    });
  }

  // #1158: the wallet card; the browser prints only it (body.print-wallet), then the class goes again
  const wallet = $derived(walletLines(saved, (k) => t(k)));
  let walletEl = $state(null);
  function printCard() {
    if (!walletEl) return;
    // a copy straight under <body>, so the page around it prints no empty sheets
    const copy = walletEl.cloneNode(true);
    copy.classList.add('wallet-print');
    document.body.append(copy);
    document.body.classList.add('print-wallet');
    const done = () => {
      document.body.classList.remove('print-wallet');
      copy.remove();
      window.removeEventListener('afterprint', done);
    };
    window.addEventListener('afterprint', done);
    window.print();
  }

  async function image() {
    busy = true;
    imgMsg = '';
    try {
      const { drawLockImage, toFile } = await import('../../lib/mountain/lockimage.js');
      const canvas = await drawLockImage(saved, text, { title, scan: t('Scan in an emergency'), contact: t('Emergency contact'), name: t('Name|sos') });
      const file = await toFile(canvas, t('emergency-lock-screen.png'));
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: t('Emergency QR') });
      } else {
        const url = URL.createObjectURL(file);
        const a = Object.assign(document.createElement('a'), { href: url, download: file.name });
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
      imgMsg = t('Image ready. Now set it as the lock screen (see below).');
    } catch (err) {
      if (err?.name !== 'AbortError') imgMsg = t('The image could not be made. Try again.');
    } finally {
      busy = false;
    }
  }
</script>

<div class="sk qrp">
  <p class="sk-back"><a href="#/mountain"><ChevronLeft size={16} aria-hidden="true" />{t('Mountain and emergency')}</a></p>
  <h1 class="sk-h1" tabindex="-1" data-page-title>{t('Emergency QR')}</h1>
  <p class="sk-sub">{t('Your emergency card as a QR code on the lock screen: helpers scan it without unlocking your phone. Everything stays on this device.')}</p>

  <div class="sk-cols">
    <div>
      {#if draft}
        <section class="surf sk-pad" aria-labelledby="qr-card">
          <h2 class="sk-kicker" id="qr-card">{t('Your emergency card')}</h2>
          <label class="btn sm vcf"><FileUp size={16} aria-hidden="true" />{t('Take a contact (.vcf)')}<input type="file" accept=".vcf,text/vcard,text/x-vcard" onchange={pickVcf} hidden data-vcf /></label>
          {#if vcfMsg}<p class="sk-quiet" role="status">{vcfMsg}</p>{/if}
          <Form bind:errors onsave={save} saveLabel={t('Save card')}>
            <div class="sk-grid2">
              {#each CARD_FIELDS as f (f.key)}
                <Field id="sos-{f.key}" label={t(f.label)} optional={f.hint === 'Optional'} example={f.hint !== 'Optional' ? t(f.hint) : ''}>
                  {#snippet children(x)}<input class="inp" type={f.type ?? 'text'} maxlength="120" {...x.attrs} bind:value={draft[f.key]} data-card={f.key} />{/snippet}
                </Field>
              {/each}
            </div>
          </Form>
          {#if hasCard(saved)}<button type="button" class="btn sm quiet" onclick={clear} data-clear><Eraser size={16} aria-hidden="true" />{t('Delete card')}</button>{/if}
        </section>
      {/if}
    </div>

    <div>
      <section class="surf sk-pad prev" aria-labelledby="qr-prev">
        <h2 class="sk-kicker" id="qr-prev">{t('The QR code')}</h2>
        {#if code}
          <svg class="qr" viewBox="0 0 {code.n} {code.n}" role="img" aria-label={t('QR code of your emergency card')} shape-rendering="crispEdges" data-qr>
            <rect width={code.n} height={code.n} fill="white" />
            <path d={code.d} fill="black" />
          </svg>
          <pre class="txt" data-qr-text>{text}</pre>
          <button type="button" class="btn hi" onclick={image} disabled={busy} data-image><Download size={18} aria-hidden="true" />{busy ? t('Making the image…') : t('Save the lock-screen image')}</button>
          {#if imgMsg}<p class="sk-quiet" role="status">{imgMsg}</p>{/if}
          <button type="button" class="btn" onclick={printCard} data-print-card><Printer size={18} aria-hidden="true" />{t('Print a wallet card')}</button>
          <p class="sk-quiet">{t('A card in credit-card size with these lines and the code. Cut it out and keep it in your wallet, for when the phone is empty or broken.')}</p>
          <details class="how">
            <summary>{t('How to put it on the lock screen')}</summary>
            <ol>
              <li>{t('Open the image in the gallery (or Photos).')}</li>
              <li>{t('Tap ⋮ or «Share», then «Set as wallpaper».')}</li>
              <li>{t('Choose «Lock screen». The clock stays at the top, the code below it.')}</li>
            </ol>
          </details>
        {:else}
          <p class="sk-quiet">{t('Fill in at least one line and save: the code shows here.')}</p>
        {/if}
      </section>
    </div>
  </div>

  {#if code}
    <!-- #1158: the wallet card, shown only when printing (85.6 × 54 mm, black on white) -->
    <div class="wallet" aria-hidden="true" bind:this={walletEl} data-wallet-card>
      <div class="w-text">
        <b class="w-title">{title}</b>
        {#each wallet as l (l.key)}<span class="w-line"><span class="w-lbl">{l.label}:</span> {l.value}</span>{/each}
      </div>
      <svg class="w-qr" viewBox="0 0 {code.n} {code.n}" shape-rendering="crispEdges"><rect width={code.n} height={code.n} fill="white" /><path d={code.d} fill="black" /></svg>
    </div>
  {/if}
</div>

<style>
  .qrp {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .vcf {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 4px 0 10px;
    cursor: pointer;
  }
  .prev {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  .qr {
    width: 200px;
    height: 200px;
    border-radius: 8px;
  }
  .txt {
    margin: 0;
    white-space: pre-wrap;
    font: var(--fs-small) / 1.4 var(--font-body);
    color: var(--ink-2);
  }
  .prev .btn,
  .quiet {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .quiet {
    margin-top: 10px;
  }
  .how summary {
    cursor: pointer;
    min-height: 44px;
  }
  .wallet {
    display: none;
  }
  /* #1158: when printing the wallet card, only its copy under <body> is shown */
  @media print {
    :global(body.print-wallet > :not(.wallet-print)) {
      display: none !important;
    }
    :global(.wallet-print) {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) 24mm;
      gap: 2mm;
      align-items: center;
      box-sizing: border-box;
      width: 85.6mm;
      height: 54mm;
      margin: 10mm;
      padding: 3mm;
      border: 0.3mm dashed var(--print-ink);
      border-radius: 3mm;
      background: var(--print-paper);
      color: var(--print-ink);
      font-family: var(--font-body);
      font-size: var(--fs-print);
      line-height: 1.25;
      overflow: hidden;
      break-inside: avoid;
    }
  }
  :global(.wallet-print .w-text) {
    display: flex;
    flex-direction: column;
    gap: 0.4mm;
    min-width: 0;
    overflow: hidden;
  }
  :global(.wallet-print .w-title) {
    font-size: var(--fs-print-title);
    margin-bottom: 0.8mm;
  }
  :global(.wallet-print .w-line) {
    overflow-wrap: break-word;
  }
  :global(.wallet-print .w-lbl) {
    font-weight: 600;
  }
  :global(.wallet-print .w-qr) {
    width: 24mm;
    height: 24mm;
  }
  .how ol {
    margin: 6px 0 0;
    padding-left: 20px;
  }
</style>
