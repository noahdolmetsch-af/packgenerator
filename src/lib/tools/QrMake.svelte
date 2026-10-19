<script>
  /**
   * Paket L «Werkzeugkasten» (QR-Code erstellen, Noah 19.10.2026): a text, link or WLAN → a QR code to
   * show or to save as a picture. Drawn on the device (the app's QR library, loaded only here).
   */
  import QrCode from '../ich/QrCode.svelte';
  import { loadTool, saveTool } from './toolstore.js';
  import { deliver } from './tools.js';
  import { t } from '../i18n.svelte.js';
  import './tools.css';

  let kind = $state('text'); // text | wifi
  let text = $state('');
  let ssid = $state('');
  let pass = $state('');
  let box = $state();
  loadTool('qr', null).then((q) => q?.kind && ((kind = q.kind), (text = q.text ?? '')));
  const esc = (s) => String(s).replace(/([\;,:"])/g, '\\$1');
  const value = $derived(kind === 'wifi' ? (ssid.trim() ? `WIFI:T:${pass ? 'WPA' : 'nopass'};S:${esc(ssid.trim())};P:${esc(pass)};;` : '') : text.trim());
  const keep = () => saveTool('qr', { kind, text: kind === 'text' ? text : '' }).catch(() => {});

  async function save() {
    const svg = box?.querySelector('svg');
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = c.height = 1024;
    c.getContext('2d').drawImage(img, 0, 0, 1024, 1024);
    const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
    await deliver(blob, 'qr-code.png');
  }
</script>

<section class="tool-card qrmake">
  <div class="tool-row" role="radiogroup" aria-label={t('What goes in the code')}>
    <label class="tool-chip"><input type="radio" name="qr-kind" value="text" bind:group={kind} onchange={keep} /> {t('Text or link')}</label>
    <label class="tool-chip"><input type="radio" name="qr-kind" value="wifi" bind:group={kind} onchange={keep} /> {t('WLAN')}</label>
  </div>
  {#if kind === 'text'}
    <label class="tool-field"><span>{t('Text or link')}</span><textarea class="tool-input" rows="3" bind:value={text} onchange={keep}></textarea></label>
  {:else}
    <label class="tool-field"><span>{t('WLAN name')}</span><input class="tool-input" bind:value={ssid} autocomplete="off" /></label>
    <label class="tool-field"><span>{t('WLAN password')}</span><input class="tool-input" bind:value={pass} autocomplete="off" /></label>
    <p class="tool-help">{t('The password is not kept; it is only in the code.')}</p>
  {/if}
  {#if value}
    <div class="q-box" bind:this={box} data-qr={value.length}>
      {#key value}<QrCode text={value} label={t('QR code')} />{/key}
    </div>
    <div><button type="button" class="btn" onclick={save}>{t('Save as picture')}</button></div>
  {:else}
    <p class="tool-muted">{t('Type something, and the code appears here.')}</p>
  {/if}
</section>

<style>
  .q-box {
    justify-self: center;
  }
  .q-box :global(.qr) {
    width: min(260px, 70vw);
    height: auto;
  }
</style>
