<script>
  /**
   * Paket L «Werkzeugkasten» (#83, #86; Noah 19.10.2026 «4 a und b»): links and small files in one
   * place. The same lists show in Ich › Dokumente and in Werkzeugkasten › Ablage. Every entry can be
   * renamed, moved (arrows and drag) and deleted with Undo. head: the heading level of the two lists.
   */
  import { liveQuery } from 'dexie';
  import { Link2, Paperclip, Plus, Pencil, Trash2, ExternalLink, Share2 } from '@lucide/svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import { sortable } from '../ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { db } from '../db.js';
  import { LINKS_KEY, FILES_KEY, FILE_MAX, cleanUrl, addLink, addFile, saveLinks, saveFiles, moved, fileData, removeFile, restoreFile, blobOfData } from './ablage.js';
  import { sizeText } from './pdftools.js';
  import { deliver } from './tools.js';
  import { t } from '../i18n.svelte.js';
  import './tools.css';

  let { head = 'h2' } = $props();
  const linksQ = liveQuery(async () => (await db.settings.get(LINKS_KEY))?.value ?? []);
  const filesQ = liveQuery(async () => (await db.settings.get(FILES_KEY))?.value ?? []);
  const links = $derived($linksQ ?? []);
  const files = $derived($filesQ ?? []);

  let addingLink = $state(false);
  let url = $state('');
  let title = $state('');
  let error = $state('');
  let renaming = $state(null); // { kind: 'link'|'file', e }
  let input;

  async function saveLink(e) {
    e.preventDefault();
    error = '';
    if (!cleanUrl(url)) return (error = t('This is not a web address. Example: sbb.ch'));
    await addLink({ title, url });
    url = '';
    title = '';
    addingLink = false;
  }
  async function chooseFile(e) {
    const el = e.currentTarget;
    error = '';
    for (const f of [...(el.files ?? [])]) {
      if (f.size > FILE_MAX) {
        error = t('«{name}» is bigger than 5 MB. Small files only.', { name: f.name });
        continue;
      }
      const data = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(f);
      });
      await addFile({ name: f.name, type: f.type, size: f.size, data });
    }
    el.value = '';
  }
  async function openFile(f) {
    const data = await fileData(f.id);
    if (!data) return;
    const blob = blobOfData(data);
    const u = URL.createObjectURL(blob);
    window.open(u, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(u), 60_000);
  }
  async function shareFile(f) {
    const data = await fileData(f.id);
    if (data) deliver(blobOfData(data), f.name, { keep: false });
  }
  async function delLink(l) {
    if ((await askDelete({ title: t('Delete «{name}»?', { name: l.title }), text: t('You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    const at = links.findIndex((x) => x.id === l.id);
    await deleteWithUndo({
      name: l.title,
      text: t('«{name}» deleted.', { name: l.title }),
      run: async () => (await saveLinks(links.filter((x) => x.id !== l.id)), { l, at }),
      undo: async (s) => {
        const cur = (await db.settings.get(LINKS_KEY))?.value ?? [];
        const n = cur.filter((x) => x.id !== s.l.id);
        n.splice(Math.min(s.at, n.length), 0, s.l);
        await saveLinks(n);
      },
    });
  }
  async function delFile(f) {
    if ((await askDelete({ title: t('Delete «{name}»?', { name: f.name }), text: t('You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    await deleteWithUndo({ name: f.name, text: t('«{name}» deleted.', { name: f.name }), run: () => removeFile(f.id), undo: (s) => restoreFile(s) });
  }
  function rename(name) {
    const n = name.trim();
    if (!n) return t('Please type a name.');
    if (renaming.kind === 'link') saveLinks(links.map((x) => (x.id === renaming.e.id ? { ...x, title: n } : x)));
    else saveFiles(files.map((x) => (x.id === renaming.e.id ? { ...x, name: n } : x)));
  }
</script>

<section class="tool-card ablage" data-ablage="links">
  <svelte:element this={head} class="ab-h"><Link2 size={18} aria-hidden="true" />{t('Links|ablage')}</svelte:element>
  <p class="tool-help">{t('Important web addresses in one place: timetables, bookings, your bank.')}</p>
  {#if links.length}
    <ul class="tool-list" use:sortable={{ onmove: (a, b) => saveLinks(moved(links, a, b)) }}>
      {#each links as l, i (l.id)}
        <li data-sort-id={l.id}>
          <SortGrip name={l.title} onstep={(d) => saveLinks(moved(links, i, i + d))} />
          <a class="ab-m" href={l.url} target="_blank" rel="noopener noreferrer"><b>{l.title}</b><small class="tool-muted">{l.url}</small></a>
          <SortArrows name={l.title} {i} n={links.length} onstep={(d) => saveLinks(moved(links, i, i + d))} />
          <button type="button" class="btn sm" aria-label={t('Rename {name}', { name: l.title })} onclick={() => (renaming = { kind: 'link', e: l })}><Pencil size={15} aria-hidden="true" /></button>
          <button type="button" class="btn sm" aria-label={t('Delete {name}', { name: l.title })} onclick={() => delLink(l)}><Trash2 size={15} aria-hidden="true" /></button>
        </li>
      {/each}
    </ul>
  {/if}
  {#if addingLink}
    <form class="ab-form" onsubmit={saveLink}>
      <label class="tool-field"><span>{t('Web address')}</span><input class="tool-input" type="text" inputmode="url" autocapitalize="off" autocomplete="off" placeholder="sbb.ch" bind:value={url} /></label>
      <label class="tool-field"><span>{t('Name (optional)')}</span><input class="tool-input" autocomplete="off" maxlength="80" bind:value={title} /></label>
      <div class="tool-row"><button type="submit" class="btn hi" disabled={!url.trim()}>{t('Save')}</button><button type="button" class="btn btn-link" onclick={() => ((addingLink = false), (error = ''))}>{t('Cancel')}</button></div>
    </form>
  {:else}
    <div><button type="button" class="btn" onclick={() => (addingLink = true)}><Plus size={16} aria-hidden="true" />{t('Add link')}</button></div>
  {/if}
</section>

<section class="tool-card ablage" data-ablage="files">
  <svelte:element this={head} class="ab-h"><Paperclip size={18} aria-hidden="true" />{t('Small files')}</svelte:element>
  <p class="tool-help">{t('Small files up to 5 MB, e.g. a ticket or a list. They go into the backup.')}</p>
  {#if files.length}
    <ul class="tool-list" use:sortable={{ onmove: (a, b) => saveFiles(moved(files, a, b)) }}>
      {#each files as f, i (f.id)}
        <li data-sort-id={f.id}>
          <SortGrip name={f.name} onstep={(d) => saveFiles(moved(files, i, i + d))} />
          <button type="button" class="ab-m ab-open" onclick={() => openFile(f)}><b>{f.name}</b><small class="tool-muted">{sizeText(f.size)}</small></button>
          <SortArrows name={f.name} {i} n={files.length} onstep={(d) => saveFiles(moved(files, i, i + d))} />
          <button type="button" class="btn sm" aria-label={t('Open file {name}', { name: f.name })} onclick={() => openFile(f)}><ExternalLink size={15} aria-hidden="true" /></button>
          <button type="button" class="btn sm" aria-label={t('Share {name}', { name: f.name })} onclick={() => shareFile(f)}><Share2 size={15} aria-hidden="true" /></button>
          <button type="button" class="btn sm" aria-label={t('Rename {name}', { name: f.name })} onclick={() => (renaming = { kind: 'file', e: f })}><Pencil size={15} aria-hidden="true" /></button>
          <button type="button" class="btn sm" aria-label={t('Delete {name}', { name: f.name })} onclick={() => delFile(f)}><Trash2 size={15} aria-hidden="true" /></button>
        </li>
      {/each}
    </ul>
  {/if}
  <input bind:this={input} type="file" multiple hidden onchange={chooseFile} />
  <div><button type="button" class="btn" onclick={() => input.click()}><Plus size={16} aria-hidden="true" />{t('Add file')}</button></div>
</section>
{#if error}<p class="tool-status err" role="alert">{error}</p>{/if}

{#if renaming}
  <RenameSheet kicker={renaming.kind === 'link' ? t('Links|ablage') : t('Small files')} title={t('Rename')} value={renaming.kind === 'link' ? renaming.e.title : renaming.e.name} max={renaming.kind === 'link' ? 80 : 120} onsave={rename} onclose={() => (renaming = null)} />
{/if}

<style>
  .ab-h {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font: 600 var(--fs-sub) / 1.25 var(--font-body);
  }
  .ab-m {
    display: grid;
    flex: 1 1 auto;
    min-width: 0;
    color: var(--ink);
    text-decoration: none;
  }
  .ab-m b,
  .ab-m small {
    overflow-wrap: break-word;
    word-break: break-word;
  }
  .ab-open {
    border: 0;
    background: none;
    padding: 0;
    text-align: left;
    font: inherit;
    cursor: pointer;
  }
  .ab-form {
    display: grid;
    gap: var(--sp-2);
    max-width: 480px;
  }
</style>
