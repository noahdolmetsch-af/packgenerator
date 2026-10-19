<script>
  /**
   * Paket O «Sportarten»: a short list of lines for one block: «Fürs nächste Mal», own notes, a checklist
   * (own or the protection check). Add, tick, change the words, delete (with Undo), order with arrows and drag.
   * kind: 'note' | 'check'; items: this block's records; preset: English keys offered while the list is empty.
   */
  import { Plus, Check, Pencil, Trash2 } from '@lucide/svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { sortable } from '../ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { putItem, patchItem, dropItems, restoreItems } from '../sportsdb.js';
  import { moveId } from '../sportsbase.js';
  import { t, tn } from '../i18n.svelte.js';

  let { sport, block, kind = 'note', items = [], preset = [], placeholder = '', empty = '' } = $props();

  const list = $derived([...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.at).localeCompare(String(b.at))));
  const done = $derived(list.filter((x) => x.done).length);
  let text = $state('');
  let edit = $state(null); // { id, text }

  async function add(e) {
    e.preventDefault();
    const s = text.trim();
    if (!s) return;
    await putItem({ sport, kind, block, text: s, done: false, order: (list.at(-1)?.order ?? 0) + 1 });
    text = '';
  }
  const tick = (x) => patchItem(x.id, { done: !x.done });
  async function save(e) {
    e.preventDefault();
    const s = edit.text.trim();
    if (s) await patchItem(edit.id, { text: s });
    edit = null;
  }
  async function del(x) {
    if ((await askDelete({ title: t('Delete «{name}»?', { name: x.text }), text: t('Only this line goes.') })) !== 'delete') return;
    await deleteWithUndo({ run: () => dropItems([x.id]), undo: restoreItems, text: t('"{name}" deleted.', { name: x.text }), name: x.text });
  }
  async function reorder(ids) {
    await Promise.all(ids.map((id, i) => patchItem(id, { order: i + 1 })));
  }
  const step = (x, dir) => reorder(moveId(list.map((y) => y.id), x.id, list.indexOf(x) + dir));
  const dragged = (from, to) => reorder(moveId(list.map((y) => y.id), list[from].id, to));
  async function takePreset() {
    let n = 0;
    for (const p of preset) await putItem({ sport, kind, block, text: t(p), done: false, order: ++n });
  }
  const setAll = (v) => Promise.all(list.map((x) => (x.done === v ? null : patchItem(x.id, { done: v }))));
</script>

{#if kind === 'check' && list.length}
  <p class="small num" data-check-count>{t('{n} of {m} ticked', { n: done, m: list.length })}</p>
{/if}
{#if list.length}
  <ul class="ilist" use:sortable={{ onmove: dragged }}>
    {#each list as x, i (x.id)}
      <li data-sort-id={x.id} data-line={x.text}>
        <SortGrip name={x.text} onstep={(d) => step(x, d)} />
        {#if edit?.id === x.id}
          <form class="add" onsubmit={save}>
            <label class="vh" for="tl-{x.id}">{t('Change the words')}</label>
            <input id="tl-{x.id}" bind:value={edit.text} />
            <button type="submit" class="btn hi">{t('Save')}</button>
            <button type="button" class="btn" onclick={() => (edit = null)}>{t('Cancel')}</button>
          </form>
        {:else}
          <button type="button" class="ent" class:done={x.done} role="checkbox" aria-checked={!!x.done} onclick={() => tick(x)}>
            <span class="bx" class:y={x.done}>{#if x.done}<Check size={16} aria-hidden="true" />{/if}</span>
            <b>{x.text}</b>
          </button>
          <button type="button" class="ibtn" aria-label={t('Change «{name}»', { name: x.text })} onclick={() => (edit = { id: x.id, text: x.text })}><Pencil size={16} aria-hidden="true" /></button>
          <button type="button" class="ibtn" aria-label={t('Delete «{name}»', { name: x.text })} onclick={() => del(x)}><Trash2 size={16} aria-hidden="true" /></button>
        {/if}
        <SortArrows name={x.text} {i} n={list.length} onstep={(d) => step(x, d)} />
      </li>
    {/each}
  </ul>
{:else}
  <p class="none">{empty}</p>
  {#if preset.length}
    <button type="button" class="btn" onclick={takePreset} data-take-preset><Plus size={16} aria-hidden="true" />{tn(preset.length, 'Take the suggestion ({n} line)', 'Take the suggestion ({n} lines)')}</button>
    <p class="small">{preset.map((p) => t(p)).join(' · ')}</p>
  {/if}
{/if}
<form class="add" onsubmit={add}>
  <label class="vh" for="tl-new-{block}">{t('New line')}</label>
  <input id="tl-new-{block}" bind:value={text} {placeholder} data-new-line={block} />
  <button type="submit" class="btn hi" disabled={!text.trim()}><Plus size={16} aria-hidden="true" />{t('Add')}</button>
</form>
{#if kind === 'check' && list.length}
  <div class="row">
    <button type="button" class="btn" onclick={() => setAll(true)} disabled={done === list.length} data-tick-all>{t('Tick all')}</button>
    <button type="button" class="btn" onclick={() => setAll(false)} disabled={!done} data-reset>{t('Start again')}</button>
  </div>
{:else if kind === 'note' && done}
  <p class="small">{t('Ticked lines are done; delete them when you no longer need them.')}</p>
{/if}
