<script>
  /**
   * Paket D «Mit Freunden»: send a message. The link (or, with a photo or a voice note, a small file)
   * goes out through the phone's share window, a copy, or a QR code to show. Nothing goes over a server.
   * env: the message; text: a short line that goes with it; ondone(): the box closes.
   */
  import { t } from '../i18n.svelte.js';
  import { encodeEnvelope } from './code.js';
  import { inUrl, needsFile, fileText, fileName } from './freunde.js';
  import QrCode from '../ich/QrCode.svelte';
  import { Share2, Copy, FileDown, QrCode as QrIcon, X } from '@lucide/svelte';

  let { env, text = '', ondone = null } = $props();
  let url = $state('');
  let qr = $state(false);
  let said = $state('');
  const base = typeof location === 'undefined' ? '' : `${location.origin}${location.pathname}`;

  $effect(() => {
    const e = env;
    let gone = false;
    url = '';
    encodeEnvelope(e).then((code) => !gone && (url = inUrl(base, code)));
    return () => (gone = true);
  });
  const asFile = $derived(!!env && needsFile(env, url.length));

  function file() {
    return new File([fileText(env)], fileName(env), { type: 'application/json' });
  }
  async function share() {
    said = '';
    try {
      if (asFile) {
        const f = file();
        if (navigator.canShare?.({ files: [f] })) await navigator.share({ files: [f], title: text || t('From the Pack Generator'), text });
        else download();
      } else if (navigator.share) await navigator.share({ title: text || t('From the Pack Generator'), text, url });
      else await copy();
    } catch {
      /* the share window was closed */
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(text ? `${text}\n${url}` : url);
      said = t('Link copied. Paste it into a message.');
    } catch {
      said = t('Copying did not work. Select the link and copy it by hand.');
    }
  }
  function download() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file());
    a.download = fileName(env);
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    said = t('File saved. Send it in a chat or by mail; your friend opens it under Me › With friends.');
  }
</script>

<div class="fr-send" data-fr-send>
  {#if asFile}
    <p class="fr-fine">{t('This one holds a photo or a voice note, so it goes as a small file instead of a link. Your friend opens it in the app under Me › With friends › Open a file.')}</p>
  {:else}
    <p class="fr-fine">{t('Send the link to the friends you choose. Only who has the link can see it; nothing goes over a server.')}</p>
    <input class="fr-url" readonly value={url} aria-label={t('The link')} data-fr-url onfocus={(e) => e.currentTarget.select()} />
  {/if}
  <div class="fr-row">
    <button type="button" class="btn hi" onclick={share} disabled={!url} data-fr-share><Share2 size={16} aria-hidden="true" />{t('Send')}</button>
    {#if asFile}
      <button type="button" class="btn" onclick={download}><FileDown size={16} aria-hidden="true" />{t('Save as file')}</button>
    {:else}
      <button type="button" class="btn" onclick={copy} disabled={!url}><Copy size={16} aria-hidden="true" />{t('Copy link')}</button>
      {#if url.length < 1800}<button type="button" class="btn" aria-pressed={qr} onclick={() => (qr = !qr)}><QrIcon size={16} aria-hidden="true" />{t('QR code')}</button>{/if}
    {/if}
    {#if ondone}<button type="button" class="btn btn-link" onclick={ondone}><X size={16} aria-hidden="true" />{t('Close')}</button>{/if}
  </div>
  {#if qr && url}<div class="fr-qr"><QrCode text={url} label={t('QR code of the link')} /></div>{/if}
  {#if said}<p class="fr-said" role="status">{said}</p>{/if}
</div>
