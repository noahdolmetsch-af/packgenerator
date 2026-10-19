<script>
  /**
   * Paket 4 «Wohnungs-Hüter-Liste» (Noah 19.10.2026 «1a»): what the person looking after the flat should
   * do, with a note; shared only as a link or a QR code (hueter.js). Next to the Haus-Check on the sheet.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { KEEPER_KEY, KEEPER_MAX, keeperOf, keeperLabel, addKeeper, renameKeeper, dropKeeper, moveKeeper, keeperValue, keeperCode, keeperUrl } from './hueter.js';
  import LinesEdit from './LinesEdit.svelte';
  import { KeyRound, Share2, QrCode, Copy } from '@lucide/svelte';

  let { from = '', until = '' } = $props();
  const q = liveQuery(() => db.settings.get(KEEPER_KEY));
  const state = $derived(keeperOf($q?.value));
  const save = (s) => db.settings.put({ key: KEEPER_KEY, value: keeperValue(s) });
  const label = (x) => keeperLabel(x, t);
  let before = null;

  let note = $state(null);
  const noteText = $derived(note ?? state.note);
  const saveNote = () => note != null && save({ ...state, note }).then(() => (note = null));

  const base = typeof location === 'undefined' ? '' : `${location.origin}${location.pathname}`;
  const url = $derived(keeperUrl(base, keeperCode({ lines: state.items.map(label), note: noteText, from, until })));
  const long = $derived(url.length > KEEPER_MAX);

  let msg = $state('');
  let qr = $state(null);
  async function share() {
    msg = '';
    try {
      if (navigator.share) return await navigator.share({ title: t('Looking after the flat'), url });
    } catch (e) {
      if (e?.name === 'AbortError') return;
    }
    copy();
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      msg = t('Link copied. Paste it into a message.');
    } catch {
      msg = t('Copying did not work here. Hold the link below to copy it.');
    }
  }
  async function showQr() {
    if (qr) return (qr = null);
    const { qrMatrix, modulesPath } = await import('../pay/qrmatrix.js');
    const m = await qrMatrix(url);
    qr = { n: m.n + 8, d: modulesPath(m, 4) };
  }
  $effect(() => {
    url;
    qr = null;
  });
</script>

<section class="card" aria-labelledby="keeper-h" data-keeper>
  <h2 id="keeper-h" class="sh"><KeyRound size={18} aria-hidden="true" /> {t('List for the flat sitter')}</h2>
  <p class="tp-small tp-muted">{t('What the person looking after your flat should do. You share it as a link or a QR code; it is stored only in the link.')}</p>
  <LinesEdit
    name="keeper"
    items={state.items}
    {label}
    addLabel="e.g. Feed the cat in the morning"
    onadd={(text) => save(addKeeper(state, text) ?? state)}
    onrename={(id, text) => save(renameKeeper(state, id, text))}
    ondrop={(id) => ((before = state), save(dropKeeper(state, id)))}
    onundo={() => before && save(before)}
    onmove={(from, to) => save(moveKeeper(state, from, to))}
  />
  <label class="nl">
    <span class="tp-small">{t('Note for the sitter (optional)')}</span>
    <textarea class="inp" rows="2" value={noteText} oninput={(e) => (note = e.currentTarget.value)} onblur={saveNote} placeholder={t('e.g. The key is with the neighbour on the 2nd floor.')} data-keeper-note></textarea>
  </label>
  <p class="tp-small tp-muted">{t('Do not put door codes or alarm numbers in the link: anyone who gets it can read it.')}</p>
  <div class="acts">
    <button type="button" class="btn hi" onclick={share} data-keeper-share><Share2 size={18} aria-hidden="true" />{t('Share link')}</button>
    <button type="button" class="btn" onclick={copy} data-keeper-copy><Copy size={18} aria-hidden="true" />{t('Copy link')}</button>
    <button type="button" class="btn" aria-expanded={!!qr} onclick={showQr} data-keeper-qr><QrCode size={18} aria-hidden="true" />{t('QR code')}</button>
  </div>
  {#if msg}<p class="tp-small" role="status">{msg}</p>{/if}
  {#if long}<p class="tp-small" role="status">{t('The list is long: the QR code gets dense. Shorter lines help.')}</p>{/if}
  {#if qr}
    <svg class="qr" viewBox="0 0 {qr.n} {qr.n}" role="img" aria-label={t('QR code of the list for the flat sitter')} data-keeper-qrcode><rect width={qr.n} height={qr.n} class="bg" /><path d={qr.d} class="fg" /></svg>
    <p class="tp-small tp-muted">{t('The sitter scans it with the phone camera; the list opens in the browser.')}</p>
  {/if}
  <a class="lnk tp-small" href={url} target="_blank" rel="noopener" data-keeper-link>{t('Open the list as the sitter sees it')}</a>
</section>

<style>
  .sh {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 6px;
  }
  section > p {
    margin: 0 0 8px;
  }
  .nl {
    display: grid;
    gap: 4px;
    margin: 10px 0 6px;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 6px 0 8px;
  }
  .qr {
    display: block;
    width: min(240px, 100%);
    height: auto;
    margin: 6px 0;
  }
  .qr .bg {
    fill: var(--paper);
  }
  .qr .fg {
    fill: var(--ink);
  }
  .lnk {
    display: inline-block;
    overflow-wrap: break-word;
  }
</style>
