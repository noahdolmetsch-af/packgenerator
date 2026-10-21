<script>
  /**
   * «Bilder in der App» 3a + 4a (Noah 20.10.2026): several photos for one thing (a problem with a bike).
   * Phone: the camera opens at once; also from the gallery, several at once. Each photo can be cut
   * («Zuschneiden») or taken away. «Als PDF» makes one PDF of all photos in Ich › Dokumente; the photos
   * stay photos as well. photos: bindable list of JPEG data URLs; docId: bindable id of the PDF made.
   * Paket NE 1146 (Noah 20.10.2026 «1b»): «Draw» on each photo; inks: bindable map of the drawings (ink.js).
   * onchange(photos, docId, inks).
   */
  import { Crop, X, FileText, ImagePlus, ChevronRight } from '@lucide/svelte';
  import CameraButton from '../ui/CameraButton.svelte';
  import CropSheet from './CropSheet.svelte';
  import Lightbox from '../ui/Lightbox.svelte';
  import DrawOn from '../draw/DrawOn.svelte';
  import { pruneInks } from '../draw/ink.js';
  import { shrinkImage, PROBLEM_PHOTOS } from '../photo.js';
  import { photosToPdf } from './bilder.js';
  import { DOCS_HASH } from '../docs/client.svelte.js';
  import { t, tn } from '../i18n.svelte.js';

  let { photos = $bindable([]), docId = $bindable(null), inks = $bindable(undefined), max = PROBLEM_PHOTOS, pdfName = '', onchange = null, label = 'Photos (optional)', sub = 'e.g. of the damage' } = $props();

  let reading = $state(false);
  let making = $state(false);
  let msg = $state('');
  let cropAt = $state(null);
  let shown = $state(null);

  const set = (list, nextInks = inks) => {
    photos = list;
    inks = pruneInks(nextInks, list); // a cut or removed photo loses its drawing
    docId = null; // the PDF no longer shows the same photos
    onchange?.(list, null, inks);
  };

  async function add(event) {
    const files = [...(event.currentTarget.files ?? [])];
    event.currentTarget.value = '';
    if (!files.length) return;
    reading = true;
    msg = '';
    const out = [...photos];
    try {
      for (const f of files) {
        if (out.length >= max) {
          msg = t('At most {n} photos.', { n: max });
          break;
        }
        try {
          out.push(await shrinkImage(f, 1200, 0.8));
        } catch (err) {
          msg = err.message || t('This photo could not be read.');
        }
      }
      if (out.length !== photos.length) set(out);
    } finally {
      reading = false;
    }
  }
  const drop = (i) => set(photos.filter((_, n) => n !== i));
  const cropped = (i, src) => set(photos.map((p, n) => (n === i ? src : p)));

  async function pdf() {
    if (!photos.length || making) return;
    making = true;
    msg = '';
    try {
      const doc = await photosToPdf(photos, { name: pdfName || t('Photos') });
      docId = doc.id;
      onchange?.(photos, doc.id, inks);
    } catch {
      msg = t('The PDF could not be made. Please try again.');
    } finally {
      making = false;
    }
  }
</script>

<div class="pset" data-photo-set>
  <div class="ph-top">
    <span class="pm"><b>{t(label)}</b><small>{photos.length ? tn(photos.length, '{n} photo', '{n} photos') : t(sub)}</small></span>
    {#if photos.length < max}
      <CameraButton onchange={add} disabled={reading} />
      <label class="btn sm"><ImagePlus size={16} aria-hidden="true" />{reading ? t('Reading…') : photos.length ? t('More photos') : t('Add')}<input type="file" accept="image/*" multiple onchange={add} hidden disabled={reading} data-photo-add /></label>
    {/if}
  </div>
  {#if photos.length}
    <ul class="thumbs" aria-label={t('Photos')}>
      {#each photos as src, i (i)}
        <li>
          <button type="button" class="th" onclick={() => (shown = i)} aria-label={t('Open photo {n}', { n: i + 1 })}><img {src} alt="" /></button>
          <span class="ta">
            <button type="button" class="tb" aria-label={t('Cut photo {n}', { n: i + 1 })} title={t('Cut the edges')} onclick={() => (cropAt = i)} data-photo-crop><Crop size={15} aria-hidden="true" /></button>
            <DrawOn {src} list={photos} {inks} icon cls="tb" onsave={({ list, inks: next }) => set(list, next)} data-photo-draw />
            <button type="button" class="tb" aria-label={t('Take away photo {n}', { n: i + 1 })} title={t('Take away')} onclick={() => drop(i)} data-photo-drop><X size={15} aria-hidden="true" /></button>
          </span>
        </li>
      {/each}
    </ul>
    <div class="pdfrow">
      {#if docId}
        <a class="done" href={`${DOCS_HASH}/${encodeURIComponent(docId)}`} data-photo-pdf-done><FileText size={16} aria-hidden="true" />{t('PDF is in Documents')}<ChevronRight size={14} aria-hidden="true" /></a>
      {:else}
        <button type="button" class="btn sm" disabled={making} onclick={pdf} data-photo-pdf><FileText size={16} aria-hidden="true" />{making ? t('Making the PDF…') : photos.length > 1 ? t('All as one PDF') : t('As PDF')}</button>
      {/if}
      <small class="hint">{t('The photos stay photos. «As PDF» also keeps one PDF in Me › Documents.')}</small>
    </div>
  {/if}
  {#if msg}<p class="err" role="alert">{msg}</p>{/if}
</div>

{#if cropAt != null && photos[cropAt]}
  {@const i = cropAt}
  <CropSheet src={photos[i]} onsave={(src) => cropped(i, src)} onclose={() => (cropAt = null)} />
{/if}
{#if shown != null && photos.length}
  <Lightbox list={photos.map((src, n) => ({ src, name: t('Photo {n}', { n: n + 1 }), sub: '' }))} start={shown} onclose={() => (shown = null)} />
{/if}

<style>
  .pset {
    display: grid;
    gap: 10px;
    min-width: 0;
  }
  .ph-top {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .pm {
    flex: 1 1 160px;
    display: grid;
    min-width: 0;
  }
  .pm small,
  .hint {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .thumbs {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .thumbs li {
    display: grid;
    gap: 4px;
    justify-items: center;
  }
  .th {
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 10px;
    overflow: hidden;
    background: var(--paper-2);
    cursor: zoom-in;
  }
  .th img {
    display: block;
    width: 72px;
    height: 72px;
    object-fit: cover;
  }
  .ta {
    display: flex;
    gap: 2px;
  }
  .tb {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--paper);
    color: var(--ink-2);
    cursor: pointer;
  }
  .pdfrow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
  }
  .done {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    color: var(--accent);
    font-weight: 600;
    text-decoration: none;
  }
  .err {
    margin: 0;
    color: var(--bad);
    font-size: var(--fs-small);
  }
  .btn :global(svg) {
    flex: none;
  }
</style>
