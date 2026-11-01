<script>
  /**
   * «Vorlagen auswählen» (Noah 27.10.2026 19:18: «ca. 20 Vorlagen, von denen ich im Frontend auswählen kann»):
   * all templates with fields, in five groups. A tap on «Use» chooses one; chosen ones show in Notizen and in the
   * input bar where they fit. Each can be renamed, its fields changed (rename, kind, delete, add, sort with arrows
   * and drag), deleted (the app's question, then Undo); own templates can be added; «Back to the Standard».
   * Saved at once in settings 'noteForms'. onclose().
   */
  import { liveQuery } from 'dexie';
  import { X, Pencil, Trash2, Plus, RotateCcw, Check } from '@lucide/svelte';
  import { db } from '../db.js';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { sortable } from '../ui/sortable.js';
  import { backClose } from '../ui/backclose.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { t } from '../i18n.svelte.js';
  import { FORMS_KEY, FORM_GROUPS, FIELD_TYPES, TYPE_NAME, formsOf, onOf, setOn, changeForm, renameForm, removeForm, addForm, moveInGroup, backToStandard, formName, fieldLabel, optionName, addField, renameField, removeField, moveField, setOptions } from './forms.js';

  let { onclose } = $props();
  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  const q = liveQuery(async () => (await db.settings.get(FORMS_KEY))?.value ?? null);
  const stored = $derived($q ?? null);
  const forms = $derived(formsOf(stored));
  const on = $derived(new Set(onOf(stored)));
  const save = (value) => db.settings.put({ key: FORMS_KEY, value: JSON.parse(JSON.stringify(value)) });
  const nm = (x) => formName(x, t);

  let editKey = $state(null);
  const editing = $derived(forms.find((x) => x.key === editKey) ?? null);
  let newName = $state('');
  let newField = $state({ label: '', type: 'long' });

  async function toggle(x) {
    const yes = !on.has(x.key);
    await save(setOn(stored, x.key, yes));
  }
  async function remove(x) {
    const name = nm(x);
    if ((await askDelete({ title: t('Delete «{name}»?', { name }), text: t('Only the template goes; notes you wrote with it stay. You can undo this for a few seconds.') })) !== 'delete') return;
    const before = $state.snapshot(stored);
    await deleteWithUndo({ run: () => save(removeForm(stored, x.key, t)), undo: () => (before ? save(before) : db.settings.delete(FORMS_KEY)), text: t('«{name}» deleted.', { name }), name });
    if (editKey === x.key) editKey = null;
  }
  async function create() {
    const r = addForm(stored, newName, t);
    if (!r.key) return;
    await save(r.stored);
    newName = '';
    editKey = r.key;
    offerDone(t('Template «{name}» added.', { name: r.stored.list.at(-1).name }));
  }
  async function toStandard() {
    const before = $state.snapshot(stored);
    await save(backToStandard());
    editKey = null;
    offerDone(t('The Standard templates are back.'), () => (before ? save(before) : db.settings.delete(FORMS_KEY)));
  }
  const change = (fn) => save(changeForm(stored, editKey, fn, t));
  function addOne() {
    if (!newField.label.trim()) return;
    change((x) => addField(x, newField.label, newField.type));
    newField = { label: '', type: 'long' };
  }
  async function dropField(y) {
    const before = $state.snapshot(stored);
    const name = fieldLabel(y, t);
    await deleteWithUndo({ run: () => change((x) => removeField(x, y.key)), undo: () => save(before), text: t('«{name}» deleted.', { name }), name });
  }
</script>

