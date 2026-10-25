<script>
  /**
   * Paket A part 1, UC-255-I2: on a list's page, «End the list» with three ways (finished, put away, dropped).
   * Open points stay as they are. An ended list shows how it ended and «Open again». Each with Undo.
   */
  import { Flag, RotateCcw } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, dateOf } from '../i18n.svelte.js';
  import { changeList } from '../listsdb.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { LIST_ENDS, endList, reopenList, isEnded } from './stand.js';

  let { list } = $props();
  let asking = $state(false);
  async function end(how) {
    asking = false;
    const undo = await changeList(db, list.id, (l) => endList(l, how));
    offerDone(t('List «{name}»: {how}.', { name: list.name, how: t(LIST_ENDS.find((x) => x.key === how).name) }), undo);
  }
  async function reopen() {
    const undo = await changeList(db, list.id, reopenList);
    offerDone(t('List «{name}» is open again.', { name: list.name }), undo);
  }
</script>

<div class="le" data-list-end>
  {#if isEnded(list)}
    <p class="was">{t(LIST_ENDS.find((x) => x.key === list.ended.how).name)} · {dateOf(String(list.ended.at).slice(0, 10))}</p>
    <button type="button" class="lk" onclick={reopen} data-list-reopen><RotateCcw size={14} aria-hidden="true" />{t('Open again')}</button>
  {:else if asking}
    <p class="was">{t('How does the list end? Open points stay as they are.')}</p>
    <div class="ways">
      {#each LIST_ENDS as w (w.key)}<button type="button" class="way" onclick={() => end(w.key)} data-list-end-how={w.key}><b>{t(w.name)}</b><small>{t(w.sub)}</small></button>{/each}
      <button type="button" class="lk" onclick={() => (asking = false)}>{t('Cancel')}</button>
    </div>
  {:else}
    <button type="button" class="lk" onclick={() => (asking = true)} data-list-end-open><Flag size={14} aria-hidden="true" />{t('End the list')}</button>
  {/if}
</div>

<style>
  .le {
    margin: 12px 0 0;
  }
  .was {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ways {
    display: grid;
    gap: 8px;
    margin-top: 8px;
  }
  .way {
    display: grid;
    gap: 2px;
    min-height: 44px;
    padding: 8px 14px;
    border: 1.5px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .way small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .lk {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    justify-self: start;
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
