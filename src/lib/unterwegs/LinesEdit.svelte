<script>
  /**
   * Paket 4: an own list of lines (Haus-Check, Wohnungs-Hüter-Liste). Each line can be ticked (when
   * ontoggle is given), renamed, deleted with Undo, added, and moved with the arrows or by dragging
   * (rules 12, 17, 18). The parent keeps the data; this only draws and reports.
   * items: [{ id }], label(x): the line as shown, done: Set of ticked ids (optional).
   */
  import { t } from '../i18n.svelte.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { sortable } from '../ui/sortable.js';
  import SortArrows from '../ui/SortArrows.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import { Pencil, Trash2, Check, Plus } from '@lucide/svelte';

  let { items = [], label = (x) => x.id, done = null, ontoggle = null, onadd, onrename, ondrop, onundo, onmove, addLabel = 'Add a line', name = 'list' } = $props();

  let editMode = $state(false);
  let editing = $state(null);
  let editText = $state('');
  let adding = $state('');
  async function drop(x) {
    if ((await askDelete({ title: t('Delete this line?'), text: t('You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    await deleteWithUndo({ run: () => ondrop(x.id), undo: onundo, text: t('"{name}" deleted.', { name: label(x) }), name: label(x) });
  }
  async function add(e) {
    e.preventDefault();
    if (!adding.trim()) return;
    await onadd(adding);
    adding = '';
  }
  async function rename(e, id) {
    e.preventDefault();
    await onrename(id, editText);
    editing = null;
  }
</script>

<div class="le" data-lines={name}>
  {#if editMode}
    <ol class="rows" use:sortable={{ onmove: (from, to) => onmove(from, to) }}>
      {#each items as x, i (x.id)}
        <li data-sort-id={x.id}>
          <SortGrip name={label(x)} onstep={(dir) => onmove(i, i + dir)} />
          {#if editing === x.id}
            <form class="grow ef" onsubmit={(e) => rename(e, x.id)}>
              <input class="inp grow" bind:value={editText} aria-label={t('Name')} />
              <button type="submit" class="btn sm"><Check size={16} aria-hidden="true" />{t('Save')}</button>
            </form>
          {:else}
            <span class="grow txt">{label(x)}</span>
            <button type="button" class="tp-icon-btn" aria-label={t('Rename {name}', { name: label(x) })} onclick={() => ((editing = x.id), (editText = label(x)))}><Pencil size={16} aria-hidden="true" /></button>
            <button type="button" class="tp-icon-btn" aria-label={t('Delete {name}', { name: label(x) })} onclick={() => drop(x)}><Trash2 size={16} aria-hidden="true" /></button>
          {/if}
          <SortArrows name={label(x)} {i} n={items.length} onstep={(dir) => onmove(i, i + dir)} />
        </li>
      {/each}
    </ol>
    <form class="addf" onsubmit={add}>
      <input class="inp grow" bind:value={adding} placeholder={t(addLabel)} aria-label={t(addLabel)} data-lines-new />
      <button type="submit" class="btn" disabled={!adding.trim()} data-lines-add><Plus size={16} aria-hidden="true" />{t('Add')}</button>
    </form>
    <button type="button" class="btn ink" onclick={() => ((editMode = false), (editing = null))} data-lines-done>{t('Done')}</button>
  {:else}
    <ul class="rows">
      {#each items as x (x.id)}
        <li>
          {#if ontoggle}
            <label class="tick"><input type="checkbox" checked={done?.has(x.id)} onchange={() => ontoggle(x.id)} /> <span>{label(x)}</span></label>
          {:else}
            <span class="txt">{label(x)}</span>
          {/if}
        </li>
      {/each}
    </ul>
    {#if !items.length}<p class="tp-small tp-muted">{t('The list is empty. Add your own lines.')}</p>{/if}
    <button type="button" class="tp-link" onclick={() => (editMode = true)} data-lines-edit><Pencil size={14} aria-hidden="true" /> {t('Edit the list')}</button>
  {/if}
</div>

<style>
  .le {
    display: grid;
    gap: 8px;
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 2px;
  }
  .rows li {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    background: var(--paper);
  }
  .grow {
    flex: 1;
    min-width: 0;
  }
  .txt {
    overflow-wrap: break-word;
  }
  .ef,
  .addf {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .tick {
    display: flex;
    align-items: center;
    gap: 10px;
    overflow-wrap: break-word;
    min-width: 0;
  }
  .tick input {
    width: 22px;
    height: 22px;
    flex: none;
  }
</style>