<dialog class="sheet from-below fg" bind:this={dialog} use:backClose={() => (editKey ? (editKey = null) : dialog.close())} onclose={() => onclose?.()} aria-labelledby="fg-h" onkeydown={(e) => e.key === 'Enter' && e.target.tagName === 'INPUT' && e.preventDefault()} data-form-gallery>
  <div class="fg-head">
    <div>
      <h2 id="fg-h">{editing ? nm(editing) : t('Choose templates')}</h2>
      <p class="fg-sub">{editing ? t('Change the name and the fields. Each change is saved at once.') : t('{n} templates with fields. Tap «Use» on the ones you want: they show in Notes and where they fit.', { n: forms.length })}</p>
    </div>
    <button type="button" class="fg-x" aria-label={editing ? t('Back') : t('Close')} onclick={() => (editing ? (editKey = null) : dialog.close())}><X size={20} aria-hidden="true" /></button>
  </div>

  {#if editing}
    <div class="fg-edit" data-form-edit={editing.key}>
      <label class="fg-lab">{t('Name')}<input class="inp" maxlength="40" value={nm(editing)} onchange={(e) => save(renameForm(stored, editing.key, e.currentTarget.value, t))} data-form-name /></label>
      <span class="fg-lab">{t('Fields')}</span>
      <ul class="fg-list" use:sortable={{ onmove: (from, to) => change((x) => moveField(x, from, to)) }}>
        {#each editing.fields as y, i (y.key)}
          <li data-sort-id={y.key} data-form-field-row={y.key}>
            <SortGrip name={fieldLabel(y, t)} onstep={(d) => change((x) => moveField(x, i, i + d))} />
            <span class="fg-grow">
              <input class="inp" maxlength="60" value={fieldLabel(y, t)} aria-label={t('Name of the field')} onchange={(e) => change((x) => renameField(x, y.key, e.currentTarget.value))} />
              <small>{t(TYPE_NAME[y.type])}</small>
              {#if y.type === 'choice'}<input class="inp" value={(y.options ?? []).map((o) => optionName(y, o, t)).join(', ')} aria-label={t('Choices, separated by commas')} placeholder={t('Choices, separated by commas')} onchange={(e) => change((x) => setOptions(x, y.key, e.currentTarget.value))} />{/if}
            </span>
            <SortArrows name={fieldLabel(y, t)} {i} n={editing.fields.length} onstep={(d) => change((x) => moveField(x, i, i + d))} />
            <button type="button" class="fg-x" aria-label={t('Delete «{name}»', { name: fieldLabel(y, t) })} onclick={() => dropField(y)}><Trash2 size={16} aria-hidden="true" /></button>
          </li>
        {/each}
      </ul>
      <div class="fg-add">
        <input class="inp" maxlength="60" bind:value={newField.label} placeholder={t('New field, e.g. Weather')} aria-label={t('Name of the new field')} onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addOne())} data-form-newfield />
        <select class="inp" bind:value={newField.type} aria-label={t('Kind of field')}>{#each FIELD_TYPES as ty (ty)}<option value={ty}>{t(TYPE_NAME[ty])}</option>{/each}</select>
        <button type="button" class="btn sm" disabled={!newField.label.trim()} onclick={addOne} data-form-addfield><Plus size={16} aria-hidden="true" />{t('Add')}</button>
      </div>
      <div class="fg-row"><button type="button" class="btn hi sm" onclick={() => (editKey = null)}>{t('Done')}</button></div>
    </div>
  {:else}
    {#each FORM_GROUPS as g (g.key)}
      {@const list = forms.filter((x) => x.group === g.key)}
      {#if list.length}
        <h3 class="fg-g">{t(g.name)}</h3>
        <ul class="fg-list" use:sortable={{ onmove: (from, to) => save(moveInGroup(stored, g.key, from, to, t)) }}>
          {#each list as x, i (x.key)}
            <li data-sort-id={x.key} data-form-row={x.key}>
              <SortGrip name={nm(x)} onstep={(d) => save(moveInGroup(stored, g.key, i, i + d, t))} />
              <span class="fg-grow"><b>{nm(x)}</b><small>{x.fields.map((y) => fieldLabel(y, t)).join(' · ')}</small></span>
              <button type="button" class="fg-use" aria-pressed={on.has(x.key)} onclick={() => toggle(x)} data-form-use={x.key}>{#if on.has(x.key)}<Check size={16} aria-hidden="true" />{t('In use')}{:else}<Plus size={16} aria-hidden="true" />{t('Use|form')}{/if}</button>
              <SortArrows name={nm(x)} {i} n={list.length} onstep={(d) => save(moveInGroup(stored, g.key, i, i + d, t))} />
              <button type="button" class="fg-x" aria-label={t('Change «{name}»', { name: nm(x) })} onclick={() => (editKey = x.key)} data-form-change={x.key}><Pencil size={16} aria-hidden="true" /></button>
              <button type="button" class="fg-x" aria-label={t('Delete «{name}»', { name: nm(x) })} onclick={() => remove(x)}><Trash2 size={16} aria-hidden="true" /></button>
            </li>
          {/each}
        </ul>
      {/if}
    {/each}
    <div class="fg-add">
      <input class="inp" maxlength="40" bind:value={newName} placeholder={t('Own template, e.g. Packing for the gym')} aria-label={t('Name of the new template')} onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), create())} data-form-newname />
      <button type="button" class="btn sm" disabled={!newName.trim()} onclick={create} data-form-new><Plus size={16} aria-hidden="true" />{t('New template')}</button>
    </div>
    <div class="fg-row"><button type="button" class="btn sm" onclick={toStandard}><RotateCcw size={16} aria-hidden="true" />{t('Back to the Standard')}</button></div>
  {/if}
</dialog>

<style>
  .fg {
    width: min(640px, 100%);
  }
  .fg-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
  }
  h2 {
    margin: 0;
  }
  .fg-sub {
    margin: 4px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .fg-g {
    margin: 16px 0 4px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }
  .fg-x {
    display: grid;
    place-items: center;
    flex: none;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .fg-x:hover {
    background: var(--tint);
  }
  .fg-list {
    display: flex;
    flex-direction: column;
    margin: 0 0 8px;
    padding: 0;
    list-style: none;
  }
  .fg-list li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 6px;
    padding: 6px 2px;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  .fg-grow {
    display: flex;
    flex: 1 1 12em;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .fg-grow small {
    color: var(--ink-3);
  }
  .fg-use {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.25 var(--font-body);
    cursor: pointer;
  }
  .fg-use[aria-pressed='true'] {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--paper);
  }
  .fg-edit {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .fg-lab {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-weight: 600;
  }
  .fg-add {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }
  .fg-add .inp {
    flex: 1 1 10em;
    min-width: 0;
  }
  .fg-add select.inp {
    flex: 0 1 auto;
  }
  .fg-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }
</style>
