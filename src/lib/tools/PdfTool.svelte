<script>
  /**
   * Paket L «Werkzeugkasten» (#308 PDF verkleinern, zusammenfügen, teilen): choose PDFs and photos, put
   * them in order (arrows or drag), then «Merge into one PDF» or «Make smaller». The result is saved or
   * shared from the device; nothing goes to a web page.
   */
  import { FilePlus, Trash2, Combine, Minimize2, Share2 } from '@lucide/svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import { sortable } from '../ui/sortable.js';
  import { isPdf, sizeText, mergeParts, shrinkPdf } from './pdftools.js';
  import { recodeJpeg } from './phototools.js';
  import { deliver } from './tools.js';
  import { t } from '../i18n.svelte.js';
  import './tools.css';

  let files = $state([]); // { id, name, size, bytes, kind }
  let busy = $state('');
  let result = $state(null); // { blob, name, before, after, pages, note }
  let error = $state('');
  let input;

  async function choose(e) {
    const el = e.currentTarget;
    error = '';
    for (const f of [...(el.files ?? [])]) {
      const bytes = new Uint8Array(await f.arrayBuffer());
      const kind = isPdf(bytes, f.name, f.type) ? 'pdf' : /png/i.test(f.type) ? 'png' : /jpe?g/i.test(f.type) || /\.jpe?g$/i.test(f.name) ? 'jpg' : null;
      if (!kind) {
        error = t('«{name}» is not a PDF, JPG or PNG.', { name: f.name });
        continue;
      }
      files = [...files, { id: `${Date.now()}-${files.length}`, name: f.name, size: f.size, bytes, kind }];
    }
    el.value = '';
    result = null;
  }
  function move(from, to) {
    const l = [...files];
    const [x] = l.splice(from, 1);
    l.splice(to, 0, x);
    files = l;
    result = null;
  }
  const total = $derived(files.reduce((a, f) => a + f.size, 0));
  const base = $derived((files[0]?.name ?? 'dokument').replace(/\.[a-z0-9]+$/i, ''));

  async function merge() {
    busy = 'merge';
    error = '';
    try {
      const { bytes, pages } = await mergeParts(files);
      result = { blob: new Blob([bytes], { type: 'application/pdf' }), name: `${base}-${t('merged|file')}.pdf`, before: total, after: bytes.length, pages };
    } catch (err) {
      console.error(err);
      error = t('This did not work. A PDF with a password cannot be read.');
    } finally {
      busy = '';
    }
  }
  async function shrink() {
    busy = 'shrink';
    error = '';
    try {
      let src = files[0].bytes;
      if (files.length > 1 || files[0].kind !== 'pdf') src = (await mergeParts(files)).bytes;
      const { bytes, images } = await shrinkPdf(src, recodeJpeg);
      const smaller = bytes.length < total;
      result = { blob: new Blob([smaller ? bytes : src], { type: 'application/pdf' }), name: `${base}-${t('small|file')}.pdf`, before: total, after: smaller ? bytes.length : src.length, note: images ? '' : t('No photos inside to make smaller; text stays as it is.') };
    } catch (err) {
      console.error(err);
      error = t('This did not work. A PDF with a password cannot be read.');
    } finally {
      busy = '';
    }
  }
</script>

<section class="tool-card pdf">
  <p class="tool-help">{t('Choose PDFs or photos. Everything stays on this device.')}</p>
  <input bind:this={input} type="file" accept="application/pdf,.pdf,image/jpeg,image/png" multiple hidden onchange={choose} />
  <div><button type="button" class="btn" onclick={() => input.click()}><FilePlus size={16} aria-hidden="true" />{files.length ? t('Add more') : t('Choose files')}</button></div>
  {#if files.length}
    <ul class="tool-list" use:sortable={{ onmove: move }}>
      {#each files as f, i (f.id)}
        <li data-sort-id={f.id}>
          <SortGrip name={f.name} onstep={(d) => move(i, i + d)} />
          <span class="pf-m"><b>{f.name}</b><small class="tool-muted">{f.kind === 'pdf' ? 'PDF' : t('Photo')} · {sizeText(f.size)}</small></span>
          <SortArrows name={f.name} {i} n={files.length} onstep={(d) => move(i, i + d)} />
          <button type="button" class="btn sm" aria-label={t('Remove {name}', { name: f.name })} onclick={() => ((files = files.filter((x) => x.id !== f.id)), (result = null))}><Trash2 size={15} aria-hidden="true" /></button>
        </li>
      {/each}
    </ul>
    <div class="tool-row">
      <button type="button" class="btn hi" disabled={!!busy || (files.length < 2 && files[0].kind === 'pdf')} onclick={merge}><Combine size={16} aria-hidden="true" />{busy === 'merge' ? t('Working …') : t('Merge into one PDF')}</button>
      <button type="button" class="btn" disabled={!!busy} onclick={shrink}><Minimize2 size={16} aria-hidden="true" />{busy === 'shrink' ? t('Working …') : t('Make smaller')}</button>
    </div>
  {/if}
  {#if error}<p class="tool-status err" role="alert">{error}</p>{/if}
  {#if result}
    <div class="pf-res" data-result>
      <p class="tool-status"><b>{result.name}</b> · {sizeText(result.before)} → {sizeText(result.after)}{result.pages ? ` · ${t('{n} pages', { n: result.pages })}` : ''}</p>
      {#if result.note}<p class="tool-muted">{result.note}</p>{/if}
      <button type="button" class="btn hi" onclick={() => deliver(result.blob, result.name)}><Share2 size={16} aria-hidden="true" />{t('Save or share')}</button>
    </div>
  {/if}
</section>

<style>
  .pf-m {
    display: grid;
    flex: 1 1 auto;
    min-width: 0;
  }
  .pf-m b {
    overflow-wrap: break-word;
  }
  .pf-res {
    display: grid;
    gap: var(--sp-2);
    justify-items: start;
  }
</style>
