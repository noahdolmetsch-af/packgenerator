<script>
  /**
   * Paket A, UC-020-I1 «Reparieren statt aussortieren»: in the window of a piece of clothing, small repair jobs
   * (check the seam, replace the zip). Add, tick when fixed, rename (tap the text), delete (asks, then Undo).
   * Saved at once on the item; onchange keeps the open window in step so «Save» does not undo it.
   */
  import { Plus, Trash2 } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, nameOf } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { askDelete, deleteWithUndo, saveFailed } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import { REPAIR_SUGGEST, addRepair, renameRepair, dropRepair, tickRepair } from '../stand/stand.js';

  let { item, onchange = null } = $props();
  const today = localDay();
  const list = $derived(Array.isArray(item?.repairs) ? item.repairs : []);
  let text = $state('');
  let renaming = $state(null);

  async function put(repairs) {
    const before = $state.snapshot(list);
    try {
      await db.items.update(item.id, { repairs, updatedAt: new Date().toISOString() });
      onchange?.(repairs);
    } catch (err) {
      offerDone(saveFailed(err));
      return null;
    }
    return before;
  }
  async function add(what) {
    const x = String(what ?? '').trim();
    if (!x) return;
    if (await put(addRepair(item, x))) text = '';
  }
  async function tick(r) {
    const before = await put(tickRepair(item, r.id, today));
    if (before) offerDone(r.done ? t('Open again.') : t('Fixed: {what}. «{name}» stays in use.', { what: r.text, name: nameOf(item) }), () => put(before));
  }
  async function remove(r) {
    const answer = await askDelete({ title: t('Delete «{name}»?', { name: r.text }), text: t('Only this repair job goes. You can undo this for a few seconds.') });
    if (answer !== 'delete') return;
    await deleteWithUndo({ run: () => put(dropRepair(item, r.id)), undo: (before) => put(before), text: t('"{name}" deleted.', { name: r.text }), name: r.text });
  }
</script>

<div class="rp" data-repairs={item.id}>
  <p class="rp-hint">{t('Before you sort it out: what would make it wearable again? Tick a job when it is done.')}</p>
  {#if list.length}
    <ul class="rp-list">
      {#each list as r (r.id)}
        <li class:done={!!r.done} data-repair={r.text}>
          <input type="checkbox" checked={!!r.done} onchange={() => tick(r)} aria-label={t('Fixed: {what}', { what: r.text })} data-repair-tick />
          <button type="button" class="rp-name" onclick={() => (renaming = r)} aria-label={t('Rename {name}', { name: r.text })}>{r.text}</button>
          <button type="button" class="rp-x" onclick={() => remove(r)} aria-label={t('Delete {name}', { name: r.text })} data-repair-del><Trash2 size={16} aria-hidden="true" /></button>
        </li>
      {/each}
    </ul>
  {/if}
  <div class="rp-chips">
    {#each REPAIR_SUGGEST as s (s)}<button type="button" class="chip" onclick={() => add(t(s))} data-repair-suggest>{t(s)}</button>{/each}
  </div>
  <form class="rp-add" onsubmit={(e) => (e.preventDefault(), add(text))}>
    <input class="inp" maxlength="80" bind:value={text} placeholder={t('Own repair job')} aria-label={t('Own repair job')} data-repair-text />
    <button type="submit" class="btn sm" disabled={!text.trim()}><Plus size={16} aria-hidden="true" />{t('Add')}</button>
  </form>
</div>

{#if renaming}
  {@const r = renaming}
  <RenameSheet kicker={nameOf(item)} title={t('Rename repair job')} value={r.text} empty={t('Without a text the job stays as it is.')} onsave={async (n) => ((await put(renameRepair(item, r.id, n))) ? undefined : false)} onclose={() => (renaming = null)} />
{/if}

<style>
  .rp {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .rp-hint {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .rp-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .rp-list li {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
  }
  .rp-list input {
    width: 22px;
    height: 22px;
    accent-color: var(--accent);
  }
  .rp-name {
    flex: 1;
    min-width: 0;
    min-height: 44px;
    text-align: left;
    background: none;
    border: 0;
    color: var(--ink);
    font: inherit;
    overflow-wrap: break-word;
  }
  .done .rp-name {
    text-decoration: line-through;
    color: var(--ink-2);
  }
  .rp-x {
    min-width: 44px;
    min-height: 44px;
    background: none;
    border: 0;
    color: var(--ink-2);
  }
  .rp-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .rp-add {
    display: flex;
    gap: 8px;
  }
  .rp-add .inp {
    flex: 1;
    min-width: 0;
  }
</style>
