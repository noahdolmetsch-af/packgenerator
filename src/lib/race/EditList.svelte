<script>
  /**
   * Paket U «Rennen»: a list you own (race rules, drop bags, my why, bad-weather plans, paperwork …).
   * Add at the end, tap a row to change it, delete with the app's question and Undo, sort with the arrows
   * and by dragging («Pfeile und Ziehen», rule 14). Rows: [{ id, text, … }]; the caller stores the new
   * list in onchange(list). row: an optional snippet after the text (a tick, a date …). fields: an optional
   * snippet for more fields in the change window (gets the draft).
   */
  import { Plus, Pencil } from '@lucide/svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import { sortable } from '../ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import RaceSheet from './RaceSheet.svelte';
  import { newId } from './race.js';
  import { t } from '../i18n.svelte.js';

  let { rows = [], onchange, label = '', addLabel = '', placeholder = '', name = '', row, fields, sub, testid = 'list', blank = {} } = $props();
  let text = $state('');
  let edit = $state(null);
  const shown = (r) => r.text ?? '';

  function add(e) {
    e?.preventDefault();
    const tx = text.trim();
    if (!tx) return;
    onchange([...rows, { id: newId('x'), ...blank, text: tx }]);
    text = '';
  }
  function move(from, to) {
    if (to < 0 || to >= rows.length || from === to) return;
    const next = [...rows];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    onchange(next);
  }
  function save() {
    const tx = String(edit.text ?? '').trim();
    if (!tx) return t('Please write something.');
    onchange(rows.map((r) => (r.id === edit.id ? { ...edit, text: tx } : r)));
  }
  async function remove() {
    const r = rows.find((x) => x.id === edit.id);
    const answer = await askDelete({ title: t('Delete «{name}»?', { name: shown(r) }) });
    if (answer !== 'delete') return false;
    const before = rows;
    await deleteWithUndo({ run: () => onchange(rows.filter((x) => x.id !== r.id)), undo: () => onchange(before), text: t('«{name}» deleted.', { name: shown(r) }), name: shown(r) });
  }
</script>

{#if rows.length}
  <ul class="rc-list" use:sortable={{ onmove: (from, to) => move(from, to) }} data-race-list={testid}>
    {#each rows as r, i (r.id)}
      <li class="rc-row" data-sort-id={r.id}>
        <SortGrip name={shown(r)} onstep={(dir) => move(i, i + dir)} />
        <button type="button" class="rc-row-main" onclick={() => (edit = { ...r })}>
          <b>{shown(r)}</b>
          {#if sub}{@render sub(r)}{/if}
        </button>
        {#if row}{@render row(r)}{/if}
        <SortArrows name={shown(r)} {i} n={rows.length} onstep={(dir) => move(i, i + dir)} />
        <button type="button" class="rc-icon" aria-label={t('Change {name}', { name: shown(r) })} onclick={() => (edit = { ...r })}><Pencil size={18} aria-hidden="true" /></button>
      </li>
    {/each}
  </ul>
{/if}
<form class="rc-inline" onsubmit={add}>
  <input class="inp" bind:value={text} {placeholder} aria-label={label || addLabel} maxlength="300" data-race-add={testid} />
  <button type="submit" class="btn" disabled={!text.trim()}><Plus size={16} aria-hidden="true" />{addLabel || t('Add')}</button>
</form>

{#if edit}
  <RaceSheet title={name ? t('Change {name}', { name }) : t('Change')} onsave={save} ondelete={remove} onclose={() => (edit = null)}>
    <label class="rc-lab">{label || t('Text')}<input class="inp" bind:value={edit.text} maxlength="300" data-race-edit /></label>
    {#if fields}{@render fields(edit)}{/if}
  </RaceSheet>
{/if}
