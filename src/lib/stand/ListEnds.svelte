<script>
  /**
   * Paket A part 1, UC-255-I2 «Liste hat ein Ende»: in Merken under «Lists», the ended lists in a closed fold,
   * each with how it ended and «Open again». An ended list is not pinned anywhere any more (ownlists.js pinnedTo).
   */
  import { ChevronDown, ChevronRight, RotateCcw } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, dateOf } from '../i18n.svelte.js';
  import { changeList } from '../listsdb.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { LIST_ENDS, isEnded, reopenList } from './stand.js';

  let { lists = [] } = $props();
  const ended = $derived(lists.filter(isEnded).sort((a, b) => String(b.ended.at).localeCompare(String(a.ended.at))));
  let open = $state(false);
  const how = (l) => t(LIST_ENDS.find((x) => x.key === l.ended.how)?.name ?? '');
  async function reopen(l) {
    const undo = await changeList(db, l.id, reopenList);
    offerDone(t('List «{name}» is open again.', { name: l.name }), undo);
  }
</script>

{#if ended.length}
  <button type="button" class="fold" aria-expanded={open} onclick={() => (open = !open)} data-ended-lists>{#if open}<ChevronDown size={16} aria-hidden="true" />{:else}<ChevronRight size={16} aria-hidden="true" />{/if}{t('Ended lists')} · {ended.length}</button>
  {#if open}
    <ul class="card el">
      {#each ended as l (l.id)}
        <li data-ended-list={l.id}>
          <a class="tx" href={`#/calendar/list/${l.id}`}><b>{l.name}</b><small>{how(l)} · {dateOf(String(l.ended.at).slice(0, 10))}</small></a>
          <button type="button" class="lk" onclick={() => reopen(l)}><RotateCcw size={14} aria-hidden="true" />{t('Open again')}</button>
        </li>
      {/each}
    </ul>
  {/if}
{/if}

<style>
  .fold {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    margin-top: 8px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: inherit;
    cursor: pointer;
  }
  .el {
    list-style: none;
    margin: 4px 0 0;
    padding: 4px 18px;
  }
  .el li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 12px;
    padding: 6px 0;
  }
  .el li + li {
    border-top: 1px solid var(--line);
  }
  .tx {
    display: grid;
    min-width: 0;
    min-height: 44px;
    align-content: center;
    color: var(--ink);
    text-decoration: none;
    overflow-wrap: break-word;
  }
  .tx b {
    font-weight: 500;
  }
  .tx small {
    color: var(--ink-2);
  }
  .lk {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    text-decoration: underline;
    cursor: pointer;
  }
</style>
