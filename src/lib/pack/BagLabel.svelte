<script>
  /**
   * K2 «Taschen-Etiketten» (Noah 23.11.2026): one picture of a bag with its content, made on this device with a canvas.
   * «Share» opens the phone's share sheet; «Save» downloads it (print it from there). Nothing is sent anywhere.
   */
  import { t, tn, nameOf, dateOf } from '../i18n.svelte.js';
  import { formatWeight } from '../gear.js';
  import { backClose } from '../ui/backclose.js';
  import { labelLines, labelFileName } from './baglabel.js';
  import { X, Send, Download, Tag } from '@lucide/svelte';
  import '../bikes/velo-dlg.css';

  /** trip: the trip; title: the name of the bag; entries: its entries; itemsById. */
  let { trip, title, entries, itemsById, onclose } = $props();
  const lines = $derived(labelLines(entries, itemsById, nameOf));
  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  let msg = $state('');
  let url = $state('');
  let blob = null;
  const css = (name, fallback) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  const fitText = (g, text, max) => {
    let s = String(text);
    while (s.length > 3 && g.measureText(s).width > max) s = s.slice(0, -2);
    return s === String(text) ? s : `${s.trimEnd()}…`;
  };

  async function draw() {
    const W = 900;
    const PAD = 56;
    const ROW = 62;
    const rows = lines.rows;
    const H = 250 + Math.max(1, rows.length + (lines.more ? 1 : 0)) * ROW + 170;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    const brand = css('--brand', '#4a7360');
    const ink = css('--ink', '#1d2621');
    const mute = css('--ink-2', '#59645e');
    const line = css('--line', '#d8d4c8');
    g.fillStyle = '#fff';
    g.fillRect(0, 0, W, H);
    g.fillStyle = brand;
    g.fillRect(0, 0, W, 22);
    g.textBaseline = 'alphabetic';
    g.fillStyle = ink;
    g.font = '700 64px system-ui, sans-serif';
    g.fillText(fitText(g, title, W - 2 * PAD), PAD, 120);
    g.fillStyle = mute;
    g.font = '400 32px system-ui, sans-serif';
    const when = trip.startDate ? dateOf(trip.startDate) : '';
    g.fillText(fitText(g, [trip.title, when].filter(Boolean).join(' · '), W - 2 * PAD), PAD, 172);
    g.strokeStyle = line;
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(PAD, 204);
    g.lineTo(W - PAD, 204);
    g.stroke();
    let y = 204 + 56;
    g.font = '500 40px system-ui, sans-serif';
    for (const r of rows) {
      g.fillStyle = ink;
      g.textAlign = 'left';
      const label = r.qty > 1 ? `${r.text} × ${r.qty}` : r.text;
      g.fillText(fitText(g, label, W - 2 * PAD - 190), PAD, y);
      g.fillStyle = mute;
      g.textAlign = 'right';
      g.fillText(r.g == null ? '–' : formatWeight(r.g), W - PAD, y);
      y += ROW;
    }
    g.textAlign = 'left';
    if (!rows.length) {
      g.fillStyle = mute;
      g.fillText(t('This bag is still empty.'), PAD, y);
      y += ROW;
    }
    if (lines.more) {
      g.fillStyle = mute;
      g.fillText(t('+ {n} more', { n: lines.more }), PAD, y);
      y += ROW;
    }
    g.strokeStyle = line;
    g.beginPath();
    g.moveTo(PAD, y - 20);
    g.lineTo(W - PAD, y - 20);
    g.stroke();
    g.fillStyle = ink;
    g.font = '700 40px system-ui, sans-serif';
    g.fillText(`${tn(entries.length, '{n} item', '{n} items')} · ${lines.missing ? '~' : ''}${formatWeight(lines.totalG)}`, PAD, y + 36);
    g.fillStyle = mute;
    g.font = '400 26px system-ui, sans-serif';
    g.fillText('Pack Generator', PAD, y + 90);
    blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.9));
    if (url) URL.revokeObjectURL(url);
    url = blob ? URL.createObjectURL(blob) : '';
  }
  $effect(() => {
    void lines;
    draw().catch(() => (msg = t('The picture could not be made here.')));
  });
  $effect(() => () => url && URL.revokeObjectURL(url));

  const fileName = $derived(labelFileName(title, trip.title));
  async function share() {
    msg = '';
    if (!blob) return;
    const file = new File([blob], fileName, { type: 'image/jpeg' });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title });
        return;
      }
    } catch (e) {
      if (e?.name === 'AbortError') return;
    }
    msg = t('Sharing a picture does not work here. Use «Save» and send it yourself.');
  }
</script>

<dialog class="sheet vdlg from-below" bind:this={dialog} use:backClose {onclose} aria-labelledby="bl-h" data-bag-label>
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="bl-h"><Tag size={20} aria-hidden="true" />&nbsp;{t('Label of the bag')}</h2>
      <p class="vd-sub">{t('The content of this bag as one picture, made on this device. Keep it on the phone or print it.')}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  {#if url}<img class="pv" src={url} alt={t('Label of {bag}', { bag: title })} data-bag-label-img />{/if}
  <p class="tp-small" role="status">{msg}</p>
  <div class="vd-foot">
    {#if url}<a class="btn" href={url} download={fileName} data-bag-label-save><Download size={16} aria-hidden="true" />{t('Save')}</a>{/if}
    <button type="button" class="btn hi" onclick={share} disabled={!url} data-bag-label-share><Send size={16} aria-hidden="true" />{t('Share')}</button>
  </div>
</dialog>

<style>
  .pv { display: block; width: 100%; max-width: 360px; margin: 0 auto 12px; border-radius: 12px; box-shadow: 0 4px 16px var(--shadow); background: var(--print-paper); }
</style>
