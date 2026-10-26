<script>
  /**
   * Paket NE 1151 (Noah 20.10.2026 «10a»): the trash of Notes. A deleted note waits here 30 days with
   * its files, then it goes by itself. «Put back» brings it back as it was; «Delete for good» and
   * «Empty the trash» ask first and offer Undo.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t, tn, locale } from '../i18n.svelte.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { backClose } from '../ui/backclose.js';
  import { TRASH, TRASH_DAYS, daysLeft, restoreNote, dropForGood } from './trash.js';
  // Wiederherstellen mit Anhängen (996 Ideen UC-270-I1): what comes back with a note, and what is missing
  import { restoreInfo } from './context.js';
  import { X, Undo2, Trash2 } from '@lucide/svelte';
  import '../bikes/velo-dlg.css';

  let { onclose } = $props();
  let dialog;
  const rowsQ = liveQuery(() => db.docs.where('kind').equals(TRASH).toArray());
  const rows = $derived([...($rowsQ ?? [])].sort((a, b) => String(b.trashedAt).localeCompare(String(a.trashedAt))));
  let info = $state('');
  const filesQ = liveQuery(() => db.docs.where('kind').equals('notefile').toArray());
  const notesQ = liveQuery(() => db.notes.toArray());
  const infoOf = (r) => restoreInfo(r, { files: $filesQ ?? [], notes: $notesQ ?? [], trash: rows });
  function withLine(x) {
    const parts = [];
    if (x.photos) parts.push(tn(x.photos, '{n} photo', '{n} photos'));
    if (x.files) parts.push(tn(x.files, '{n} file', '{n} files'));
    if (x.links) parts.push(tn(x.links, '{n} link|note', '{n} links|note'));
    if (x.back) parts.push(tn(x.back, '{n} note links to it', '{n} notes link to it'));
    return parts.length ? t('Comes back with: {list}', { list: parts.join(' · ') }) : t('Comes back as it was.');
  }
  async function putAll(r, more) {
    for (const x of [r, ...more]) await restoreNote(db, x.id);
    info = tn(more.length + 1, '"{name}" is back in Notes.', '{n} notes are back in Notes.', { name: nameOf(r) });
  }

  $effect(() => {
    dialog.showModal();
  });
  const nameOf = (r) => r.name || t('Note');
  const when = (iso) => new Date(iso).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });

  async function put(r) {
    const n = await restoreNote(db, r.id);
    if (n) info = t('"{name}" is back in Notes.', { name: nameOf(r) });
  }
  async function drop(list) {
    const one = list.length === 1;
    const title = one ? t('Delete "{text}" for good?', { text: nameOf(list[0]).slice(0, 40) }) : tn(list.length, 'Delete {n} note for good?', 'Delete {n} notes for good?');
    if ((await askDelete({ title, text: t('Its files and versions go too. You can bring it back for 4 seconds afterwards.'), lines: one ? [] : list.map(nameOf) })) !== 'delete') return;
    await deleteWithUndo({
      run: () => dropForGood(db, list),
      undo: (gone) => gone?.length && db.docs.bulkPut(gone),
      text: one ? t('"{name}" deleted.', { name: nameOf(list[0]) }) : tn(list.length, '{n} entry deleted.', '{n} entries deleted.'),
      name: nameOf(list[0]),
    });
  }
</script>

<dialog use:backClose class="sheet vdlg" bind:this={dialog} onclose={onclose} aria-labelledby="trash-h" data-note-trash>
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="trash-h" class="title">{t('Trash')}</h2>
      <p class="vd-sub">{t('Deleted notes wait here {n} days, then they go by themselves.', { n: TRASH_DAYS })}</p>
      <p class="vd-sub" data-trash-with><b>{t('Restore with attachments')}</b> · {t('photos, files and links come back with the note; the app says when a linked note is missing.')}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  {#if $rowsQ && !rows.length}
    <p class="q">{t('The trash is empty.')}</p>
  {:else}
    <ul class="tl">
      {#each rows as r (r.id)}
        {@const x = infoOf(r)}
        <li data-trash-row>
          <span class="m"><b>{nameOf(r)}</b><small>{t('Deleted {day}', { day: when(r.trashedAt) })} · {tn(daysLeft(r.trashedAt), '{n} day left', '{n} days left')}</small><small data-trash-info>{withLine(x)}</small></span>
          <button type="button" class="btn sm" onclick={() => put(r)} data-trash-put><Undo2 size={16} aria-hidden="true" />{t('Put back')}</button>
          <button type="button" class="rm" aria-label={t('Delete {name} for good', { name: nameOf(r) })} onclick={() => drop([r])} data-trash-drop><Trash2 size={16} aria-hidden="true" /></button>
          {#if x.inTrash.length}
            <p class="miss" data-trash-linked>{t('Linked and also in the trash: {names}', { names: x.inTrash.map(nameOf).join(', ') })} <button type="button" class="btn sm" onclick={() => putAll(r, x.inTrash)} data-trash-putall>{t('Put back together')}</button></p>
          {/if}
          {#if x.gone}<p class="miss">{tn(x.gone, '{n} linked note is gone for good; that link stays empty.', '{n} linked notes are gone for good; those links stay empty.')}</p>{/if}
        </li>
      {/each}
    </ul>
  {/if}
  {#if info}<p class="ok" role="status">{info}</p>{/if}
  <div class="vd-foot">
    {#if rows.length > 1}<button type="button" class="btn" onclick={() => drop(rows)} data-trash-empty>{t('Empty the trash')}</button>{/if}
    <button type="button" class="btn hi" onclick={() => dialog.close()}>{t('Done')}</button>
  </div>
</dialog>

<style>
  .tl {
    display: grid;
    gap: 6px;
    margin: 0 0 12px;
    padding: 0;
    list-style: none;
  }
  .tl li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 8px;
    padding: 6px 4px 6px 12px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  .m {
    flex: 1 1 12em;
    display: grid;
    min-width: 0;
  }
  .m b {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
  }
  .m small,
  .q {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .miss {
    flex: 1 1 100%;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .rm {
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
</style>
