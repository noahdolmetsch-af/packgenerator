<script>
  /**
   * Einzelidee 27 «Letzte Ergebnisse» (996 Ideen, Noah 25.10.2026): on Ich › Werkzeugkasten the files the
   * tools saved or shared last (results.js), on this device only. Each one: save or share again, put it
   * into «Links and files», or delete it (asks first, then Undo).
   */
  import { liveQuery } from 'dexie';
  import { History, Share2, Paperclip, Trash2 } from '@lucide/svelte';
  import { db } from '../db.js';
  import { RESULTS_KEY, resultsOf, saveResults, withoutResult, readResults } from './results.js';
  import { deliver, toolOf } from '../tools/tools.js';
  import { addFile, blobOfData } from '../tools/ablage.js';
  import { sizeText } from '../tools/pdftools.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { t, locale } from '../i18n.svelte.js';

  const q = liveQuery(() => db.table('meta').get(RESULTS_KEY));
  const list = $derived(resultsOf($q));
  const when = (iso) => (iso ? new Date(iso).toLocaleString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
  const toolName = (k) => (toolOf(k) ? t(toolOf(k).title) : '');

  const again = (r) => deliver(blobOfData(r.data), r.name, { keep: false });
  async function toAblage(r) {
    const e = await addFile({ name: r.name, type: r.type, size: r.size, data: r.data });
    offerDone(e === 'big' ? t('«{name}» is bigger than 5 MB. Small files only.', { name: r.name }) : t('«{name}» is now under Links and files.', { name: r.name }));
  }
  async function drop(r) {
    if ((await askDelete({ title: t('Delete «{name}»?', { name: r.name }), text: t('You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    await deleteWithUndo({
      name: r.name,
      text: t('«{name}» deleted.', { name: r.name }),
      run: async () => {
        const before = await readResults(db);
        await saveResults(db, withoutResult(before, r.id));
        return before;
      },
      undo: (before) => saveResults(db, before),
    });
  }
</script>

<section class="card tr-box" aria-labelledby="tool-results-h" data-tool-results>
  <h2 id="tool-results-h"><History size={16} aria-hidden="true" /> {t('Last results')}</h2>
  {#if list.length}
    <ul class="tr-list">
      {#each list as r (r.id)}
        <li data-result={r.id}>
          <span class="tr-m"><b>{r.name}</b><small>{[toolName(r.tool), when(r.at), sizeText(r.size)].filter(Boolean).join(' · ')}</small></span>
          <span class="tr-b">
            <button type="button" class="btn sm" onclick={() => again(r)}><Share2 size={15} aria-hidden="true" />{t('Save or share')}</button>
            <button type="button" class="btn sm" onclick={() => toAblage(r)} data-result-keep><Paperclip size={15} aria-hidden="true" />{t('To Links and files')}</button>
            <button type="button" class="btn sm" aria-label={t('Delete {name}', { name: r.name })} onclick={() => drop(r)}><Trash2 size={15} aria-hidden="true" /></button>
          </span>
        </li>
      {/each}
    </ul>
    <p class="tr-note">{t('The newest {n}, only on this device. Up to 4 MB each.', { n: list.length })}</p>
  {:else}
    <p class="tr-note">{t('What a tool saves or shares also waits here, so you find it again. Only on this device.')}</p>
  {/if}
</section>

<style>
  .tr-box {
    display: grid;
    gap: var(--sp-2);
    max-width: 720px;
    margin: 0 0 var(--sp-4);
    padding: var(--sp-3) var(--sp-4);
  }
  .tr-box h2 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: var(--fs-section);
  }
  .tr-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--sp-2);
  }
  .tr-list li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px var(--sp-2);
  }
  .tr-m {
    flex: 1 1 200px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .tr-m small {
    display: block;
    color: var(--ink-3);
  }
  .tr-b {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .tr-note {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
