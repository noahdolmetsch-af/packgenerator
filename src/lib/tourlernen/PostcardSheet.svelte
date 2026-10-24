<script>
  /**
   * Paket Z 1123 «Tour-Postkarte» (Noah 20.10.2026 «4a»): one picture of the tour, made on this device with
   * a canvas: your photo (optional), the line of the route and the numbers (km, metres up, riding time, days).
   * «Share» opens the phone's share sheet with the picture; on a computer «Save» downloads it.
   * No server; the photo never leaves the device unless you share the picture.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t, num, locale } from '../i18n.svelte.js';
  import { backClose } from '../ui/backclose.js';
  import { shrinkImage } from '../photo.js';
  import PhotoPick from '../ui/PhotoPick.svelte';
  import { postcardFacts, fitLine } from './tourlernen.js';
  import { X, Send, Download, Image as ImageIcon } from '@lucide/svelte';
  import '../bikes/velo-dlg.css';

  let { trip, onclose } = $props();
  const ridesQ = liveQuery(() => db.rides.where('tripId').equals(trip.id).toArray());
  const facts = $derived(postcardFacts(trip, $ridesQ ?? []));

  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });

  let photo = $state('');
  let busy = $state(false);
  let msg = $state('');
  let url = $state('');
  let blob = null;

  async function onfile(file) {
    busy = true;
    msg = '';
    try {
      photo = await shrinkImage(file, 1400, 0.85);
    } catch (e) {
      msg = e?.message ?? String(e);
    }
    busy = false;
  }
  const loadImg = (src) => new Promise((ok, no) => {
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = no;
    im.src = src;
  });
  const css = (name, fallback) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

  async function draw() {
    const W = 1080;
    const H = 1350;
    const TOP = 780;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    const brand = css('--brand', '#4a7360');
    const ink = css('--ink', '#1d2621');
    const ink2 = css('--ink-2', '#4b5650');
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, W, H);
    // top: the photo (cover), else a calm field with the route large
    if (photo) {
      const im = await loadImg(photo);
      const k = Math.max(W / im.width, TOP / im.height);
      const w = im.width * k;
      const h = im.height * k;
      g.drawImage(im, (W - w) / 2, (TOP - h) / 2, w, h);
    } else {
      g.fillStyle = brand;
      g.globalAlpha = 0.12;
      g.fillRect(0, 0, W, TOP);
      g.globalAlpha = 1;
      line(g, fitLine(trip.route?.line ?? [], 120, 100, W - 240, TOP - 200), brand, 10);
    }
    // bottom: name, date, numbers, the small line
    const font = (w, px) => `${w} ${px}px Inter, system-ui, sans-serif`;
    g.fillStyle = ink;
    g.font = font(700, 58);
    g.fillText(fit(g, trip.title ?? '', W - 380), 64, TOP + 96);
    g.fillStyle = ink2;
    g.font = font(400, 34);
    const when = trip.startDate ? new Date(`${trip.startDate}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    g.fillText(when, 64, TOP + 150);
    const stats = [
      facts.km != null ? [num(facts.km), 'km'] : null,
      facts.gainM != null ? [num(facts.gainM), t('m up')] : null,
      facts.hours != null ? [num(facts.hours), 'h'] : null,
      [String(facts.days), facts.days === 1 ? t('day') : t('days')],
    ].filter(Boolean);
    stats.forEach(([v, u], i) => {
      const x = 64 + i * 165;
      g.fillStyle = ink;
      g.font = font(700, 54);
      g.fillText(v, x, TOP + 300);
      g.fillStyle = ink2;
      g.font = font(400, 30);
      g.fillText(u, x, TOP + 344);
    });
    if (photo) line(g, fitLine(trip.route?.line ?? [], W - 300, TOP + 50, 240, 240), brand, 6);
    g.fillStyle = brand;
    g.fillRect(0, H - 24, W, 24);
    blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.9));
    if (url) URL.revokeObjectURL(url);
    url = blob ? URL.createObjectURL(blob) : '';
  }
  function line(g, pts, color, width) {
    if (pts.length < 2) return;
    g.strokeStyle = color;
    g.lineWidth = width;
    g.lineJoin = 'round';
    g.lineCap = 'round';
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.stroke();
  }
  function fit(g, text, max) {
    let s = String(text);
    while (s.length > 3 && g.measureText(s).width > max) s = s.slice(0, -2);
    return s === String(text) ? s : `${s.trimEnd()}…`;
  }
  $effect(() => {
    void photo;
    void facts;
    draw().catch(() => (msg = t('The picture could not be made here.')));
  });
  $effect(() => () => url && URL.revokeObjectURL(url));

  const fileName = $derived(`${String(trip.title ?? 'tour').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'tour'}.jpg`);
  async function share() {
    msg = '';
    if (!blob) return;
    const file = new File([blob], fileName, { type: 'image/jpeg' });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: trip.title ?? '' });
        return;
      }
    } catch (e) {
      if (e?.name === 'AbortError') return;
    }
    msg = t('Sharing a picture does not work here. Use «Save» and send it yourself.');
  }
</script>

<dialog class="sheet vdlg from-below" bind:this={dialog} use:backClose {onclose} aria-labelledby="pc-h" data-postcard>
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="pc-h"><ImageIcon size={20} aria-hidden="true" />&nbsp;{t('Tour picture')}</h2>
      <p class="vd-sub">{t('Made on this device. Add a photo if you like; then share it.')}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  {#if url}<img class="pv" src={url} alt={t('Postcard of {title}', { title: trip.title ?? '' })} data-postcard-img />{/if}
  <div class="pick"><PhotoPick {onfile} {busy} has={!!photo} /></div>
  <p class="tp-small" role="status">{msg}</p>
  <div class="vd-foot">
    {#if url}<a class="btn" href={url} download={fileName} data-postcard-save><Download size={16} aria-hidden="true" />{t('Save')}</a>{/if}
    <button type="button" class="btn hi" onclick={share} disabled={!url} data-postcard-share><Send size={16} aria-hidden="true" />{t('Share')}</button>
  </div>
</dialog>

<style>
  .pv {
    display: block;
    width: 100%;
    max-width: 360px;
    margin: 0 auto 12px;
    border-radius: 12px;
    box-shadow: 0 4px 16px var(--shadow);
  }
  .pick {
    margin: 8px 0;
  }
  .vd-foot .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
</style>
