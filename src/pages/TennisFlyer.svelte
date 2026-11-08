<script>
  /**
   * Tennis › Flyer (#/me/tennis/flyer; Noah 05.11.2026 «1a 2a+b 3a 4a», 07.11.2026 «ok Flyer», «modular ja»): a flyer for
   * a lesson offer, made on this device. The content is a set of building blocks (header, photo, title, table, levels,
   * cards, trainer, free places, own text, sign-up band): each one on or off, movable with arrows and by dragging, and
   * every text comes from the offer and can be overwritten. Three formats (16:9, A4 portrait, square), German and
   * English, one row per level or one flyer per level. The QR code leads to the sign-up page of the offer. The photo can be
   * swapped (gallery, camera or file) and stays on this device; the picture is shared or saved, and a prepared mail has the
   * customers in Bcc. The app sends nothing itself.
   */
  import { onDestroy } from 'svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import TennisTabs from '../lib/booking/TennisTabs.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import PhotoPick from '../lib/ui/PhotoPick.svelte';
  import SortArrows from '../lib/ui/SortArrows.svelte';
  import SortGrip from '../lib/ui/SortGrip.svelte';
  import { sortable } from '../lib/ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../lib/ui/ask.js';
  import { shrinkImage } from '../lib/photo.js';
  import { t, tn, locale } from '../lib/i18n.svelte.js';
  import { localDay } from '../lib/localday.js';
  import { OFFERS_KEY } from '../lib/booking/client.js';
  import { listCustomers } from '../lib/booking/customers.js';
  import {
    FLYERS_KEY, PHOTO_KEY, ARTS, FORMATS, LANGS, BLOCKS, TABLE_ROWS, CARDS, WORDS, newConfig, normalizeConfig, stepBlock, dragBlock, step, moveTo, levelFromOffer, normalizeLevel, buildModel, variantsOf, countImages, fileNameOf,
    mailText, mailtoHref, emailsOf, emptyPhotos, addPhoto, removePhoto, currentPhoto, photoRect, templateFrom, applyTemplate,
  } from '../lib/booking/flyer.js';
  import { drawFlyer, loadImage } from '../lib/booking/flyerdraw.js';
  import { qrMatrix } from '../lib/pay/qrmatrix.js';
  import { Plus, Trash2, Download, Send, Mail, Link2, Image as ImageIcon, FileImage } from '@lucide/svelte';
  import '../lib/ich/ich.css';

  let { offer = '' } = $props();
  const today = localDay();

  /* ---------- the data ---------- */
  const offersQ = liveQuery(async () => (await db.settings.get(OFFERS_KEY))?.value ?? []);
  const storeQ = liveQuery(async () => (await db.settings.get(FLYERS_KEY))?.value ?? { byOffer: {}, templates: [] });
  const photosQ = liveQuery(async () => (await db.settings.get(PHOTO_KEY))?.value ?? emptyPhotos());
  const customersQ = liveQuery(() => listCustomers());
  const entries = $derived(($offersQ ?? []).filter((e) => (e.offer?.kind ?? 'tennis') === 'tennis').map((e) => ({ id: e.id, offer: e.offer })));
  const templates = $derived($storeQ?.templates ?? []);
  const photos = $derived($photosQ ?? emptyPhotos());
  const emails = $derived(emailsOf($customersQ ?? []));
  const ready = $derived($offersQ !== undefined && $storeQ !== undefined && $photosQ !== undefined);

  let offerId = $state('');
  $effect(() => {
    if (!ready || !entries.length) return;
    if (!entries.some((e) => e.id === offerId)) offerId = entries.some((e) => e.id === offer) ? offer : entries[0].id;
  });
  const entry = $derived(entries.find((e) => e.id === offerId) ?? null);

  let cfg = $state(null);
  let loadedFor = '';
  $effect(() => {
    if (!ready || !entry || loadedFor === offerId) return;
    loadedFor = offerId;
    const saved = $storeQ?.byOffer?.[offerId];
    if (saved) cfg = normalizeConfig({ ...saved, offerId });
    else {
      const c = newConfig('group');
      c.offerId = offerId;
      c.levels = [levelFromOffer(entry, today)];
      cfg = c;
    }
  });

  async function writeStore(fn) {
    const cur = (await db.settings.get(FLYERS_KEY))?.value ?? { byOffer: {}, templates: [] };
    const next = fn({ byOffer: { ...(cur.byOffer ?? {}) }, templates: [...(cur.templates ?? [])] });
    await db.settings.put({ key: FLYERS_KEY, value: JSON.parse(JSON.stringify(next)) });
  }
  let timer = null;
  let dirtyFor = '';
  function flush() {
    if (!timer) return;
    clearTimeout(timer);
    timer = null;
    const id = dirtyFor;
    const snap = $state.snapshot(cfg);
    if (id && snap) writeStore((s) => ({ ...s, byOffer: { ...s.byOffer, [id]: snap } }));
  }
  /** Changes the configuration and saves it a moment later. */
  function edit(fn) {
    if (!cfg) return;
    fn(cfg);
    dirtyFor = offerId;
    clearTimeout(timer);
    timer = setTimeout(flush, 350);
  }
  onDestroy(flush);

  /* ---------- texts, in the language chosen for editing ---------- */
  let editLangSel = $state('de');
  const editLang = $derived(cfg?.langs.includes(editLangSel) ? editLangSel : (cfg?.langs[0] ?? 'de'));
  const em = $derived(cfg && entry ? buildModel(cfg, entries, editLang, { today }) : null);
  const txt = (k) => cfg?.texts?.[editLang]?.[k] ?? '';
  const setTxt = (k, v) => edit((c) => ((c.texts[editLang] ??= {}), (c.texts[editLang][k] = v)));
  const auto = (k) => em?.auto?.[k] ?? '';

  const blockName = (id) =>
    ({ top: t('Header'), photo: t('Photo with badge'), title: t('Title and subtitle'), table: t('Table: when, time, where, dates'), levels: t('Levels'), cards: t('Info cards'), trainer: t('Trainer'), free: t('Deadline and free places'), cta: t('Sign-up band with QR code') })[id] ?? id;
  const blockHint = (id) =>
    ({ top: t('Target group on the left, a short note on the right.'), photo: t('Your own photo, with a badge such as «from 6 years».'), levels: t('One row per level: day, time, place and price from your offers.'), cta: t('Button, QR code to the sign-up page, address and contact.') })[id] ?? '';
  const rowName = (k) => ({ when: t('When'), time: t('Time|flyer'), where: t('Where'), duration: t('Dates|flyer') })[k];
  const cardName = (k) => ({ gather: t('Meeting point|flyer'), pickup: t('Pick-up|flyer'), cost: t('Cost|flyer'), rain: t('Rain rule'), bring: t('Bring') })[k];
  const cardHint = (k) => ({ gather: t('e.g. 15:45 at the gate'), pickup: t('e.g. from 17:15 at the schoolyard'), rain: t('e.g. In the hall or cancelled; we tell you by 14:00'), bring: t('e.g. sports shoes, a drink') })[k] ?? '';
  const dayNames = Array.from({ length: 7 }, (_, i) => new Date(`2026-11-0${2 + i}T12:00:00`).toLocaleDateString(locale(), { weekday: 'long' }));

  const blocks = $derived(cfg?.blocks ?? []);
  const flow = $derived(blocks.filter((b) => !BLOCKS.find((x) => x.id === b.id)?.fixed));
  const moveBlocks = (next) => edit((c) => (c.blocks = next));
  const toggleBlock = (id) => edit((c) => (c.blocks = c.blocks.map((b) => (b.id === id ? { ...b, on: !b.on } : b))));
  const isOn = (id) => !!blocks.find((b) => b.id === id)?.on;

  /* ---------- delete with a question and Undo ---------- */
  async function drop({ title, text, name, run, undo }) {
    const answer = await askDelete({ title, text, label: t('Delete') });
    if (answer !== 'delete') return;
    await deleteWithUndo({ run, undo, text: t('«{name}» deleted.', { name }), name });
  }
  const snapshotCfg = () => $state.snapshot(cfg);
  const restoreCfg = (saved) => edit((c) => Object.assign(c, saved));

  /* ---------- levels ---------- */
  let addFrom = $state('');
  const addLevelFrom = (id) => {
    const e = entries.find((x) => x.id === id);
    if (e) edit((c) => c.levels.push(levelFromOffer(e, today)));
    addFrom = '';
  };
  const addLevel = () => edit((c) => c.levels.push(normalizeLevel({ name: t('New level') })));
  const stepLevel = (id, dir) => edit((c) => (c.levels = step(c.levels, id, dir)));
  function dropLevel(l) {
    return drop({ title: t('Delete «{name}»?', { name: l.name || t('this level') }), text: t('The level leaves the flyer. Your offer stays as it is.'), name: l.name || t('Level'), run: async () => { const s = snapshotCfg(); edit((c) => (c.levels = c.levels.filter((x) => x.id !== l.id))); return s; }, undo: async (s) => restoreCfg(s) });
  }

  /* ---------- own cards and own texts ---------- */
  const addCard = () => edit((c) => c.ownCards.push({ id: crypto.randomUUID(), label: t('Note'), text: '', on: true }));
  const addText = () => edit((c) => c.custom.push({ id: crypto.randomUUID(), title: '', text: '', on: true }));
  const dropCard = (x) => drop({ title: t('Delete «{name}»?', { name: x.label || t('this card') }), text: t('The card leaves the flyer.'), name: x.label || t('Card'), run: async () => { const s = snapshotCfg(); edit((c) => (c.ownCards = c.ownCards.filter((y) => y.id !== x.id))); return s; }, undo: async (s) => restoreCfg(s) });
  const dropText = (x) => drop({ title: t('Delete «{name}»?', { name: x.title || t('this text') }), text: t('The text leaves the flyer.'), name: x.title || t('Text'), run: async () => { const s = snapshotCfg(); edit((c) => (c.custom = c.custom.filter((y) => y.id !== x.id))); return s; }, undo: async (s) => restoreCfg(s) });

  /* ---------- kind, languages, formats ---------- */
  const setArt = (key) =>
    edit((c) => {
      const f = normalizeConfig({ ...newConfig(key), offerId: c.offerId, levels: c.levels, langs: c.langs, formats: c.formats, texts: { de: {}, en: {} }, deadline: c.deadline, spots: c.spots, contact: c.contact, oneEach: c.oneEach });
      Object.assign(c, f);
    });
  const toggleIn = (list, key) => {
    const next = list.includes(key) ? list.filter((k) => k !== key) : [...list, key];
    return next.length ? next : list;
  };

  /* ---------- the photo (stays on this device) ---------- */
  let photoBusy = $state(false);
  let photoMsg = $state('');
  let photoTimer = null;
  const putPhotos = (next) => db.settings.put({ key: PHOTO_KEY, value: JSON.parse(JSON.stringify(next)) });
  async function onfile(file) {
    photoBusy = true;
    photoMsg = '';
    try {
      const src = await shrinkImage(file, 1600, 0.85);
      await putPhotos(addPhoto(photos, src));
    } catch (e) {
      photoMsg = e?.message ?? String(e);
    }
    photoBusy = false;
  }
  const pickPhoto = (id) => putPhotos({ ...photos, current: id, fx: 0.5, fy: 0.5, zoom: 1 });
  const dropPhoto = (p) => drop({ title: t('Delete this photo?'), text: t('The photo leaves this device. The flyers show the next photo or none.'), name: t('Photo'), run: async () => { const s = photos; await putPhotos(removePhoto(photos, p.id)); return s; }, undo: (s) => putPhotos(s) });
  function setCrop(patch) {
    const next = { ...photos, ...patch };
    clearTimeout(photoTimer);
    photoTimer = setTimeout(() => putPhotos(next), 250);
    liveCrop = { fx: next.fx, fy: next.fy, zoom: next.zoom };
  }
  let liveCrop = $state(null);
  $effect(() => {
    void photos;
    liveCrop = null;
  });
  const crop = $derived(liveCrop ?? { fx: photos.fx, fy: photos.fy, zoom: photos.zoom });
  let cropCanvas = $state();
  let drag = null;
  async function drawCrop() {
    const im = await loadImage(currentPhoto(photos)?.src);
    if (!cropCanvas || !im) return;
    cropCanvas.width = 480;
    cropCanvas.height = 320;
    const s = photoRect(im.width, im.height, 480, 320, crop.fx, crop.fy, crop.zoom);
    cropCanvas.getContext('2d').drawImage(im, s.sx, s.sy, s.sw, s.sh, 0, 0, 480, 320);
  }
  $effect(() => {
    void crop.fx;
    void crop.fy;
    void crop.zoom;
    void currentPhoto(photos);
    void cropCanvas;
    drawCrop();
  });
  const cropDown = (e) => {
    drag = { x: e.clientX, y: e.clientY, fx: crop.fx, fy: crop.fy };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const cropMove = (e) => {
    if (!drag) return;
    const r = e.currentTarget.getBoundingClientRect();
    const z = crop.zoom;
    const fx = Math.min(1, Math.max(0, drag.fx - (e.clientX - drag.x) / (r.width * z) * 0.9));
    const fy = Math.min(1, Math.max(0, drag.fy - (e.clientY - drag.y) / (r.height * z) * 0.9));
    setCrop({ fx, fy });
  };
  const cropUp = () => (drag = null);

  /* ---------- the preview ---------- */
  let pvFormat = $state('169');
  let pvLang = $state('de');
  let pvVariant = $state('');
  const pvFormatKey = $derived(cfg?.formats.includes(pvFormat) ? pvFormat : (cfg?.formats[0] ?? '169'));
  const pvLangKey = $derived(cfg?.langs.includes(pvLang) ? pvLang : (cfg?.langs[0] ?? 'de'));
  const pvLevels = $derived(cfg?.oneEach ? cfg.levels.filter((l) => l.on) : []);
  const pvVariantKey = $derived(pvLevels.some((l) => l.id === pvVariant) ? pvVariant : (pvLevels[0]?.id ?? null));
  let canvas = $state();
  let note = $state('');
  let renderTok = 0;
  const qrCache = new Map();
  let imgCache = { src: '', im: null };
  async function qrFor(url) {
    if (!qrCache.has(url)) qrCache.set(url, await qrMatrix(url));
    return qrCache.get(url);
  }
  async function imageFor(src) {
    if (imgCache.src !== src) imgCache = { src, im: await loadImage(src) };
    return imgCache.im;
  }
  async function paint(target, fmt, snap, ents, lang, variant, ph) {
    const m = buildModel(snap, ents, lang, { variant, today });
    const qr = m.url && m.order.includes('cta') ? await qrFor(m.url) : null;
    const img = await imageFor(currentPhoto(ph)?.src);
    drawFlyer(target, fmt, m, { img, photo: { fx: ph.fx, fy: ph.fy, zoom: ph.zoom }, qr });
    return m;
  }
  $effect(() => {
    if (!cfg || !canvas || !entry) return;
    const snap = $state.snapshot(cfg);
    const ents = $state.snapshot(entries);
    const ph = { ...$state.snapshot(photos), fx: crop.fx, fy: crop.fy, zoom: crop.zoom };
    const fmt = FORMATS.find((f) => f.key === pvFormatKey);
    const lang = pvLangKey;
    const variant = pvVariantKey;
    const tok = ++renderTok;
    (async () => {
      const probe = document.createElement('canvas');
      await paint(probe, fmt, snap, ents, lang, variant, ph);
      if (tok !== renderTok || !canvas) return;
      canvas.width = probe.width;
      canvas.height = probe.height;
      canvas.getContext('2d').drawImage(probe, 0, 0);
    })().catch(() => (note = t('The picture could not be made here.')));
  });

  /* ---------- save, share, mail ---------- */
  let busy = $state(false);
  const count = $derived(cfg ? countImages(cfg) : 0);
  async function makeAll() {
    flush();
    const snap = $state.snapshot(cfg);
    const ents = $state.snapshot(entries);
    const out = [];
    for (const v of variantsOf(snap)) {
      for (const key of snap.formats) {
        const c = document.createElement('canvas');
        const m = await paint(c, FORMATS.find((f) => f.key === key), snap, ents, v.lang, v.variant, photos);
        const blob = await new Promise((ok) => c.toBlob(ok, 'image/png'));
        if (blob) out.push({ blob, name: fileNameOf(m, key, v.name) });
      }
    }
    return out;
  }
  async function saveAll() {
    busy = true;
    note = '';
    try {
      for (const f of await makeAll()) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(f.blob);
        a.download = f.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        await new Promise((r) => setTimeout(r, 250));
      }
      note = t('Saved. Look in your downloads or photos.');
    } catch {
      note = t('The picture could not be made here.');
    }
    busy = false;
  }
  async function shareAll() {
    busy = true;
    note = '';
    try {
      const files = (await makeAll()).map((f) => new File([f.blob], f.name, { type: 'image/png' }));
      if (navigator.canShare?.({ files })) await navigator.share({ files, title: em?.title ?? '' });
      else note = t('Sharing a picture does not work here. Use «Save» and send it yourself.');
    } catch (e) {
      if (e?.name !== 'AbortError') note = t('Sharing a picture does not work here. Use «Save» and send it yourself.');
    }
    busy = false;
  }
  const mailHref = $derived.by(() => {
    if (!cfg || !entry) return '#';
    const m = buildModel(cfg, entries, pvLangKey, { variant: pvVariantKey, today });
    return mailtoHref(mailText(m), emails);
  });
  const linkUrl = $derived(cfg && entry ? buildModel(cfg, entries, pvLangKey, { variant: pvVariantKey, today }).url : '');
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(linkUrl);
      note = t('Link copied.');
    } catch {
      note = linkUrl;
    }
  }

  /* ---------- templates ---------- */
  let tplName = $state('');
  async function saveTemplate() {
    if (!cfg) return;
    flush();
    const tpl = templateFrom(tplName.trim() || `${em?.title ?? ''}`.trim() || t('Template'), snapshotCfg());
    await writeStore((s) => ({ ...s, templates: [...s.templates, tpl] }));
    tplName = '';
  }
  const useTemplate = (tpl) => edit((c) => Object.assign(c, applyTemplate($state.snapshot(c), tpl), { offerId }));
  const renameTemplate = (tpl, name) => writeStore((s) => ({ ...s, templates: s.templates.map((x) => (x.id === tpl.id ? { ...x, name: name.trim() || x.name } : x)) }));
  const dropTemplate = (tpl) => drop({ title: t('Delete «{name}»?', { name: tpl.name }), text: t('The template leaves the list. Flyers you made with it stay as they are.'), name: tpl.name, run: async () => { await writeStore((s) => ({ ...s, templates: s.templates.filter((x) => x.id !== tpl.id) })); return tpl; }, undo: (saved) => writeStore((s) => ({ ...s, templates: [...s.templates, saved] })) });
