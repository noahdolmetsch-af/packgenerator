<script>
  /**
   * «Bild bearbeiten» (Noah 28.10.2026 «1a 2a 3a 4a 5a»): Werkzeugkasten › Bild bearbeiten (#/me/tools/markup).
   * A screenshot is taken on the phone as always (a web app cannot take one of other apps), then chosen here.
   * Each page: turn, cut the edges (the frame of «Fotos»), draw, highlight and write (the drawing window
   * of Notizen; the strokes stay changeable while the page is open), remove with Undo. Pages in order with
   * arrows or by dragging. At the end one PDF of all pages or single pictures, saved or shared.
   * Everything stays on the device.
   */
  import { ImagePlus, Camera, RotateCw, Crop, Trash2, Share2, ScanLine } from '@lucide/svelte';
  import Seg from '../ui/Seg.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import { sortable } from '../ui/sortable.js';
  import { deleteWithUndo } from '../ui/ask.js';
  import CropSheet from '../bilder/CropSheet.svelte';
  import DrawOn from '../draw/DrawOn.svelte';
  import { MAX_PAGES, moveTo, resultName, pageFromFile, turnRight, pagesToPdf, pageBlob } from './markup.js';
  import { sizeText } from './pdftools.js';
  import { deliver } from './tools.js';
  import { localDay } from '../localday.js';
  import { t } from '../i18n.svelte.js';
  import './tools.css';

  let pages = $state([]); // { id, src } (src: JPEG data URL)
  let inks = $state(undefined); // the drawings of the pages (DrawOn), so they stay changeable
  let make = $state('pdf'); // 'pdf' | 'pics'
  let busy = $state('');
  let error = $state('');
  let done = $state('');
  let cutting = $state(null); // the page whose edges are cut
  let pick;
  let cam;
  let n = 0;
  const newId = () => `p${Date.now().toString(36)}${n++}`;

  async function choose(e) {
    const el = e.currentTarget;
    const files = [...(el.files ?? [])];
    el.value = '';
    error = '';
    done = '';
    busy = 'load';
    try {
      for (const f of files) {
        if (pages.length >= MAX_PAGES) {
          error = t('At most {n} pages at once.', { n: MAX_PAGES });
          break;
        }
        try {
          pages = [...pages, { id: newId(), src: await pageFromFile(f) }];
        } catch {
          error = t('«{name}» cannot be opened. Try a JPG or PNG.', { name: f.name });
        }
      }
    } finally {
      busy = '';
    }
  }

  function setSrc(id, src, keepInks = null) {
    pages = pages.map((p) => (p.id === id ? { ...p, src } : p));
    if (keepInks !== null) inks = keepInks;
    done = '';
  }
  async function turn(p) {
    busy = `turn-${p.id}`;
    try {
      setSrc(p.id, await turnRight(p.src));
    } catch {
      error = t('This page could not be turned.');
    } finally {
      busy = '';
    }
  }
  function move(from, to) {
    pages = moveTo(pages, from, to);
    done = '';
  }
  function remove(p, i) {
    deleteWithUndo({
      run: () => {
        pages = pages.filter((x) => x.id !== p.id);
        done = '';
        return { p, i };
      },
      undo: ({ p: back, i: at }) => {
        const l = [...pages];
        l.splice(Math.min(at, l.length), 0, back);
        pages = l;
      },
      text: t('Page {n} removed.', { n: i + 1 }),
      name: t('Page {n}', { n: i + 1 }),
    });
  }

  /** Several pictures at once to the share sheet; where it cannot, each is saved. */
  async function deliverMany(blobs, names) {
    const files = blobs.map((b, i) => new File([b], names[i], { type: b.type }));
    if (navigator.canShare?.({ files })) {
      try {
        await navigator.share({ files });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }
    for (let i = 0; i < blobs.length; i++) await deliver(blobs[i], names[i], { share: false, keep: i === 0 });
  }

  async function finish() {
    busy = 'save';
    error = '';
    done = '';
    try {
      const day = localDay();
      if (make === 'pdf') {
        const blob = await pagesToPdf(pages.map((p) => p.src));
        await deliver(blob, resultName(day, 'pdf'));
        done = t('One PDF, {n} pages, {size}.', { n: pages.length, size: sizeText(blob.size) });
      } else {
        const blobs = pages.map((p) => pageBlob(p.src));
        await deliverMany(blobs, blobs.map((_, i) => resultName(day, 'jpg', i, blobs.length)));
        done = t('{n} pictures ready.', { n: blobs.length });
      }
    } catch (err) {
      console.error(err);
      error = t('This did not work. Please try again.');
    } finally {
      busy = '';
    }
  }
</script>

<section class="tool-card mk" data-markup>
  <p class="tool-help">{t('Take the screenshot on your phone as always. Then choose it here, cut it, draw and write on it, and make one PDF of all pages. Everything stays on this device.')}</p>
  <input bind:this={pick} type="file" accept="image/*" multiple hidden onchange={choose} data-markup-pick />
  <input bind:this={cam} type="file" accept="image/*" capture="environment" hidden onchange={choose} />
  <div class="tool-row">
    <button type="button" class="btn hi" disabled={busy === 'load'} onclick={() => pick.click()}><ImagePlus size={16} aria-hidden="true" />{busy === 'load' ? t('Working …') : pages.length ? t('Add more') : t('Choose pictures')}</button>
    <button type="button" class="btn" disabled={busy === 'load'} onclick={() => cam.click()}><Camera size={16} aria-hidden="true" />{t('Take a photo|camera')}</button>
  </div>

  {#if pages.length}
    <p class="tool-muted">{t('Order: drag a page by its handle, or use the arrows.')}</p>
    <ul class="tool-list mk-pages" use:sortable={{ onmove: move }}>
      {#each pages as p, i (p.id)}
        {@const name = t('Page {n}', { n: i + 1 })}
        <li data-sort-id={p.id} data-page={i + 1}>
          <SortGrip {name} onstep={(d) => move(i, i + d)} />
          <img class="mk-th" src={p.src} alt={name} />
          <span class="mk-m"><b>{name}</b>
          <span class="mk-acts">
            <button type="button" class="btn sm" aria-label={t('Turn page {n}', { n: i + 1 })} title={t('Turn|page')} disabled={!!busy} onclick={() => turn(p)} data-turn><RotateCw size={15} aria-hidden="true" /></button>
            <button type="button" class="btn sm" aria-label={t('Cut page {n}', { n: i + 1 })} title={t('Cut the edges')} disabled={!!busy} onclick={() => (cutting = p)} data-cut><Crop size={15} aria-hidden="true" /></button>
            <DrawOn src={p.src} list={[p.src]} {inks} icon cls="btn sm" label={t('Draw on page {n}', { n: i + 1 })} title={name} onsave={({ list, inks: next }) => setSrc(p.id, list[0], next)} data-draw />
            <button type="button" class="btn sm" aria-label={t('Remove page {n}', { n: i + 1 })} disabled={!!busy} onclick={() => remove(p, i)} data-remove><Trash2 size={15} aria-hidden="true" /></button>
          </span></span>
          <SortArrows {name} {i} n={pages.length} onstep={(d) => move(i, i + d)} />
        </li>
      {/each}
    </ul>

    <div class="mk-out">
      <Seg label={t('Make as')} value={make} onchange={(k) => ((make = k), (done = ''))} options={[{ key: 'pdf', name: t('One PDF') }, { key: 'pics', name: t('Single pictures') }]} full={false} />
      <button type="button" class="btn hi" disabled={!!busy} onclick={finish} data-markup-save><Share2 size={16} aria-hidden="true" />{busy === 'save' ? t('Working …') : t('Save or share')}</button>
    </div>
  {/if}
  {#if error}<p class="tool-status err" role="alert">{error}</p>{/if}
  {#if done}<p class="tool-status" role="status" data-markup-done>{done}</p>{/if}
  <p class="tool-muted mk-scan"><ScanLine size={14} aria-hidden="true" class="mk-ic" /> {t('A paper document?')} <a href="#/me/docs/scan">{t('Photograph a document')}</a> {t('straightens the page by itself.')}</p>
</section>

{#if cutting}
  {@const id = cutting.id}
  <CropSheet src={cutting.src} onsave={(src) => setSrc(id, src)} onclose={() => (cutting = null)} />
{/if}

<style>
  .mk-th {
    width: 64px;
    height: 88px;
    object-fit: cover;
    border-radius: 6px;
    border: 1px solid var(--line);
    background: var(--paper-2);
    flex: none;
  }
  .mk-m {
    display: grid;
    gap: 6px;
    flex: 1 1 auto;
    min-width: 0;
  }
  .mk-acts {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .mk-out {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2);
  }
  .mk-scan :global(.mk-ic) {
    vertical-align: -2px;
  }
</style>
