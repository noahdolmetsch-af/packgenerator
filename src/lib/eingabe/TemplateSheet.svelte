<script>
  /**
   * «Eingaben überall» (Noah «4b»: own templates per page): the templates of one place. Add (name and text),
   * change name and text, sort (arrows and drag), delete (the app's question, then Undo), and «Back to the
   * Standard». Saved at once in settings 'inputTemplates' (inputsdb.js).
   * place: inputs.js PLACES key; list: the templates as shown now (templatesFor); onclose().
   */
  import { X, Pencil, Trash2, Plus, RotateCcw } from '@lucide/svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { sortable } from '../ui/sortable.js';
  import { backClose } from '../ui/backclose.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { t } from '../i18n.svelte.js';
  import { PLACES, STD_TEMPLATES, tplName, tplText, addTemplate, changeTemplate, removeTemplate, moveTemplate } from './inputs.js';
  import { saveTemplates } from './inputsdb.js';

  let { place, list = [], onclose } = $props();
  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  const save = (next) => saveTemplates(place, $state.snapshot(next));
  const nm = (x) => tplName(x, t);

  let editing = $state(null); // { key | null, name, text }
  function startNew() {
    editing = { key: null, name: '', text: '' };
  }
  function startEdit(x) {
    editing = { key: x.key, name: nm(x), text: tplText(x, t) };
  }
  async function keep(e) {
    e?.preventDefault();
    const name = editing.name.trim();
    if (!name || !editing.text.trim()) return;
    if (editing.key) {
      await save(changeTemplate(list, editing.key, { name, text: editing.text }, t));
      offerDone(t('«{name}» saved.', { name }));
    } else {
      await save(addTemplate(list, name, editing.text));
      offerDone(t('Template «{name}» added.', { name }));
    }
    editing = null;
  }
  async function remove(x) {
    const name = nm(x);
    if ((await askDelete({ title: t('Delete «{name}»?', { name }), text: t('Only the template goes; what you wrote with it stays. You can undo this for a few seconds.') })) !== 'delete') return;
    const before = $state.snapshot(list);
    await deleteWithUndo({ run: () => save(removeTemplate(list, x.key)), undo: () => save(before), text: t('«{name}» deleted.', { name }), name });
  }
  async function toStandard() {
    const before = $state.snapshot(list);
    await save((STD_TEMPLATES[place] ?? []).map((x) => ({ ...x })));
    offerDone(t('The Standard templates are back.'), () => save(before));
  }
</script>

<dialog class="sheet from-below tps" bind:this={dialog} use:backClose={() => dialog.close()} onclose={() => onclose?.()} aria-labelledby="tps-h" data-in-templates>
  <!-- no <form>: the sheet opens inside the page's own form (the input bar sits in it) -->
  <div class="tps-head">
    <div>
      <h2 id="tps-h">{t('Templates')}</h2>
      <p class="tps-sub">{t('For «{place}». A tap on a template puts its text under yours. Only here, the other pages have their own.', { place: t(PLACES[place]?.name ?? place) })}</p>
    </div>
    <button type="button" class="tps-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  {#if editing}
    <div class="tps-form" data-in-template-form>
      <label class="tps-lab">{t('Name')}<input class="inp" maxlength="40" bind:value={editing.name} placeholder={t('e.g. Gratitude')} onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), keep())} data-in-template-name /></label>
      <label class="tps-lab">{t('Text')}<textarea class="inp" rows="5" bind:value={editing.text} placeholder={t('e.g. What am I grateful for today?')} data-in-template-text></textarea></label>
      <div class="tps-row">
        <button type="button" class="btn hi sm" disabled={!editing.name.trim() || !editing.text.trim()} onclick={keep} data-in-template-save>{t('Save')}</button>
        <button type="button" class="btn sm" onclick={() => (editing = null)}>{t('Cancel')}</button>
      </div>
    </div>
  {:else}
    {#if list.length}
      <ul class="tps-list" use:sortable={{ onmove: (from, to) => save(moveTemplate(list, from, to)) }}>
        {#each list as x, i (x.key)}
          <li data-sort-id={x.key} data-in-template-row={x.key}>
            <SortGrip name={nm(x)} onstep={(d) => save(moveTemplate(list, i, i + d))} />
            <span class="tps-grow"><b>{nm(x)}</b><small>{tplText(x, t).split('\n')[0]}</small></span>
            <SortArrows name={nm(x)} {i} n={list.length} onstep={(d) => save(moveTemplate(list, i, i + d))} />
            <button type="button" class="tps-x" aria-label={t('Change «{name}»', { name: nm(x) })} onclick={() => startEdit(x)}><Pencil size={16} aria-hidden="true" /></button>
            <button type="button" class="tps-x" aria-label={t('Delete «{name}»', { name: nm(x) })} onclick={() => remove(x)}><Trash2 size={16} aria-hidden="true" /></button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="tps-sub">{t('No templates here yet.')}</p>
    {/if}
    <div class="tps-row">
      <button type="button" class="btn sm" onclick={startNew} data-in-template-new><Plus size={16} aria-hidden="true" />{t('New template')}</button>
      {#if (STD_TEMPLATES[place] ?? []).length}<button type="button" class="btn sm" onclick={toStandard}><RotateCcw size={16} aria-hidden="true" />{t('Back to the Standard')}</button>{/if}
    </div>
  {/if}
</dialog>

<style>
  .tps {
    width: min(560px, 100%);
  }
  .tps-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }
  h2 {
    margin: 0;
  }
  .tps-sub {
    margin: 4px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .tps-x {
    display: grid;
    place-items: center;
    flex: none;
    width: 40px;
    height: 40px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .tps-x:hover {
    background: var(--tint);
  }
  .tps-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 0 0 12px;
    padding: 0;
    list-style: none;
  }
  .tps-list li {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 4px;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  .tps-grow {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }
  .tps-grow small {
    overflow: hidden;
    color: var(--ink-3);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tps-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .tps-lab {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-weight: 600;
  }
  .tps-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
