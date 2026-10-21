<script>
  /**
   * Paket NE 1148/1149 in a note: the files (PDF, Word, Excel, PowerPoint, text, GPX/FIT/TCX, calendar,
   * contact, video, a kept web page), «File», «Scan», «Keep the page» for a link, and «Make text
   * searchable» for photos and scanned PDFs (on the device; tesseract.js loads once).
   *
   * note: the draft; onchange(next note); onphoto(src): a picture goes to the note's photos; onscan(): to
   * the scanner (the sheet saves first). Files are stored at once in db.docs (one row each).
   */
  import { db } from '../db.js';
  import { t, tn } from '../i18n.svelte.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { allFiles, fileMeta, withFile, withoutFile, withOcr, unreadPhotos, formatOf, sizeText, TEXT_MAX } from './files.js';
  import { prepare, savePage, pdfImages } from './attach.js';
  import { photosOf, linksOf } from '../noteformats.js';
  import FileView from './FileView.svelte';
  import { Paperclip, ScanLine, FileText, FileSpreadsheet, Film, Map as MapIcon, CalendarDays, Contact, Globe, File as FileIcon, Trash2, TextSearch, BookmarkPlus } from '@lucide/svelte';

  let { note, onchange, onphoto, onscan } = $props();

  const ICON = { pdf: FileText, doc: FileText, md: FileText, text: FileText, table: FileSpreadsheet, video: Film, map: MapIcon, ics: CalendarDays, vcf: Contact, web: Globe, file: FileIcon };
  const files = $derived(allFiles(note));
  const unread = $derived(unreadPhotos(note, photosOf(note)));
  const scannedPdfs = $derived((note.atts ?? []).filter((f) => f.fmt === 'pdf' && !f.text && !f.ocrDone));
  const pageLinks = $derived(linksOf(note).filter((l) => !(note.atts ?? []).some((f) => f.fmt === 'web' && f.url === l.url)));
  let busy = $state('');
  let msg = $state('');
  let open = $state(null);

  async function addFiles(e) {
    const list = [...(e.currentTarget.files ?? [])];
    e.currentTarget.value = '';
    msg = '';
    let next = note;
    for (const f of list) {
      try {
        const out = await prepare(f, { noteId: note.id, onstep: (s) => (busy = s) });
        if (out.kind === 'photo') onphoto?.(out.src);
        else {
          await db.docs.put(out.row);
          next = withFile(next, fileMeta(out.row));
          onchange?.(next);
        }
      } catch (err) {
        msg = `${f.name}: ${err?.message || t('This file could not be read.')}`;
      }
    }
    busy = '';
  }
  async function remove(f) {
    if ((await askDelete({ title: t('Remove the file "{text}"?', { text: f.name.slice(0, 40) }), text: t('You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    const before = note;
    const ok = await deleteWithUndo({
      run: async () => {
        const rec = f.mail ? null : await db.docs.get(f.id);
        if (rec) await db.docs.delete(f.id);
        onchange?.(withoutFile(note, f.id));
        return rec;
      },
      undo: async (rec) => {
        if (rec) await db.docs.put(rec);
        onchange?.(before);
      },
      text: t('"{name}" removed.', { name: f.name }),
      name: f.name,
    });
    return ok;
  }
  async function keepPage(l) {
    msg = '';
    try {
      const row = await savePage(l.url, { noteId: note.id, onstep: (s) => (busy = s) });
      await db.docs.put(row);
      onchange?.(withFile(note, { ...fileMeta(row), url: l.url }));
    } catch (err) {
      msg = err?.message || t('The page could not be loaded.');
    } finally {
      busy = '';
    }
  }
  /** 1149: read the text in the photos and in scanned PDFs, on the device. */
  async function readAll() {
    msg = '';
    const { readText } = await import('../docs/ocr.js');
    let next = note;
    let found = 0;
    const photos = unread;
    for (const [i, src] of photos.entries()) {
      busy = t('Reading the text: picture {n} of {m}…', { n: i + 1, m: photos.length + scannedPdfs.length });
      const text = await readText([src]);
      if (text === '' && !navigator.onLine) break;
      if (text) found++;
      next = withOcr(next, src, text);
    }
    for (const [i, f] of scannedPdfs.entries()) {
      busy = t('Reading the text: picture {n} of {m}…', { n: photos.length + i + 1, m: photos.length + scannedPdfs.length });
      const row = await db.docs.get(f.id);
      if (!row) continue;
      const text = (await readText(await pdfImages(row.data))).slice(0, TEXT_MAX);
      if (text) found++;
      await db.docs.update(f.id, { text });
      next = withFile(next, { id: f.id, text, ocrDone: true });
    }
    onchange?.(next);
    busy = '';
    msg = !navigator.onLine && !found ? t('Reading text needs the internet once (about 15 MB), then it works here.') : found ? tn(found, 'Text found in {n} picture. The search finds it now.', 'Text found in {n} pictures. The search finds it now.') : t('No text found.');
  }
</script>

{#if files.length}
  <ul class="fl" data-note-files>
    {#each files as f (f.id)}
      {@const F = formatOf(f.fmt)}
      {@const I = ICON[F.show] ?? FileIcon}
      <li data-note-file={f.fmt}>
        <button type="button" class="fo" onclick={() => (open = f)}><I size={18} aria-hidden="true" /><span><b>{f.name}</b><small>{t(F.name)} · {sizeText(f.bytes)}{f.text ? ` · ${t('text searchable')}` : ''}</small></span></button>
        <button type="button" class="rm" aria-label={t('Remove {name}', { name: f.name })} onclick={() => remove(f)}><Trash2 size={16} aria-hidden="true" /></button>
      </li>
    {/each}
  </ul>
{/if}
{#if pageLinks.length}
  <div class="pl">
    {#each pageLinks as l (l.url)}<button type="button" class="btn sm btn-link" disabled={!!busy} onclick={() => keepPage(l)} data-keep-page><BookmarkPlus size={16} aria-hidden="true" />{t('Keep «{name}» to read offline', { name: (l.title || l.url).slice(0, 40) })}</button>{/each}
  </div>
{/if}
<div class="fa" role="group" aria-label={t('Files')}>
  <label class="btn sm"><Paperclip size={16} aria-hidden="true" />{t('File|attach')}<input type="file" multiple hidden onchange={addFiles} disabled={!!busy} data-add-file /></label>
  <button type="button" class="btn sm" onclick={() => onscan?.()} disabled={!!busy} data-add-scan><ScanLine size={16} aria-hidden="true" />{t('Scan|document')}</button>
  {#if unread.length || scannedPdfs.length}<button type="button" class="btn sm" onclick={readAll} disabled={!!busy} data-read-text><TextSearch size={16} aria-hidden="true" />{t('Make text in pictures searchable')}</button>{/if}
</div>
{#if busy}<p class="q" role="status">{busy}</p>{/if}
{#if msg}<p class="q" role="status" data-files-msg>{msg}</p>{/if}
{#if open}<FileView file={open} onclose={() => (open = null)} ontext={(s) => onchange?.({ ...note, text: `${note.text ?? ''}${note.text ? '\n\n' : ''}${s}` })} />{/if}

<style>
  .fl {
    display: grid;
    gap: 6px;
    margin: 0 0 10px;
    padding: 0;
    list-style: none;
  }
  .fl li {
    display: flex;
    align-items: center;
    gap: 4px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  .fo {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 52px;
    padding: 6px 12px;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .fo span {
    display: grid;
    min-width: 0;
  }
  .fo b {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
  }
  .fo small,
  .q {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .rm {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: var(--r-ctl);
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  .fa,
  .pl {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0 0 12px;
  }
</style>
