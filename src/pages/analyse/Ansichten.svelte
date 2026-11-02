<script>
  /**
   * «Ansichten» (Noah 27.10.2026 idea «gespeicherte Ansichten», mockups M3/M4), in the choice card of
   * Analyse: one tap brings back a saved view (values, period, filter and look of «Eigenes Diagramm», sources
   * and period of the tiles); «+ Neue Ansicht» keeps what you see now under a name; «Bearbeiten» renames,
   * moves (arrows and drag) and deletes (with Undo). The two starters are only suggestions.
   * views: the list (cleanViews); now(): { diagram, tiles } as shown; onapply(view).
   */
  import { Plus, Pencil, Trash2, Check } from '@lucide/svelte';
  import SortArrows from '../../lib/ui/SortArrows.svelte';
  import SortGrip from '../../lib/ui/SortGrip.svelte';
  import { sortable } from '../../lib/ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../../lib/ui/ask.js';
  import { db } from '../../lib/db.js';
  import { VIEWS_KEY, MAX_VIEWS, NAME_MAX, makeView, renameView, moveView, sameAs } from '../../lib/analyse/views.js';
  import { t } from '../../lib/i18n.svelte.js';

  let { views = [], now, onapply } = $props();

  let adding = $state(false);
  let editing = $state(false);
  let name = $state('');
  let renaming = $state(null); // { id, name }
  const shown = $derived(now?.() ?? { diagram: {}, tiles: {} });
  const nameOf = (v) => v.name ?? t(v.starter);
  const save = (list) => db.settings.put({ key: VIEWS_KEY, value: JSON.parse(JSON.stringify(list)) });

  async function add(e) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    const cur = now();
    await save([...views, makeView(`v${Date.now().toString(36)}`, n, cur.diagram, cur.tiles)].slice(0, MAX_VIEWS));
    name = '';
    adding = false;
  }
  async function rename(e) {
    e.preventDefault();
    if (!renaming?.name.trim()) return;
    await save(renameView(views, renaming.id, renaming.name));
    renaming = null;
  }
  const move = (from, to) => save(moveView(views, from, to));
  async function remove(v) {
    const n = nameOf(v);
    const ok = await askDelete({ title: t('Delete "{name}"?|views', { name: n }), text: t('Only the saved view goes; your data stays.|views') });
    if (ok !== 'delete') return;
    const before = views;
    await deleteWithUndo({ run: () => save(views.filter((x) => x.id !== v.id)).then(() => before), undo: (list) => save(list), text: t('"{name}" deleted.|views', { name: n }), name: n });
  }
</script>

<div class="pr views" data-views>
  <span class="pl" id="an-views">{t('Views|views')}</span>
  <div class="chips" role="group" aria-labelledby="an-views">
    {#each views as v (v.id)}
      <button type="button" class="chip" class:on={sameAs(v, shown.diagram, shown.tiles)} aria-pressed={sameAs(v, shown.diagram, shown.tiles)} data-view={v.id} onclick={() => onapply?.(v)}>{nameOf(v)}</button>
    {/each}
    {#if views.length < MAX_VIEWS}
      <button type="button" class="chip" aria-expanded={adding} data-view-add onclick={() => ((adding = !adding), (editing = false))}><Plus size={14} aria-hidden="true" />{t('New view|views')}</button>
    {/if}
    {#if views.length}
      <button type="button" class="chip" class:on={editing} aria-pressed={editing} data-view-edit onclick={() => ((editing = !editing), (adding = false), (renaming = null))}><Pencil size={14} aria-hidden="true" />{t('Edit|views')}</button>
    {/if}
  </div>
</div>

{#if adding}
  <form class="vf" onsubmit={add} data-view-form>
    <label>
      <span>{t('Name of the view|views')}</span>
      <input class="inp" bind:value={name} maxlength={NAME_MAX} placeholder={t('e.g. Winter sports|views')} />
    </label>
    <button type="submit" class="btn hi" disabled={!name.trim()}>{t('Save what I see now|views')}</button>
    <p class="hint">{t('Keeps the values, period, filter and look of the diagram, and the sources and period of the tiles.|views')}</p>
  </form>
{/if}

{#if editing && views.length}
  <ul class="sortlist vl" use:sortable={{ onmove: move }} data-view-list>
    {#each views as v, i (v.id)}
      <li data-sort-id={v.id}>
        <SortGrip name={nameOf(v)} onstep={(d) => move(i, i + d)} />
        {#if renaming?.id === v.id}
          <form class="rn" onsubmit={rename}>
            <input class="inp" bind:value={renaming.name} maxlength={NAME_MAX} aria-label={t('New name|views')} data-view-name />
            <button type="submit" class="ib" aria-label={t('Save|views')}><Check size={16} aria-hidden="true" /></button>
          </form>
        {:else}
          <span class="nm">{nameOf(v)}</span>
          <button type="button" class="ib" aria-label={t('Rename {name}|views', { name: nameOf(v) })} data-view-rename={v.id} onclick={() => (renaming = { id: v.id, name: nameOf(v) })}><Pencil size={16} aria-hidden="true" /></button>
          <button type="button" class="ib" aria-label={t('Delete {name}|views', { name: nameOf(v) })} data-view-del={v.id} onclick={() => remove(v)}><Trash2 size={16} aria-hidden="true" /></button>
        {/if}
        <SortArrows name={nameOf(v)} {i} n={views.length} onstep={(d) => move(i, i + d)} />
      </li>
    {/each}
  </ul>
{/if}

<style>
  .pr {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .pl {
    color: var(--ink-3);
    font-size: var(--fs-label);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 36px;
    padding: 4px 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink-2);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .chip.on {
    border-color: var(--line-strong, var(--line));
    background: var(--paper-2);
    color: var(--ink);
    font-weight: 600;
  }
  .vf {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px 12px;
  }
  .vf label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    flex: 1 1 220px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .vf .hint {
    flex-basis: 100%;
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .vl {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .vl li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 6px;
    border-radius: 10px;
    background: var(--paper-2);
  }
  .vl .nm {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .rn {
    flex: 1;
    display: flex;
    gap: 6px;
    min-width: 0;
  }
  .rn .inp {
    flex: 1;
    min-width: 0;
  }
  .ib {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
</style>