</script>

{#snippet toggle(on, name, onclick)}
  <button type="button" class="tf-tg" class:on role="switch" aria-checked={on} aria-label={name} {onclick}><span></span></button>
{/snippet}

<div class="ich-page tf">
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Tennis'), href: '#/me/tennis' }]} title={t('Tennis flyer')} sub={t('A flyer for your lessons: pick the parts, add your photo, share it. Made on this device; the app sends nothing itself.')} />
  <TennisTabs current="flyer" />

  {#if ready && !entries.length}
    <Empty icon={FileImage} text={t('No lesson offer yet. A flyer takes its dates, places and prices from an offer.')} action={{ label: t('To your offers'), href: '#/me/tennis' }} />
  {:else if cfg && entry}
    <div class="tf-grid">
      <!-- the preview and sharing -->
      <aside class="tf-side">
        <section class="card tf-sec tf-prev" aria-labelledby="tf-hp" data-flyer-preview>
          <h2 id="tf-hp">{t('Preview')}</h2>
          <div class="tf-pvsel">
            {#if cfg.formats.length > 1}<Seg options={cfg.formats.map((k) => ({ key: k, name: k === '169' ? '16:9' : t(FORMATS.find((f) => f.key === k).label) }))} value={pvFormatKey} onchange={(k) => (pvFormat = k)} label={t('Format|flyer')} small />{/if}
            {#if cfg.langs.length > 1}<Seg options={cfg.langs.map((k) => ({ key: k, name: LANGS.find((l) => l.key === k).label }))} value={pvLangKey} onchange={(k) => (pvLang = k)} label={t('Language')} small />{/if}
            {#if pvLevels.length > 1}<Seg options={pvLevels.map((l) => ({ key: l.id, name: l.name || t('Level') }))} value={pvVariantKey} onchange={(k) => (pvVariant = k)} label={t('Level')} small />{/if}
          </div>
          <canvas class="tf-canvas" bind:this={canvas} role="img" aria-label={t('Preview of the flyer')} data-flyer-canvas></canvas>
          <div class="tf-act">
            <button type="button" class="btn hi" data-flyer-save disabled={busy} onclick={saveAll}><Download size={16} aria-hidden="true" />{tn(count, 'Save {n} picture', 'Save {n} pictures')}</button>
            <button type="button" class="btn" data-flyer-share disabled={busy} onclick={shareAll}><Send size={16} aria-hidden="true" />{t('Share')}</button>
            <a class="btn" href={mailHref} data-flyer-mail><Mail size={16} aria-hidden="true" />{t('Prepare e-mail')}</a>
            <button type="button" class="btn" data-flyer-link onclick={copyLink}><Link2 size={16} aria-hidden="true" />{t('Copy link')}</button>
          </div>
          <p class="muted">{emails.length ? tn(emails.length, 'The e-mail is prepared with {n} customer in Bcc, so nobody sees the others. You press send yourself.', 'The e-mail is prepared with {n} customers in Bcc, so nobody sees the others. You press send yourself.') : t('The e-mail is prepared without recipients: add them yourself in Bcc. Customers with an e-mail address are added automatically.')}</p>
          {#if note}<p class="muted" role="status" data-flyer-note>{note}</p>{/if}
        </section>
      </aside>
      <div class="tf-form">
        <!-- 1. offer and kind -->
        <section class="card tf-sec" aria-labelledby="tf-h1" data-flyer-kind>
          <h2 id="tf-h1">{t('Kind of flyer')}</h2>
          {#if entries.length > 1}
            <label class="lbl" for="tf-offer">{t('Offer')}</label>
            <select id="tf-offer" class="inp" value={offerId} onchange={(e) => { flush(); offerId = e.currentTarget.value; }}>{#each entries as e (e.id)}<option value={e.id}>{e.offer.title}</option>{/each}</select>
          {/if}
          <div class="tf-chips" role="group" aria-label={t('Kind of flyer')}>
            {#each ARTS as a (a.key)}<button type="button" class="tf-chip" class:on={cfg.art === a.key} aria-pressed={cfg.art === a.key} data-art={a.key} onclick={() => setArt(a.key)}>{t(a.label)}</button>{/each}
          </div>
          <p class="muted">{t('The kind sets the first title and which parts are on. You can change everything after.')}</p>
          {#if templates.length}
            <p class="lbl">{t('Templates')}</p>
            <div class="tf-chips">{#each templates as tpl (tpl.id)}<button type="button" class="tf-chip" data-tpl={tpl.id} onclick={() => useTemplate(tpl)}>{tpl.name}</button>{/each}</div>
          {/if}
        </section>

        <!-- 2. building blocks -->
        <section class="card tf-sec" aria-labelledby="tf-h2" data-flyer-blocks>
          <div class="tf-head">
            <h2 id="tf-h2">{t('Parts of the flyer')}</h2>
            {#if cfg.langs.length > 1}<Seg options={cfg.langs.map((k) => ({ key: k, name: LANGS.find((l) => l.key === k).label }))} value={editLang} onchange={(k) => (editLangSel = k)} label={t('Texts in')} small />{/if}
          </div>
          <p class="muted">{t('Switch parts on or off. Move the middle ones with the arrows or the handle. Texts come from your offer; write over them as you like.')}</p>

          <ul class="tf-list">
            <li data-block="top">
              <div class="tf-r"><span class="tf-nm"><b>{blockName('top')}</b><small>{blockHint('top')}</small></span>{@render toggle(isOn('top'), blockName('top'), () => toggleBlock('top'))}</div>
              {#if isOn('top')}
                <label class="lbl" for="tf-aud">{t('Target group')}</label><input id="tf-aud" class="inp" value={txt('audience')} oninput={(e) => setTxt('audience', e.currentTarget.value)} placeholder={t('e.g. Leisure offer for primary school')} />
                <label class="lbl" for="tf-hint">{t('Note on the right')}</label><input id="tf-hint" class="inp" value={txt('hint')} oninput={(e) => setTxt('hint', e.currentTarget.value)} placeholder={t('e.g. Single lessons on request')} />
              {/if}
            </li>
            <li data-block="photo">
              <div class="tf-r"><span class="tf-nm"><b>{blockName('photo')}</b><small>{blockHint('photo')}</small></span>{@render toggle(isOn('photo'), blockName('photo'), () => toggleBlock('photo'))}</div>
              {#if isOn('photo')}
                <label class="lbl" for="tf-badge">{t('Badge on the photo')}</label><input id="tf-badge" class="inp" value={txt('badge')} oninput={(e) => setTxt('badge', e.currentTarget.value)} placeholder={t('e.g. from 6 years (empty: no badge)')} />
              {/if}
            </li>
          </ul>

          <ul class="tf-list" use:sortable={{ onmove: (from, to) => moveBlocks(dragBlock(blocks, from, to)) }}>
            {#each flow as b, i (b.id)}
              <li data-sort-id={b.id} data-block={b.id} class:off={!b.on}>
                <div class="tf-r">
                  <SortGrip name={blockName(b.id)} onstep={(dir) => moveBlocks(stepBlock(blocks, b.id, dir))} />
                  <span class="tf-nm"><b>{blockName(b.id)}</b>{#if blockHint(b.id)}<small>{blockHint(b.id)}</small>{/if}</span>
                  <SortArrows name={blockName(b.id)} {i} n={flow.length} onstep={(dir) => moveBlocks(stepBlock(blocks, b.id, dir))} />
                  {@render toggle(b.on, blockName(b.id), () => toggleBlock(b.id))}
                </div>
                {#if b.on}
                  {#if b.id === 'title'}
                    <label class="lbl" for="tf-title">{t('Title')}</label><input id="tf-title" class="inp" value={txt('title')} oninput={(e) => setTxt('title', e.currentTarget.value)} placeholder={auto('title')} />
                    <label class="lbl" for="tf-sub">{t('Subtitle')}</label><input id="tf-sub" class="inp" value={txt('sub')} oninput={(e) => setTxt('sub', e.currentTarget.value)} placeholder={auto('sub')} />
                  {:else if b.id === 'table'}
                    <div class="tf-sub">
                      {#each TABLE_ROWS as k (k)}
                        <div class="tf-sr">
                          {@render toggle(cfg.rows[k], rowName(k), () => edit((c) => (c.rows[k] = !c.rows[k])))}
                          <label class="tf-sl" for={`tf-row-${k}`}>{rowName(k)}</label>
                          <input id={`tf-row-${k}`} class="inp" value={txt(k)} oninput={(e) => setTxt(k, e.currentTarget.value)} placeholder={auto(k)} disabled={!cfg.rows[k]} />
                        </div>
                      {/each}
                    </div>
                  {:else if b.id === 'levels'}
                    <p class="muted">{t('The rows are made below under «Levels».')}</p>
                  {:else if b.id === 'cards'}
                    <div class="tf-sub">
                      {#each CARDS as k (k)}
                        <div class="tf-sr">
                          {@render toggle(cfg.cardOn[k], cardName(k), () => edit((c) => (c.cardOn[k] = !c.cardOn[k])))}
                          <label class="tf-sl" for={`tf-card-${k}`}>{cardName(k)}</label>
                          <input id={`tf-card-${k}`} class="inp" value={txt(k)} oninput={(e) => setTxt(k, e.currentTarget.value)} placeholder={k === 'cost' ? auto('cost') : cardHint(k)} disabled={!cfg.cardOn[k]} />
                        </div>
                      {/each}
                      {#each cfg.ownCards as x (x.id)}
                        <div class="tf-sr own" data-own-card={x.id}>
                          {@render toggle(x.on, x.label, () => edit((c) => (c.ownCards = c.ownCards.map((y) => (y.id === x.id ? { ...y, on: !y.on } : y)))))}
                          <input class="inp lab" aria-label={t('Name of the card')} value={x.label} oninput={(e) => edit((c) => (c.ownCards = c.ownCards.map((y) => (y.id === x.id ? { ...y, label: e.currentTarget.value } : y))))} />
                          <input class="inp" aria-label={t('Text of the card')} value={x.text} oninput={(e) => edit((c) => (c.ownCards = c.ownCards.map((y) => (y.id === x.id ? { ...y, text: e.currentTarget.value } : y))))} />
                          <button type="button" class="btn sm" aria-label={t('Delete «{name}»?', { name: x.label })} onclick={() => dropCard(x)}><Trash2 size={16} aria-hidden="true" /></button>
                        </div>
                      {/each}
                      <button type="button" class="btn sm" data-add-card onclick={addCard}><Plus size={16} aria-hidden="true" />{t('Own card')}</button>
                    </div>
                  {:else if b.id === 'trainer'}
                    <label class="lbl" for="tf-tn">{t('Name')}</label><input id="tf-tn" class="inp" value={txt('trainerName')} oninput={(e) => setTxt('trainerName', e.currentTarget.value)} />
                    <label class="lbl" for="tf-tt">{t('Short text')}</label><textarea id="tf-tt" class="inp" rows="3" maxlength="400" value={txt('trainerText')} oninput={(e) => setTxt('trainerText', e.currentTarget.value)}></textarea>
                  {:else if b.id === 'free'}
                    <label class="lbl" for="tf-dl">{t('Sign up by')}</label><input id="tf-dl" class="inp" type="date" value={cfg.deadline} oninput={(e) => edit((c) => (c.deadline = e.currentTarget.value))} />
                    <label class="lbl" for="tf-sp">{t('Free places (empty: not shown)')}</label><input id="tf-sp" class="inp" inputmode="numeric" value={cfg.spots} oninput={(e) => edit((c) => (c.spots = e.currentTarget.value.replace(/\D/g, '')))} />
                  {/if}
                {/if}
              </li>
            {/each}
          </ul>

          <ul class="tf-list">
            <li data-block="cta">
              <div class="tf-r"><span class="tf-nm"><b>{blockName('cta')}</b><small>{blockHint('cta')}</small></span>{@render toggle(isOn('cta'), blockName('cta'), () => toggleBlock('cta'))}</div>
              {#if isOn('cta')}
                <label class="lbl" for="tf-btn">{t('Button')}</label><input id="tf-btn" class="inp" value={txt('button')} oninput={(e) => setTxt('button', e.currentTarget.value)} placeholder={auto('button')} />
                <label class="lbl" for="tf-note">{t('Line under the button')}</label><input id="tf-note" class="inp" value={txt('note')} oninput={(e) => setTxt('note', e.currentTarget.value)} placeholder={auto('note')} />
                <label class="lbl" for="tf-contact">{t('Contact (e-mail or phone)')}</label><input id="tf-contact" class="inp" value={cfg.contact} oninput={(e) => edit((c) => (c.contact = e.currentTarget.value))} />
                <p class="muted">{t('The QR code and the address lead to the sign-up page of your offer. The request arrives like every request.')}</p>
              {/if}
            </li>
          </ul>

          <h3 class="tf-h3">{t('Own texts')}</h3>
          {#each cfg.custom as x (x.id)}
            <div class="tf-own" data-own-text={x.id}>
              <div class="tf-r">
                {@render toggle(x.on, x.title || t('Text'), () => edit((c) => (c.custom = c.custom.map((y) => (y.id === x.id ? { ...y, on: !y.on } : y)))))}
                <input class="inp" aria-label={t('Heading')} placeholder={t('Heading')} value={x.title} oninput={(e) => edit((c) => (c.custom = c.custom.map((y) => (y.id === x.id ? { ...y, title: e.currentTarget.value } : y))))} />
                <button type="button" class="btn sm" aria-label={t('Delete «{name}»?', { name: x.title })} onclick={() => dropText(x)}><Trash2 size={16} aria-hidden="true" /></button>
              </div>
              <textarea class="inp" rows="2" maxlength="400" aria-label={t('Text')} value={x.text} oninput={(e) => edit((c) => (c.custom = c.custom.map((y) => (y.id === x.id ? { ...y, text: e.currentTarget.value } : y))))}></textarea>
            </div>
          {/each}
          <button type="button" class="btn sm" data-add-text onclick={addText}><Plus size={16} aria-hidden="true" />{t('Own text')}</button>
          <p class="muted">{t('Own texts show in every language as you wrote them.')}</p>
        </section>

        <!-- 3. levels -->
        <section class="card tf-sec" aria-labelledby="tf-h3" data-flyer-levels>
          <h2 id="tf-h3">{t('Levels')}</h2>
          <p class="muted">{t('One row per level with day, time, place and price. They come from your offers; change them here.')}</p>
          {#if !cfg.levels.length}<p class="muted">{t('No level yet. Add one from an offer or by hand.')}</p>{/if}
          <ul class="tf-list" use:sortable={{ onmove: (from, to) => edit((c) => (c.levels = moveTo(c.levels, from, to))) }}>
            {#each cfg.levels as l, i (l.id)}
              <li data-sort-id={l.id} data-level={l.id} class:off={!l.on}>
                <div class="tf-r">
                  <SortGrip name={l.name || t('Level')} onstep={(dir) => stepLevel(l.id, dir)} />
                  <input class="inp tf-lvname" aria-label={t('Name of the level')} value={l.name} oninput={(e) => edit((c) => (c.levels[i].name = e.currentTarget.value))} />
                  <SortArrows name={l.name || t('Level')} {i} n={cfg.levels.length} onstep={(dir) => stepLevel(l.id, dir)} />
                  {@render toggle(l.on, l.name || t('Level'), () => edit((c) => (c.levels[i].on = !c.levels[i].on)))}
                </div>
                <div class="tf-lv">
                  <select class="inp" aria-label={t('Weekday')} value={l.day === '' ? '' : String(l.day)} onchange={(e) => edit((c) => (c.levels[i].day = e.currentTarget.value === '' ? '' : Number(e.currentTarget.value)))}><option value="">{t('No day')}</option>{#each dayNames as d, k (k)}<option value={String(k)}>{d}</option>{/each}</select>
                  <input class="inp" aria-label={t('Time')} placeholder="15:45–17:15" value={l.time} oninput={(e) => edit((c) => (c.levels[i].time = e.currentTarget.value))} />
                  <input class="inp" aria-label={t('Place')} placeholder={t('Place')} value={l.place} oninput={(e) => edit((c) => (c.levels[i].place = e.currentTarget.value))} />
                  <input class="inp" aria-label={t('Price in CHF')} inputmode="decimal" placeholder="CHF" value={l.price} oninput={(e) => edit((c) => (c.levels[i].price = e.currentTarget.value))} />
                  <button type="button" class="btn sm" aria-label={t('Delete «{name}»?', { name: l.name })} onclick={() => dropLevel(l)}><Trash2 size={16} aria-hidden="true" /></button>
                </div>
              </li>
            {/each}
          </ul>
          <div class="tf-add">
            <button type="button" class="btn sm" data-add-level onclick={addLevel}><Plus size={16} aria-hidden="true" />{t('Level by hand')}</button>
            {#if entries.length}
              <label class="tf-hide" for="tf-addfrom">{t('Level from an offer')}</label>
              <select id="tf-addfrom" class="inp sm" value={addFrom} onchange={(e) => addLevelFrom(e.currentTarget.value)}><option value="">{t('Level from an offer…')}</option>{#each entries as e (e.id)}<option value={e.id}>{e.offer.title}</option>{/each}</select>
            {/if}
          </div>
          <div class="tf-sw"><span><b>{t('One flyer per level')}</b><small>{t('Each level gets its own picture and its own sign-up link.')}</small></span>{@render toggle(cfg.oneEach, t('One flyer per level'), () => edit((c) => (c.oneEach = !c.oneEach)))}</div>
        </section>

        <!-- 4. language and format -->
        <section class="card tf-sec" aria-labelledby="tf-h4" data-flyer-format>
          <h2 id="tf-h4">{t('Language and format')}</h2>
          <p class="lbl">{t('Language')}</p>
          <div class="tf-chips" role="group" aria-label={t('Language')}>{#each LANGS as l (l.key)}<button type="button" class="tf-chip" class:on={cfg.langs.includes(l.key)} aria-pressed={cfg.langs.includes(l.key)} data-lang={l.key} onclick={() => edit((c) => (c.langs = toggleIn(c.langs, l.key)))}>{l.label}</button>{/each}</div>
          <p class="lbl">{t('Format|flyer')}</p>
          <div class="tf-chips" role="group" aria-label={t('Format|flyer')}>{#each FORMATS as f (f.key)}<button type="button" class="tf-chip" class:on={cfg.formats.includes(f.key)} aria-pressed={cfg.formats.includes(f.key)} data-format={f.key} onclick={() => edit((c) => (c.formats = toggleIn(c.formats, f.key)))}>{f.key === '169' ? '16:9' : t(f.label)}</button>{/each}</div>
          <p class="muted">{t('16:9 for screens, A4 portrait for printing, square for WhatsApp and social media.')}</p>
        </section>

        <!-- 5. photo -->
        <section class="card tf-sec" aria-labelledby="tf-h5" data-flyer-photo>
          <h2 id="tf-h5"><ImageIcon size={18} aria-hidden="true" /> {t('Photo')}</h2>
          <p class="muted">{t('Choose a photo from your gallery or take one; on a computer choose a file. It is made smaller and stays on this device: not in the backup and not on a server.')}</p>
          <PhotoPick {onfile} busy={photoBusy} has={!!currentPhoto(photos)} big camera="Take photo" choose="Choose photo" again="Other photo" />
          {#if photoMsg}<p class="err" role="alert">{photoMsg}</p>{/if}
          {#if photos.items.length}
            <div class="tf-thumbs" role="group" aria-label={t('Your photos')}>
              {#each photos.items as p (p.id)}
                <span class="tf-th" class:on={photos.current === p.id}>
                  <button type="button" class="tf-thb" aria-pressed={photos.current === p.id} aria-label={t('Use this photo')} data-photo={p.id} onclick={() => pickPhoto(p.id)}><img src={p.src} alt="" /></button>
                  <button type="button" class="tf-thx" aria-label={t('Delete this photo?')} onclick={() => dropPhoto(p)}><Trash2 size={14} aria-hidden="true" /></button>
                </span>
              {/each}
            </div>
            <p class="lbl">{t('Cut-out')}</p>
            <canvas class="tf-crop" bind:this={cropCanvas} aria-label={t('The photo cut-out: drag to move')} onpointerdown={cropDown} onpointermove={cropMove} onpointerup={cropUp} onpointercancel={cropUp} data-crop></canvas>
            <label class="lbl" for="tf-zoom">{t('Bigger')}</label>
            <input id="tf-zoom" type="range" min="1" max="3" step="0.05" value={crop.zoom} oninput={(e) => setCrop({ zoom: Number(e.currentTarget.value) })} />
            <p class="muted">{t('Drag the photo to move it, use the slider to zoom. The cut-out counts for all formats.')}</p>
          {/if}
        </section>

        <!-- 6. templates -->
        <section class="card tf-sec" aria-labelledby="tf-h6" data-flyer-templates>
          <h2 id="tf-h6">{t('Templates')}</h2>
          <p class="muted">{t('Keep the parts and texts of this flyer as a template; the next flyer starts from it in one tap.')}</p>
          <div class="tf-add"><input class="inp" aria-label={t('Name of the template')} placeholder={t('Name of the template')} bind:value={tplName} /><button type="button" class="btn sm" data-tpl-save onclick={saveTemplate}>{t('Save as template')}</button></div>
          {#each templates as tpl (tpl.id)}
            <div class="tf-r" data-tpl-row={tpl.id}>
              <input class="inp" aria-label={t('Name of the template')} value={tpl.name} onchange={(e) => renameTemplate(tpl, e.currentTarget.value)} />
              <button type="button" class="btn sm" onclick={() => useTemplate(tpl)}>{t('Use')}</button>
              <button type="button" class="btn sm" aria-label={t('Delete «{name}»?', { name: tpl.name })} onclick={() => dropTemplate(tpl)}><Trash2 size={16} aria-hidden="true" /></button>
            </div>
          {/each}
        </section>

        <section class="card tf-sec" aria-labelledby="tf-hn" data-flyer-next>
          <h2 id="tf-hn">{t('Next')}</h2>
          <p class="muted">{t('When the flyer is out, requests arrive under your offers and in the customer list.')}</p>
          <p class="tf-links"><a href={`#/me/offers/${offerId}`}>{t('To the offer')}</a> · <a href="#/me/tennis/customers">{t('To the customers')}</a></p>
        </section>
      </div>

    </div>
  {/if}
</div>

<style>
  .tf-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; align-items: start; }
  @media (min-width: 980px) {
    .tf-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
    .tf-form { grid-column: 1; grid-row: 1; }
    .tf-side { grid-column: 2; grid-row: 1; position: sticky; top: 12px; }
  }
  .tf-form, .tf-side { display: grid; gap: 16px; min-width: 0; }
  .tf-sec, .tf-list > li, .tf-sub, .tf-own { grid-template-columns: minmax(0, 1fr); }
  .tf-sec { display: grid; gap: 8px; min-width: 0; }
  .tf-sec :global(.inp), .tf-sec select { max-width: 100%; min-width: 0; box-sizing: border-box; }
  .tf-sec h2 { margin: 0; font-size: var(--fs-section); }
  .tf-h3 { margin: 12px 0 0; font-size: var(--fs-body); }
  .tf-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
  .tf-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .tf-chip { min-height: 40px; padding: 6px 14px; border: 1px solid var(--line); border-radius: 99px; background: var(--paper); color: var(--ink); font: inherit; font-weight: 500; cursor: pointer; }
  .tf-chip.on { background: var(--brand); border-color: var(--brand); color: var(--brand-ink); font-weight: 600; }
  .tf-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .tf-list > li { border: 1px solid var(--line); border-radius: 12px; padding: 10px 12px; display: grid; gap: 6px; background: var(--paper); }
  .tf-list > li.off { opacity: 0.65; }
  .tf-r { display: flex; align-items: center; gap: 10px; }
  .tf-nm { flex: 1; min-width: 0; display: grid; }
  .tf-nm small, .tf-sw small { color: var(--ink-2); font-size: var(--fs-small); }
  .tf-tg { flex: none; width: 46px; height: 28px; border-radius: 99px; border: 0; background: var(--line); position: relative; cursor: pointer; padding: 0; }
  .tf-tg span { position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%; background: var(--paper); transition: left 0.15s; }
  .tf-tg.on { background: var(--brand); }
  .tf-tg.on span { left: 21px; }
  .tf-sub { display: grid; gap: 6px; margin-left: 8px; padding-left: 10px; border-left: 3px solid var(--line); }
  .tf-sr { display: grid; grid-template-columns: auto 7.5em 1fr; gap: 8px; align-items: center; }
  .tf-sr.own { grid-template-columns: auto 8em 1fr auto; }
  .tf-sl { font-weight: 600; font-size: var(--fs-small); }
  .tf-own { display: grid; gap: 6px; border: 1px solid var(--line); border-radius: 12px; padding: 10px 12px; }
  .tf-lv { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
  .tf-lv .btn { justify-self: start; }
  .tf-lvname { flex: 1; min-width: 0; font-weight: 600; }
  .tf-add { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .tf-sw { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding-top: 6px; }
  .tf-sw span:first-child { display: grid; }
  .tf-thumbs { display: flex; flex-wrap: wrap; gap: 8px; }
  .tf-th { position: relative; width: 84px; height: 62px; border-radius: 8px; border: 2px solid var(--line); overflow: hidden; }
  .tf-th.on { border-color: var(--brand); }
  .tf-thb { all: unset; display: block; width: 100%; height: 100%; cursor: pointer; }
  .tf-thb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .tf-thx { position: absolute; top: 2px; right: 2px; width: 26px; height: 26px; display: grid; place-items: center; border: 0; border-radius: 50%; background: var(--paper); color: var(--ink); cursor: pointer; padding: 0; }
  .tf-crop { width: 100%; max-width: 480px; aspect-ratio: 3 / 2; border-radius: 12px; touch-action: none; cursor: grab; background: var(--line); }
  .tf-canvas { width: 100%; height: auto; border-radius: 10px; border: 1px solid var(--line); background: var(--paper); display: block; }
  .tf-pvsel { display: flex; flex-wrap: wrap; gap: 8px; }
  .tf-act { display: flex; flex-wrap: wrap; gap: 8px; }
  .tf-act .btn { display: inline-flex; align-items: center; gap: 6px; }
  .tf-links { margin: 0; }
  .tf-hide { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  @media (max-width: 520px) {
    .tf-sr { grid-template-columns: auto 1fr; }
    .tf-sr .inp { grid-column: 1 / -1; }
    .tf-sr.own { grid-template-columns: auto 1fr auto; }
    .tf-sr.own .inp.lab { grid-column: auto; }
  }
</style>
