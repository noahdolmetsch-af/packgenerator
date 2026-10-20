<script>
  /**
   * Noah 20.10.2026 «3a»: the activities deleted with «Keep the history» (setting flow.goneActs, flowdb
   * removeAct). Each one can come back with all its ticks («Restore») or go for good with its history
   * (asks first, then «Undo»). Shown on Aktiv › Aktivitäten only while there is one.
   */
  import { liveQuery } from 'dexie';
  import { RotateCcw, Trash2 } from '@lucide/svelte';
  import { db } from '../db.js';
  import { GONE_KEY, restoreAct, dropGone, undoDrop } from '../flowdb.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import ActIcon from './ActIcon.svelte';
  import { actName } from './ui.svelte.js';
  import { t } from '../i18n.svelte.js';

  const goneQ = liveQuery(async () => (await db.settings.get(GONE_KEY))?.value ?? []);
  const gone = $derived(Array.isArray($goneQ) ? $goneQ : []);

  async function restore(a) {
    await restoreAct(db, a.id);
    offerDone(t('«{name}» is back, with its history.', { name: actName(a) }));
  }
  async function drop(a) {
    const nm = actName(a);
    const answer = await askDelete({ title: t('Delete «{name}»?', { name: nm }), text: t('The ticks of this activity go too.'), label: t('Delete with history') });
    if (answer !== 'delete') return;
    await deleteWithUndo({ run: () => dropGone(db, a.id), undo: (saved) => undoDrop(db, saved), text: t('«{name}» deleted.', { name: nm }), name: nm });
  }
</script>

{#if gone.length}
  <details class="card gone" data-gone-acts>
    <summary><b>{t('Deleted, history kept')}</b><small class="num">{gone.length}</small></summary>
    <ul>
      {#each gone as a (a.id)}
        <li data-gone={a.id}>
          <ActIcon icon={a.icon} ring={a.ring} dim />
          <span class="m">{actName(a)}</span>
          <button type="button" class="btn sm" onclick={() => restore(a)} data-gone-restore><RotateCcw size={16} aria-hidden="true" />{t('Restore')}</button>
          <button type="button" class="ib" onclick={() => drop(a)} aria-label={t('Delete «{name}» with history', { name: actName(a) })}><Trash2 size={18} aria-hidden="true" /></button>
        </li>
      {/each}
    </ul>
  </details>
{/if}

<style>
  .gone {
    padding: 0 16px;
  }
  summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 48px;
    cursor: pointer;
  }
  summary small {
    color: var(--ink-3);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0 0 8px;
  }
  li {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 52px;
    border-top: 1px solid var(--line);
  }
  .m {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .ib {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
</style>
