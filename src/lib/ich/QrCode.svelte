<script>
  /**
   * Design-Refresh P9 (B35 «QR-Code», Noah 11.10.2026 «Bausteine 1–35 freigegeben»): a QR code of a short
   * text (here the app's address), drawn as one SVG path. The code library (qrcode-generator, MIT) is
   * loaded only when a code is shown, so the app stays small. Black on white also in dark mode: a phone
   * camera reads that best.
   */
  import { t } from '../i18n.svelte.js';

  let { text, label = '' } = $props();

  let code = $state(null); // { n, d }
  let failed = $state(false);
  $effect(() => {
    const value = text;
    let gone = false;
    import('qrcode-generator')
      .then(({ default: qrcode }) => {
        const qr = qrcode(0, 'M');
        // Kontakt-QR-Code: the library writes each character as one byte, so hand it the UTF-8 bytes (ä, é, …)
        qr.addData(String.fromCharCode(...new TextEncoder().encode(value)), 'Byte');
        qr.make();
        const n = qr.getModuleCount();
        let d = '';
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + 4} ${r + 4}h1v1h-1z`;
        if (!gone) code = { n: n + 8, d };
      })
      .catch(() => !gone && (failed = true));
    return () => (gone = true);
  });
</script>

{#if code}
  <svg class="qr" viewBox="0 0 {code.n} {code.n}" role="img" aria-label={label || t('QR code')} shape-rendering="crispEdges">
    <rect width={code.n} height={code.n} fill="white" />
    <path d={code.d} fill="black" />
  </svg>
{:else if failed}
  <p class="qrmiss">{t('The code could not be drawn.')}</p>
{:else}
  <div class="qr wait" aria-hidden="true"></div>
{/if}

<style>
  .qr {
    display: block;
    width: 160px;
    height: 160px;
    flex: none;
    border-radius: 8px;
  }
  .wait {
    background: var(--paper-2);
  }
  .qrmiss {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
